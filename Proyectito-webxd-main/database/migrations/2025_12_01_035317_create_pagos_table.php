<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pagos', function (Blueprint $table) {
            $table->id('id_pago');
            $table->unsignedBigInteger('id_factura');
            $table->string('numero_pago', 50)->unique();
            $table->decimal('monto', 10, 2);
            $table->date('fecha_pago');
            $table->enum('metodo_pago', ['efectivo', 'tarjeta', 'transferencia', 'cheque', 'otro']);
            $table->string('referencia', 100)->nullable();
            $table->string('comprobante')->nullable();
            $table->text('observaciones')->nullable();
            $table->enum('estado', ['verificado', 'pendiente', 'rechazado'])->default('verificado');
            
            // Auditoría
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('id_factura')->references('id_factura')->on('facturas')->onDelete('cascade');
            $table->index('numero_pago');
            $table->index('fecha_pago');
            $table->index('estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos');
    }
};