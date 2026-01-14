<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Importar controladores
// Importar controladores de Auth
use App\Http\Controllers\API\Auth\LoginController;
use App\Http\Controllers\API\Auth\RegisterController;
use App\Http\Controllers\API\Auth\LogoutController;
use App\Http\Controllers\API\Auth\PasswordResetController;

use App\Http\Controllers\API\Usuarios\UsuarioController;
use App\Http\Controllers\API\Usuarios\RolController;
use App\Http\Controllers\API\Usuarios\PermisoController;

use App\Http\Controllers\API\Deportistas\DeportistaController;
use App\Http\Controllers\API\Deportistas\CategoriaController;
use App\Http\Controllers\API\Deportistas\AsistenciaController;
use App\Http\Controllers\API\Deportistas\DeportistaTutorController;
use App\Http\Controllers\API\Deportistas\TutorController as TutoresTutorController;
use App\Http\Controllers\API\Deportistas\InstructorController as InstructoresInstructorController;
use App\Http\Controllers\API\Deportistas\InstructorGrupoController as InstructoresInstructorGrupoController;


use App\Http\Controllers\API\Clubes\ClubController;
use App\Http\Controllers\API\Clubes\CampeonatoController;
use App\Http\Controllers\API\Clubes\PartidoController;

use App\Http\Controllers\API\Cursos\CursoController;
use App\Http\Controllers\API\Cursos\InscripcionCursoController;
use App\Http\Controllers\API\Cursos\GrupoCursoController;

use App\Http\Controllers\API\Finanzas\FacturaController;
use App\Http\Controllers\API\Finanzas\PagoController;

use App\Http\Controllers\API\Instalaciones\EscenarioController;
use App\Http\Controllers\API\Instalaciones\ActividadController;

use App\Http\Controllers\API\Sistema\NotificacionController;
use App\Http\Controllers\API\Sistema\ArchivoController;
use App\Http\Controllers\API\Sistema\ConfiguracionController;
use App\Http\Controllers\API\Sistema\DashboardController;



 
/*
|--------------------------------------------------------------------------
| API Routes - Rutas Públicas
|--------------------------------------------------------------------------
*/
Route::get('roles', [RolController::class, 'all']);
Route::post('register', [RegisterController::class, 'register']); 

Route::prefix('auth')->group(function () {
    // Login y Registro
    Route::post('login', [LoginController::class, 'login']);
    //Route::post('register', [RegisterController::class, 'register']);
    
    // Verificación de Email
    Route::post('verificar-email', [RegisterController::class, 'verificarEmail']);
    Route::post('enviar-codigo', [RegisterController::class, 'enviarCodigoVerificacion']);
    Route::post('verificar-codigo', [RegisterController::class, 'verificarCodigo']);
    
    // Restablecimiento de Contraseña
    Route::post('solicitar-reset', [PasswordResetController::class, 'solicitarReset']);
    Route::post('verificar-token', [PasswordResetController::class, 'verificarToken']);
});

/*
|--------------------------------------------------------------------------
| Rutas Públicas para la Página de Inicio
|--------------------------------------------------------------------------
*/
// Cursos públicos (solo lectura)
Route::get('cursos', [CursoController::class, 'index']);
Route::get('cursos/{id}', [CursoController::class, 'show']);

// Partidos públicos (solo lectura)
Route::get('partidos/proximos/lista', [PartidoController::class, 'proximosPartidos']);
Route::get('partidos', [PartidoController::class, 'index']);
Route::get('partidos/{id}', [PartidoController::class, 'show']);

// Campeonatos públicos (solo lectura)
Route::get('campeonatos', [CampeonatoController::class, 'index']);
Route::get('campeonatos/{id}', [CampeonatoController::class, 'show']);
Route::get('campeonatos/{id}/tabla-posiciones', [CampeonatoController::class, 'tablaPosiciones']);
Route::get('campeonatos/{id}/fixture', [CampeonatoController::class, 'fixture']);
Route::get('campeonatos/{id}/goleadores', [CampeonatoController::class, 'goleadores']);

// Categorías públicas (solo lectura)
Route::get('categorias', [CategoriaController::class, 'index']);
Route::get('categorias/{id}', [CategoriaController::class, 'show']);

