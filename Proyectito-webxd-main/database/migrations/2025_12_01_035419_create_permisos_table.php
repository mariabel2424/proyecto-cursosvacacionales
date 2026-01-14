<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permisos', function (Blueprint $table) {
            $table->id('id_permiso');
            $table->string('nombre', 100);
            $table->string('slug', 100)->unique();
            $table->text('descripcion')->nullable();
            $table->string('modulo', 50);
            $table->timestamps();
            
            $table->index('slug');
            $table->index('modulo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permisos');
    }
};