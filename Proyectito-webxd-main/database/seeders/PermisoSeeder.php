<?php
namespace Database\Seeders;

use App\Models\Permiso;
use Illuminate\Database\Seeder;

class PermisoSeeder extends Seeder
{
    public function run(): void
    {
        $permisos = [
            // Permisos de Usuarios
            ['nombre' => 'Ver Usuarios', 'slug' => 'usuarios.ver', 'descripcion' => 'Ver listado de usuarios', 'modulo' => 'usuarios'],
            ['nombre' => 'Crear Usuarios', 'slug' => 'usuarios.crear', 'descripcion' => 'Crear nuevos usuarios', 'modulo' => 'usuarios'],
            ['nombre' => 'Editar Usuarios', 'slug' => 'usuarios.editar', 'descripcion' => 'Editar usuarios existentes', 'modulo' => 'usuarios'],
            ['nombre' => 'Eliminar Usuarios', 'slug' => 'usuarios.eliminar', 'descripcion' => 'Eliminar usuarios', 'modulo' => 'usuarios'],
            
            // Permisos de Deportistas
            ['nombre' => 'Ver Deportistas', 'slug' => 'deportistas.ver', 'descripcion' => 'Ver listado de deportistas', 'modulo' => 'deportistas'],
            ['nombre' => 'Crear Deportistas', 'slug' => 'deportistas.crear', 'descripcion' => 'Registrar nuevos deportistas', 'modulo' => 'deportistas'],
            ['nombre' => 'Editar Deportistas', 'slug' => 'deportistas.editar', 'descripcion' => 'Editar información de deportistas', 'modulo' => 'deportistas'],
            ['nombre' => 'Eliminar Deportistas', 'slug' => 'deportistas.eliminar', 'descripcion' => 'Eliminar deportistas', 'modulo' => 'deportistas'],
            
            // Permisos de Clubes
            ['nombre' => 'Ver Clubes', 'slug' => 'clubes.ver', 'descripcion' => 'Ver listado de clubes', 'modulo' => 'clubes'],
            ['nombre' => 'Crear Clubes', 'slug' => 'clubes.crear', 'descripcion' => 'Crear nuevos clubes', 'modulo' => 'clubes'],
            ['nombre' => 'Editar Clubes', 'slug' => 'clubes.editar', 'descripcion' => 'Editar información de clubes', 'modulo' => 'clubes'],
            ['nombre' => 'Eliminar Clubes', 'slug' => 'clubes.eliminar', 'descripcion' => 'Eliminar clubes', 'modulo' => 'clubes'],
            
            // Permisos de Cursos
            ['nombre' => 'Ver Cursos', 'slug' => 'cursos.ver', 'descripcion' => 'Ver listado de cursos', 'modulo' => 'cursos'],
            ['nombre' => 'Crear Cursos', 'slug' => 'cursos.crear', 'descripcion' => 'Crear nuevos cursos', 'modulo' => 'cursos'],
            ['nombre' => 'Editar Cursos', 'slug' => 'cursos.editar', 'descripcion' => 'Editar cursos existentes', 'modulo' => 'cursos'],
            ['nombre' => 'Eliminar Cursos', 'slug' => 'cursos.eliminar', 'descripcion' => 'Eliminar cursos', 'modulo' => 'cursos'],
            
            // Permisos de Facturas
            ['nombre' => 'Ver Facturas', 'slug' => 'facturas.ver', 'descripcion' => 'Ver facturas y pagos', 'modulo' => 'facturas'],
            ['nombre' => 'Crear Facturas', 'slug' => 'facturas.crear', 'descripcion' => 'Generar nuevas facturas', 'modulo' => 'facturas'],
            ['nombre' => 'Editar Facturas', 'slug' => 'facturas.editar', 'descripcion' => 'Editar facturas', 'modulo' => 'facturas'],
            ['nombre' => 'Eliminar Facturas', 'slug' => 'facturas.eliminar', 'descripcion' => 'Anular facturas', 'modulo' => 'facturas'],
            ['nombre' => 'Registrar Pagos', 'slug' => 'pagos.registrar', 'descripcion' => 'Registrar pagos de facturas', 'modulo' => 'facturas'],
            
            // Permisos de Asistencias
            ['nombre' => 'Ver Asistencias', 'slug' => 'asistencias.ver', 'descripcion' => 'Ver registro de asistencias', 'modulo' => 'asistencias'],
            ['nombre' => 'Registrar Asistencias', 'slug' => 'asistencias.registrar', 'descripcion' => 'Tomar asistencia', 'modulo' => 'asistencias'],
            ['nombre' => 'Editar Asistencias', 'slug' => 'asistencias.editar', 'descripcion' => 'Modificar asistencias', 'modulo' => 'asistencias'],
            
            // Permisos de Campeonatos
            ['nombre' => 'Ver Campeonatos', 'slug' => 'campeonatos.ver', 'descripcion' => 'Ver campeonatos', 'modulo' => 'campeonatos'],
            ['nombre' => 'Crear Campeonatos', 'slug' => 'campeonatos.crear', 'descripcion' => 'Crear campeonatos', 'modulo' => 'campeonatos'],
            ['nombre' => 'Editar Campeonatos', 'slug' => 'campeonatos.editar', 'descripcion' => 'Editar campeonatos', 'modulo' => 'campeonatos'],
            ['nombre' => 'Eliminar Campeonatos', 'slug' => 'campeonatos.eliminar', 'descripcion' => 'Eliminar campeonatos', 'modulo' => 'campeonatos'],
            
            // Permisos de Reportes
            ['nombre' => 'Ver Reportes', 'slug' => 'reportes.ver', 'descripcion' => 'Acceso a reportes y estadísticas', 'modulo' => 'reportes'],
            ['nombre' => 'Exportar Reportes', 'slug' => 'reportes.exportar', 'descripcion' => 'Exportar reportes a Excel/PDF', 'modulo' => 'reportes'],
            
            // Permisos de Configuración
            ['nombre' => 'Ver Configuración', 'slug' => 'configuracion.ver', 'descripcion' => 'Ver configuración del sistema', 'modulo' => 'configuracion'],
            ['nombre' => 'Editar Configuración', 'slug' => 'configuracion.editar', 'descripcion' => 'Modificar configuración', 'modulo' => 'configuracion']
        ];

        foreach ($permisos as $permiso) {
            Permiso::create($permiso);
        }
    }
}
