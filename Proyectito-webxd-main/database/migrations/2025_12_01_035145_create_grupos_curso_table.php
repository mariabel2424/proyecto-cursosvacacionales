<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grupos_curso', function (Blueprint $table) {
            $table->id('id_grupo');
            $table->unsignedBigInteger('id_curso');
            $table->string('nombre', 100); // Ej: "Grupo A - Mañana", "Grupo B - Tarde"
            $table->integer('cupo_maximo')->default(30);
            $table->integer('cupo_actual')->default(0);
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->json('dias_semana'); // ["lunes", "miércoles", "viernes"] o [1, 3, 5]
            $table->enum('estado', ['activo', 'inactivo', 'completo', 'cancelado'])->default('activo');
            
            // Auditoría
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign Keys
            $table->foreign('id_curso')->references('id_curso')->on('cursos')->onDelete('cascade');
            
            // Índices
            $table->index('estado');
            $table->index(['id_curso', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grupos_curso');
    }
};