<?php
namespace App\Http\Requests\Instructor;

use Illuminate\Foundation\Http\FormRequest;

class StoreInstructorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_usuario' => ['required', 'exists:usuarios,id_usuario', 'unique:instructores,id_usuario'],
            'especialidad' => ['required', 'string', 'max:100'],
            'certificaciones' => ['nullable', 'string'],
            'foto' => ['nullable', 'image', 'max:2048'],
            'activo' => ['boolean']
        ];
    }
}