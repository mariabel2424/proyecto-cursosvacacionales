<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Club extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'clubes';
    protected $primaryKey = 'id_club';
    
    protected $fillable = [
        'nombre',
        'slug',
        'fecha_creacion',
        'fecha_fundacion',
        'representante',
        'email',
        'telefono',
        'direccion',
        'logo',
        'descripcion',
        'redes_sociales',
        'estado',
        'created_by',
        'updated_by',
        'deleted_by'
    ];

    protected $casts = [
        'fecha_creacion' => 'date',
        'fecha_fundacion' => 'date',
        'redes_sociales' => 'array'
    ];

    // Relaciones
    public function jugadorClubes()
    {
        return $this->hasMany(JugadorClub::class, 'id_club', 'id_club');
    }

    public function deportistas()
    {
        return $this->belongsToMany(Deportista::class, 'jugador_clubes', 'id_club', 'id_deportista')
                    ->withPivot('fecha_ingreso', 'fecha_salida', 'estado', 'numero_camiseta', 'observaciones')
                    ->withTimestamps();
    }

    public function deportistasActivos()
    {
        return $this->deportistas()
                    ->wherePivot('estado', 'activo')
                    ->whereNull('jugador_clubes.fecha_salida');
    }

    public function clubCampeonatos()
    {
        return $this->hasMany(ClubCampeonato::class, 'id_club', 'id_club');
    }

    public function campeonatos()
    {
        return $this->belongsToMany(Campeonato::class, 'club_campeonatos', 'id_club', 'id_campeonato')
                    ->withPivot('fecha_inscripcion', 'estado', 'puntos', 'partidos_jugados', 
                               'partidos_ganados', 'partidos_empatados', 'partidos_perdidos',
                               'goles_favor', 'goles_contra')
                    ->withTimestamps();
    }

    public function partidosLocal()
    {
        return $this->hasMany(Partido::class, 'club_local_id', 'id_club');
    }

    public function partidosVisitante()
    {
        return $this->hasMany(Partido::class, 'club_visitante_id', 'id_club');
    }

    // Métodos auxiliares
    public function getTodosPartidos()
    {
        return Partido::where('club_local_id', $this->id_club)
                     ->orWhere('club_visitante_id', $this->id_club)
                     ->get();
    }
}