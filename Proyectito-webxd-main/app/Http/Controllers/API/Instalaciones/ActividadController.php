<?php
namespace App\Http\Controllers\API\Instalaciones;

use App\Http\Controllers\Controller;
use App\Models\Actividad;
use Illuminate\Http\Request;

class ActividadController extends Controller
{
    public function index(Request $request)
    {
        $query = Actividad::with('escenarios');

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        if ($request->has('fecha')) {
            $query->whereDate('fecha', $request->fecha);
        }

        if ($request->has('fecha_desde')) {
            $query->whereDate('fecha', '>=', $request->fecha_desde);
        }

        if ($request->has('fecha_hasta')) {
            $query->whereDate('fecha', '<=', $request->fecha_hasta);
        }

        $actividades = $query->orderBy('fecha', 'desc')->orderBy('hora_inicio')->paginate(15);
        return response()->json($actividades);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre_actividad' => 'required|string|max:100',
            'descripcion' => 'nullable|string',
            'fecha' => 'required|date',
            'hora_inicio' => 'required|date_format:H:i',
            'hora_fin' => 'required|date_format:H:i|after:hora_inicio',
            'tipo' => 'required|in:entrenamiento,partido,evento,reunion,otro',
            'cupo_maximo' => 'nullable|integer|min:1',
            'observaciones' => 'nullable|string',
            'id_escenario' => 'nullable|exists:escenarios,id_escenario'
        ]);

        $actividad = Actividad::create($request->except('id_escenario'));

        // Asignar escenario si viene
        if ($request->filled('id_escenario')) {
            $actividad->escenarios()->attach($request->id_escenario);
        }

        return response()->json([
            'message' => 'Actividad creada exitosamente',
            'data' => $actividad->load('escenarios')
        ], 201);
    }

    public function show($id)
    {
        $actividad = Actividad::with('escenarios', 'asistencias.deportista')->findOrFail($id);
        return response()->json($actividad);
    }

    public function update(Request $request, $id)
    {
        $actividad = Actividad::findOrFail($id);

        $request->validate([
            'nombre_actividad' => 'sometimes|string|max:100',
            'descripcion' => 'nullable|string',
            'fecha' => 'sometimes|date',
            'hora_inicio' => 'sometimes|date_format:H:i',
            'hora_fin' => 'sometimes|date_format:H:i|after:hora_inicio',
            'tipo' => 'sometimes|in:entrenamiento,partido,evento,reunion,otro',
            'estado' => 'sometimes|in:programada,en_curso,finalizada,cancelada',
            'cupo_maximo' => 'nullable|integer|min:1',
            'observaciones' => 'nullable|string'
        ]);

        $actividad->update($request->all());

        return response()->json([
            'message' => 'Actividad actualizada exitosamente',
            'data' => $actividad
        ]);
    }

    public function destroy($id)
    {
        $actividad = Actividad::findOrFail($id);
        $actividad->delete();

        return response()->json([
            'message' => 'Actividad eliminada exitosamente'
        ]);
    }

    // Métodos adicionales
    public function registrarAsistencia(Request $request, $id)
    {
        $request->validate([
            'id_deportista' => 'required|exists:deportistas,id_deportista',
            'estado' => 'required|in:presente,ausente,tarde,justificado',
            'hora_llegada' => 'nullable|date_format:H:i',
            'observaciones' => 'nullable|string'
        ]);

        $actividad = Actividad::findOrFail($id);

        $asistencia = $actividad->asistencias()->updateOrCreate(
            [
                'id_deportista' => $request->id_deportista,
                'id_actividad' => $id,
                'fecha' => $actividad->fecha
            ],
            [
                'estado' => $request->estado,
                'hora_llegada' => $request->hora_llegada,
                'observaciones' => $request->observaciones
            ]
        );

        return response()->json([
            'message' => 'Asistencia registrada exitosamente',
            'data' => $asistencia
        ]);
    }

    public function listaAsistencia($id)
    {
        $actividad = Actividad::with('asistencias.deportista')->findOrFail($id);
        
        $resumen = [
            'total' => $actividad->asistencias->count(),
            'presentes' => $actividad->asistencias->where('estado', 'presente')->count(),
            'ausentes' => $actividad->asistencias->where('estado', 'ausente')->count(),
            'tarde' => $actividad->asistencias->where('estado', 'tarde')->count(),
            'justificados' => $actividad->asistencias->where('estado', 'justificado')->count(),
            'asistencias' => $actividad->asistencias
        ];

        return response()->json($resumen);
    }

    public function calendario(Request $request)
    {
        $request->validate([
            'mes' => 'required|integer|between:1,12',
            'anio' => 'required|integer|min:2020'
        ]);

        $actividades = Actividad::whereYear('fecha', $request->anio)
                                ->whereMonth('fecha', $request->mes)
                                ->with('escenarios')
                                ->orderBy('fecha')
                                ->orderBy('hora_inicio')
                                ->get();

        return response()->json($actividades);
    }
}