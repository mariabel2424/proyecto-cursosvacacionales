<?php
namespace App\Http\Controllers\API\Cursos;
use App\Http\Controllers\Controller;

use App\Models\GrupoCurso;
use App\Models\Curso;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GrupoCursoController extends Controller
{
    public function index(Request $request)
    {
        $query = GrupoCurso::with('curso', 'instructores');

        // Filtro por curso
        if ($request->has('id_curso')) {
            $query->where('id_curso', $request->id_curso);
        }

        // Filtro por estado
        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        // Solo grupos activos
        if ($request->has('activos')) {
            $query->activos();
        }

        // Solo grupos con cupo disponible
        if ($request->has('con_cupo')) {
            $query->conCupoDisponible();
        }

        // Búsqueda por nombre
        if ($request->has('buscar')) {
            $query->where('nombre', 'like', '%' . $request->buscar . '%');
        }

        $grupos = $query->orderBy('nombre', 'asc')->paginate(15);
        return response()->json($grupos);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_curso' => 'required|exists:cursos,id_curso',
            'nombre' => 'required|string|max:100',
            'cupo_maximo' => 'required|integer|min:1',
            'hora_inicio' => 'required|date_format:H:i',
            'hora_fin' => 'required|date_format:H:i|after:hora_inicio',
            'dias_semana' => 'required|array|min:1',
            'dias_semana.*' => 'in:1,2,3,4,5,6,7,lunes,martes,miércoles,miercoles,jueves,viernes,sábado,sabado,domingo',
            'estado' => 'sometimes|in:activo,inactivo,completo,cancelado'
        ]);

        // Verificar que el curso exista y esté activo
        $curso = Curso::findOrFail($request->id_curso);
        if ($curso->estado !== 'activo') {
            return response()->json([
                'message' => 'No se puede crear un grupo para un curso inactivo'
            ], 400);
        }

        $grupo = GrupoCurso::create([
            'id_curso' => $request->id_curso,
            'nombre' => $request->nombre,
            'cupo_maximo' => $request->cupo_maximo,
            'cupo_actual' => 0,
            'hora_inicio' => $request->hora_inicio,
            'hora_fin' => $request->hora_fin,
            'dias_semana' => $request->dias_semana,
            'estado' => $request->estado ?? 'activo',
            'created_by' => Auth::id()
        ]);

        return response()->json([
            'message' => 'Grupo creado exitosamente',
            'data' => $grupo->load('curso')
        ], 201);
    }

    public function show($id)
    {
        $grupo = GrupoCurso::with('curso', 'instructores', 'inscripciones.deportista')
                          ->findOrFail($id);
        
        // Agregar información adicional
        $grupo->cupos_disponibles = $grupo->cupos_disponibles;
        $grupo->dias_semana_nombres = $grupo->dias_semana_nombres;

        return response()->json($grupo);
    }

    public function update(Request $request, $id)
    {
        $grupo = GrupoCurso::findOrFail($id);

        $request->validate([
            'nombre' => 'sometimes|string|max:100',
            'cupo_maximo' => 'sometimes|integer|min:1',
            'hora_inicio' => 'sometimes|date_format:H:i',
            'hora_fin' => 'sometimes|date_format:H:i|after:hora_inicio',
            'dias_semana' => 'sometimes|array|min:1',
            'dias_semana.*' => 'in:1,2,3,4,5,6,7,lunes,martes,miércoles,miercoles,jueves,viernes,sábado,sabado,domingo',
            'estado' => 'sometimes|in:activo,inactivo,completo,cancelado'
        ]);

        // Validar que el cupo máximo no sea menor al cupo actual
        if ($request->has('cupo_maximo') && $request->cupo_maximo < $grupo->cupo_actual) {
            return response()->json([
                'message' => 'El cupo máximo no puede ser menor al cupo actual (' . $grupo->cupo_actual . ')'
            ], 400);
        }

        $grupo->update($request->all());

        // Si se aumentó el cupo y el grupo estaba completo, activarlo
        if ($request->has('cupo_maximo') && $grupo->cupo_actual < $grupo->cupo_maximo && $grupo->estado === 'completo') {
            $grupo->update(['estado' => 'activo']);
        }

        return response()->json([
            'message' => 'Grupo actualizado exitosamente',
            'data' => $grupo
        ]);
    }

    public function destroy($id)
    {
        $grupo = GrupoCurso::findOrFail($id);
        
        // Verificar si tiene inscripciones activas
        $inscripcionesActivas = $grupo->inscripciones()->where('estado', 'activa')->count();
        
        if ($inscripcionesActivas > 0) {
            return response()->json([
                'message' => 'No se puede eliminar el grupo porque tiene ' . $inscripcionesActivas . ' inscripciones activas'
            ], 400);
        }

        $grupo->delete();

        return response()->json([
            'message' => 'Grupo eliminado exitosamente'
        ]);
    }

    // Listar deportistas inscritos en el grupo
    public function deportistas($id)
    {
        $grupo = GrupoCurso::with(['inscripciones' => function($query) {
            $query->where('estado', 'activa')->with('deportista', 'usuario');
        }])->findOrFail($id);

        return response()->json([
            'grupo' => $grupo->nombre,
            'curso' => $grupo->curso->nombre,
            'cupo_actual' => $grupo->cupo_actual,
            'cupo_maximo' => $grupo->cupo_maximo,
            'cupos_disponibles' => $grupo->cupos_disponibles,
            'total_deportistas' => $grupo->inscripciones->count(),
            'deportistas' => $grupo->inscripciones
        ]);
    }

    // Asignar instructor al grupo
    public function asignarInstructor(Request $request, $id)
    {
        $request->validate([
            'id_instructor' => 'required|exists:instructores,id_instructor',
            'coordinador' => 'sometimes|boolean'
        ]);

        $grupo = GrupoCurso::findOrFail($id);

        // Verificar si ya está asignado
        if ($grupo->instructores()->where('id_instructor', $request->id_instructor)->exists()) {
            return response()->json([
                'message' => 'Este instructor ya está asignado a este grupo'
            ], 400);
        }

        // Si se marca como coordinador, quitar coordinador anterior
        if ($request->coordinador) {
            $grupo->instructores()->updateExistingPivot(
                $grupo->instructores()->pluck('id_instructor')->toArray(),
                ['coordinador' => false]
            );
        }

        $grupo->instructores()->attach($request->id_instructor, [
            'coordinador' => $request->coordinador ?? false
        ]);

        return response()->json([
            'message' => 'Instructor asignado exitosamente al grupo',
            'data' => $grupo->load('instructores')
        ]);
    }

    // Quitar instructor del grupo
    public function quitarInstructor(Request $request, $id)
    {
        $request->validate([
            'id_instructor' => 'required|exists:instructores,id_instructor'
        ]);

        $grupo = GrupoCurso::findOrFail($id);

        if (!$grupo->instructores()->where('id_instructor', $request->id_instructor)->exists()) {
            return response()->json([
                'message' => 'Este instructor no está asignado a este grupo'
            ], 400);
        }

        $grupo->instructores()->detach($request->id_instructor);

        return response()->json([
            'message' => 'Instructor removido exitosamente del grupo'
        ]);
    }

    // Actualizar si es coordinador
    public function actualizarCoordinador(Request $request, $id)
    {
        $request->validate([
            'id_instructor' => 'required|exists:instructores,id_instructor',
            'coordinador' => 'required|boolean'
        ]);

        $grupo = GrupoCurso::findOrFail($id);

        if (!$grupo->instructores()->where('id_instructor', $request->id_instructor)->exists()) {
            return response()->json([
                'message' => 'Este instructor no está asignado a este grupo'
            ], 400);
        }

        // Si se marca como coordinador, quitar coordinador anterior
        if ($request->coordinador) {
            $grupo->instructores()->updateExistingPivot(
                $grupo->instructores()->pluck('id_instructor')->toArray(),
                ['coordinador' => false]
            );
        }

        $grupo->instructores()->updateExistingPivot($request->id_instructor, [
            'coordinador' => $request->coordinador
        ]);

        return response()->json([
            'message' => 'Coordinador actualizado exitosamente',
            'data' => $grupo->load('instructores')
        ]);
    }

    // Listar instructores del grupo
    public function instructores($id)
    {
        $grupo = GrupoCurso::with('instructores.usuario')->findOrFail($id);

        return response()->json([
            'grupo' => $grupo->nombre,
            'total_instructores' => $grupo->instructores->count(),
            'coordinador' => $grupo->coordinador(),
            'instructores' => $grupo->instructores
        ]);
    }

    // Cambiar estado del grupo
    public function cambiarEstado(Request $request, $id)
    {
        $request->validate([
            'estado' => 'required|in:activo,inactivo,completo,cancelado'
        ]);

        $grupo = GrupoCurso::findOrFail($id);
        $grupo->estado = $request->estado;
        $grupo->save();

        return response()->json([
            'message' => 'Estado del grupo actualizado exitosamente',
            'estado' => $grupo->estado,
            'data' => $grupo
        ]);
    }

    // Estadísticas del grupo
    public function estadisticas($id)
    {
        $grupo = GrupoCurso::findOrFail($id);

        $stats = [
            'nombre' => $grupo->nombre,
            'curso' => $grupo->curso->nombre,
            'cupo_maximo' => $grupo->cupo_maximo,
            'cupo_actual' => $grupo->cupo_actual,
            'cupos_disponibles' => $grupo->cupos_disponibles,
            'porcentaje_ocupacion' => $grupo->cupo_maximo > 0 ? round(($grupo->cupo_actual / $grupo->cupo_maximo) * 100, 2) : 0,
            'inscripciones_activas' => $grupo->inscripciones()->where('estado', 'activa')->count(),
            'inscripciones_completadas' => $grupo->inscripciones()->where('estado', 'completada')->count(),
            'inscripciones_canceladas' => $grupo->inscripciones()->where('estado', 'cancelada')->count(),
            'total_instructores' => $grupo->instructores()->count(),
            'tiene_coordinador' => $grupo->coordinador() !== null,
            'dias_semana' => $grupo->dias_semana_nombres,
            'horario' => $grupo->hora_inicio->format('H:i') . ' - ' . $grupo->hora_fin->format('H:i')
        ];

        return response()->json($stats);
    }

    // Grupos disponibles para inscripción de un curso
    public function gruposDisponibles($idCurso)
    {
        $grupos = GrupoCurso::where('id_curso', $idCurso)
                           ->activos()
                           ->conCupoDisponible()
                           ->with('instructores')
                           ->get();

        return response()->json([
            'curso_id' => $idCurso,
            'total_grupos' => $grupos->count(),
            'grupos' => $grupos
        ]);
    }
}