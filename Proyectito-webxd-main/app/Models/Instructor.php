<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Instructor extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'instructores';
    protected $primaryKey = 'id_instructor';
    
    protected $fillable = [
        'id_usuario',
        'especialidad',
        'certificaciones',
        'foto',
        'activo'
    ];

    protected $casts = [
        'activo' => 'boolean'
    ];

    // Relaciones
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    public function grupos()
    {
        return $this->belongsToMany(
            GrupoCurso::class,
            'instructor_grupos',
            'id_instructor',
            'id_grupo'
        )->withPivot('coordinador')->withTimestamps();
    }

    public function gruposCoordinados()
    {
        return $this->grupos()->wherePivot('coordinador', true);
    }

    public function asistenciasTomadas()
    {
        return $this->hasMany(Asistencia::class, 'created_by', 'id_usuario');
    }

    // Métodos auxiliares
    public function getNombreCompletoAttribute()
    {
        return $this->usuario ? $this->usuario->nombre . ' ' . $this->usuario->apellido : 'N/A';
    }

    public function isActivo()
    {
        return $this->activo === true;
    }

    public function tieneEspecialidad($especialidad)
    {
        return strtolower($this->especialidad) === strtolower($especialidad);
    }

    public function coordinaGrupo($idGrupo)
    {
        return $this->grupos()
            ->wherePivot('id_grupo', $idGrupo)
            ->wherePivot('coordinador', true)
            ->exists();
    }

    // Scopes
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    public function scopePorEspecialidad($query, $especialidad)
    {
        return $query->where('especialidad', 'like', "%{$especialidad}%");
    }

    public function scopeConGrupos($query)
    {
        return $query->has('grupos');
    }

    public function scopeBuscar($query, $termino)
    {
        return $query->whereHas('usuario', function($q) use ($termino) {
            $q->where('nombre', 'like', "%{$termino}%")
              ->orWhere('apellido', 'like', "%{$termino}%");
        })->orWhere('especialidad', 'like', "%{$termino}%");
    }
}