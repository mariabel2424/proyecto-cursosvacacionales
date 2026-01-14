<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usuarios', function (Blueprint $table) {
            $table->id('id_usuario');
            $table->unsignedBigInteger('id_rol');
            
            // Datos personales
            $table->string('nombre', 100);
            $table->string('apellido', 100);
            $table->string('email')->unique();
            $table->string('telefono', 20)->nullable();
            $table->text('direccion')->nullable();
            $table->string('avatar')->nullable();
            
            // Autenticación
            $table->string('password');
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            
            // Estado
            $table->enum('status', ['activo', 'inactivo', 'suspendido'])->default('activo');
            
            // Auditoría
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Índices y Foreign Keys
            $table->foreign('id_rol')->references('id_rol')->on('rols')->onDelete('cascade');
            $table->index('email');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuarios');
    }
};

//