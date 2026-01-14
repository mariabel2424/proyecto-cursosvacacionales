<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('configuraciones', function (Blueprint $table) {
            $table->id('id_configuracion');
            $table->string('clave', 100)->unique();
            $table->text('valor')->nullable();
            $table->enum('tipo', ['texto', 'numero', 'boolean', 'json', 'fecha'])->default('texto');
            $table->string('grupo', 50)->default('general');
            $table->text('descripcion')->nullable();
            $table->boolean('editable')->default(true);
            
            $table->timestamps();
            
            $table->index('clave');
            $table->index('grupo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('configuraciones');
    }
};