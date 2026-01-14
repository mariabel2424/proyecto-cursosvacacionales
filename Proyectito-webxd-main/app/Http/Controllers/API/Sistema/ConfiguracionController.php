<?php
namespace App\Http\Controllers\API\Sistema;
use App\Http\Controllers\Controller;

use App\Models\Configuracion;
use Illuminate\Http\Request;

class ConfiguracionController extends Controller
{
    public function index(Request $request)
    {
        $query = Configuracion::query();

        if ($request->has('grupo')) {
            $query->where('grupo', $request->grupo);
        }

        $configuraciones = $query->orderBy('grupo')->orderBy('clave')->get();
        return response()->json($configuraciones);
    }

    public function store(Request $request)
    {
        $request->validate([
            'clave' => 'required|string|max:100|unique:configuraciones,clave',
            'valor' => 'nullable|string',
            'tipo' => 'required|in:texto,numero,boolean,json,fecha',
            'grupo' => 'required|string|max:50',
            'descripcion' => 'nullable|string',
            'editable' => 'boolean'
        ]);

        $configuracion = Configuracion::create($request->all());

        return response()->json([
            'message' => 'Configuración creada exitosamente',
            'data' => $configuracion
        ], 201);
    }

    public function show($clave)
    {
        $configuracion = Configuracion::where('clave', $clave)->firstOrFail();
        return response()->json($configuracion);
    }

    public function update(Request $request, $id)
    {
        $configuracion = Configuracion::findOrFail($id);

        if (!$configuracion->editable) {
            return response()->json([
                'message' => 'Esta configuración no es editable'
            ], 400);
        }

        $request->validate([
            'valor' => 'nullable|string',
            'descripcion' => 'nullable|string'
        ]);

        $configuracion->update($request->only(['valor', 'descripcion']));

        return response()->json([
            'message' => 'Configuración actualizada exitosamente',
            'data' => $configuracion
        ]);
    }

    public function destroy($id)
    {
        $configuracion = Configuracion::findOrFail($id);

        if (!$configuracion->editable) {
            return response()->json([
                'message' => 'Esta configuración no se puede eliminar'
            ], 400);
        }

        $configuracion->delete();

        return response()->json([
            'message' => 'Configuración eliminada exitosamente'
        ]);
    }

    public function obtenerPorClave($clave)
    {
        $valor = Configuracion::obtener($clave);
        
        return response()->json([
            'clave' => $clave,
            'valor' => $valor
        ]);
    }

    public function establecerPorClave(Request $request, $clave)
    {
        $request->validate([
            'valor' => 'required'
        ]);

        Configuracion::establecer($clave, $request->valor);

        return response()->json([
            'message' => 'Configuración establecida exitosamente'
        ]);
    }

    public function grupos()
    {
        $grupos = Configuracion::select('grupo')
                              ->distinct()
                              ->orderBy('grupo')
                              ->pluck('grupo');

        return response()->json($grupos);
    }
}