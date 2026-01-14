<?php
namespace App\Http\Requests\Club;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClubRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $clubId = $this->route('club');
        
        return [
            'nombre' => ['sometimes', 'string', 'max:100', 'unique:clubes,nombre,' . $clubId . ',id_club'],
            'fecha_creacion' => ['sometimes', 'date'],
            'fecha_fundacion' => ['nullable', 'date'],
            'representante' => ['sometimes', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:100'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'direccion' => ['nullable', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string'],
            'estado' => ['sometimes', 'in:activo,inactivo,suspendido'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'redes_sociales' => ['nullable', 'array']
        ];
    }
}