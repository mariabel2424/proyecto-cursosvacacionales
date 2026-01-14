import React, { useState, useEffect } from 'react';
import {
  Users, Calendar, Clock, Tag, CheckCircle, XCircle,
  AlertTriangle, Filter, Search, Plus, Edit2, Trash2,
  Eye, RefreshCw, User, BookOpen, ChevronRight,
  ChevronLeft, Download, Upload, BarChart, TrendingUp,
  Star, Award, Target, Activity, Home, Settings,
  MoreVertical, ExternalLink, Copy, Heart, Bookmark,
  MessageSquare, ThumbsUp, Award as AwardIcon, Target as TargetIcon,
  FileText, UserPlus, UserMinus, GraduationCap, List, Grid
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/grupoCurso.css';

const API_GRUPOS = 'http://127.0.0.1:8000/api/grupos-curso';
const API_CURSOS = 'http://127.0.0.1:8000/api/cursos';
const API_INSTRUCTORES = 'http://127.0.0.1:8000/api/instructores';

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

const GrupoCurso = () => {
  // Estados principales
  const [grupos, setGrupos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAsignarInstructorModal, setShowAsignarInstructorModal] = useState(false);
  const [showInstructoresModal, setShowInstructoresModal] = useState(false);
  const [showDeportistasModal, setShowDeportistasModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const [selectedCurso, setSelectedCurso] = useState(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [cursoFilter, setCursoFilter] = useState('all');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Formularios
  const [formData, setFormData] = useState({
    id_curso: '',
    nombre: '',
    cupo_maximo: 20,
    hora_inicio: '08:00',
    hora_fin: '10:00',
    dias_semana: [],
    estado: 'activo'
  });
  
  const [asignarInstructorData, setAsignarInstructorData] = useState({
    id_instructor: '',
    coordinador: false
  });
  
  const [errors, setErrors] = useState({});

  // Estados disponibles
  const estados = [
    { value: 'activo', label: 'Activo', color: '#10b981', icon: CheckCircle },
    { value: 'inactivo', label: 'Inactivo', color: '#6b7280', icon: XCircle },
    { value: 'completo', label: 'Completo', color: '#f59e0b', icon: AlertTriangle },
    { value: 'cancelado', label: 'Cancelado', color: '#ef4444', icon: XCircle }
  ];

  // Días de la semana
  const diasSemana = [
    { id: 1, value: 'lunes', label: 'Lunes' },
    { id: 2, value: 'martes', label: 'Martes' },
    { id: 3, value: 'miércoles', label: 'Miércoles' },
    { id: 4, value: 'jueves', label: 'Jueves' },
    { id: 5, value: 'viernes', label: 'Viernes' },
    { id: 6, value: 'sábado', label: 'Sábado' },
    { id: 7, value: 'domingo', label: 'Domingo' }
  ];

  // Funciones helper para obtener configuraciones
  const getEstadoConfig = (estado) => {
    return estados.find(e => e.value === estado) || estados[0];
  };

  // Cargar datos
 const loadGrupos = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const params = {
      page: currentPage
    };
    
    if (cursoFilter !== 'all') params.id_curso = cursoFilter;
    if (estadoFilter !== 'all') params.estado = estadoFilter;
    if (searchTerm.trim() !== '') params.buscar = searchTerm;
    if (estadoFilter === 'activos') params.activos = true;
    
    const queryParams = new URLSearchParams(params);
    const url = `${API_GRUPOS}?${queryParams}`;
    
    console.log('🔗 Cargando grupos desde:', url);
    console.log('🔑 Headers:', authHeaders());
    
    const response = await fetch(url, {
      headers: authHeaders()
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Verificar si la respuesta es HTML en lugar de JSON
    const contentType = response.headers.get('content-type');
    console.log('📄 Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ El servidor devolvió HTML en lugar de JSON:', text.substring(0, 500));
      
      // Verificar si es una página de error de Laravel
      if (text.includes('<!DOCTYPE html>') || text.includes('laravel')) {
        if (response.status === 404) {
          throw new Error(`La ruta de la API no existe (404): ${url}`);
        } else if (response.status === 500) {
          throw new Error('Error interno del servidor (500)');
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
        }
      }
      
      throw new Error(`El servidor devolvió un tipo de contenido inesperado: ${contentType}`);
    }
    
    const data = await response.json();
    console.log('📦 Datos recibidos:', data);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    // Asegurarse de que los datos tengan la estructura correcta
    if (data.data && Array.isArray(data.data)) {
      setGrupos(data.data);
      setTotalPages(data.last_page || 1);
    } else if (Array.isArray(data)) {
      // Si la respuesta es un array directamente
      setGrupos(data);
      setTotalPages(1);
    } else {
      console.warn('⚠️ Formato de datos inesperado:', data);
      setGrupos([]);
      setTotalPages(1);
    }
    
  } catch (err) {
    console.error('❌ Error cargando grupos:', err);
    
    // Si el error es de autenticación, redirigir al login
    if (err.message.includes('No autorizado') || err.message.includes('401') || err.message.includes('403')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }
    
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  const loadCursos = async () => {
    try {
      const response = await fetch(`${API_CURSOS}?activos=true`, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setCursos(data.data || data);
      }
    } catch (error) {
      console.error('Error cargando cursos:', error);
    }
  };

  const loadInstructores = async () => {
    try {
      const response = await fetch(API_INSTRUCTORES, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setInstructores(data.data || data);
      }
    } catch (error) {
      console.error('Error cargando instructores:', error);
    }
  };

  // CRUD operations
  const createGrupo = async () => {
    setErrors({});
    
    try {
      const response = await fetch(API_GRUPOS, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('✅ Grupo creado exitosamente');
        closeCreateModal();
        loadGrupos();
      } else {
        setErrors(data.errors || { message: 'Error al crear grupo' });
      }
    } catch (error) {
      console.error('Error creando grupo:', error);
      setErrors({ message: 'Error de conexión' });
    }
  };

  const updateGrupo = async () => {
    setErrors({});
    
    if (!selectedGrupo) return;
    
    try {
      const response = await fetch(`${API_GRUPOS}/${selectedGrupo.id_grupo_curso}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('✅ Grupo actualizado exitosamente');
        closeEditModal();
        loadGrupos();
      } else {
        setErrors(data.errors || { message: 'Error al actualizar grupo' });
      }
    } catch (error) {
      console.error('Error actualizando grupo:', error);
      setErrors({ message: 'Error de conexión' });
    }
  };

  const deleteGrupo = async () => {
    if (!selectedGrupo) return;
    
    try {
      const response = await fetch(`${API_GRUPOS}/${selectedGrupo.id_grupo_curso}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('✅ Grupo eliminado exitosamente');
        closeDeleteModal();
        loadGrupos();
      } else {
        alert(`❌ ${data.message || 'Error al eliminar grupo'}`);
      }
    } catch (error) {
      console.error('Error eliminando grupo:', error);
      alert('❌ Error de conexión');
    }
  };

  const asignarInstructor = async () => {
    setErrors({});
    
    if (!selectedGrupo) return;
    
    try {
      const response = await fetch(`${API_GRUPOS}/${selectedGrupo.id_grupo_curso}/asignar-instructor`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(asignarInstructorData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('✅ Instructor asignado exitosamente');
        closeAsignarInstructorModal();
        loadGrupos();
      } else {
        setErrors(data.errors || { message: 'Error al asignar instructor' });
      }
    } catch (error) {
      console.error('Error asignando instructor:', error);
      setErrors({ message: 'Error de conexión' });
    }
  };

  const quitarInstructor = async (id_instructor) => {
    if (!selectedGrupo) return;
    
    if (!confirm('¿Estás seguro de quitar a este instructor del grupo?')) return;
    
    try {
      const response = await fetch(`${API_GRUPOS}/${selectedGrupo.id_grupo_curso}/quitar-instructor`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id_instructor })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('✅ Instructor removido exitosamente');
        loadGrupos();
        if (showInstructoresModal) {
          const updatedGrupo = await loadGrupoDetalle(selectedGrupo.id_grupo_curso);
          setSelectedGrupo(updatedGrupo);
        }
      } else {
        alert(`❌ ${data.message || 'Error al quitar instructor'}`);
      }
    } catch (error) {
      console.error('Error quitando instructor:', error);
      alert('❌ Error de conexión');
    }
  };

  const cambiarEstado = async (estado) => {
    if (!selectedGrupo) return;
    
    const estadoConfig = getEstadoConfig(estado);
    if (!confirm(`¿Cambiar estado del grupo a "${estadoConfig.label}"?`)) return;
    
    try {
      const response = await fetch(`${API_GRUPOS}/${selectedGrupo.id_grupo_curso}/cambiar-estado`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ estado })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ Estado cambiado a "${estadoConfig.label}"`);
        loadGrupos();
        if (showDetailModal) {
          const updatedGrupo = await loadGrupoDetalle(selectedGrupo.id_grupo_curso);
          setSelectedGrupo(updatedGrupo);
        }
      } else {
        alert(`❌ ${data.message || 'Error al cambiar estado'}`);
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('❌ Error de conexión');
    }
  };

  const loadGrupoDetalle = async (id) => {
    try {
      const response = await fetch(`${API_GRUPOS}/${id}`, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error cargando detalle:', error);
    }
    return null;
  };

  // Modal functions
  const openDetailModal = async (grupo) => {
    const detalle = await loadGrupoDetalle(grupo.id_grupo_curso);
    if (detalle) {
      setSelectedGrupo(detalle);
      setShowDetailModal(true);
    }
  };

  const openCreateModal = () => {
    setFormData({
      id_curso: '',
      nombre: '',
      cupo_maximo: 20,
      hora_inicio: '08:00',
      hora_fin: '10:00',
      dias_semana: [],
      estado: 'activo'
    });
    setErrors({});
    setShowCreateModal(true);
  };

  const openEditModal = (grupo) => {
    setSelectedGrupo(grupo);
    setFormData({
      id_curso: grupo.id_curso,
      nombre: grupo.nombre,
      cupo_maximo: grupo.cupo_maximo,
      hora_inicio: grupo.hora_inicio?.substring(0, 5) || '08:00',
      hora_fin: grupo.hora_fin?.substring(0, 5) || '10:00',
      dias_semana: Array.isArray(grupo.dias_semana) ? grupo.dias_semana : [],
      estado: grupo.estado
    });
    setErrors({});
    setShowEditModal(true);
  };

  const openDeleteModal = (grupo) => {
    setSelectedGrupo(grupo);
    setShowDeleteModal(true);
  };

  const openAsignarInstructorModal = (grupo) => {
    setSelectedGrupo(grupo);
    setAsignarInstructorData({
      id_instructor: '',
      coordinador: false
    });
    setErrors({});
    setShowAsignarInstructorModal(true);
  };

  const openInstructoresModal = async (grupo) => {
    const detalle = await loadGrupoDetalle(grupo.id_grupo_curso);
    if (detalle) {
      setSelectedGrupo(detalle);
      setShowInstructoresModal(true);
    }
  };

  const openDeportistasModal = async (grupo) => {
    try {
      const response = await fetch(`${API_GRUPOS}/${grupo.id_grupo_curso}/deportistas`, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedGrupo(data);
        setShowDeportistasModal(true);
      }
    } catch (error) {
      console.error('Error cargando deportistas:', error);
    }
  };

  const openEstadisticasModal = async (grupo) => {
    try {
      const response = await fetch(`${API_GRUPOS}/${grupo.id_grupo_curso}/estadisticas`, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedGrupo(data);
        setShowEstadisticasModal(true);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Close modal functions
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedGrupo(null);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      id_curso: '',
      nombre: '',
      cupo_maximo: 20,
      hora_inicio: '08:00',
      hora_fin: '10:00',
      dias_semana: [],
      estado: 'activo'
    });
    setErrors({});
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedGrupo(null);
    setFormData({
      id_curso: '',
      nombre: '',
      cupo_maximo: 20,
      hora_inicio: '08:00',
      hora_fin: '10:00',
      dias_semana: [],
      estado: 'activo'
    });
    setErrors({});
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedGrupo(null);
  };

  const closeAsignarInstructorModal = () => {
    setShowAsignarInstructorModal(false);
    setSelectedGrupo(null);
    setAsignarInstructorData({
      id_instructor: '',
      coordinador: false
    });
    setErrors({});
  };

  const closeInstructoresModal = () => {
    setShowInstructoresModal(false);
    setSelectedGrupo(null);
  };

  const closeDeportistasModal = () => {
    setShowDeportistasModal(false);
    setSelectedGrupo(null);
  };

  const closeEstadisticasModal = () => {
    setShowEstadisticasModal(false);
    setSelectedGrupo(null);
  };

  // Helper functions
  const toggleDiaSemana = (diaValue) => {
    const currentDias = formData.dias_semana || [];
    const newDias = currentDias.includes(diaValue)
      ? currentDias.filter(d => d !== diaValue)
      : [...currentDias, diaValue];
    
    setFormData({ ...formData, dias_semana: newDias });
  };

  const formatDiasSemana = (dias) => {
    if (!Array.isArray(dias)) return [];
    
    return dias.map(dia => {
      const diaObj = diasSemana.find(d => 
        d.value === dia || d.id.toString() === dia.toString()
      );
      return diaObj ? diaObj.label : dia;
    });
  };

  const getCursoNombre = (id_curso) => {
    const curso = cursos.find(c => c.id_curso == id_curso);
    return curso ? curso.nombre : 'Curso no encontrado';
  };

  // Estadísticas
  const stats = {
    total: grupos.length,
    activos: grupos.filter(g => g.estado === 'activo').length,
    completos: grupos.filter(g => g.estado === 'completo').length,
    inactivos: grupos.filter(g => g.estado === 'inactivo').length,
    cuposTotal: grupos.reduce((sum, g) => sum + (g.cupo_maximo || 0), 0),
    cuposOcupados: grupos.reduce((sum, g) => sum + (g.cupo_actual || 0), 0)
  };

  // Efectos
  useEffect(() => {
    loadCursos();
    loadInstructores();
  }, []);

  useEffect(() => {
    loadGrupos();
  }, [currentPage, cursoFilter, estadoFilter, searchTerm]);

  return (
    <div className="grupo-curso-container">
      <Sidebar />
      
      <div className="grupo-curso-content">
        <Topbar />
        
        <div className="grupo-curso-main">
          {/* HEADER */}
          <div className="grupo-curso-header">
            <div>
              <h1 className="grupo-curso-title">
                <Users size={28} />
                Gestión de Grupos de Cursos
              </h1>
              <p className="grupo-curso-subtitle">
                Administra los grupos de cursos deportivos
              </p>
            </div>
            <div className="grupo-curso-header-actions">
              <button 
                onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
                className="grupo-curso-btn-secondary"
              >
                {viewMode === 'cards' ? <List size={20} /> : <Grid size={20} />}
                {viewMode === 'cards' ? 'Vista Lista' : 'Vista Tarjetas'}
              </button>
              <button 
                onClick={openCreateModal}
                className="grupo-curso-btn-primary"
              >
                <Plus size={20} />
                Nuevo Grupo
              </button>
            </div>
          </div>

          {/* ESTADÍSTICAS */}
          <div className="grupo-curso-stats-grid">
            <div className="grupo-curso-stat-card">
              <div className="grupo-curso-stat-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                <Users size={24} />
              </div>
              <div>
                <h3 className="grupo-curso-stat-number">{stats.total}</h3>
                <p className="grupo-curso-stat-label">Grupos Totales</p>
              </div>
            </div>
            <div className="grupo-curso-stat-card">
              <div className="grupo-curso-stat-icon" style={{background: '#dcfce7', color: '#10b981'}}>
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="grupo-curso-stat-number">{stats.activos}</h3>
                <p className="grupo-curso-stat-label">Activos</p>
              </div>
            </div>
            <div className="grupo-curso-stat-card">
              <div className="grupo-curso-stat-icon" style={{background: '#fef3c7', color: '#f59e0b'}}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="grupo-curso-stat-number">{stats.completos}</h3>
                <p className="grupo-curso-stat-label">Completos</p>
              </div>
            </div>
            <div className="grupo-curso-stat-card">
              <div className="grupo-curso-stat-icon" style={{background: '#fee2e2', color: '#ef4444'}}>
                <XCircle size={24} />
              </div>
              <div>
                <h3 className="grupo-curso-stat-number">{stats.inactivos}</h3>
                <p className="grupo-curso-stat-label">Inactivos</p>
              </div>
            </div>
          </div>

          {/* FILTROS */}
          <div className="grupo-curso-filters">
            <div className="grupo-curso-filters-row">
              <div className="grupo-curso-search-container">
                <Search className="grupo-curso-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Buscar grupos por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="grupo-curso-search-input"
                />
              </div>
              <select
                value={cursoFilter}
                onChange={(e) => setCursoFilter(e.target.value)}
                className="grupo-curso-filter-select"
              >
                <option value="all">Todos los cursos</option>
                {cursos.map(curso => (
                  <option key={curso.id_curso} value={curso.id_curso}>
                    {curso.nombre}
                  </option>
                ))}
              </select>
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="grupo-curso-filter-select"
              >
                <option value="all">Todos los estados</option>
                {estados.map(estado => (
                  <option key={estado.value} value={estado.value}>{estado.label}</option>
                ))}
                <option value="activos">Solo activos</option>
              </select>
              <button onClick={loadGrupos} className="grupo-curso-btn-secondary">
                <Filter size={18} />
                Filtrar
              </button>
              <button onClick={() => {
                setSearchTerm('');
                setCursoFilter('all');
                setEstadoFilter('all');
              }} className="grupo-curso-btn-secondary">
                <RefreshCw size={18} />
                Limpiar
              </button>
            </div>
          </div>

          {/* CONTENIDO */}
          {loading ? (
            <div className="grupo-curso-loading">
              <div className="grupo-curso-loading-spinner"></div>
              <p>Cargando grupos...</p>
            </div>
          ) : error ? (
            <div className="grupo-curso-error">
              <AlertTriangle size={48} />
              <h3>Error al cargar grupos</h3>
              <p>{error}</p>
              <button onClick={loadGrupos} className="grupo-curso-btn-primary">
                <RefreshCw size={18} />
                Reintentar
              </button>
            </div>
          ) : grupos.length === 0 ? (
            <div className="grupo-curso-empty-state">
              <Users size={64} />
              <h3>No hay grupos registrados</h3>
              <p>Crea tu primer grupo para comenzar</p>
              <button onClick={openCreateModal} className="grupo-curso-btn-primary">
                <Plus size={18} />
                Crear Grupo
              </button>
            </div>
          ) : (
            <>
              {/* VISTA DE TARJETAS */}
              {viewMode === 'cards' && (
                <div className="grupo-curso-cards-grid">
                  {grupos.map((grupo) => {
                    const estadoConfig = getEstadoConfig(grupo.estado);
                    const EstadoIcon = estadoConfig.icon;
                    const porcentajeOcupacion = grupo.cupo_maximo > 0 
                      ? Math.round((grupo.cupo_actual / grupo.cupo_maximo) * 100) 
                      : 0;
                    
                    return (
                      <div key={grupo.id_grupo_curso} className="grupo-curso-card">
                        <div className="grupo-curso-card-header">
                          <div className="grupo-curso-card-image">
                            <div className="grupo-curso-card-image-placeholder">
                              <GraduationCap size={48} />
                            </div>
                          </div>
                          <div className="grupo-curso-card-status">
                            <div 
                              className="grupo-curso-status-badge"
                              style={{
                                backgroundColor: estadoConfig.color + '20',
                                color: estadoConfig.color
                              }}
                            >
                              <EstadoIcon size={14} />
                              <span>{estadoConfig.label}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grupo-curso-card-body">
                          <h3 className="grupo-curso-card-title">
                            {grupo.nombre}
                          </h3>
                          <div className="grupo-curso-card-meta">
                            <div className="grupo-curso-card-meta-item">
                              <BookOpen size={14} />
                              <span>{getCursoNombre(grupo.id_curso)}</span>
                            </div>
                            <div className="grupo-curso-card-meta-item">
                              <Users size={14} />
                              <span>{grupo.cupo_actual || 0}/{grupo.cupo_maximo}</span>
                            </div>
                          </div>
                          
                          <div className="grupo-curso-card-horario">
                            <div className="grupo-curso-card-horario-item">
                              <Clock size={12} />
                              <span>{grupo.hora_inicio?.substring(0, 5)} - {grupo.hora_fin?.substring(0, 5)}</span>
                            </div>
                            {grupo.dias_semana && (
                              <div className="grupo-curso-card-dias">
                                <Calendar size={12} />
                                <span>{formatDiasSemana(grupo.dias_semana).slice(0, 3).join(', ')}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Barra de progreso */}
                          <div className="grupo-curso-card-progress">
                            <div className="grupo-curso-card-progress-bar">
                              <div 
                                className="grupo-curso-card-progress-fill"
                                style={{ 
                                  width: `${porcentajeOcupacion}%`,
                                  backgroundColor: porcentajeOcupacion >= 100 ? '#ef4444' : 
                                                 porcentajeOcupacion >= 80 ? '#f59e0b' : '#10b981'
                                }}
                              />
                            </div>
                            <div className="grupo-curso-card-progress-text">
                              <span>{porcentajeOcupacion}% ocupado</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grupo-curso-card-footer">
                          <div className="grupo-curso-card-actions">
                            <button
                              onClick={() => openDetailModal(grupo)}
                              className="grupo-curso-card-action-btn"
                              title="Ver detalles"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEstadisticasModal(grupo)}
                              className="grupo-curso-card-action-btn"
                              title="Estadísticas"
                            >
                              <BarChart size={16} />
                            </button>
                            <button
                              onClick={() => openDeportistasModal(grupo)}
                              className="grupo-curso-card-action-btn"
                              title="Ver deportistas"
                            >
                              <User size={16} />
                            </button>
                            <button
                              onClick={() => openInstructoresModal(grupo)}
                              className="grupo-curso-card-action-btn"
                              title="Ver instructores"
                            >
                              <AwardIcon size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(grupo)}
                              className="grupo-curso-card-action-btn"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(grupo)}
                              className="grupo-curso-card-action-btn delete"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* VISTA DE LISTA */}
              {viewMode === 'list' && (
                <div className="grupo-curso-table-container">
                  <table className="grupo-curso-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Curso</th>
                        <th>Cupo</th>
                        <th>Horario</th>
                        <th>Días</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupos.map((grupo) => {
                        const estadoConfig = getEstadoConfig(grupo.estado);
                        const EstadoIcon = estadoConfig.icon;
                        
                        return (
                          <tr key={grupo.id_grupo_curso}>
                            <td>
                              <strong>{grupo.nombre}</strong>
                            </td>
                            <td>{getCursoNombre(grupo.id_curso)}</td>
                            <td>
                              <span className="grupo-curso-cupo-info">
                                {grupo.cupo_actual || 0}/{grupo.cupo_maximo}
                              </span>
                            </td>
                            <td>
                              {grupo.hora_inicio?.substring(0, 5)} - {grupo.hora_fin?.substring(0, 5)}
                            </td>
                            <td>
                              <div className="grupo-curso-dias-chips">
                                {formatDiasSemana(grupo.dias_semana || []).slice(0, 3).map((dia, idx) => (
                                  <span key={idx} className="grupo-curso-dia-chip">
                                    {dia.substring(0, 3)}
                                  </span>
                                ))}
                                {(grupo.dias_semana || []).length > 3 && (
                                  <span className="grupo-curso-dia-chip">+{(grupo.dias_semana || []).length - 3}</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div 
                                className="grupo-curso-status-badge"
                                style={{
                                  backgroundColor: estadoConfig.color + '20',
                                  color: estadoConfig.color
                                }}
                              >
                                <EstadoIcon size={12} />
                                <span>{estadoConfig.label}</span>
                              </div>
                            </td>
                            <td>
                              <div className="grupo-curso-table-actions">
                                <button
                                  onClick={() => openDetailModal(grupo)}
                                  className="grupo-curso-table-action-btn"
                                  title="Ver detalles"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  onClick={() => openEditModal(grupo)}
                                  className="grupo-curso-table-action-btn"
                                  title="Editar"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => openAsignarInstructorModal(grupo)}
                                  className="grupo-curso-table-action-btn"
                                  title="Asignar instructor"
                                >
                                  <UserPlus size={14} />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(grupo)}
                                  className="grupo-curso-table-action-btn delete"
                                  title="Eliminar"
                                >
                                  <Trash2 size={14} />
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

              {/* PAGINACIÓN */}
              {totalPages > 1 && (
                <div className="grupo-curso-pagination">
                  <div className="grupo-curso-pagination-info">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="grupo-curso-pagination-controls">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="grupo-curso-pagination-btn"
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
                          className={`grupo-curso-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="grupo-curso-pagination-btn"
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

      {/* MODAL CREAR GRUPO */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3 className="modal-title">
                <Plus size={20} />
                Nuevo Grupo de Curso
              </h3>
              <button onClick={closeCreateModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <BookOpen size={14} />
                    Curso *
                  </label>
                  <select
                    value={formData.id_curso}
                    onChange={(e) => setFormData({...formData, id_curso: e.target.value})}
                    className="modal-form-input"
                    required
                  >
                    <option value="">Seleccionar curso</option>
                    {cursos
                      .filter(curso => curso.estado === 'activo')
                      .map(curso => (
                        <option key={curso.id_curso} value={curso.id_curso}>
                          {curso.nombre}
                        </option>
                      ))
                    }
                  </select>
                  {errors.id_curso && <span className="modal-form-error">{errors.id_curso}</span>}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Tag size={14} />
                    Nombre del Grupo *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="modal-form-input"
                    placeholder="Ej: Grupo A - Mañana"
                    required
                  />
                  {errors.nombre && <span className="modal-form-error">{errors.nombre}</span>}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Users size={14} />
                    Cupo Máximo *
                  </label>
                  <input
                    type="number"
                    value={formData.cupo_maximo}
                    onChange={(e) => setFormData({...formData, cupo_maximo: parseInt(e.target.value) || 0})}
                    className="modal-form-input"
                    min="1"
                    required
                  />
                  {errors.cupo_maximo && <span className="modal-form-error">{errors.cupo_maximo}</span>}
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
                    required
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
                    required
                  />
                  {errors.hora_fin && <span className="modal-form-error">{errors.hora_fin}</span>}
                </div>
                
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    <CheckCircle size={14} />
                    Estado
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    className="modal-form-input"
                  >
                    {estados.map(estado => (
                      <option key={estado.value} value={estado.value}>{estado.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    <Calendar size={14} />
                    Días de la Semana *
                  </label>
                  <div className="modal-dias-grid">
                    {diasSemana.map(dia => (
                      <div 
                        key={dia.id}
                        className={`modal-dia-item ${formData.dias_semana.includes(dia.value) ? 'selected' : ''}`}
                        onClick={() => toggleDiaSemana(dia.value)}
                      >
                        <span className="modal-dia-label">{dia.label.substring(0, 3)}</span>
                        <span className="modal-dia-full">{dia.label}</span>
                      </div>
                    ))}
                  </div>
                  {errors.dias_semana && <span className="modal-form-error">{errors.dias_semana}</span>}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeCreateModal} className="modal-btn-secondary">
                Cancelar
              </button>
              <button onClick={createGrupo} className="modal-btn-primary">
                <Plus size={18} />
                Crear Grupo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE GRUPO */}
      {showDetailModal && selectedGrupo && (() => {
        const estadoConfig = getEstadoConfig(selectedGrupo.estado);
        const EstadoIcon = estadoConfig.icon;
        const porcentajeOcupacion = selectedGrupo.cupo_maximo > 0 
          ? Math.round((selectedGrupo.cupo_actual / selectedGrupo.cupo_maximo) * 100) 
          : 0;
        
        return (
          <div className="modal-overlay">
            <div className="modal-content large">
              <div className="modal-header">
                <h3 className="modal-title">
                  <Eye size={20} />
                  Detalles del Grupo
                </h3>
                <button onClick={closeDetailModal} className="modal-close-btn">
                  &times;
                </button>
              </div>
              
              <div className="modal-body">
                <div className="grupo-detail-header">
                  <div className="grupo-detail-title">
                    <h2>{selectedGrupo.nombre}</h2>
                    <div className="grupo-detail-actions">
                      <button
                        onClick={() => cambiarEstado(selectedGrupo.estado === 'activo' ? 'inactivo' : 'activo')}
                        className="grupo-detail-action-btn"
                      >
                        {selectedGrupo.estado === 'activo' ? 'Desactivar' : 'Activar'}
                      </button>
                      {selectedGrupo.cupos_disponibles > 0 && selectedGrupo.estado !== 'completo' && (
                        <button
                          onClick={() => cambiarEstado('completo')}
                          className="grupo-detail-action-btn warning"
                        >
                          Marcar como Completo
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grupo-detail-status-row">
                    <div 
                      className="grupo-detail-status"
                      style={{
                        backgroundColor: estadoConfig.color + '20',
                        color: estadoConfig.color
                      }}
                    >
                      <EstadoIcon size={16} />
                      <span>{estadoConfig.label}</span>
                    </div>
                    <div className="grupo-detail-cupo">
                      <Users size={16} />
                      <span>{selectedGrupo.cupo_actual || 0}/{selectedGrupo.cupo_maximo}</span>
                      <span className="grupo-detail-cupo-disponible">
                        ({selectedGrupo.cupos_disponibles || 0} cupos disponibles)
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grupo-detail-sections">
                  {/* Información del Curso */}
                  <div className="grupo-detail-section">
                    <h4 className="grupo-detail-section-title">
                      <BookOpen size={16} />
                      Información del Curso
                    </h4>
                    <div className="grupo-detail-info-grid">
                      <div className="grupo-detail-info-item">
                        <span className="grupo-detail-info-label">Curso:</span>
                        <span className="grupo-detail-info-value">
                          {selectedGrupo.curso?.nombre || 'No disponible'}
                        </span>
                      </div>
                      <div className="grupo-detail-info-item">
                        <span className="grupo-detail-info-label">Categoría:</span>
                        <span className="grupo-detail-info-value">
                          {selectedGrupo.curso?.categoria || 'No disponible'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Horario */}
                  <div className="grupo-detail-section">
                    <h4 className="grupo-detail-section-title">
                      <Clock size={16} />
                      Horario
                    </h4>
                    <div className="grupo-detail-info-grid">
                      <div className="grupo-detail-info-item">
                        <span className="grupo-detail-info-label">Horario:</span>
                        <span className="grupo-detail-info-value">
                          {selectedGrupo.hora_inicio?.substring(0, 5)} - {selectedGrupo.hora_fin?.substring(0, 5)}
                        </span>
                      </div>
                      <div className="grupo-detail-info-item">
                        <span className="grupo-detail-info-label">Días:</span>
                        <span className="grupo-detail-info-value">
                          {selectedGrupo.dias_semana_nombres?.join(', ') || 
                           formatDiasSemana(selectedGrupo.dias_semana).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progreso de Cupo */}
                  <div className="grupo-detail-section">
                    <h4 className="grupo-detail-section-title">Ocupación del Grupo</h4>
                    <div className="grupo-detail-progress">
                      <div className="grupo-detail-progress-bar">
                        <div 
                          className="grupo-detail-progress-fill"
                          style={{ 
                            width: `${porcentajeOcupacion}%`,
                            backgroundColor: porcentajeOcupacion >= 100 ? '#ef4444' : 
                                           porcentajeOcupacion >= 80 ? '#f59e0b' : '#10b981'
                          }}
                        />
                      </div>
                      <div className="grupo-detail-progress-info">
                        <span>{selectedGrupo.cupo_actual || 0} inscritos</span>
                        <span>{porcentajeOcupacion}% ocupado</span>
                        <span>{selectedGrupo.cupos_disponibles || 0} cupos libres</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Instructores */}
                  {selectedGrupo.instructores && selectedGrupo.instructores.length > 0 && (
                    <div className="grupo-detail-section">
                      <h4 className="grupo-detail-section-title">
                        <AwardIcon size={16} />
                        Instructores ({selectedGrupo.instructores.length})
                      </h4>
                      <div className="grupo-detail-instructores">
                        {selectedGrupo.instructores.map((instructor, index) => (
                          <div key={instructor.id_instructor || index} className="grupo-detail-instructor">
                            <div className="grupo-detail-instructor-icon">
                              <User size={16} />
                            </div>
                            <div className="grupo-detail-instructor-info">
                              <span className="grupo-detail-instructor-nombre">
                                {instructor.nombre || instructor.usuario?.nombre || 'Instructor'}
                              </span>
                              {instructor.pivot?.coordinador && (
                                <span className="grupo-detail-instructor-coordinador">
                                  <Star size={12} />
                                  Coordinador
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Estadísticas */}
                  <div className="grupo-detail-section">
                    <h4 className="grupo-detail-section-title">
                      <BarChart size={16} />
                      Estadísticas
                    </h4>
                    <div className="grupo-detail-stats-grid">
                      <div className="grupo-detail-stat">
                        <span className="grupo-detail-stat-label">Creado por:</span>
                        <span className="grupo-detail-stat-value">
                          {selectedGrupo.created_by || 'Sistema'}
                        </span>
                      </div>
                      <div className="grupo-detail-stat">
                        <span className="grupo-detail-stat-label">Última actualización:</span>
                        <span className="grupo-detail-stat-value">
                          {selectedGrupo.updated_at ? new Date(selectedGrupo.updated_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      {selectedGrupo.inscripciones && (
                        <div className="grupo-detail-stat">
                          <span className="grupo-detail-stat-label">Total inscripciones:</span>
                          <span className="grupo-detail-stat-value">
                            {selectedGrupo.inscripciones.length}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button onClick={closeDetailModal} className="modal-btn-secondary">
                  Cerrar
                </button>
                <button 
                  onClick={() => {
                    closeDetailModal();
                    openEditModal(selectedGrupo);
                  }}
                  className="modal-btn-primary"
                >
                  <Edit2 size={18} />
                  Editar Grupo
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL EDITAR GRUPO */}
      {showEditModal && selectedGrupo && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3 className="modal-title">
                <Edit2 size={20} />
                Editar Grupo: {selectedGrupo.nombre}
              </h3>
              <button onClick={closeEditModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Tag size={14} />
                    Nombre del Grupo *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="modal-form-input"
                    placeholder="Ej: Grupo A - Mañana"
                    required
                  />
                  {errors.nombre && <span className="modal-form-error">{errors.nombre}</span>}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Users size={14} />
                    Cupo Máximo *
                  </label>
                  <input
                    type="number"
                    value={formData.cupo_maximo}
                    onChange={(e) => setFormData({...formData, cupo_maximo: parseInt(e.target.value) || 0})}
                    className="modal-form-input"
                    min={selectedGrupo.cupo_actual || 1}
                    required
                  />
                  <small className="modal-form-help">
                    Cupo actual: {selectedGrupo.cupo_actual || 0} inscritos
                  </small>
                  {errors.cupo_maximo && <span className="modal-form-error">{errors.cupo_maximo}</span>}
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
                    required
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
                    required
                  />
                  {errors.hora_fin && <span className="modal-form-error">{errors.hora_fin}</span>}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <CheckCircle size={14} />
                    Estado
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    className="modal-form-input"
                  >
                    {estados.map(estado => (
                      <option key={estado.value} value={estado.value}>{estado.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    <Calendar size={14} />
                    Días de la Semana *
                  </label>
                  <div className="modal-dias-grid">
                    {diasSemana.map(dia => (
                      <div 
                        key={dia.id}
                        className={`modal-dia-item ${formData.dias_semana.includes(dia.value) ? 'selected' : ''}`}
                        onClick={() => toggleDiaSemana(dia.value)}
                      >
                        <span className="modal-dia-label">{dia.label.substring(0, 3)}</span>
                        <span className="modal-dia-full">{dia.label}</span>
                      </div>
                    ))}
                  </div>
                  {errors.dias_semana && <span className="modal-form-error">{errors.dias_semana}</span>}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeEditModal} className="modal-btn-secondary">
                Cancelar
              </button>
              <button onClick={updateGrupo} className="modal-btn-primary">
                <Edit2 size={18} />
                Actualizar Grupo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ASIGNAR INSTRUCTOR */}
      {showAsignarInstructorModal && selectedGrupo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <UserPlus size={20} />
                Asignar Instructor a: {selectedGrupo.nombre}
              </h3>
              <button onClick={closeAsignarInstructorModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <User size={14} />
                    Instructor *
                  </label>
                  <select
                    value={asignarInstructorData.id_instructor}
                    onChange={(e) => setAsignarInstructorData({
                      ...asignarInstructorData, 
                      id_instructor: e.target.value
                    })}
                    className="modal-form-input"
                    required
                  >
                    <option value="">Seleccionar instructor</option>
                    {instructores.map(instructor => (
                      <option key={instructor.id_instructor} value={instructor.id_instructor}>
                        {instructor.nombre || instructor.usuario?.nombre || `Instructor #${instructor.id_instructor}`}
                      </option>
                    ))}
                  </select>
                  {errors.id_instructor && <span className="modal-form-error">{errors.id_instructor}</span>}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-checkbox">
                    <input
                      type="checkbox"
                      checked={asignarInstructorData.coordinador}
                      onChange={(e) => setAsignarInstructorData({
                        ...asignarInstructorData, 
                        coordinador: e.target.checked
                      })}
                    />
                    <span className="modal-form-checkbox-label">
                      <Star size={14} />
                      Designar como coordinador del grupo
                    </span>
                  </label>
                  <small className="modal-form-help">
                    Solo puede haber un coordinador por grupo
                  </small>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeAsignarInstructorModal} className="modal-btn-secondary">
                Cancelar
              </button>
              <button onClick={asignarInstructor} className="modal-btn-primary">
                <UserPlus size={18} />
                Asignar Instructor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INSTRUCTORES */}
      {showInstructoresModal && selectedGrupo && selectedGrupo.instructores && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3 className="modal-title">
                <AwardIcon size={20} />
                Instructores del Grupo: {selectedGrupo.nombre}
              </h3>
              <button onClick={closeInstructoresModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="instructores-list">
                {selectedGrupo.instructores.length === 0 ? (
                  <div className="instructores-empty">
                    <User size={48} />
                    <p>No hay instructores asignados a este grupo</p>
                    <button 
                      onClick={() => {
                        closeInstructoresModal();
                        openAsignarInstructorModal(selectedGrupo);
                      }}
                      className="modal-btn-primary"
                    >
                      <UserPlus size={16} />
                      Asignar Instructor
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="instructores-stats">
                      <div className="instructores-stat">
                        <span className="instructores-stat-label">Total instructores:</span>
                        <span className="instructores-stat-value">{selectedGrupo.instructores.length}</span>
                      </div>
                      <div className="instructores-stat">
                        <span className="instructores-stat-label">Coordinador:</span>
                        <span className="instructores-stat-value">
                          {selectedGrupo.instructores.find(i => i.pivot?.coordinador)?.nombre || 'No asignado'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="instructores-grid">
                      {selectedGrupo.instructores.map((instructor) => (
                        <div key={instructor.id_instructor} className="instructor-card">
                          <div className="instructor-header">
                            <div className="instructor-icon">
                              <User size={24} />
                            </div>
                            <div className="instructor-info">
                              <h4 className="instructor-nombre">
                                {instructor.nombre || instructor.usuario?.nombre || 'Instructor'}
                              </h4>
                              {instructor.pivot?.coordinador && (
                                <div className="instructor-coordinador-badge">
                                  <Star size={12} />
                                  <span>Coordinador</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="instructor-details">
                            {instructor.especialidad && (
                              <div className="instructor-detail">
                                <span className="instructor-detail-label">Especialidad:</span>
                                <span className="instructor-detail-value">{instructor.especialidad}</span>
                              </div>
                            )}
                            {instructor.experiencia && (
                              <div className="instructor-detail">
                                <span className="instructor-detail-label">Experiencia:</span>
                                <span className="instructor-detail-value">{instructor.experiencia}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="instructor-actions">
                            {!instructor.pivot?.coordinador && (
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await fetch(
                                      `${API_GRUPOS}/${selectedGrupo.id_grupo_curso}/actualizar-coordinador`,
                                      {
                                        method: 'POST',
                                        headers: authHeaders(),
                                        body: JSON.stringify({
                                          id_instructor: instructor.id_instructor,
                                          coordinador: true
                                        })
                                      }
                                    );
                                    
                                    if (response.ok) {
                                      alert('✅ Instructor designado como coordinador');
                                      const updatedGrupo = await loadGrupoDetalle(selectedGrupo.id_grupo_curso);
                                      setSelectedGrupo(updatedGrupo);
                                    }
                                  } catch (error) {
                                    console.error('Error actualizando coordinador:', error);
                                  }
                                }}
                                className="instructor-action-btn"
                              >
                                <Star size={14} />
                                Hacer Coordinador
                              </button>
                            )}
                            <button
                              onClick={() => quitarInstructor(instructor.id_instructor)}
                              className="instructor-action-btn delete"
                            >
                              <UserMinus size={14} />
                              Quitar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeInstructoresModal} className="modal-btn-secondary">
                Cerrar
              </button>
              {selectedGrupo.instructores.length > 0 && (
                <button 
                  onClick={() => {
                    closeInstructoresModal();
                    openAsignarInstructorModal(selectedGrupo);
                  }}
                  className="modal-btn-primary"
                >
                  <UserPlus size={16} />
                  Agregar Otro Instructor
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DEPORTISTAS */}
      {showDeportistasModal && selectedGrupo && selectedGrupo.deportistas && (
        <div className="modal-overlay">
          <div className="modal-content xlarge">
            <div className="modal-header">
              <h3 className="modal-title">
                <Users size={20} />
                Deportistas Inscritos: {selectedGrupo.grupo || selectedGrupo.nombre}
              </h3>
              <button onClick={closeDeportistasModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="deportistas-header">
                <div className="deportistas-stats">
                  <div className="deportistas-stat">
                    <span className="deportistas-stat-label">Curso:</span>
                    <span className="deportistas-stat-value">{selectedGrupo.curso}</span>
                  </div>
                  <div className="deportistas-stat">
                    <span className="deportistas-stat-label">Cupo:</span>
                    <span className="deportistas-stat-value">
                      {selectedGrupo.cupo_actual}/{selectedGrupo.cupo_maximo}
                    </span>
                  </div>
                  <div className="deportistas-stat">
                    <span className="deportistas-stat-label">Disponibles:</span>
                    <span className="deportistas-stat-value">{selectedGrupo.cupos_disponibles}</span>
                  </div>
                  <div className="deportistas-stat">
                    <span className="deportistas-stat-label">Total deportistas:</span>
                    <span className="deportistas-stat-value">{selectedGrupo.total_deportistas}</span>
                  </div>
                </div>
              </div>
              
              <div className="deportistas-table-container">
                <table className="deportistas-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nombre</th>
                      <th>Documento</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                      <th>Estado</th>
                      <th>Fecha Inscripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGrupo.deportistas && selectedGrupo.deportistas.length > 0 ? (
                      selectedGrupo.deportistas.map((inscripcion, index) => {
                        const deportista = inscripcion.deportista || inscripcion;
                        const usuario = deportista.usuario || {};
                        
                        return (
                          <tr key={inscripcion.id_inscripcion || index}>
                            <td>{index + 1}</td>
                            <td>
                              <div className="deportista-info">
                                <div className="deportista-nombre">
                                  {usuario.nombre} {usuario.apellido}
                                </div>
                                <div className="deportista-documento">
                                  {deportista.tipo_documento} {deportista.numero_documento}
                                </div>
                              </div>
                            </td>
                            <td>
                              {deportista.tipo_documento} {deportista.numero_documento}
                            </td>
                            <td>{usuario.email}</td>
                            <td>{usuario.telefono || 'N/A'}</td>
                            <td>
                              <div className="deportista-estado-badge">
                                {inscripcion.estado === 'activa' ? 'Activo' : inscripcion.estado}
                              </div>
                            </td>
                            <td>
                              {inscripcion.fecha_inscripcion 
                                ? new Date(inscripcion.fecha_inscripcion).toLocaleDateString()
                                : 'N/A'
                              }
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="deportistas-empty">
                          <Users size={48} />
                          <p>No hay deportistas inscritos en este grupo</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeDeportistasModal} className="modal-btn-secondary">
                Cerrar
              </button>
              <button 
                onClick={() => {
                  // Exportar a CSV
                  const headers = ['Nombre', 'Documento', 'Email', 'Teléfono', 'Estado', 'Fecha Inscripción'];
                  const csvData = selectedGrupo.deportistas?.map(inscripcion => {
                    const deportista = inscripcion.deportista || inscripcion;
                    const usuario = deportista.usuario || {};
                    return [
                      `${usuario.nombre} ${usuario.apellido}`,
                      `${deportista.tipo_documento} ${deportista.numero_documento}`,
                      usuario.email,
                      usuario.telefono || 'N/A',
                      inscripcion.estado,
                      inscripcion.fecha_inscripcion || 'N/A'
                    ];
                  }) || [];
                  
                  const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `deportistas_${selectedGrupo.grupo || selectedGrupo.nombre}.csv`;
                  a.click();
                }}
                className="modal-btn-primary"
              >
                <Download size={16} />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {showDeleteModal && selectedGrupo && (() => {
        const estadoConfig = getEstadoConfig(selectedGrupo.estado);
        
        return (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">
                  <AlertTriangle size={20} />
                  Eliminar Grupo
                </h3>
                <button onClick={closeDeleteModal} className="modal-close-btn">
                  &times;
                </button>
              </div>
              
              <div className="modal-body">
                <div className="delete-modal-content">
                  <AlertTriangle size={48} />
                  <h4>¿Estás seguro de eliminar este grupo?</h4>
                  <p>Esta acción no se puede deshacer. Solo se pueden eliminar grupos sin inscripciones activas.</p>
                  
                  <div className="delete-modal-info">
                    <div className="delete-modal-item">
                      <span>Nombre:</span>
                      <strong>{selectedGrupo.nombre}</strong>
                    </div>
                    <div className="delete-modal-item">
                      <span>Curso:</span>
                      <strong>{getCursoNombre(selectedGrupo.id_curso)}</strong>
                    </div>
                    <div className="delete-modal-item">
                      <span>Estado:</span>
                      <div 
                        className="delete-modal-estado"
                        style={{ color: estadoConfig.color }}
                      >
                        {estadoConfig.label}
                      </div>
                    </div>
                    <div className="delete-modal-item">
                      <span>Inscritos:</span>
                      <strong>{selectedGrupo.cupo_actual || 0} deportistas</strong>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button onClick={closeDeleteModal} className="modal-btn-secondary">
                  Cancelar
                </button>
                <button onClick={deleteGrupo} className="modal-btn-danger">
                  <Trash2 size={18} />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL ESTADÍSTICAS */}
      {showEstadisticasModal && selectedGrupo && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3 className="modal-title">
                <BarChart size={20} />
                Estadísticas: {selectedGrupo.nombre || selectedGrupo.nombre}
              </h3>
              <button onClick={closeEstadisticasModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="estadisticas-content">
                <div className="estadisticas-grid">
                  <div className="estadistica-card">
                    <div className="estadistica-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                      <Users size={24} />
                    </div>
                    <div className="estadistica-info">
                      <h3 className="estadistica-value">{selectedGrupo.cupo_maximo}</h3>
                      <p className="estadistica-label">Cupo Máximo</p>
                    </div>
                  </div>
                  
                  <div className="estadistica-card">
                    <div className="estadistica-icon" style={{background: '#dcfce7', color: '#10b981'}}>
                      <Users size={24} />
                    </div>
                    <div className="estadistica-info">
                      <h3 className="estadistica-value">{selectedGrupo.cupo_actual || 0}</h3>
                      <p className="estadistica-label">Cupo Actual</p>
                    </div>
                  </div>
                  
                  <div className="estadistica-card">
                    <div className="estadistica-icon" style={{background: '#fef3c7', color: '#f59e0b'}}>
                      <Users size={24} />
                    </div>
                    <div className="estadistica-info">
                      <h3 className="estadistica-value">{selectedGrupo.cupos_disponibles || 0}</h3>
                      <p className="estadistica-label">Cupos Disponibles</p>
                    </div>
                  </div>
                  
                  <div className="estadistica-card">
                    <div className="estadistica-icon" style={{background: '#f3e8ff', color: '#8b5cf6'}}>
                      <BarChart size={24} />
                    </div>
                    <div className="estadistica-info">
                      <h3 className="estadistica-value">{selectedGrupo.porcentaje_ocupacion || 0}%</h3>
                      <p className="estadistica-label">Ocupación</p>
                    </div>
                  </div>
                </div>
                
                <div className="estadisticas-details">
                  {selectedGrupo.inscripciones_activas !== undefined && (
                    <div className="estadistica-detail">
                      <span className="estadistica-detail-label">Inscripciones activas:</span>
                      <span className="estadistica-detail-value">{selectedGrupo.inscripciones_activas}</span>
                    </div>
                  )}
                  
                  {selectedGrupo.inscripciones_completadas !== undefined && (
                    <div className="estadistica-detail">
                      <span className="estadistica-detail-label">Inscripciones completadas:</span>
                      <span className="estadistica-detail-value">{selectedGrupo.inscripciones_completadas}</span>
                    </div>
                  )}
                  
                  {selectedGrupo.inscripciones_canceladas !== undefined && (
                    <div className="estadistica-detail">
                      <span className="estadistica-detail-label">Inscripciones canceladas:</span>
                      <span className="estadistica-detail-value">{selectedGrupo.inscripciones_canceladas}</span>
                    </div>
                  )}
                  
                  {selectedGrupo.total_instructores !== undefined && (
                    <div className="estadistica-detail">
                      <span className="estadistica-detail-label">Total instructores:</span>
                      <span className="estadistica-detail-value">{selectedGrupo.total_instructores}</span>
                    </div>
                  )}
                  
                  {selectedGrupo.tiene_coordinador !== undefined && (
                    <div className="estadistica-detail">
                      <span className="estadistica-detail-label">Tiene coordinador:</span>
                      <span className="estadistica-detail-value">
                        {selectedGrupo.tiene_coordinador ? 'Sí' : 'No'}
                      </span>
                    </div>
                  )}
                  
                  {selectedGrupo.dias_semana && (
                    <div className="estadistica-detail">
                      <span className="estadistica-detail-label">Días de clase:</span>
                      <span className="estadistica-detail-value">
                        {Array.isArray(selectedGrupo.dias_semana) 
                          ? selectedGrupo.dias_semana.join(', ') 
                          : selectedGrupo.dias_semana}
                      </span>
                    </div>
                  )}
                  
                  {selectedGrupo.horario && (
                    <div className="estadistica-detail">
                      <span className="estadistica-detail-label">Horario:</span>
                      <span className="estadistica-detail-value">{selectedGrupo.horario}</span>
                    </div>
                  )}
                </div>
                
                {/* Gráfico de ocupación */}
                {selectedGrupo.porcentaje_ocupacion !== undefined && (
                  <div className="estadisticas-chart">
                    <h4 className="estadisticas-chart-title">Ocupación del Grupo</h4>
                    <div className="estadisticas-chart-bar">
                      <div 
                        className="estadisticas-chart-fill"
                        style={{ 
                          width: `${Math.min(selectedGrupo.porcentaje_ocupacion, 100)}%`,
                          backgroundColor: selectedGrupo.porcentaje_ocupacion >= 100 ? '#ef4444' : 
                                         selectedGrupo.porcentaje_ocupacion >= 80 ? '#f59e0b' : '#10b981'
                        }}
                      >
                        <span className="estadisticas-chart-percentage">
                          {selectedGrupo.porcentaje_ocupacion}%
                        </span>
                      </div>
                    </div>
                    <div className="estadisticas-chart-labels">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeEstadisticasModal} className="modal-btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrupoCurso;