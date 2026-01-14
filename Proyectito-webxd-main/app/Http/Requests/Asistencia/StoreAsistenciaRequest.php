<?php
namespace App\Http\Requests\Asistencia;

use Illuminate\Foundation\Http\FormRequest;

class StoreAsistenciaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_deportista' => ['required', 'exists:deportistas,id_deportista'],
            'id_grupo' => ['nullable', 'exists:grupos_curso,id_grupo'],
            'id_actividad' => ['nullable', 'exists:actividades,id_actividad'],
            'fecha' => ['required', 'date'],
            'hora_llegada' => ['nullable', 'date_format:H:i'],
            'estado' => ['required', 'in:presente,ausente,tarde,justificado'],
            'observaciones' => ['nullable', 'string']
        ];
    }

    public function messages(): array
    {
        return [
            'id_deportista.required' => 'Debe seleccionar un deportista',
            'estado.required' => 'Debe seleccionar el estado de asistencia'
        ];
    }
}
