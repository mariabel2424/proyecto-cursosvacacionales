<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class DeportistaInstructor extends Pivot
{
    protected $table = 'deportista_tutores';
    
    protected $fillable = [
        'id_deportista',
        'id_tutor',
        'principal'
    ];

    protected $casts = [
        'principal' => 'boolean'
    ];

    public $timestamps = true;

    // Relaciones
    public function deportista()
    {
        return $this->belongsTo(Deportista::class, 'id_deportista', 'id_deportista');
    }

    public function tutor()
    {
        return $this->belongsTo(Tutor::class, 'id_tutor', 'id_tutor');
    }

    // Métodos auxiliares
    public function isPrincipal()
    {
        return $this->principal === true;
    }

    // Scopes
    public function scopePrincipales($query)
    {
        return $query->where('principal', true);
    }

    public function scopeDelDeportista($query, $idDeportista)
    {
        return $query->where('id_deportista', $idDeportista);
    }

    public function scopeDelTutor($query, $idTutor)
    {
        return $query->where('id_tutor', $idTutor);
    }
}