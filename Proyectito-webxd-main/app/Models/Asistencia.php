<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asistencia extends Model
{
    use HasFactory;

    protected $table = 'asistencias';
    protected $primaryKey = 'id_asistencia';
    
    protected $fillable = [
        'id_deportista',
        'id_grupo',        // ← NUEVO: Relacionado con el grupo del curso
        'id_actividad',    // Ahora es opcional (para eventos especiales)
        'fecha',
        'hora_llegada',
        'estado',
        'observaciones',
        'created_by'       // El instructor que toma la asistencia
    ];

    protected $casts = [
        'fecha' => 'date',
        'hora_llegada' => 'datetime:H:i'
    ];

    // Relaciones
    public function deportista()
    {
        return $this->belongsTo(Deportista::class, 'id_deportista', 'id_deportista');
    }

    public function grupo()
    {
        return $this->belongsTo(GrupoCurso::class, 'id_grupo', 'id_grupo');
    }

    public function actividad()
    {
        return $this->belongsTo(Actividad::class, 'id_actividad', 'id_actividad');
    }

    public function instructor()
    {
        // Quien tomó la asistencia
        return $this->belongsTo(Usuario::class, 'created_by', 'id_usuario');
    }

    // Métodos auxiliares
    public function isPresente()
    {
        return $this->estado === 'presente';
    }

    public function isTarde()
    {
        return $this->estado === 'tarde';
    }

    public function isAusente()
    {
        return $this->estado === 'ausente';
    }

    public function isJustificado()
    {
        return $this->estado === 'justificado';
    }

    // Scopes útiles
    public function scopeDelGrupo($query, $idGrupo)
    {
        return $query->where('id_grupo', $idGrupo);
    }

    public function scopeDelDia($query, $fecha)
    {
        return $query->whereDate('fecha', $fecha);
    }

    public function scopePresentes($query)
    {
        return $query->where('estado', 'presente');
    }

    public function scopeAusentes($query)
    {
        return $query->where('estado', 'ausente');
    }
}