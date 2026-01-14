<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instructor_grupos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_instructor');
            $table->unsignedBigInteger('id_grupo');
            $table->boolean('coordinador')->default(false); // El instructor principal/coordinador del grupo
            
            $table->timestamps();
            
            // Foreign Keys
            $table->foreign('id_instructor')->references('id_instructor')->on('instructores')->onDelete('cascade');
            $table->foreign('id_grupo')->references('id_grupo')->on('grupos_curso')->onDelete('cascade');
            
            // Evitar duplicados
            $table->unique(['id_instructor', 'id_grupo']);
            
            // Índice para buscar grupos de un instructor
            $table->index('id_instructor');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('instructor_grupos');
    }
};