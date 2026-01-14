<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clubes', function (Blueprint $table) {
            $table->id('id_club');
            $table->string('nombre', 100);
            $table->string('slug', 150)->unique();
            $table->date('fecha_creacion');
            $table->date('fecha_fundacion')->nullable();
            $table->string('representante', 100);
            $table->string('email', 100)->nullable();
            $table->string('telefono', 20)->nullable();
            $table->string('direccion', 150)->nullable();
            $table->string('logo')->nullable();
            $table->text('descripcion')->nullable();
            
            // Redes sociales (JSON)
            $table->json('redes_sociales')->nullable();
            
            // Estado
            $table->enum('estado', ['activo', 'inactivo', 'suspendido'])->default('activo');
            
            // Auditoría
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('slug');
            $table->index('estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clubes');
    }
};
