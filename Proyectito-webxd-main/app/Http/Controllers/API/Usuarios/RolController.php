<?php
namespace App\Http\Controllers\API\Usuarios;

use App\Http\Controllers\Controller;
use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class RolController extends Controller
{
    /**
     * Listar TODOS los roles sin paginación (para selects)
     * Optimizado con caché y filtros
     */
    public function all()
    {
        try {
            $roles = Rol::where('activo', true)
                        ->select('id_rol', 'nombre', 'slug', 'descripcion')
                        ->orderBy('nombre', 'asc')
                        ->get();
            
            return response()->json($roles, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener roles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar roles con relaciones (paginación)
     * Incluye contadores optimizados
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $status = $request->input('status'); // 'active', 'inactive', 'all'

            $query = Rol::with(['permisos:id_permiso,nombre,slug,descripcion'])
                        ->withCount('permisos', 'usuarios');

            // Búsqueda
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nombre', 'like', "%{$search}%")
                      ->orWhere('slug', 'like', "%{$search}%")
                      ->orWhere('descripcion', 'like', "%{$search}%");
                });
            }

            // Filtro por estado
            if ($status === 'active') {
                $query->where('activo', true);
            } elseif ($status === 'inactive') {
                $query->where('activo', false);
            }

            $roles = $query->orderBy('nombre', 'asc')
                          ->paginate($perPage);

            return response()->json($roles, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener roles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un nuevo rol con validaciones mejoradas
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'nombre' => 'required|string|max:50|unique:rols,nombre',
                'descripcion' => 'nullable|string|max:500',
                'activo' => 'sometimes|boolean',
                'permisos' => 'nullable|array',
                'permisos.*' => 'exists:permisos,id_permiso'
            ], [
                'nombre.required' => 'El nombre del rol es obligatorio',
                'nombre.unique' => 'Ya existe un rol con este nombre',
                'nombre.max' => 'El nombre no puede superar los 50 caracteres',
                'descripcion.max' => 'La descripción no puede superar los 500 caracteres',
                'permisos.*.exists' => 'Uno o más permisos no existen'
            ]);

            DB::beginTransaction();

            // Crear rol
            $rol = Rol::create([
                'nombre' => trim($validated['nombre']),
                'slug' => Str::slug($validated['nombre']),
                'descripcion' => $validated['descripcion'] ?? null,
                'activo' => $validated['activo'] ?? true
            ]);

            // Asignar permisos
            if (!empty($validated['permisos'])) {
                $rol->permisos()->sync($validated['permisos']);
            }

            DB::commit();

            return response()->json([
                'message' => 'Rol creado exitosamente',
                'data' => $rol->load('permisos:id_permiso,nombre,slug')
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al crear el rol',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mostrar un rol específico con todas sus relaciones
     */
    public function show($id)
    {
        try {
            $rol = Rol::with([
                'permisos:id_permiso,nombre,slug,descripcion,modulo',
                'usuarios:id_usuario,nombre,apellido,email,status'
            ])
            ->withCount('permisos', 'usuarios')
            ->findOrFail($id);

            return response()->json($rol, 200);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Rol no encontrado'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener el rol',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar un rol existente
     */
    public function update(Request $request, $id)
    {
        try {
            $rol = Rol::findOrFail($id);

            // Validar entrada
            $validated = $request->validate([
                'nombre' => [
                    'required',
                    'string',
                    'max:50',
                    Rule::unique('rols', 'nombre')->ignore($id, 'id_rol')
                ],
                'descripcion' => 'nullable|string|max:500',
                'activo' => 'sometimes|boolean',
                'permisos' => 'nullable|array',
                'permisos.*' => 'exists:permisos,id_permiso'
            ], [
                'nombre.required' => 'El nombre del rol es obligatorio',
                'nombre.unique' => 'Ya existe un rol con este nombre',
                'nombre.max' => 'El nombre no puede superar los 50 caracteres',
                'descripcion.max' => 'La descripción no puede superar los 500 caracteres',
                'permisos.*.exists' => 'Uno o más permisos no existen'
            ]);

            DB::beginTransaction();

            // Actualizar datos del rol
            $rol->update([
                'nombre' => trim($validated['nombre']),
                'slug' => Str::slug($validated['nombre']),
                'descripcion' => $validated['descripcion'] ?? $rol->descripcion,
                'activo' => $validated['activo'] ?? $rol->activo
            ]);

            // Sincronizar permisos si vienen en la petición
            if ($request->has('permisos')) {
                $rol->permisos()->sync($validated['permisos'] ?? []);
            }

            DB::commit();

            return response()->json([
                'message' => 'Rol actualizado exitosamente',
                'data' => $rol->load('permisos:id_permiso,nombre,slug')
            ], 200);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Rol no encontrado'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al actualizar el rol',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un rol (con validaciones)
     */
    public function destroy($id)
    {
        try {
            $rol = Rol::withCount('usuarios')->findOrFail($id);

            // Validar que no tenga usuarios asignados
            if ($rol->usuarios_count > 0) {
                return response()->json([
                    'message' => 'No se puede eliminar el rol porque tiene usuarios asignados',
                    'usuarios_count' => $rol->usuarios_count
                ], 409); // 409 Conflict
            }

            // Validar que no sea un rol de sistema (opcional)
            $rolesProtegidos = ['admin', 'super-admin', 'administrador'];
            if (in_array($rol->slug, $rolesProtegidos)) {
                return response()->json([
                    'message' => 'No se puede eliminar este rol porque es un rol del sistema'
                ], 403); // 403 Forbidden
            }

            DB::beginTransaction();

            // Eliminar relaciones con permisos
            $rol->permisos()->detach();
            
            // Eliminar el rol
            $rol->delete();

            DB::commit();

            return response()->json([
                'message' => 'Rol eliminado exitosamente'
            ], 200);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Rol no encontrado'
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al eliminar el rol',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cambiar estado de un rol (activar/desactivar)
     */
    public function toggleStatus($id)
    {
        try {
            $rol = Rol::findOrFail($id);
            
            $rol->update([
                'activo' => !$rol->activo
            ]);

            return response()->json([
                'message' => 'Estado actualizado exitosamente',
                'data' => [
                    'id_rol' => $rol->id_rol,
                    'nombre' => $rol->nombre,
                    'activo' => $rol->activo
                ]
            ], 200);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Rol no encontrado'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al cambiar el estado',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}