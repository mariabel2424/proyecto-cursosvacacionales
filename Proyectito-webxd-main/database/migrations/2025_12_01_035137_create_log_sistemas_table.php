<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('log_sistemas', function (Blueprint $table) {
            $table->id('id_log');
            $table->unsignedBigInteger('id_usuario')->nullable();
            $table->string('accion', 200);
            $table->string('modelo', 100)->nullable();
            $table->unsignedBigInteger('modelo_id')->nullable();
            $table->text('descripcion')->nullable();
            $table->json('datos_anteriores')->nullable();
            $table->json('datos_nuevos')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('fecha')->useCurrent();
            $table->timestamps();
            
            $table->foreign('id_usuario')->references('id_usuario')->on('usuarios')->onDelete('set null');
            $table->index(['modelo', 'modelo_id']);
            $table->index('fecha');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('log_sistemas');
    }
};