import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, Edit2, Trash2, X, Search, RefreshCw, Eye, Calendar,
  ChevronLeft, ChevronRight, AlertTriangle, Save, Clock,
  Users, Award, Target, Flag, MapPin, Trophy, Filter,
  Star, TrendingUp, BarChart, Users as TeamIcon, CheckCircle,
  XCircle, Upload, Download, Printer, Share2, Hash,
  Settings, EyeOff, Eye as EyeOn, Lock, Unlock, List,
  Grid, Table, PieChart, DollarSign, Shield, Activity,
  Play, Pause, StopCircle, Award as Cup, Target as TargetIcon,
  CalendarDays, Timer, Zap, 
  TrendingDown, Award as Medal, Crown, ChartBar, Users as GroupIcon
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/partido.css';

const API_PARTIDOS = 'http://127.0.0.1:8000/api/partidos';
const API_CAMPEONATOS = 'http://127.0.0.1:8000/api/campeonatos';
const API_CLUBES = 'http://127.0.0.1:8000/api/clubes';
const API_ESCENARIOS = 'http://127.0.0.1:8000/api/escenarios';

const authHeaders = (isFormData = false) => {
  const token = localStorage.getItem('token');
  console.log('Token obtenido:', token ? 'Sí' : 'No');
  
  if (!token) {
    window.location.href = '/login';
    return {};
  }
  
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

const Partido = () => {
  // Estados principales
  const [partidos, setPartidos] = useState([]);
  const [campeonatos, setCampeonatos] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [escenarios, setEscenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modales
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  const [showProximosModal, setShowProximosModal] = useState(false);
  
  const [mode, setMode] = useState('create');
  const [selectedPartido, setSelectedPartido] = useState(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [campeonatoFilter, setCampeonatoFilter] = useState('all');
  const [fechaFilter, setFechaFilter] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar', 'grid'
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Formulario
  const [form, setForm] = useState({
    id_campeonato: '',
    id_escenario: '',
    club_local_id: '',
    club_visitante_id: '',
    fecha: '',
    hora: '',
    arbitro: '',
    observaciones: '',
    estado: 'programado'
  });
  
  // Formulario finalizar
  const [formFinalizar, setFormFinalizar] = useState({
    goles_local: 0,
    goles_visitante: 0
  });
  
  const [errors, setErrors] = useState({});
  
  // Datos adicionales
  const [partidoDetalle, setPartidoDetalle] = useState(null);
  const [proximosPartidos, setProximosPartidos] = useState([]);

  // Normalizar datos - función auxiliar
  const normalizarPartido = (partido) => {
    return {
      ...partido,
      // Asegurar que tenemos ambos id e id_partido
      id: partido.id || partido.id_partido,
      id_partido: partido.id_partido || partido.id,
      // Normalizar IDs de clubes
      club_local_id: partido.club_local_id || partido.id_club_local,
      club_visitante_id: partido.club_visitante_id || partido.id_club_visitante,
      // Normalizar IDs de relaciones
      id_campeonato: partido.id_campeonato || partido.campeonato?.id_campeonato,
      id_escenario: partido.id_escenario || partido.escenario?.id_escenario
    };
  };
  
  // Estados disponibles
  const estados = [
    { value: 'programado', label: 'Programado', color: '#3b82f6', icon: Calendar },
    { value: 'en_curso', label: 'En Curso', color: '#10b981', icon: Play },
    { value: 'finalizado', label: 'Finalizado', color: '#8b5cf6', icon: StopCircle },
    { value: 'suspendido', label: 'Suspendido', color: '#f59e0b', icon: Pause },
    { value: 'cancelado', label: 'Cancelado', color: '#ef4444', icon: XCircle }
  ];

  // Cargar datos iniciales
  useEffect(() => {
    console.log('useEffect inicial - Cargando datos');
    loadPartidos();
    loadCampeonatos();
    loadClubes();
    loadEscenarios();
  }, []);

  // Cargar partidos
  const loadPartidos = async () => {
    console.log('====== loadPartidos INICIO ======');
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        estado: estadoFilter !== 'all' ? estadoFilter : '',
        id_campeonato: campeonatoFilter !== 'all' ? campeonatoFilter : '',
        fecha: fechaFilter,
        search: searchTerm
      });

      const url = `${API_PARTIDOS}?${queryParams}`;
      console.log('URL partidos:', url);
      
      const response = await fetch(url, {
        headers: authHeaders()
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 Datos recibidos de partidos:', data);
      console.log('Estructura de datos:', {
        tieneData: 'data' in data,
        dataEsArray: Array.isArray(data.data),
        dataLength: Array.isArray(data.data) ? data.data.length : 'no es array'
      });
      
      let partidosData = [];
      
      if (data.data && Array.isArray(data.data)) {
        console.log('Formato paginado encontrado');
        // Normalizar datos
        partidosData = data.data.map(normalizarPartido);
        setTotalPages(data.last_page || 1);
      } else if (Array.isArray(data)) {
        console.log('Formato array directo');
        partidosData = data.map(normalizarPartido);
        setTotalPages(Math.ceil(data.length / itemsPerPage));
      } else {
        console.error('Formato de datos desconocido:', data);
        setTotalPages(1);
      }
      
      console.log('Partidos normalizados:', partidosData);
      console.log('Primer partido normalizado:', partidosData[0]);
      
      setPartidos(partidosData);
      
    } catch (err) {
      console.error('❌ Error en loadPartidos:', err);
      setError(err.message);
    } finally {
      console.log('====== loadPartidos FIN ======');
      setLoading(false);
    }
  };

  // Cargar campeonatos
  const loadCampeonatos = async () => {
    console.log('loadCampeonatos ejecutado');
    
    try {
      const response = await fetch(API_CAMPEONATOS, {
        headers: authHeaders()
      });
      
      console.log('Response campeonatos:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Datos campeonatos:', data);
        
        let campeonatosData = [];
        
        if (data.data && Array.isArray(data.data)) {
          campeonatosData = data.data.map(c => ({
            ...c,
            id: c.id_campeonato || c.id,
            id_campeonato: c.id_campeonato || c.id
          }));
        } else if (Array.isArray(data)) {
          campeonatosData = data.map(c => ({
            ...c,
            id: c.id_campeonato || c.id,
            id_campeonato: c.id_campeonato || c.id
          }));
        }
        
        console.log('Campeonatos normalizados:', campeonatosData);
        setCampeonatos(campeonatosData);
      }
    } catch (error) {
      console.error('Error en loadCampeonatos:', error);
    }
  };

  // Cargar clubes
  const loadClubes = async () => {
    console.log('loadClubes ejecutado');
    
    try {
      const response = await fetch(API_CLUBES, {
        headers: authHeaders()
      });
      
      console.log('Response clubes:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Datos clubes:', data);
        
        let clubesData = [];
        
        if (data.data && Array.isArray(data.data)) {
          clubesData = data.data.map(c => ({
            ...c,
            id: c.id_club || c.id,
            id_club: c.id_club || c.id
          }));
        } else if (Array.isArray(data)) {
          clubesData = data.map(c => ({
            ...c,
            id: c.id_club || c.id,
            id_club: c.id_club || c.id
          }));
        }
        
        console.log('Clubes normalizados:', clubesData);
        setClubes(clubesData);
      }
    } catch (error) {
      console.error('Error en loadClubes:', error);
    }
  };

  // Cargar escenarios
  const loadEscenarios = async () => {
    console.log('loadEscenarios ejecutado');
    
    try {
      const response = await fetch(API_ESCENARIOS, {
        headers: authHeaders()
      });
      
      console.log('Response escenarios:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Datos escenarios:', data);
        
        let escenariosData = [];
        
        if (data.data && Array.isArray(data.data)) {
          escenariosData = data.data.map(e => ({
            ...e,
            id: e.id_escenario || e.id,
            id_escenario: e.id_escenario || e.id
          }));
        } else if (Array.isArray(data)) {
          escenariosData = data.map(e => ({
            ...e,
            id: e.id_escenario || e.id,
            id_escenario: e.id_escenario || e.id
          }));
        }
        
        console.log('Escenarios normalizados:', escenariosData);
        setEscenarios(escenariosData);
      }
    } catch (error) {
      console.error('Error en loadEscenarios:', error);
    }
  };

  // Cargar detalles del partido
  const loadPartidoDetalle = async (id) => {
    console.log('loadPartidoDetalle para ID:', id);
    
    try {
      const response = await fetch(`${API_PARTIDOS}/${id}`, {
        headers: authHeaders()
      });
      
      console.log('Response detalle:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Detalle del partido:', data);
        const partidoNormalizado = normalizarPartido(data);
        setPartidoDetalle(partidoNormalizado);
        setShowDetailModal(true);
      } else {
        console.error('Error cargando detalle:', response.statusText);
      }
    } catch (error) {
      console.error('Error en loadPartidoDetalle:', error);
    }
  };

  // Cargar próximos partidos
  const loadProximosPartidos = async () => {
    console.log('loadProximosPartidos ejecutado');
    
    try {
      const response = await fetch(`${API_PARTIDOS}/proximos-partidos?cantidad=10`, {
        headers: authHeaders()
      });
      
      console.log('Response próximos partidos:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Próximos partidos:', data);
        
        const partidosNormalizados = Array.isArray(data) 
          ? data.map(normalizarPartido)
          : [];
        
        setProximosPartidos(partidosNormalizados);
        setShowProximosModal(true);
      }
    } catch (error) {
      console.error('Error en loadProximosPartidos:', error);
    }
  };

  // Aplicar filtros
  const applyFilters = () => {
    console.log('Aplicando filtros');
    setCurrentPage(1);
    loadPartidos();
  };

  // Resetear filtros
  const resetFilters = () => {
    console.log('Reseteando filtros');
    setSearchTerm('');
    setEstadoFilter('all');
    setCampeonatoFilter('all');
    setFechaFilter('');
    setCurrentPage(1);
    loadPartidos();
  };

  // Validar formulario
  const validateForm = () => {
    console.log('Validando formulario');
    const newErrors = {};
    
    if (!form.club_local_id) newErrors.club_local_id = 'El club local es requerido';
    if (!form.club_visitante_id) newErrors.club_visitante_id = 'El club visitante es requerido';
    if (form.club_local_id === form.club_visitante_id) {
      newErrors.club_visitante_id = 'El club visitante debe ser diferente al local';
    }
    if (!form.fecha) newErrors.fecha = 'La fecha es requerida';
    if (!form.hora) newErrors.hora = 'La hora es requerida';
    
    console.log('Errores de validación:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // CRUD Operations
  const createPartido = async () => {
    console.log('createPartido ejecutado');
    if (!validateForm()) return;
    
    try {
      console.log('Enviando datos:', form);
      
      const response = await fetch(API_PARTIDOS, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form)
      });
      
      console.log('Response crear:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Partido creado:', data);
        alert('✅ Partido creado exitosamente');
        closeModal();
        loadPartidos();
      } else {
        const errorData = await response.json();
        console.error('Error al crear:', errorData);
        alert(`❌ ${errorData.message || 'Error al crear partido'}`);
      }
    } catch (error) {
      console.error('Error en createPartido:', error);
      alert('❌ Error de conexión');
    }
  };

  const updatePartido = async () => {
    console.log('updatePartido ejecutado');
    if (!validateForm() || !selectedPartido) return;
    
    const partidoId = selectedPartido.id || selectedPartido.id_partido;
    console.log('Actualizando partido ID:', partidoId);
    
    try {
      const response = await fetch(`${API_PARTIDOS}/${partidoId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(form)
      });
      
      console.log('Response actualizar:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Partido actualizado:', data);
        alert('✅ Partido actualizado exitosamente');
        closeModal();
        loadPartidos();
      } else {
        const errorData = await response.json();
        console.error('Error al actualizar:', errorData);
        alert(`❌ ${errorData.message || 'Error al actualizar partido'}`);
      }
    } catch (error) {
      console.error('Error en updatePartido:', error);
      alert('❌ Error de conexión');
    }
  };

  const deletePartido = async () => {
    console.log('deletePartido ejecutado');
    if (!selectedPartido) return;
    
    const partidoId = selectedPartido.id || selectedPartido.id_partido;
    console.log('Eliminando partido ID:', partidoId);
    
    try {
      const response = await fetch(`${API_PARTIDOS}/${partidoId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      console.log('Response eliminar:', response.status);
      
      if (response.ok) {
        console.log('Partido eliminado');
        alert('✅ Partido eliminado exitosamente');
        closeDeleteModal();
        loadPartidos();
      } else {
        const errorData = await response.json();
        console.error('Error al eliminar:', errorData);
        alert(`❌ ${errorData.message || 'Error al eliminar partido'}`);
      }
    } catch (error) {
      console.error('Error en deletePartido:', error);
      alert('❌ Error de conexión');
    }
  };

  const finalizarPartido = async () => {
    console.log('finalizarPartido ejecutado');
    if (!selectedPartido || !formFinalizar) return;
    
    const partidoId = selectedPartido.id || selectedPartido.id_partido;
    console.log('Finalizando partido ID:', partidoId);
    
    try {
      const response = await fetch(`${API_PARTIDOS}/${partidoId}/finalizar`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(formFinalizar)
      });
      
      console.log('Response finalizar:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Partido finalizado:', data);
        alert('✅ Partido finalizado exitosamente');
        closeFinalizarModal();
        loadPartidos();
      } else {
        const errorData = await response.json();
        console.error('Error al finalizar:', errorData);
        alert(`❌ ${errorData.message || 'Error al finalizar partido'}`);
      }
    } catch (error) {
      console.error('Error en finalizarPartido:', error);
      alert('❌ Error de conexión');
    }
  };

  // Modal functions
  const openCreateModal = () => {
    console.log('openCreateModal ejecutado');
    setMode('create');
    setForm({
      id_campeonato: '',
      id_escenario: '',
      club_local_id: '',
      club_visitante_id: '',
      fecha: new Date().toISOString().split('T')[0],
      hora: '15:00',
      arbitro: '',
      observaciones: '',
      estado: 'programado'
    });
    setErrors({});
    setSelectedPartido(null);
    setShowModal(true);
  };

  const openEditModal = (partido) => {
    console.log('openEditModal ejecutado:', partido);
    
    if (partido.estado === 'finalizado') {
      alert('⚠️ No se puede editar un partido finalizado');
      return;
    }
    
    setMode('edit');
    setSelectedPartido(partido);
    setForm({
      id_campeonato: partido.id_campeonato || '',
      id_escenario: partido.id_escenario || '',
      club_local_id: partido.club_local_id || '',
      club_visitante_id: partido.club_visitante_id || '',
      fecha: partido.fecha ? partido.fecha.split('T')[0] : '',
      hora: partido.hora || '15:00',
      arbitro: partido.arbitro || '',
      observaciones: partido.observaciones || '',
      estado: partido.estado || 'programado'
    });
    setErrors({});
    setShowModal(true);
  };

  const openFinalizarModal = (partido) => {
    console.log('openFinalizarModal ejecutado:', partido);
    
    if (partido.estado === 'finalizado') {
      alert('⚠️ Este partido ya está finalizado');
      return;
    }
    
    setSelectedPartido(partido);
    setFormFinalizar({
      goles_local: partido.goles_local || 0,
      goles_visitante: partido.goles_visitante || 0
    });
    setShowFinalizarModal(true);
  };

  const openDeleteModal = (partido) => {
    console.log('openDeleteModal ejecutado:', partido);
    
    if (partido.estado === 'finalizado') {
      alert('⚠️ No se puede eliminar un partido finalizado');
      return;
    }
    
    setSelectedPartido(partido);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    console.log('closeModal ejecutado');
    setShowModal(false);
    setSelectedPartido(null);
    setErrors({});
  };

  const closeDetailModal = () => {
    console.log('closeDetailModal ejecutado');
    setShowDetailModal(false);
    setPartidoDetalle(null);
  };

  const closeDeleteModal = () => {
    console.log('closeDeleteModal ejecutado');
    setShowDeleteModal(false);
    setSelectedPartido(null);
  };

  const closeFinalizarModal = () => {
    console.log('closeFinalizarModal ejecutado');
    setShowFinalizarModal(false);
    setSelectedPartido(null);
    setFormFinalizar({ goles_local: 0, goles_visitante: 0 });
  };

  const closeEstadisticasModal = () => {
    console.log('closeEstadisticasModal ejecutado');
    setShowEstadisticasModal(false);
  };

  const closeProximosModal = () => {
    console.log('closeProximosModal ejecutado');
    setShowProximosModal(false);
    setProximosPartidos([]);
  };

  // Helper functions
  const getEstadoColor = (estado) => {
    const estadoObj = estados.find(e => e.value === estado);
    return estadoObj ? estadoObj.color : '#6b7280';
  };

  const getEstadoLabel = (estado) => {
    const estadoObj = estados.find(e => e.value === estado);
    return estadoObj ? estadoObj.label : estado;
  };

  const getEstadoIcon = (estado) => {
    const estadoObj = estados.find(e => e.value === estado);
    return estadoObj ? estadoObj.icon : Calendar;
  };

  const formatFechaHora = (fecha, hora) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const formattedDate = date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
    
    if (hora) {
      return `${formattedDate} · ${hora}`;
    }
    return formattedDate;
  };

  const getResultado = (partido) => {
    if (partido.estado !== 'finalizado') return null;
    
    if (partido.goles_local > partido.goles_visitante) {
      return { ganador: 'local', resultado: `${partido.goles_local} - ${partido.goles_visitante}` };
    } else if (partido.goles_local < partido.goles_visitante) {
      return { ganador: 'visitante', resultado: `${partido.goles_local} - ${partido.goles_visitante}` };
    } else {
      return { ganador: 'empate', resultado: `${partido.goles_local} - ${partido.goles_visitante}` };
    }
  };

  const getClubNombre = (clubId) => {
    const club = clubes.find(c => {
      // Buscar por diferentes posibles propiedades
      return c.id_club === clubId || 
             c.id === clubId || 
             (clubId && c.id_club && c.id_club.toString() === clubId.toString());
    });
    
    console.log('Buscando club ID:', clubId, 'Encontrado:', club);
    return club ? club.nombre : `Club ${clubId}`;
  };

  // Estadísticas
  const stats = useMemo(() => {
    console.log('Calculando estadísticas con partidos:', partidos);
    
    const total = partidos.length;
    const programados = partidos.filter(p => p.estado === 'programado').length;
    const enCurso = partidos.filter(p => p.estado === 'en_curso').length;
    const finalizados = partidos.filter(p => p.estado === 'finalizado').length;
    const suspendidos = partidos.filter(p => p.estado === 'suspendido').length;
    const cancelados = partidos.filter(p => p.estado === 'cancelado').length;
    
    // Goles totales
    const golesTotales = partidos.reduce((total, partido) => {
      return total + (partido.goles_local || 0) + (partido.goles_visitante || 0);
    }, 0);
    
    // Partidos hoy
    const hoy = new Date().toISOString().split('T')[0];
    const partidosHoy = partidos.filter(p => p.fecha && p.fecha.split('T')[0] === hoy).length;
    
    const statsResult = { 
      total, 
      programados, 
      enCurso, 
      finalizados, 
      suspendidos, 
      cancelados,
      golesTotales,
      partidosHoy
    };
    
    console.log('Estadísticas calculadas:', statsResult);
    return statsResult;
  }, [partidos]);

  // Agregar useEffect para depurar cambios
  useEffect(() => {
    console.log('🔄 ESTADO partidos CAMBIÓ:', {
      length: partidos.length,
      datos: partidos.map(p => ({ 
        id: p.id,
        id_partido: p.id_partido,
        nombreLocal: getClubNombre(p.club_local_id),
        nombreVisitante: getClubNombre(p.club_visitante_id)
      }))
    });
  }, [partidos]);

  useEffect(() => {
    console.log('🔄 ESTADO loading CAMBIÓ:', loading);
  }, [loading]);

  useEffect(() => {
    console.log('🔄 ESTADO error CAMBIÓ:', error);
  }, [error]);

  console.log('Render - Estado actual:', {
    loading,
    error,
    partidosLength: partidos.length,
    partidos: partidos,
    stats
  });

  return (
    <div className="partido-container">
      <Sidebar />
      
      <div className="partido-content">
        <Topbar />
        
        <div className="partido-main">
          {/* HEADER */}
          <div className="partido-header">
            <div>
              <h1 className="partido-title">
                <Award size={28} />
                Gestión de Partidos
              </h1>
              <p className="partido-subtitle">
                Administra los encuentros y resultados deportivos
              </p>
            </div>
            <div className="partido-header-actions">
              <button 
                onClick={loadProximosPartidos}
                className="partido-btn-secondary"
              >
                <Calendar size={20} />
                Próximos Partidos
              </button>
              <button 
                onClick={openCreateModal}
                className="partido-btn-primary"
              >
                <Plus size={20} />
                Nuevo Partido
              </button>
            </div>
          </div>

          {/* ESTADÍSTICAS */}
          <div className="partido-stats-grid">
            <div className="partido-stat-card">
              <div className="partido-stat-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                <Award size={24} />
              </div>
              <div>
                <h3 className="partido-stat-number">{stats.total}</h3>
                <p className="partido-stat-label">Total Partidos</p>
              </div>
            </div>
            <div className="partido-stat-card">
              <div className="partido-stat-icon" style={{background: '#dcfce7', color: '#10b981'}}>
                <Play size={24} />
              </div>
              <div>
                <h3 className="partido-stat-number">{stats.enCurso}</h3>
                <p className="partido-stat-label">En Curso</p>
              </div>
            </div>
            <div className="partido-stat-card">
              <div className="partido-stat-icon" style={{background: '#ede9fe', color: '#8b5cf6'}}>
                <StopCircle size={24} />
              </div>
              <div>
                <h3 className="partido-stat-number">{stats.finalizados}</h3>
                <p className="partido-stat-label">Finalizados</p>
              </div>
            </div>
            <div className="partido-stat-card">
              <div className="partido-stat-icon" style={{background: '#fef3c7', color: '#f59e0b'}}>
                <Target size={24} />
              </div>
              <div>
                <h3 className="partido-stat-number">{stats.golesTotales}</h3>
                <p className="partido-stat-label">Goles Totales</p>
              </div>
            </div>
          </div>

          {/* FILTROS */}
          <div className="partido-filters">
            <div className="partido-filters-row">
              <div className="partido-search-container">
                <Search className="partido-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por clubes o árbitro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  className="partido-search-input"
                />
              </div>
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="partido-filter-select"
              >
                <option value="all">Todos los estados</option>
                {estados.map(estado => (
                  <option key={estado.value} value={estado.value}>{estado.label}</option>
                ))}
              </select>
              <select
                value={campeonatoFilter}
                onChange={(e) => setCampeonatoFilter(e.target.value)}
                className="partido-filter-select"
              >
                <option value="all">Todos los campeonatos</option>
                {campeonatos.map(campeonato => (
                  <option key={campeonato.id} value={campeonato.id}>
                    {campeonato.nombre}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={fechaFilter}
                onChange={(e) => setFechaFilter(e.target.value)}
                className="partido-filter-date"
                placeholder="Filtrar por fecha"
              />
              <button onClick={applyFilters} className="partido-btn-secondary">
                <Filter size={18} />
                Aplicar
              </button>
              <button onClick={resetFilters} className="partido-btn-secondary">
                <RefreshCw size={18} />
                Limpiar
              </button>
            </div>
          </div>

          {/* VISTAS */}
          <div className="partido-view-controls">
            <div className="partido-view-buttons">
              <button
                onClick={() => setViewMode('list')}
                className={`partido-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                title="Vista de lista"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`partido-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                title="Vista de cuadrícula"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`partido-view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                title="Vista de calendario"
              >
                <CalendarDays size={18} />
              </button>
            </div>
            <div className="partido-view-info">
              {partidos.length} partido{partidos.length !== 1 ? 's' : ''} encontrado{partidos.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* CONTENIDO */}
          {loading ? (
            <div className="partido-loading">
              <div className="partido-loading-spinner"></div>
              <p className="partido-loading-text">Cargando partidos...</p>
            </div>
          ) : error ? (
            <div className="partido-error">
              <AlertTriangle size={48} />
              <h3>Error al cargar partidos</h3>
              <p>{error}</p>
              <button onClick={loadPartidos} className="partido-btn-primary">
                <RefreshCw size={18} />
                Reintentar
              </button>
            </div>
          ) : partidos.length === 0 ? (
            <div className="partido-empty-state">
              <Award size={64} />
              <h3 className="partido-empty-title">No hay partidos registrados</h3>
              <p className="partido-empty-message">
                {searchTerm || estadoFilter !== 'all' || campeonatoFilter !== 'all' || fechaFilter
                  ? 'No se encontraron partidos con los filtros aplicados'
                  : 'Crea tu primer partido para comenzar a gestionar encuentros'}
              </p>
              <button onClick={openCreateModal} className="partido-btn-primary">
                <Plus size={18} />
                Crear Partido
              </button>
            </div>
          ) : (
            <>
              {/* VISTA DE LISTA */}
              {viewMode === 'list' && (
                <div className="partido-table-container">
                  <table className="partido-table">
                    <thead>
                      <tr>
                        <th>Fecha/Hora</th>
                        <th>Encuentro</th>
                        <th>Campeonato</th>
                        <th>Escenario</th>
                        <th>Estado</th>
                        <th>Resultado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partidos.map(partido => {
                        const resultado = getResultado(partido);
                        const EstadoIcon = getEstadoIcon(partido.estado);
                        
                        return (
                          <tr key={partido.id} className="partido-table-row">
                            <td>
                              <div className="partido-fecha-hora">
                                <div className="partido-fecha">
                                  {formatFechaHora(partido.fecha, partido.hora)}
                                </div>
                                {partido.hora && (
                                  <div className="partido-hora">
                                    <Clock size={12} />
                                    {partido.hora}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="partido-encuentro">
                                <div className="partido-equipo local">
                                  <div className="partido-equipo-nombre">
                                    {getClubNombre(partido.club_local_id)}
                                  </div>
                                </div>
                                <div className="partido-vs">vs</div>
                                <div className="partido-equipo visitante">
                                  <div className="partido-equipo-nombre">
                                    {getClubNombre(partido.club_visitante_id)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="partido-campeonato">
                                {partido.campeonato ? (
                                  <div className="partido-campeonato-info">
                                    <Trophy size={14} />
                                    <span>{partido.campeonato.nombre}</span>
                                  </div>
                                ) : (
                                  <span className="partido-sin-campeonato">Amistoso</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="partido-escenario">
                                {partido.escenario ? (
                                  <div className="partido-escenario-info">
                                    <MapPin size={14} />
                                    <span>{partido.escenario.nombre}</span>
                                  </div>
                                ) : (
                                  <span className="partido-sin-escenario">Por definir</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div 
                                className="partido-estado-badge"
                                style={{
                                  backgroundColor: getEstadoColor(partido.estado) + '20',
                                  color: getEstadoColor(partido.estado)
                                }}
                              >
                                <EstadoIcon size={14} />
                                <span>{getEstadoLabel(partido.estado)}</span>
                              </div>
                            </td>
                            <td>
                              {resultado ? (
                                <div className={`partido-resultado ${resultado.ganador}`}>
                                  <span className="partido-marcador">{resultado.resultado}</span>
                                </div>
                              ) : (
                                <span className="partido-sin-resultado">-</span>
                              )}
                            </td>
                            <td>
                              <div className="partido-actions">
                                <button
                                  onClick={() => loadPartidoDetalle(partido.id)}
                                  className="partido-action-btn"
                                  title="Ver detalles"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => openEditModal(partido)}
                                  className="partido-action-btn"
                                  title="Editar"
                                  disabled={partido.estado === 'finalizado'}
                                >
                                  <Edit2 size={16} />
                                </button>
                                {partido.estado !== 'finalizado' && partido.estado !== 'cancelado' && (
                                  <button
                                    onClick={() => openFinalizarModal(partido)}
                                    className="partido-action-btn"
                                    title="Finalizar"
                                  >
                                    <StopCircle size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() => openDeleteModal(partido)}
                                  className="partido-action-btn delete"
                                  title="Eliminar"
                                  disabled={partido.estado === 'finalizado'}
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

              {/* VISTA DE CUADRÍCULA */}
              {viewMode === 'grid' && (
                <div className="partido-grid-container">
                  {partidos.map(partido => {
                    const resultado = getResultado(partido);
                    const EstadoIcon = getEstadoIcon(partido.estado);
                    
                    return (
                      <div key={partido.id} className="partido-card">
                        <div className="partido-card-header">
                          <div className="partido-card-fecha">
                            {formatFechaHora(partido.fecha, partido.hora)}
                          </div>
                          <div 
                            className="partido-card-estado"
                            style={{
                              backgroundColor: getEstadoColor(partido.estado) + '20',
                              color: getEstadoColor(partido.estado)
                            }}
                          >
                            <EstadoIcon size={12} />
                            <span>{getEstadoLabel(partido.estado)}</span>
                          </div>
                        </div>
                        
                        <div className="partido-card-encuentro">
                          <div className="partido-card-equipo local">
                            <div className="partido-card-equipo-nombre">
                              {getClubNombre(partido.club_local_id)}
                            </div>
                            {resultado && (
                              <div className="partido-card-goles">
                                {partido.goles_local}
                              </div>
                            )}
                          </div>
                          
                          <div className="partido-card-vs">
                            <div className="partido-card-vs-text">VS</div>
                            <div className="partido-card-hora">
                              <Clock size={12} />
                              {partido.hora}
                            </div>
                          </div>
                          
                          <div className="partido-card-equipo visitante">
                            {resultado && (
                              <div className="partido-card-goles">
                                {partido.goles_visitante}
                              </div>
                            )}
                            <div className="partido-card-equipo-nombre">
                              {getClubNombre(partido.club_visitante_id)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="partido-card-info">
                          {partido.campeonato && (
                            <div className="partido-card-campeonato">
                              <Trophy size={12} />
                              <span>{partido.campeonato.nombre}</span>
                            </div>
                          )}
                          {partido.escenario && (
                            <div className="partido-card-escenario">
                              <MapPin size={12} />
                              <span>{partido.escenario.nombre}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="partido-card-actions">
                          <button
                            onClick={() => loadPartidoDetalle(partido.id)}
                            className="partido-card-action"
                            title="Ver detalles"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEditModal(partido)}
                            className="partido-card-action"
                            title="Editar"
                            disabled={partido.estado === 'finalizado'}
                          >
                            <Edit2 size={14} />
                          </button>
                          {partido.estado !== 'finalizado' && partido.estado !== 'cancelado' && (
                            <button
                              onClick={() => openFinalizarModal(partido)}
                              className="partido-card-action"
                              title="Finalizar"
                            >
                              <StopCircle size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PAGINACIÓN */}
              {viewMode === 'list' && totalPages > 1 && (
                <div className="partido-pagination">
                  <div className="partido-pagination-info">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="partido-pagination-controls">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="partido-pagination-btn"
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
                          className={`partido-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="partido-pagination-btn"
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

      {/* MODAL CREAR/EDITAR PARTIDO */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {mode === 'create' ? (
                  <>
                    <Plus size={20} />
                    Nuevo Partido
                  </>
                ) : (
                  <>
                    <Edit2 size={20} />
                    Editar Partido
                  </>
                )}
              </h3>
              <button onClick={closeModal} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Trophy size={14} />
                    Campeonato
                  </label>
                  <select
                    value={form.id_campeonato}
                    onChange={(e) => setForm({...form, id_campeonato: e.target.value})}
                    className="modal-form-input"
                  >
                    <option value="">Seleccionar campeonato</option>
                    <option value="">Partido Amistoso</option>
                    {campeonatos.map(campeonato => (
                      <option key={campeonato.id} value={campeonato.id}>
                        {campeonato.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <MapPin size={14} />
                    Escenario
                  </label>
                  <select
                    value={form.id_escenario}
                    onChange={(e) => setForm({...form, id_escenario: e.target.value})}
                    className={`modal-form-input ${errors.id_escenario ? 'error' : ''}`}
                  >
                    <option value="">Seleccionar escenario</option>
                    {escenarios.map(escenario => (
                      <option key={escenario.id} value={escenario.id}>
                        {escenario.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.id_escenario && (
                    <span className="modal-form-error">{errors.id_escenario}</span>
                  )}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <TeamIcon size={14} />
                    Club Local
                  </label>
                  <select
                    value={form.club_local_id}
                    onChange={(e) => setForm({...form, club_local_id: e.target.value})}
                    className={`modal-form-input ${errors.club_local_id ? 'error' : ''}`}
                  >
                    <option value="">Seleccionar club local</option>
                    {clubes.map(club => (
                      <option key={club.id_club} value={club.id_club}>
                        {club.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.club_local_id && (
                    <span className="modal-form-error">{errors.club_local_id}</span>
                  )}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <TeamIcon size={14} />
                    Club Visitante
                  </label>
                  <select
                    value={form.club_visitante_id}
                    onChange={(e) => setForm({...form, club_visitante_id: e.target.value})}
                    className={`modal-form-input ${errors.club_visitante_id ? 'error' : ''}`}
                  >
                    <option value="">Seleccionar club visitante</option>
                    {clubes.map(club => (
                      <option key={club.id_club} value={club.id_club}>
                        {club.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.club_visitante_id && (
                    <span className="modal-form-error">{errors.club_visitante_id}</span>
                  )}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Calendar size={14} />
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({...form, fecha: e.target.value})}
                    className={`modal-form-input ${errors.fecha ? 'error' : ''}`}
                  />
                  {errors.fecha && (
                    <span className="modal-form-error">{errors.fecha}</span>
                  )}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Clock size={14} />
                    Hora
                  </label>
                  <input
                    type="time"
                    value={form.hora}
                    onChange={(e) => setForm({...form, hora: e.target.value})}
                    className={`modal-form-input ${errors.hora ? 'error' : ''}`}
                  />
                  {errors.hora && (
                    <span className="modal-form-error">{errors.hora}</span>
                  )}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Settings size={14} />
                    Árbitro
                  </label>
                  <input
                    type="text"
                    value={form.arbitro}
                    onChange={(e) => setForm({...form, arbitro: e.target.value})}
                    className="modal-form-input"
                    placeholder="Nombre del árbitro principal"
                  />
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Settings size={14} />
                    Estado
                  </label>
                  <select
                    value={form.estado}
                    onChange={(e) => setForm({...form, estado: e.target.value})}
                    className="modal-form-input"
                  >
                    {estados.map(estado => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    <List size={14} />
                    Observaciones
                  </label>
                  <textarea
                    value={form.observaciones}
                    onChange={(e) => setForm({...form, observaciones: e.target.value})}
                    className="modal-form-input"
                    rows="3"
                    placeholder="Notas adicionales sobre el partido..."
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeModal} className="modal-btn-secondary">
                Cancelar
              </button>
              <button 
                onClick={mode === 'create' ? createPartido : updatePartido}
                className="modal-btn-primary"
              >
                {mode === 'create' ? (
                  <>
                    <Plus size={18} />
                    Crear Partido
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE PARTIDO */}
      {showDetailModal && partidoDetalle && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <Eye size={20} />
                Detalles del Partido
              </h3>
              <button onClick={closeDetailModal} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="partido-detail-header">
                <div className="partido-detail-teams">
                  <div className="partido-detail-team local">
                    <h4>{getClubNombre(partidoDetalle.club_local_id)}</h4>
                    <div className="partido-detail-escudo">
                      <TeamIcon size={24} />
                    </div>
                  </div>
                  <div className="partido-detail-vs">
                    <div className="partido-detail-score">
                      {partidoDetalle.estado === 'finalizado' ? (
                        <>
                          <span className="partido-detail-goles">{partidoDetalle.goles_local || 0}</span>
                          <span className="partido-detail-separator">-</span>
                          <span className="partido-detail-goles">{partidoDetalle.goles_visitante || 0}</span>
                        </>
                      ) : 'VS'}
                    </div>
                    <div className="partido-detail-status">
                      <div 
                        className="partido-detail-estado-badge"
                        style={{
                          backgroundColor: getEstadoColor(partidoDetalle.estado) + '20',
                          color: getEstadoColor(partidoDetalle.estado)
                        }}
                      >
                        {getEstadoLabel(partidoDetalle.estado)}
                      </div>
                    </div>
                  </div>
                  <div className="partido-detail-team visitante">
                    <div className="partido-detail-escudo">
                      <TeamIcon size={24} />
                    </div>
                    <h4>{getClubNombre(partidoDetalle.club_visitante_id)}</h4>
                  </div>
                </div>
              </div>
              
              <div className="partido-detail-info-grid">
                <div className="partido-detail-info-item">
                  <div className="partido-detail-info-label">
                    <Calendar size={16} />
                    Fecha y Hora
                  </div>
                  <div className="partido-detail-info-value">
                    {formatFechaHora(partidoDetalle.fecha, partidoDetalle.hora)}
                  </div>
                </div>
                
                <div className="partido-detail-info-item">
                  <div className="partido-detail-info-label">
                    <Trophy size={16} />
                    Campeonato
                  </div>
                  <div className="partido-detail-info-value">
                    {partidoDetalle.campeonato ? partidoDetalle.campeonato.nombre : 'Amistoso'}
                  </div>
                </div>
                
                <div className="partido-detail-info-item">
                  <div className="partido-detail-info-label">
                    <MapPin size={16} />
                    Escenario
                  </div>
                  <div className="partido-detail-info-value">
                    {partidoDetalle.escenario ? partidoDetalle.escenario.nombre : 'Por definir'}
                  </div>
                </div>
                
                <div className="partido-detail-info-item">
                  <div className="partido-detail-info-label">
                    <Settings size={16} />
                    Árbitro
                  </div>
                  <div className="partido-detail-info-value">
                    {partidoDetalle.arbitro || 'Por definir'}
                  </div>
                </div>
                
                {partidoDetalle.observaciones && (
                  <div className="partido-detail-info-item full-width">
                    <div className="partido-detail-info-label">
                      <List size={16} />
                      Observaciones
                    </div>
                    <div className="partido-detail-info-value">
                      {partidoDetalle.observaciones}
                    </div>
                  </div>
                )}
                
                {partidoDetalle.estado === 'finalizado' && (
                  <>
                    <div className="partido-detail-info-item">
                      <div className="partido-detail-info-label">
                        <Target size={16} />
                        Goles Local
                      </div>
                      <div className="partido-detail-info-value">
                        {partidoDetalle.goles_local || 0}
                      </div>
                    </div>
                    
                    <div className="partido-detail-info-item">
                      <div className="partido-detail-info-label">
                        <Target size={16} />
                        Goles Visitante
                      </div>
                      <div className="partido-detail-info-value">
                        {partidoDetalle.goles_visitante || 0}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeDetailModal} className="modal-btn-secondary">
                Cerrar
              </button>
              <button 
                onClick={() => {
                  closeDetailModal();
                  openEditModal(partidoDetalle);
                }}
                className="modal-btn-primary"
                disabled={partidoDetalle.estado === 'finalizado'}
              >
                <Edit2 size={18} />
                Editar Partido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR PARTIDO */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <AlertTriangle size={20} />
                Confirmar Eliminación
              </h3>
              <button onClick={closeDeleteModal} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-modal-content">
                <AlertTriangle size={48} className="delete-modal-icon" />
                <h4>¿Estás seguro de eliminar este partido?</h4>
                <p>Esta acción no se puede deshacer. Se eliminarán todos los datos relacionados con este partido.</p>
                {selectedPartido && (
                  <div className="delete-modal-info">
                    <div className="delete-modal-partido">
                      <strong>{getClubNombre(selectedPartido.club_local_id)}</strong> vs <strong>{getClubNombre(selectedPartido.club_visitante_id)}</strong>
                    </div>
                    <div className="delete-modal-fecha">
                      {formatFechaHora(selectedPartido.fecha, selectedPartido.hora)}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeDeleteModal} className="modal-btn-secondary">
                Cancelar
              </button>
              <button onClick={deletePartido} className="modal-btn-danger">
                <Trash2 size={18} />
                Eliminar Partido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FINALIZAR PARTIDO */}
      {showFinalizarModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <StopCircle size={20} />
                Finalizar Partido
              </h3>
              <button onClick={closeFinalizarModal} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="finalizar-modal-content">
                {selectedPartido && (
                  <div className="finalizar-modal-teams">
                    <div className="finalizar-modal-team">
                      <h4>{getClubNombre(selectedPartido.club_local_id)}</h4>
                      <TeamIcon size={32} />
                    </div>
                    
                    <div className="finalizar-modal-score-input">
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={formFinalizar.goles_local}
                        onChange={(e) => setFormFinalizar({
                          ...formFinalizar,
                          goles_local: parseInt(e.target.value) || 0
                        })}
                        className="finalizar-modal-input"
                      />
                      <span className="finalizar-modal-separator">-</span>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={formFinalizar.goles_visitante}
                        onChange={(e) => setFormFinalizar({
                          ...formFinalizar,
                          goles_visitante: parseInt(e.target.value) || 0
                        })}
                        className="finalizar-modal-input"
                      />
                    </div>
                    
                    <div className="finalizar-modal-team">
                      <TeamIcon size={32} />
                      <h4>{getClubNombre(selectedPartido.club_visitante_id)}</h4>
                    </div>
                  </div>
                )}
                
                <div className="finalizar-modal-info">
                  <p>Ingresa el resultado final del partido. Esta acción cambiará el estado a "Finalizado".</p>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeFinalizarModal} className="modal-btn-secondary">
                Cancelar
              </button>
              <button onClick={finalizarPartido} className="modal-btn-primary">
                <StopCircle size={18} />
                Confirmar Resultado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRÓXIMOS PARTIDOS */}
      {showProximosModal && (
        <div className="modal-overlay">
          <div className="modal-content wide">
            <div className="modal-header">
              <h3 className="modal-title">
                <Calendar size={20} />
                Próximos Partidos
              </h3>
              <button onClick={closeProximosModal} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {proximosPartidos.length === 0 ? (
                <div className="empty-state">
                  <Calendar size={48} />
                  <p>No hay partidos programados para los próximos días.</p>
                </div>
              ) : (
                <div className="proximos-partidos-list">
                  {proximosPartidos.map(partido => (
                    <div key={partido.id} className="proximo-partido-item">
                      <div className="proximo-partido-fecha">
                        {formatFechaHora(partido.fecha, partido.hora)}
                      </div>
                      <div className="proximo-partido-teams">
                        <div className="proximo-partido-team">
                          <div className="partido-equipo-nombre">
                            {getClubNombre(partido.club_local_id)}
                          </div>
                        </div>
                        <div className="proximo-partido-vs">vs</div>
                        <div className="proximo-partido-team">
                          <div className="partido-equipo-nombre">
                            {getClubNombre(partido.club_visitante_id)}
                          </div>
                        </div>
                      </div>
                      <div className="proximo-partido-campeonato">
                        {partido.campeonato ? partido.campeonato.nombre : 'Amistoso'}
                      </div>
                      <div className="proximo-partido-actions">
                        <button
                          onClick={() => {
                            closeProximosModal();
                            loadPartidoDetalle(partido.id);
                          }}
                          className="proximo-partido-action"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button onClick={closeProximosModal} className="modal-btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partido;