import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Users, Calendar, UserPlus, Search, Filter,
  RefreshCw, Edit2, Trash2, Eye, CheckCircle, XCircle,
  Clock, Award, Download, Upload, ChevronLeft, ChevronRight,
  Plus, MoreVertical, BarChart, PieChart, TrendingUp, FileText,
  Star, Check, X, AlertCircle, Info, GraduationCap, User,
  Tag, CalendarDays, BookCheck, BookMarked, BookX, Book,
  Users as UsersIcon, Folder, Hash, DollarSign, Target,
  Activity, TrendingDown, CreditCard, FileSpreadsheet, Printer,
  Share2, Copy, ExternalLink, MessageSquare, Award as AwardIcon,
  CheckSquare, Square, Filter as FilterIcon, Download as DownloadIcon,
  Upload as UploadIcon, Calendar as CalendarIcon, User as UserIcon,
  BookOpen as BookOpenIcon, Award as AwardIcon2, Star as StarIcon,
  Users as UsersIcon2, Target as TargetIcon, BarChart as BarChartIcon,
  Save // Agregado Save para los modales
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/inscripcioncurso.css';

const API_INSCRIPCIONES = 'http://127.0.0.1:8000/api/inscripciones-curso';
const API_CURSOS = 'http://127.0.0.1:8000/api/cursos';
const API_CURSOS_DISPONIBLES = 'http://127.0.0.1:8000/api/inscripciones-curso/cursos-disponibles';
const API_USUARIOS = 'http://127.0.0.1:8000/api/usuarios';
const API_DEPORTISTAS = 'http://127.0.0.1:8000/api/deportistas/activos/listar'; // Cambiado para usar endpoint específico
const API_GRUPOS = 'http://127.0.0.1:8000/api/grupos-curso';

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

