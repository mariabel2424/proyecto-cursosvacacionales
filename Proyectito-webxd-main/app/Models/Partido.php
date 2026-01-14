<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Partido extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'partidos';
    protected $primaryKey = 'id_partido';
    
    protected $fillable = [
        'id_campeonato',
        'id_escenario',
        'club_local_id',
        'club_visitante_id',
        'fecha',
        'hora',
        'goles_local',
        'goles_visitante',
        'estado',
        'arbitro',
        'observaciones',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'fecha' => 'date',
        'hora' => 'datetime:H:i',
        'goles_local' => 'integer',
        'goles_visitante' => 'integer'
    ];

    // Relaciones
    public function campeonato()
    {
        return $this->belongsTo(Campeonato::class, 'id_campeonato', 'id_campeonato')
            ->withDefault(['nombre' => 'Sin campeonato']);
    }

    public function escenario()
    {
        return $this->belongsTo(Escenario::class, 'id_escenario', 'id_escenario')
            ->withDefault(['nombre' => 'Sin escenario']);
    }

    public function clubLocal()
    {
        return $this->belongsTo(Club::class, 'club_local_id', 'id_club')
            ->withDefault(['nombre' => 'Club eliminado', 'id_club' => null]);
    }

    public function clubVisitante()
    {
        return $this->belongsTo(Club::class, 'club_visitante_id', 'id_club')
            ->withDefault(['nombre' => 'Club eliminado', 'id_club' => null]);
    }

    public function estadisticas()
    {
        return $this->hasMany(EstadisticaJugador::class, 'id_partido', 'id_partido');
    }

    // Métodos auxiliares
    public function isFinalizado()
    {
        return $this->estado === 'finalizado';
    }

    public function getResultadoAttribute()
    {
        if (!$this->isFinalizado()) {
            return 'Pendiente';
        }

        return "{$this->goles_local} - {$this->goles_visitante}";
    }

    public function getGanadorAttribute()
    {
        if (!$this->isFinalizado()) {
            return null;
        }

        if ($this->goles_local > $this->goles_visitante) {
            return $this->clubLocal;
        } elseif ($this->goles_visitante > $this->goles_local) {
            return $this->clubVisitante;
        }

        return null; // Empate
    }
}
