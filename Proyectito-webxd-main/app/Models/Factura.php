<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Factura extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'facturas';
    protected $primaryKey = 'id_factura';
    
    protected $fillable = [
        'id_deportista',
        'usuario_id',
        'numero_factura',
        'concepto',
        'fecha_emision',
        'fecha_vencimiento',
        'subtotal',
        'descuento',
        'impuesto',
        'total',
        'estado',
        'metodo_pago',
        'comprobante_pago',
        'observaciones',
        'created_by',
        'updated_by',
        'deleted_by'
    ];

    protected $casts = [
        'fecha_emision' => 'date',
        'fecha_vencimiento' => 'date',
        'subtotal' => 'decimal:2',
        'descuento' => 'decimal:2',
        'impuesto' => 'decimal:2',
        'total' => 'decimal:2'
    ];

    // Relaciones
    public function deportista()
    {
        return $this->belongsTo(Deportista::class, 'id_deportista', 'id_deportista');
    }

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id_usuario');
    }

    public function detalles()
    {
        return $this->hasMany(DetalleFactura::class, 'id_factura', 'id_factura');
    }

    public function pagos()
    {
        return $this->hasMany(Pago::class, 'id_factura', 'id_factura');
    }

    // Métodos auxiliares
    public function isPagada()
    {
        return $this->estado === 'pagada';
    }

    public function isPendiente()
    {
        return $this->estado === 'pendiente';
    }

    public function isVencida()
    {
        return $this->estado === 'vencida' || 
               ($this->estado === 'pendiente' && $this->fecha_vencimiento && $this->fecha_vencimiento->isPast());
    }

    public function getSaldoPendienteAttribute()
    {
        $totalPagado = $this->pagos()->where('estado', 'verificado')->sum('monto');
        return $this->total - $totalPagado;
    }

    public function getTotalPagadoAttribute()
    {
        return $this->pagos()->where('estado', 'verificado')->sum('monto');
    }

    public function calcularTotal()
    {
        $subtotal = $this->detalles()->sum('monto');
        $total = $subtotal - $this->descuento + $this->impuesto;
        
        $this->update([
            'subtotal' => $subtotal,
            'total' => $total
        ]);
    }
}
