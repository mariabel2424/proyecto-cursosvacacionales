<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Categoria extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'categorias';
    protected $primaryKey = 'id_categoria';
    
    protected $fillable = [
        'nombre',
        'edad_minima',
        'edad_maxima',
        'genero',
        'descripcion',
        'activo'
    ];

    protected $casts = [
        'activo' => 'boolean',
        'edad_minima' => 'integer',
        'edad_maxima' => 'integer'
    ];

    // Relaciones
    public function deportistas()
    {
        return $this->hasMany(Deportista::class, 'id_categoria', 'id_categoria');
    }
}
