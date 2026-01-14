<?php
namespace App\Http\Controllers\API\Deportistas;
use App\Http\Controllers\Controller;

use App\Models\Categoria;
use Illuminate\Http\Request;

class CategoriaController extends Controller
{
    public function index(Request $request)
    {
        $query = Categoria::query();

        if ($request->has('activo')) {
            $query->where('activo', $request->activo);
        }

        if ($request->has('genero')) {
            $query->where('genero', $request->genero);
        }

        $categorias = $query->paginate(15);
        return response()->json($categorias);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100|unique:categorias,nombre',
            'edad_minima' => 'required|integer|min:0',
            'edad_maxima' => 'required|integer|gt:edad_minima',
            'genero' => 'required|in:masculino,femenino,mixto',
            'descripcion' => 'nullable|string',
            'activo' => 'boolean'
        ]);

        $categoria = Categoria::create($request->all());

        return response()->json([
            'message' => 'Categoría creada exitosamente',
            'data' => $categoria
        ], 201);
    }

    public function show($id)
    {
        $categoria = Categoria::with('deportistas')->findOrFail($id);
        return response()->json($categoria);
    }

    public function update(Request $request, $id)
    {
        $categoria = Categoria::findOrFail($id);

        $request->validate([
            'nombre' => 'sometimes|string|max:100|unique:categorias,nombre,' . $id . ',id_categoria',
            'edad_minima' => 'sometimes|integer|min:0',
            'edad_maxima' => 'sometimes|integer|gt:edad_minima',
            'genero' => 'sometimes|in:masculino,femenino,mixto',
            'descripcion' => 'nullable|string',
            'activo' => 'boolean'
        ]);

        $categoria->update($request->all());

        return response()->json([
            'message' => 'Categoría actualizada exitosamente',
            'data' => $categoria
        ]);
    }

    public function destroy($id)
    {
        $categoria = Categoria::findOrFail($id);
        $categoria->delete();

        return response()->json([
            'message' => 'Categoría eliminada exitosamente'
        ]);
    }

    public function deportistas($id)
    {
        $categoria = Categoria::with('deportistas')->findOrFail($id);
        return response()->json($categoria->deportistas);
    }
}