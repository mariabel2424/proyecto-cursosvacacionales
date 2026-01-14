<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inscripcion_cursos', function (Blueprint $table) {
            $table->id('id_inscripcion');
            $table->unsignedBigInteger('id_curso');
            $table->unsignedBigInteger('id_grupo'); // ← NUEVO: grupo específico del curso
            $table->unsignedBigInteger('id_usuario'); // ← El tutor que inscribe
            $table->unsignedBigInteger('id_deportista'); // ← NUEVO: el niño/deportista inscrito
            $table->date('fecha_inscripcion');
            $table->text('observaciones')->nullable();
            $table->enum('estado', ['activa', 'completada', 'cancelada', 'abandonada'])->default('activa');
            $table->decimal('calificacion', 5, 2)->nullable();
            $table->text('comentarios')->nullable();
            
            // Auditoría
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign Keys
            $table->foreign('id_curso')->references('id_curso')->on('cursos')->onDelete('cascade');
            $table->foreign('id_grupo')->references('id_grupo')->on('grupos_curso')->onDelete('cascade');
            $table->foreign('id_usuario')->references('id_usuario')->on('usuarios')->onDelete('cascade');
            $table->foreign('id_deportista')->references('id_deportista')->on('deportistas')->onDelete('cascade');
            
            // Índices
            $table->index('estado');
            $table->index('fecha_inscripcion');
            
            // Evitar inscripciones duplicadas del mismo deportista en el mismo grupo
            $table->unique(['id_grupo', 'id_deportista'], 'unique_deportista_grupo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inscripcion_cursos');
    }
};