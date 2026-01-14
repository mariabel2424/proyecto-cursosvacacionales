<?php

namespace App\Http\Controllers\API\Deportistas;  

use App\Http\Controllers\Controller;
use App\Http\Requests\DeportistaRequest;
use App\Models\Deportista;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DeportistaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Deportista::with(['usuario', 'categoria']);

        // Filtros
        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('genero')) {
            $query->where('genero', $request->genero);
        }

        if ($request->has('id_categoria')) {
            $query->where('id_categoria', $request->id_categoria);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nombres', 'like', "%{$search}%")
                  ->orWhere('apellidos', 'like', "%{$search}%")
                  ->orWhere('numero_documento', 'like', "%{$search}%")
                  ->orWhere('correo', 'like', "%{$search}%");
            });
        }

        // Ordenamiento
        $sortField = $request->get('sort_by', 'apellidos');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortField, $sortOrder);

        // Paginación
        $perPage = $request->get('per_page', 15);
        $deportistas = $query->paginate($perPage);

        // Formatear datos manualmente
        $deportistas->getCollection()->transform(function ($deportista) {
            return $this->formatDeportista($deportista);
        });

        return response()->json([
            'success' => true,
            'data' => $deportistas,
            'message' => 'Lista de deportistas obtenida exitosamente'
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(DeportistaRequest $request)
    {
        try {
            $data = $request->validated();
            $data['created_by'] = Auth::id();

            // Manejar la carga de foto
            if ($request->hasFile('foto')) {
                $data['foto'] = $request->file('foto')->store('deportistas/fotos', 'public');
            }

            $deportista = Deportista::create($data);
            $deportista->load(['usuario', 'categoria']);

            return response()->json([
                'success' => true,
                'data' => $this->formatDeportista($deportista),
                'message' => 'Deportista creado exitosamente'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el deportista: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Deportista $deportista)
    {
        $deportista->load(['usuario', 'categoria', 'creador', 'actualizador']);
        
        return response()->json([
            'success' => true,
            'data' => $this->formatDeportista($deportista, true),
            'message' => 'Deportista obtenido exitosamente'
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(DeportistaRequest $request, Deportista $deportista)
    {
        try {
            $data = $request->validated();
            $data['updated_by'] = Auth::id();

            // Manejar la actualización de foto
            if ($request->hasFile('foto')) {
                // Eliminar foto anterior si existe
                if ($deportista->foto && Storage::disk('public')->exists($deportista->foto)) {
                    Storage::disk('public')->delete($deportista->foto);
                }
                $data['foto'] = $request->file('foto')->store('deportistas/fotos', 'public');
            }

            $deportista->update($data);
            $deportista->load(['usuario', 'categoria']);

            return response()->json([
                'success' => true,
                'data' => $this->formatDeportista($deportista),
                'message' => 'Deportista actualizado exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el deportista: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Deportista $deportista)
    {
        try {
            if ($deportista->estado !== 'retirado') {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar un deportista que no está retirado'
                ], 422);
            }

            $deportista->deleted_by = Auth::id();
            $deportista->save();
            $deportista->delete();

            return response()->json([
                'success' => true,
                'message' => 'Deportista eliminado exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el deportista: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar un deportista eliminado
     */
    public function restore($id)
    {
        try {
            $deportista = Deportista::withTrashed()->findOrFail($id);
            
            if ($deportista->trashed()) {
                $deportista->restore();
                $deportista->deleted_by = null;
                $deportista->save();
                $deportista->load(['usuario', 'categoria']);
            }

            return response()->json([
                'success' => true,
                'data' => $this->formatDeportista($deportista),
                'message' => 'Deportista restaurado exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar el deportista: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cambiar estado del deportista
     */
    public function cambiarEstado(Request $request, Deportista $deportista)
    {
        $request->validate([
            'estado' => 'required|in:activo,lesionado,suspendido,retirado'
        ]);

        try {
            $deportista->update([
                'estado' => $request->estado,
                'updated_by' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'data' => $this->formatDeportista($deportista),
                'message' => 'Estado actualizado exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar el estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener deportistas activos
     */
    public function activos(Request $request)
    {
        $query = Deportista::activos()->with(['usuario', 'categoria']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nombres', 'like', "%{$search}%")
                  ->orWhere('apellidos', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        $deportistas = $query->paginate($perPage);

        // Formatear datos
        $deportistas->getCollection()->transform(function ($deportista) {
            return $this->formatDeportista($deportista);
        });

        return response()->json([
            'success' => true,
            'data' => $deportistas,
            'message' => 'Deportistas activos obtenidos exitosamente'
        ]);
    }

    /**
     * Obtener estadísticas de deportistas
     */
    public function estadisticas()
    {
        try {
            $total = Deportista::count();
            $activos = Deportista::activos()->count();
            $lesionados = Deportista::lesionados()->count();
            $suspendidos = Deportista::suspendidos()->count();
            $retirados = Deportista::retirados()->count();
            $masculinos = Deportista::porGenero('masculino')->count();
            $femeninos = Deportista::porGenero('femenino')->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'por_estado' => [
                        'activos' => $activos,
                        'lesionados' => $lesionados,
                        'suspendidos' => $suspendidos,
                        'retirados' => $retirados
                    ],
                    'por_genero' => [
                        'masculinos' => $masculinos,
                        'femeninos' => $femeninos
                    ],
                    'porcentajes' => [
                        'activos' => $total > 0 ? round(($activos / $total) * 100, 2) : 0,
                        'lesionados' => $total > 0 ? round(($lesionados / $total) * 100, 2) : 0,
                        'masculinos' => $total > 0 ? round(($masculinos / $total) * 100, 2) : 0,
                        'femeninos' => $total > 0 ? round(($femeninos / $total) * 100, 2) : 0
                    ]
                ],
                'message' => 'Estadísticas obtenidas exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Método privado para formatear deportista
     */
    private function formatDeportista($deportista, $full = false)
    {
        $formatted = [
            'id_deportista' => $deportista->id_deportista,
            'id_usuario' => $deportista->id_usuario,
            'id_categoria' => $deportista->id_categoria,
            'nombres' => $deportista->nombres,
            'apellidos' => $deportista->apellidos,
            'nombre_completo' => $deportista->nombre_completo,
            'fecha_nacimiento' => $deportista->fecha_nacimiento->format('Y-m-d'),
            'edad' => $deportista->edad,
            'genero' => $deportista->genero,
            'tipo_documento' => $deportista->tipo_documento,
            'numero_documento' => $deportista->numero_documento,
            'foto' => $deportista->foto,
            'foto_url' => $deportista->foto_url,
            'direccion' => $deportista->direccion,
            'correo' => $deportista->correo,
            'telefono' => $deportista->telefono,
            'altura' => $deportista->altura,
            'peso' => $deportista->peso,
            'imc' => $deportista->imc,
            'pie_habil' => $deportista->pie_habil,
            'numero_camiseta' => $deportista->numero_camiseta,
            'estado' => $deportista->estado,
            'contacto_emergencia_nombre' => $deportista->contacto_emergencia_nombre,
            'contacto_emergencia_telefono' => $deportista->contacto_emergencia_telefono,
            'contacto_emergencia_relacion' => $deportista->contacto_emergencia_relacion,
            'created_at' => $deportista->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $deportista->updated_at->format('Y-m-d H:i:s'),
        ];

        // Agregar relaciones si están cargadas
        if ($deportista->relationLoaded('usuario')) {
            $formatted['usuario'] = $deportista->usuario;
        }

        if ($deportista->relationLoaded('categoria')) {
            $formatted['categoria'] = $deportista->categoria;
        }

        // Información adicional para vista completa
        if ($full) {
            $formatted['deleted_at'] = $deportista->deleted_at ? $deportista->deleted_at->format('Y-m-d H:i:s') : null;
            
            if ($deportista->relationLoaded('creador')) {
                $formatted['creador'] = $deportista->creador;
            }
            
            if ($deportista->relationLoaded('actualizador')) {
                $formatted['actualizador'] = $deportista->actualizador;
            }
        }

        return $formatted;
    }
}