<?php
namespace App\Http\Controllers\API\Finanzas;

use App\Http\Controllers\Controller;
use App\Models\Factura;
use App\Models\DetalleFactura;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FacturaController extends Controller
{
    public function index(Request $request)
    {
        $query = Factura::with('deportista', 'usuario', 'detalles', 'pagos');

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('id_deportista')) {
            $query->where('id_deportista', $request->id_deportista);
        }

        if ($request->has('fecha_desde')) {
            $query->whereDate('fecha_emision', '>=', $request->fecha_desde);
        }

        if ($request->has('fecha_hasta')) {
            $query->whereDate('fecha_emision', '<=', $request->fecha_hasta);
        }
            // Filtrar por fechas solo si están presentes
    if ($request->filled('fecha_desde')) {
        $query->whereDate('fecha_emision', '>=', $request->fecha_desde);
    }
    
    if ($request->filled('fecha_hasta')) {
        $query->whereDate('fecha_emision', '<=', $request->fecha_hasta);
    }

        $facturas = $query->paginate(15);
        return response()->json($facturas);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_deportista' => 'required|exists:deportistas,id_deportista',
            'concepto' => 'required|string|max:200',
            'fecha_emision' => 'required|date',
            'fecha_vencimiento' => 'nullable|date|after:fecha_emision',
            'descuento' => 'nullable|numeric|min:0',
            'impuesto' => 'nullable|numeric|min:0',
            'metodo_pago' => 'nullable|in:efectivo,tarjeta,transferencia,cheque,otro',
            'observaciones' => 'nullable|string',
            
            // Detalles
            'detalles' => 'required|array|min:1',
            'detalles.*.concepto' => 'required|string|max:100',
            'detalles.*.descripcion' => 'nullable|string',
            'detalles.*.cantidad' => 'required|integer|min:1',
            'detalles.*.precio_unitario' => 'required|numeric|min:0',
            'detalles.*.descuento' => 'nullable|numeric|min:0'
        ]);

        DB::beginTransaction();
        try {
            // Generar número de factura
            $ultimaFactura = Factura::latest('id_factura')->first();
            $numeroFactura = 'FAC-' . str_pad(($ultimaFactura ? $ultimaFactura->id_factura + 1 : 1), 8, '0', STR_PAD_LEFT);

            // Crear factura
            $factura = Factura::create([
                'id_deportista' => $request->id_deportista,
                'usuario_id' => auth()->id(),
                'numero_factura' => $numeroFactura,
                'concepto' => $request->concepto,
                'fecha_emision' => $request->fecha_emision,
                'fecha_vencimiento' => $request->fecha_vencimiento,
                'descuento' => $request->descuento ?? 0,
                'impuesto' => $request->impuesto ?? 0,
                'subtotal' => 0,
                'total' => 0,
                'estado' => 'pendiente',
                'metodo_pago' => $request->metodo_pago,
                'observaciones' => $request->observaciones
            ]);

            // Crear detalles
            $subtotal = 0;
            foreach ($request->detalles as $detalle) {
                $cantidad = $detalle['cantidad'];
                $precioUnitario = $detalle['precio_unitario'];
                $descuentoDetalle = $detalle['descuento'] ?? 0;
                
                $subtotalDetalle = $cantidad * $precioUnitario;
                $montoDetalle = $subtotalDetalle - $descuentoDetalle;
                
                DetalleFactura::create([
                    'id_factura' => $factura->id_factura,
                    'concepto' => $detalle['concepto'],
                    'descripcion' => $detalle['descripcion'] ?? null,
                    'cantidad' => $cantidad,
                    'precio_unitario' => $precioUnitario,
                    'subtotal' => $subtotalDetalle,
                    'descuento' => $descuentoDetalle,
                    'monto' => $montoDetalle
                ]);

                $subtotal += $montoDetalle;
            }

            // Actualizar totales de factura
            $total = $subtotal - ($request->descuento ?? 0) + ($request->impuesto ?? 0);
            $factura->update([
                'subtotal' => $subtotal,
                'total' => $total
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Factura creada exitosamente',
                'data' => $factura->load('detalles')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al crear factura',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $factura = Factura::with('deportista', 'usuario', 'detalles', 'pagos')->findOrFail($id);
        
        $data = $factura->toArray();
        $data['saldo_pendiente'] = $factura->saldo_pendiente;
        $data['total_pagado'] = $factura->total_pagado;
        
        return response()->json($data);
    }

    public function update(Request $request, $id)
    {
        $factura = Factura::findOrFail($id);

        if ($factura->estado === 'pagada') {
            return response()->json([
                'message' => 'No se puede modificar una factura pagada'
            ], 400);
        }

        $request->validate([
            'fecha_vencimiento' => 'nullable|date',
            'estado' => 'sometimes|in:pendiente,pagada,vencida,cancelada',
            'observaciones' => 'nullable|string'
        ]);

        $factura->update($request->only(['fecha_vencimiento', 'estado', 'observaciones']));

        return response()->json([
            'message' => 'Factura actualizada exitosamente',
            'data' => $factura
        ]);
    }

    public function destroy($id)
    {
        $factura = Factura::findOrFail($id);

        if ($factura->estado === 'pagada') {
            return response()->json([
                'message' => 'No se puede eliminar una factura pagada'
            ], 400);
        }

        $factura->delete();

        return response()->json([
            'message' => 'Factura eliminada exitosamente'
        ]);
    }

    // Métodos adicionales
    public function registrarPago(Request $request, $id)
    {
        $request->validate([
            'monto' => 'required|numeric|min:0',
            'fecha_pago' => 'required|date',
            'metodo_pago' => 'required|in:efectivo,tarjeta,transferencia,cheque,otro',
            'referencia' => 'nullable|string|max:100',
            'comprobante' => 'nullable|file|max:5120',
            'observaciones' => 'nullable|string'
        ]);

        $factura = Factura::findOrFail($id);

        if ($factura->saldo_pendiente <= 0) {
            return response()->json([
                'message' => 'Esta factura ya está pagada completamente'
            ], 400);
        }

        if ($request->monto > $factura->saldo_pendiente) {
            return response()->json([
                'message' => 'El monto excede el saldo pendiente'
            ], 400);
        }

        $ultimoPago = \App\Models\Pago::latest('id_pago')->first();
        $numeroPago = 'PAG-' . str_pad(($ultimoPago ? $ultimoPago->id_pago + 1 : 1), 8, '0', STR_PAD_LEFT);

        $pagoData = [
            'id_factura' => $factura->id_factura,
            'numero_pago' => $numeroPago,
            'monto' => $request->monto,
            'fecha_pago' => $request->fecha_pago,
            'metodo_pago' => $request->metodo_pago,
            'referencia' => $request->referencia,
            'observaciones' => $request->observaciones,
            'estado' => 'verificado'
        ];

        if ($request->hasFile('comprobante')) {
            $pagoData['comprobante'] = $request->file('comprobante')->store('pagos/comprobantes', 'public');
        }

        $pago = $factura->pagos()->create($pagoData);

        // Actualizar estado de factura
        if ($factura->saldo_pendiente <= 0) {
            $factura->update(['estado' => 'pagada']);
        }

        return response()->json([
            'message' => 'Pago registrado exitosamente',
            'data' => $pago,
            'saldo_pendiente' => $factura->fresh()->saldo_pendiente
        ]);
    }

    public function reporteFacturacion(Request $request)
    {
        $request->validate([
            'fecha_desde' => 'required|date',
            'fecha_hasta' => 'required|date|after_or_equal:fecha_desde'
        ]);

        $estadisticas = Factura::whereBetween('fecha_emision', [$request->fecha_desde, $request->fecha_hasta])
            ->selectRaw('
                estado,
                COUNT(*) as cantidad,
                SUM(total) as total_monto
            ')
            ->groupBy('estado')
            ->get();

        return response()->json($estadisticas);
    }
}