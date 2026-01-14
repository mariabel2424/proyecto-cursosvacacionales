<?php
namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use App\Models\Deportista;
use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RegisterController extends Controller
{
    /**
     * Registrar nuevo usuario
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        try {
            // Validación de datos
            $validator = Validator::make($request->all(), [
                'nombre' => 'required|string|min:2|max:100',
                'apellido' => 'required|string|min:2|max:100',
                'cedula' => 'required|string|size:10|unique:deportistas,numero_documento',
                'email' => 'required|email|unique:usuarios,email',
                'password' => 'required|string|min:8|confirmed',
                'telefono' => 'nullable|string|size:10',
                'direccion' => 'nullable|string|max:255',
                'fecha_nacimiento' => 'required|date|before:today|after:1920-01-01',
                'genero' => 'required|in:masculino,femenino,otro',
                'id_rol' => 'nullable|exists:rols,id_rol'
            ], [
                'nombre.required' => 'El nombre es obligatorio',
                'nombre.min' => 'El nombre debe tener al menos 2 caracteres',
                'apellido.required' => 'El apellido es obligatorio',
                'apellido.min' => 'El apellido debe tener al menos 2 caracteres',
                'cedula.required' => 'La cédula es obligatoria',
                'cedula.size' => 'La cédula debe tener 10 dígitos',
                'cedula.unique' => 'Esta cédula ya está registrada',
                'email.required' => 'El email es obligatorio',
                'email.email' => 'El email no es válido',
                'email.unique' => 'Este email ya está registrado',
                'password.required' => 'La contraseña es obligatoria',
                'password.min' => 'La contraseña debe tener al menos 8 caracteres',
                'password.confirmed' => 'Las contraseñas no coinciden',
                'telefono.size' => 'El teléfono debe tener 10 dígitos',
                'fecha_nacimiento.required' => 'La fecha de nacimiento es obligatoria',
                'fecha_nacimiento.before' => 'La fecha de nacimiento debe ser anterior a hoy',
                'fecha_nacimiento.after' => 'Por favor, verifica la fecha de nacimiento',
                'genero.required' => 'El género es obligatorio',
                'genero.in' => 'El género seleccionado no es válido',
                'id_rol.exists' => 'El rol seleccionado no existe'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Validación adicional de cédula ecuatoriana
            if (!$this->validarCedulaEcuatoriana($request->cedula)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La cédula ecuatoriana no es válida',
                    'errors' => ['cedula' => ['La cédula ecuatoriana no es válida']]
                ], 422);
            }

            DB::beginTransaction();

            // Asignar rol por defecto si no se proporciona (Deportista)
            $idRol = $request->id_rol;
            if (!$idRol) {
                $rolDeportista = Rol::where('slug', 'deportista')->first();
                $idRol = $rolDeportista ? $rolDeportista->id_rol : 4; // ID 4 por defecto
            }

            if (!$idRol) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró un rol válido para asignar'
                ], 400);
            }

            // 1. Crear usuario
            $usuario = Usuario::create([
                'id_rol' => $idRol,
                'nombre' => $request->nombre,
                'apellido' => $request->apellido,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'telefono' => $request->telefono,
                'direccion' => $request->direccion,
                'status' => 'activo'
            ]);

            $deportista = null;

            // 2. Crear deportista si el rol es deportista (id_rol = 4)
            if ($idRol == 4) {
                $deportista = Deportista::create([
                    'id_usuario' => $usuario->id_usuario,
                    'nombres' => $request->nombre,
                    'apellidos' => $request->apellido,
                    'fecha_nacimiento' => $request->fecha_nacimiento,
                    'genero' => $request->genero,
                    'tipo_documento' => 'cedula',
                    'numero_documento' => $request->cedula,
                    'direccion' => $request->direccion,
                    'correo' => $request->email,
                    'telefono' => $request->telefono,
                    'estado' => 'activo',
                    'id_categoria' => $this->determinarCategoria($request->fecha_nacimiento),
                    'created_by' => $usuario->id_usuario,
                ]);

                Log::info('Deportista creado', [
                    'deportista_id' => $deportista->id_deportista,
                    'usuario_id' => $usuario->id_usuario
                ]);
            }

            // Generar token para login automático
            $deviceName = $request->device_name ?? $request->userAgent() ?? 'web-browser';
            $token = $usuario->createToken($deviceName)->plainTextToken;

            // Cargar relaciones
            $usuario->load('rol');
            if ($deportista) {
                $usuario->load('deportista.categoria');
            }

            DB::commit();

            Log::info('Nuevo usuario registrado', [
                'usuario_id' => $usuario->id_usuario,
                'email' => $usuario->email,
                'rol' => $usuario->rol->nombre ?? 'N/A',
                'tiene_deportista' => $deportista !== null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Usuario registrado exitosamente',
                'data' => [
                    'user' => [
                        'id_usuario' => $usuario->id_usuario,
                        'nombre' => $usuario->nombre,
                        'apellido' => $usuario->apellido,
                        'email' => $usuario->email,
                        'telefono' => $usuario->telefono,
                        'direccion' => $usuario->direccion,
                        'status' => $usuario->status,
                        'rol' => $usuario->rol ? [
                            'id_rol' => $usuario->rol->id_rol,
                            'nombre' => $usuario->rol->nombre,
                            'slug' => $usuario->rol->slug,
                        ] : null,
                    ],
                    'deportista' => $deportista ? [
                        'id_deportista' => $deportista->id_deportista,
                        'nombres' => $deportista->nombres,
                        'apellidos' => $deportista->apellidos,
                        'nombre_completo' => $deportista->nombres . ' ' . $deportista->apellidos,
                        'numero_documento' => $deportista->numero_documento,
                        'fecha_nacimiento' => $deportista->fecha_nacimiento,
                        'edad' => Carbon::parse($deportista->fecha_nacimiento)->age,
                        'genero' => $deportista->genero,
                        'estado' => $deportista->estado,
                        'categoria' => $deportista->categoria ? [
                            'id_categoria' => $deportista->categoria->id_categoria,
                            'nombre' => $deportista->categoria->nombre,
                        ] : null,
                    ] : null,
                ],
                'access_token' => $token,
                'token_type' => 'Bearer'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al registrar usuario: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            Log::error('Request data: ' . json_encode($request->except(['password', 'password_confirmation'])));
            
            return response()->json([
                'success' => false,
                'message' => 'Hubo un error al registrar el usuario.',
                'error' => config('app.debug') ? $e->getMessage() : 'Intenta de nuevo más tarde.'
            ], 500);
        }
    }

    /**
     * Validar cédula ecuatoriana
     * 
     * @param string $cedula
     * @return bool
     */
    private function validarCedulaEcuatoriana($cedula)
    {
        // Verificar que tenga 10 dígitos
        if (!preg_match('/^\d{10}$/', $cedula)) {
            return false;
        }

        // Verificar provincia (01-24)
        $provincia = intval(substr($cedula, 0, 2));
        if ($provincia < 1 || $provincia > 24) {
            return false;
        }

        // Tercer dígito debe ser menor a 6 (personas naturales)
        $tercerDigito = intval($cedula[2]);
        if ($tercerDigito > 5) {
            return false;
        }

        // Algoritmo de validación del dígito verificador
        $coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
        $suma = 0;

        for ($i = 0; $i < 9; $i++) {
            $valor = intval($cedula[$i]) * $coeficientes[$i];
            if ($valor >= 10) {
                $valor -= 9;
            }
            $suma += $valor;
        }

        $digitoVerificador = intval($cedula[9]);
        $resultado = $suma % 10 === 0 ? 0 : 10 - ($suma % 10);

        return $resultado === $digitoVerificador;
    }

    /**
     * Determinar categoría según fecha de nacimiento
     * 
     * @param string $fechaNacimiento
     * @return int|null
     */
    private function determinarCategoria($fechaNacimiento)
    {
        try {
            $edad = Carbon::parse($fechaNacimiento)->age;

            // Buscar categoría por edad en la base de datos
            // Ajusta estos rangos según tus categorías
            $categoria = DB::table('categorias')
                ->where('edad_minima', '<=', $edad)
                ->where('edad_maxima', '>=', $edad)
                ->where('activo', true)
                ->first();

            if ($categoria) {
                return $categoria->id_categoria;
            }

            // Si no se encuentra categoría, asignar por rangos por defecto
            if ($edad < 6) {
                return 1; // Pre-infantil
            } elseif ($edad >= 6 && $edad <= 8) {
                return 2; // Infantil
            } elseif ($edad >= 9 && $edad <= 12) {
                return 3; // Pre-juvenil
            } elseif ($edad >= 13 && $edad <= 16) {
                return 4; // Juvenil
            } elseif ($edad >= 17 && $edad <= 20) {
                return 5; // Sub-20
            } else {
                return 6; // Adultos
            }
        } catch (\Exception $e) {
            Log::error('Error al determinar categoría: ' . $e->getMessage());
            return null; // Retornar null si hay error
        }
    }

    /**
     * Verificar email
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verificarEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        $existe = Usuario::where('email', $request->email)->exists();

        return response()->json([
            'success' => true,
            'disponible' => !$existe,
            'message' => $existe ? 'El email ya está en uso' : 'Email disponible'
        ]);
    }

    /**
     * Enviar código de verificación
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function enviarCodigoVerificacion(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:usuarios,email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        $usuario = Usuario::where('email', $request->email)->first();

        // Generar código de 6 dígitos
        $codigo = random_int(100000, 999999);

        // Guardar código temporalmente (10 minutos de expiración)
        cache()->put('verification_code_' . $usuario->id_usuario, $codigo, now()->addMinutes(10));

        // Aquí puedes enviar el código por email
        // Mail::to($usuario->email)->send(new VerificationCodeMail($codigo));

        Log::info('Código de verificación generado', [
            'usuario_id' => $usuario->id_usuario,
            'email' => $usuario->email,
            'codigo' => $codigo // Solo en desarrollo, remover en producción
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Código de verificación enviado al correo electrónico',
            // 'codigo' => $codigo // Solo para testing, remover en producción
        ]);
    }

    /**
     * Verificar código
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verificarCodigo(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:usuarios,email',
            'codigo' => 'required|string|size:6'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        $usuario = Usuario::where('email', $request->email)->first();
        $codigoGuardado = cache()->get('verification_code_' . $usuario->id_usuario);

        if (!$codigoGuardado || $codigoGuardado != $request->codigo) {
            return response()->json([
                'success' => false,
                'message' => 'Código de verificación inválido o expirado'
            ], 400);
        }

        // Marcar email como verificado
        $usuario->update(['email_verified_at' => now()]);

        // Eliminar código del cache
        cache()->forget('verification_code_' . $usuario->id_usuario);

        Log::info('Email verificado', [
            'usuario_id' => $usuario->id_usuario,
            'email' => $usuario->email
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Email verificado exitosamente'
        ]);
    }
}