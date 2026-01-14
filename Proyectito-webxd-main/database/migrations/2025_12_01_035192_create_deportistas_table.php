<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deportistas', function (Blueprint $table) {
            $table->id('id_deportista');
            $table->unsignedBigInteger('id_usuario');
            $table->unsignedBigInteger('id_categoria')->nullable();
            
            // Datos personales
            $table->string('nombres', 100);
            $table->string('apellidos', 100);
            $table->date('fecha_nacimiento');
            $table->enum('genero', ['masculino', 'femenino']);
            $table->string('tipo_documento', 20);
            $table->string('numero_documento', 50)->unique();
            $table->string('foto')->nullable();
            $table->string('direccion', 150)->nullable();
            $table->string('correo', 100)->nullable();
            $table->string('telefono', 20)->nullable();
            
            // Datos deportivos
            $table->decimal('altura', 5, 2)->nullable()->comment('Altura en metros');
            $table->decimal('peso', 5, 2)->nullable()->comment('Peso en kilogramos');
            $table->string('pie_habil', 20)->nullable();
            $table->integer('numero_camiseta')->nullable();
            
            // Estado
            $table->enum('estado', ['activo', 'lesionado', 'suspendido', 'retirado'])->default('activo');
            
            // Contacto de emergencia
            $table->string('contacto_emergencia_nombre', 100)->nullable();
            $table->string('contacto_emergencia_telefono', 20)->nullable();
            $table->string('contacto_emergencia_relacion', 50)->nullable();
            
            // Auditoría
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('id_usuario')->references('id_usuario')->on('usuarios')->onDelete('cascade');
            $table->foreign('id_categoria')->references('id_categoria')->on('categorias')->onDelete('set null');
            $table->index('numero_documento');
            $table->index('estado');
            $table->index(['apellidos', 'nombres']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deportistas');
    }
};