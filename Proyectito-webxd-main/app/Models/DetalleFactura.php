<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DetalleFactura extends Model
{
    use HasFactory;

    protected $table = 'detalle_facturas';
    protected $primaryKey = 'id_detalle';
    
    protected $fillable = [
        'id_factura',
        'concepto',
        'descripcion',
        'cantidad',
        'precio_unitario',
        'subtotal',
        'descuento',
        'monto'
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'precio_unitario' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'descuento' => 'decimal:2',
        'monto' => 'decimal:2'
    ];

    // Relaciones
    public function factura()
    {
        return $this->belongsTo(Factura::class, 'id_factura', 'id_factura');
    }

    // Métodos auxiliares
    public function calcularMonto()
    {
        $subtotal = $this->cantidad * $this->precio_unitario;
        $this->subtotal = $subtotal;
        $this->monto = $subtotal - $this->descuento;
        $this->save();
    }
}
