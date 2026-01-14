<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class InstructorGrupo extends Pivot
{
    protected $table = 'instructor_grupos';
    
    protected $fillable = [
        'id_instructor',
        'id_grupo',
        'coordinador'
    ];

    protected $casts = [
        'coordinador' => 'boolean'
    ];

    public $timestamps = true;

    // Relaciones
    public function instructor()
    {
        return $this->belongsTo(Instructor::class, 'id_instructor', 'id_instructor');
    }

    public function grupo()
    {
        return $this->belongsTo(GrupoCurso::class, 'id_grupo', 'id_grupo');
    }

    // Métodos auxiliares
    public function isCoordinador()
    {
        return $this->coordinador === true;
    }

    // Scopes
    public function scopeCoordinadores($query)
    {
        return $query->where('coordinador', true);
    }

    public function scopeDelInstructor($query, $idInstructor)
    {
        return $query->where('id_instructor', $idInstructor);
    }

    public function scopeDelGrupo($query, $idGrupo)
    {
        return $query->where('id_grupo', $idGrupo);
    }
}