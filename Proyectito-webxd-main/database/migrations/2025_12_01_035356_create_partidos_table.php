<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partidos', function (Blueprint $table) {
            $table->id('id_partido');
            $table->unsignedBigInteger('id_campeonato')->nullable();
            $table->unsignedBigInteger('id_escenario')->nullable();
            $table->unsignedBigInteger('club_local_id');
            $table->unsignedBigInteger('club_visitante_id');
            $table->date('fecha');
            $table->time('hora');
            $table->integer('goles_local')->nullable();
            $table->integer('goles_visitante')->nullable();
            $table->enum('estado', ['programado', 'en_curso', 'finalizado', 'suspendido', 'cancelado'])->default('programado');
            $table->string('arbitro', 100)->nullable();
            $table->text('observaciones')->nullable();
            
            // Auditoría
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('id_campeonato')->references('id_campeonato')->on('campeonatos')->onDelete('set null');
            $table->foreign('id_escenario')->references('id_escenario')->on('escenarios')->onDelete('set null');
            $table->foreign('club_local_id')->references('id_club')->on('clubes')->onDelete('cascade');
            $table->foreign('club_visitante_id')->references('id_club')->on('clubes')->onDelete('cascade');
            $table->index('fecha');
            $table->index('estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partidos');
    }
};
