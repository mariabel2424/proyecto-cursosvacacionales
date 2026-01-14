<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jugador_clubes', function (Blueprint $table) {
            $table->id('id_jugador_club');
            $table->unsignedBigInteger('id_deportista');
            $table->unsignedBigInteger('id_club');
            $table->date('fecha_ingreso');
            $table->date('fecha_salida')->nullable();
            $table->enum('estado', ['activo', 'inactivo', 'cedido', 'retirado'])->default('activo');
            $table->integer('numero_camiseta')->nullable();
            $table->text('observaciones')->nullable();
            
            // Auditoría
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('id_deportista')->references('id_deportista')->on('deportistas')->onDelete('cascade');
            $table->foreign('id_club')->references('id_club')->on('clubes')->onDelete('cascade');
            $table->index('estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jugador_clubes');
    }
};
