<?php
namespace App\Http\Controllers\API\Deportistas; 
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

use App\Models\InstructorGrupo;
use App\Models\Instructor;
use App\Models\GrupoCurso;
use Illuminate\Http\Request;

class InstructorGrupoController extends Controller
{
    public function index(Request $request)
    {
        $query = InstructorGrupo::with('instructor.usuario', 'grupo.curso');

        // Filtro por instructor
        if ($request->has('id_instructor')) {
            $query->delInstructor($request->id_instructor);
        }

        // Filtro por grupo
        if ($request->has('id_grupo')) {
            $query->delGrupo($request->id_grupo);
        }

        // Solo coordinadores
        if ($request->has('coordinadores')) {
            $query->coordinadores();
        }

        $asignaciones = $query->paginate(15);
        return response()->json($asignaciones);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_instructor' => 'required|exists:instructores,id_instructor',
            'id_grupo' => 'required|exists:grupos_curso,id_grupo',
            'coordinador' => 'sometimes|boolean'
        ]);

        // Verificar que el instructor esté activo
        $instructor = Instructor::findOrFail($request->id_instructor);
        if (!$instructor->activo) {
            return response()->json([
                'message' => 'No se puede asignar un instructor inactivo'
            ], 400);
        }

        // Verificar que el grupo esté activo
        $grupo = GrupoCurso::findOrFail($request->id_grupo);
        if ($grupo->estado !== 'activo') {
            return response()->json([
                'message' => 'No se puede asignar instructores a un grupo inactivo'
            ], 400);
        }

        // Verificar si ya existe la asignación
        $existe = InstructorGrupo::where('id_instructor', $request->id_instructor)
                                 ->where('id_grupo', $request->id_grupo)
                                 ->exists();

        if ($existe) {
            return response()->json([
                'message' => 'Este instructor ya está asignado a este grupo'
            ], 400);
        }

        // Si se marca como coordinador, quitar coordinador anterior de ese grupo
        if ($request->coordinador) {
            InstructorGrupo::where('id_grupo', $request->id_grupo)
                          ->update(['coordinador' => false]);
        }

        $asignacion = InstructorGrupo::create([
            'id_instructor' => $request->id_instructor,
            'id_grupo' => $request->id_grupo,
            'coordinador' => $request->coordinador ?? false
        ]);

        return response()->json([
            'message' => 'Instructor asignado al grupo exitosamente',
            'data' => $asignacion->load('instructor.usuario', 'grupo.curso')
        ], 201);
    }

    public function show($id)
    {
        $asignacion = InstructorGrupo::with('instructor.usuario', 'grupo.curso')
                                     ->findOrFail($id);
        return response()->json($asignacion);
    }

    public function update(Request $request, $id)
    {
        $asignacion = InstructorGrupo::findOrFail($id);

        $request->validate([
            'coordinador' => 'required|boolean'
        ]);

        // Si se marca como coordinador, quitar coordinador anterior de ese grupo
        if ($request->coordinador) {
            InstructorGrupo::where('id_grupo', $asignacion->id_grupo)
                          ->where('id', '!=', $id)
                          ->update(['coordinador' => false]);
        }

        $asignacion->update(['coordinador' => $request->coordinador]);

        return response()->json([
            'message' => 'Asignación actualizada exitosamente',
            'data' => $asignacion->load('instructor.usuario', 'grupo.curso')
        ]);
    }

    public function destroy($id)
    {
        $asignacion = InstructorGrupo::findOrFail($id);
        
        // Verificar que el grupo tenga al menos otro instructor
        $totalInstructores = InstructorGrupo::where('id_grupo', $asignacion->id_grupo)->count();
        
        if ($totalInstructores <= 1) {
            return response()->json([
                'message' => 'No se puede eliminar. El grupo debe tener al menos un instructor asignado.'
            ], 400);
        }

        // Si era coordinador, asignar otro como coordinador
        if ($asignacion->coordinador) {
            $nuevoCoordinador = InstructorGrupo::where('id_grupo', $asignacion->id_grupo)
                                              ->where('id', '!=', $id)
                                              ->first();
            
            if ($nuevoCoordinador) {
                $nuevoCoordinador->update(['coordinador' => true]);
            }
        }

        $asignacion->delete();

        return response()->json([
            'message' => 'Instructor removido del grupo exitosamente'
        ]);
    }

    // Listar instructores de un grupo
    public function instructoresDeGrupo($idGrupo)
    {
        $grupo = GrupoCurso::with('curso')->findOrFail($idGrupo);
        
        $instructores = InstructorGrupo::with('instructor.usuario')
                                      ->where('id_grupo', $idGrupo)
                                      ->get();

        $coordinador = $instructores->where('coordinador', true)->first();

        return response()->json([
            'grupo' => $grupo->nombre,
            'curso' => $grupo->curso->nombre,
            'horario' => $grupo->hora_inicio->format('H:i') . ' - ' . $grupo->hora_fin->format('H:i'),
            'total_instructores' => $instructores->count(),
            'coordinador' => $coordinador ? [
                'id_instructor' => $coordinador->instructor->id_instructor,
                'nombre' => $coordinador->instructor->nombre_completo,
                'especialidad' => $coordinador->instructor->especialidad
            ] : null,
            'instructores' => $instructores->map(function($asig) {
                return [
                    'id_asignacion' => $asig->id,
                    'id_instructor' => $asig->instructor->id_instructor,
                    'nombre' => $asig->instructor->nombre_completo,
                    'especialidad' => $asig->instructor->especialidad,
                    'coordinador' => $asig->coordinador
                ];
            })
        ]);
    }

    // Listar grupos de un instructor
    public function gruposDeInstructor($idInstructor)
    {
        $instructor = Instructor::with('usuario')->findOrFail($idInstructor);
        
        $grupos = InstructorGrupo::with('grupo.curso')
                                ->where('id_instructor', $idInstructor)
                                ->get();

        $gruposCoordinados = $grupos->where('coordinador', true);

        return response()->json([
            'instructor' => $instructor->nombre_completo,
            'especialidad' => $instructor->especialidad,
            'total_grupos' => $grupos->count(),
            'grupos_coordinados' => $gruposCoordinados->count(),
            'grupos' => $grupos->map(function($asig) {
                return [
                    'id_asignacion' => $asig->id,
                    'id_grupo' => $asig->grupo->id_grupo,
                    'nombre_grupo' => $asig->grupo->nombre,
                    'curso' => $asig->grupo->curso->nombre,
                    'horario' => $asig->grupo->hora_inicio->format('H:i') . ' - ' . $asig->grupo->hora_fin->format('H:i'),
                    'dias_semana' => $asig->grupo->dias_semana_nombres,
                    'estado' => $asig->grupo->estado,
                    'coordinador' => $asig->coordinador,
                    'cupo_actual' => $asig->grupo->cupo_actual,
                    'cupo_maximo' => $asig->grupo->cupo_maximo
                ];
            })
        ]);
    }

    // Cambiar coordinador de un grupo
    public function cambiarCoordinador(Request $request, $idGrupo)
    {
        $request->validate([
            'id_instructor' => 'required|exists:instructores,id_instructor'
        ]);

        $grupo = GrupoCurso::findOrFail($idGrupo);

        // Verificar que el instructor esté asignado al grupo
        $asignacion = InstructorGrupo::where('id_grupo', $idGrupo)
                                     ->where('id_instructor', $request->id_instructor)
                                     ->first();

        if (!$asignacion) {
            return response()->json([
                'message' => 'El instructor seleccionado no está asignado a este grupo'
            ], 400);
        }

        // Quitar coordinador de todos los instructores de este grupo
        InstructorGrupo::where('id_grupo', $idGrupo)
                      ->update(['coordinador' => false]);

        // Marcar el nuevo como coordinador
        $asignacion->update(['coordinador' => true]);

        return response()->json([
            'message' => 'Coordinador del grupo actualizado exitosamente',
            'data' => $asignacion->load('instructor.usuario', 'grupo.curso')
        ]);
    }

    // Asignar múltiples instructores a un grupo
    public function asignarMultiples(Request $request, $idGrupo)
    {
        $request->validate([
            'instructores' => 'required|array|min:1',
            'instructores.*.id_instructor' => 'required|exists:instructores,id_instructor',
            'instructores.*.coordinador' => 'sometimes|boolean'
        ]);

        $grupo = GrupoCurso::findOrFail($idGrupo);
        $asignados = [];
        $errores = [];

        foreach ($request->instructores as $item) {
            // Verificar si ya está asignado
            $existe = InstructorGrupo::where('id_instructor', $item['id_instructor'])
                                     ->where('id_grupo', $idGrupo)
                                     ->exists();

            if ($existe) {
                $errores[] = "Instructor ID {$item['id_instructor']} ya está asignado";
                continue;
            }

            $asignacion = InstructorGrupo::create([
                'id_instructor' => $item['id_instructor'],
                'id_grupo' => $idGrupo,
                'coordinador' => $item['coordinador'] ?? false
            ]);

            $asignados[] = $asignacion;
        }

        return response()->json([
            'message' => 'Proceso completado',
            'asignados' => count($asignados),
            'errores' => $errores,
            'data' => $asignados
        ], 201);
    }

    // Reasignar todos los grupos de un instructor a otro
    public function reasignarGrupos(Request $request, $idInstructorOrigen)
    {
        $request->validate([
            'id_instructor_destino' => 'required|exists:instructores,id_instructor'
        ]);

        $instructorOrigen = Instructor::findOrFail($idInstructorOrigen);
        $instructorDestino = Instructor::findOrFail($request->id_instructor_destino);

        if (!$instructorDestino->activo) {
            return response()->json([
                'message' => 'El instructor destino debe estar activo'
            ], 400);
        }

        $grupos = InstructorGrupo::where('id_instructor', $idInstructorOrigen)->get();
        $reasignados = 0;

        foreach ($grupos as $asignacion) {
            // Verificar si el instructor destino ya está en ese grupo
            $existe = InstructorGrupo::where('id_instructor', $request->id_instructor_destino)
                                     ->where('id_grupo', $asignacion->id_grupo)
                                     ->exists();

            if (!$existe) {
                // Crear nueva asignación para el instructor destino
                InstructorGrupo::create([
                    'id_instructor' => $request->id_instructor_destino,
                    'id_grupo' => $asignacion->id_grupo,
                    'coordinador' => $asignacion->coordinador
                ]);
                
                $reasignados++;
            }

            // Eliminar asignación original
            $asignacion->delete();
        }

        return response()->json([
            'message' => 'Grupos reasignados exitosamente',
            'total_reasignados' => $reasignados,
            'instructor_origen' => $instructorOrigen->nombre_completo,
            'instructor_destino' => $instructorDestino->nombre_completo
        ]);
    }

    // Validar si un instructor puede tomar asistencia en un grupo
    public function validarAcceso(Request $request)
    {
        $request->validate([
            'id_instructor' => 'required|exists:instructores,id_instructor',
            'id_grupo' => 'required|exists:grupos_curso,id_grupo'
        ]);

        $tieneAcceso = InstructorGrupo::where('id_instructor', $request->id_instructor)
                                      ->where('id_grupo', $request->id_grupo)
                                      ->exists();

        $esCoordinador = false;
        if ($tieneAcceso) {
            $asignacion = InstructorGrupo::where('id_instructor', $request->id_instructor)
                                         ->where('id_grupo', $request->id_grupo)
                                         ->first();
            $esCoordinador = $asignacion->coordinador;
        }

        return response()->json([
            'tiene_acceso' => $tieneAcceso,
            'es_coordinador' => $esCoordinador
        ]);
    }

    // Obtener estadísticas de asignaciones
    public function estadisticas()
    {
        $stats = [
            'total_asignaciones' => InstructorGrupo::count(),
            'total_coordinadores' => InstructorGrupo::where('coordinador', true)->count(),
            'instructores_con_grupos' => InstructorGrupo::distinct('id_instructor')->count(),
            'grupos_con_instructores' => InstructorGrupo::distinct('id_grupo')->count(),
            'promedio_instructores_por_grupo' => round(
                InstructorGrupo::count() / max(GrupoCurso::count(), 1), 
                2
            )
        ];

        return response()->json($stats);
    }
}