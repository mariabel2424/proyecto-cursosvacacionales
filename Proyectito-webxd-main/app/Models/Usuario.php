<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes, HasApiTokens;

    protected $table = 'usuarios';
    protected $primaryKey = 'id_usuario';
    
    protected $fillable = [
        'id_rol',
        'nombre',
        'apellido',
        'email',
        'telefono',
        'direccion',
        'avatar',
        'password',
        'status',
        'created_by',
        'updated_by',
        'deleted_by'
    ];

    protected $hidden = [
        'password',
        'remember_token'
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    // Relaciones
    public function rol()
    {
        return $this->belongsTo(Rol::class, 'id_rol', 'id_rol');
    }

 
    public function logSistemas()
    {
        return $this->hasMany(LogSistema::class, 'id_usuario', 'id_usuario');
    }

    public function inscripcionCursos()
    {
        return $this->hasMany(InscripcionCurso::class, 'id_usuario', 'id_usuario');
    }

    public function deportista()
    {
        return $this->hasOne(Deportista::class, 'id_usuario', 'id_usuario');
    }

    public function facturasCreadas()
    {
        return $this->hasMany(Factura::class, 'usuario_id', 'id_usuario');
    }

    public function notificaciones()
    {
        return $this->hasMany(Notificacion::class, 'usuario_id', 'id_usuario');
    }

    public function archivos()
    {
        return $this->hasMany(Archivo::class, 'usuario_id', 'id_usuario');
    }

    // Métodos auxiliares
    public function hasPermission($permissionSlug)
    {
        return $this->rol->permisos->contains('slug', $permissionSlug);
    }

    public function isActivo()
    {
        return $this->status === 'activo';
    }

        public function isAdmin()
    {
        return $this->rol->slug === 'administrador';
    }
}
