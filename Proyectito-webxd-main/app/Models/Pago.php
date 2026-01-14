<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pago extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'pagos';
    protected $primaryKey = 'id_pago';
    
    protected $fillable = [
        'id_factura',
        'numero_pago',
        'monto',
        'fecha_pago',
        'metodo_pago',
        'referencia',
        'comprobante',
        'observaciones',
        'estado',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'monto' => 'decimal:2',
        'fecha_pago' => 'date'
    ];

    // Relaciones
    public function factura()
    {
        return $this->belongsTo(Factura::class, 'id_factura', 'id_factura');
    }

    // Métodos auxiliares
    public function isVerificado()
    {
        return $this->estado === 'verificado';
    }

    public function verificar()
    {
        $this->update(['estado' => 'verificado']);
        
        // Actualizar estado de factura si está completamente pagada
        $factura = $this->factura;
        if ($factura->saldo_pendiente <= 0) {
            $factura->update(['estado' => 'pagada']);
        }
    }

    public function rechazar()
    {
        $this->update(['estado' => 'rechazado']);
    }
}