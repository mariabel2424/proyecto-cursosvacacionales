<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DatabaseFailover
{
    public function handle(Request $request, Closure $next)
    {
        try {
            // Intentar conectar a la base de datos principal
            DB::connection('mysql')->getPdo();
        } catch (\Exception $e) {
            Log::warning('Base de datos principal no disponible, usando espejo', [
                'error' => $e->getMessage()
            ]);
            
            try {
                // Intentar usar la base de datos espejo
                DB::connection('mysql_mirror')->getPdo();
                
                // Cambiar la conexión por defecto a la espejo
                config(['database.default' => 'mysql_mirror']);
                DB::purge('mysql');
                
                Log::info('Failover a base de datos espejo completado');
            } catch (\Exception $mirrorError) {
                Log::error('Ambas bases de datos no disponibles', [
                    'primary_error' => $e->getMessage(),
                    'mirror_error' => $mirrorError->getMessage()
                ]);
                
                return response()->json([
                    'error' => 'Database connection failed',
                    'message' => 'No database connection available'
                ], 503);
            }
        }

        return $next($request);
    }
}
