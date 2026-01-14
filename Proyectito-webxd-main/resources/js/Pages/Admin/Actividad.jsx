import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Users, Target, Activity, MapPin,
  CheckCircle, XCircle, AlertCircle, Filter, Search,
  Plus, Edit2, Trash2, Eye, RefreshCw, ChevronLeft,
  ChevronRight, Download, Upload, Share2, BarChart,
  TrendingUp, Home, CheckSquare, UserCheck, UserX,
  UserMinus, Award, Zap, Flag, Trophy, Bell, Star,
  BookOpen, Users as UsersIcon, Clipboard, FileText,
  MoreVertical, ExternalLink, Copy, Heart, Bookmark,
  MessageSquare, ThumbsUp, Award as AwardIcon, Target as TargetIcon,
  Activity as ActivityIcon
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/actividad.css';

const API_ACTIVIDADES = 'http://127.0.0.1:8000/api/actividades';
const API_ESCENARIOS = 'http://127.0.0.1:8000/api/escenarios';
const API_DEPORTISTAS = 'http://127.0.0.1:8000/api/deportistas';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    window.location.href = '/login';
    return {};
  }
  
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const Actividad = () => {
  // Estados principales
  const [actividades, setActividades] = useState([]);
  const [escenarios, setEscenarios] = useState([]);
  const [deportistas, setDeportistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAsistenciaModal, setShowAsistenciaModal] = useState(false);
  const [showListaAsistenciaModal, setShowListaAsistenciaModal] = useState(false);
  const [showCalendarioModal, setShowCalendarioModal] = useState(false);
  
  const [selectedActividad, setSelectedActividad] = useState(null);
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);
  const [selectedAnio, setSelectedAnio] = useState(new Date().getFullYear());
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [fechaDesdeFilter, setFechaDesdeFilter] = useState('');
  const [fechaHastaFilter, setFechaHastaFilter] = useState('');
  const [escenarioFilter, setEscenarioFilter] = useState('all');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar', 'list', 'grid'
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Formularios
  const [formData, setFormData] = useState({
    nombre_actividad: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '08:00',
    hora_fin: '09:00',
    tipo: 'entrenamiento',
    cupo_maximo: '',
    observaciones: '',
    id_escenario: ''
  });
  
  const [asistenciaForm, setAsistenciaForm] = useState({
    id_deportista: '',
    estado: 'presente',
    hora_llegada: '',
    observaciones: ''
  });
  
  const [errors, setErrors] = useState({});
  const [asistenciaData, setAsistenciaData] = useState(null);
  const [calendarioData, setCalendarioData] = useState([]);

  // Estados disponibles
  const estados = [
    { value: 'programada', label: 'Programada', color: '#3b82f6', icon: Calendar },
    { value: 'en_curso', label: 'En Curso', color: '#f59e0b', icon: Clock },
    { value: 'finalizada', label: 'Finalizada', color: '#10b981', icon: CheckCircle },
    { value: 'cancelada', label: 'Cancelada', color: '#ef4444', icon: XCircle }
  ];

  // Tipos de actividades
  const tipos = [
    { value: 'entrenamiento', label: 'Entrenamiento', icon: Activity, color: '#3b82f6' },
    { value: 'partido', label: 'Partido', icon: Trophy, color: '#10b981' },
    { value: 'evento', label: 'Evento', icon: Flag, color: '#8b5cf6' },
    { value: 'reunion', label: 'Reunión', icon: Users, color: '#f59e0b' },
    { value: 'otro', label: 'Otro', icon: MoreVertical, color: '#6b7280' }
  ];

  // Estados de asistencia
  const estadosAsistencia = [
    { value: 'presente', label: 'Presente', color: '#10b981', icon: UserCheck },
    { value: 'ausente', label: 'Ausente', color: '#ef4444', icon: UserX },
    { value: 'tarde', label: 'Tarde', color: '#f59e0b', icon: UserMinus },
    { value: 'justificado', label: 'Justificado', color: '#6b7280', icon: AlertCircle }
  ];

  // Funciones helper
  const getEstadoConfig = (estado) => {
    return estados.find(e => e.value === estado) || estados[0];
  };

  const getTipoConfig = (tipo) => {
    return tipos.find(t => t.value === tipo) || tipos[0];
  };

  const getAsistenciaConfig = (estado) => {
    return estadosAsistencia.find(e => e.value === estado) || estadosAsistencia[0];
  };

  // Cargar datos
  const loadActividades = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: currentPage
      };
      
      if (estadoFilter !== 'all') params.estado = estadoFilter;
      if (tipoFilter !== 'all') params.tipo = tipoFilter;
      if (escenarioFilter !== 'all') params.id_escenario = escenarioFilter;
      if (fechaDesdeFilter) params.fecha_desde = fechaDesdeFilter;
      if (fechaHastaFilter) params.fecha_hasta = fechaHastaFilter;
      if (searchTerm.trim() !== '') params.search = searchTerm;
      
      const queryParams = new URLSearchParams(params);
      const url = `${API_ACTIVIDADES}?${queryParams}`;
      
      const response = await fetch(url, {
        headers: authHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setActividades(data.data || []);
      setTotalPages(data.last_page || 1);
      
    } catch (err) {
      console.error('Error cargando actividades:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEscenarios = async () => {
    try {
      const response = await fetch(API_ESCENARIOS, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setEscenarios(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando escenarios:', error);
    }
  };

  const loadDeportistas = async () => {
    try {
      const response = await fetch(API_DEPORTISTAS, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setDeportistas(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando deportistas:', error);
    }
  };

  const loadCalendario = async (mes, anio) => {
    try {
      const response = await fetch(`${API_ACTIVIDADES}/calendario?mes=${mes}&año=${anio}`, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setCalendarioData(data);
      }
    } catch (error) {
      console.error('Error cargando calendario:', error);
    }
  };

  const loadListaAsistencia = async (id) => {
    try {
      const response = await fetch(`${API_ACTIVIDADES}/${id}/lista-asistencia`, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setAsistenciaData(data);
        return data;
      }
    } catch (error) {
      console.error('Error cargando lista de asistencia:', error);
    }
    return null;
  };

  // CRUD operations
  const createActividad = async () => {
    setErrors({});
    
    try {
      const dataToSend = { ...formData };
      
      // Convertir cupo_maximo a número si existe
      if (dataToSend.cupo_maximo) {
        dataToSend.cupo_maximo = parseInt(dataToSend.cupo_maximo);
      }
      
      // Si no hay escenario seleccionado, no enviar el campo
      if (!dataToSend.id_escenario) {
        delete dataToSend.id_escenario;
      }
      
      console.log('📤 Datos a enviar:', dataToSend);
      
      const response = await fetch(API_ACTIVIDADES, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(dataToSend)
      });
      
      const data = await response.json();
      console.log('📦 Response:', data);
      
      if (response.ok) {
        alert('✅ Actividad creada exitosamente');
        closeCreateModal();
        loadActividades();
      } else {
        setErrors(data.errors || { message: data.message || 'Error al crear actividad' });
        alert(`❌ Error: ${data.message || 'Revise los datos ingresados'}`);
      }
    } catch (error) {
      console.error('Error creando actividad:', error);
      alert('❌ Error de conexión');
    }
  };

  const updateActividad = async () => {
    setErrors({});
    
    if (!selectedActividad) return;
    
    try {
      const dataToSend = { ...formData };
      
      // Convertir cupo_maximo a número si existe
      if (dataToSend.cupo_maximo) {
        dataToSend.cupo_maximo = parseInt(dataToSend.cupo_maximo);
      }
      
      const response = await fetch(`${API_ACTIVIDADES}/${selectedActividad.id_actividad}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(dataToSend)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('✅ Actividad actualizada exitosamente');
        closeEditModal();
        loadActividades();
      } else {
        setErrors(data.errors || { message: data.message || 'Error al actualizar actividad' });
        alert(`❌ Error: ${data.message || 'Revise los datos ingresados'}`);
      }
    } catch (error) {
      console.error('Error actualizando actividad:', error);
      alert('❌ Error de conexión');
    }
  };

  const deleteActividad = async () => {
    if (!selectedActividad) return;
    
    try {
      const response = await fetch(`${API_ACTIVIDADES}/${selectedActividad.id_actividad}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      if (response.ok) {
        alert('✅ Actividad eliminada exitosamente');
        closeDeleteModal();
        loadActividades();
      } else {
        alert('❌ Error al eliminar actividad');
      }
    } catch (error) {
      console.error('Error eliminando actividad:', error);
      alert('❌ Error de conexión');
    }
  };

  const registrarAsistencia = async () => {
    if (!selectedActividad || !asistenciaForm.id_deportista) {
      alert('❌ Seleccione un deportista');
      return;
    }
    
    try {
      const dataToSend = { ...asistenciaForm };
      
      // Si no hay hora de llegada, no enviar el campo
      if (!dataToSend.hora_llegada.trim()) {
        delete dataToSend.hora_llegada;
      }
      
      const response = await fetch(`${API_ACTIVIDADES}/${selectedActividad.id_actividad}/registrar-asistencia`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(dataToSend)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('✅ Asistencia registrada exitosamente');
        setAsistenciaForm({
          id_deportista: '',
          estado: 'presente',
          hora_llegada: '',
          observaciones: ''
        });
        loadListaAsistencia(selectedActividad.id_actividad);
      } else {
        alert(`❌ Error: ${data.message || 'No se pudo registrar la asistencia'}`);
      }
    } catch (error) {
      console.error('Error registrando asistencia:', error);
      alert('❌ Error de conexión');
    }
  };

  // Modal functions
  const openDetailModal = async (actividad) => {
    try {
      const response = await fetch(`${API_ACTIVIDADES}/${actividad.id_actividad}`, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedActividad(data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error cargando detalles:', error);
    }
  };

  const openCreateModal = () => {
    setFormData({
      nombre_actividad: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      hora_inicio: '08:00',
      hora_fin: '09:00',
      tipo: 'entrenamiento',
      cupo_maximo: '',
      observaciones: '',
      id_escenario: ''
    });
    setErrors({});
    setShowCreateModal(true);
  };

  const openEditModal = (actividad) => {
    setSelectedActividad(actividad);
    setFormData({
      nombre_actividad: actividad.nombre_actividad,
      descripcion: actividad.descripcion || '',
      fecha: actividad.fecha.split('T')[0],
      hora_inicio: actividad.hora_inicio.substring(0, 5),
      hora_fin: actividad.hora_fin.substring(0, 5),
      tipo: actividad.tipo,
      cupo_maximo: actividad.cupo_maximo || '',
      observaciones: actividad.observaciones || '',
      id_escenario: actividad.escenarios?.[0]?.id_escenario || ''
    });
    setErrors({});
    setShowEditModal(true);
  };

  const openDeleteModal = (actividad) => {
    setSelectedActividad(actividad);
    setShowDeleteModal(true);
  };

  const openAsistenciaModal = (actividad) => {
    setSelectedActividad(actividad);
    setAsistenciaForm({
      id_deportista: '',
      estado: 'presente',
      hora_llegada: '',
      observaciones: ''
    });
    setShowAsistenciaModal(true);
  };

  const openListaAsistenciaModal = async (actividad) => {
    setSelectedActividad(actividad);
    await loadListaAsistencia(actividad.id_actividad);
    setShowListaAsistenciaModal(true);
  };

  const openCalendarioModal = () => {
    setShowCalendarioModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedActividad(null);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      nombre_actividad: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      hora_inicio: '08:00',
      hora_fin: '09:00',
      tipo: 'entrenamiento',
      cupo_maximo: '',
      observaciones: '',
      id_escenario: ''
    });
    setErrors({});
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedActividad(null);
    setFormData({
      nombre_actividad: '',
      descripcion: '',
      fecha: '',
      hora_inicio: '',
      hora_fin: '',
      tipo: 'entrenamiento',
      cupo_maximo: '',
      observaciones: '',
      id_escenario: ''
    });
    setErrors({});
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedActividad(null);
  };

  const closeAsistenciaModal = () => {
    setShowAsistenciaModal(false);
    setSelectedActividad(null);
    setAsistenciaForm({
      id_deportista: '',
      estado: 'presente',
      hora_llegada: '',
      observaciones: ''
    });
  };

  const closeListaAsistenciaModal = () => {
    setShowListaAsistenciaModal(false);
    setSelectedActividad(null);
    setAsistenciaData(null);
  };

  const closeCalendarioModal = () => {
    setShowCalendarioModal(false);
    setCalendarioData([]);
  };

  // Helper functions
  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatHora = (hora) => {
    if (!hora) return '';
    return hora.substring(0, 5);
  };

  const getDuracion = (horaInicio, horaFin) => {
    const inicio = new Date(`2000-01-01T${horaInicio}`);
    const fin = new Date(`2000-01-01T${horaFin}`);
    const diffMs = fin - inicio;
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const horas = Math.floor(diffMins / 60);
      const minutos = diffMins % 60;
      return minutos > 0 ? `${horas}h ${minutos}min` : `${horas}h`;
    }
  };

  // Estadísticas
  const stats = {
    total: actividades.length,
    programadas: actividades.filter(a => a.estado === 'programada').length,
    enCurso: actividades.filter(a => a.estado === 'en_curso').length,
    finalizadas: actividades.filter(a => a.estado === 'finalizada').length,
    canceladas: actividades.filter(a => a.estado === 'cancelada').length,
    totalParticipantes: actividades.reduce((sum, a) => sum + (a.cupo_maximo || 0), 0)
  };

  // Efectos
  useEffect(() => {
    loadActividades();
    loadEscenarios();
    loadDeportistas();
  }, [currentPage, estadoFilter, tipoFilter, escenarioFilter, fechaDesdeFilter, fechaHastaFilter, searchTerm]);

  useEffect(() => {
    if (showCalendarioModal) {
      loadCalendario(selectedMes, selectedAnio);
    }
  }, [showCalendarioModal, selectedMes, selectedAnio]);

  return (
    <div className="actividad-container">
      <Sidebar />
      
      <div className="actividad-content">
        <Topbar />
        
        <div className="actividad-main">
          {/* HEADER */}
          <div className="actividad-header">
            <div>
              <h1 className="actividad-title">
                <Calendar size={28} />
                Gestión de Actividades
              </h1>
              <p className="actividad-subtitle">
                Programa y administra actividades deportivas
              </p>
            </div>
            <div className="actividad-header-actions">
              <button 
                onClick={openCalendarioModal}
                className="actividad-btn-secondary"
              >
                <Calendar size={20} />
                Calendario
              </button>
              <button 
                onClick={openCreateModal}
                className="actividad-btn-primary"
              >
                <Plus size={20} />
                Nueva Actividad
              </button>
            </div>
          </div>

          {/* ESTADÍSTICAS */}
          <div className="actividad-stats-grid">
            <div className="actividad-stat-card">
              <div className="actividad-stat-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                <Activity size={24} />
              </div>
              <div>
                <h3 className="actividad-stat-number">{stats.total}</h3>
                <p className="actividad-stat-label">Total Actividades</p>
              </div>
            </div>
            <div className="actividad-stat-card">
              <div className="actividad-stat-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="actividad-stat-number">{stats.programadas}</h3>
                <p className="actividad-stat-label">Programadas</p>
              </div>
            </div>
            <div className="actividad-stat-card">
              <div className="actividad-stat-icon" style={{background: '#fef3c7', color: '#f59e0b'}}>
                <Clock size={24} />
              </div>
              <div>
                <h3 className="actividad-stat-number">{stats.enCurso}</h3>
                <p className="actividad-stat-label">En Curso</p>
              </div>
            </div>
            <div className="actividad-stat-card">
              <div className="actividad-stat-icon" style={{background: '#dcfce7', color: '#10b981'}}>
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="actividad-stat-number">{stats.finalizadas}</h3>
                <p className="actividad-stat-label">Finalizadas</p>
              </div>
            </div>
          </div>

          {/* FILTROS */}
          <div className="actividad-filters">
            <div className="actividad-filters-row">
              <div className="actividad-search-container">
                <Search className="actividad-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Buscar actividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="actividad-search-input"
                />
              </div>
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="actividad-filter-select"
              >
                <option value="all">Todos los estados</option>
                {estados.map(estado => (
                  <option key={estado.value} value={estado.value}>{estado.label}</option>
                ))}
              </select>
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="actividad-filter-select"
              >
                <option value="all">Todos los tipos</option>
                {tipos.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
              <select
                value={escenarioFilter}
                onChange={(e) => setEscenarioFilter(e.target.value)}
                className="actividad-filter-select"
              >
                <option value="all">Todos los escenarios</option>
                {escenarios.map(escenario => (
                  <option key={escenario.id_escenario} value={escenario.id_escenario}>
                    {escenario.nombre}
                  </option>
                ))}
              </select>
              <button onClick={loadActividades} className="actividad-btn-secondary">
                <Filter size={18} />
                Filtrar
              </button>
              <button onClick={() => {
                setSearchTerm('');
                setEstadoFilter('all');
                setTipoFilter('all');
                setEscenarioFilter('all');
                setFechaDesdeFilter('');
                setFechaHastaFilter('');
              }} className="actividad-btn-secondary">
                <RefreshCw size={18} />
                Limpiar
              </button>
            </div>
            <div className="actividad-filters-row">
              <div className="actividad-date-filters">
                <div className="actividad-date-group">
                  <label>Desde:</label>
                  <input
                    type="date"
                    value={fechaDesdeFilter}
                    onChange={(e) => setFechaDesdeFilter(e.target.value)}
                    className="actividad-date-input"
                  />
                </div>
                <div className="actividad-date-group">
                  <label>Hasta:</label>
                  <input
                    type="date"
                    value={fechaHastaFilter}
                    onChange={(e) => setFechaHastaFilter(e.target.value)}
                    className="actividad-date-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CONTENIDO */}
          {loading ? (
            <div className="actividad-loading">
              <div className="actividad-loading-spinner"></div>
              <p>Cargando actividades...</p>
            </div>
          ) : error ? (
            <div className="actividad-error">
              <AlertCircle size={48} />
              <h3>Error al cargar actividades</h3>
              <p>{error}</p>
              <button onClick={loadActividades} className="actividad-btn-primary">
                <RefreshCw size={18} />
                Reintentar
              </button>
            </div>
          ) : actividades.length === 0 ? (
            <div className="actividad-empty-state">
              <Calendar size={64} />
              <h3>No hay actividades programadas</h3>
              <p>Crea tu primera actividad para comenzar</p>
              <button onClick={openCreateModal} className="actividad-btn-primary">
                <Plus size={18} />
                Crear Actividad
              </button>
            </div>
          ) : (
            <>
              {/* VISTA DE LISTA */}
              {viewMode === 'list' && (
                <div className="actividad-table-container">
                  <table className="actividad-table">
                    <thead>
                      <tr>
                        <th>Actividad</th>
                        <th>Fecha y Hora</th>
                        <th>Tipo</th>
                        <th>Escenario</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actividades.map((actividad) => {
                        const estadoConfig = getEstadoConfig(actividad.estado);
                        const tipoConfig = getTipoConfig(actividad.tipo);
                        const EstadoIcon = estadoConfig.icon;
                        const TipoIcon = tipoConfig.icon;
                        
                        return (
                          <tr key={actividad.id_actividad} className="actividad-table-row">
                            <td>
                              <div className="actividad-nombre">
                                <strong>{actividad.nombre_actividad}</strong>
                                {actividad.descripcion && (
                                  <div className="actividad-descripcion">
                                    {actividad.descripcion.length > 50 
                                      ? `${actividad.descripcion.substring(0, 50)}...`
                                      : actividad.descripcion}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="actividad-fecha-hora">
                                <div className="actividad-fecha">
                                  <Calendar size={12} />
                                  {formatFecha(actividad.fecha)}
                                </div>
                                <div className="actividad-hora">
                                  <Clock size={12} />
                                  {formatHora(actividad.hora_inicio)} - {formatHora(actividad.hora_fin)}
                                  <span className="actividad-duracion">
                                    ({getDuracion(actividad.hora_inicio, actividad.hora_fin)})
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div 
                                className="actividad-tipo"
                                style={{ color: tipoConfig.color }}
                              >
                                <TipoIcon size={14} />
                                <span>{tipoConfig.label}</span>
                              </div>
                            </td>
                            <td>
                              {actividad.escenarios?.[0] ? (
                                <div className="actividad-escenario">
                                  <MapPin size={12} />
                                  <span>{actividad.escenarios[0].nombre}</span>
                                </div>
                              ) : (
                                <span className="actividad-sin-escenario">Sin asignar</span>
                              )}
                            </td>
                            <td>
                              <div 
                                className={`actividad-estado-badge ${actividad.estado}`}
                                style={{
                                  backgroundColor: estadoConfig.color + '20',
                                  color: estadoConfig.color
                                }}
                              >
                                <EstadoIcon size={14} />
                                <span>{estadoConfig.label}</span>
                              </div>
                            </td>
                            <td>
                              <div className="actividad-actions">
                                <button
                                  onClick={() => openDetailModal(actividad)}
                                  className="actividad-action-btn"
                                  title="Ver detalles"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => openListaAsistenciaModal(actividad)}
                                  className="actividad-action-btn"
                                  title="Lista de asistencia"
                                >
                                  <Clipboard size={16} />
                                </button>
                                <button
                                  onClick={() => openAsistenciaModal(actividad)}
                                  className="actividad-action-btn"
                                  title="Registrar asistencia"
                                >
                                  <UserCheck size={16} />
                                </button>
                                <button
                                  onClick={() => openEditModal(actividad)}
                                  className="actividad-action-btn"
                                  title="Editar"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(actividad)}
                                  className="actividad-action-btn delete"
                                  title="Eliminar"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VISTA DE CALENDARIO */}
              {viewMode === 'calendar' && (
                <div className="actividad-calendar-grid">
                  {actividades.map((actividad) => {
                    const estadoConfig = getEstadoConfig(actividad.estado);
                    const tipoConfig = getTipoConfig(actividad.tipo);
                    
                    return (
                      <div key={actividad.id_actividad} className="actividad-calendar-card">
                        <div className="actividad-calendar-header">
                          <div className="actividad-calendar-date">
                            <div className="actividad-calendar-day">
                              {new Date(actividad.fecha).getDate()}
                            </div>
                            <div className="actividad-calendar-month">
                              {new Date(actividad.fecha).toLocaleDateString('es-ES', { month: 'short' })}
                            </div>
                          </div>
                          <div 
                            className="actividad-calendar-estado"
                            style={{ backgroundColor: estadoConfig.color + '20' }}
                          >
                            <span style={{ color: estadoConfig.color }}>
                              {estadoConfig.label}
                            </span>
                          </div>
                        </div>
                        
                        <div className="actividad-calendar-body">
                          <h4 className="actividad-calendar-title">
                            {actividad.nombre_actividad}
                          </h4>
                          
                          <div className="actividad-calendar-info">
                            <div className="actividad-calendar-time">
                              <Clock size={12} />
                              <span>{formatHora(actividad.hora_inicio)} - {formatHora(actividad.hora_fin)}</span>
                            </div>
                            <div 
                              className="actividad-calendar-tipo"
                              style={{ color: tipoConfig.color }}
                            >
                              <tipoConfig.icon size={12} />
                              <span>{tipoConfig.label}</span>
                            </div>
                          </div>
                          
                          {actividad.escenarios?.[0] && (
                            <div className="actividad-calendar-escenario">
                              <MapPin size={12} />
                              <span>{actividad.escenarios[0].nombre}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="actividad-calendar-footer">
                          <div className="actividad-calendar-actions">
                            <button
                              onClick={() => openDetailModal(actividad)}
                              className="actividad-calendar-action-btn"
                              title="Ver detalles"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => openListaAsistenciaModal(actividad)}
                              className="actividad-calendar-action-btn"
                              title="Asistencia"
                            >
                              <Clipboard size={14} />
                            </button>
                            <button
                              onClick={() => openEditModal(actividad)}
                              className="actividad-calendar-action-btn"
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PAGINACIÓN */}
              {totalPages > 1 && (
                <div className="actividad-pagination">
                  <div className="actividad-pagination-info">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="actividad-pagination-controls">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="actividad-pagination-btn"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`actividad-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="actividad-pagination-btn"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODALES */}

      {/* MODAL CREAR ACTIVIDAD */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3 className="modal-title">
                <Plus size={20} />
                Nueva Actividad
              </h3>
              <button onClick={closeCreateModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    <Activity size={14} />
                    Nombre de la Actividad *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre_actividad}
                    onChange={(e) => setFormData({...formData, nombre_actividad: e.target.value})}
                    className="modal-form-input"
                    placeholder="Ej: Entrenamiento de Fútbol"
                  />
                  {errors.nombre_actividad && <span className="modal-form-error">{errors.nombre_actividad}</span>}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Calendar size={14} />
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    className="modal-form-input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.fecha && <span className="modal-form-error">{errors.fecha}</span>}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Clock size={14} />
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => setFormData({...formData, hora_inicio: e.target.value})}
                    className="modal-form-input"
                  />
                  {errors.hora_inicio && <span className="modal-form-error">{errors.hora_inicio}</span>}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Clock size={14} />
                    Hora Fin *
                  </label>
                  <input
                    type="time"
                    value={formData.hora_fin}
                    onChange={(e) => setFormData({...formData, hora_fin: e.target.value})}
                    className="modal-form-input"
                    min={formData.hora_inicio}
                  />
                  {errors.hora_fin && <span className="modal-form-error">{errors.hora_fin}</span>}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Target size={14} />
                    Tipo *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="modal-form-input"
                  >
                    {tipos.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                  {errors.tipo && <span className="modal-form-error">{errors.tipo}</span>}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <MapPin size={14} />
                    Escenario
                  </label>
                  <select
                    value={formData.id_escenario}
                    onChange={(e) => setFormData({...formData, id_escenario: e.target.value})}
                    className="modal-form-input"
                  >
                    <option value="">Seleccionar escenario</option>
                    {escenarios.map(escenario => (
                      <option key={escenario.id_escenario} value={escenario.id_escenario}>
                        {escenario.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Users size={14} />
                    Cupo Máximo
                  </label>
                  <input
                    type="number"
                    value={formData.cupo_maximo}
                    onChange={(e) => setFormData({...formData, cupo_maximo: e.target.value})}
                    className="modal-form-input"
                    min="1"
                    placeholder="Ilimitado"
                  />
                </div>
                
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    <FileText size={14} />
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    className="modal-form-input"
                    rows="3"
                    placeholder="Descripción de la actividad..."
                  />
                </div>
                
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    className="modal-form-input"
                    rows="2"
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeCreateModal} className="modal-btn-secondary">
                Cancelar
              </button>
              <button onClick={createActividad} className="modal-btn-primary">
                <Plus size={18} />
                Crear Actividad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE ACTIVIDAD */}
      {showDetailModal && selectedActividad && (() => {
        const estadoConfig = getEstadoConfig(selectedActividad.estado);
        const tipoConfig = getTipoConfig(selectedActividad.tipo);
        const EstadoIcon = estadoConfig.icon;
        const TipoIcon = tipoConfig.icon;
        
        return (
          <div className="modal-overlay">
            <div className="modal-content large">
              <div className="modal-header">
                <h3 className="modal-title">
                  <Eye size={20} />
                  Detalles de la Actividad
                </h3>
                <button onClick={closeDetailModal} className="modal-close-btn">
                  &times;
                </button>
              </div>
              
              <div className="modal-body">
                <div className="actividad-detail-header">
                  <div className="actividad-detail-title">
                    <h2>{selectedActividad.nombre_actividad}</h2>
                    <div 
                      className="actividad-detail-estado"
                      style={{
                        backgroundColor: estadoConfig.color + '20',
                        color: estadoConfig.color
                      }}
                    >
                      <EstadoIcon size={16} />
                      <span>{estadoConfig.label}</span>
                    </div>
                  </div>
                  
                  <div className="actividad-detail-meta">
                    <div className="actividad-detail-meta-item">
                      <Calendar size={16} />
                      <span>{formatFecha(selectedActividad.fecha)}</span>
                    </div>
                    <div className="actividad-detail-meta-item">
                      <Clock size={16} />
                      <span>{formatHora(selectedActividad.hora_inicio)} - {formatHora(selectedActividad.hora_fin)}</span>
                      <span className="actividad-detail-duracion">
                        ({getDuracion(selectedActividad.hora_inicio, selectedActividad.hora_fin)})
                      </span>
                    </div>
                    <div className="actividad-detail-meta-item">
                      <TipoIcon size={16} style={{ color: tipoConfig.color }} />
                      <span>{tipoConfig.label}</span>
                    </div>
                    {selectedActividad.cupo_maximo && (
                      <div className="actividad-detail-meta-item">
                        <Users size={16} />
                        <span>Cupo: {selectedActividad.cupo_maximo} personas</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedActividad.descripcion && (
                  <div className="actividad-detail-section">
                    <h4 className="actividad-detail-section-title">Descripción</h4>
                    <p className="actividad-detail-description">{selectedActividad.descripcion}</p>
                  </div>
                )}
                
                {selectedActividad.escenarios && selectedActividad.escenarios.length > 0 && (
                  <div className="actividad-detail-section">
                    <h4 className="actividad-detail-section-title">
                      <MapPin size={16} />
                      Escenario Asignado
                    </h4>
                    <div className="actividad-detail-escenarios">
                      {selectedActividad.escenarios.map(escenario => (
                        <div key={escenario.id_escenario} className="actividad-detail-escenario">
                          <div className="actividad-detail-escenario-info">
                            <strong>{escenario.nombre}</strong>
                            <span>{escenario.tipo} • Capacidad: {escenario.capacidad}</span>
                            {escenario.direccion && (
                              <span className="actividad-detail-escenario-direccion">
                                <MapPin size={12} />
                                {escenario.direccion}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedActividad.observaciones && (
                  <div className="actividad-detail-section">
                    <h4 className="actividad-detail-section-title">Observaciones</h4>
                    <p className="actividad-detail-observaciones">{selectedActividad.observaciones}</p>
                  </div>
                )}
                
                {selectedActividad.asistencias && selectedActividad.asistencias.length > 0 && (
                  <div className="actividad-detail-section">
                    <h4 className="actividad-detail-section-title">
                      <UsersIcon size={16} />
                      Asistencias ({selectedActividad.asistencias.length})
                    </h4>
                    <div className="actividad-detail-asistencias">
                      {selectedActividad.asistencias.slice(0, 5).map(asistencia => (
                        <div key={asistencia.id_asistencia} className="actividad-detail-asistencia">
                          <div className="actividad-detail-asistencia-info">
                            <strong>
                              {asistencia.deportista?.nombre} {asistencia.deportista?.apellido}
                            </strong>
                            <div 
                              className="actividad-detail-asistencia-estado"
                              style={{ color: getAsistenciaConfig(asistencia.estado).color }}
                            >
                              {getAsistenciaConfig(asistencia.estado).label}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button onClick={closeDetailModal} className="modal-btn-secondary">
                  Cerrar
                </button>
                <button 
                  onClick={() => {
                    closeDetailModal();
                    openEditModal(selectedActividad);
                  }}
                  className="modal-btn-primary"
                >
                  <Edit2 size={18} />
                  Editar
                </button>
                <button 
                  onClick={() => {
                    closeDetailModal();
                    openListaAsistenciaModal(selectedActividad);
                  }}
                  className="modal-btn-primary"
                >
                  <Clipboard size={18} />
                  Ver Asistencia
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL LISTA DE ASISTENCIA */}
      {showListaAsistenciaModal && selectedActividad && asistenciaData && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3 className="modal-title">
                <Clipboard size={20} />
                Lista de Asistencia: {selectedActividad.nombre_actividad}
              </h3>
              <button onClick={closeListaAsistenciaModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="asistencia-resumen">
                <div className="asistencia-resumen-item">
                  <div className="asistencia-resumen-value">{asistenciaData.total || 0}</div>
                  <div className="asistencia-resumen-label">Total</div>
                </div>
                <div className="asistencia-resumen-item">
                  <div className="asistencia-resumen-value" style={{ color: '#10b981' }}>
                    {asistenciaData.presentes || 0}
                  </div>
                  <div className="asistencia-resumen-label">Presentes</div>
                </div>
                <div className="asistencia-resumen-item">
                  <div className="asistencia-resumen-value" style={{ color: '#ef4444' }}>
                    {asistenciaData.ausentes || 0}
                  </div>
                  <div className="asistencia-resumen-label">Ausentes</div>
                </div>
                <div className="asistencia-resumen-item">
                  <div className="asistencia-resumen-value" style={{ color: '#f59e0b' }}>
                    {asistenciaData.tarde || 0}
                  </div>
                  <div className="asistencia-resumen-label">Tarde</div>
                </div>
              </div>
              
              <div className="asistencia-lista">
                <h4 className="asistencia-lista-title">Detalle de Asistencias</h4>
                
                {asistenciaData.asistencias && asistenciaData.asistencias.length > 0 ? (
                  <div className="asistencia-table-container">
                    <table className="asistencia-table">
                      <thead>
                        <tr>
                          <th>Deportista</th>
                          <th>Estado</th>
                          <th>Hora Llegada</th>
                          <th>Observaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asistenciaData.asistencias.map(asistencia => {
                          const asistenciaConfig = getAsistenciaConfig(asistencia.estado);
                          const AsistenciaIcon = asistenciaConfig.icon;
                          
                          return (
                            <tr key={asistencia.id_asistencia}>
                              <td>
                                <div className="asistencia-deportista">
                                  {asistencia.deportista?.nombre} {asistencia.deportista?.apellido}
                                  <div className="asistencia-deportista-info">
                                    {asistencia.deportista?.documento && `Doc: ${asistencia.deportista.documento}`}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div 
                                  className="asistencia-estado"
                                  style={{ color: asistenciaConfig.color }}
                                >
                                  <AsistenciaIcon size={14} />
                                  <span>{asistenciaConfig.label}</span>
                                </div>
                              </td>
                              <td>
                                {asistencia.hora_llegada ? (
                                  <div className="asistencia-hora">
                                    <Clock size={12} />
                                    {asistencia.hora_llegada}
                                  </div>
                                ) : (
                                  <span className="asistencia-sin-hora">-</span>
                                )}
                              </td>
                              <td>
                                {asistencia.observaciones || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="asistencia-vacia">
                    <Clipboard size={48} />
                    <p>No hay asistencias registradas para esta actividad</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeListaAsistenciaModal} className="modal-btn-secondary">
                Cerrar
              </button>
              <button 
                onClick={() => {
                  closeListaAsistenciaModal();
                  openAsistenciaModal(selectedActividad);
                }}
                className="modal-btn-primary"
              >
                <UserCheck size={18} />
                Registrar Asistencia
              </button>
              <button className="modal-btn-secondary">
                <Download size={18} />
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR ASISTENCIA */}
      {showAsistenciaModal && selectedActividad && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <UserCheck size={20} />
                Registrar Asistencia
              </h3>
              <button onClick={closeAsistenciaModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    <Users size={14} />
                    Deportista *
                  </label>
                  <select
                    value={asistenciaForm.id_deportista}
                    onChange={(e) => setAsistenciaForm({...asistenciaForm, id_deportista: e.target.value})}
                    className="modal-form-input"
                  >
                    <option value="">Seleccionar deportista</option>
                    {deportistas.map(deportista => (
                      <option key={deportista.id_deportista} value={deportista.id_deportista}>
                        {deportista.nombre} {deportista.apellido} - {deportista.documento}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    Estado *
                  </label>
                  <select
                    value={asistenciaForm.estado}
                    onChange={(e) => setAsistenciaForm({...asistenciaForm, estado: e.target.value})}
                    className="modal-form-input"
                  >
                    {estadosAsistencia.map(estado => (
                      <option key={estado.value} value={estado.value}>{estado.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Clock size={14} />
                    Hora de Llegada
                  </label>
                  <input
                    type="time"
                    value={asistenciaForm.hora_llegada}
                    onChange={(e) => setAsistenciaForm({...asistenciaForm, hora_llegada: e.target.value})}
                    className="modal-form-input"
                  />
                </div>
                
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    Observaciones
                  </label>
                  <textarea
                    value={asistenciaForm.observaciones}
                    onChange={(e) => setAsistenciaForm({...asistenciaForm, observaciones: e.target.value})}
                    className="modal-form-input"
                    rows="2"
                    placeholder="Observaciones sobre la asistencia..."
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeAsistenciaModal} className="modal-btn-secondary">
                Cancelar
              </button>
              <button onClick={registrarAsistencia} className="modal-btn-primary">
                <UserCheck size={18} />
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CALENDARIO */}
      {showCalendarioModal && (
        <div className="modal-overlay">
          <div className="modal-content extra-large">
            <div className="modal-header">
              <h3 className="modal-title">
                <Calendar size={20} />
                Calendario de Actividades
              </h3>
              <button onClick={closeCalendarioModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="calendario-controls">
                <div className="calendario-selectores">
                  <select
                    value={selectedMes}
                    onChange={(e) => setSelectedMes(parseInt(e.target.value))}
                    className="calendario-select"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(mes => (
                      <option key={mes} value={mes}>
                        {new Date(2000, mes - 1, 1).toLocaleDateString('es-ES', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedAnio}
                    onChange={(e) => setSelectedAnio(parseInt(e.target.value))}
                    className="calendario-select"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(anio => (
                      <option key={anio} value={anio}>{anio}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="calendario-actividades">
                {calendarioData.length > 0 ? (
                  calendarioData.map(actividad => {
                    const estadoConfig = getEstadoConfig(actividad.estado);
                    const tipoConfig = getTipoConfig(actividad.tipo);
                    
                    return (
                      <div key={actividad.id_actividad} className="calendario-actividad">
                        <div className="calendario-actividad-header">
                          <div className="calendario-actividad-fecha">
                            {new Date(actividad.fecha).toLocaleDateString('es-ES', { 
                              weekday: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div 
                            className="calendario-actividad-estado"
                            style={{ backgroundColor: estadoConfig.color + '20' }}
                          >
                            <span style={{ color: estadoConfig.color }}>
                              {estadoConfig.label}
                            </span>
                          </div>
                        </div>
                        
                        <div className="calendario-actividad-body">
                          <h4>{actividad.nombre_actividad}</h4>
                          <div className="calendario-actividad-info">
                            <span>{formatHora(actividad.hora_inicio)} - {formatHora(actividad.hora_fin)}</span>
                            <span style={{ color: tipoConfig.color }}>{tipoConfig.label}</span>
                          </div>
                          {actividad.escenarios?.[0] && (
                            <div className="calendario-actividad-escenario">
                              <MapPin size={12} />
                              {actividad.escenarios[0].nombre}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="calendario-vacio">
                    <Calendar size={48} />
                    <p>No hay actividades programadas para este período</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeCalendarioModal} className="modal-btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {showDeleteModal && selectedActividad && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <AlertCircle size={20} />
                Eliminar Actividad
              </h3>
              <button onClick={closeDeleteModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-modal-content">
                <AlertCircle size={48} />
                <h4>¿Estás seguro de eliminar esta actividad?</h4>
                <p>Esta acción no se puede deshacer y se eliminarán todos los datos asociados.</p>
                
                <div className="delete-modal-info">
                  <div className="delete-modal-item">
                    <span>Actividad:</span>
                    <strong>{selectedActividad.nombre_actividad}</strong>
                  </div>
                  <div className="delete-modal-item">
                    <span>Fecha:</span>
                    <strong>{formatFecha(selectedActividad.fecha)}</strong>
                  </div>
                  <div className="delete-modal-item">
                    <span>Hora:</span>
                    <strong>{formatHora(selectedActividad.hora_inicio)} - {formatHora(selectedActividad.hora_fin)}</strong>
                  </div>
                  <div className="delete-modal-item">
                    <span>Estado:</span>
                    <div 
                      className="delete-modal-estado"
                      style={{ color: getEstadoConfig(selectedActividad.estado).color }}
                    >
                      {getEstadoConfig(selectedActividad.estado).label}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeDeleteModal} className="modal-btn-secondary">
                Cancelar
              </button>
              <button onClick={deleteActividad} className="modal-btn-danger">
                <Trash2 size={18} />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Actividad;