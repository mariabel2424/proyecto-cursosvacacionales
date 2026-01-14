<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('archivos', function (Blueprint $table) {
            $table->id('id_archivo');
            $table->string('archivable_type');
            $table->unsignedBigInteger('archivable_id');
            $table->enum('tipo', ['imagen', 'documento', 'video', 'audio', 'otro']);
            $table->string('nombre_original', 255);
            $table->string('nombre_archivo', 255);
            $table->string('ruta', 500);
            $table->string('extension', 10);
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('tamaño')->comment('Tamaño en bytes');
            $table->text('descripcion')->nullable();
            $table->unsignedBigInteger('usuario_id')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('usuario_id')->references('id_usuario')->on('usuarios')->onDelete('set null');
            $table->index(['archivable_type', 'archivable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('archivos');
    }
};