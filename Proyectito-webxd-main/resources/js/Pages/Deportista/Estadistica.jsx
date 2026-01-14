import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, Users, Target, Calendar, CheckCircle, 
  XCircle, Clock, Activity, Award, BarChart3,
  TrendingDown, Loader, AlertCircle, Target as Goal,
  Heart, Zap, Trophy, Star, TrendingUp as UpTrend
} from 'lucide-react';
import Sidebar from "./Sidebar";
import "../../../css/Deportista/Estadisticas.css";

const Estadisticas = () => {
  const [deportista, setDeportista] = useState(null);
  const [estadisticasAsistencia, setEstadisticasAsistencia] = useState(null);
  const [estadisticasRendimiento, setEstadisticasRendimiento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rangoFechas, setRangoFechas] = useState({
    fecha_desde: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    fecha_hasta: new Date().toISOString().split('T')[0]
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

  // Función para parsear respuesta JSON con manejo de errores
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

  // Obtener datos del deportista autenticado - NO DEPENDE DE NADA
  const fetchDeportistaProfile = useCallback(async () => {
    try {
      const headers = authHeaders();
      
      // Obtener datos del usuario autenticado
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
      
      // Buscar id_deportista en la respuesta
      let idDeportista = null;
      
      if (meData.user?.deportista?.id_deportista) {
        idDeportista = meData.user.deportista.id_deportista;
      } else if (meData.user?.id_deportista) {
        idDeportista = meData.user.id_deportista;
      } else if (meData.deportista?.id_deportista) {
        idDeportista = meData.deportista.id_deportista;
      }

      if (!idDeportista) {
        throw new Error('No tienes un perfil de deportista asociado. Contacta al administrador.');
      }
      
      // Obtener datos completos del deportista
      const deportistaResponse = await fetch(`/api/deportistas/${idDeportista}`, {
        headers: headers
      });

      if (!deportistaResponse.ok) {
        throw new Error(`Error ${deportistaResponse.status}: No se pudo cargar el perfil`);
      }

      const deportistaData = await parseJSONResponse(deportistaResponse);
      
      if (deportistaData.success && deportistaData.data) {
        setDeportista(deportistaData.data);
        return { id: idDeportista, data: deportistaData.data };
      } else {
        throw new Error(deportistaData.message || 'Error al cargar los datos del deportista');
      }
    } catch (err) {
      console.error('Error al cargar perfil:', err);
      throw err;
    }
  }, [authHeaders]); // Solo depende de authHeaders

  // Cargar estadísticas de asistencia
  const fetchEstadisticasAsistencia = useCallback(async (deportistaId) => {
    try {
      const headers = authHeaders();
      const asistenciaUrl = `/api/asistencias/deportista/${deportistaId}/reporte?fecha_desde=${rangoFechas.fecha_desde}&fecha_hasta=${rangoFechas.fecha_hasta}`;
      
      const asistenciaResponse = await fetch(asistenciaUrl, { headers });
      if (asistenciaResponse.ok) {
        const asistenciaData = await parseJSONResponse(asistenciaResponse);
        setEstadisticasAsistencia(asistenciaData);
        return asistenciaData;
      }
      return null;
    } catch (err) {
      console.error('Error al cargar estadísticas de asistencia:', err);
      return null;
    }
  }, [authHeaders, rangoFechas.fecha_desde, rangoFechas.fecha_hasta]); // Dependencias específicas

  // Generar estadísticas de rendimiento basadas en datos del deportista
  const generarEstadisticasRendimiento = useCallback((deportistaData) => {
    // Datos simulados basados en el deportista
    const rendimiento = {
      imc: deportistaData?.imc || 22.5,
      progreso_fisico: 85,
      metas_cumplidas: 12,
      total_metas: 15,
      nivel_actual: deportistaData?.categoria?.nombre || "Intermedio",
      proximo_nivel: "Avanzado",
      progreso_nivel: 75,
      sesiones_semana: 4,
      promedio_sesiones: 3.8,
      mejoras: [
        { nombre: "Resistencia", progreso: 85 },
        { nombre: "Fuerza", progreso: 72 },
        { nombre: "Flexibilidad", progreso: 68 },
        { nombre: "Técnica", progreso: 90 }
      ]
    };
    
    setEstadisticasRendimiento(rendimiento);
    return rendimiento;
  }, []); // Sin dependencias

  // Cargar todas las estadísticas - FUNCIÓN ESTABLE
  const cargarEstadisticas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener datos del deportista
      const deportistaInfo = await fetchDeportistaProfile();
      if (!deportistaInfo) {
        setError('No se pudo cargar la información del deportista');
        setLoading(false);
        return;
      }

      // Cargar estadísticas de asistencia
      await fetchEstadisticasAsistencia(deportistaInfo.id);

      // Generar estadísticas de rendimiento
      generarEstadisticasRendimiento(deportistaInfo.data);

    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setError(err.message || 'Error desconocido al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  }, [fetchDeportistaProfile, fetchEstadisticasAsistencia, generarEstadisticasRendimiento]); // Dependencias estables

  // useEffect para carga inicial
  useEffect(() => {
    let mounted = true;
    
    if (mounted) {
      cargarEstadisticas();
    }

    return () => {
      mounted = false;
    };
  }, []); // Solo se ejecuta una vez al montar

  // useEffect para recargar cuando cambia el rango de fechas
  useEffect(() => {
    if (deportista?.id_deportista) {
      fetchEstadisticasAsistencia(deportista.id_deportista);
    }
  }, [rangoFechas, deportista?.id_deportista]); // Solo recarga asistencia cuando cambian fechas

  const handleRangoFechasChange = (e) => {
    const { name, value } = e.target;
    setRangoFechas(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const aplicarRangoFechas = () => {
    if (deportista?.id_deportista) {
      fetchEstadisticasAsistencia(deportista.id_deportista);
    }
  };

  // Componente de tarjeta de métrica
  const MetricCard = ({ title, value, icon, color, change, subtitle, loading }) => {
    if (loading) {
      return (
        <div className="metric-card">
          <div className="metric-card-content">
            <div className="metric-card-header">
              <div className="metric-card-icon-skeleton"></div>
              <div className="metric-card-title-skeleton"></div>
            </div>
            <div className="metric-value-skeleton"></div>
            <div className="metric-subtitle-skeleton"></div>
          </div>
        </div>
      );
    }

    const colorClass = `metric-card metric-card-${color}`;
    const ChangeIcon = change > 0 ? TrendingUp : TrendingDown;
    const changeColor = change > 0 ? 'positive' : 'negative';

    return (
      <div className={colorClass}>
        <div className="metric-card-content">
          <div className="metric-card-header">
            <div className="metric-card-icon">
              {icon}
            </div>
            <h3 className="metric-card-title">{title}</h3>
          </div>
          <div className="metric-value">{value}</div>
          {subtitle && <p className="metric-subtitle">{subtitle}</p>}
          {change !== undefined && (
            <div className={`metric-change metric-change-${changeColor}`}>
              <ChangeIcon className="metric-change-icon" size={16} />
              <span className="metric-change-value">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Componente de barra de progreso
  const ProgressBar = ({ label, value, total, color, showPercentage = true }) => {
    const percentage = total > 0 ? (value / total) * 100 : value;
    
    return (
      <div className="progress-item">
        <div className="progress-header">
          <span className="progress-label">{label}</span>
          {showPercentage ? (
            <span className="progress-value">{value} ({percentage.toFixed(1)}%)</span>
          ) : (
            <span className="progress-value">{value}/{total}</span>
          )}
        </div>
        <div className="progress-bar">
          <div 
            className={`progress-bar-fill progress-bar-${color}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Componente de mejora individual
  const MejoraCard = ({ nombre, progreso }) => {
    return (
      <div className="mejora-card">
        <div className="mejora-header">
          <span className="mejora-nombre">{nombre}</span>
          <span className="mejora-progreso">{progreso}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className={`progress-bar-fill progress-bar-${progreso > 80 ? 'success' : progreso > 60 ? 'warning' : 'danger'}`}
            style={{ width: `${progreso}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="estadisticas-container">
        <Sidebar />
        <div className="estadisticas-wrapper">
          <div className="estadisticas-loading">
            <Loader className="loading-spinner" />
            <p className="loading-text">Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !deportista) {
    return (
      <div className="estadisticas-container">
        <Sidebar />
        <div className="estadisticas-wrapper">
          <div className="estadisticas-error">
            <AlertCircle className="error-icon" />
            <p className="error-title">Error al cargar las estadísticas</p>
            <p className="error-description">{error}</p>
            <button onClick={cargarEstadisticas} className="btn-retry">
              Intentar nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="estadisticas-container">
      <Sidebar />
      <div className="estadisticas-wrapper">
        {/* Header con info del deportista */}
        <div className="estadisticas-header">
          <div className="estadisticas-header-content">
            {deportista?.foto_url && (
              <img 
                src={deportista.foto_url} 
                alt={deportista.nombre_completo}
                className="estadisticas-avatar"
              />
            )}
            <div>
              <h1 className="estadisticas-title">
                📈 Estadísticas de {deportista?.nombres || 'Deportista'}
              </h1>
              <p className="estadisticas-subtitle">
                Seguimiento de tu rendimiento y progreso personal
              </p>
              <div className="estadisticas-badges">
                <span className={`badge badge-${deportista?.estado || 'activo'}`}>
                  {deportista?.estado ? deportista.estado.charAt(0).toUpperCase() + deportista.estado.slice(1) : 'Activo'}
                </span>
                {deportista?.categoria && (
                  <span className="badge badge-categoria">
                    {deportista.categoria.nombre}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filtro de rango de fechas */}
        <div className="filtro-rango">
          <div className="filtro-group">
            <label className="filtro-label">Desde:</label>
            <input
              type="date"
              name="fecha_desde"
              value={rangoFechas.fecha_desde}
              onChange={handleRangoFechasChange}
              className="filtro-input"
            />
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Hasta:</label>
            <input
              type="date"
              name="fecha_hasta"
              value={rangoFechas.fecha_hasta}
              onChange={handleRangoFechasChange}
              className="filtro-input"
            />
          </div>
          <button onClick={aplicarRangoFechas} className="btn btn-primary btn-sm">
            <Calendar size={16} />
            Aplicar
          </button>
        </div>

        {/* Grid principal */}
        <div className="estadisticas-grid">
          {/* Columna principal */}
          <div className="estadisticas-col-main">
            {/* Tarjetas de métricas principales */}
            <div className="metricas-grid">
              <MetricCard
                title="Asistencia"
                value={`${estadisticasAsistencia?.porcentaje_asistencia || 0}%`}
                icon={<CheckCircle size={24} />}
                color="success"
                subtitle={`${estadisticasAsistencia?.presentes || 0} de ${estadisticasAsistencia?.total || 0} sesiones`}
                loading={loading && !estadisticasAsistencia}
              />
              <MetricCard
                title="Puntualidad"
                value={estadisticasAsistencia?.tarde > 0 ? 
                  `${(100 - (estadisticasAsistencia.tarde / (estadisticasAsistencia.total || 1) * 100)).toFixed(0)}%` : 
                  '100%'}
                icon={<Clock size={24} />}
                color="warning"
                subtitle={`${estadisticasAsistencia?.tarde || 0} llegadas tarde`}
                loading={loading && !estadisticasAsistencia}
              />
              <MetricCard
                title="IMC Actual"
                value={deportista?.imc?.toFixed(1) || 'N/A'}
                icon={<Heart size={24} />}
                color="danger"
                subtitle={deportista?.imc ? 
                  (deportista.imc < 18.5 ? 'Bajo peso' : 
                   deportista.imc < 25 ? 'Normal' : 
                   deportista.imc < 30 ? 'Sobrepeso' : 'Obesidad') : 
                  'No calculado'}
                loading={loading && !deportista}
              />
              <MetricCard
                title="Nivel Actual"
                value={estadisticasRendimiento?.nivel_actual || 'Intermedio'}
                icon={<Trophy size={24} />}
                color="info"
                subtitle={`${estadisticasRendimiento?.progreso_nivel || 0}% hacia ${estadisticasRendimiento?.proximo_nivel || 'Avanzado'}`}
                loading={loading && !estadisticasRendimiento}
              />
            </div>

            {/* Gráfico de asistencia */}
            <div className="card estadisticas-card">
              <div className="card-header">
                <BarChart3 className="card-icon" />
                <h2 className="card-title">Distribución de Asistencia</h2>
              </div>
              <div className="card-content">
                {estadisticasAsistencia ? (
                  <div className="progress-grid">
                    <div className="progress-col">
                      <ProgressBar
                        label="Presente"
                        value={estadisticasAsistencia.presentes}
                        total={estadisticasAsistencia.total}
                        color="success"
                      />
                      <ProgressBar
                        label="Ausente"
                        value={estadisticasAsistencia.ausentes}
                        total={estadisticasAsistencia.total}
                        color="danger"
                      />
                      <ProgressBar
                        label="Tarde"
                        value={estadisticasAsistencia.tarde}
                        total={estadisticasAsistencia.total}
                        color="warning"
                      />
                      <ProgressBar
                        label="Justificado"
                        value={estadisticasAsistencia.justificados}
                        total={estadisticasAsistencia.total}
                        color="info"
                      />
                    </div>
                    <div className="progress-col-center">
                      <div className="porcentaje-principal">
                        <span className="porcentaje-valor">
                          {estadisticasAsistencia.porcentaje_asistencia || 0}%
                        </span>
                        <span className="porcentaje-label">Tasa de Asistencia</span>
                        <div className={`porcentaje-badge ${
                          (estadisticasAsistencia.porcentaje_asistencia || 0) > 90 ? 'badge-success' :
                          (estadisticasAsistencia.porcentaje_asistencia || 0) > 75 ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {(estadisticasAsistencia.porcentaje_asistencia || 0) > 90 ? 'Excelente' :
                          (estadisticasAsistencia.porcentaje_asistencia || 0) > 75 ? 'Bueno' : 'Necesita mejorar'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-data">
                    <p>No hay datos de asistencia disponibles para el rango seleccionado.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Metas y progreso */}
            {estadisticasRendimiento && (
              <div className="card estadisticas-card">
                <div className="card-header">
                  <Goal className="card-icon" />
                  <h2 className="card-title">Metas y Progreso</h2>
                </div>
                <div className="card-content">
                  <div className="metas-grid">
                    <div className="metas-summary">
                      <div className="metas-item">
                        <div className="metas-item-value">
                          {estadisticasRendimiento.metas_cumplidas}/{estadisticasRendimiento.total_metas}
                        </div>
                        <div className="metas-item-label">Metas Cumplidas</div>
                        <ProgressBar
                          label=""
                          value={estadisticasRendimiento.metas_cumplidas}
                          total={estadisticasRendimiento.total_metas}
                          color="success"
                          showPercentage={false}
                        />
                      </div>
                      <div className="metas-item">
                        <div className="metas-item-value">
                          {estadisticasRendimiento.sesiones_semana}
                        </div>
                        <div className="metas-item-label">Sesiones/Semana</div>
                        <div className="metas-item-sub">
                          Promedio: {estadisticasRendimiento.promedio_sesiones}
                        </div>
                      </div>
                      <div className="metas-item">
                        <div className="metas-item-value">
                          {estadisticasRendimiento.progreso_fisico}%
                        </div>
                        <div className="metas-item-label">Progreso Físico</div>
                        <ProgressBar
                          label=""
                          value={estadisticasRendimiento.progreso_fisico}
                          total={100}
                          color="primary"
                          showPercentage={false}
                        />
                      </div>
                    </div>
                    
                    <div className="divider"></div>
                    
                    <h3 className="section-title">Áreas de Mejora</h3>
                    <div className="mejoras-list">
                      {estadisticasRendimiento.mejoras.map((mejora, index) => (
                        <MejoraCard
                          key={index}
                          nombre={mejora.nombre}
                          progreso={mejora.progreso}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Información personal y estadísticas */}
          <div className="estadisticas-col-sidebar">
            {/* Información del deportista */}
            <div className="card estadisticas-card">
              <div className="card-header">
                <Users className="card-icon" />
                <h2 className="card-title">Mi Información</h2>
              </div>
              <div className="card-content">
                {deportista ? (
                  <div className="info-personal">
                    <div className="info-item">
                      <span className="info-label">Nombre:</span>
                      <span className="info-value">{deportista.nombre_completo || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Edad:</span>
                      <span className="info-value">{deportista.edad || 'N/A'} años</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Género:</span>
                      <span className="info-value">{deportista.genero ? 
                        deportista.genero.charAt(0).toUpperCase() + deportista.genero.slice(1) : 
                        'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Altura:</span>
                      <span className="info-value">{deportista.altura || 'N/A'} m</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Peso:</span>
                      <span className="info-value">{deportista.peso || 'N/A'} kg</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Pie hábil:</span>
                      <span className="info-value">{deportista.pie_habil ? 
                        deportista.pie_habil.charAt(0).toUpperCase() + deportista.pie_habil.slice(1) : 
                        'N/A'}</span>
                    </div>
                  </div>
                ) : (
                  <p>No hay información disponible</p>
                )}
              </div>
            </div>

            {/* Resumen de sesiones */}
            <div className="card estadisticas-card">
              <div className="card-header">
                <Calendar className="card-icon" />
                <h2 className="card-title">Resumen de Sesiones</h2>
              </div>
              <div className="card-content">
                {estadisticasAsistencia ? (
                  <div className="sesiones-resumen">
                    <div className="sesion-item sesion-presente">
                      <div className="sesion-icon">
                        <CheckCircle size={20} />
                      </div>
                      <div className="sesion-content">
                        <div className="sesion-count">
                          {estadisticasAsistencia.presentes || 0}
                        </div>
                        <div className="sesion-label">Presente</div>
                      </div>
                    </div>
                    <div className="sesion-item sesion-ausente">
                      <div className="sesion-icon">
                        <XCircle size={20} />
                      </div>
                      <div className="sesion-content">
                        <div className="sesion-count">
                          {estadisticasAsistencia.ausentes || 0}
                        </div>
                        <div className="sesion-label">Ausente</div>
                      </div>
                    </div>
                    <div className="sesion-item sesion-tarde">
                      <div className="sesion-icon">
                        <Clock size={20} />
                      </div>
                      <div className="sesion-content">
                        <div className="sesion-count">
                          {estadisticasAsistencia.tarde || 0}
                        </div>
                        <div className="sesion-label">Tarde</div>
                      </div>
                    </div>
                    <div className="sesion-item sesion-justificado">
                      <div className="sesion-icon">
                        <AlertCircle size={20} />
                      </div>
                      <div className="sesion-content">
                        <div className="sesion-count">
                          {estadisticasAsistencia.justificados || 0}
                        </div>
                        <div className="sesion-label">Justificado</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>No hay datos de sesiones</p>
                )}
              </div>
            </div>

            {/* Progreso del nivel */}
            {estadisticasRendimiento && (
              <div className="card estadisticas-card">
                <div className="card-header">
                  <Trophy className="card-icon" />
                  <h2 className="card-title">Progreso de Nivel</h2>
                </div>
                <div className="card-content">
                  <div className="nivel-progreso">
                    <div className="nivel-actual">
                      <span className="nivel-label">Actual:</span>
                      <span className="nivel-valor">{estadisticasRendimiento.nivel_actual}</span>
                    </div>
                    <div className="nivel-siguiente">
                      <span className="nivel-label">Siguiente:</span>
                      <span className="nivel-valor">{estadisticasRendimiento.proximo_nivel}</span>
                    </div>
                    <div className="nivel-bar">
                      <div 
                        className="nivel-bar-fill"
                        style={{ width: `${estadisticasRendimiento.progreso_nivel}%` }}
                      ></div>
                    </div>
                    <div className="nivel-porcentaje">
                      {estadisticasRendimiento.progreso_nivel}% completado
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recomendaciones basadas en estadísticas */}
        <div className="card estadisticas-card">
          <div className="card-header">
            <Star className="card-icon" />
            <h2 className="card-title">Recomendaciones Personalizadas</h2>
          </div>
          <div className="card-content">
            <div className="recomendaciones-grid">
              {estadisticasAsistencia && estadisticasAsistencia.porcentaje_asistencia < 80 && (
                <div className="recomendacion recomendacion-importante">
                  <div className="recomendacion-icon">⚠️</div>
                  <div className="recomendacion-content">
                    <h4 className="recomendacion-title">Mejora tu asistencia</h4>
                    <p className="recomendacion-text">
                      Tu tasa de asistencia es del {estadisticasAsistencia.porcentaje_asistencia || 0}%. 
                      Intenta asistir a más sesiones para mejorar tu rendimiento.
                    </p>
                  </div>
                </div>
              )}
              
              {estadisticasAsistencia && estadisticasAsistencia.tarde > 0 && (
                <div className="recomendacion recomendacion-advertencia">
                  <div className="recomendacion-icon">⏰</div>
                  <div className="recomendacion-content">
                    <h4 className="recomendacion-title">Puntualidad</h4>
                    <p className="recomendacion-text">
                      Has llegado tarde {estadisticasAsistencia.tarde} veces. 
                      Intenta llegar 10 minutos antes para un mejor calentamiento.
                    </p>
                  </div>
                </div>
              )}
              
              {deportista?.imc && deportista.imc > 25 && (
                <div className="recomendacion recomendacion-salud">
                  <div className="recomendacion-icon">💪</div>
                  <div className="recomendacion-content">
                    <h4 className="recomendacion-title">Control de peso</h4>
                    <p className="recomendacion-text">
                      Tu IMC es {deportista.imc.toFixed(1)}. Considera ajustar tu dieta y 
                      aumentar el ejercicio cardiovascular.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="recomendacion recomendacion-motivacion">
                <div className="recomendacion-icon">🎯</div>
                <div className="recomendacion-content">
                  <h4 className="recomendacion-title">Sigue así</h4>
                  <p className="recomendacion-text">
                    Has completado {estadisticasRendimiento?.metas_cumplidas || 0} de {estadisticasRendimiento?.total_metas || 0} metas. 
                    ¡Continúa con el buen trabajo!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;