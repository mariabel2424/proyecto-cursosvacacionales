<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Notificacion extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'notificaciones';
    protected $primaryKey = 'id_notificacion';
    
    protected $fillable = [
        'usuario_id',
        'tipo',
        'titulo',
        'mensaje',
        'data',
        'url',
        'leida',
        'fecha_lectura'
    ];

    protected $casts = [
        'data' => 'array',
        'leida' => 'boolean',
        'fecha_lectura' => 'datetime'
    ];

    // Relaciones
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id_usuario');
    }

    // Métodos auxiliares
    public function marcarComoLeida()
    {
        $this->update([
            'leida' => true,
            'fecha_lectura' => now()
        ]);
    }

    public function scopeNoLeidas($query)
    {
        return $query->where('leida', false);
    }

    public function scopeLeidas($query)
    {
        return $query->where('leida', true);
    }
}