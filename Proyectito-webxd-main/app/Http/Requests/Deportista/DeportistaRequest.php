<?php

namespace App\Http\Requests\Deportista;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DeportistaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $deportistaId = $this->route('deportista') ? $this->route('deportista')->id_deportista : null;

        return [
            'id_usuario' => 'required|exists:usuarios,id_usuario',
            'id_categoria' => 'nullable|exists:categorias,id_categoria',
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'fecha_nacimiento' => 'required|date|before:today',
            'genero' => 'required|in:masculino,femenino',
            'tipo_documento' => 'required|string|max:20',
            'numero_documento' => [
                'required',
                'string',
                'max:50',
                Rule::unique('deportistas', 'numero_documento')->ignore($deportistaId, 'id_deportista')
            ],
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'direccion' => 'nullable|string|max:150',
            'correo' => 'nullable|email|max:100',
            'telefono' => 'nullable|string|max:20',
            'altura' => 'nullable|numeric|min:0.5|max:2.5',
            'peso' => 'nullable|numeric|min:20|max:200',
            'pie_habil' => 'nullable|string|max:20',
            'numero_camiseta' => 'nullable|integer|min:1|max:99',
            'estado' => 'sometimes|in:activo,lesionado,suspendido,retirado',
            'contacto_emergencia_nombre' => 'nullable|string|max:100',
            'contacto_emergencia_telefono' => 'nullable|string|max:20',
            'contacto_emergencia_relacion' => 'nullable|string|max:50'
        ];
    }

    public function messages(): array
    {
        return [
            'id_usuario.required' => 'El usuario es requerido',
            'id_usuario.exists' => 'El usuario seleccionado no existe',
            'id_categoria.exists' => 'La categoría seleccionada no existe',
            'nombres.required' => 'Los nombres son requeridos',
            'apellidos.required' => 'Los apellidos son requeridos',
            'fecha_nacimiento.required' => 'La fecha de nacimiento es requerida',
            'fecha_nacimiento.before' => 'La fecha de nacimiento debe ser anterior a hoy',
            'genero.required' => 'El género es requerido',
            'genero.in' => 'El género debe ser masculino o femenino',
            'tipo_documento.required' => 'El tipo de documento es requerido',
            'numero_documento.required' => 'El número de documento es requerido',
            'numero_documento.unique' => 'El número de documento ya está registrado',
            'foto.image' => 'El archivo debe ser una imagen',
            'foto.max' => 'La imagen no debe superar los 2MB',
            'correo.email' => 'El correo debe ser una dirección válida',
            'altura.min' => 'La altura mínima es 0.5 metros',
            'altura.max' => 'La altura máxima es 2.5 metros',
            'peso.min' => 'El peso mínimo es 20 kg',
            'peso.max' => 'El peso máximo es 200 kg',
            'estado.in' => 'El estado debe ser uno de: activo, lesionado, suspendido, retirado'
        ];
    }

    public function attributes(): array
    {
        return [
            'id_usuario' => 'usuario',
            'id_categoria' => 'categoría',
            'fecha_nacimiento' => 'fecha de nacimiento',
            'tipo_documento' => 'tipo de documento',
            'numero_documento' => 'número de documento',
            'pie_habil' => 'pie hábil',
            'numero_camiseta' => 'número de camiseta',
            'contacto_emergencia_nombre' => 'nombre de contacto de emergencia',
            'contacto_emergencia_telefono' => 'teléfono de contacto de emergencia',
            'contacto_emergencia_relacion' => 'relación del contacto de emergencia'
        ];
    }
}