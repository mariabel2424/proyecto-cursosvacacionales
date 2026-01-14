<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Actividad extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'actividades';
    protected $primaryKey = 'id_actividad';
    
    protected $fillable = [
        'nombre_actividad',
        'descripcion',
        'fecha',
        'hora_inicio',
        'hora_fin',
        'tipo',
        'estado',
        'cupo_maximo',
        'observaciones',
        'created_by',
        'updated_by',
        'deleted_by'
    ];

    protected $casts = [
        'fecha' => 'date',
        'hora_inicio' => 'datetime:H:i',
        'hora_fin' => 'datetime:H:i',
        'cupo_maximo' => 'integer'
    ];

    // Relaciones
    public function programaActividades()
    {
        return $this->hasMany(ProgramaActividad::class, 'id_actividad', 'id_actividad');
    }

    public function escenarios()
    {
        return $this->belongsToMany(Escenario::class, 'programa_actividades', 'id_actividad', 'id_escenario')
                    ->withPivot('observaciones')
                    ->withTimestamps();
    }

    public function asistencias()
    {
        return $this->hasMany(Asistencia::class, 'id_actividad', 'id_actividad');
    }

    // Métodos auxiliares
    public function isProgramada()
    {
        return $this->estado === 'programada';
    }

    public function getDuracionAttribute()
    {
        return $this->hora_inicio->diffInMinutes($this->hora_fin);
    }
}
