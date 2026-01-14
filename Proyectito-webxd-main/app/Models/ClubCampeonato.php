<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClubCampeonato extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'club_campeonatos';
    protected $primaryKey = 'id_club_campeonato';
    
    protected $fillable = [
        'id_club',
        'id_campeonato',
        'fecha_inscripcion',
        'estado',
        'puntos',
        'partidos_jugados',
        'partidos_ganados',
        'partidos_empatados',
        'partidos_perdidos',
        'goles_favor',
        'goles_contra',
        'observaciones',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'fecha_inscripcion' => 'date',
        'puntos' => 'integer',
        'partidos_jugados' => 'integer',
        'partidos_ganados' => 'integer',
        'partidos_empatados' => 'integer',
        'partidos_perdidos' => 'integer',
        'goles_favor' => 'integer',
        'goles_contra' => 'integer'
    ];

    // Relaciones
    public function club()
    {
        return $this->belongsTo(Club::class, 'id_club', 'id_club');
    }

    public function campeonato()
    {
        return $this->belongsTo(Campeonato::class, 'id_campeonato', 'id_campeonato');
    }

    // Métodos auxiliares
    public function getDiferenciaGolesAttribute()
    {
        return $this->goles_favor - $this->goles_contra;
    }

    public function registrarVictoria($golesFavor, $golesContra)
    {
        $this->increment('partidos_jugados');
        $this->increment('partidos_ganados');
        $this->increment('puntos', 3);
        $this->increment('goles_favor', $golesFavor);
        $this->increment('goles_contra', $golesContra);
        $this->save();
    }

    public function registrarEmpate($golesFavor, $golesContra)
    {
        $this->increment('partidos_jugados');
        $this->increment('partidos_empatados');
        $this->increment('puntos', 1);
        $this->increment('goles_favor', $golesFavor);
        $this->increment('goles_contra', $golesContra);
        $this->save();
    }

    public function registrarDerrota($golesFavor, $golesContra)
    {
        $this->increment('partidos_jugados');
        $this->increment('partidos_perdidos');
        $this->increment('goles_favor', $golesFavor);
        $this->increment('goles_contra', $golesContra);
        $this->save();
    }
}