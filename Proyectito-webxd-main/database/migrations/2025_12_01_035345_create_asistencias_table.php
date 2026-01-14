<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asistencias', function (Blueprint $table) {
            $table->id('id_asistencia');
            $table->unsignedBigInteger('id_deportista');
            $table->unsignedBigInteger('id_grupo'); // ← NUEVO: relacionado con el grupo del curso
            $table->unsignedBigInteger('id_actividad')->nullable(); // ← Ahora NULLABLE (para eventos especiales)
            $table->date('fecha');
            $table->time('hora_llegada')->nullable();
            $table->enum('estado', ['presente', 'ausente', 'tarde', 'justificado'])->default('presente');
            $table->text('observaciones')->nullable();
            
            // Auditoría
            $table->unsignedBigInteger('created_by')->nullable(); // El instructor que toma asistencia
            $table->timestamps();
            
            // Foreign Keys
            $table->foreign('id_deportista')->references('id_deportista')->on('deportistas')->onDelete('cascade');
            $table->foreign('id_grupo')->references('id_grupo')->on('grupos_curso')->onDelete('cascade');
            $table->foreign('id_actividad')->references('id_actividad')->on('actividades')->onDelete('cascade');
            
            // Índices
            $table->index('fecha');
            $table->index('estado');
            
            // Evitar registros duplicados de asistencia
            $table->unique(['id_deportista', 'id_grupo', 'fecha'], 'unique_asistencia_diaria');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asistencias');
    }
};