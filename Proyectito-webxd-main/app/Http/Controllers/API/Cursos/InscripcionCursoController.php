<?php
namespace App\Http\Controllers\API\Cursos;
use App\Http\Controllers\Controller;

use App\Models\InscripcionCurso;
use App\Models\Curso;
use App\Models\GrupoCurso;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class InscripcionCursoController extends Controller
{
    public function index(Request $request)
    {
        // ← CAMBIO: Agregado 'grupo' y 'deportista' al with
        $query = InscripcionCurso::with('curso', 'grupo', 'usuario', 'deportista');

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('id_curso')) {
            $query->where('id_curso', $request->id_curso);
        }

        // ← NUEVO: Filtro por grupo
        if ($request->has('id_grupo')) {
            $query->where('id_grupo', $request->id_grupo);
        }

        if ($request->has('id_usuario')) {
            $query->where('id_usuario', $request->id_usuario);
        }

        // ← NUEVO: Filtro por deportista
        if ($request->has('id_deportista')) {
            $query->where('id_deportista', $request->id_deportista);
        }

        $inscripciones = $query->paginate(15);
        return response()->json($inscripciones);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_curso' => 'required|exists:cursos,id_curso',
            'id_grupo' => 'required|exists:grupos_curso,id_grupo', // ← NUEVO: obligatorio
            'id_usuario' => 'required|exists:usuarios,id_usuario', // El tutor que inscribe
            'id_deportista' => 'required|exists:deportistas,id_deportista', // ← NUEVO: obligatorio
            'observaciones' => 'nullable|string'
        ]);

        // ← CAMBIO: Ahora verificamos cupo del GRUPO, no del curso
        $grupo = GrupoCurso::findOrFail($request->id_grupo);

        if (!$grupo->tieneCupoDisponible()) {
            return response()->json([
                'message' => 'No hay cupos disponibles en este grupo'
            ], 400);
        }

        // ← CAMBIO: Verificar si el deportista ya está inscrito en este grupo
        $existe = InscripcionCurso::where('id_grupo', $request->id_grupo)
                                  ->where('id_deportista', $request->id_deportista)
                                  ->where('estado', 'activa')
                                  ->exists();

        if ($existe) {
            return response()->json([
                'message' => 'El deportista ya está inscrito en este grupo'
            ], 400);
        }

        // ← CAMBIO: Validar que el grupo pertenezca al curso
        if ($grupo->id_curso != $request->id_curso) {
            return response()->json([
                'message' => 'El grupo no pertenece al curso seleccionado'
            ], 400);
        }

        $inscripcion = InscripcionCurso::create([
            'id_curso' => $request->id_curso,
            'id_grupo' => $request->id_grupo, // ← NUEVO
            'id_usuario' => $request->id_usuario,
            'id_deportista' => $request->id_deportista, // ← NUEVO
            'fecha_inscripcion' => now(),
            'observaciones' => $request->observaciones,
            'estado' => 'activa',
            'created_by' => Auth::id()
        ]);

        // ← CAMBIO: Incrementar cupo del GRUPO, no del curso
        $grupo->incrementarCupo();

        // ← CAMBIO: Cargar todas las relaciones
        return response()->json([
            'message' => 'Inscripción realizada exitosamente',
            'data' => $inscripcion->load('curso', 'grupo', 'usuario', 'deportista')
        ], 201);
    }

    public function show($id)
    {
        // ← CAMBIO: Agregado 'grupo' y 'deportista' al with
        $inscripcion = InscripcionCurso::with('curso', 'grupo', 'usuario', 'deportista')->findOrFail($id);
        return response()->json($inscripcion);
    }

    public function update(Request $request, $id)
    {
        $inscripcion = InscripcionCurso::findOrFail($id);

        $request->validate([
            'estado' => 'sometimes|in:activa,completada,cancelada,abandonada',
            'calificacion' => 'nullable|numeric|min:0|max:10',
            'comentarios' => 'nullable|string',
            'observaciones' => 'nullable|string'
        ]);

        $estadoAnterior = $inscripcion->estado;
        $inscripcion->update($request->all());

        // ← CAMBIO: Decrementar cupo del GRUPO, no del curso
        if (in_array($inscripcion->estado, ['cancelada', 'abandonada']) && $estadoAnterior === 'activa') {
            $inscripcion->grupo->decrementarCupo();
        }

        return response()->json([
            'message' => 'Inscripción actualizada exitosamente',
            'data' => $inscripcion
        ]);
    }

    public function destroy($id)
    {
        $inscripcion = InscripcionCurso::findOrFail($id);
        
        // ← CAMBIO: Decrementar cupo del GRUPO
        if ($inscripcion->estado === 'activa') {
            $inscripcion->grupo->decrementarCupo();
        }
        
        $inscripcion->delete();

        return response()->json([
            'message' => 'Inscripción eliminada exitosamente'
        ]);
    }

    public function calificar(Request $request, $id)
    {
        $request->validate([
            'calificacion' => 'required|numeric|min:0|max:10',
            'comentarios' => 'nullable|string'
        ]);

        $inscripcion = InscripcionCurso::findOrFail($id);
        
        $inscripcion->update([
            'calificacion' => $request->calificacion,
            'comentarios' => $request->comentarios,
            'estado' => 'completada'
        ]);

        return response()->json([
            'message' => 'Calificación registrada exitosamente',
            'data' => $inscripcion
        ]);
    }

    // ← NUEVO: Listar inscripciones de un grupo específico
    public function inscripcionesGrupo($idGrupo)
    {
        $inscripciones = InscripcionCurso::with('deportista', 'usuario')
                                         ->where('id_grupo', $idGrupo)
                                         ->where('estado', 'activa')
                                         ->get();

        return response()->json([
            'total' => $inscripciones->count(),
            'inscripciones' => $inscripciones
        ]);
    }

    // ← NUEVO: Listar cursos disponibles para inscripción (con grupos)
    public function cursosDisponibles()
    {
        $cursos = Curso::with(['grupos' => function($query) {
            $query->where('estado', 'activo')
                  ->whereRaw('cupo_actual < cupo_maximo');
        }])
        ->where('estado', 'activo')
        ->whereDate('fecha_inicio', '<=', now())
        ->whereDate('fecha_fin', '>=', now())
        ->get();

        return response()->json($cursos);
    }
}