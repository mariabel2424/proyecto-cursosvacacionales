<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Campeonato extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'campeonatos';
    protected $primaryKey = 'id_campeonato';
    
    protected $fillable = [
        'nombre',
        'slug',
        'fecha_inicio',
        'fecha_fin',
        'categoria',
        'representante',
        'email_representante',
        'telefono_representante',
        'descripcion',
        'imagen',
        'estado',
        'reglas',
        'created_by',
        'updated_by',
        'deleted_by'
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'reglas' => 'array'
    ];

    // Relaciones
    public function clubCampeonatos()
    {
        return $this->hasMany(ClubCampeonato::class, 'id_campeonato', 'id_campeonato');
    }

    public function clubes()
    {
        return $this->belongsToMany(Club::class, 'club_campeonatos', 'id_campeonato', 'id_club')
                    ->withPivot('fecha_inscripcion', 'estado', 'puntos', 'partidos_jugados',
                               'partidos_ganados', 'partidos_empatados', 'partidos_perdidos',
                               'goles_favor', 'goles_contra')
                    ->withTimestamps();
    }

    public function partidos()
    {
        return $this->hasMany(Partido::class, 'id_campeonato', 'id_campeonato');
    }

    public function estadisticas()
    {
        return $this->hasMany(EstadisticaJugador::class, 'id_campeonato', 'id_campeonato');
    }

    // Métodos auxiliares
    public function getTablaPosiciones()
    {
        return $this->clubCampeonatos()
                    ->orderBy('puntos', 'desc')
                    ->orderByRaw('(goles_favor - goles_contra) DESC')
                    ->get();
    }

    public function isEnCurso()
    {
        return $this->estado === 'en_curso';
    }
}