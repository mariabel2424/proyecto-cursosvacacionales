<?php
namespace App\Http\Controllers\API\Deportistas;
use App\Http\Controllers\Controller;

use App\Models\Tutor;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TutorController extends Controller
{
    public function index(Request $request)
{
    try {
        $query = Tutor::with('usuario', 'deportistas');

        // Búsqueda general
        if ($request->has('buscar') && !empty($request->buscar)) {
            $query->buscar($request->buscar);
        }

        // Filtro por estado
        if ($request->has('activo') && $request->activo !== '') {
            $query->where('activo', $request->activo);
        }

        // Filtro por parentesco
        if ($request->has('parentesco') && !empty($request->parentesco)) {
            $query->where('parentesco', $request->parentesco);
        }

        // Ordenamiento
        $query->orderBy('apellidos', 'asc')->orderBy('nombres', 'asc');

        $tutores = $query->paginate(15);
        
        return response()->json([
            'success' => true,
            'data' => $tutores,
            'message' => 'Tutores obtenidos exitosamente'
        ]);
        
    } catch (\Exception $e) {
        \Log::error('Error en TutorController@index: ' . $e->getMessage());
        \Log::error($e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Error interno del servidor: ' . $e->getMessage(),
            'trace' => env('APP_DEBUG') ? $e->getTraceAsString() : null
        ], 500);
    }
}

    public function store(Request $request)
    {
        $request->validate([
            'id_usuario' => 'required|exists:usuarios,id_usuario',
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'cedula' => 'required|string|max:20|unique:tutores,cedula',
            'telefono' => 'required|string|max:20',
            'email' => 'required|email|max:100',
            'direccion' => 'nullable|string',
            'parentesco' => 'required|in:padre,madre,abuelo,abuela,tio,tia,hermano,hermana,tutor_legal,otro',
            'activo' => 'sometimes|boolean'
        ]);

        // Verificar que el usuario no sea ya un tutor
        $existe = Tutor::where('id_usuario', $request->id_usuario)->exists();
        if ($existe) {
            return response()->json([
                'message' => 'Este usuario ya está registrado como tutor'
            ], 400);
        }

        $tutor = Tutor::create($request->all());

        return response()->json([
            'message' => 'Tutor registrado exitosamente',
            'data' => $tutor->load('usuario')
        ], 201);
    }

    public function show($id)
    {
        $tutor = Tutor::with('usuario', 'deportistas', 'inscripciones')->findOrFail($id);
        return response()->json($tutor);
    }

    public function update(Request $request, $id)
    {
        $tutor = Tutor::findOrFail($id);

        $request->validate([
            'nombres' => 'sometimes|string|max:100',
            'apellidos' => 'sometimes|string|max:100',
            'cedula' => 'sometimes|string|max:20|unique:tutores,cedula,' . $id . ',id_tutor',
            'telefono' => 'sometimes|string|max:20',
            'email' => 'sometimes|email|max:100',
            'direccion' => 'nullable|string',
            'parentesco' => 'sometimes|in:padre,madre,abuelo,abuela,tio,tia,hermano,hermana,tutor_legal,otro',
            'activo' => 'sometimes|boolean'
        ]);

        $tutor->update($request->all());

        return response()->json([
            'message' => 'Tutor actualizado exitosamente',
            'data' => $tutor
        ]);
    }

    public function destroy($id)
    {
        $tutor = Tutor::findOrFail($id);
        
        // Verificar si tiene deportistas asociados
        if ($tutor->deportistas()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar el tutor porque tiene deportistas asociados'
            ], 400);
        }

        $tutor->delete();

        return response()->json([
            'message' => 'Tutor eliminado exitosamente'
        ]);
    }

    // Vincular tutor con deportista
    public function vincularDeportista(Request $request, $id)
    {
        $request->validate([
            'id_deportista' => 'required|exists:deportistas,id_deportista',
            'principal' => 'sometimes|boolean'
        ]);

        $tutor = Tutor::findOrFail($id);

        // Verificar si ya está vinculado
        if ($tutor->deportistas()->where('id_deportista', $request->id_deportista)->exists()) {
            return response()->json([
                'message' => 'El deportista ya está vinculado a este tutor'
            ], 400);
        }

        // Si se marca como principal, quitar el principal anterior de ese deportista
        if ($request->principal) {
            DB::table('deportista_tutores')
                ->where('id_deportista', $request->id_deportista)
                ->update(['principal' => false]);
        }

        $tutor->deportistas()->attach($request->id_deportista, [
            'principal' => $request->principal ?? false
        ]);

        return response()->json([
            'message' => 'Deportista vinculado exitosamente al tutor',
            'data' => $tutor->load('deportistas')
        ]);
    }

    // Desvincular tutor de deportista
    public function desvincularDeportista(Request $request, $id)
    {
        $request->validate([
            'id_deportista' => 'required|exists:deportistas,id_deportista'
        ]);

        $tutor = Tutor::findOrFail($id);

        if (!$tutor->deportistas()->where('id_deportista', $request->id_deportista)->exists()) {
            return response()->json([
                'message' => 'El deportista no está vinculado a este tutor'
            ], 400);
        }

        $tutor->deportistas()->detach($request->id_deportista);

        return response()->json([
            'message' => 'Deportista desvinculado exitosamente del tutor'
        ]);
    }

    // Actualizar si es tutor principal
    public function actualizarPrincipal(Request $request, $id)
    {
        $request->validate([
            'id_deportista' => 'required|exists:deportistas,id_deportista',
            'principal' => 'required|boolean'
        ]);

        $tutor = Tutor::findOrFail($id);

        if (!$tutor->deportistas()->where('id_deportista', $request->id_deportista)->exists()) {
            return response()->json([
                'message' => 'El deportista no está vinculado a este tutor'
            ], 400);
        }

        // Si se marca como principal, quitar el principal anterior
        if ($request->principal) {
            DB::table('deportista_tutores')
                ->where('id_deportista', $request->id_deportista)
                ->update(['principal' => false]);
        }

        $tutor->deportistas()->updateExistingPivot($request->id_deportista, [
            'principal' => $request->principal
        ]);

        return response()->json([
            'message' => 'Relación actualizada exitosamente',
            'data' => $tutor->load('deportistas')
        ]);
    }

    // Listar deportistas de un tutor
    public function deportistas($id)
    {
        $tutor = Tutor::findOrFail($id);
        $deportistas = $tutor->deportistas()->withPivot('principal')->get();

        return response()->json([
            'tutor' => $tutor->nombre_completo,
            'total_deportistas' => $deportistas->count(),
            'deportistas' => $deportistas
        ]);
    }

    // Listar inscripciones realizadas por el tutor
    public function inscripciones($id)
    {
        $tutor = Tutor::findOrFail($id);
        $inscripciones = $tutor->inscripciones()
                              ->with('curso', 'grupo', 'deportista')
                              ->orderBy('fecha_inscripcion', 'desc')
                              ->get();

        return response()->json([
            'tutor' => $tutor->nombre_completo,
            'total_inscripciones' => $inscripciones->count(),
            'inscripciones' => $inscripciones
        ]);
    }

    // Activar/Desactivar tutor
    public function toggleActivo($id)
    {
        $tutor = Tutor::findOrFail($id);
        $tutor->activo = !$tutor->activo;
        $tutor->save();

        return response()->json([
            'message' => 'Estado del tutor actualizado exitosamente',
            'activo' => $tutor->activo,
            'data' => $tutor
        ]);
    }

    // Buscar tutor por cédula
    public function buscarPorCedula(Request $request)
    {
        $request->validate([
            'cedula' => 'required|string'
        ]);

        $tutor = Tutor::with('usuario', 'deportistas')
                     ->where('cedula', $request->cedula)
                     ->first();

        if (!$tutor) {
            return response()->json([
                'message' => 'No se encontró ningún tutor con esa cédula'
            ], 404);
        }

        return response()->json($tutor);
    }

    // Estadísticas del tutor
    public function estadisticas($id)
    {
        $tutor = Tutor::findOrFail($id);

        $stats = [
            'deportistas_registrados' => $tutor->deportistas()->count(),
            'deportistas_principales' => $tutor->deportistasPrincipales()->count(),
            'inscripciones_totales' => $tutor->inscripciones()->count(),
            'inscripciones_activas' => $tutor->inscripciones()->where('estado', 'activa')->count(),
            'cursos_distintos' => $tutor->inscripciones()->distinct('id_curso')->count()
        ];

        return response()->json($stats);
    }
}