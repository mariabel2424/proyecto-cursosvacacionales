<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('programa_actividades', function (Blueprint $table) {
            $table->id('id_programa');
            $table->unsignedBigInteger('id_escenario');
            $table->unsignedBigInteger('id_actividad');
            $table->text('observaciones')->nullable();
            
            // Auditoría
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('id_escenario')->references('id_escenario')->on('escenarios')->onDelete('cascade');
            $table->foreign('id_actividad')->references('id_actividad')->on('actividades')->onDelete('cascade');
            $table->unique(['id_escenario', 'id_actividad']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('programa_actividades');
    }
};