// Actividades públicas (solo lectura)
Route::get('actividades', [ActividadController::class, 'index']);
Route::get('actividades/calendario/mes', [ActividadController::class, 'calendario']);

/*
|--------------------------------------------------------------------------
| API Routes - Rutas Protegidas (Requieren Autenticación)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    

    // Auth - Usuario Autenticado
    Route::prefix('auth')->group(function () {
        Route::post('logout', [LogoutController::class, 'logout']);
        Route::post('logout-all', [LogoutController::class, 'logoutAll']);
        Route::get('me', [LoginController::class, 'me']);
        Route::post('refresh', [LoginController::class, 'refresh']);
        Route::post('cambiar-password', [PasswordResetController::class, 'cambiarPassword']);
        
        // Gestión de dispositivos
        Route::get('dispositivos', [LogoutController::class, 'dispositivos']);
        Route::delete('dispositivos/{tokenId}', [LogoutController::class, 'revocarDispositivo']);
    });
    
    // Dashboard
    Route::prefix('dashboard')->group(function () {
        Route::get('estadisticas', [DashboardController::class, 'estadisticasGenerales']);
        Route::get('proximas-actividades', [DashboardController::class, 'proximasActividades']);
        Route::get('lesiones-activas', [DashboardController::class, 'lesionesActivas']);
        Route::get('facturacion-mensual', [DashboardController::class, 'facturacionMensual']);
        Route::get('deportistas-destacados', [DashboardController::class, 'deportistasMesDestacados']);
    });
    
    // Usuarios
    Route::apiResource('usuarios', UsuarioController::class);
    Route::put('usuarios/{id}/estado', [UsuarioController::class, 'cambiarEstado']);
    
    // Roles y Permisos
    Route::apiResource('rols', RolController::class);
    Route::apiResource('permisos', PermisoController::class);
    Route::get('permisos/modulos/lista', [PermisoController::class, 'modulos']);
    
    Route::apiResource('deportistas', DeportistaController::class);
    
    // Rutas adicionales para deportistas
    Route::post('deportistas/{deportista}/cambiar-estado', [DeportistaController::class, 'cambiarEstado']);
    Route::post('deportistas/{deportista}/restaurar', [DeportistaController::class, 'restaurar']);
    Route::get('deportistas/estadisticas/generales', [DeportistaController::class, 'estadisticas']);
    Route::get('deportistas/activos/listar', [DeportistaController::class, 'activos']);
    
    // Filtros específicos
    Route::get('deportistas/estado/{estado}', [DeportistaController::class, 'porEstado']);
    Route::get('deportistas/categoria/{categoriaId}', [DeportistaController::class, 'porCategoria']);

    
    // Categorías (rutas protegidas de escritura)
    Route::post('categorias', [CategoriaController::class, 'store']);
    Route::put('categorias/{id}', [CategoriaController::class, 'update']);
    Route::delete('categorias/{id}', [CategoriaController::class, 'destroy']);
    Route::get('categorias/{id}/deportistas', [CategoriaController::class, 'deportistas']);

    // Tutores
    Route::apiResource('tutores', TutoresTutorController::class);
    Route::post('tutores/{id}/vincular-deportista', [TutoresTutorController::class, 'vincularDeportista']);
    Route::post('tutores/{id}/desvincular-deportista', [TutoresTutorController::class, 'desvincularDeportista']);
    Route::put('tutores/{id}/actualizar-principal', [TutoresTutorController::class, 'actualizarPrincipal']);
    Route::get('tutores/{id}/deportistas', [TutoresTutorController::class, 'deportistas']);
    Route::get('tutores/{id}/inscripciones', [TutoresTutorController::class, 'inscripciones']);
    Route::patch('tutores/{id}/toggle-activo', [TutoresTutorController::class, 'toggleActivo']);
    Route::post('tutores/buscar-cedula', [TutoresTutorController::class, 'buscarPorCedula']);
    Route::get('tutores/{id}/estadisticas', [TutoresTutorController::class, 'estadisticas']);

    // Deportista-Tutor (Relación)
    Route::apiResource('deportista-tutor', DeportistaTutorController::class);
    Route::get('deportista-tutor/deportista/{idDeportista}/tutores', [DeportistaTutorController::class, 'tutoresDeDeportista']);
    Route::put('deportista-tutor/deportista/{idDeportista}/cambiar-principal', [DeportistaTutorController::class, 'cambiarTutorPrincipal']);
    Route::post('deportista-tutor/deportista/{idDeportista}/agregar-emergencia', [DeportistaTutorController::class, 'agregarTutorEmergencia']);
    Route::get('deportista-tutor/deportista/{idDeportista}/contactos-emergencia', [DeportistaTutorController::class, 'contactosEmergencia']);
    Route::get('deportista-tutor/tutor/{idTutor}/deportistas', [DeportistaTutorController::class, 'deportistasDeTutor']);
    Route::post('deportista-tutor/validar-acceso', [DeportistaTutorController::class, 'validarAcceso']);

    // Instructores
    Route::apiResource('instructores', InstructoresInstructorController::class);
    Route::get('instructores/{id}/grupos', [InstructoresInstructorController::class, 'grupos']);
    Route::get('instructores/{id}/grupos-coordinados', [InstructoresInstructorController::class, 'gruposCoordinados']);
    Route::post('instructores/{id}/asignar-grupo', [InstructoresInstructorController::class, 'asignarGrupo']);
    Route::post('instructores/{id}/quitar-grupo', [InstructoresInstructorController::class, 'quitarGrupo']);
    Route::get('instructores/{id}/asistencias-tomadas', [InstructoresInstructorController::class, 'asistenciasTomadas']);
    Route::get('instructores/{id}/estadisticas', [InstructoresInstructorController::class, 'estadisticas']);
    Route::get('instructores/{id}/horario-semanal', [InstructoresInstructorController::class, 'horarioSemanal']);
    Route::patch('instructores/{id}/toggle-activo', [InstructoresInstructorController::class, 'toggleActivo']);
    Route::get('instructores/disponibles/listar', [InstructoresInstructorController::class, 'disponibles']);

    // Instructor-Grupo (Relación)
    Route::apiResource('instructor-grupo', InstructoresInstructorGrupoController::class);
    Route::get('instructor-grupo/grupo/{idGrupo}/instructores', [InstructoresInstructorGrupoController::class, 'instructoresDeGrupo']);
    Route::put('instructor-grupo/grupo/{idGrupo}/cambiar-coordinador', [InstructoresInstructorGrupoController::class, 'cambiarCoordinador']);
    Route::get('instructor-grupo/instructor/{idInstructor}/grupos', [InstructoresInstructorGrupoController::class, 'gruposDeInstructor']);
    Route::post('instructor-grupo/grupo/{idGrupo}/asignar-multiples', [InstructoresInstructorGrupoController::class, 'asignarMultiples']);
    Route::post('instructor-grupo/instructor/{idInstructorOrigen}/reasignar-grupos', [InstructoresInstructorGrupoController::class, 'reasignarGrupos']);
    Route::post('instructor-grupo/validar-acceso', [InstructoresInstructorGrupoController::class, 'validarAcceso']);
    Route::get('instructor-grupo/estadisticas/general', [InstructoresInstructorGrupoController::class, 'estadisticas']);

    // Grupos de Curso
    Route::apiResource('grupos-curso', GrupoCursoController::class);
    Route::get('grupos-curso/{id}/deportistas', [GrupoCursoController::class, 'deportistas']);
    Route::post('grupos-curso/{id}/asignar-instructor', [GrupoCursoController::class, 'asignarInstructor']);
    Route::post('grupos-curso/{id}/quitar-instructor', [GrupoCursoController::class, 'quitarInstructor']);
    Route::put('grupos-curso/{id}/actualizar-coordinador', [GrupoCursoController::class, 'actualizarCoordinador']);
    Route::get('grupos-curso/{id}/instructores', [GrupoCursoController::class, 'instructores']);
    Route::patch('grupos-curso/{id}/cambiar-estado', [GrupoCursoController::class, 'cambiarEstado']);
    Route::get('grupos-curso/{id}/estadisticas', [GrupoCursoController::class, 'estadisticas']);
    Route::get('cursos/{idCurso}/grupos-disponibles', [GrupoCursoController::class, 'gruposDisponibles']);

    // Asistencias
    Route::apiResource('asistencias', AsistenciaController::class);
    Route::get('asistencias/deportista/{id}/reporte', [AsistenciaController::class, 'reporteDeportista']);
    
    // Clubes
    Route::apiResource('clubes', ClubController::class);
    Route::get('clubes/{id}/jugadores', [ClubController::class, 'jugadores']);
    Route::post('clubes/{id}/agregar-jugador', [ClubController::class, 'agregarJugador']);
    Route::get('clubes/{id}/partidos', [ClubController::class, 'partidos']);
    
    // Campeonatos (rutas protegidas de escritura)
    Route::post('campeonatos', [CampeonatoController::class, 'store']);
    Route::put('campeonatos/{id}', [CampeonatoController::class, 'update']);
    Route::delete('campeonatos/{id}', [CampeonatoController::class, 'destroy']);
    Route::post('campeonatos/{id}/inscribir-club', [CampeonatoController::class, 'inscribirClub']);
    
    // Partidos (rutas protegidas de escritura)
    Route::post('partidos', [PartidoController::class, 'store']);
    Route::put('partidos/{id}', [PartidoController::class, 'update']);
    Route::delete('partidos/{id}', [PartidoController::class, 'destroy']);
    Route::post('partidos/{id}/finalizar', [PartidoController::class, 'finalizarPartido']);
    
    // Cursos (rutas protegidas de escritura)
    Route::post('cursos', [CursoController::class, 'store']);
    Route::put('cursos/{id}', [CursoController::class, 'update']);
    Route::delete('cursos/{id}', [CursoController::class, 'destroy']);
    Route::post('cursos/{id}/inscribir', [CursoController::class, 'inscribir']);
    Route::get('cursos/{id}/participantes', [CursoController::class, 'participantes']);
        Route::get('cursos-abiertos', [CursoController::class, 'cursosAbiertos']);
    
    // Inscripciones a Cursos
    Route::apiResource('inscripciones-curso', InscripcionCursoController::class);
    Route::post('inscripciones-curso/{id}/calificar', [InscripcionCursoController::class, 'calificar']);
    
    // Facturas
    Route::apiResource('facturas', FacturaController::class);
    Route::post('facturas/{id}/registrar-pago', [FacturaController::class, 'registrarPago']);
    Route::get('facturas/reporte/facturacion', [FacturaController::class, 'reporteFacturacion']);
    
    // Pagos
    Route::apiResource('pagos', PagoController::class)->except(['store']);
    Route::post('pagos/{id}/verificar', [PagoController::class, 'verificar']);
    Route::post('pagos/{id}/rechazar', [PagoController::class, 'rechazar']);
    
    // Escenarios
    Route::apiResource('escenarios', EscenarioController::class);
    Route::get('escenarios/{id}/disponibilidad', [EscenarioController::class, 'disponibilidad']);
    
    // Actividades (rutas protegidas de escritura)
    Route::post('actividades', [ActividadController::class, 'store']);
    Route::put('actividades/{id}', [ActividadController::class, 'update']);
    Route::delete('actividades/{id}', [ActividadController::class, 'destroy']);
    Route::post('actividades/{id}/registrar-asistencia', [ActividadController::class, 'registrarAsistencia']);
    Route::get('actividades/{id}/lista-asistencia', [ActividadController::class, 'listaAsistencia']);
    
    // Notificaciones
    Route::apiResource('notificaciones', NotificacionController::class)->except(['update']);
    Route::post('notificaciones/{id}/marcar-leida', [NotificacionController::class, 'marcarLeida']);
    Route::post('notificaciones/marcar-todas-leidas', [NotificacionController::class, 'marcarTodasLeidas']);
    Route::get('notificaciones/no-leidas/cantidad', [NotificacionController::class, 'noLeidas']);
    
    // Archivos
    Route::apiResource('archivos', ArchivoController::class)->except(['update']);
    Route::get('archivos/{id}/descargar', [ArchivoController::class, 'descargar']);
    
    // Configuraciones
    Route::apiResource('configuraciones', ConfiguracionController::class);
    Route::get('configuraciones/clave/{clave}', [ConfiguracionController::class, 'obtenerPorClave']);
    Route::post('configuraciones/clave/{clave}', [ConfiguracionController::class, 'establecerPorClave']);
    Route::get('configuraciones/grupos/lista', [ConfiguracionController::class, 'grupos']);
});