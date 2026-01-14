<?php
namespace App\Http\Requests\GrupoCurso;

use Illuminate\Foundation\Http\FormRequest;

class StoreGrupoCursoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_curso' => ['required', 'exists:cursos,id_curso'],
            'nombre' => ['required', 'string', 'max:100'],
            'cupo_maximo' => ['required', 'integer', 'min:1'],
            'hora_inicio' => ['required', 'date_format:H:i'],
            'hora_fin' => ['required', 'date_format:H:i', 'after:hora_inicio'],
            'dias_semana' => ['required', 'array'],
            'dias_semana.*' => ['in:lunes,martes,miercoles,jueves,viernes,sabado,domingo']
        ];
    }

    public function messages(): array
    {
        return [
            'hora_fin.after' => 'La hora de fin debe ser posterior a la hora de inicio',
            'dias_semana.required' => 'Debe seleccionar al menos un día de la semana'
        ];
    }
}