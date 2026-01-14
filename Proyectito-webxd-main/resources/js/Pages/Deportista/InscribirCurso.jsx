import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, Calendar, Users, Clock, MapPin, Award,
  CheckCircle, XCircle, AlertCircle, Loader, Star,
  ChevronRight, Filter, Search, ExternalLink, Bookmark,
  PlusCircle, User, Mail, Phone, Info, Tag, DollarSign,
  Calendar as CalIcon, Users as UsersIcon
} from 'lucide-react';
import Sidebar from "./Sidebar";
import "../../../css/Deportista/InscribirCurso.css";

const InscribirCurso = () => {
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [inscribiendo, setInscribiendo] = useState(false);
  const [inscripcionExitosa, setInscripcionExitosa] = useState(false);
  const [deportistaInfo, setDeportistaInfo] = useState(null);
  const [formData, setFormData] = useState({
    observaciones: ''
  });

  // Función para obtener headers de autenticación
  const authHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return {};
    }
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  // Función para parsear respuesta JSON
  const parseJSONResponse = async (response) => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error('Error parsing JSON. Respuesta recibida:', text.substring(0, 500));
      if (text.includes('<!DOCTYPE')) {
        throw new Error('El servidor devolvió HTML en lugar de JSON. Verifica que la ruta del API esté correctamente configurada.');
      }
      throw new Error('Respuesta del servidor no es JSON válido');
    }
  };

  // Obtener información del deportista autenticado
 // Obtener información del deportista autenticado
