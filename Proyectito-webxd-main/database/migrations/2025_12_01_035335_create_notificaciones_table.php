<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notificaciones', function (Blueprint $table) {
            $table->id('id_notificacion');
            $table->unsignedBigInteger('usuario_id');
            $table->enum('tipo', ['info', 'success', 'warning', 'error', 'mensaje']);
            $table->string('titulo', 200);
            $table->text('mensaje');
            $table->json('data')->nullable();
            $table->string('url')->nullable();
            $table->boolean('leida')->default(false);
            $table->timestamp('fecha_lectura')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('usuario_id')->references('id_usuario')->on('usuarios')->onDelete('cascade');
            $table->index('usuario_id');
            $table->index('leida');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notificaciones');
    }
};
