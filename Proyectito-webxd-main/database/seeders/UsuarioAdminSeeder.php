<?php
namespace Database\Seeders;

use App\Models\Usuario;
use App\Models\Rol;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsuarioAdminSeeder extends Seeder
{
    public function run(): void
    {
        // Contraseña por defecto para todos los usuarios
        $passwordDefault = 'Password123!';

        $usuarios = [
            [
                'rol_slug' => 'administrador',
                'nombre' => 'Juan',
                'apellido' => 'Administrador',
                'email' => 'admin@sistemadeportivo.com',
                'telefono' => '0991234567',
                'direccion' => 'Calle Principal 123, Quito'
            ],
            [
                'rol_slug' => 'entrenador',
                'nombre' => 'Carlos',
                'apellido' => 'Entrenador',
                'email' => 'entrenador@sistemadeportivo.com',
                'telefono' => '0991234568',
                'direccion' => 'Av. Los Deportes 456, Quito'
            ],
            [
                'rol_slug' => 'instructor',
                'nombre' => 'María',
                'apellido' => 'Instructor',
                'email' => 'instructor@sistemadeportivo.com',
                'telefono' => '0991234569',
                'direccion' => 'Calle Las Flores 789, Quito'
            ],
            [
                'rol_slug' => 'deportista',
                'nombre' => 'Pedro',
                'apellido' => 'Deportista',
                'email' => 'deportista@sistemadeportivo.com',
                'telefono' => '0991234570',
                'direccion' => 'Barrio El Estadio 321, Quito'
            ],
            [
                'rol_slug' => 'tutor',
                'nombre' => 'Ana',
                'apellido' => 'Tutor',
                'email' => 'tutor@sistemadeportivo.com',
                'telefono' => '0991234571',
                'direccion' => 'Urbanización Los Pinos 654, Quito'
            ],
            [
                'rol_slug' => 'admin-financiero',
                'nombre' => 'Luis',
                'apellido' => 'Financiero',
                'email' => 'financiero@sistemadeportivo.com',
                'telefono' => '0991234572',
                'direccion' => 'Centro Comercial 987, Quito'
            ],
            [
                'rol_slug' => 'recepcionista',
                'nombre' => 'Sofia',
                'apellido' => 'Recepcionista',
                'email' => 'recepcionista@sistemadeportivo.com',
                'telefono' => '0991234573',
                'direccion' => 'Conjunto Habitacional 147, Quito'
            ]
        ];

        $this->command->info('');
        $this->command->info('👤 Creando usuarios por rol...');
        $this->command->info('');

        foreach ($usuarios as $userData) {
            $rol = Rol::where('slug', $userData['rol_slug'])->first();

            if ($rol) {
                Usuario::create([
                    'id_rol' => $rol->id_rol,
                    'nombre' => $userData['nombre'],
                    'apellido' => $userData['apellido'],
                    'email' => $userData['email'],
                    'telefono' => $userData['telefono'],
                    'direccion' => $userData['direccion'],
                    'password' => Hash::make($passwordDefault),
                    'status' => 'activo',
                    'email_verified_at' => now()
                ]);

                $this->command->info("✅ {$rol->nombre}: {$userData['email']}");
            }
        }

        $this->command->info('');
        $this->command->info('🔒 Contraseña para todos los usuarios: ' . $passwordDefault);
    }
}