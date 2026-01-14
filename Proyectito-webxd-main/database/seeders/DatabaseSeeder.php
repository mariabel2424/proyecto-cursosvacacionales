<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolSeeder::class,
            PermisoSeeder::class,
            CategoriaSeeder::class,
            ConfiguracionSeeder::class,
            UsuarioAdminSeeder::class,
        ]);

        $this->command->info('');
        $this->command->info('🎉 ¡Seeders ejecutados exitosamente!');
        $this->command->info('');
        $this->command->info('Datos creados:');
        $this->command->info('✅ 7 Roles');
        $this->command->info('✅ 32 Permisos');
        $this->command->info('✅ 20 Categorías');
        $this->command->info('✅ 16 Configuraciones');
        $this->command->info('✅ 1 Usuario Administrador');
        $this->command->info('');
        $this->command->info('Credenciales de acceso:');
        $this->command->info('📧 Email: admin@sistemadeportivo.com');
        $this->command->info('🔒 Password: Admin123!');
    }
}