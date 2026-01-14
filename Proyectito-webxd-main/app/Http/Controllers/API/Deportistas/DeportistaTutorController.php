<?php
namespace App\Http\Controllers\API\Deportistas;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

use App\Models\deportistaTutores as DeportistaTutor; // Usamos un alias
use App\Models\Deportista;
use App\Models\Tutor;
use Illuminate\Http\Request;

class DeportistaTutorController extends Controller
{
    public function index(Request $request)
    {
        $query = DeportistaTutor::with('deportista', 'tutor');

        // Filtro por deportista
        if ($request->has('id_deportista')) {
            $query->delDeportista($request->id_deportista);
        }

        // Filtro por tutor
        if ($request->has('id_tutor')) {
            $query->delTutor($request->id_tutor);
        }

        // Solo tutores principales
        if ($request->has('principales')) {
            $query->principales();
        }

        $relaciones = $query->paginate(15);
        return response()->json($relaciones);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_deportista' => 'required|exists:deportistas,id_deportista',
            'id_tutor' => 'required|exists:tutores,id_tutor',
            'principal' => 'sometimes|boolean'
        ]);

        // Verificar si ya existe la relación
        $existe = DeportistaTutor::where('id_deportista', $request->id_deportista)
                                 ->where('id_tutor', $request->id_tutor)
                                 ->exists();

        if ($existe) {
            return response()->json([
                'message' => 'Esta relación deportista-tutor ya existe'
            ], 400);
        }

        // Si se marca como principal, quitar el principal anterior de ese deportista
        if ($request->principal) {
            DeportistaTutor::where('id_deportista', $request->id_deportista)
                          ->update(['principal' => false]);
        }

        $relacion = DeportistaTutor::create([
            'id_deportista' => $request->id_deportista,
            'id_tutor' => $request->id_tutor,
            'principal' => $request->principal ?? false
        ]);

        return response()->json([
            'message' => 'Relación deportista-tutor creada exitosamente',
            'data' => $relacion->load('deportista', 'tutor')
        ], 201);
    }

    public function show($id)
    {
        $relacion = DeportistaTutor::with('deportista', 'tutor')->findOrFail($id);
        return response()->json($relacion);
    }

    public function update(Request $request, $id)
    {
        $relacion = DeportistaTutor::findOrFail($id);

        $request->validate([
            'principal' => 'required|boolean'
        ]);

        // Si se marca como principal, quitar el principal anterior de ese deportista
        if ($request->principal) {
            DeportistaTutor::where('id_deportista', $relacion->id_deportista)
                          ->where('id', '!=', $id)
                          ->update(['principal' => false]);
        }

        $relacion->update(['principal' => $request->principal]);

        return response()->json([
            'message' => 'Relación actualizada exitosamente',
            'data' => $relacion
        ]);
    }

    public function destroy($id)
    {
        $relacion = DeportistaTutor::findOrFail($id);
        
        // Verificar que el deportista tenga al menos otro tutor
        $totalTutores = DeportistaTutor::where('id_deportista', $relacion->id_deportista)->count();
        
        if ($totalTutores <= 1) {
            return response()->json([
                'message' => 'No se puede eliminar. El deportista debe tener al menos un tutor asociado.'
            ], 400);
        }

        // Si era el tutor principal, asignar otro como principal
        if ($relacion->principal) {
            $nuevoTutorPrincipal = DeportistaTutor::where('id_deportista', $relacion->id_deportista)
                                                  ->where('id', '!=', $id)
                                                  ->first();
            
            if ($nuevoTutorPrincipal) {
                $nuevoTutorPrincipal->update(['principal' => true]);
            }
        }

        $relacion->delete();

        return response()->json([
            'message' => 'Relación eliminada exitosamente'
        ]);
    }

    // Listar tutores de un deportista
    public function tutoresDeDeportista($idDeportista)
    {
        $deportista = Deportista::findOrFail($idDeportista);
        
        $tutores = DeportistaTutor::with('tutor')
                                  ->where('id_deportista', $idDeportista)
                                  ->get();

        $tutorPrincipal = $tutores->where('principal', true)->first();

        return response()->json([
            'deportista' => $deportista->nombres . ' ' . $deportista->apellidos,
            'total_tutores' => $tutores->count(),
            'tutor_principal' => $tutorPrincipal ? [
                'id_tutor' => $tutorPrincipal->tutor->id_tutor,
                'nombre' => $tutorPrincipal->tutor->nombres . ' ' . $tutorPrincipal->tutor->apellidos,
                'parentesco' => $tutorPrincipal->tutor->parentesco,
                'telefono' => $tutorPrincipal->tutor->telefono,
                'email' => $tutorPrincipal->tutor->email
            ] : null,
            'tutores' => $tutores->map(function($rel) {
                return [
                    'id_relacion' => $rel->id,
                    'id_tutor' => $rel->tutor->id_tutor,
                    'nombre' => $rel->tutor->nombres . ' ' . $rel->tutor->apellidos,
                    'parentesco' => $rel->tutor->parentesco,
                    'telefono' => $rel->tutor->telefono,
                    'email' => $rel->tutor->email,
                    'principal' => $rel->principal
                ];
            })
        ]);
    }

    // Listar deportistas de un tutor
    public function deportistasDeTutor($idTutor)
    {
        $tutor = Tutor::findOrFail($idTutor);
        
        $deportistas = DeportistaTutor::with('deportista.categoria')
                                      ->where('id_tutor', $idTutor)
                                      ->get();

        $deportistasPrincipales = $deportistas->where('principal', true);

        return response()->json([
            'tutor' => $tutor->nombres . ' ' . $tutor->apellidos,
            'total_deportistas' => $deportistas->count(),
            'deportistas_principales' => $deportistasPrincipales->count(),
            'deportistas' => $deportistas->map(function($rel) {
                return [
                    'id_relacion' => $rel->id,
                    'id_deportista' => $rel->deportista->id_deportista,
                    'nombre' => $rel->deportista->nombres . ' ' . $rel->deportista->apellidos,
                    'edad' => \Carbon\Carbon::parse($rel->deportista->fecha_nacimiento)->age,
                    'categoria' => $rel->deportista->categoria->nombre ?? 'Sin categoría',
                    'principal' => $rel->principal
                ];
            })
        ]);
    }

    // Cambiar tutor principal de un deportista
    public function cambiarTutorPrincipal(Request $request, $idDeportista)
    {
        $request->validate([
            'id_tutor' => 'required|exists:tutores,id_tutor'
        ]);

        $deportista = Deportista::findOrFail($idDeportista);

        // Verificar que la relación existe
        $relacion = DeportistaTutor::where('id_deportista', $idDeportista)
                                   ->where('id_tutor', $request->id_tutor)
                                   ->first();

        if (!$relacion) {
            return response()->json([
                'message' => 'El tutor seleccionado no está asociado a este deportista'
            ], 400);
        }

        // Quitar principal de todos los tutores de este deportista
        DeportistaTutor::where('id_deportista', $idDeportista)
                      ->update(['principal' => false]);

        // Marcar el nuevo como principal
        $relacion->update(['principal' => true]);

        return response()->json([
            'message' => 'Tutor principal actualizado exitosamente',
            'data' => $relacion->load('deportista', 'tutor')
        ]);
    }

    // Agregar tutor de emergencia rápido
    public function agregarTutorEmergencia(Request $request, $idDeportista)
    {
        $request->validate([
            'id_tutor' => 'required|exists:tutores,id_tutor'
        ]);

        $deportista = Deportista::findOrFail($idDeportista);

        // Verificar si ya existe
        $existe = DeportistaTutor::where('id_deportista', $idDeportista)
                                 ->where('id_tutor', $request->id_tutor)
                                 ->exists();

        if ($existe) {
            return response()->json([
                'message' => 'Este tutor ya está asociado al deportista'
            ], 400);
        }

        // Agregar como tutor secundario (no principal)
        $relacion = DeportistaTutor::create([
            'id_deportista' => $idDeportista,
            'id_tutor' => $request->id_tutor,
            'principal' => false
        ]);

        return response()->json([
            'message' => 'Tutor de emergencia agregado exitosamente',
            'data' => $relacion->load('deportista', 'tutor')
        ], 201);
    }

    // Obtener contactos de emergencia de un deportista
    public function contactosEmergencia($idDeportista)
    {
        $deportista = Deportista::findOrFail($idDeportista);
        
        $tutores = DeportistaTutor::with('tutor')
                                  ->where('id_deportista', $idDeportista)
                                  ->orderBy('principal', 'desc')
                                  ->get();

        $contactos = $tutores->map(function($rel) {
            return [
                'tipo' => $rel->principal ? 'Principal' : 'Secundario',
                'nombre' => $rel->tutor->nombres . ' ' . $rel->tutor->apellidos,
                'parentesco' => $rel->tutor->parentesco,
                'telefono' => $rel->tutor->telefono,
                'email' => $rel->tutor->email
            ];
        });

        // Agregar contacto de emergencia adicional del deportista si existe
        if ($deportista->contacto_emergencia_nombre) {
            $contactos->push([
                'tipo' => 'Emergencia adicional',
                'nombre' => $deportista->contacto_emergencia_nombre,
                'parentesco' => $deportista->contacto_emergencia_relacion,
                'telefono' => $deportista->contacto_emergencia_telefono,
                'email' => null
            ]);
        }

        return response()->json([
            'deportista' => $deportista->nombres . ' ' . $deportista->apellidos,
            'total_contactos' => $contactos->count(),
            'contactos' => $contactos
        ]);
    }

    // Validar acceso de tutor a deportista (útil para permisos)
    public function validarAcceso(Request $request)
    {
        $request->validate([
            'id_tutor' => 'required|exists:tutores,id_tutor',
            'id_deportista' => 'required|exists:deportistas,id_deportista'
        ]);

        $tieneAcceso = DeportistaTutor::where('id_tutor', $request->id_tutor)
                                      ->where('id_deportista', $request->id_deportista)
                                      ->exists();

        $esPrincipal = false;
        if ($tieneAcceso) {
            $relacion = DeportistaTutor::where('id_tutor', $request->id_tutor)
                                       ->where('id_deportista', $request->id_deportista)
                                       ->first();
            $esPrincipal = $relacion->principal;
        }

        return response()->json([
            'tiene_acceso' => $tieneAcceso,
            'es_principal' => $esPrincipal
        ]);
    }
}