<?php
namespace App\Http\Controllers\API\Instalaciones;
use App\Http\Controllers\Controller;

use App\Models\Escenario;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EscenarioController extends Controller
{
    public function index(Request $request)
    {
        $query = Escenario::query();

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        $escenarios = $query->paginate(15);
        return response()->json($escenarios);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100|unique:escenarios,nombre',
            'tipo' => 'required|string|max:50',
            'capacidad' => 'required|integer|min:1',
            'descripcion' => 'nullable|string',
            'direccion' => 'nullable|string|max:200',
            'imagen' => 'nullable|image|max:2048',
            'servicios' => 'nullable|array'
        ]);

        $data = $request->except('imagen');
        $data['slug'] = Str::slug($request->nombre);

        if ($request->hasFile('imagen')) {
            $data['imagen'] = $request->file('imagen')->store('escenarios', 'public');
        }

        $escenario = Escenario::create($data);

        return response()->json([
            'message' => 'Escenario creado exitosamente',
            'data' => $escenario
        ], 201);
    }

    public function show($id)
    {
        $escenario = Escenario::with('actividades', 'partidos')->findOrFail($id);
        return response()->json($escenario);
    }

    public function update(Request $request, $id)
    {
        $escenario = Escenario::findOrFail($id);

        $request->validate([
            'nombre' => 'sometimes|string|max:100|unique:escenarios,nombre,' . $id . ',id_escenario',
            'tipo' => 'sometimes|string|max:50',
            'capacidad' => 'sometimes|integer|min:1',
            'descripcion' => 'nullable|string',
            'direccion' => 'nullable|string|max:200',
            'estado' => 'sometimes|in:disponible,ocupado,mantenimiento,cerrado',
            'imagen' => 'nullable|image|max:2048',
            'servicios' => 'nullable|array'
        ]);

        $data = $request->except('imagen');
        
        if ($request->filled('nombre')) {
            $data['slug'] = Str::slug($request->nombre);
        }

        if ($request->hasFile('imagen')) {
            if ($escenario->imagen) {
                \Storage::disk('public')->delete($escenario->imagen);
            }
            $data['imagen'] = $request->file('imagen')->store('escenarios', 'public');
        }

        $escenario->update($data);

        return response()->json([
            'message' => 'Escenario actualizado exitosamente',
            'data' => $escenario
        ]);
    }

    public function destroy($id)
    {
        $escenario = Escenario::findOrFail($id);
        $escenario->delete();

        return response()->json([
            'message' => 'Escenario eliminado exitosamente'
        ]);
    }

    public function disponibilidad(Request $request, $id)
    {
        $request->validate([
            'fecha' => 'required|date'
        ]);

        $escenario = Escenario::findOrFail($id);
        
        $actividadesDia = $escenario->actividades()
                                    ->whereDate('fecha', $request->fecha)
                                    ->orderBy('hora_inicio')
                                    ->get();

        return response()->json([
            'escenario' => $escenario,
            'actividades' => $actividadesDia,
            'disponible' => $escenario->isDisponible()
        ]);
    }
}