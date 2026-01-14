<?php
namespace Database\Seeders;

use App\Models\Rol;
use Illuminate\Database\Seeder;

class RolSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'nombre' => 'Administrador',
                'slug' => 'administrador',
                'descripcion' => 'Acceso total al sistema con permisos de administración',
                'activo' => true
            ],
            [
                'nombre' => 'Entrenador',
                'slug' => 'entrenador',
                'descripcion' => 'Gestión de deportistas, entrenamientos y asistencias',
                'activo' => true
            ],
            [
                'nombre' => 'Instructor',
                'slug' => 'instructor',
                'descripcion' => 'Instructor de cursos y grupos',
                'activo' => true
            ],
            [
                'nombre' => 'Deportista',
                'slug' => 'deportista',
                'descripcion' => 'Usuario deportista del sistema',
                'activo' => true
            ],
            [
                'nombre' => 'Tutor',
                'slug' => 'tutor',
                'descripcion' => 'Tutor o representante de deportista',
                'activo' => true
            ],
            [
                'nombre' => 'Administrador Financiero',
                'slug' => 'admin-financiero',
                'descripcion' => 'Gestión de facturas, pagos y finanzas',
                'activo' => true
            ],
            [
                'nombre' => 'Recepcionista',
                'slug' => 'recepcionista',
                'descripcion' => 'Registro de asistencias y atención al público',
                'activo' => true
            ]
        ];

        foreach ($roles as $rol) {
            Rol::create($rol);
        }
    }
}