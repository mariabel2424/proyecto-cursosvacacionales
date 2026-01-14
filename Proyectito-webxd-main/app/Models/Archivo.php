<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Archivo extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'archivos';
    protected $primaryKey = 'id_archivo';
    
    protected $fillable = [
        'archivable_type',
        'archivable_id',
        'tipo',
        'nombre_original',
        'nombre_archivo',
        'ruta',
        'extension',
        'mime_type',
        'tamaño',
        'descripcion',
        'usuario_id'
    ];

    protected $casts = [
        'tamaño' => 'integer'
    ];

    // Relaciones polimórficas
    public function archivable()
    {
        return $this->morphTo();
    }

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id_usuario');
    }

    // Métodos auxiliares
    public function getUrlAttribute()
    {
        return asset('storage/' . $this->ruta);
    }

    public function getTamañoFormateadoAttribute()
    {
        $bytes = $this->tamaño;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
}