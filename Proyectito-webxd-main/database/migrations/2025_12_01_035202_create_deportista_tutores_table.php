<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deportista_tutores', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_deportista');
            $table->unsignedBigInteger('id_tutor');
            $table->boolean('principal')->default(false); // Tutor principal (generalmente el que inscribe)
            
            $table->timestamps();
            
            // Foreign Keys
            $table->foreign('id_deportista')->references('id_deportista')->on('deportistas')->onDelete('cascade');
            $table->foreign('id_tutor')->references('id_tutor')->on('tutores')->onDelete('cascade');
            
            // Evitar duplicados
            $table->unique(['id_deportista', 'id_tutor']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deportista_tutores');
    }
};