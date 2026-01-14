<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JugadorClub extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'jugador_clubes';
    protected $primaryKey = 'id_jugador_club';
    
    protected $fillable = [
        'id_deportista',
        'id_club',
        'fecha_ingreso',
        'fecha_salida',
        'estado',
        'numero_camiseta',
        'observaciones',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'fecha_ingreso' => 'date',
        'fecha_salida' => 'date',
        'numero_camiseta' => 'integer'
    ];

    // Relaciones
    public function deportista()
    {
        return $this->belongsTo(Deportista::class, 'id_deportista', 'id_deportista');
    }

    public function club()
    {
        return $this->belongsTo(Club::class, 'id_club', 'id_club');
    }

    // Métodos auxiliares
    public function isActivo()
    {
        return $this->estado === 'activo' && is_null($this->fecha_salida);
    }
}