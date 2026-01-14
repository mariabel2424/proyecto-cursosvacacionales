<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class GrupoCurso extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'grupos_curso';
    protected $primaryKey = 'id_grupo';
    
    protected $fillable = [
        'id_curso',
        'nombre',
        'cupo_maximo',
        'cupo_actual',
        'hora_inicio',
        'hora_fin',
        'dias_semana',
        'estado',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'hora_inicio' => 'datetime:H:i',
        'hora_fin' => 'datetime:H:i',
        'dias_semana' => 'array',
        'cupo_maximo' => 'integer',
        'cupo_actual' => 'integer'
    ];

    // Relaciones
    public function curso()
    {
        return $this->belongsTo(Curso::class, 'id_curso', 'id_curso');
    }

    public function inscripciones()
    {
        return $this->hasMany(InscripcionCurso::class, 'id_grupo', 'id_grupo');
    }

    public function deportistas()
    {
        return $this->hasManyThrough(
            Deportista::class,
            InscripcionCurso::class,
            'id_grupo',
            'id_deportista',
            'id_grupo',
            'id_deportista'
        );
    }

    public function instructores()
    {
        return $this->belongsToMany(
            Instructor::class,
            'instructor_grupos',
            'id_grupo',
            'id_instructor'
        )->withPivot('coordinador')->withTimestamps();
    }

    public function coordinador()
    {
        return $this->instructores()->wherePivot('coordinador', true)->first();
    }

    public function asistencias()
    {
        return $this->hasMany(Asistencia::class, 'id_grupo', 'id_grupo');
    }

    // Métodos auxiliares
    public function getCuposDisponiblesAttribute()
    {
        return $this->cupo_maximo - $this->cupo_actual;
    }

    public function tieneCupoDisponible()
    {
        return $this->cupo_actual < $this->cupo_maximo;
    }

    public function isCompleto()
    {
        return $this->estado === 'completo' || $this->cupo_actual >= $this->cupo_maximo;
    }

    public function isActivo()
    {
        return $this->estado === 'activo';
    }

    public function incrementarCupo()
    {
        $this->increment('cupo_actual');
        
        if ($this->cupo_actual >= $this->cupo_maximo) {
            $this->update(['estado' => 'completo']);
        }
    }

    public function decrementarCupo()
    {
        if ($this->cupo_actual > 0) {
            $this->decrement('cupo_actual');
            
            if ($this->estado === 'completo') {
                $this->update(['estado' => 'activo']);
            }
        }
    }

    public function getDiasSemanaNombresAttribute()
    {
        $dias = [
            1 => 'Lunes',
            2 => 'Martes',
            3 => 'Miércoles',
            4 => 'Jueves',
            5 => 'Viernes',
            6 => 'Sábado',
            7 => 'Domingo'
        ];

        return collect($this->dias_semana)->map(function($dia) use ($dias) {
            return is_numeric($dia) ? $dias[$dia] : ucfirst($dia);
        })->implode(', ');
    }

    // Scopes
    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    public function scopeConCupoDisponible($query)
    {
        return $query->whereRaw('cupo_actual < cupo_maximo');
    }

    public function scopeDelCurso($query, $idCurso)
    {
        return $query->where('id_curso', $idCurso);
    }
}