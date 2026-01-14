<?php
namespace App\Http\Controllers\API\Finanzas;
use App\Http\Controllers\Controller;

use App\Models\Pago;
use Illuminate\Http\Request;

class PagoController extends Controller
{
    public function index(Request $request)
    {
        \Log::info('API Pagos - Index', [
            'user_id' => auth()->id(),
            'request_params' => $request->all()
        ]);
        
        
        // INCLUIR REGISTROS ELIMINADOS TEMPORALMENTE
        $query = Pago::withTrashed()->with('factura');
        
        \Log::info('Total pagos con trashed:', ['count' => $query->count()]);
        
        if ($request->has('estado') && $request->estado !== 'all') {
            $query->where('estado', $request->estado);
        }

        if ($request->has('id_factura') && $request->id_factura !== 'all') {
            $query->where('id_factura', $request->id_factura);
        }

        if ($request->has('metodo_pago') && $request->metodo_pago !== 'all') {
            $query->where('metodo_pago', $request->metodo_pago);
        }

        if ($request->has('search') && $request->search !== '') {
            $query->where(function($q) use ($request) {
                $q->where('numero_pago', 'like', '%' . $request->search . '%')
                  ->orWhere('referencia', 'like', '%' . $request->search . '%');
            });
        }

        $pagos = $query->orderBy('fecha_pago', 'desc')->paginate(15);
        
        \Log::info('Resultados paginados:', [
            'total' => $pagos->total(),
            'per_page' => $pagos->perPage(),
            'current_page' => $pagos->currentPage(),
            'data_count' => count($pagos->items())
        ]);
        
        return response()->json($pagos);
    }

    public function show($id)
    {
        $pago = Pago::withTrashed()->with('factura')->findOrFail($id);
        return response()->json($pago);
    }

    public function update(Request $request, $id)
    {
        $pago = Pago::withTrashed()->findOrFail($id);

        $request->validate([
            'estado' => 'sometimes|in:verificado,pendiente,rechazado',
            'observaciones' => 'nullable|string'
        ]);

        $pago->update($request->all());

        return response()->json([
            'message' => 'Pago actualizado exitosamente',
            'data' => $pago
        ]);
    }

    public function verificar($id)
    {
        $pago = Pago::withTrashed()->findOrFail($id);
        $pago->verificar();

        return response()->json([
            'message' => 'Pago verificado exitosamente',
            'data' => $pago->fresh()
        ]);
    }

    public function rechazar(Request $request, $id)
    {
        $request->validate([
            'observaciones' => 'required|string'
        ]);

        $pago = Pago::withTrashed()->findOrFail($id);
        $pago->update([
            'estado' => 'rechazado',
            'observaciones' => $request->observaciones
        ]);

        return response()->json([
            'message' => 'Pago rechazado',
            'data' => $pago
        ]);
    }

    public function destroy($id)
    {
        $pago = Pago::withTrashed()->findOrFail($id);

        if ($pago->estado === 'verificado') {
            return response()->json([
                'message' => 'No se puede eliminar un pago verificado'
            ], 400);
        }

        $pago->forceDelete(); // Eliminación permanente

        return response()->json([
            'message' => 'Pago eliminado exitosamente'
        ]);
    }
    
    // Método adicional para restaurar pagos eliminados
    public function restaurar($id)
    {
        $pago = Pago::onlyTrashed()->findOrFail($id);
        $pago->restore();

        return response()->json([
            'message' => 'Pago restaurado exitosamente',
            'data' => $pago
        ]);
    }
}