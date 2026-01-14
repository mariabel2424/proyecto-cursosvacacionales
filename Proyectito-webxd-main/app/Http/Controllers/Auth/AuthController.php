<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class AuthController extends Controller
{
    // Mostrar formulario de login
    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    // Procesar login
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // Buscar usuario
        $user = User::where('email', $credentials['email'])->first();

        // Verificar si existe y está activo
        if (!$user || !$user->isActive()) {
            return back()->withErrors([
                'email' => 'Credenciales incorrectas o usuario inactivo.',
            ])->onlyInput('email');
        }

        // Intentar autenticar
        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            return redirect()->intended('/dashboard');
        }

        return back()->withErrors([
            'email' => 'Las credenciales proporcionadas no coinciden.',
        ])->onlyInput('email');
    }

    // Mostrar formulario de registro
    public function showRegister()
    {
        $roles = Rol::where('activo', true)
            ->whereIn('slug', ['usuario', 'entrenador']) // Solo roles permitidos para registro
            ->get(['id_rol', 'nombre']);

        return Inertia::render('Auth/Register', [
            'roles' => $roles
        ]);
    }

    // Procesar registro
    public function register(Request $request)
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:100'],
            'apellido' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:usuarios'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'id_rol' => ['required', 'exists:rols,id_rol'],
        ]);

        $user = User::create([
            'id_rol' => $validated['id_rol'],
            'nombre' => $validated['nombre'],
            'apellido' => $validated['apellido'],
            'email' => $validated['email'],
            'telefono' => $validated['telefono'] ?? null,
            'password' => Hash::make($validated['password']),
            'status' => 'activo',
        ]);

        Auth::login($user);

        return redirect('/dashboard');
    }

    // Logout
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}