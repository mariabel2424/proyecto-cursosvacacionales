<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campeonatos', function (Blueprint $table) {
            $table->id('id_campeonato');
            $table->string('nombre', 100);
            $table->string('slug', 150)->unique();
            $table->date('fecha_inicio');
            $table->date('fecha_fin')->nullable();
            $table->string('categoria', 50);
            $table->string('representante', 100);
            $table->string('email_representante', 100)->nullable();
            $table->string('telefono_representante', 20)->nullable();
            $table->text('descripcion')->nullable();
            $table->string('imagen')->nullable();
            $table->enum('estado', ['planificado', 'en_curso', 'finalizado', 'cancelado'])->default('planificado');
            $table->json('reglas')->nullable();
            
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
        Schema::dropIfExists('campeonatos');
    }
};