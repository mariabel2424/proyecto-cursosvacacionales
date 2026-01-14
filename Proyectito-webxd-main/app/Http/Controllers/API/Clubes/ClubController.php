<?php
namespace App\Http\Controllers\API\Clubes;
use App\Http\Controllers\Controller;

use App\Models\Club;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClubController extends Controller
{
    public function index(Request $request)
    {
        $query = Club::with('deportistasActivos');

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('nombre', 'like', "%{$search}%");
        }

        $clubes = $query->paginate(15);
        return response()->json($clubes);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100|unique:clubes,nombre',
            'fecha_creacion' => 'required|date',
            'fecha_fundacion' => 'nullable|date',
            'representante' => 'required|string|max:100',
            'email' => 'nullable|email|max:100',
            'telefono' => 'nullable|string|max:20',
            'direccion' => 'nullable|string|max:150',
            'descripcion' => 'nullable|string',
            'logo' => 'nullable|image|max:2048',
            'redes_sociales' => 'nullable|array'
        ]);

        $data = $request->except('logo');
        $data['slug'] = Str::slug($request->nombre);

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('clubes/logos', 'public');
        }

        $club = Club::create($data);

        return response()->json([
            'message' => 'Club creado exitosamente',
            'data' => $club
        ], 201);
    }

    public function show($id)
    {
        $club = Club::with([
            'deportistasActivos',
            'campeonatos',
            'partidosLocal',
            'partidosVisitante'
        ])->findOrFail($id);

        return response()->json($club);
    }

    public function update(Request $request, $id)
    {
        $club = Club::findOrFail($id);

        $request->validate([
            'nombre' => 'sometimes|string|max:100|unique:clubes,nombre,' . $id . ',id_club',
            'fecha_creacion' => 'sometimes|date',
            'fecha_fundacion' => 'nullable|date',
            'representante' => 'sometimes|string|max:100',
            'email' => 'nullable|email|max:100',
            'telefono' => 'nullable|string|max:20',
            'direccion' => 'nullable|string|max:150',
            'descripcion' => 'nullable|string',
            'estado' => 'sometimes|in:activo,inactivo,suspendido',
            'logo' => 'nullable|image|max:2048',
            'redes_sociales' => 'nullable|array'
        ]);

        $data = $request->except('logo');
        
        if ($request->filled('nombre')) {
            $data['slug'] = Str::slug($request->nombre);
        }

        if ($request->hasFile('logo')) {
            if ($club->logo) {
                \Storage::disk('public')->delete($club->logo);
            }
            $data['logo'] = $request->file('logo')->store('clubes/logos', 'public');
        }

        $club->update($data);

        return response()->json([
            'message' => 'Club actualizado exitosamente',
            'data' => $club
        ]);
    }

    public function destroy($id)
    {
        $club = Club::findOrFail($id);
        $club->delete();

        return response()->json([
            'message' => 'Club eliminado exitosamente'
        ]);
    }

    // Métodos adicionales
    public function jugadores($id)
    {
        $club = Club::findOrFail($id);
        $jugadores = $club->deportistasActivos()->with('posiciones')->get();
        
        return response()->json($jugadores);
    }

    public function agregarJugador(Request $request, $id)
    {
        $request->validate([
            'id_deportista' => 'required|exists:deportistas,id_deportista',
            'fecha_ingreso' => 'required|date',
            'numero_camiseta' => 'nullable|integer|min:1|max:99',
            'observaciones' => 'nullable|string'
        ]);

        $club = Club::findOrFail($id);
        
        $club->deportistas()->attach($request->id_deportista, [
            'fecha_ingreso' => $request->fecha_ingreso,
            'numero_camiseta' => $request->numero_camiseta,
            'observaciones' => $request->observaciones,
            'estado' => 'activo'
        ]);

        return response()->json([
            'message' => 'Jugador agregado al club exitosamente'
        ]);
    }

    public function partidos($id)
    {
        $club = Club::findOrFail($id);
        $partidos = $club->getTodosPartidos();
        
        return response()->json($partidos);
    }
}