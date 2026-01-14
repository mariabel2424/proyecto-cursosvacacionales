<?php
namespace App\Http\Controllers\API\Deportistas;
use App\Http\Controllers\Controller;

use App\Models\Asistencia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AsistenciaController extends Controller
{
    public function index(Request $request)
    {
        // ← CAMBIO: Agregado 'grupo' al with
        $query = Asistencia::with('deportista', 'actividad', 'grupo');

        if ($request->has('id_deportista')) {
            $query->where('id_deportista', $request->id_deportista);
        }

        // ← NUEVO: Filtro por grupo
        if ($request->has('id_grupo')) {
            $query->where('id_grupo', $request->id_grupo);
        }

        if ($request->has('id_actividad')) {
            $query->where('id_actividad', $request->id_actividad);
        }

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('fecha')) {
            $query->whereDate('fecha', $request->fecha);
        }

        $asistencias = $query->orderBy('fecha', 'desc')->paginate(15);
        return response()->json($asistencias);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_deportista' => 'required|exists:deportistas,id_deportista',
            'id_grupo' => 'required|exists:grupos_curso,id_grupo', // ← NUEVO: obligatorio
            'id_actividad' => 'nullable|exists:actividades,id_actividad', // ← CAMBIO: ahora nullable
            'fecha' => 'required|date',
            'hora_llegada' => 'nullable|date_format:H:i',
            'estado' => 'required|in:presente,ausente,tarde,justificado',
            'observaciones' => 'nullable|string'
        ]);

        // ← CAMBIO: Ahora incluye id_grupo en el unique check
        $asistencia = Asistencia::updateOrCreate(
            [
                'id_deportista' => $request->id_deportista,
                'id_grupo' => $request->id_grupo,
                'fecha' => $request->fecha
            ],
            [
                'id_actividad' => $request->id_actividad,
                'hora_llegada' => $request->hora_llegada,
                'estado' => $request->estado,
                'observaciones' => $request->observaciones,
                'created_by' => Auth::id()
            ]
        );

        // ← CAMBIO: Agregado 'grupo' al load
        return response()->json([
            'message' => 'Asistencia registrada exitosamente',
            'data' => $asistencia->load('deportista', 'actividad', 'grupo')
        ], 201);
    }

    public function show($id)
    {
        // ← CAMBIO: Agregado 'grupo' al with
        $asistencia = Asistencia::with('deportista', 'actividad', 'grupo')->findOrFail($id);
        return response()->json($asistencia);
    }

    public function update(Request $request, $id)
    {
        $asistencia = Asistencia::findOrFail($id);

        $request->validate([
            'hora_llegada' => 'nullable|date_format:H:i',
            'estado' => 'sometimes|in:presente,ausente,tarde,justificado',
            'observaciones' => 'nullable|string'
        ]);

        $asistencia->update($request->all());

        return response()->json([
            'message' => 'Asistencia actualizada exitosamente',
            'data' => $asistencia
        ]);
    }

    public function destroy($id)
    {
        $asistencia = Asistencia::findOrFail($id);
        $asistencia->delete();

        return response()->json([
            'message' => 'Asistencia eliminada exitosamente'
        ]);
    }

    public function reporteDeportista(Request $request, $idDeportista)
    {
        $request->validate([
            'fecha_desde' => 'required|date',
            'fecha_hasta' => 'required|date|after_or_equal:fecha_desde'
        ]);

        $asistencias = Asistencia::where('id_deportista', $idDeportista)
                                 ->whereBetween('fecha', [$request->fecha_desde, $request->fecha_hasta])
                                 ->get();

        $reporte = [
            'total' => $asistencias->count(),
            'presentes' => $asistencias->where('estado', 'presente')->count(),
            'ausentes' => $asistencias->where('estado', 'ausente')->count(),
            'tarde' => $asistencias->where('estado', 'tarde')->count(),
            'justificados' => $asistencias->where('estado', 'justificado')->count(),
            'porcentaje_asistencia' => $asistencias->count() > 0 
                ? round(($asistencias->whereIn('estado', ['presente', 'tarde'])->count() / $asistencias->count()) * 100, 2)
                : 0
        ];

        return response()->json($reporte);
    }

    // ← NUEVO: Reporte por grupo
    public function reporteGrupo(Request $request, $idGrupo)
    {
        $request->validate([
            'fecha' => 'required|date'
        ]);

        $asistencias = Asistencia::where('id_grupo', $idGrupo)
                                 ->whereDate('fecha', $request->fecha)
                                 ->with('deportista')
                                 ->get();

        $reporte = [
            'fecha' => $request->fecha,
            'total_deportistas' => $asistencias->count(),
            'presentes' => $asistencias->where('estado', 'presente')->count(),
            'ausentes' => $asistencias->where('estado', 'ausente')->count(),
            'tarde' => $asistencias->where('estado', 'tarde')->count(),
            'justificados' => $asistencias->where('estado', 'justificado')->count(),
            'porcentaje_asistencia' => $asistencias->count() > 0 
                ? round(($asistencias->whereIn('estado', ['presente', 'tarde'])->count() / $asistencias->count()) * 100, 2)
                : 0,
            'asistencias' => $asistencias
        ];

        return response()->json($reporte);
    }

    // ← NUEVO: Tomar asistencia masiva de un grupo
    public function tomarAsistenciaGrupo(Request $request, $idGrupo)
    {
        $request->validate([
            'fecha' => 'required|date',
            'asistencias' => 'required|array',
            'asistencias.*.id_deportista' => 'required|exists:deportistas,id_deportista',
            'asistencias.*.estado' => 'required|in:presente,ausente,tarde,justificado',
            'asistencias.*.hora_llegada' => 'nullable|date_format:H:i',
            'asistencias.*.observaciones' => 'nullable|string'
        ]);

        $registradas = [];

        foreach ($request->asistencias as $item) {
            $asistencia = Asistencia::updateOrCreate(
                [
                    'id_deportista' => $item['id_deportista'],
                    'id_grupo' => $idGrupo,
                    'fecha' => $request->fecha
                ],
                [
                    'estado' => $item['estado'],
                    'hora_llegada' => $item['hora_llegada'] ?? null,
                    'observaciones' => $item['observaciones'] ?? null,
                    'created_by' => Auth::id()
                ]
            );

            $registradas[] = $asistencia;
        }

        return response()->json([
            'message' => 'Asistencia del grupo registrada exitosamente',
            'total_registradas' => count($registradas),
            'data' => $registradas
        ], 201);
    }
}