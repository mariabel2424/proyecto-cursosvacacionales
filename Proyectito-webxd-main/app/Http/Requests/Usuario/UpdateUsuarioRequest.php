<?php
namespace App\Http\Requests\Usuario;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $usuarioId = $this->route('usuario');
        
        return [
            'id_rol' => ['sometimes', 'exists:rols,id_rol'],
            'nombre' => ['sometimes', 'string', 'max:100'],
            'apellido' => ['sometimes', 'string', 'max:100'],
            'email' => ['sometimes', 'email', 'unique:usuarios,email,' . $usuarioId . ',id_usuario'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'direccion' => ['nullable', 'string'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'avatar' => ['nullable', 'image', 'max:2048'],
            'status' => ['sometimes', 'in:activo,inactivo,suspendido']
        ];
    }
}