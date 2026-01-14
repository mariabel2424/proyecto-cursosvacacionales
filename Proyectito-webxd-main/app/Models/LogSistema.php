<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogSistema extends Model
{
    use HasFactory;

    protected $table = 'log_sistemas';
    protected $primaryKey = 'id_log';
    
    protected $fillable = [
        'id_usuario',
        'accion',
        'modelo',
        'modelo_id',
        'descripcion',
        'datos_anteriores',
        'datos_nuevos',
        'ip_address',
        'user_agent',
        'fecha'
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'datos_anteriores' => 'array',
        'datos_nuevos' => 'array'
    ];

    // Relaciones
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }
}