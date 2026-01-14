<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('escenarios', function (Blueprint $table) {
            $table->id('id_escenario');
            $table->string('nombre', 100);
            $table->string('slug', 150)->unique();
            $table->string('tipo', 50);
            $table->integer('capacidad');
            $table->text('descripcion')->nullable();
            $table->string('direccion', 200)->nullable();
            $table->string('imagen')->nullable();
            $table->json('servicios')->nullable();
            $table->enum('estado', ['disponible', 'ocupado', 'mantenimiento', 'cerrado'])->default('disponible');
            
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
        Schema::dropIfExists('escenarios');
    }
};