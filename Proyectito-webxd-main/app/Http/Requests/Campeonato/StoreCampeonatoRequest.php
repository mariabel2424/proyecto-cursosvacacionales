<?php
namespace App\Http\Requests\Campeonato;

use Illuminate\Foundation\Http\FormRequest;

class StoreCampeonatoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:100'],
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin' => ['nullable', 'date', 'after:fecha_inicio'],
            'categoria' => ['required', 'string', 'max:50'],
            'representante' => ['required', 'string', 'max:100'],
            'email_representante' => ['nullable', 'email', 'max:100'],
            'telefono_representante' => ['nullable', 'string', 'max:20'],
            'descripcion' => ['nullable', 'string'],
            'imagen' => ['nullable', 'image', 'max:2048'],
            'reglas' => ['nullable', 'array']
        ];
    }
}