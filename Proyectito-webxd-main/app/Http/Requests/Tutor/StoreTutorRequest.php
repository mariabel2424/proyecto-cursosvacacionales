<?php
namespace App\Http\Requests\Tutor;

use Illuminate\Foundation\Http\FormRequest;

class StoreTutorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_usuario' => ['required', 'exists:usuarios,id_usuario'],
            'nombres' => ['required', 'string', 'max:100'],
            'apellidos' => ['required', 'string', 'max:100'],
            'cedula' => ['required', 'string', 'max:20', 'unique:tutores,cedula'],
            'telefono' => ['required', 'string', 'max:20'],
            'email' => ['required', 'email', 'max:100'],
            'direccion' => ['nullable', 'string'],
            'parentesco' => ['required', 'in:padre,madre,abuelo,abuela,tio,tia,hermano,hermana,otro'],
            'activo' => ['boolean']
        ];
    }
}