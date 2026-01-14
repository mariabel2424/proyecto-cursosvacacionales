<?php
namespace App\Http\Controllers\API\Sistema;
use App\Http\Controllers\Controller;

use App\Models\Archivo;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ArchivoController extends Controller
{
    public function index(Request $request)
    {
        $query = Archivo::with('usuario');

        if ($request->has('archivable_type') && $request->has('archivable_id')) {
            $query->where('archivable_type', $request->archivable_type)
                  ->where('archivable_id', $request->archivable_id);
        }

        if ($request->has('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        $archivos = $query->orderBy('created_at', 'desc')->paginate(15);
        return response()->json($archivos);
    }

    public function store(Request $request)
    {
        $request->validate([
            'archivable_type' => 'required|string',
            'archivable_id' => 'required|integer',
            'archivo' => 'required|file|max:10240', // 10MB max
            'tipo' => 'required|in:imagen,documento,video,audio,otro',
            'descripcion' => 'nullable|string'
        ]);

        $file = $request->file('archivo');
        $nombreOriginal = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $nombreArchivo = Str::random(40) . '.' . $extension;
        $ruta = $file->storeAs('archivos', $nombreArchivo, 'public');

        $archivo = Archivo::create([
            'archivable_type' => $request->archivable_type,
            'archivable_id' => $request->archivable_id,
            'tipo' => $request->tipo,
            'nombre_original' => $nombreOriginal,
            'nombre_archivo' => $nombreArchivo,
            'ruta' => $ruta,
            'extension' => $extension,
            'mime_type' => $file->getMimeType(),
            'tamaño' => $file->getSize(),
            'descripcion' => $request->descripcion,
            'usuario_id' => auth()->id()
        ]);

        return response()->json([
            'message' => 'Archivo subido exitosamente',
            'data' => $archivo
        ], 201);
    }

    public function show($id)
    {
        $archivo = Archivo::with('usuario')->findOrFail($id);
        return response()->json($archivo);
    }

    public function descargar($id)
    {
        $archivo = Archivo::findOrFail($id);
        $rutaCompleta = storage_path('app/public/' . $archivo->ruta);

        if (!file_exists($rutaCompleta)) {
            return response()->json([
                'message' => 'Archivo no encontrado'
            ], 404);
        }

        return response()->download($rutaCompleta, $archivo->nombre_original);
    }

    public function destroy($id)
    {
        $archivo = Archivo::findOrFail($id);
        
        // Eliminar archivo físico
        \Storage::disk('public')->delete($archivo->ruta);
        
        $archivo->delete();

        return response()->json([
            'message' => 'Archivo eliminado exitosamente'
        ]);
    }
}
