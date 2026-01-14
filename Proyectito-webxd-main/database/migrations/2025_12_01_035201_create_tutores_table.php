<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tutores', function (Blueprint $table) {
            $table->id('id_tutor');
            $table->unsignedBigInteger('id_usuario'); // El tutor también es usuario del sistema
            $table->string('nombres', 100);
            $table->string('apellidos', 100);
            $table->string('cedula', 20)->unique();
            $table->string('telefono', 20);
            $table->string('email', 100);
            $table->text('direccion')->nullable();
            $table->enum('parentesco', ['padre', 'madre', 'abuelo', 'abuela', 'tio', 'tia', 'hermano', 'hermana', 'tutor_legal', 'otro'])->default('padre');
            $table->boolean('activo')->default(true);
            
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign Keys
            $table->foreign('id_usuario')->references('id_usuario')->on('usuarios')->onDelete('cascade');
            
            // Índices
            $table->index('cedula');
            $table->index('activo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tutores');
    }
};