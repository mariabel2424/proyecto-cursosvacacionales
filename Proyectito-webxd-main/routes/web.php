<?php

use App\Http\Controllers\FrontController;
use Illuminate\Support\Facades\Route;

// Landing principal (plantilla HTML integrada)
Route::controller(FrontController::class)->group(function () {
    Route::get('/', 'index')->name('front.index');
});

// Ruta que Laravel usa desde el correo para resetear contraseña
Route::get('/reset-password/{token}', function (string $token) {
    $email = request('email');

    // Redirige a la ruta de React donde está tu formulario
    return redirect('/reestablecer-contrasena?token=' . $token . '&email=' . $email);
})->name('password.reset');

// SPA de React (login, registro, paneles, etc.)
// Cualquier ruta distinta de "/" devolverá app.blade.php
// donde se monta React. DEBE ir al final.
Route::view('/{any}', 'app')->where('any', '.*');
