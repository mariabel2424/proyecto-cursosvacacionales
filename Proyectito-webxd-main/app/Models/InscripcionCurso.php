<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InscripcionCurso extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'inscripcion_cursos';
    protected $primaryKey = 'id_inscripcion';
    
    protected $fillable = [
        'id_curso',
        'id_grupo',        // ← NUEVO
        'id_usuario',      // El tutor que inscribe
        'id_deportista',   // ← NUEVO: El deportista inscrito
        'fecha_inscripcion',
        'observaciones',
        'estado',
        'calificacion',
        'comentarios',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'fecha_inscripcion' => 'date',
        'calificacion' => 'decimal:2'
    ];

    // Relaciones
    public function curso()
    {
        return $this->belongsTo(Curso::class, 'id_curso', 'id_curso');
    }

    public function grupo()
    {
        return $this->belongsTo(GrupoCurso::class, 'id_grupo', 'id_grupo');
    }

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    public function tutor()
    {
        // Alias para mayor claridad semántica
        return $this->usuario();
    }

    public function deportista()
    {
        return $this->belongsTo(Deportista::class, 'id_deportista', 'id_deportista');
    }

    // Métodos auxiliares
    public function isActiva()
    {
        return $this->estado === 'activa';
    }

    public function isCompletada()
    {
        return $this->estado === 'completada';
    }

    public function isCancelada()
    {
        return $this->estado === 'cancelada';
    }
}