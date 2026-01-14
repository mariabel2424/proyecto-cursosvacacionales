<?php
namespace App\Http\Controllers\API\Cursos;

use App\Http\Controllers\Controller;
use App\Models\Curso;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CursoController extends Controller
{
    public function index(Request $request)
    {
        $query = Curso::query();

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('nombre', 'like', "%{$search}%");
        }

        $cursos = $query->paginate(15);
        return response()->json($cursos);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
            'descripcion' => 'required|string',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after:fecha_inicio',
            'representante' => 'required|string|max:100',
            'email_representante' => 'nullable|email',
            'telefono_representante' => 'nullable|string|max:20',
            'tipo' => 'required|in:vacacional,permanente',
            'cupo_maximo' => 'nullable|integer|min:1',
            'precio' => 'nullable|numeric|min:0',
            'imagen' => 'nullable|image|max:2048'
        ]);

        $data = $request->except('imagen');
        $data['slug'] = Str::slug($request->nombre);
        $data['cupo_actual'] = 0;

        if ($request->hasFile('imagen')) {
            $data['imagen'] = $request->file('imagen')->store('cursos', 'public');
        }

        $curso = Curso::create($data);

        return response()->json([
            'message' => 'Curso creado exitosamente',
            'data' => $curso
        ], 201);
    }

    public function show($id)
    {
        $curso = Curso::with('inscripciones.usuario')->findOrFail($id);
        return response()->json($curso);
    }

    public function update(Request $request, $id)
    {
        $curso = Curso::findOrFail($id);

        $request->validate([
            'nombre' => 'sometimes|string|max:100',
            'descripcion' => 'sometimes|string',
            'fecha_inicio' => 'sometimes|date',
            'fecha_fin' => 'sometimes|date|after:fecha_inicio',
            'representante' => 'sometimes|string|max:100',
            'email_representante' => 'nullable|email',
            'telefono_representante' => 'nullable|string|max:20',
            'tipo' => 'sometimes|in:vacacional,permanente',
            'estado' => 'sometimes|in:abierto,cerrado,en_proceso,cancelado',
            'cupo_maximo' => 'nullable|integer|min:1',
            'precio' => 'nullable|numeric|min:0',
            'imagen' => 'nullable|image|max:2048'
        ]);

        $data = $request->except('imagen');
        
        if ($request->filled('nombre')) {
            $data['slug'] = Str::slug($request->nombre);
        }

        if ($request->hasFile('imagen')) {
            if ($curso->imagen) {
                \Storage::disk('public')->delete($curso->imagen);
            }
            $data['imagen'] = $request->file('imagen')->store('cursos', 'public');
        }

        $curso->update($data);

        return response()->json([
            'message' => 'Curso actualizado exitosamente',
            'data' => $curso
        ]);
    }

    public function destroy($id)
    {
        $curso = Curso::findOrFail($id);
        $curso->delete();

        return response()->json([
            'message' => 'Curso eliminado exitosamente'
        ]);
    }

    // Métodos adicionales
    public function inscribir(Request $request, $id)
    {
        $request->validate([
            'id_usuario' => 'required|exists:usuarios,id_usuario',
            'observaciones' => 'nullable|string'
        ]);

        $curso = Curso::findOrFail($id);

        if (!$curso->tieneCuposDisponibles()) {
            return response()->json([
                'message' => 'No hay cupos disponibles'
            ], 400);
        }

        $curso->inscripciones()->create([
            'id_usuario' => $request->id_usuario,
            'fecha_inscripcion' => now(),
            'observaciones' => $request->observaciones,
            'estado' => 'activa'
        ]);

        $curso->incrementarCupo();

        return response()->json([
            'message' => 'Inscripción realizada exitosamente'
        ]);
    }

    public function participantes($id)
    {
        $curso = Curso::with('inscripciones.usuario')->findOrFail($id);
        return response()->json($curso->inscripciones);
    }
}