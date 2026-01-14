<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\Pivot;

class RolPermiso extends Pivot
{
    use HasFactory;

    protected $table = 'rol_permisos';
    public $incrementing = true;
    
    protected $fillable = [
        'id_rol',
        'id_permiso'
    ];

    // Relaciones
    public function rol()
    {
        return $this->belongsTo(Rol::class, 'id_rol', 'id_rol');
    }

    public function permiso()
    {
        return $this->belongsTo(Permiso::class, 'id_permiso', 'id_permiso');
    }
}