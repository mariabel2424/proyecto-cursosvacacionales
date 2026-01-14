<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProgramaActividad extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'programa_actividades';
    protected $primaryKey = 'id_programa';
    
    protected $fillable = [
        'id_escenario',
        'id_actividad',
        'observaciones',
        'created_by'
    ];

    // Relaciones
    public function escenario()
    {
        return $this->belongsTo(Escenario::class, 'id_escenario', 'id_escenario');
    }

    public function actividad()
    {
        return $this->belongsTo(Actividad::class, 'id_actividad', 'id_actividad');
    }
}