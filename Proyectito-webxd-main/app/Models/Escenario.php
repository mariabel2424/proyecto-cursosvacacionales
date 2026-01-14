<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Escenario extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'escenarios';
    protected $primaryKey = 'id_escenario';
    
    protected $fillable = [
        'nombre',
        'slug',
        'tipo',
        'capacidad',
        'descripcion',
        'direccion',
        'imagen',
        'servicios',
        'estado',
        'created_by',
        'updated_by',
        'deleted_by'
    ];

    protected $casts = [
        'capacidad' => 'integer',
        'servicios' => 'array'
    ];

    // Relaciones
    public function programaActividades()
    {
        return $this->hasMany(ProgramaActividad::class, 'id_escenario', 'id_escenario');
    }

    public function actividades()
    {
        return $this->belongsToMany(Actividad::class, 'programa_actividades', 'id_escenario', 'id_actividad')
                    ->withPivot('observaciones')
                    ->withTimestamps();
    }

    public function partidos()
    {
        return $this->hasMany(Partido::class, 'id_escenario', 'id_escenario');
    }

    // Métodos auxiliares
    public function isDisponible()
    {
        return $this->estado === 'disponible';
    }
}
