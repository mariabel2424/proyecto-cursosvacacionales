<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Curso extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'cursos';
    protected $primaryKey = 'id_curso';
    
    protected $fillable = [
        'nombre',
        'slug',
        'descripcion',
        'fecha_inicio',
        'fecha_fin',
        'representante',
        'email_representante',
        'telefono_representante',
        'tipo',
        'estado',
        'cupo_maximo',
        'cupo_actual',
        'precio',
        'imagen',
        'created_by',
        'updated_by',
        'deleted_by'
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'precio' => 'decimal:2',
        'cupo_maximo' => 'integer',
        'cupo_actual' => 'integer'
    ];

    // Relaciones
    public function inscripciones()
    {
        return $this->hasMany(InscripcionCurso::class, 'id_curso', 'id_curso');
    }

    public function usuarios()
    {
        return $this->belongsToMany(Usuario::class, 'inscripcion_cursos', 'id_curso', 'id_usuario')
                    ->withPivot('fecha_inscripcion', 'estado', 'calificacion', 'observaciones')
                    ->withTimestamps();
    }

    // Métodos auxiliares
    public function tieneCuposDisponibles()
    {
        return $this->cupo_maximo === null || $this->cupo_actual < $this->cupo_maximo;
    }

    public function incrementarCupo()
    {
        $this->increment('cupo_actual');
    }

    public function decrementarCupo()
    {
        if ($this->cupo_actual > 0) {
            $this->decrement('cupo_actual');
        }
    }
}