const InscripcionCurso = () => {
  // Estados principales
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCalificarModal, setShowCalificarModal] = useState(false);
  
  const [selectedInscripcion, setSelectedInscripcion] = useState(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [cursoFilter, setCursoFilter] = useState('all');
  const [grupoFilter, setGrupoFilter] = useState('all');
  const [usuarioFilter, setUsuarioFilter] = useState('all');
  const [deportistaFilter, setDeportistaFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Datos para formularios
  const [cursos, setCursos] = useState([]);
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [deportistas, setDeportistas] = useState([]);
  const [grupos, setGrupos] = useState([]);
  
  // Formularios
  const [formData, setFormData] = useState({
    id_curso: '',
    id_grupo: '',
    id_usuario: '',
    id_deportista: '',
    observaciones: ''
  });
  
  const [editFormData, setEditFormData] = useState({
    estado: 'activa',
    observaciones: ''
  });
  
  const [calificarFormData, setCalificarFormData] = useState({
    calificacion: '',
    comentarios: ''
  });
  
  const [errors, setErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [calificarErrors, setCalificarErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Estados para filtros de grupos
  const [gruposFiltrados, setGruposFiltrados] = useState([]);
  
  // Estados de los datos
  const estados = [
    { value: 'activa', label: 'Activa', color: '#10b981', icon: CheckCircle, bgColor: '#dcfce7' },
    { value: 'completada', label: 'Completada', color: '#3b82f6', icon: Award, bgColor: '#dbeafe' },
    { value: 'cancelada', label: 'Cancelada', color: '#ef4444', icon: XCircle, bgColor: '#fee2e2' },
    { value: 'abandonada', label: 'Abandonada', color: '#f59e0b', icon: Clock, bgColor: '#fef3c7' }
  ];

  // Funciones helper
  const getEstadoConfig = (estado) => {
    return estados.find(e => e.value === estado) || estados[0];
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCalificacion = (calificacion) => {
    if (calificacion === null || calificacion === undefined) return 'Sin calificar';
    return `${Number(calificacion).toFixed(1)}/10`;
  };

  // Normalizar datos para asegurar arrays
  const normalizarDatos = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.inscripciones && Array.isArray(data.inscripciones)) return data.inscripciones;
    return [];
  };

  // Cargar inscripciones
  const loadInscripciones = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: currentPage
      };
      
      if (estadoFilter !== 'all') params.estado = estadoFilter;
      if (cursoFilter !== 'all') params.id_curso = cursoFilter;
      if (grupoFilter !== 'all') params.id_grupo = grupoFilter;
      if (usuarioFilter !== 'all') params.id_usuario = usuarioFilter;
      if (deportistaFilter !== 'all') params.id_deportista = deportistaFilter;
      if (searchTerm.trim() !== '') params.search = searchTerm;
      
      const queryParams = new URLSearchParams(params);
      const url = `${API_INSCRIPCIONES}?${queryParams}`;
      
      console.log('🔍 Cargando inscripciones desde:', url);
      
      const response = await fetch(url, {
        headers: authHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('📦 Inscripciones recibidas:', data.data?.length || 0);
      setInscripciones(normalizarDatos(data));
      setTotalPages(data.last_page || 1);
      
    } catch (err) {
      console.error('❌ Error cargando inscripciones:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos adicionales
  const loadCursos = async () => {
    try {
      const response = await fetch(API_CURSOS, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setCursos(normalizarDatos(data));
      }
    } catch (error) {
      console.error('Error cargando cursos:', error);
      setCursos([]);
    }
  };

  const loadCursosDisponibles = async () => {
    try {
      const response = await fetch(API_CURSOS_DISPONIBLES, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setCursosDisponibles(normalizarDatos(data));
      }
    } catch (error) {
      console.error('Error cargando cursos disponibles:', error);
      setCursosDisponibles([]);
    }
  };

  const loadUsuarios = async () => {
    try {
      const response = await fetch(API_USUARIOS, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsuarios(normalizarDatos(data));
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setUsuarios([]);
    }
  };

  const loadDeportistas = async () => {
    try {
      const response = await fetch(API_DEPORTISTAS, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Datos de deportistas recibidos:', data);
        setDeportistas(normalizarDatos(data));
      }
    } catch (error) {
      console.error('Error cargando deportistas:', error);
      setDeportistas([]);
    }
  };

  const loadGrupos = async () => {
    try {
      const response = await fetch(API_GRUPOS, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setGrupos(normalizarDatos(data));
      }
    } catch (error) {
      console.error('Error cargando grupos:', error);
      setGrupos([]);
    }
  };

  // Filtrar grupos por curso
  const filtrarGruposPorCurso = (cursoId) => {
    if (!cursoId) {
      setGruposFiltrados([]);
      return;
    }
    
    const gruposDelCurso = grupos.filter(grupo => grupo.id_curso == cursoId);
    setGruposFiltrados(gruposDelCurso);
    
    // Si hay grupos, seleccionar el primero
    if (gruposDelCurso.length > 0 && !formData.id_grupo) {
      setFormData(prev => ({ ...prev, id_grupo: gruposDelCurso[0].id }));
    }
  };

  // Crear inscripción
  const createInscripcion = async () => {
    setErrors({});
    
    try {
      const response = await fetch(API_INSCRIPCIONES, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage('✅ Inscripción creada exitosamente');
        setTimeout(() => setSuccessMessage(null), 3000);
        closeCreateModal();
        loadInscripciones();
      } else {
        setErrors(data.errors || { message: data.message || 'Error al crear inscripción' });
      }
    } catch (error) {
      console.error('❌ Error creando inscripción:', error);
      setErrors({ message: 'Error de conexión' });
    }
  };

  // Actualizar inscripción
  const updateInscripcion = async () => {
    if (!selectedInscripcion) return;
    
    setEditErrors({});
    
    try {
      const response = await fetch(`${API_INSCRIPCIONES}/${selectedInscripcion.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(editFormData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage('✅ Inscripción actualizada exitosamente');
        setTimeout(() => setSuccessMessage(null), 3000);
        closeEditModal();
        loadInscripciones();
      } else {
        setEditErrors(data.errors || { message: data.message || 'Error al actualizar inscripción' });
      }
    } catch (error) {
      console.error('❌ Error actualizando inscripción:', error);
      setEditErrors({ message: 'Error de conexión' });
    }
  };

  // Calificar inscripción
  const calificarInscripcion = async () => {
    if (!selectedInscripcion) return;
    
    setCalificarErrors({});
    
    try {
      const response = await fetch(`${API_INSCRIPCIONES}/${selectedInscripcion.id}/calificar`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(calificarFormData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage('✅ Calificación registrada exitosamente');
        setTimeout(() => setSuccessMessage(null), 3000);
        closeCalificarModal();
        loadInscripciones();
      } else {
        setCalificarErrors(data.errors || { message: data.message || 'Error al calificar' });
      }
    } catch (error) {
      console.error('❌ Error calificando inscripción:', error);
      setCalificarErrors({ message: 'Error de conexión' });
    }
  };

  // Eliminar inscripción
  const deleteInscripcion = async () => {
    if (!selectedInscripcion) return;
    
    try {
      const response = await fetch(`${API_INSCRIPCIONES}/${selectedInscripcion.id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      if (response.ok) {
        setSuccessMessage('✅ Inscripción eliminada exitosamente');
        setTimeout(() => setSuccessMessage(null), 3000);
        closeDeleteModal();
        loadInscripciones();
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.message || 'No se pudo eliminar la inscripción'}`);
      }
    } catch (error) {
      console.error('❌ Error eliminando inscripción:', error);
      alert('❌ Error de conexión');
    }
  };

  // Modal functions
  const openCreateModal = async () => {
    // Cargar cursos disponibles primero
    await loadCursosDisponibles();
    
    setFormData({
      id_curso: '',
      id_grupo: '',
      id_usuario: '',
      id_deportista: '',
      observaciones: ''
    });
    setGruposFiltrados([]);
    setErrors({});
    setShowCreateModal(true);
  };

  const openEditModal = (inscripcion) => {
    setSelectedInscripcion(inscripcion);
    setEditFormData({
      estado: inscripcion.estado || 'activa',
      observaciones: inscripcion.observaciones || ''
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  const openDetailModal = async (inscripcion) => {
    try {
      const response = await fetch(`${API_INSCRIPCIONES}/${inscripcion.id}`, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedInscripcion(data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error cargando detalles:', error);
    }
  };

  const openDeleteModal = (inscripcion) => {
    setSelectedInscripcion(inscripcion);
    setShowDeleteModal(true);
  };

  const openCalificarModal = (inscripcion) => {
    setSelectedInscripcion(inscripcion);
    setCalificarFormData({
      calificacion: inscripcion.calificacion || '',
      comentarios: inscripcion.comentarios || ''
    });
    setCalificarErrors({});
    setShowCalificarModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      id_curso: '',
      id_grupo: '',
      id_usuario: '',
      id_deportista: '',
      observaciones: ''
    });
    setGruposFiltrados([]);
    setErrors({});
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedInscripcion(null);
    setEditFormData({ estado: 'activa', observaciones: '' });
    setEditErrors({});
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedInscripcion(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedInscripcion(null);
  };

  const closeCalificarModal = () => {
    setShowCalificarModal(false);
    setSelectedInscripcion(null);
    setCalificarFormData({ calificacion: '', comentarios: '' });
    setCalificarErrors({});
  };

  // Exportar inscripciones
  const exportInscripciones = () => {
    const data = {
      fecha_exportacion: new Date().toISOString(),
      total_inscripciones: inscripciones.length,
      filtros_aplicados: {
        estado: estadoFilter,
        curso: cursoFilter,
        grupo: grupoFilter,
        usuario: usuarioFilter,
        deportista: deportistaFilter,
        busqueda: searchTerm
      },
      inscripciones: inscripciones.map(insc => ({
        id: insc.id,
        curso: insc.curso?.nombre,
        grupo: insc.grupo?.nombre,
        deportista: insc.deportista?.nombre_completo || `${insc.deportista?.nombre} ${insc.deportista?.apellido}`,
        tutor: insc.usuario?.nombre,
        fecha_inscripcion: insc.fecha_inscripcion,
        estado: insc.estado,
        calificacion: insc.calificacion,
        observaciones: insc.observaciones
      }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inscripciones_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Estadísticas
  const stats = {
    total: inscripciones.length,
    activas: inscripciones.filter(i => i.estado === 'activa').length,
    completadas: inscripciones.filter(i => i.estado === 'completada').length,
    canceladas: inscripciones.filter(i => i.estado === 'cancelada').length,
    abandonadas: inscripciones.filter(i => i.estado === 'abandonada').length,
    calificadas: inscripciones.filter(i => i.calificacion !== null).length,
    promedioCalificacion: inscripciones.filter(i => i.calificacion !== null).length > 0 
      ? inscripciones.reduce((sum, i) => sum + (Number(i.calificacion) || 0), 0) / 
        inscripciones.filter(i => i.calificacion !== null).length
      : 0
  };

  // Efectos
  useEffect(() => {
    loadInscripciones();
  }, [currentPage, estadoFilter, cursoFilter, grupoFilter, usuarioFilter, deportistaFilter, searchTerm]);

  useEffect(() => {
    loadCursos();
    loadUsuarios();
    loadDeportistas();
    loadGrupos();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Efecto para cargar grupos cuando se selecciona un curso
  useEffect(() => {
    if (formData.id_curso) {
      filtrarGruposPorCurso(formData.id_curso);
    }
  }, [formData.id_curso, grupos]);

  return (
    <div className="inscripcion-container">
      <Sidebar />
      
      <div className="inscripcion-content">
        <Topbar />
        
        <div className="inscripcion-main">
          {/* HEADER */}
          <div className="inscripcion-header">
            <div>
              <h1 className="inscripcion-title">
                <BookOpen size={28} />
                Gestión de Inscripciones a Cursos
              </h1>
              <p className="inscripcion-subtitle">
                Administra las inscripciones de deportistas a cursos y grupos
              </p>
            </div>
            <div className="inscripcion-header-actions">
              <button 
                onClick={openCreateModal}
                className="inscripcion-btn-primary"
              >
                <UserPlus size={20} />
                Nueva Inscripción
              </button>
            </div>
          </div>

          {/* MENSAJES DE ÉXITO */}
          {successMessage && (
            <div className="success-message">
              <CheckCircle size={20} />
              {successMessage}
            </div>
          )}

          {/* ESTADÍSTICAS */}
          <div className="inscripcion-stats-grid">
            <div className="inscripcion-stat-card">
              <div className="inscripcion-stat-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="inscripcion-stat-number">{stats.total}</h3>
                <p className="inscripcion-stat-label">Total Inscripciones</p>
              </div>
            </div>
            <div className="inscripcion-stat-card">
              <div className="inscripcion-stat-icon" style={{background: '#dcfce7', color: '#10b981'}}>
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="inscripcion-stat-number">{stats.activas}</h3>
                <p className="inscripcion-stat-label">Activas</p>
              </div>
            </div>
            <div className="inscripcion-stat-card">
              <div className="inscripcion-stat-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                <Award size={24} />
              </div>
              <div>
                <h3 className="inscripcion-stat-number">{stats.completadas}</h3>
                <p className="inscripcion-stat-label">Completadas</p>
              </div>
            </div>
            <div className="inscripcion-stat-card">
              <div className="inscripcion-stat-icon" style={{background: '#fee2e2', color: '#ef4444'}}>
                <XCircle size={24} />
              </div>
              <div>
                <h3 className="inscripcion-stat-number">{stats.canceladas + stats.abandonadas}</h3>
                <p className="inscripcion-stat-label">Canceladas/Abandonadas</p>
              </div>
            </div>
            <div className="inscripcion-stat-card">
              <div className="inscripcion-stat-icon" style={{background: '#fef3c7', color: '#f59e0b'}}>
                <Star size={24} />
              </div>
              <div>
                <h3 className="inscripcion-stat-number">{stats.calificadas}</h3>
                <p className="inscripcion-stat-label">Calificadas</p>
              </div>
            </div>
            <div className="inscripcion-stat-card">
              <div className="inscripcion-stat-icon" style={{background: '#f3e8ff', color: '#8b5cf6'}}>
                <BarChart size={24} />
              </div>
              <div>
                <h3 className="inscripcion-stat-number">{stats.promedioCalificacion.toFixed(1)}</h3>
                <p className="inscripcion-stat-label">Promedio Calificación</p>
              </div>
            </div>
          </div>

          {/* FILTROS */}
          <div className="inscripcion-filters">
            <div className="inscripcion-filters-row">
              <div className="inscripcion-search-container">
                <Search className="inscripcion-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Buscar inscripciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="inscripcion-search-input"
                />
              </div>
              
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="inscripcion-filter-select"
              >
                <option value="all">Todos los estados</option>
                {estados.map((estado, index) => (
                  <option key={`estado-${index}`} value={estado.value}>{estado.label}</option>
                ))}
              </select>
              
              <select
                value={cursoFilter}
                onChange={(e) => setCursoFilter(e.target.value)}
                className="inscripcion-filter-select"
              >
                <option value="all">Todos los cursos</option>
                {Array.isArray(cursos) && cursos.map((curso, index) => (
                  <option key={`curso-${curso.id || index}`} value={curso.id}>
                    {curso.nombre}
                  </option>
                ))}
              </select>
              
              <button onClick={loadInscripciones} className="inscripcion-btn-secondary">
                <Filter size={18} />
                Filtrar
              </button>
              
              <button onClick={() => {
                setSearchTerm('');
                setEstadoFilter('all');
                setCursoFilter('all');
                setGrupoFilter('all');
                setUsuarioFilter('all');
                setDeportistaFilter('all');
                setCurrentPage(1);
              }} className="inscripcion-btn-secondary">
                <RefreshCw size={18} />
                Limpiar
              </button>
            </div>
            
            <div className="inscripcion-filters-row">
              <select
                value={grupoFilter}
                onChange={(e) => setGrupoFilter(e.target.value)}
                className="inscripcion-filter-select"
              >
                <option value="all">Todos los grupos</option>
                {Array.isArray(grupos) && grupos.map((grupo, index) => (
                  <option key={`grupo-${grupo.id || index}`} value={grupo.id}>
                    {grupo.nombre}
                  </option>
                ))}
              </select>
              
              <select
                value={usuarioFilter}
                onChange={(e) => setUsuarioFilter(e.target.value)}
                className="inscripcion-filter-select"
              >
                <option value="all">Todos los tutores</option>
                {Array.isArray(usuarios) && usuarios.map((usuario, index) => (
                  <option key={`usuario-${usuario.id || index}`} value={usuario.id}>
                    {usuario.nombre} {usuario.apellido}
                  </option>
                ))}
              </select>
              
              <select
                value={deportistaFilter}
                onChange={(e) => setDeportistaFilter(e.target.value)}
                className="inscripcion-filter-select"
              >
                <option value="all">Todos los deportistas</option>
                {Array.isArray(deportistas) && deportistas.map((deportista, index) => (
                  <option key={`deportista-${deportista.id || index}`} value={deportista.id}>
                    {deportista.nombre} {deportista.apellido}
                  </option>
                ))}
              </select>
              
              <div className="inscripcion-export-actions">
                <button
                  onClick={exportInscripciones}
                  className="inscripcion-btn-secondary"
                >
                  <Download size={18} />
                  Exportar
                </button>
              </div>
            </div>
          </div>

          {/* CONTENIDO */}
          {loading ? (
            <div className="inscripcion-loading">
              <div className="inscripcion-loading-spinner"></div>
              <p>Cargando inscripciones...</p>
            </div>
          ) : error ? (
            <div className="inscripcion-error">
              <AlertCircle size={48} />
              <h3>Error al cargar inscripciones</h3>
              <p>{error}</p>
              <button onClick={loadInscripciones} className="inscripcion-btn-primary">
                <RefreshCw size={18} />
                Reintentar
              </button>
            </div>
          ) : inscripciones.length === 0 ? (
            <div className="inscripcion-empty-state">
              <BookOpen size={64} />
              <h3>No hay inscripciones</h3>
              <p>
                {searchTerm || estadoFilter !== 'all' || cursoFilter !== 'all' || grupoFilter !== 'all' || usuarioFilter !== 'all' || deportistaFilter !== 'all'
                  ? 'No se encontraron inscripciones con los filtros aplicados'
                  : 'Crea tu primera inscripción para comenzar'}
              </p>
              <button onClick={openCreateModal} className="inscripcion-btn-primary">
                <UserPlus size={18} />
                Nueva Inscripción
              </button>
            </div>
          ) : (
            <>
              {/* TABLA DE INSCRIPCIONES */}
              <div className="inscripcion-table-container">
                <table className="inscripcion-table">
                  <thead>
                    <tr>
                      <th>Deportista</th>
                      <th>Curso</th>
                      <th>Grupo</th>
                      <th>Tutor</th>
                      <th>Fecha Inscripción</th>
                      <th>Estado</th>
                      <th>Calificación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inscripciones.map((inscripcion, index) => {
                      const estadoConfig = getEstadoConfig(inscripcion.estado);
                      const EstadoIcon = estadoConfig.icon;
                      
                      return (
                        <tr key={`inscripcion-${inscripcion.id || index}`} className="inscripcion-table-row">
                          <td>
                            <div className="inscripcion-deportista">
                              <div className="inscripcion-deportista-avatar">
                                <User size={16} />
                              </div>
                              <div>
                                <strong>
                                  {inscripcion.deportista?.nombre_completo || 
                                   `${inscripcion.deportista?.nombre || ''} ${inscripcion.deportista?.apellido || ''}`.trim() || 
                                   'N/A'}
                                </strong>
                                {inscripcion.deportista?.categoria && (
                                  <div className="inscripcion-deportista-categoria">
                                    {inscripcion.deportista.categoria.nombre}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="inscripcion-curso">
                              <BookOpen size={14} />
                              <span>{inscripcion.curso?.nombre || 'N/A'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="inscripcion-grupo">
                              <Users size={14} />
                              <span>{inscripcion.grupo?.nombre || 'N/A'}</span>
                              {inscripcion.grupo && (
                                <div className="inscripcion-grupo-cupo">
                                  {inscripcion.grupo.cupo_actual || 0}/{inscripcion.grupo.cupo_maximo || 0}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="inscripcion-usuario">
                              <User size={14} />
                              <span>{inscripcion.usuario?.nombre || 'N/A'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="inscripcion-fecha">
                              <Calendar size={12} />
                              {formatFecha(inscripcion.fecha_inscripcion)}
                            </div>
                          </td>
                          <td>
                            <div 
                              className="inscripcion-estado"
                              style={{
                                backgroundColor: estadoConfig.bgColor,
                                color: estadoConfig.color
                              }}
                            >
                              <EstadoIcon size={12} />
                              <span>{estadoConfig.label}</span>
                            </div>
                          </td>
                          <td>
                            <div className="inscripcion-calificacion">
                              {inscripcion.calificacion !== null && inscripcion.calificacion !== undefined ? (
                                <div className="inscripcion-calificacion-badge">
                                  <Star size={12} />
                                  <span>{formatCalificacion(inscripcion.calificacion)}</span>
                                </div>
                              ) : (
                                <span className="inscripcion-sin-calificar">Sin calificar</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="inscripcion-actions">
                              <button
                                onClick={() => openDetailModal(inscripcion)}
                                className="inscripcion-action-btn"
                                title="Ver detalles"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => openEditModal(inscripcion)}
                                className="inscripcion-action-btn"
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              {inscripcion.estado === 'activa' && (
                                <button
                                  onClick={() => openCalificarModal(inscripcion)}
                                  className="inscripcion-action-btn"
                                  title="Calificar"
                                >
                                  <Award size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => openDeleteModal(inscripcion)}
                                className="inscripcion-action-btn delete"
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

              {/* PAGINACIÓN */}
              {totalPages > 1 && (
                <div className="inscripcion-pagination">
                  <div className="inscripcion-pagination-info">
                    Mostrando {inscripciones.length} inscripciones
                  </div>
                  <div className="inscripcion-pagination-controls">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="inscripcion-pagination-btn"
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
                          key={`page-${pageNum}`}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`inscripcion-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="inscripcion-pagination-btn"
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

      {/* MODAL CREAR INSCRIPCIÓN */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3 className="modal-title">
                <UserPlus size={20} />
                Nueva Inscripción
              </h3>
              <button onClick={closeCreateModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="modal-form-group">
                  <label className="modal-form-label">Curso *</label>
                  <select
                    value={formData.id_curso}
                    onChange={(e) => {
                      setFormData({...formData, id_curso: e.target.value, id_grupo: ''});
                      filtrarGruposPorCurso(e.target.value);
                    }}
                    className="modal-form-input"
                    required
                  >
                    <option value="">Seleccionar curso...</option>
                    {cursosDisponibles.length > 0 ? (
                      cursosDisponibles.map((curso, index) => (
                        <option key={`curso-disponible-${curso.id || index}`} value={curso.id}>
                          {curso.nombre} ({curso.grupos?.length || 0} grupos disponibles)
                        </option>
                      ))
                    ) : (
                      Array.isArray(cursos) && cursos.map((curso, index) => (
                        <option key={`curso-option-${curso.id || index}`} value={curso.id}>
                          {curso.nombre}
                        </option>
                      ))
                    )}
                  </select>
                  {errors.id_curso && (
                    <div className="form-error">{errors.id_curso[0]}</div>
                  )}
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Grupo *</label>
                  <select
                    value={formData.id_grupo}
                    onChange={(e) => setFormData({...formData, id_grupo: e.target.value})}
                    className="modal-form-input"
                    required
                    disabled={!formData.id_curso || gruposFiltrados.length === 0}
                  >
                    <option value="">Seleccionar grupo...</option>
                    {Array.isArray(gruposFiltrados) && gruposFiltrados.map((grupo, index) => {
                      const tieneCupo = (grupo.cupo_actual || 0) < (grupo.cupo_maximo || 0);
                      return (
                        <option 
                          key={`grupo-filtrado-${grupo.id || index}`} 
                          value={grupo.id}
                          disabled={!tieneCupo}
                        >
                          {grupo.nombre} - {grupo.horario || 'Sin horario'} ({grupo.cupo_actual || 0}/{grupo.cupo_maximo || 0})
                          {!tieneCupo && ' - SIN CUPO'}
                        </option>
                      );
                    })}
                  </select>
                  {errors.id_grupo && (
                    <div className="form-error">{errors.id_grupo[0]}</div>
                  )}
                  {formData.id_curso && gruposFiltrados.length === 0 && (
                    <div className="form-error">No hay grupos disponibles para este curso</div>
                  )}
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Tutor *</label>
                  <select
                    value={formData.id_usuario}
                    onChange={(e) => setFormData({...formData, id_usuario: e.target.value})}
                    className="modal-form-input"
                    required
                  >
                    <option value="">Seleccionar tutor...</option>
                    {Array.isArray(usuarios) && usuarios.map((usuario, index) => (
                      <option key={`usuario-option-${usuario.id || index}`} value={usuario.id}>
                        {usuario.nombre} {usuario.apellido} - {usuario.email || 'Sin email'}
                      </option>
                    ))}
                  </select>
                  {errors.id_usuario && (
                    <div className="form-error">{errors.id_usuario[0]}</div>
                  )}
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Deportista *</label>
                  <select
                    value={formData.id_deportista}
                    onChange={(e) => setFormData({...formData, id_deportista: e.target.value})}
                    className="modal-form-input"
                    required
                  >
                    <option value="">Seleccionar deportista...</option>
                    {Array.isArray(deportistas) && deportistas.map((deportista, index) => (
                      <option key={`deportista-option-${deportista.id || index}`} value={deportista.id}>
                        {deportista.nombre} {deportista.apellido} - {deportista.categoria?.nombre || 'Sin categoría'}
                      </option>
                    ))}
                  </select>
                  {errors.id_deportista && (
                    <div className="form-error">{errors.id_deportista[0]}</div>
                  )}
                </div>

                <div className="modal-form-group full-width">
                  <label className="modal-form-label">Observaciones</label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    className="modal-form-input"
                    rows="3"
                    placeholder="Observaciones adicionales..."
                  />
                  {errors.observaciones && (
                    <div className="form-error">{errors.observaciones[0]}</div>
                  )}
                </div>

                {/* Información del grupo seleccionado */}
                {formData.id_grupo && gruposFiltrados.find(g => g.id == formData.id_grupo) && (
                  <div className="modal-form-group full-width">
                    <div className="form-info-card">
                      <h4>Información del Grupo Seleccionado</h4>
                      <div className="form-info-grid">
                        <div className="form-info-item">
                          <label>Nombre:</label>
                          <span>{gruposFiltrados.find(g => g.id == formData.id_grupo)?.nombre}</span>
                        </div>
                        <div className="form-info-item">
                          <label>Horario:</label>
                          <span>{gruposFiltrados.find(g => g.id == formData.id_grupo)?.horario || 'No especificado'}</span>
                        </div>
                        <div className="form-info-item">
                          <label>Cupos:</label>
                          <span>{gruposFiltrados.find(g => g.id == formData.id_grupo)?.cupo_actual || 0}/
                                {gruposFiltrados.find(g => g.id == formData.id_grupo)?.cupo_maximo || 0}</span>
                        </div>
                        <div className="form-info-item">
                          <label>Instructor:</label>
                          <span>{gruposFiltrados.find(g => g.id == formData.id_grupo)?.instructor?.nombre || 'No asignado'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={closeCreateModal}
                className="modal-btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={createInscripcion}
                className="modal-btn-primary"
                disabled={!formData.id_curso || !formData.id_grupo || !formData.id_usuario || !formData.id_deportista}
              >
                <UserPlus size={18} />
                Crear Inscripción
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR INSCRIPCIÓN */}
      {showEditModal && selectedInscripcion && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <Edit2 size={20} />
                Editar Inscripción
              </h3>
              <button onClick={closeEditModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-container">
                <div className="detail-header">
                  <div className="detail-info">
                    <h4 className="detail-title">
                      {selectedInscripcion.deportista?.nombre_completo || selectedInscripcion.deportista?.nombre} - {selectedInscripcion.curso?.nombre}
                    </h4>
                    <div className="detail-meta">
                      <span className="detail-grupo">
                        <Users size={14} />
                        {selectedInscripcion.grupo?.nombre}
                      </span>
                      <span className="detail-fecha">
                        <Calendar size={14} />
                        {formatFecha(selectedInscripcion.fecha_inscripcion)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-form-grid">
                  <div className="modal-form-group">
                    <label className="modal-form-label">Estado</label>
                    <select
                      value={editFormData.estado}
                      onChange={(e) => setEditFormData({...editFormData, estado: e.target.value})}
                      className="modal-form-input"
                    >
                      {estados.map((estado, index) => (
                        <option key={`estado-edit-${index}`} value={estado.value}>
                          {estado.label}
                        </option>
                      ))}
                    </select>
                    {editErrors.estado && (
                      <div className="form-error">{editErrors.estado[0]}</div>
                    )}
                  </div>

                  <div className="modal-form-group full-width">
                    <label className="modal-form-label">Observaciones</label>
                    <textarea
                      value={editFormData.observaciones}
                      onChange={(e) => setEditFormData({...editFormData, observaciones: e.target.value})}
                      className="modal-form-input"
                      rows="3"
                      placeholder="Observaciones adicionales..."
                    />
                    {editErrors.observaciones && (
                      <div className="form-error">{editErrors.observaciones[0]}</div>
                    )}
                  </div>

                  <div className="modal-form-group full-width">
                    <div className="form-info">
                      <Info size={16} />
                      <div>
                        <p>Cambiar el estado a "Cancelada" o "Abandonada" liberará un cupo en el grupo.</p>
                        {selectedInscripcion.estado === 'activa' && editFormData.estado !== 'activa' && (
                          <p className="form-warning">
                            <AlertCircle size={14} />
                            Esta acción liberará un cupo en el grupo {selectedInscripcion.grupo?.nombre}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={closeEditModal}
                className="modal-btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={updateInscripcion}
                className="modal-btn-primary"
              >
                <Save size={18} />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CALIFICAR INSCRIPCIÓN */}
      {showCalificarModal && selectedInscripcion && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <Award size={20} />
                Calificar Inscripción
              </h3>
              <button onClick={closeCalificarModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-container">
                <div className="detail-header">
                  <div className="detail-info">
                    <h4 className="detail-title">
                      {selectedInscripcion.deportista?.nombre_completo || selectedInscripcion.deportista?.nombre}
                    </h4>
                    <div className="detail-meta">
                      <span className="detail-curso">
                        <BookOpen size={14} />
                        {selectedInscripcion.curso?.nombre}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-form-grid">
                  <div className="modal-form-group">
                    <label className="modal-form-label">Calificación (0-10) *</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={calificarFormData.calificacion}
                      onChange={(e) => setCalificarFormData({...calificarFormData, calificacion: e.target.value})}
                      className="modal-form-input"
                      placeholder="Ej: 8.5"
                    />
                    {calificarErrors.calificacion && (
                      <div className="form-error">{calificarErrors.calificacion[0]}</div>
                    )}
                  </div>

                  <div className="modal-form-group full-width">
                    <label className="modal-form-label">Comentarios</label>
                    <textarea
                      value={calificarFormData.comentarios}
                      onChange={(e) => setCalificarFormData({...calificarFormData, comentarios: e.target.value})}
                      className="modal-form-input"
                      rows="4"
                      placeholder="Comentarios sobre el desempeño..."
                    />
                    {calificarErrors.comentarios && (
                      <div className="form-error">{calificarErrors.comentarios[0]}</div>
                    )}
                  </div>

                  <div className="modal-form-group full-width">
                    <div className="form-info">
                      <Info size={16} />
                      <div>
                        <p>Al calificar, el estado cambiará automáticamente a "Completada".</p>
                        <p>La calificación debe ser un número entre 0 y 10.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={closeCalificarModal}
                className="modal-btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={calificarInscripcion}
                className="modal-btn-primary"
                disabled={!calificarFormData.calificacion}
              >
                <Award size={18} />
                Registrar Calificación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLES */}
      {showDetailModal && selectedInscripcion && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <Eye size={20} />
                Detalles de Inscripción
              </h3>
              <button onClick={closeDetailModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-container">
                <div className="detail-header">
                  <div className="detail-icon" style={{
                    backgroundColor: getEstadoConfig(selectedInscripcion.estado).bgColor,
                    color: getEstadoConfig(selectedInscripcion.estado).color
                  }}>
                    {(() => {
                      const EstadoIcon = getEstadoConfig(selectedInscripcion.estado).icon;
                      return <EstadoIcon size={24} />;
                    })()}
                  </div>
                  <div className="detail-title">
                    <h4>Inscripción #{selectedInscripcion.id}</h4>
                    <div className="detail-tags">
                      <span className="detail-tag estado" style={{
                        backgroundColor: getEstadoConfig(selectedInscripcion.estado).bgColor,
                        color: getEstadoConfig(selectedInscripcion.estado).color
                      }}>
                        {getEstadoConfig(selectedInscripcion.estado).label}
                      </span>
                      {selectedInscripcion.calificacion !== null && selectedInscripcion.calificacion !== undefined && (
                        <span className="detail-tag calificacion">
                          <Star size={12} />
                          {formatCalificacion(selectedInscripcion.calificacion)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Deportista:</label>
                    <div className="detail-value-with-avatar">
                      <div className="detail-avatar">
                        <User size={16} />
                      </div>
                      <div>
                        <strong>
                          {selectedInscripcion.deportista?.nombre_completo || 
                           `${selectedInscripcion.deportista?.nombre || ''} ${selectedInscripcion.deportista?.apellido || ''}`.trim() || 
                           'N/A'}
                        </strong>
                        {selectedInscripcion.deportista?.categoria && (
                          <div className="detail-subtext">
                            {selectedInscripcion.deportista.categoria.nombre}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <label>Curso:</label>
                    <div className="detail-value-with-icon">
                      <BookOpen size={16} />
                      <span>{selectedInscripcion.curso?.nombre || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <label>Grupo:</label>
                    <div className="detail-value-with-icon">
                      <Users size={16} />
                      <span>{selectedInscripcion.grupo?.nombre || 'N/A'}</span>
                      {selectedInscripcion.grupo && (
                        <div className="detail-subtext">
                          {selectedInscripcion.grupo.horario || 'Sin horario'} • Cupo: {selectedInscripcion.grupo.cupo_actual || 0}/{selectedInscripcion.grupo.cupo_maximo || 0}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="detail-item">
                    <label>Tutor:</label>
                    <div className="detail-value-with-icon">
                      <User size={16} />
                      <span>{selectedInscripcion.usuario?.nombre || 'N/A'}</span>
                      {selectedInscripcion.usuario?.email && (
                        <div className="detail-subtext">
                          {selectedInscripcion.usuario.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="detail-item">
                    <label>Fecha Inscripción:</label>
                    <div className="detail-value-with-icon">
                      <Calendar size={16} />
                      <span>{formatFecha(selectedInscripcion.fecha_inscripcion)}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <label>Estado:</label>
                    <span className="detail-estado" style={{
                      backgroundColor: getEstadoConfig(selectedInscripcion.estado).bgColor,
                      color: getEstadoConfig(selectedInscripcion.estado).color
                    }}>
                      {getEstadoConfig(selectedInscripcion.estado).label}
                    </span>
                  </div>
                </div>

                {selectedInscripcion.calificacion !== null && selectedInscripcion.calificacion !== undefined && (
                  <div className="detail-section">
                    <label>Calificación:</label>
                    <div className="detail-calificacion-box">
                      <div className="detail-calificacion-stars">
                        {[...Array(10)].map((_, i) => (
                          <Star 
                            key={`star-${i}`}
                            size={20} 
                            fill={i < Math.floor(selectedInscripcion.calificacion) ? "#f59e0b" : "#e5e7eb"} 
                            color={i < Math.floor(selectedInscripcion.calificacion) ? "#f59e0b" : "#e5e7eb"}
                          />
                        ))}
                      </div>
                      <div className="detail-calificacion-text">
                        <strong>{formatCalificacion(selectedInscripcion.calificacion)}</strong>
                        {selectedInscripcion.comentarios && (
                          <div className="detail-comentarios">
                            {selectedInscripcion.comentarios}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedInscripcion.observaciones && (
                  <div className="detail-section">
                    <label>Observaciones:</label>
                    <p className="detail-description">{selectedInscripcion.observaciones}</p>
                  </div>
                )}

                <div className="detail-actions">
                  <button
                    onClick={() => {
                      closeDetailModal();
                      openEditModal(selectedInscripcion);
                    }}
                    className="detail-action-btn"
                  >
                    <Edit2 size={18} />
                    Editar
                  </button>
                  {selectedInscripcion.estado === 'activa' && (
                    <button
                      onClick={() => {
                        closeDetailModal();
                        openCalificarModal(selectedInscripcion);
                      }}
                      className="detail-action-btn"
                    >
                      <Award size={18} />
                      Calificar
                    </button>
                  )}
                  <button
                    onClick={() => {
                      closeDetailModal();
                      openDeleteModal(selectedInscripcion);
                    }}
                    className="detail-action-btn delete"
                  >
                    <Trash2 size={18} />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {showDeleteModal && selectedInscripcion && (
        <div className="modal-overlay">
          <div className="modal-content small">
            <div className="modal-header">
              <h3 className="modal-title">
                <Trash2 size={20} />
                Confirmar Eliminación
              </h3>
              <button onClick={closeDeleteModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-confirmation">
                <div className="delete-icon">
                  <AlertCircle size={48} />
                </div>
                <h4>¿Estás seguro de eliminar esta inscripción?</h4>
                <p>
                  Se eliminará permanentemente la inscripción de <strong>
                    {selectedInscripcion.deportista?.nombre_completo || selectedInscripcion.deportista?.nombre}
                  </strong> al curso <strong>{selectedInscripcion.curso?.nombre}</strong>
                </p>
                <div className="delete-info">
                  <div className="delete-info-item">
                    <BookOpen size={14} />
                    <span>{selectedInscripcion.curso?.nombre}</span>
                  </div>
                  <div className="delete-info-item">
                    <Users size={14} />
                    <span>{selectedInscripcion.grupo?.nombre}</span>
                  </div>
                  <div className="delete-info-item">
                    {(() => {
                      const EstadoIcon = getEstadoConfig(selectedInscripcion.estado).icon;
                      return <EstadoIcon size={14} />;
                    })()}
                    <span>{getEstadoConfig(selectedInscripcion.estado).label}</span>
                  </div>
                </div>
                {selectedInscripcion.estado === 'activa' && (
                  <div className="delete-warning">
                    <AlertCircle size={16} />
                    <div>
                      <strong>¡Atención!</strong> Esta inscripción está activa. Al eliminarla se liberará un cupo en el grupo.
                    </div>
                  </div>
                )}
                <p className="delete-warning-final">
                  <AlertCircle size={16} />
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={closeDeleteModal}
                className="modal-btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={deleteInscripcion}
                className="modal-btn-danger"
              >
                <Trash2 size={18} />
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InscripcionCurso;