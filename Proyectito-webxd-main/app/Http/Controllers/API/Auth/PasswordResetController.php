<?php
namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    /**
     * Solicitar restablecimiento de contraseña
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function solicitarReset(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:usuarios,email'
        ]);

        $usuario = Usuario::where('email', $request->email)->first();

        // Generar token de reset
        $token = Str::random(60);

        // Guardar token en cache por 1 hora
        cache()->put('password_reset_' . $usuario->id_usuario, $token, now()->addHour());

        // Aquí deberías enviar el email con el token
        // Mail::to($usuario->email)->send(new PasswordResetMail($token));

        return response()->json([
            'message' => 'Se ha enviado un enlace de restablecimiento a tu correo',
            'token' => $token // Solo para desarrollo - ELIMINAR en producción
        ]);
    }

    /**
     * Verificar token de reset
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verificarToken(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:usuarios,email',
            'token' => 'required|string'
        ]);

        $usuario = Usuario::where('email', $request->email)->first();
        $tokenGuardado = cache()->get('password_reset_' . $usuario->id_usuario);

        if (!$tokenGuardado || $tokenGuardado !== $request->token) {
            return response()->json([
                'message' => 'Token inválido o expirado',
                'valido' => false
            ], 400);
        }

        return response()->json([
            'message' => 'Token válido',
            'valido' => true
        ]);
    }

    /**
     * Restablecer contraseña
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:usuarios,email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed'
        ]);

        $usuario = Usuario::where('email', $request->email)->first();
        $tokenGuardado = cache()->get('password_reset_' . $usuario->id_usuario);

        if (!$tokenGuardado || $tokenGuardado !== $request->token) {
            return response()->json([
                'message' => 'Token inválido o expirado'
            ], 400);
        }

        // Actualizar contraseña
        $usuario->update([
            'password' => Hash::make($request->password)
        ]);

        // Eliminar token del cache
        cache()->forget('password_reset_' . $usuario->id_usuario);

        // Revocar todos los tokens anteriores por seguridad
        $usuario->tokens()->delete();

        return response()->json([
            'message' => 'Contraseña restablecida exitosamente'
        ]);
    }

    /**
     * Cambiar contraseña (usuario autenticado)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function cambiarPassword(Request $request)
    {
        $request->validate([
            'password_actual' => 'required|string',
            'password_nuevo' => 'required|string|min:8|confirmed|different:password_actual'
        ]);

        $usuario = $request->user();

        // Verificar contraseña actual
        if (!Hash::check($request->password_actual, $usuario->password)) {
            return response()->json([
                'message' => 'La contraseña actual es incorrecta'
            ], 400);
        }

        // Actualizar contraseña
        $usuario->update([
            'password' => Hash::make($request->password_nuevo)
        ]);

        return response()->json([
            'message' => 'Contraseña cambiada exitosamente'
        ]);
    }
}