<?php
namespace App\Http\Requests\Factura;

use Illuminate\Foundation\Http\FormRequest;

class StoreFacturaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_deportista' => ['required', 'exists:deportistas,id_deportista'],
            'concepto' => ['required', 'string', 'max:200'],
            'fecha_emision' => ['required', 'date'],
            'fecha_vencimiento' => ['nullable', 'date', 'after:fecha_emision'],
            'descuento' => ['nullable', 'numeric', 'min:0'],
            'impuesto' => ['nullable', 'numeric', 'min:0'],
            'metodo_pago' => ['nullable', 'in:efectivo,tarjeta,transferencia,cheque,otro'],
            'observaciones' => ['nullable', 'string'],
            
            'detalles' => ['required', 'array', 'min:1'],
            'detalles.*.concepto' => ['required', 'string', 'max:100'],
            'detalles.*.descripcion' => ['nullable', 'string'],
            'detalles.*.cantidad' => ['required', 'integer', 'min:1'],
            'detalles.*.precio_unitario' => ['required', 'numeric', 'min:0'],
            'detalles.*.descuento' => ['nullable', 'numeric', 'min:0']
        ];
    }

    public function messages(): array
    {
        return [
            'detalles.required' => 'Debe agregar al menos un detalle a la factura',
            'detalles.min' => 'Debe agregar al menos un detalle a la factura'
        ];
    }
}