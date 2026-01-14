<?php
namespace App\Http\Controllers\API\Sistema;
use App\Http\Controllers\Controller;


use App\Models\Deportista;
use App\Models\Club;
use App\Models\Campeonato;
use App\Models\Curso;
use App\Models\Factura;
use App\Models\Partido;
use App\Models\Lesion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function estadisticasGenerales()
    {
        $datos = [
            'deportistas' => [
                'total' => Deportista::count(),
                'activos' => Deportista::where('estado', 'activo')->count(),
                'lesionados' => Deportista::where('estado', 'lesionado')->count()
            ],
            'clubes' => [
                'total' => Club::count(),
                'activos' => Club::where('estado', 'activo')->count()
            ],
            'campeonatos' => [
                'total' => Campeonato::count(),
                'en_curso' => Campeonato::where('estado', 'en_curso')->count(),
                'finalizados' => Campeonato::where('estado', 'finalizado')->count()
            ],
            'cursos' => [
                'total' => Curso::count(),
                'abiertos' => Curso::where('estado', 'abierto')->count()
            ],
            'facturacion' => [
                'total_mes' => Factura::whereMonth('fecha_emision', now()->month)
                                     ->whereYear('fecha_emision', now()->year)
                                     ->sum('total'),
                'pendiente' => Factura::where('estado', 'pendiente')->sum('total'),
                'vencidas' => Factura::where('estado', 'vencida')->count()
            ]
        ];

        return response()->json($datos);
    }

    public function proximasActividades()
    {
        $partidos = Partido::with('clubLocal', 'clubVisitante')
                          ->where('estado', 'programado')
                          ->where('fecha', '>=', now())
                          ->orderBy('fecha')
                          ->limit(5)
                          ->get();

        return response()->json([
            'partidos' => $partidos
        ]);
    }

    public function lesionesActivas()
    {
        $lesiones = Lesion::with('deportista')
                         ->where('estado', 'activa')
                         ->orderBy('fecha_lesion', 'desc')
                         ->get();

        return response()->json($lesiones);
    }

    public function facturacionMensual()
    {
        $facturacion = Factura::select(
                DB::raw('MONTH(fecha_emision) as mes'),
                DB::raw('SUM(total) as total'),
                DB::raw('COUNT(*) as cantidad')
            )
            ->whereYear('fecha_emision', now()->year)
            ->groupBy('mes')
            ->orderBy('mes')
            ->get();

        return response()->json($facturacion);
    }

    public function deportistasMesDestacados()
    {
        $deportistas = Deportista::with('estadisticas')
            ->get()
            ->map(function($deportista) {
                return [
                    'deportista' => $deportista,
                    'goles' => $deportista->estadisticas->sum('goles'),
                    'asistencias' => $deportista->estadisticas->sum('asistencias')
                ];
            })
            ->sortByDesc('goles')
            ->take(10)
            ->values();

        return response()->json($deportistas);
    }
}