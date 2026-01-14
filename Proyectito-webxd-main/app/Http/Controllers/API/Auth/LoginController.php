<?php
namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    /**
     * Login de usuario
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        try {
            // Log del inicio de la petición
            Log::info('Petición del login recibida ', ['email' => $request->email]);

            // Validación de los datos (email y password)
            $validator = Validator::make($request->all(), [
                'email' => 'required|email|exists:usuarios,email',
                'password' => 'required|string',
                'device_name' => 'nullable|string|max:255'
            ], [
                'email.required' => 'El correo electrónico es obligatorio',
                'email.email' => 'El correo electrónico debe ser válido',
                'email.exists' => 'No existe una cuenta con este correo',
                'password.required' => 'La contraseña es obligatoria',
                'password.min' => 'La contraseña debe tener al menos 6 caracteres',
                'passwor.equals' => 'Las contraseñas no coinciden',
            ]);

            if ($validator->fails()) {
                Log::error('Error de validación en el login ', ['errors' => $validator->errors()]);
                return response()->json([
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Buscar usuario por email
            $usuario = Usuario::where('email', $request->email)->first();
            
            // Verificar si el usuario existe
            if (!$usuario) {
                Log::error('Usuario no encontrado en el login ', ['email' => $request->email]);
                return response()->json([
                    'success' => false,
                    'message' => 'Las credenciales proporcionadas son incorrectas.'
                ], 401);
            }

            // Verificar la contraseña
            if (!Hash::check($request->password, $usuario->password)) {
                Log::error('Contraseña incorrecta en el login ', ['email' => $request->email]);
                return response()->json([
                    'success' => false,
                    'message' => 'Las credenciales proporcionadas son incorrectas.'
                ], 401);
            }

            // Verificar si el usuario está activo
            if ($usuario->status !== 'activo') {
                return response()->json([
                    'message' => 'Tu cuenta está ' . $usuario->status . '. Contacta al administrador.'
                ], 403);
            }

            // Generar token
            $deviceName = $request->device_name ?? $request->userAgent();
            $token = $usuario->createToken($deviceName)->plainTextToken;

            // Cargar relaciones
            $usuario->load('rol.permisos', 'deportista');

            return response()->json([
                'message' => 'Inicio de sesión exitoso',
                'user' => $usuario,
                'token' => $token,
                'token_type' => 'Bearer'
            ], 200);

        } catch (\Exception $e) {
            // Manejo de errores generales
            Log::error('Error en el login: ' . $e->getMessage());
            return response()->json([
                'message' => 'Hubo un error al procesar la solicitud.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar token actual
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function me(Request $request)
    {
        $usuario = $request->user()->load('rol.permisos', 'deportista');

        return response()->json([
            'user' => $usuario
        ]);
    }

    /**
     * Refresh token
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh(Request $request)
    {
        $request->validate([
            'device_name' => 'nullable|string'
        ]);

        $usuario = $request->user();

        // Revocar token actual
        $request->user()->currentAccessToken()->delete();

        // Crear nuevo token
        $deviceName = $request->device_name ?? $request->userAgent();
        $token = $usuario->createToken($deviceName)->plainTextToken;

        return response()->json([
            'message' => 'Token renovado exitosamente',
            'token' => $token,
            'token_type' => 'Bearer'
        ]);
    }
}
