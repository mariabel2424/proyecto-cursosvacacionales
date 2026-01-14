<?php
namespace Database\Seeders;

use App\Models\Configuracion;
use Illuminate\Database\Seeder;

class ConfiguracionSeeder extends Seeder
{
    public function run(): void
    {
        $configuraciones = [
            // Configuraciones Generales
            [
                'clave' => 'sistema.nombre',
                'valor' => 'Sistema de Gestión Deportiva',
                'tipo' => 'texto',
                'grupo' => 'general',
                'descripcion' => 'Nombre del sistema',
                'editable' => true
            ],
            [
                'clave' => 'sistema.email',
                'valor' => 'info@sistemadeportivo.com',
                'tipo' => 'texto',
                'grupo' => 'general',
                'descripcion' => 'Email de contacto del sistema',
                'editable' => true
            ],
            [
                'clave' => 'sistema.telefono',
                'valor' => '099-123-4567',
                'tipo' => 'texto',
                'grupo' => 'general',
                'descripcion' => 'Teléfono de contacto',
                'editable' => true
            ],
            [
                'clave' => 'sistema.direccion',
                'valor' => 'Calle Principal 123, Ciudad',
                'tipo' => 'texto',
                'grupo' => 'general',
                'descripcion' => 'Dirección física',
                'editable' => true
            ],
            
            // Configuraciones de Facturación
            [
                'clave' => 'facturacion.impuesto_iva',
                'valor' => '15',
                'tipo' => 'numero',
                'grupo' => 'facturacion',
                'descripcion' => 'Porcentaje de IVA',
                'editable' => true
            ],
            [
                'clave' => 'facturacion.prefijo_factura',
                'valor' => 'FAC',
                'tipo' => 'texto',
                'grupo' => 'facturacion',
                'descripcion' => 'Prefijo para número de factura',
                'editable' => true
            ],
            [
                'clave' => 'facturacion.dias_vencimiento',
                'valor' => '30',
                'tipo' => 'numero',
                'grupo' => 'facturacion',
                'descripcion' => 'Días para vencimiento de factura',
                'editable' => true
            ],
            
            // Configuraciones de Cursos
            [
                'clave' => 'cursos.cupo_maximo_default',
                'valor' => '20',
                'tipo' => 'numero',
                'grupo' => 'cursos',
                'descripcion' => 'Cupo máximo por defecto para cursos',
                'editable' => true
            ],
            [
                'clave' => 'cursos.permitir_inscripcion_online',
                'valor' => 'true',
                'tipo' => 'boolean',
                'grupo' => 'cursos',
                'descripcion' => 'Permitir inscripciones en línea',
                'editable' => true
            ],
            
            // Configuraciones de Asistencias
            [
                'clave' => 'asistencias.minutos_tolerancia',
                'valor' => '15',
                'tipo' => 'numero',
                'grupo' => 'asistencias',
                'descripcion' => 'Minutos de tolerancia para marcar tarde',
                'editable' => true
            ],
            [
                'clave' => 'asistencias.permitir_justificaciones',
                'valor' => 'true',
                'tipo' => 'boolean',
                'grupo' => 'asistencias',
                'descripcion' => 'Permitir justificar ausencias',
                'editable' => true
            ],
            
            // Configuraciones de Notificaciones
            [
                'clave' => 'notificaciones.email_enabled',
                'valor' => 'true',
                'tipo' => 'boolean',
                'grupo' => 'notificaciones',
                'descripcion' => 'Habilitar notificaciones por email',
                'editable' => true
            ],
            [
                'clave' => 'notificaciones.sms_enabled',
                'valor' => 'false',
                'tipo' => 'boolean',
                'grupo' => 'notificaciones',
                'descripcion' => 'Habilitar notificaciones por SMS',
                'editable' => true
            ],
            
            // Configuraciones de Seguridad
            [
                'clave' => 'seguridad.sesion_duracion',
                'valor' => '120',
                'tipo' => 'numero',
                'grupo' => 'seguridad',
                'descripcion' => 'Duración de sesión en minutos',
                'editable' => true
            ],
            [
                'clave' => 'seguridad.intentos_login',
                'valor' => '5',
                'tipo' => 'numero',
                'grupo' => 'seguridad',
                'descripcion' => 'Intentos de login antes de bloquear',
                'editable' => true
            ]
        ];

        foreach ($configuraciones as $config) {
            Configuracion::create($config);
        }
    }
}
