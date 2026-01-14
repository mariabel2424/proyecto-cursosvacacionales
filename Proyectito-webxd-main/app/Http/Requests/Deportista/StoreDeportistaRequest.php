<?php
namespace App\Http\Requests\Deportista;

use Illuminate\Foundation\Http\FormRequest;

class StoreDeportistaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Usuario
            'email' => ['required', 'email', 'unique:usuarios,email'],
            'password' => ['required', 'string', 'min:8'],
            'id_rol' => ['required', 'exists:rols,id_rol'],
            
            // Deportista
            'nombres' => ['required', 'string', 'max:100'],
            'apellidos' => ['required', 'string', 'max:100'],
            'fecha_nacimiento' => ['required', 'date', 'before:today'],
            'genero' => ['required', 'in:masculino,femenino'],
            'tipo_documento' => ['required', 'string', 'max:20'],
            'numero_documento' => ['required', 'string', 'max:50', 'unique:deportistas,numero_documento'],
            'id_categoria' => ['nullable', 'exists:categorias,id_categoria'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'direccion' => ['nullable', 'string', 'max:150'],
            'correo' => ['nullable', 'email', 'max:100'],
            'altura' => ['nullable', 'numeric', 'min:0', 'max:3'],
            'peso' => ['nullable', 'numeric', 'min:0', 'max:200'],
            'pie_habil' => ['nullable', 'in:derecho,izquierdo,ambos'],
            'numero_camiseta' => ['nullable', 'integer', 'min:1', 'max:99'],
            'foto' => ['nullable', 'image', 'max:2048'],
            
            // Contacto de emergencia
            'contacto_emergencia_nombre' => ['nullable', 'string', 'max:100'],
            'contacto_emergencia_telefono' => ['nullable', 'string', 'max:20'],
            'contacto_emergencia_relacion' => ['nullable', 'string', 'max:50']
        ];
    }

    public function messages(): array
    {
        return [
            'fecha_nacimiento.before' => 'La fecha de nacimiento debe ser anterior a hoy',
            'numero_documento.unique' => 'Este número de documento ya está registrado',
            'altura.max' => 'La altura debe ser menor a 3 metros',
            'peso.max' => 'El peso debe ser menor a 200 kg'
        ];
    }
}