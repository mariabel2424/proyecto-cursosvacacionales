<?php
namespace App\Http\Controllers\API\Clubes;

use App\Http\Controllers\Controller;
use App\Models\Campeonato;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CampeonatoController extends Controller
{
   public function index(Request $request)
{
    \Log::info('=== API CAMPEONATOS - DEBUG INICIO ===');
    
    // 1. Verificar usuario autenticado (opcional en rutas públicas)
    $user = auth()->user();
    \Log::info('Usuario autenticado:', [
        'id' => $user?->id,
        'name' => $user?->name ?? 'Invitado',
        'email' => $user?->email ?? 'N/A'
    ]);
    
    // 2. Verificar contadores con/sin SoftDeletes
    $totalConTrashed = Campeonato::withTrashed()->count();
    $totalSinTrashed = Campeonato::count();
    $totalOnlyTrashed = Campeonato::onlyTrashed()->count();
    
    \Log::info('Contadores Campeonatos:', [
        'con_trashed' => $totalConTrashed,
        'sin_trashed' => $totalSinTrashed,
        'only_trashed' => $totalOnlyTrashed,
        'diferencia' => $totalConTrashed - $totalSinTrashed
    ]);
    
    if ($totalOnlyTrashed > 0) {
        \Log::info('Campeonatos eliminados (soft):', 
            Campeonato::onlyTrashed()->get(['id_campeonato', 'nombre', 'deleted_at'])->toArray()
        );
    }
    
    // 3. Verificar TODOS los campeonatos incluyendo eliminados
    $todosCampeonatos = Campeonato::withTrashed()->get();
    \Log::info('Todos los campeonatos (con trashed):', [
        'count' => $todosCampeonatos->count(),
        'ids' => $todosCampeonatos->pluck('id_campeonato')->toArray(),
        'nombres' => $todosCampeonatos->pluck('nombre')->toArray(),
        'deleted_ats' => $todosCampeonatos->pluck('deleted_at')->toArray()
    ]);
    
    // 4. Verificar campeonatos sin eliminar
    $campeonatosActivos = Campeonato::all();
    \Log::info('Campeonatos activos (sin trashed):', [
        'count' => $campeonatosActivos->count(),
        'ids' => $campeonatosActivos->pluck('id_campeonato')->toArray()
    ]);
    
    // 5. Construir consulta con filtros
    \DB::enableQueryLog();
    
    $query = Campeonato::query(); // Por defecto excluye eliminados
    
    \Log::info('Consulta inicial (excluye eliminados):', [
        'sql' => $query->toSql(),
        'bindings' => $query->getBindings()
    ]);
    
    // Aplicar filtros
    if ($request->search) {
        $query->where('nombre', 'like', "%{$request->search}%");
        \Log::info('After search filter', ['search' => $request->search]);
    }
    
    if ($request->estado && $request->estado !== 'all') {
        $query->where('estado', $request->estado);
        \Log::info('After estado filter', ['estado' => $request->estado]);
    }
    
    if ($request->categoria && $request->categoria !== 'all') {
        $query->where('categoria', $request->categoria);
        \Log::info('After categoria filter', ['categoria' => $request->categoria]);
    }
    
    $query->orderBy('created_at', 'desc');
    
    \Log::info('Consulta final antes de paginar:', [
        'sql' => $query->toSql(),
        'bindings' => $query->getBindings()
    ]);
    
    // 6. Ejecutar y loguear resultados
    $resultadosSinPaginar = $query->get();
    \Log::info('Resultados sin paginar:', [
        'count' => $resultadosSinPaginar->count(),
        'data' => $resultadosSinPaginar->toArray()
    ]);
    
    // 7. Paginar
    $campeonatos = $query->paginate($request->per_page ?? 15);
    
    \Log::info('Queries ejecutadas:', \DB::getQueryLog());
    
    // 8. Log final
    \Log::info('=== API CAMPEONATOS - DEBUG FIN ===', [
        'pagination_total' => $campeonatos->total(),
        'pagination_per_page' => $campeonatos->perPage(),
        'pagination_current_page' => $campeonatos->currentPage(),
        'pagination_last_page' => $campeonatos->lastPage(),
        'pagination_data_count' => count($campeonatos->items()),
        'pagination_data_ids' => collect($campeonatos->items())->pluck('id_campeonato')->toArray(),
        'pagination_data_nombres' => collect($campeonatos->items())->pluck('nombre')->toArray()
    ]);
    
    // 9. SOLUCIÓN TEMPORAL: Si no hay resultados, usar withTrashed
    if ($campeonatos->total() === 0 && $totalConTrashed > 0) {
        \Log::warning('No hay campeonatos activos, pero sí hay con trashed. Usando withTrashed...');
        
        $queryWithTrashed = Campeonato::withTrashed();
        
        // Re-aplicar filtros
        if ($request->search) {
            $queryWithTrashed->where('nombre', 'like', "%{$request->search}%");
        }
        
        if ($request->estado && $request->estado !== 'all') {
            $queryWithTrashed->where('estado', $request->estado);
        }
        
        if ($request->categoria && $request->categoria !== 'all') {
            $queryWithTrashed->where('categoria', $request->categoria);
        }
        
        $campeonatos = $queryWithTrashed->orderBy('created_at', 'desc')
                                        ->paginate($request->per_page ?? 15);
        
        \Log::info('Resultados con withTrashed:', [
            'total' => $campeonatos->total(),
            'data_count' => count($campeonatos->items())
        ]);
        
        // Agregar flag para indicar que incluye eliminados
        $campeonatos->withTrashed = true;
    }
    
    return response()->json($campeonatos);
}

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'nullable|date|after:fecha_inicio',
            'categoria' => 'required|string|max:50',
            'representante' => 'required|string|max:100',
            'email_representante' => 'nullable|email|max:100',
            'telefono_representante' => 'nullable|string|max:20',
            'descripcion' => 'nullable|string',
            'imagen' => 'nullable|image|max:2048',
            'reglas' => 'nullable|array'
        ]);

        $data = $request->except('imagen');
        $data['slug'] = Str::slug($request->nombre);

        if ($request->hasFile('imagen')) {
            $data['imagen'] = $request->file('imagen')->store('campeonatos', 'public');
        }

        $campeonato = Campeonato::create($data);

        return response()->json([
            'message' => 'Campeonato creado exitosamente',
            'data' => $campeonato
        ], 201);
    }

    public function show($id)
    {
        $campeonato = Campeonato::with([
            'clubes',
            'partidos',
            'estadisticas'
        ])->findOrFail($id);

        return response()->json($campeonato);
    }

    public function update(Request $request, $id)
    {
        $campeonato = Campeonato::findOrFail($id);

        $request->validate([
            'nombre' => 'sometimes|string|max:100',
            'fecha_inicio' => 'sometimes|date',
            'fecha_fin' => 'nullable|date|after:fecha_inicio',
            'categoria' => 'sometimes|string|max:50',
            'representante' => 'sometimes|string|max:100',
            'email_representante' => 'nullable|email|max:100',
            'telefono_representante' => 'nullable|string|max:20',
            'descripcion' => 'nullable|string',
            'estado' => 'sometimes|in:planificado,en_curso,finalizado,cancelado',
            'imagen' => 'nullable|image|max:2048',
            'reglas' => 'nullable|array'
        ]);

        $data = $request->except('imagen');
        
        if ($request->filled('nombre')) {
            $data['slug'] = Str::slug($request->nombre);
        }

        if ($request->hasFile('imagen')) {
            if ($campeonato->imagen) {
                \Storage::disk('public')->delete($campeonato->imagen);
            }
            $data['imagen'] = $request->file('imagen')->store('campeonatos', 'public');
        }

        $campeonato->update($data);

        return response()->json([
            'message' => 'Campeonato actualizado exitosamente',
            'data' => $campeonato
        ]);
    }

    public function destroy($id)
    {
        $campeonato = Campeonato::findOrFail($id);
        $campeonato->delete();

        return response()->json([
            'message' => 'Campeonato eliminado exitosamente'
        ]);
    }

    // Métodos adicionales
    public function tablaPosiciones($id)
    {
        $campeonato = Campeonato::findOrFail($id);
        $tabla = $campeonato->getTablaPosiciones();
        
        return response()->json($tabla);
    }

    public function inscribirClub(Request $request, $id)
    {
        $request->validate([
            'id_club' => 'required|exists:clubes,id_club',
            'fecha_inscripcion' => 'required|date'
        ]);

        $campeonato = Campeonato::findOrFail($id);
        
        $campeonato->clubes()->attach($request->id_club, [
            'fecha_inscripcion' => $request->fecha_inscripcion,
            'estado' => 'inscrito',
            'puntos' => 0,
            'partidos_jugados' => 0,
            'partidos_ganados' => 0,
            'partidos_empatados' => 0,
            'partidos_perdidos' => 0,
            'goles_favor' => 0,
            'goles_contra' => 0
        ]);

        return response()->json([
            'message' => 'Club inscrito exitosamente'
        ]);
    }

    public function fixture($id)
    {
        $campeonato = Campeonato::with('partidos.clubLocal', 'partidos.clubVisitante', 'partidos.escenario')
                                ->findOrFail($id);
        
        return response()->json($campeonato->partidos);
    }

    public function goleadores($id)
    {
        $campeonato = Campeonato::findOrFail($id);
        
        $goleadores = $campeonato->estadisticas()
                                 ->with('deportista')
                                 ->selectRaw('id_deportista, SUM(goles) as total_goles')
                                 ->groupBy('id_deportista')
                                 ->orderBy('total_goles', 'desc')
                                 ->limit(10)
                                 ->get();
        
        return response()->json($goleadores);
    }
}