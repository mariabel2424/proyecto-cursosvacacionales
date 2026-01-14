<?php
namespace App\Http\Controllers\API\Deportistas; 
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

use App\Models\Instructor;
use App\Models\Usuario;
use Illuminate\Http\Request;

class InstructorController extends Controller
{
    public function index(Request $request)
    {
        $query = Instructor::with('usuario', 'grupos');

        // Filtro por estado
        if ($request->has('activo')) {
            $query->where('activo', $request->activo);
        }

        // Filtro por especialidad
        if ($request->has('especialidad')) {
            $query->porEspecialidad($request->especialidad);
        }

        // Solo instructores con grupos asignados
        if ($request->has('con_grupos')) {
            $query->conGrupos();
        }

        // Búsqueda general
        if ($request->has('buscar')) {
            $query->buscar($request->buscar);
        }

        $instructores = $query->orderBy('id_instructor', 'desc')->paginate(15);
        return response()->json($instructores);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_usuario' => 'required|exists:usuarios,id_usuario',
            'especialidad' => 'required|string|max:100',
            'certificaciones' => 'nullable|string',
            'foto' => 'nullable|string',
            'activo' => 'sometimes|boolean'
        ]);

        // Verificar que el usuario no sea ya un instructor
        $existe = Instructor::where('id_usuario', $request->id_usuario)->exists();
        if ($existe) {
            return response()->json([
                'message' => 'Este usuario ya está registrado como instructor'
            ], 400);
        }

        $instructor = Instructor::create($request->all());

        return response()->json([
            'message' => 'Instructor registrado exitosamente',
            'data' => $instructor->load('usuario')
        ], 201);
    }

    public function show($id)
    {
        $instructor = Instructor::with('usuario', 'grupos.curso', 'gruposCoordinados')
                                ->findOrFail($id);
        
        return response()->json($instructor);
    }

    public function update(Request $request, $id)
    {
        $instructor = Instructor::findOrFail($id);

        $request->validate([
            'especialidad' => 'sometimes|string|max:100',
            'certificaciones' => 'nullable|string',
            'foto' => 'nullable|string',
            'activo' => 'sometimes|boolean'
        ]);

        $instructor->update($request->all());

        return response()->json([
            'message' => 'Instructor actualizado exitosamente',
            'data' => $instructor
        ]);
    }

    public function destroy($id)
    {
        $instructor = Instructor::findOrFail($id);
        
        // Verificar si tiene grupos asignados
        if ($instructor->grupos()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar el instructor porque tiene grupos asignados. Primero debe ser removido de los grupos.'
            ], 400);
        }

        $instructor->delete();

        return response()->json([
            'message' => 'Instructor eliminado exitosamente'
        ]);
    }

    // Listar grupos del instructor
    public function grupos($id)
    {
        $instructor = Instructor::with(['grupos' => function($query) {
            $query->with('curso')->withPivot('coordinador');
        }])->findOrFail($id);

        $grupos = $instructor->grupos->map(function($grupo) {
            return [
                'id_grupo' => $grupo->id_grupo,
                'nombre' => $grupo->nombre,
                'curso' => $grupo->curso->nombre,
                'horario' => $grupo->hora_inicio->format('H:i') . ' - ' . $grupo->hora_fin->format('H:i'),
                'dias_semana' => $grupo->dias_semana_nombres,
                'es_coordinador' => $grupo->pivot->coordinador,
                'cupo_actual' => $grupo->cupo_actual,
                'cupo_maximo' => $grupo->cupo_maximo,
                'estado' => $grupo->estado
            ];
        });

        return response()->json([
            'instructor' => $instructor->nombre_completo,
            'especialidad' => $instructor->especialidad,
            'total_grupos' => $grupos->count(),
            'grupos_coordinados' => $grupos->where('es_coordinador', true)->count(),
            'grupos' => $grupos
        ]);
    }

    // Listar grupos donde es coordinador
    public function gruposCoordinados($id)
    {
        $instructor = Instructor::findOrFail($id);
        $grupos = $instructor->gruposCoordinados()->with('curso')->get();

        return response()->json([
            'instructor' => $instructor->nombre_completo,
            'total_grupos_coordinados' => $grupos->count(),
            'grupos' => $grupos
        ]);
    }

    // Asignar grupo al instructor
    public function asignarGrupo(Request $request, $id)
    {
        $request->validate([
            'id_grupo' => 'required|exists:grupos_curso,id_grupo',
            'coordinador' => 'sometimes|boolean'
        ]);

        $instructor = Instructor::findOrFail($id);

        // Verificar si ya está asignado
        if ($instructor->grupos()->where('id_grupo', $request->id_grupo)->exists()) {
            return response()->json([
                'message' => 'Este instructor ya está asignado a este grupo'
            ], 400);
        }

        $instructor->grupos()->attach($request->id_grupo, [
            'coordinador' => $request->coordinador ?? false
        ]);

        return response()->json([
            'message' => 'Grupo asignado exitosamente al instructor',
            'data' => $instructor->load('grupos')
        ]);
    }

    // Quitar grupo del instructor
    public function quitarGrupo(Request $request, $id)
    {
        $request->validate([
            'id_grupo' => 'required|exists:grupos_curso,id_grupo'
        ]);

        $instructor = Instructor::findOrFail($id);

        if (!$instructor->grupos()->where('id_grupo', $request->id_grupo)->exists()) {
            return response()->json([
                'message' => 'Este instructor no está asignado a este grupo'
            ], 400);
        }

        $instructor->grupos()->detach($request->id_grupo);

        return response()->json([
            'message' => 'Grupo removido exitosamente del instructor'
        ]);
    }

    // Asistencias tomadas por el instructor
    public function asistenciasTomadas(Request $request, $id)
    {
        $instructor = Instructor::findOrFail($id);

        $query = $instructor->asistenciasTomadas()->with('deportista', 'grupo');

        // Filtro por fecha
        if ($request->has('fecha_desde') && $request->has('fecha_hasta')) {
            $query->whereBetween('fecha', [$request->fecha_desde, $request->fecha_hasta]);
        }

        // Filtro por grupo
        if ($request->has('id_grupo')) {
            $query->where('id_grupo', $request->id_grupo);
        }

        $asistencias = $query->orderBy('fecha', 'desc')->paginate(20);

        return response()->json([
            'instructor' => $instructor->nombre_completo,
            'total_asistencias' => $asistencias->total(),
            'asistencias' => $asistencias
        ]);
    }

    // Activar/Desactivar instructor
    public function toggleActivo($id)
    {
        $instructor = Instructor::findOrFail($id);
        $instructor->activo = !$instructor->activo;
        $instructor->save();

        return response()->json([
            'message' => 'Estado del instructor actualizado exitosamente',
            'activo' => $instructor->activo,
            'data' => $instructor
        ]);
    }

    // Estadísticas del instructor
    public function estadisticas($id)
    {
        $instructor = Instructor::findOrFail($id);

        $stats = [
            'nombre_completo' => $instructor->nombre_completo,
            'especialidad' => $instructor->especialidad,
            'activo' => $instructor->activo,
            'total_grupos' => $instructor->grupos()->count(),
            'grupos_coordinados' => $instructor->gruposCoordinados()->count(),
            'grupos_activos' => $instructor->grupos()->where('estado', 'activo')->count(),
            'asistencias_tomadas' => $instructor->asistenciasTomadas()->count(),
            'asistencias_este_mes' => $instructor->asistenciasTomadas()
                ->whereMonth('fecha', now()->month)
                ->whereYear('fecha', now()->year)
                ->count()
        ];

        return response()->json($stats);
    }

    // Horario semanal del instructor
    public function horarioSemanal($id)
    {
        $instructor = Instructor::with(['grupos' => function($query) {
            $query->where('estado', 'activo')->with('curso');
        }])->findOrFail($id);

        $horario = [];
        $dias = [
            1 => 'Lunes',
            2 => 'Martes',
            3 => 'Miércoles',
            4 => 'Jueves',
            5 => 'Viernes',
            6 => 'Sábado',
            7 => 'Domingo'
        ];

        foreach ($instructor->grupos as $grupo) {
            foreach ($grupo->dias_semana as $dia) {
                $diaNumero = is_numeric($dia) ? $dia : array_search(ucfirst($dia), $dias);
                
                if (!isset($horario[$diaNumero])) {
                    $horario[$diaNumero] = [
                        'dia' => $dias[$diaNumero],
                        'clases' => []
                    ];
                }

                $horario[$diaNumero]['clases'][] = [
                    'grupo' => $grupo->nombre,
                    'curso' => $grupo->curso->nombre,
                    'hora_inicio' => $grupo->hora_inicio->format('H:i'),
                    'hora_fin' => $grupo->hora_fin->format('H:i'),
                    'es_coordinador' => $grupo->pivot->coordinador
                ];
            }
        }

        // Ordenar por día de la semana
        ksort($horario);

        return response()->json([
            'instructor' => $instructor->nombre_completo,
            'horario_semanal' => array_values($horario)
        ]);
    }

    // Listar instructores disponibles (activos y sin grupos o con disponibilidad)
    public function disponibles(Request $request)
    {
        $query = Instructor::activos()->with('usuario', 'grupos');

        // Filtro por especialidad
        if ($request->has('especialidad')) {
            $query->porEspecialidad($request->especialidad);
        }

        $instructores = $query->get();

        return response()->json([
            'total' => $instructores->count(),
            'instructores' => $instructores
        ]);
    }
}