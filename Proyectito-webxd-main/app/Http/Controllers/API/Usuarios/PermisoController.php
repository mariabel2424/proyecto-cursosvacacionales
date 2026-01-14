<?php
namespace App\Http\Controllers\API\Usuarios;
use App\Http\Controllers\Controller;

use App\Models\Permiso;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PermisoController extends Controller
{
    public function index(Request $request)
    {
        $query = Permiso::query();

        if ($request->has('modulo')) {
            $query->where('modulo', $request->modulo);
        }

        $permisos = $query->orderBy('modulo')->orderBy('nombre')->paginate(50);
        return response()->json($permisos);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
            'descripcion' => 'nullable|string',
            'modulo' => 'required|string|max:50'
        ]);

        $permiso = Permiso::create([
            'nombre' => $request->nombre,
            'slug' => Str::slug($request->nombre),
            'descripcion' => $request->descripcion,
            'modulo' => $request->modulo
        ]);

        return response()->json([
            'message' => 'Permiso creado exitosamente',
            'data' => $permiso
        ], 201);
    }

    public function show($id)
    {
        $permiso = Permiso::with('roles')->findOrFail($id);
        return response()->json($permiso);
    }

    public function update(Request $request, $id)
    {
        $permiso = Permiso::findOrFail($id);

        $request->validate([
            'nombre' => 'sometimes|string|max:100',
            'descripcion' => 'nullable|string',
            'modulo' => 'sometimes|string|max:50'
        ]);

        $data = $request->all();
        if ($request->filled('nombre')) {
            $data['slug'] = Str::slug($request->nombre);
        }

        $permiso->update($data);

        return response()->json([
            'message' => 'Permiso actualizado exitosamente',
            'data' => $permiso
        ]);
    }

    public function destroy($id)
    {
        $permiso = Permiso::findOrFail($id);
        $permiso->delete();

        return response()->json([
            'message' => 'Permiso eliminado exitosamente'
        ]);
    }

    public function modulos()
    {
        $modulos = Permiso::select('modulo')
                         ->distinct()
                         ->orderBy('modulo')
                         ->pluck('modulo');

        return response()->json($modulos);
    }
}