<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeportistaTutores extends Model
{
    use HasFactory;

    // Nombre de la tabla
    protected $table = 'deportista_tutores';

    // Campos asignables en masa
    protected $fillable = [
        'id_deportista',
        'id_tutor',
        'principal',
    ];

    // Casts
    protected $casts = [
        'principal' => 'boolean',
    ];

    /**
     * Relación: pertenece a un deportista
     */
    public function deportista()
    {
        return $this->belongsTo(Deportista::class, 'id_deportista', 'id_deportista');
    }

    /**
     * Relación: pertenece a un tutor
     */
    public function tutor()
    {
        return $this->belongsTo(Tutor::class, 'id_tutor', 'id_tutor');
    }
}
