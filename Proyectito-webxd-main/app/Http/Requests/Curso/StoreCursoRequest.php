<?php
namespace App\Http\Requests\Curso;

use Illuminate\Foundation\Http\FormRequest;

class StoreCursoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:100'],
            'descripcion' => ['required', 'string'],
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin' => ['required', 'date', 'after:fecha_inicio'],
            'representante' => ['required', 'string', 'max:100'],
            'email_representante' => ['nullable', 'email'],
            'telefono_representante' => ['nullable', 'string', 'max:20'],
            'tipo' => ['required', 'in:vacacional,permanente'],
            'cupo_maximo' => ['nullable', 'integer', 'min:1'],
            'precio' => ['nullable', 'numeric', 'min:0'],
            'imagen' => ['nullable', 'image', 'max:2048']
        ];
    }
}