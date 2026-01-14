<?php
namespace App\Http\Requests\Club;

use Illuminate\Foundation\Http\FormRequest;

class StoreClubRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:100', 'unique:clubes,nombre'],
            'fecha_creacion' => ['required', 'date'],
            'fecha_fundacion' => ['nullable', 'date'],
            'representante' => ['required', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:100'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'direccion' => ['nullable', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'redes_sociales' => ['nullable', 'array'],
            'redes_sociales.facebook' => ['nullable', 'url'],
            'redes_sociales.instagram' => ['nullable', 'url'],
            'redes_sociales.twitter' => ['nullable', 'url']
        ];
    }
}