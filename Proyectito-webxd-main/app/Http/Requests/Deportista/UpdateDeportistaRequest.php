<?php
namespace App\Http\Requests\Deportista;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDeportistaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $deportistaId = $this->route('deportista');
        
        return [
            'nombres' => ['sometimes', 'string', 'max:100'],
            'apellidos' => ['sometimes', 'string', 'max:100'],
            'fecha_nacimiento' => ['sometimes', 'date', 'before:today'],
            'genero' => ['sometimes', 'in:masculino,femenino'],
            'tipo_documento' => ['sometimes', 'string', 'max:20'],
            'numero_documento' => ['sometimes', 'string', 'max:50', 'unique:deportistas,numero_documento,' . $deportistaId . ',id_deportista'],
            'id_categoria' => ['nullable', 'exists:categorias,id_categoria'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'direccion' => ['nullable', 'string', 'max:150'],
            'correo' => ['nullable', 'email', 'max:100'],
            'altura' => ['nullable', 'numeric', 'min:0', 'max:3'],
            'peso' => ['nullable', 'numeric', 'min:0', 'max:200'],
            'pie_habil' => ['nullable', 'in:derecho,izquierdo,ambos'],
            'numero_camiseta' => ['nullable', 'integer', 'min:1', 'max:99'],
            'estado' => ['sometimes', 'in:activo,lesionado,suspendido,retirado'],
            'foto' => ['nullable', 'image', 'max:2048'],
            'contacto_emergencia_nombre' => ['nullable', 'string', 'max:100'],
            'contacto_emergencia_telefono' => ['nullable', 'string', 'max:20'],
            'contacto_emergencia_relacion' => ['nullable', 'string', 'max:50']
        ];
    }
}