const obtenerDeportistaInfo = useCallback(async () => {
  try {
    console.log('=== INICIANDO OBTENER DEPORTISTA INFO ===');
    const headers = authHeaders();
    
    console.log('Realizando petición a /api/auth/me...');
    const meResponse = await fetch('/api/auth/me', {
      headers: headers
    });

    console.log('Status de respuesta:', meResponse.status);
    
    if (!meResponse.ok) {
      console.error('Error en respuesta HTTP:', meResponse.status, meResponse.statusText);
      if (meResponse.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return null;
      }
      throw new Error(`Error ${meResponse.status}: No se pudo autenticar`);
    }

    const meData = await parseJSONResponse(meResponse);
    console.log('Datos completos de /api/auth/me:', meData);
    
    let deportistaInfo = {
      id_usuario: null,
      id_deportista: null,
      nombre: ''
    };

    // DEPURACIÓN: Mostrar estructura completa
    console.log('Estructura de meData:', {
      tieneUser: !!meData.user,
      tieneDeportistaEnUser: !!(meData.user?.deportista),
      tieneIdDeportistaEnUser: !!(meData.user?.id_deportista),
      tieneDeportistaDirecto: !!meData.deportista
    });

    // Opción 1: user.deportista
    if (meData.user?.deportista?.id_deportista) {
      console.log('Usando estructura: user.deportista');
      deportistaInfo.id_deportista = meData.user.deportista.id_deportista;
      deportistaInfo.id_usuario = meData.user.id_usuario;
      deportistaInfo.nombre = meData.user.nombre || meData.user.deportista.nombres || '';
    } 
    // Opción 2: user.id_deportista (directo)
    else if (meData.user?.id_deportista) {
      console.log('Usando estructura: user.id_deportista');
      deportistaInfo.id_deportista = meData.user.id_deportista;
      deportistaInfo.id_usuario = meData.user.id_usuario;
      deportistaInfo.nombre = meData.user.nombre || '';
    } 
    // Opción 3: deportista directo
    else if (meData.deportista?.id_deportista) {
      console.log('Usando estructura: deportista directo');
      deportistaInfo.id_deportista = meData.deportista.id_deportista;
      deportistaInfo.nombre = meData.deportista.nombre_completo || meData.deportista.nombres || '';
      // Intentar obtener id_usuario de alguna manera
      if (meData.deportista.id_usuario) {
        deportistaInfo.id_usuario = meData.deportista.id_usuario;
      }
    }
    // Opción 4: user básico
    else if (meData.user?.id_usuario) {
      console.log('Usando estructura: user básico');
      deportistaInfo.id_usuario = meData.user.id_usuario;
      deportistaInfo.nombre = meData.user.nombre || '';
      // Si no hay id_deportista, podría estar en otra propiedad
      if (meData.user.deportista_id) {
        deportistaInfo.id_deportista = meData.user.deportista_id;
      }
    }

    console.log('Información final del deportista:', deportistaInfo);
    
    // Validación final
    if (!deportistaInfo.id_usuario) {
      console.warn('No se pudo obtener id_usuario. Datos recibidos:', meData);
      throw new Error('No tienes un perfil de usuario válido asociado.');
    }

    if (!deportistaInfo.id_deportista) {
      console.warn('No se pudo obtener id_deportista. Datos recibidos:', meData);
      // Podríamos permitir esto si el endpoint de inscripción no lo requiere
      // throw new Error('No tienes un perfil de deportista asociado. Contacta al administrador.');
    }

    console.log('=== FINALIZANDO OBTENER DEPORTISTA INFO ===');
    return deportistaInfo;
    
  } catch (err) {
    console.error('Error al obtener información del deportista:', err);
    console.error('Error completo:', err);
    return null;
  }
}, [authHeaders]);
  // Obtener cursos disponibles para inscripción
  const fetchCursosDisponibles = useCallback(async () => {
    try {
      const headers = authHeaders();
      const response = await fetch('/api/cursos?estado=abierto', {
        headers: headers
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo cargar los cursos disponibles`);
      }

      const data = await parseJSONResponse(response);
      
      // Filtrar solo cursos con cupo disponible y que no hayan terminado
      const ahora = new Date();
      const cursosFiltrados = (data.data || data).filter(curso => {
        // Verificar si el curso está abierto
        if (curso.estado !== 'abierto') return false;
        
        // Verificar si tiene cupo disponible
        if (curso.cupo_maximo && curso.cupo_actual >= curso.cupo_maximo) return false;
        
        // Verificar que la fecha de fin sea en el futuro
        if (curso.fecha_fin) {
          const fechaFin = new Date(curso.fecha_fin);
          if (fechaFin < ahora) return false;
        }
        
        return true;
      });

      return cursosFiltrados;
    } catch (err) {
      console.error('Error al cargar cursos disponibles:', err);
      throw err;
    }
  }, [authHeaders]);

  // Cargar todos los datos
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener información del deportista
      const infoDeportista = await obtenerDeportistaInfo();
      if (!infoDeportista || !infoDeportista.id_usuario) {
        throw new Error('No tienes un perfil de deportista asociado. Contacta al administrador.');
      }
      
      setDeportistaInfo(infoDeportista);

      // Obtener cursos disponibles
      const cursos = await fetchCursosDisponibles();
      setCursosDisponibles(cursos);

    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err.message || 'Error desconocido al cargar los cursos disponibles');
    } finally {
      setLoading(false);
    }
  }, [obtenerDeportistaInfo, fetchCursosDisponibles]);

  useEffect(() => {
    let mounted = true;
    
    if (mounted) {
      cargarDatos();
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Filtrar cursos según tipo y búsqueda
  const cursosFiltrados = cursosDisponibles.filter(curso => {
    // Filtrar por tipo
    if (filtroTipo !== 'todos' && curso.tipo !== filtroTipo) {
      return false;
    }

    // Filtrar por búsqueda
    if (busqueda) {
      const searchLower = busqueda.toLowerCase();
      const matchNombre = curso.nombre?.toLowerCase().includes(searchLower);
      const matchDescripcion = curso.descripcion?.toLowerCase().includes(searchLower);
      const matchRepresentante = curso.representante?.toLowerCase().includes(searchLower);
      
      return matchNombre || matchDescripcion || matchRepresentante;
    }

    return true;
  });

  // Ver detalles de un curso
  const verDetalleCurso = (curso) => {
    setCursoSeleccionado(curso);
    setMostrarModal(true);
  };

  // Cerrar modal
  const cerrarModal = () => {
    setMostrarModal(false);
    setCursoSeleccionado(null);
    setFormData({ observaciones: '' });
  };

  // Manejar cambio en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const inscribirseCurso = async () => {
  console.log('=== CLICK EN INSCRIBIRSE ===');
  
  // Validación básica
  if (!cursoSeleccionado || !deportistaInfo) {
    setError('Información incompleta');
    return;
  }

  try {
    setInscribiendo(true);
    setError(null);

    const headers = authHeaders();

    // PASO 1: OBTENER GRUPOS DEL CURSO
    console.log('Obteniendo grupos para el curso:', cursoSeleccionado.id_curso);
    
    let gruposDisponibles = [];
    
    // Opción A: Si el curso ya incluye grupos en la respuesta
    if (cursoSeleccionado.grupos && Array.isArray(cursoSeleccionado.grupos)) {
      gruposDisponibles = cursoSeleccionado.grupos;
      console.log('Grupos desde curso:', gruposDisponibles);
    } 
    // Opción B: Usar el método del controlador que ya tienes
    else {
      try {
        console.log('Llamando a cursosDisponibles para obtener grupos...');
        const gruposResponse = await fetch('/api/inscripciones-cursos/cursos-disponibles', {
          headers: headers
        });
        
        if (gruposResponse.ok) {
          const cursosConGrupos = await parseJSONResponse(gruposResponse);
          console.log('Cursos con grupos:', cursosConGrupos);
          
          // Buscar nuestro curso específico
          const cursoConGrupos = cursosConGrupos.find(c => c.id_curso === cursoSeleccionado.id_curso);
          if (cursoConGrupos && cursoConGrupos.grupos) {
            gruposDisponibles = cursoConGrupos.grupos;
          }
        }
      } catch (gruposError) {
        console.warn('No se pudieron obtener grupos:', gruposError);
        
        // Opción C: Llamar directamente a la relación de grupos
        try {
          const gruposDirecto = await fetch(`/api/cursos/${cursoSeleccionado.id_curso}/grupos`, {
            headers: headers
          });
          
          if (gruposDirecto.ok) {
            const gruposData = await parseJSONResponse(gruposDirecto);
            gruposDisponibles = gruposData.data || gruposData || [];
          }
        } catch {
          // Si todo falla, usar un grupo por defecto (TEMPORAL)
          gruposDisponibles = [{ id_grupo: 1, nombre: 'Grupo Principal' }];
        }
      }
    }

    console.log('Grupos disponibles:', gruposDisponibles);

    // Filtrar grupos activos con cupo disponible
    const gruposConCupo = gruposDisponibles.filter(grupo => {
      if (!grupo || !grupo.id_grupo) return false;
      
      const cupoActual = grupo.cupo_actual || 0;
      const cupoMaximo = grupo.cupo_maximo || 999;
      const estado = grupo.estado || 'activo';
      
      return cupoActual < cupoMaximo && estado === 'activo';
    });

    console.log('Grupos con cupo:', gruposConCupo);

    if (gruposConCupo.length === 0) {
      throw new Error('No hay grupos con cupo disponible para este curso');
    }

    // Seleccionar el primer grupo con cupo (o dejar que el usuario elija)
    const grupoSeleccionado = gruposConCupo[0];
    console.log('Grupo seleccionado:', grupoSeleccionado);

    // PASO 2: USAR EL CONTROLADOR CORRECTO (InscripcionCursoController)
    const inscripcionData = {
      id_curso: cursoSeleccionado.id_curso,
      id_grupo: grupoSeleccionado.id_grupo, // REQUERIDO
      id_usuario: deportistaInfo.id_usuario, // REQUERIDO
      id_deportista: deportistaInfo.id_deportista, // REQUERIDO
      observaciones: formData.observaciones || ''
    };

    console.log('Datos para InscripcionCursoController:', inscripcionData);
    console.log('Endpoint correcto: /api/inscripciones-cursos');

    // USAR EL ENDPOINT CORRECTO
    const response = await fetch('/api/inscripciones-cursos', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(inscripcionData)
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error completo:', errorText);
      
      let errorMessage = 'Error al realizar la inscripción';
      
      if (errorText.includes('id_grupo') || errorText.includes('grupo')) {
        errorMessage = 'Error: No se pudo asignar un grupo válido para el curso.';
      } else if (errorText.includes('id_deportista') || errorText.includes('deportista')) {
        errorMessage = 'Tu perfil de deportista no es válido.';
      } else if (errorText.includes('cupo')) {
        errorMessage = 'No hay cupos disponibles en este grupo.';
      } else if (errorText.includes('ya está inscrito')) {
        errorMessage = 'Ya estás inscrito en este grupo.';
      } else if (errorText.includes('no pertenece')) {
        errorMessage = 'El grupo no pertenece al curso seleccionado.';
      }
      
      throw new Error(errorMessage);
    }

    const result = await parseJSONResponse(response);
    console.log('Inscripción exitosa:', result);

    // Éxito
    setInscripcionExitosa(true);
    
    // Actualizar lista de cursos disponibles
    const cursosActualizados = cursosDisponibles.filter(
      curso => curso.id_curso !== cursoSeleccionado.id_curso
    );
    setCursosDisponibles(cursosActualizados);

    // Cerrar modal después de 2 segundos
    setTimeout(() => {
      cerrarModal();
      setInscripcionExitosa(false);
      
      // Mostrar mensaje de éxito
      if (window.alert) {
        alert(`¡Inscripción exitosa!\n\nCurso: ${cursoSeleccionado.nombre}\nGrupo: ${grupoSeleccionado.nombre || 'Grupo ' + grupoSeleccionado.id_grupo}`);
      }
    }, 2000);

  } catch (err) {
    console.error('Error en inscripción:', err);
    setError(err.message || 'Error al realizar la inscripción');
  } finally {
    setInscribiendo(false);
  }
};

  // Componente de tarjeta de curso
  const CursoCard = ({ curso }) => {
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        return date.toLocaleDateString('es-EC', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      } catch {
        return 'N/A';
      }
    };

    const calcularCupoDisponible = () => {
      if (!curso.cupo_maximo) return 'Ilimitado';
      const cupoActual = curso.cupo_actual || 0;
      return `${curso.cupo_maximo - cupoActual} / ${curso.cupo_maximo}`;
    };

    const getTipoBadge = (tipo) => {
      const badges = {
        vacacional: 'badge-vacacional',
        permanente: 'badge-permanente'
      };
      return `badge ${badges[tipo] || 'badge-vacacional'}`;
    };

    return (
      <div className="curso-card">
        <div className="curso-card-header">
          {curso.imagen ? (
            <img 
              src={curso.imagen} 
              alt={curso.nombre}
              className="curso-card-imagen"
            />
          ) : (
            <div className="curso-card-icon">
              <BookOpen size={24} />
            </div>
          )}
          <div className="curso-card-titulo">
            <h3 className="curso-card-nombre">{curso.nombre}</h3>
            <div className="curso-card-badges">
              <span className={getTipoBadge(curso.tipo)}>
                {curso.tipo ? curso.tipo.charAt(0).toUpperCase() + curso.tipo.slice(1) : 'Vacacional'}
              </span>
              {curso.precio && curso.precio > 0 ? (
                <span className="badge badge-precio">
                  <DollarSign size={12} />
                  ${curso.precio}
                </span>
              ) : (
                <span className="badge badge-gratis">
                  Gratis
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="curso-card-content">
          <p className="curso-card-descripcion">
            {curso.descripcion || 'Sin descripción disponible'}
          </p>
          
          <div className="curso-card-info">
            <div className="info-item">
              <CalIcon size={16} />
              <span>
                {formatDate(curso.fecha_inicio)} - {formatDate(curso.fecha_fin)}
              </span>
            </div>
            <div className="info-item">
              <UsersIcon size={16} />
              <span>Cupos: {calcularCupoDisponible()}</span>
            </div>
            {curso.representante && (
              <div className="info-item">
                <User size={16} />
                <span>Instructor: {curso.representante}</span>
              </div>
            )}
          </div>
        </div>

        <div className="curso-card-footer">
          <button 
            className="btn btn-primary"
            onClick={() => verDetalleCurso(curso)}
          >
            <PlusCircle size={16} />
            Inscribirme
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => verDetalleCurso(curso)}
          >
            Ver detalles
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Componente de modal de inscripción
  const InscripcionModal = () => {
    if (!cursoSeleccionado) return null;

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        return date.toLocaleDateString('es-EC', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return 'N/A';
      }
    };

    const calcularCupoDisponible = () => {
      if (!cursoSeleccionado.cupo_maximo) return 'Ilimitado';
      const cupoActual = cursoSeleccionado.cupo_actual || 0;
      return cursoSeleccionado.cupo_maximo - cupoActual;
    };

    return (
      <div className="modal-overlay" onClick={cerrarModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Inscribirme al curso</h2>
            <button className="modal-close" onClick={cerrarModal}>
              &times;
            </button>
          </div>

          <div className="modal-body">
            {inscripcionExitosa ? (
              <div className="inscripcion-exitosa">
                <CheckCircle className="exito-icon" size={64} />
                <h3 className="exito-titulo">¡Inscripción exitosa!</h3>
                <p className="exito-descripcion">
                  Te has inscrito correctamente al curso <strong>{cursoSeleccionado.nombre}</strong>.
                </p>
                <p className="exito-info">
                  Revisa tus cursos en la sección "Mis Cursos" para más detalles.
                </p>
              </div>
            ) : (
              <>
                {/* Información del curso */}
                <div className="detalle-section">
                  <div className="detalle-curso-header">
                    {cursoSeleccionado.imagen && (
                      <img 
                        src={cursoSeleccionado.imagen} 
                        alt={cursoSeleccionado.nombre}
                        className="detalle-curso-imagen"
                      />
                    )}
                    <div>
                      <h3 className="detalle-curso-nombre">{cursoSeleccionado.nombre}</h3>
                      <p className="detalle-curso-descripcion">
                        {cursoSeleccionado.descripcion}
                      </p>
                    </div>
                  </div>

                  <div className="detalle-curso-info">
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Fecha de inicio:</span>
                        <span className="info-value">{formatDate(cursoSeleccionado.fecha_inicio)}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Fecha de fin:</span>
                        <span className="info-value">{formatDate(cursoSeleccionado.fecha_fin)}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Tipo:</span>
                        <span className="info-value">{cursoSeleccionado.tipo}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Cupos disponibles:</span>
                        <span className="info-value destacado">{calcularCupoDisponible()}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Instructor:</span>
                        <span className="info-value">{cursoSeleccionado.representante}</span>
                      </div>
                      {cursoSeleccionado.precio && cursoSeleccionado.precio > 0 && (
                        <div className="info-item">
                          <span className="info-label">Precio:</span>
                          <span className="info-value precio">${cursoSeleccionado.precio}</span>
                        </div>
                      )}
                      {cursoSeleccionado.email_representante && (
                        <div className="info-item">
                          <span className="info-label">Email del instructor:</span>
                          <span className="info-value">{cursoSeleccionado.email_representante}</span>
                        </div>
                      )}
                      {cursoSeleccionado.telefono_representante && (
                        <div className="info-item">
                          <span className="info-label">Teléfono:</span>
                          <span className="info-value">{cursoSeleccionado.telefono_representante}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información del deportista */}
                {deportistaInfo && (
                  <div className="detalle-section">
                    <h3 className="detalle-section-title">Mis datos</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Nombre:</span>
                        <span className="info-value">{deportistaInfo.nombre}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Usuario ID:</span>
                        <span className="info-value">{deportistaInfo.id_usuario}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Deportista ID:</span>
                        <span className="info-value">{deportistaInfo.id_deportista}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Formulario de inscripción */}
                <div className="detalle-section">
                  <h3 className="detalle-section-title">Datos de la inscripción</h3>
                  <div className="formulario-inscripcion">
                    <div className="form-group">
                      <label className="form-label">
                        Observaciones (opcional):
                      </label>
                      <textarea
                        name="observaciones"
                        value={formData.observaciones}
                        onChange={handleInputChange}
                        className="form-textarea"
                        placeholder="Comentarios adicionales sobre tu inscripción..."
                        rows="3"
                      />
                      <p className="form-hint">
                        Puedes agregar información relevante sobre tu inscripción, como restricciones médicas, preferencias, etc.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Advertencia de cupos */}
                {calcularCupoDisponible() <= 5 && calcularCupoDisponible() > 0 && (
                  <div className="advertencia">
                    <AlertCircle className="advertencia-icon" size={20} />
                    <p className="advertencia-text">
                      <strong>¡Últimos cupos disponibles!</strong> Solo quedan {calcularCupoDisponible()} cupos.
                    </p>
                  </div>
                )}

                {/* Mensaje de error */}
                {error && (
                  <div className="error-mensaje">
                    <AlertCircle className="error-icon" size={20} />
                    <p className="error-text">{error}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {!inscripcionExitosa && (
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={cerrarModal}
                disabled={inscribiendo}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={inscribirseCurso}
                disabled={inscribiendo || (cursoSeleccionado.cupo_maximo && calcularCupoDisponible() <= 0)}
              >
                {inscribiendo ? (
                  <>
                    <Loader className="loading-icon" size={16} />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Confirmar inscripción
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="inscribir-container">
        <Sidebar />
        <div className="inscribir-wrapper">
          <div className="inscribir-loading">
            <Loader className="loading-spinner" />
            <p className="loading-text">Cargando cursos disponibles...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && cursosDisponibles.length === 0) {
    return (
      <div className="inscribir-container">
        <Sidebar />
        <div className="inscribir-wrapper">
          <div className="inscribir-error">
            <AlertCircle className="error-icon" />
            <p className="error-title">Error al cargar los cursos</p>
            <p className="error-description">{error}</p>
            <button onClick={cargarDatos} className="btn-retry">
              Intentar nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inscribir-container">
      <Sidebar />
      <div className="inscribir-wrapper">
        {/* Header */}
        <div className="inscribir-header">
          <div className="inscribir-header-content">
            <div>
              <h1 className="inscribir-title">➕ Inscribirme a Curso</h1>
              <p className="inscribir-subtitle">
                Explora y únete a los cursos deportivos disponibles
              </p>
            </div>
            {deportistaInfo && (
              <div className="deportista-badge">
                <User size={16} />
                <span>{deportistaInfo.nombre}</span>
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="estadisticas-cursos">
          <div className="estadistica-card">
            <div className="estadistica-icon estadistica-primary">
              <BookOpen size={24} />
            </div>
            <div className="estadistica-content">
              <div className="estadistica-valor">{cursosDisponibles.length}</div>
              <div className="estadistica-label">Cursos disponibles</div>
            </div>
          </div>
          <div className="estadistica-card">
            <div className="estadistica-icon estadistica-success">
              <Users size={24} />
            </div>
            <div className="estadistica-content">
              <div className="estadistica-valor">
                {cursosDisponibles.filter(c => c.tipo === 'vacacional').length}
              </div>
              <div className="estadistica-label">Cursos vacacionales</div>
            </div>
          </div>
          <div className="estadistica-card">
            <div className="estadistica-icon estadistica-info">
              <Calendar size={24} />
            </div>
            <div className="estadistica-content">
              <div className="estadistica-valor">
                {cursosDisponibles.filter(c => c.tipo === 'permanente').length}
              </div>
              <div className="estadistica-label">Cursos permanentes</div>
            </div>
          </div>
          <div className="estadistica-card">
            <div className="estadistica-icon estadistica-warning">
              <Tag size={24} />
            </div>
            <div className="estadistica-content">
              <div className="estadistica-valor">
                {cursosDisponibles.filter(c => !c.precio || c.precio === 0).length}
              </div>
              <div className="estadistica-label">Cursos gratuitos</div>
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="inscribir-filtros">
          <div className="filtro-busqueda">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Buscar cursos por nombre, descripción o instructor..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="filtro-tipos">
            <span className="filtro-label">Filtrar por tipo:</span>
            <div className="filtro-buttons">
              <button
                className={`filtro-btn ${filtroTipo === 'todos' ? 'active' : ''}`}
                onClick={() => setFiltroTipo('todos')}
              >
                Todos
              </button>
              <button
                className={`filtro-btn ${filtroTipo === 'vacacional' ? 'active' : ''}`}
                onClick={() => setFiltroTipo('vacacional')}
              >
                Vacacionales
              </button>
              <button
                className={`filtro-btn ${filtroTipo === 'permanente' ? 'active' : ''}`}
                onClick={() => setFiltroTipo('permanente')}
              >
                Permanentes
              </button>
            </div>
          </div>
        </div>

        {/* Lista de cursos disponibles */}
        <div className="cursos-lista">
          {cursosFiltrados.length > 0 ? (
            <>
              <div className="resultados-header">
                <h3 className="resultados-titulo">
                  Cursos disponibles ({cursosFiltrados.length})
                </h3>
                <p className="resultados-descripcion">
                  Selecciona un curso para ver más detalles e inscribirte
                </p>
              </div>
              
              <div className="cursos-grid">
                {cursosFiltrados.map((curso) => (
                  <CursoCard
                    key={curso.id_curso || curso.id}
                    curso={curso}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="cursos-vacio">
              <BookOpen className="vacio-icon" size={64} />
              <h3 className="vacio-title">
                {busqueda || filtroTipo !== 'todos' 
                  ? 'No se encontraron cursos'
                  : 'No hay cursos disponibles'}
              </h3>
              <p className="vacio-description">
                {busqueda || filtroTipo !== 'todos' 
                  ? 'No hay cursos que coincidan con tu búsqueda o filtros aplicados.'
                  : 'Actualmente no hay cursos abiertos para inscripción. Vuelve más tarde.'}
              </p>
              {(busqueda || filtroTipo !== 'todos') && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setBusqueda('');
                    setFiltroTipo('todos');
                  }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal de inscripción */}
        {mostrarModal && <InscripcionModal />}
      </div>
    </div>
  );
};

export default InscribirCurso;