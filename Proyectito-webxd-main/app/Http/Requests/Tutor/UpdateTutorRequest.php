<?php
namespace App\Http\Requests\Tutor;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTutorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tutorId = $this->route('tutor');
        
        return [
            'nombres' => ['sometimes', 'string', 'max:100'],
            'apellidos' => ['sometimes', 'string', 'max:100'],
            'cedula' => ['sometimes', 'string', 'max:20', 'unique:tutores,cedula,' . $tutorId . ',id_tutor'],
            'telefono' => ['sometimes', 'string', 'max:20'],
            'email' => ['sometimes', 'email', 'max:100'],
            'direccion' => ['nullable', 'string'],
            'parentesco' => ['sometimes', 'in:padre,madre,abuelo,abuela,tio,tia,hermano,hermana,otro'],
            'activo' => ['boolean']
        ];
    }
}