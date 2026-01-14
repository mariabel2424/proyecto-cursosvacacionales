<?php
namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'exists:usuarios,email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255']
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'El correo electrónico es obligatorio',
            'email.email' => 'El correo electrónico debe ser válido',
            'email.exists' => 'No existe una cuenta con este correo',
            'password.required' => 'La contraseña es obligatoria'
        ];
    }
}
