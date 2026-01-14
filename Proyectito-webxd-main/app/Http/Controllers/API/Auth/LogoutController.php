<?php
namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
class LogoutController extends Controller
{
    /**
     * Logout de usuario
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        try {
            // Log del inicio de la petición
            $request->session()->invalidate();
            $request->session()->regenerateToken();


            log::info('Cierre de sesión del usuario ', ['user_id' => $request->user()->id_usuario]);


            //Redirigir al login
            return redirect('/login');

            // Revocar el token del usuario autenticado
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logout exitoso'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error durante el logout ', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error durante el logout'
            ], 500);
        }
    }
}