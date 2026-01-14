<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tutor extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tutores';
    protected $primaryKey = 'id_tutor';
    
    protected $fillable = [
        'id_usuario',
        'nombres',
        'apellidos',
        'cedula',
        'telefono',
        'email',
        'direccion',
        'parentesco',
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

    public function deportistas()
    {
        return $this->belongsToMany(
            Deportista::class,
            'deportista_tutores',
            'id_tutor',
            'id_deportista'
        )->withPivot('principal')->withTimestamps();
    }

    public function deportistasPrincipales()
    {
        return $this->deportistas()->wherePivot('principal', true);
    }

    public function inscripciones()
    {
        return $this->hasMany(InscripcionCurso::class, 'id_usuario', 'id_usuario');
    }

    // Métodos auxiliares
    public function getNombreCompletoAttribute()
    {
        return "{$this->nombres} {$this->apellidos}";
    }

    public function isActivo()
    {
        return $this->activo === true;
    }

    // Scopes
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    public function scopeBuscar($query, $termino)
    {
        return $query->where(function($q) use ($termino) {
            $q->where('nombres', 'like', "%{$termino}%")
              ->orWhere('apellidos', 'like', "%{$termino}%")
              ->orWhere('cedula', 'like', "%{$termino}%")
              ->orWhere('telefono', 'like', "%{$termino}%");
        });
    }
}