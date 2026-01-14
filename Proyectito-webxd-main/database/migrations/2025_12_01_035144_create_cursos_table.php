<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cursos', function (Blueprint $table) {
            $table->id('id_curso');
            $table->string('nombre', 100);
            $table->string('slug', 150)->unique();
            $table->text('descripcion');
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->string('representante', 100);
            $table->string('email_representante', 100)->nullable();
            $table->string('telefono_representante', 20)->nullable();
            $table->enum('tipo', ['vacacional', 'permanente']);
            $table->enum('estado', ['abierto', 'cerrado', 'en_proceso', 'cancelado'])->default('abierto');
            $table->integer('cupo_maximo')->nullable();
            $table->integer('cupo_actual')->default(0);
            $table->decimal('precio', 10, 2)->nullable();
            $table->string('imagen')->nullable();
            
            // Auditoría
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('slug');
            $table->index('estado');
            $table->index(['fecha_inicio', 'fecha_fin']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cursos');
    }
};