<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Configuracion extends Model
{
    use HasFactory;

    protected $table = 'configuraciones';
    protected $primaryKey = 'id_configuracion';
    
    protected $fillable = [
        'clave',
        'valor',
        'tipo',
        'grupo',
        'descripcion',
        'editable'
    ];

    protected $casts = [
        'editable' => 'boolean'
    ];

    // Métodos estáticos auxiliares
    public static function obtener($clave, $default = null)
    {
        $config = self::where('clave', $clave)->first();
        
        if (!$config) {
            return $default;
        }
        
        return self::castearValor($config->valor, $config->tipo);
    }

    public static function establecer($clave, $valor)
    {
        return self::updateOrCreate(
            ['clave' => $clave],
            ['valor' => $valor]
        );
    }

    private static function castearValor($valor, $tipo)
    {
        switch ($tipo) {
            case 'numero':
                return (float) $valor;
            case 'boolean':
                return filter_var($valor, FILTER_VALIDATE_BOOLEAN);
            case 'json':
                return json_decode($valor, true);
            case 'fecha':
                return \Carbon\Carbon::parse($valor);
            default:
                return $valor;
        }
    }
}