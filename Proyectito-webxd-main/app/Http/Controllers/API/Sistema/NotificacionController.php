<?php
namespace App\Http\Controllers\API\Sistema;
use App\Http\Controllers\Controller;

use App\Models\Notificacion;
use Illuminate\Http\Request;

class NotificacionController extends Controller
{
   public function index(Request $request)
{
    // Agrega logs para debug
    \Log::info('Notificaciones index - Usuario ID: ' . auth()->id());
    \Log::info('Parámetros recibidos: ', $request->all());
    
    $query = Notificacion::where('usuario_id', auth()->id());
    
    if ($request->has('leida')) {
        $query->where('leida', $request->leida);
    }
    
    if ($request->has('tipo')) {
        $query->where('tipo', $request->tipo);
    }
    
    // Verifica el conteo total
    $total = $query->count();
    \Log::info('Total de notificaciones para este usuario: ' . $total);
    
    $notificaciones = $query->orderBy('created_at', 'desc')->paginate(20);
    
    \Log::info('Notificaciones paginadas: ' . $notificaciones->count());
    
    return response()->json($notificaciones);
}

    public function store(Request $request)
    {
        $request->validate([
            'usuario_id' => 'required|exists:usuarios,id_usuario',
            'tipo' => 'required|in:info,success,warning,error,mensaje',
            'titulo' => 'required|string|max:200',
            'mensaje' => 'required|string',
            'data' => 'nullable|array',
            'url' => 'nullable|string'
        ]);

        $notificacion = Notificacion::create($request->all());

        return response()->json([
            'message' => 'Notificación creada exitosamente',
            'data' => $notificacion
        ], 201);
    }

    public function show($id)
    {
        $notificacion = Notificacion::where('usuario_id', auth()->id())
                                    ->findOrFail($id);
        
        if (!$notificacion->leida) {
            $notificacion->marcarComoLeida();
        }

        return response()->json($notificacion);
    }

    public function marcarLeida($id)
    {
        $notificacion = Notificacion::where('usuario_id', auth()->id())
                                    ->findOrFail($id);
        
        $notificacion->marcarComoLeida();

        return response()->json([
            'message' => 'Notificación marcada como leída'
        ]);
    }

    public function marcarTodasLeidas()
    {
        Notificacion::where('usuario_id', auth()->id())
                   ->where('leida', false)
                   ->update([
                       'leida' => true,
                       'fecha_lectura' => now()
                   ]);

        return response()->json([
            'message' => 'Todas las notificaciones marcadas como leídas'
        ]);
    }

    public function destroy($id)
    {
        $notificacion = Notificacion::where('usuario_id', auth()->id())
                                    ->findOrFail($id);
        $notificacion->delete();

        return response()->json([
            'message' => 'Notificación eliminada exitosamente'
        ]);
    }

    public function noLeidas()
    {
        $cantidad = Notificacion::where('usuario_id', auth()->id())
                               ->noLeidas()
                               ->count();

        return response()->json([
            'cantidad' => $cantidad
        ]);
    }
}
