import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, Calendar, Users, Clock, MapPin, Award,
  CheckCircle, XCircle, AlertCircle, Loader, Star,
  ChevronRight, Filter, Search, ExternalLink, Bookmark,
  TrendingUp, GraduationCap, Target, BarChart
} from 'lucide-react';
import Sidebar from "./Sidebar";
import "../../../css/Deportista/Cursos.css";

const Cursos = () => {
  const [cursosInscritos, setCursosInscritos] = useState([]);
  const [cursosDetalles, setCursosDetalles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [detalleCurso, setDetalleCurso] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [deportistaId, setDeportistaId] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    activos: 0,
    completados: 0,
    progreso_promedio: 0
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

  // Obtener ID del deportista autenticado
  const obtenerDeportistaId = useCallback(async () => {
    try {
      const headers = authHeaders();
      const meResponse = await fetch('/api/auth/me', {
        headers: headers
      });

      if (!meResponse.ok) {
        if (meResponse.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return null;
        }
        throw new Error(`Error ${meResponse.status}: No se pudo autenticar`);
      }

      const meData = await parseJSONResponse(meResponse);
      
      if (meData.user?.deportista?.id_deportista) {
        return meData.user.deportista.id_deportista;
      } else if (meData.user?.id_deportista) {
        return meData.user.id_deportista;
      } else if (meData.deportista?.id_deportista) {
        return meData.deportista.id_deportista;
      }

      return null;
    } catch (err) {
      console.error('Error al obtener ID del deportista:', err);
      return null;
    }
  }, [authHeaders]);

  // Obtener cursos inscritos del deportista
  const fetchCursosInscritos = useCallback(async (idDeportista) => {
    try {
      const headers = authHeaders();
      const response = await fetch(`/api/inscripciones-curso?id_deportista=${idDeportista}`, {
        headers: headers
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo cargar los cursos`);
      }

      const data = await parseJSONResponse(response);
      return data.data || data;
    } catch (err) {
      console.error('Error al cargar cursos inscritos:', err);
      throw err;
    }
  }, [authHeaders]);

  // Obtener detalles de un curso específico
  const fetchDetalleCurso = useCallback(async (idCurso) => {
    try {
      const headers = authHeaders();
      const response = await fetch(`/api/cursos/${idCurso}`, {
        headers: headers
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo cargar el detalle del curso`);
      }

      const data = await parseJSONResponse(response);
      return data;
    } catch (err) {
      console.error('Error al cargar detalle del curso:', err);
      return null;
    }
  }, [authHeaders]);

  // Cargar todos los datos
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener ID del deportista
      const idDeportista = await obtenerDeportistaId();
      if (!idDeportista) {
        throw new Error('No tienes un perfil de deportista asociado. Contacta al administrador.');
      }
      
      setDeportistaId(idDeportista);

      // Obtener cursos inscritos
      const inscripciones = await fetchCursosInscritos(idDeportista);
      
      if (!inscripciones || inscripciones.length === 0) {
        setCursosInscritos([]);
        setLoading(false);
        return;
      }

      // Procesar inscripciones
      const cursosProcesados = Array.isArray(inscripciones) ? inscripciones : (inscripciones.data || []);
      setCursosInscritos(cursosProcesados);

      // Calcular estadísticas
      calcularEstadisticas(cursosProcesados);

      // Cargar detalles de cada curso
      const detallesPromises = cursosProcesados.map(async (inscripcion) => {
        if (inscripcion.id_curso) {
          const detalle = await fetchDetalleCurso(inscripcion.id_curso);
          return { idCurso: inscripcion.id_curso, detalle };
        }
        return null;
      });

      const detallesResultados = await Promise.all(detallesPromises);
      const detallesMap = {};
      
      detallesResultados.forEach(result => {
        if (result && result.detalle) {
          detallesMap[result.idCurso] = result.detalle;
        }
      });

      setCursosDetalles(detallesMap);

    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err.message || 'Error desconocido al cargar los cursos');
    } finally {
      setLoading(false);
    }
  }, [obtenerDeportistaId, fetchCursosInscritos, fetchDetalleCurso]);

  // Calcular estadísticas de los cursos
  const calcularEstadisticas = (cursos) => {
    const total = cursos.length;
    const activos = cursos.filter(c => c.estado === 'activa').length;
    const completados = cursos.filter(c => c.estado === 'completada').length;
    const progreso_promedio = cursos.length > 0 
      ? Math.round(cursos.reduce((acc, c) => acc + (c.calificacion || 0), 0) / cursos.length)
      : 0;

    setEstadisticas({
      total,
      activos,
      completados,
      progreso_promedio
    });
  };

  useEffect(() => {
    let mounted = true;
    
    if (mounted) {
      cargarDatos();
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Filtrar cursos según estado y búsqueda
  const cursosFiltrados = cursosInscritos.filter(inscripcion => {
    // Filtrar por estado
    if (filtroEstado !== 'todos' && inscripcion.estado !== filtroEstado) {
      return false;
    }

    // Filtrar por búsqueda
    if (busqueda) {
      const cursoDetalle = cursosDetalles[inscripcion.id_curso];
      const searchLower = busqueda.toLowerCase();
      const matchNombre = cursoDetalle?.nombre?.toLowerCase().includes(searchLower);
      const matchDescripcion = cursoDetalle?.descripcion?.toLowerCase().includes(searchLower);
      const matchEstado = inscripcion.estado?.toLowerCase().includes(searchLower);
      
      return matchNombre || matchDescripcion || matchEstado;
    }

    return true;
  });

  // Ver detalle de un curso
  const verDetalleCurso = async (inscripcion) => {
    try {
      const cursoDetalle = cursosDetalles[inscripcion.id_curso] || await fetchDetalleCurso(inscripcion.id_curso);
      
      if (cursoDetalle) {
        setDetalleCurso({
          ...inscripcion,
          detalle: cursoDetalle
        });
        setMostrarModal(true);
      }
    } catch (err) {
      console.error('Error al cargar detalle del curso:', err);
      setError('No se pudo cargar el detalle del curso');
    }
  };

  // Cerrar modal
  const cerrarModal = () => {
    setMostrarModal(false);
    setDetalleCurso(null);
  };

  // Componente de tarjeta de estadística
  const StatCard = ({ title, value, icon, color }) => {
    const colorClass = `stat-card stat-card-${color}`;
    
    return (
      <div className={colorClass}>
        <div className="stat-card-icon">
          {icon}
        </div>
        <div className="stat-card-content">
          <div className="stat-card-value">{value}</div>
          <div className="stat-card-title">{title}</div>
        </div>
      </div>
    );
  };

  // Componente de tarjeta de curso
  const CursoCard = ({ inscripcion }) => {
    const cursoDetalle = cursosDetalles[inscripcion.id_curso];
    const grupo = inscripcion.grupo;
    
    const getEstadoBadge = (estado) => {
      const badges = {
        activa: 'badge-activa',
        completada: 'badge-completada',
        cancelada: 'badge-cancelada',
        abandonada: 'badge-abandonada'
      };
      return `badge ${badges[estado] || 'badge-activa'}`;
    };

    const getEstadoIcon = (estado) => {
      const icons = {
        activa: <CheckCircle className="curso-estado-icon" size={16} />,
        completada: <Award className="curso-estado-icon" size={16} />,
        cancelada: <XCircle className="curso-estado-icon" size={16} />,
        abandonada: <AlertCircle className="curso-estado-icon" size={16} />
      };
      return icons[estado] || <CheckCircle className="curso-estado-icon" size={16} />;
    };

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

    return (
      <div className="curso-card" onClick={() => verDetalleCurso(inscripcion)}>
        <div className="curso-card-header">
          <div className="curso-card-icon">
            <BookOpen size={24} />
          </div>
          <div className="curso-card-titulo">
            <h3 className="curso-card-nombre">
              {cursoDetalle?.nombre || 'Curso no disponible'}
            </h3>
            <div className="curso-card-badges">
              <span className={getEstadoBadge(inscripcion.estado)}>
                {getEstadoIcon(inscripcion.estado)}
                {inscripcion.estado ? inscripcion.estado.charAt(0).toUpperCase() + inscripcion.estado.slice(1) : 'Activa'}
              </span>
              {inscripcion.calificacion && (
                <span className="badge badge-calificacion">
                  <Star size={12} />
                  {inscripcion.calificacion}/10
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="curso-card-content">
          <p className="curso-card-descripcion">
            {cursoDetalle?.descripcion || 'Sin descripción disponible'}
          </p>
          
          <div className="curso-card-info">
            <div className="info-item">
              <Calendar size={16} />
              <span>Inscrito: {formatDate(inscripcion.fecha_inscripcion)}</span>
            </div>
            {grupo && (
              <div className="info-item">
                <Users size={16} />
                <span>Grupo: {grupo.nombre}</span>
              </div>
            )}
            {cursoDetalle?.tipo && (
              <div className="info-item">
                <Bookmark size={16} />
                <span>Tipo: {cursoDetalle.tipo}</span>
              </div>
            )}
          </div>
        </div>

        <div className="curso-card-footer">
          <button className="btn btn-outline btn-sm">
            Ver detalles
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Componente de modal de detalle
  const DetalleCursoModal = () => {
    if (!detalleCurso) return null;

    const { detalle, grupo, estado, calificacion, fecha_inscripcion, observaciones } = detalleCurso;

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

    const getEstadoColor = (estado) => {
      const colors = {
        activa: 'text-green-600 bg-green-50',
        completada: 'text-blue-600 bg-blue-50',
        cancelada: 'text-red-600 bg-red-50',
        abandonada: 'text-orange-600 bg-orange-50'
      };
      return colors[estado] || 'text-gray-600 bg-gray-50';
    };

    return (
      <div className="modal-overlay" onClick={cerrarModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">{detalle?.nombre || 'Detalle del Curso'}</h2>
            <button className="modal-close" onClick={cerrarModal}>
              &times;
            </button>
          </div>

          <div className="modal-body">
            {/* Información general */}
            <div className="detalle-section">
              <h3 className="detalle-section-title">Información del Curso</h3>
              <div className="detalle-grid">
                <div className="detalle-item">
                  <span className="detalle-label">Descripción:</span>
                  <p className="detalle-value">{detalle?.descripcion || 'Sin descripción'}</p>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">Tipo:</span>
                  <span className="detalle-value">{detalle?.tipo || 'N/A'}</span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">Fecha de Inicio:</span>
                  <span className="detalle-value">{formatDate(detalle?.fecha_inicio)}</span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">Fecha de Fin:</span>
                  <span className="detalle-value">{formatDate(detalle?.fecha_fin)}</span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">Representante:</span>
                  <span className="detalle-value">{detalle?.representante || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Información de la inscripción */}
            <div className="detalle-section">
              <h3 className="detalle-section-title">Mi Inscripción</h3>
              <div className="detalle-grid">
                <div className="detalle-item">
                  <span className="detalle-label">Estado:</span>
                  <span className={`detalle-estado ${getEstadoColor(estado)}`}>
                    {estado ? estado.charAt(0).toUpperCase() + estado.slice(1) : 'Activa'}
                  </span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">Fecha de Inscripción:</span>
                  <span className="detalle-value">{formatDate(fecha_inscripcion)}</span>
                </div>
                {calificacion && (
                  <div className="detalle-item">
                    <span className="detalle-label">Calificación:</span>
                    <span className="detalle-calificacion">
                      <Star className="inline mr-1" size={16} />
                      {calificacion}/10
                    </span>
                  </div>
                )}
                {grupo && (
                  <>
                    <div className="detalle-item">
                      <span className="detalle-label">Grupo:</span>
                      <span className="detalle-value">{grupo.nombre}</span>
                    </div>
                    {grupo.horario && (
                      <div className="detalle-item">
                        <span className="detalle-label">Horario:</span>
                        <span className="detalle-value">{grupo.horario}</span>
                      </div>
                    )}
                  </>
                )}
                {observaciones && (
                  <div className="detalle-item detalle-full">
                    <span className="detalle-label">Observaciones:</span>
                    <p className="detalle-value">{observaciones}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Información del grupo si existe */}
            {grupo && (
              <div className="detalle-section">
                <h3 className="detalle-section-title">Información del Grupo</h3>
                <div className="detalle-grid">
                  <div className="detalle-item">
                    <span className="detalle-label">Nombre del Grupo:</span>
                    <span className="detalle-value">{grupo.nombre}</span>
                  </div>
                  <div className="detalle-item">
                    <span className="detalle-label">Estado:</span>
                    <span className="detalle-value">{grupo.estado || 'N/A'}</span>
                  </div>
                  <div className="detalle-item">
                    <span className="detalle-label">Cupo:</span>
                    <span className="detalle-value">{grupo.cupo_actual || 0}/{grupo.cupo_maximo || 0}</span>
                  </div>
                  {grupo.dias_semana && (
                    <div className="detalle-item">
                      <span className="detalle-label">Días de clase:</span>
                      <span className="detalle-value">{Array.isArray(grupo.dias_semana) ? grupo.dias_semana.join(', ') : grupo.dias_semana}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={cerrarModal}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="cursos-container">
        <Sidebar />
        <div className="cursos-wrapper">
          <div className="cursos-loading">
            <Loader className="loading-spinner" />
            <p className="loading-text">Cargando cursos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && cursosInscritos.length === 0) {
    return (
      <div className="cursos-container">
        <Sidebar />
        <div className="cursos-wrapper">
          <div className="cursos-error">
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
    <div className="cursos-container">
      <Sidebar />
      <div className="cursos-wrapper">
        {/* Header */}
        <div className="cursos-header">
          <div className="cursos-header-content">
            <div>
              <h1 className="cursos-title">📚 Mis Cursos</h1>
              <p className="cursos-subtitle">
                Gestiona y revisa todos tus cursos inscritos
              </p>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="estadisticas-cursos">
          <StatCard
            title="Total de Cursos"
            value={estadisticas.total}
            icon={<BookOpen size={24} />}
            color="primary"
          />
          <StatCard
            title="Cursos Activos"
            value={estadisticas.activos}
            icon={<TrendingUp size={24} />}
            color="success"
          />
          <StatCard
            title="Completados"
            value={estadisticas.completados}
            icon={<GraduationCap size={24} />}
            color="info"
          />
          <StatCard
            title="Progreso Promedio"
            value={`${estadisticas.progreso_promedio}/10`}
            icon={<Target size={24} />}
            color="warning"
          />
        </div>

        {/* Filtros y búsqueda */}
        <div className="cursos-filtros">
          <div className="filtro-busqueda">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Buscar cursos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="filtro-estados">
            <span className="filtro-label">Filtrar por estado:</span>
            <div className="filtro-buttons">
              <button
                className={`filtro-btn ${filtroEstado === 'todos' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('todos')}
              >
                Todos
              </button>
              <button
                className={`filtro-btn ${filtroEstado === 'activa' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('activa')}
              >
                Activos
              </button>
              <button
                className={`filtro-btn ${filtroEstado === 'completada' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('completada')}
              >
                Completados
              </button>
              <button
                className={`filtro-btn ${filtroEstado === 'cancelada' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('cancelada')}
              >
                Cancelados
              </button>
            </div>
          </div>
        </div>

        {/* Lista de cursos */}
        <div className="cursos-lista">
          {cursosFiltrados.length > 0 ? (
            <div className="cursos-grid">
              {cursosFiltrados.map((inscripcion) => (
                <CursoCard
                  key={`${inscripcion.id_inscripcion_curso || inscripcion.id}-${inscripcion.id_curso}`}
                  inscripcion={inscripcion}
                />
              ))}
            </div>
          ) : (
            <div className="cursos-vacio">
              <BookOpen className="vacio-icon" size={64} />
              <h3 className="vacio-title">No hay cursos para mostrar</h3>
              <p className="vacio-description">
                {busqueda || filtroEstado !== 'todos' 
                  ? 'No se encontraron cursos con los filtros aplicados.'
                  : 'No estás inscrito en ningún curso actualmente.'}
              </p>
              {busqueda || filtroEstado !== 'todos' ? (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setBusqueda('');
                    setFiltroEstado('todos');
                  }}
                >
                  Limpiar filtros
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* Modal de detalle */}
        {mostrarModal && <DetalleCursoModal />}
      </div>
    </div>
  );
};

export default Cursos;