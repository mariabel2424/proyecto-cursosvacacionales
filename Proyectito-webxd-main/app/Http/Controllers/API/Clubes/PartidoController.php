<?php
namespace App\Http\Controllers\API\Clubes;

use App\Http\Controllers\Controller;
use App\Models\Partido;
use App\Models\ClubCampeonato;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PartidoController extends Controller
{
    // app/Http/Controllers/Api/PartidoController.php
public function index(Request $request)
{
    \Log::info('API Partidos - Index llamado', [
        'user_id' => auth()->id(),
        'request_params' => $request->all()
    ]);
    
    // Verificar si hay partidos en la base de datos
    $totalPartidos = Partido::count();
    \Log::info('Total partidos en BD:', ['count' => $totalPartidos]);
    
    // Mostrar consulta SQL para debug
    \DB::enableQueryLog();
    
    $query = Partido::with(['campeonato', 'escenario', 'clubLocal', 'clubVisitante']);
    
    // Aplicar filtros
    if ($request->filled('search')) {
        $query->where(function($q) use ($request) {
            $q->where('arbitro', 'like', '%' . $request->search . '%')
              ->orWhereHas('clubLocal', function($q) use ($request) {
                  $q->where('nombre', 'like', '%' . $request->search . '%');
              })
              ->orWhereHas('clubVisitante', function($q) use ($request) {
                  $q->where('nombre', 'like', '%' . $request->search . '%');
              });
        });
    }
    
    if ($request->filled('estado') && $request->estado !== 'all') {
        $query->where('estado', $request->estado);
    }
    
    if ($request->filled('id_campeonato') && $request->id_campeonato !== 'all') {
        $query->where('id_campeonato', $request->id_campeonato);
    }
    
    if ($request->filled('fecha')) {
        $query->whereDate('fecha', $request->fecha);
    }
    
    $partidos = $query->orderBy('fecha', 'asc')
                      ->orderBy('hora', 'asc')
                      ->paginate($request->per_page ?? 15);
    
    \Log::info('Queries ejecutadas:', \DB::getQueryLog());
    \Log::info('Resultados:', [
        'total' => $partidos->total(),
        'per_page' => $partidos->perPage(),
        'current_page' => $partidos->currentPage(),
        'data_count' => count($partidos->items())
    ]);
    
    return response()->json($partidos);
}
    public function store(Request $request)
    {
        $request->validate([
            'id_campeonato' => 'nullable|exists:campeonatos,id_campeonato',
            'id_escenario' => 'nullable|exists:escenarios,id_escenario',
            'club_local_id' => 'required|exists:clubes,id_club',
            'club_visitante_id' => 'required|exists:clubes,id_club|different:club_local_id',
            'fecha' => 'required|date',
            'hora' => 'required|date_format:H:i',
            'arbitro' => 'nullable|string|max:100',
            'observaciones' => 'nullable|string'
        ]);

        $partido = Partido::create($request->all());

        return response()->json([
            'message' => 'Partido creado exitosamente',
            'data' => $partido->load('clubLocal', 'clubVisitante', 'escenario')
        ], 201);
    }

    public function show($id)
    {
        $partido = Partido::with([
            'clubLocal',
            'clubVisitante',
            'escenario',
            'campeonato',
            'estadisticas.deportista'
        ])->findOrFail($id);

        return response()->json($partido);
    }

    public function update(Request $request, $id)
    {
        $partido = Partido::findOrFail($id);

        if ($partido->estado === 'finalizado') {
            return response()->json([
                'message' => 'No se puede modificar un partido finalizado'
            ], 400);
        }

        $request->validate([
            'id_escenario' => 'sometimes|nullable|exists:escenarios,id_escenario',
            'fecha' => 'sometimes|date',
            'hora' => 'sometimes|date_format:H:i',
            'arbitro' => 'nullable|string|max:100',
            'observaciones' => 'nullable|string',
            'estado' => 'sometimes|in:programado,en_curso,finalizado,suspendido,cancelado'
        ]);

        $partido->update($request->all());

        return response()->json([
            'message' => 'Partido actualizado exitosamente',
            'data' => $partido
        ]);
    }

    public function destroy($id)
    {
        $partido = Partido::findOrFail($id);

        if ($partido->estado === 'finalizado') {
            return response()->json([
                'message' => 'No se puede eliminar un partido finalizado'
            ], 400);
        }

        $partido->delete();

        return response()->json([
            'message' => 'Partido eliminado exitosamente'
        ]);
    }

    // Métodos adicionales
    public function finalizarPartido(Request $request, $id)
    {
        $request->validate([
            'goles_local' => 'required|integer|min:0',
            'goles_visitante' => 'required|integer|min:0'
        ]);

        $partido = Partido::findOrFail($id);

        if ($partido->estado === 'finalizado') {
            return response()->json([
                'message' => 'El partido ya está finalizado'
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Actualizar resultado
            $partido->update([
                'goles_local' => $request->goles_local,
                'goles_visitante' => $request->goles_visitante,
                'estado' => 'finalizado'
            ]);

            // Actualizar tabla de posiciones si hay campeonato
            if ($partido->id_campeonato) {
                $this->actualizarTablaPosiciones($partido);
            }

            DB::commit();

            return response()->json([
                'message' => 'Partido finalizado exitosamente',
                'data' => $partido->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al finalizar partido',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function actualizarTablaPosiciones($partido)
    {
        $clubLocal = ClubCampeonato::where('id_club', $partido->club_local_id)
                                   ->where('id_campeonato', $partido->id_campeonato)
                                   ->first();

        $clubVisitante = ClubCampeonato::where('id_club', $partido->club_visitante_id)
                                       ->where('id_campeonato', $partido->id_campeonato)
                                       ->first();

        if (!$clubLocal || !$clubVisitante) {
            return;
        }

        // Determinar resultado
        if ($partido->goles_local > $partido->goles_visitante) {
            // Victoria local
            $clubLocal->registrarVictoria($partido->goles_local, $partido->goles_visitante);
            $clubVisitante->registrarDerrota($partido->goles_visitante, $partido->goles_local);
        } elseif ($partido->goles_local < $partido->goles_visitante) {
            // Victoria visitante
            $clubLocal->registrarDerrota($partido->goles_local, $partido->goles_visitante);
            $clubVisitante->registrarVictoria($partido->goles_visitante, $partido->goles_local);
        } else {
            // Empate
            $clubLocal->registrarEmpate($partido->goles_local, $partido->goles_visitante);
            $clubVisitante->registrarEmpate($partido->goles_visitante, $partido->goles_local);
        }
    }

    public function proximosPartidos(Request $request)
    {
        $cantidad = $request->get('cantidad', 10);

        $partidos = Partido::with('clubLocal', 'clubVisitante', 'escenario')
                          ->where('estado', 'programado')
                          ->where('fecha', '>=', now())
                          ->orderBy('fecha')
                          ->orderBy('hora')
                          ->limit($cantidad)
                          ->get();

        return response()->json($partidos);
    }
}