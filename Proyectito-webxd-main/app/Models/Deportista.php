<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Deportista extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'deportistas';
    protected $primaryKey = 'id_deportista';

    protected $fillable = [
        'id_usuario',
        'id_categoria',
        'nombres',
        'apellidos',
        'fecha_nacimiento',
        'genero',
        'tipo_documento',
        'numero_documento',
        'foto',
        'direccion',
        'correo',
        'telefono',
        'altura',
        'peso',
        'pie_habil',
        'numero_camiseta',
        'estado',
        'contacto_emergencia_nombre',
        'contacto_emergencia_telefono',
        'contacto_emergencia_relacion',
        'created_by',
        'updated_by',
        'deleted_by'
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date',
        'altura' => 'decimal:2',
        'peso' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    protected $appends = ['nombre_completo', 'edad', 'imc'];

    protected $attributes = [
        'estado' => 'activo'
    ];

    // Relaciones
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'id_categoria', 'id_categoria');
    }

    public function creador()
    {
        return $this->belongsTo(Usuario::class, 'created_by', 'id_usuario');
    }

    public function actualizador()
    {
        return $this->belongsTo(Usuario::class, 'updated_by', 'id_usuario');
    }

    // Scopes
    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    public function scopeLesionados($query)
    {
        return $query->where('estado', 'lesionado');
    }

    public function scopeSuspendidos($query)
    {
        return $query->where('estado', 'suspendido');
    }

    public function scopeRetirados($query)
    {
        return $query->where('estado', 'retirado');
    }

    public function scopePorCategoria($query, $categoriaId)
    {
        return $query->where('id_categoria', $categoriaId);
    }

    public function scopePorGenero($query, $genero)
    {
        return $query->where('genero', $genero);
    }

    // Métodos de ayuda
    public function getNombreCompletoAttribute()
    {
        return $this->nombres . ' ' . $this->apellidos;
    }

    public function getEdadAttribute()
    {
        return $this->fecha_nacimiento ? $this->fecha_nacimiento->age : null;
    }

    public function getImcAttribute()
    {
        if ($this->altura && $this->peso && $this->altura > 0) {
            return round($this->peso / ($this->altura * $this->altura), 2);
        }
        return null;
    }

    public function getFotoUrlAttribute()
    {
        if ($this->foto) {
            return asset('storage/' . $this->foto);
        }
        return null;
    }
}