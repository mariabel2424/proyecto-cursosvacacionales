<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instructores', function (Blueprint $table) {
            $table->id('id_instructor');
            $table->unsignedBigInteger('id_usuario'); // El instructor también es usuario del sistema
            $table->string('especialidad', 100); // fútbol, básquet, natación, voleibol, etc.
            $table->text('certificaciones')->nullable(); // Títulos, certificados, cursos realizados
            $table->string('foto')->nullable();
            $table->boolean('activo')->default(true);
            
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign Keys
            $table->foreign('id_usuario')->references('id_usuario')->on('usuarios')->onDelete('cascade');
            
            // Índices
            $table->index('especialidad');
            $table->index('activo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('instructores');
    }
};