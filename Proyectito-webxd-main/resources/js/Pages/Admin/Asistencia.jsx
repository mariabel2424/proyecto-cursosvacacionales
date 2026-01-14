import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, X, Filter, Search, RefreshCw, 
  Eye, ChevronLeft, ChevronRight, AlertTriangle, 
  CheckCircle, XCircle, Users, Trophy, Calendar, 
  Download, Upload, MoreVertical, CheckSquare, Square,
  ArrowUpDown, BarChart3, Home, Mail, Phone, MapPin,
  User, Shield, Clock, Activity, TrendingUp, TrendingDown,
  Image, Upload as UploadIcon, Facebook, Twitter, Instagram,
  Globe, UserPlus, Users as UsersIcon, Award, Target,
  Heart, Ruler, Scale, Footprints, Shirt, FileText,
  Stethoscope, UserCheck, Smartphone, Briefcase, BookOpen,
  Award as AwardIcon, Star, Target as TargetIcon, Zap,
  Check, X as XIcon, Edit, ExternalLink, Copy, Filter as FilterIcon,
  Users as GroupIcon, PersonStanding, Dumbbell, CalendarDays,
  Clock as ClockIcon, TrendingUp as TrendingUpIcon, AlertOctagon,
  ClipboardList, CreditCard, Building, Flag, Coffee,
  CalendarCheck, CheckCheck, Clock3, FileBarChart, DownloadCloud,
  Printer, CalendarRange, UserCheck as UserCheckIcon, 
  UserX, UserMinus, UserPlus as UserPlusIcon, BarChart2,
  PieChart, ListChecks, ClipboardCheck, Calendar as CalendarIcon,
  CalendarPlus, CalendarMinus, CalendarClock, Hash, Layers,
  TrendingUp as TrendUp, TrendingDown as TrendDown, Percent,
  Clipboard, Grid, Columns, Table, BarChart, PieChart as PieChartIcon,
  LineChart, Bell, BellOff, CalendarX, CalendarSearch,
  UserCog, Settings, Target as TargetIcon2, RotateCcw,
  Save, FileText as FileTextIcon, FilePlus, FileMinus,
  FileCheck, FileX, FileDigit, BookOpenCheck, CalendarHeart
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/asistencia.css';

const API_ASISTENCIAS = 'http://127.0.0.1:8000/api/asistencias';
const API_DEPORTISTAS = 'http://127.0.0.1:8000/api/deportistas';
const API_ACTIVIDADES = 'http://127.0.0.1:8000/api/actividades';
const API_GRUPOS = 'http://127.0.0.1:8000/api/grupos-curso';

const authHeaders = () => {
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
};

const Asistencia = () => {
  // Estados principales
  const [asistencias, setAsistencias] = useState([]);
  const [filteredAsistencias, setFilteredAsistencias] = useState([]);
  const [deportistas, setDeportistas] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [grupos, setGrupos] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReporteModal, setShowReporteModal] = useState(false);
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [mode, setMode] = useState('create');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  
  // Estados para asistencia masiva
  const [asistenciaMasiva, setAsistenciaMasiva] = useState({
    id_grupo: '',
    fecha: new Date().toISOString().split('T')[0],
    asistencias: []
  });
  
  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [deportistaFilter, setDeportistaFilter] = useState('all');
  const [actividadFilter, setActividadFilter] = useState('all');
  const [grupoFilter, setGrupoFilter] = useState('all');
  const [fechaFilter, setFechaFilter] = useState('');
  const [sortBy, setSortBy] = useState('fecha');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage] = useState(15);
  
  // Selección masiva
  const [selectedAsistencias, setSelectedAsistencias] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Reporte
  const [reporteData, setReporteData] = useState(null);
  const [reporteForm, setReporteForm] = useState({
    fecha_desde: new Date().toISOString().split('T')[0],
    fecha_hasta: new Date().toISOString().split('T')[0],
    id_deportista: ''
  });
  
  // Formulario
  const [form, setForm] = useState({
    id_deportista: '',
    id_grupo: '',
    id_actividad: '',
    fecha: new Date().toISOString().split('T')[0],
    hora_llegada: '',
    estado: 'presente',
    observaciones: ''
  });

  // Obtener ID de la asistencia
  const getAsistenciaId = (asistencia) => {
    return asistencia.id_asistencia || asistencia.id || 0;
  };

  // Cargar asistencias
  const loadAsistencias = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_ASISTENCIAS}?page=${page}`;
      
      if (estadoFilter && estadoFilter !== 'all') {
        url += `&estado=${estadoFilter}`;
      }
      
      if (deportistaFilter && deportistaFilter !== 'all') {
        url += `&id_deportista=${deportistaFilter}`;
      }
      
      if (actividadFilter && actividadFilter !== 'all') {
        url += `&id_actividad=${actividadFilter}`;
      }
      
      if (grupoFilter && grupoFilter !== 'all') {
        url += `&id_grupo=${grupoFilter}`;
      }
      
      if (fechaFilter) {
        url += `&fecha=${fechaFilter}`;
      }
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      const headers = authHeaders();
      const res = await fetch(url, { headers });
      
      if (!res.ok) throw new Error('Error al cargar asistencias');
      
      const data = await res.json();
      
      // Manejar respuesta paginada de Laravel
      let asistenciasData = [];
      if (data.data && Array.isArray(data.data)) {
        asistenciasData = data.data;
        setCurrentPage(data.current_page || page);
        setTotalPages(data.last_page || 1);
        setTotalItems(data.total || data.data.length);
      } else if (Array.isArray(data)) {
        asistenciasData = data;
        setCurrentPage(1);
        setTotalPages(Math.ceil(data.length / perPage));
        setTotalItems(data.length);
      }
      
      setAsistencias(asistenciasData);
      setFilteredAsistencias(asistenciasData);
      
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar las asistencias. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

// Cargar datos auxiliares
const loadData = async () => {
  try {
    // Cargar deportistas
    const depRes = await fetch(API_DEPORTISTAS, { headers: authHeaders() });
    if (depRes.ok) {
      const depData = await depRes.json();
      console.log('Datos deportistas:', depData);
      
      // Manejar diferentes formatos de respuesta
      if (Array.isArray(depData)) {
        setDeportistas(depData);
      } else if (depData.data && Array.isArray(depData.data)) {
        setDeportistas(depData.data);
      } else if (depData.success && Array.isArray(depData.data)) {
        setDeportistas(depData.data);
      } else {
        console.warn('Formato de deportistas no reconocido:', depData);
        setDeportistas([]);
      }
    } else {
      console.error('Error cargando deportistas:', depRes.status);
      setDeportistas([]);
    }

    // Cargar actividades
    const actRes = await fetch(API_ACTIVIDADES, { headers: authHeaders() });
    if (actRes.ok) {
      const actData = await actRes.json();
      console.log('Datos actividades:', actData);
      
      if (Array.isArray(actData)) {
        setActividades(actData);
      } else if (actData.data && Array.isArray(actData.data)) {
        setActividades(actData.data);
      } else if (actData.success && Array.isArray(actData.data)) {
        setActividades(actData.data);
      } else {
        console.warn('Formato de actividades no reconocido:', actData);
        setActividades([]);
      }
    } else {
      console.error('Error cargando actividades:', actRes.status);
      setActividades([]);
    }

    // Cargar grupos
    const gruRes = await fetch(API_GRUPOS, { headers: authHeaders() });
    if (gruRes.ok) {
      const gruData = await gruRes.json();
      console.log('Datos grupos:', gruData);
      
      if (Array.isArray(gruData)) {
        setGrupos(gruData);
      } else if (gruData.data && Array.isArray(gruData.data)) {
        setGrupos(gruData.data);
      } else if (gruData.success && Array.isArray(gruData.data)) {
        setGrupos(gruData.data);
      } else {
        console.warn('Formato de grupos no reconocido:', gruData);
        setGrupos([]);
      }
    } else {
      console.error('Error cargando grupos:', gruRes.status);
      setGrupos([]);
    }
  } catch (error) {
    console.error('Error cargando datos auxiliares:', error);
    setDeportistas([]);
    setActividades([]);
    setGrupos([]);
  }
};

  // Cargar deportistas para grupo
  const loadDeportistasGrupo = async (idGrupo) => {
    try {
      const res = await fetch(`${API_GRUPOS}/${idGrupo}/deportistas`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        const deportistasGrupo = Array.isArray(data) ? data : (data.data || []);
        
        // Inicializar asistencias para cada deportista
        const nuevasAsistencias = deportistasGrupo.map(deportista => ({
          id_deportista: deportista.id_deportista,
          estado: 'presente',
          hora_llegada: '',
          observaciones: '',
          deportista: deportista
        }));
        
        setAsistenciaMasiva(prev => ({
          ...prev,
          asistencias: nuevasAsistencias
        }));
      }
    } catch (error) {
      console.error('Error cargando deportistas del grupo:', error);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadAsistencias();
    loadData();
  }, []);

  // Aplicar filtros y búsqueda en el cliente
  useEffect(() => {
    let filtered = [...asistencias];

    // Filtro por estado
    if (estadoFilter !== 'all') {
      filtered = filtered.filter(asist => asist.estado === estadoFilter);
    }

    // Filtro por deportista
    if (deportistaFilter !== 'all') {
      filtered = filtered.filter(asist => asist.id_deportista == deportistaFilter);
    }

    // Filtro por actividad
    if (actividadFilter !== 'all') {
      filtered = filtered.filter(asist => asist.id_actividad == actividadFilter);
    }

    // Filtro por grupo
    if (grupoFilter !== 'all') {
      filtered = filtered.filter(asist => asist.id_grupo == grupoFilter);
    }

    // Filtro por fecha
    if (fechaFilter) {
      filtered = filtered.filter(asist => 
        asist.fecha && asist.fecha.startsWith(fechaFilter)
      );
    }

    // Búsqueda por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(asist =>
        (asist.deportista?.nombres && asist.deportista.nombres.toLowerCase().includes(term)) ||
        (asist.deportista?.apellidos && asist.deportista.apellidos.toLowerCase().includes(term)) ||
        (asist.observaciones && asist.observaciones.toLowerCase().includes(term)) ||
        (asist.actividad?.nombre && asist.actividad.nombre.toLowerCase().includes(term)) ||
        (asist.grupo?.nombre && asist.grupo.nombre.toLowerCase().includes(term))
      );
    }

    // Ordenación
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      if (sortBy === 'deportista') {
        aValue = `${a.deportista?.apellidos} ${a.deportista?.nombres}`;
        bValue = `${b.deportista?.apellidos} ${b.deportista?.nombres}`;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      return sortOrder === 'asc' ? 
        (aValue < bValue ? -1 : 1) : 
        (bValue < aValue ? -1 : 1);
    });

    setFilteredAsistencias(filtered);
    setCurrentPage(1);
    setTotalPages(Math.ceil(filtered.length / perPage));
    setSelectedAsistencias([]);
    setSelectAll(false);
  }, [asistencias, searchTerm, estadoFilter, deportistaFilter, actividadFilter, grupoFilter, fechaFilter, sortBy, sortOrder]);

  // Datos paginados para mostrar
  const paginatedAsistencias = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    return filteredAsistencias.slice(startIndex, endIndex);
  }, [filteredAsistencias, currentPage, perPage]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = asistencias.length;
    const presentes = asistencias.filter(a => a.estado === 'presente').length;
    const ausentes = asistencias.filter(a => a.estado === 'ausente').length;
    const tarde = asistencias.filter(a => a.estado === 'tarde').length;
    const justificados = asistencias.filter(a => a.estado === 'justificado').length;
    
    const porcentajeAsistencia = total > 0 ? 
      Math.round(((presentes + tarde) / total) * 100) : 0;
    
    // Última semana
    const unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(unaSemanaAtras.getDate() - 7);
    
    const ultimaSemana = asistencias.filter(a => {
      const fechaAsistencia = new Date(a.fecha);
      return fechaAsistencia >= unaSemanaAtras;
    }).length;
    
    // Hoy
    const hoy = new Date().toISOString().split('T')[0];
    const hoyCount = asistencias.filter(a => a.fecha === hoy).length;
    
    return { 
      total, 
      presentes, 
      ausentes, 
      tarde,
      justificados,
      porcentajeAsistencia,
      ultimaSemana,
      hoyCount
    };
  }, [asistencias]);

  // CRUD Operations
  const createAsistencia = async () => {
    if (!validateForm()) return;
    
    try {
      const res = await fetch(API_ASISTENCIAS, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form)
      });

      const responseData = await res.json();
      
      if (res.ok) {
        closeModal();
        await loadAsistencias();
        alert('✅ Asistencia registrada exitosamente');
      } else {
        handleApiError(responseData);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  const updateAsistencia = async () => {
    if (!validateForm() || !selected) return;
    
    try {
      const res = await fetch(`${API_ASISTENCIAS}/${getAsistenciaId(selected)}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(form)
      });

      const responseData = await res.json();

      if (res.ok) {
        closeModal();
        await loadAsistencias();
        alert('✅ Asistencia actualizada exitosamente');
      } else {
        handleApiError(responseData);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  const deleteAsistencia = async (id) => {
    if (!id) return;
    
    try {
      const res = await fetch(`${API_ASISTENCIAS}/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (res.ok) {
        closeDeleteModal();
        await loadAsistencias();
        alert('✅ Asistencia eliminada exitosamente');
      } else {
        const error = await res.json();
        alert(`❌ ${error.message || 'Error al eliminar asistencia'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  // Asistencia masiva de grupo
  const tomarAsistenciaGrupo = async () => {
    const errors = {};
    if (!asistenciaMasiva.id_grupo) errors.id_grupo = 'Selecciona un grupo';
    if (!asistenciaMasiva.fecha) errors.fecha = 'La fecha es requerida';
    
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      alert('Por favor, completa los campos requeridos');
      return;
    }
    
    try {
      const dataToSend = {
        fecha: asistenciaMasiva.fecha,
        asistencias: asistenciaMasiva.asistencias.map(item => ({
          id_deportista: item.id_deportista,
          estado: item.estado,
          hora_llegada: item.hora_llegada || null,
          observaciones: item.observaciones || null
        }))
      };
      
      const res = await fetch(`${API_ASISTENCIAS}/grupo/${asistenciaMasiva.id_grupo}/tomar-asistencia`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(dataToSend)
      });

      if (res.ok) {
        closeGrupoModal();
        await loadAsistencias();
        alert('✅ Asistencia del grupo registrada exitosamente');
      } else {
        const error = await res.json();
        alert(`❌ ${error.message || 'Error al registrar asistencia grupal'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  // Generar reporte
  const generarReporte = async () => {
    const errors = {};
    if (!reporteForm.fecha_desde) errors.fecha_desde = 'Fecha desde es requerida';
    if (!reporteForm.fecha_hasta) errors.fecha_hasta = 'Fecha hasta es requerida';
    if (new Date(reporteForm.fecha_hasta) < new Date(reporteForm.fecha_desde)) {
      errors.fecha_hasta = 'Fecha hasta debe ser mayor o igual a fecha desde';
    }
    
    if (Object.keys(errors).length > 0) {
      alert('Por favor, corrige los errores en el formulario');
      return;
    }
    
    try {
      let url = `${API_ASISTENCIAS}/deportista/${reporteForm.id_deportista}/reporte`;
      url += `?fecha_desde=${reporteForm.fecha_desde}&fecha_hasta=${reporteForm.fecha_hasta}`;
      
      const res = await fetch(url, { headers: authHeaders() });
      
      if (res.ok) {
        const data = await res.json();
        setReporteData(data);
        setShowReporteModal(true);
      } else {
        const error = await res.json();
        alert(`❌ ${error.message || 'Error al generar reporte'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al generar reporte');
    }
  };

  // Validación
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.id_deportista) newErrors.id_deportista = 'El deportista es requerido';
    if (!form.id_grupo) newErrors.id_grupo = 'El grupo es requerido';
    if (!form.fecha) newErrors.fecha = 'La fecha es requerida';
    if (!form.estado) newErrors.estado = 'El estado es requerido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApiError = (responseData) => {
    if (responseData.errors) {
      const validationErrors = {};
      Object.keys(responseData.errors).forEach(key => {
        validationErrors[key] = responseData.errors[key][0];
      });
      setErrors(validationErrors);
      
      const errorMessages = Object.values(validationErrors).join('\n• ');
      alert(`❌ Errores de validación:\n• ${errorMessages}`);
    } else if (responseData.message) {
      alert(`❌ ${responseData.message}`);
    } else {
      alert('❌ Error en la operación');
    }
  };

  // Modal functions
  const openCreateModal = () => {
    setMode('create');
    setForm({
      id_deportista: '',
      id_grupo: '',
      id_actividad: '',
      fecha: new Date().toISOString().split('T')[0],
      hora_llegada: '',
      estado: 'presente',
      observaciones: ''
    });
    setErrors({});
    setSelected(null);
    setShowModal(true);
  };

  const openEditModal = (asistencia) => {
    setMode('edit');
    setSelected(asistencia);
    setForm({ 
      id_deportista: asistencia.id_deportista || '',
      id_grupo: asistencia.id_grupo || '',
      id_actividad: asistencia.id_actividad || '',
      fecha: asistencia.fecha ? asistencia.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
      hora_llegada: asistencia.hora_llegada || '',
      estado: asistencia.estado || 'presente',
      observaciones: asistencia.observaciones || ''
    });
    setErrors({});
    setShowModal(true);
  };

  const openDetailModal = async (asistencia) => {
    try {
      const headers = authHeaders();
      const res = await fetch(`${API_ASISTENCIAS}/${getAsistenciaId(asistencia)}`, { headers });
      
      if (res.ok) {
        const asistenciaDetalle = await res.json();
        setSelected(asistenciaDetalle);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error cargando detalles:', error);
      setSelected(asistencia);
      setShowDetailModal(true);
    }
  };

  const openDeleteModal = (asistencia) => {
    setSelected(asistencia);
    setShowDeleteModal(true);
  };

  const openGrupoModal = () => {
    setAsistenciaMasiva({
      id_grupo: '',
      fecha: new Date().toISOString().split('T')[0],
      asistencias: []
    });
    setErrors({});
    setShowGrupoModal(true);
  };

  const openReporteModal = (deportistaId = '') => {
    setReporteForm({
      fecha_desde: new Date().toISOString().split('T')[0],
      fecha_hasta: new Date().toISOString().split('T')[0],
      id_deportista: deportistaId
    });
    setReporteData(null);
    setShowReporteModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowDetailModal(false);
    setErrors({});
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelected(null);
  };

  const closeGrupoModal = () => {
    setShowGrupoModal(false);
    setAsistenciaMasiva({
      id_grupo: '',
      fecha: new Date().toISOString().split('T')[0],
      asistencias: []
    });
  };

  const closeReporteModal = () => {
    setShowReporteModal(false);
    setReporteData(null);
  };

  // Selection
  const toggleAsistenciaSelection = (id) => {
    setSelectedAsistencias(prev => {
      if (prev.includes(id)) {
        return prev.filter(asistenciaId => asistenciaId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedAsistencias([]);
    } else {
      const allIds = paginatedAsistencias.map(a => getAsistenciaId(a));
      setSelectedAsistencias(allIds);
    }
    setSelectAll(!selectAll);
  };

  // Cambiar estado en asistencia masiva
  const cambiarEstadoMasiva = (index, estado) => {
    const nuevasAsistencias = [...asistenciaMasiva.asistencias];
    nuevasAsistencias[index] = {
      ...nuevasAsistencias[index],
      estado
    };
    setAsistenciaMasiva(prev => ({
      ...prev,
      asistencias: nuevasAsistencias
    }));
  };

  // Bulk actions
  const bulkDelete = async () => {
    if (selectedAsistencias.length === 0) {
      alert('❌ Selecciona al menos una asistencia');
      return;
    }

    if (!confirm(`¿Eliminar ${selectedAsistencias.length} asistencia(s)? Esta acción no se puede deshacer.`)) return;

    try {
      const promises = selectedAsistencias.map(id => 
        fetch(`${API_ASISTENCIAS}/${id}`, {
          method: 'DELETE',
          headers: authHeaders()
        })
      );

      await Promise.all(promises);
      await loadAsistencias();
      alert(`✅ ${selectedAsistencias.length} asistencia(s) eliminada(s) exitosamente`);
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error en la eliminación masiva');
    }
  };

  // Obtener color del estado
  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'presente': return '#10b981';
      case 'ausente': return '#ef4444';
      case 'tarde': return '#f59e0b';
      case 'justificado': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  // Obtener icono del estado
  const getEstadoIcon = (estado) => {
    switch(estado) {
      case 'presente': return <CheckCircle size={14} />;
      case 'ausente': return <XCircle size={14} />;
      case 'tarde': return <Clock3 size={14} />;
      case 'justificado': return <FileText size={14} />;
      default: return <XCircle size={14} />;
    }
  };

  // Manejar cambio de grupo en asistencia masiva
  const handleGrupoChange = async (idGrupo) => {
    setAsistenciaMasiva(prev => ({
      ...prev,
      id_grupo: idGrupo,
      asistencias: []
    }));
    
    if (idGrupo) {
      await loadDeportistasGrupo(idGrupo);
    }
  };

  return (
    <div className="asistencia-container">
      <Sidebar />
      <div className="asistencia-content">
        <Topbar />
        
        {/* HEADER */}
        <div className="asistencia-header">
          <div style={{flex: 1, minWidth: 0}}>
            <h1 className="asistencia-title">
              <ClipboardCheck size={28} />
              Gestión de Asistencias
            </h1>
            <p className="asistencia-subtitle">
              Registra y administra las asistencias de los deportistas
            </p>
          </div>
          
          <div className="asistencia-header-actions">
            <button 
              onClick={() => {
                loadAsistencias();
                loadData();
              }} 
              className="asistencia-btn asistencia-btn-secondary"
              disabled={loading}
              title="Actualizar lista"
            >
              <RefreshCw size={20} /> <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button 
              onClick={openGrupoModal} 
              className="asistencia-btn asistencia-btn-success"
              style={{flexShrink: 0}}
            >
              <ListChecks size={20} /> <span className="hidden sm:inline">Asistencia Grupal</span>
            </button>
            <button 
              onClick={openCreateModal} 
              className="asistencia-btn asistencia-btn-primary"
              style={{flexShrink: 0}}
            >
              <Plus size={20} /> <span className="hidden sm:inline">Nueva Asistencia</span>
            </button>
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        <div className="asistencia-stats-grid">
          <div className="asistencia-stat-card">
            <div className="asistencia-stat-icon" style={{backgroundColor: '#f0f9ff', color: '#0ea5e9'}}>
              <ClipboardCheck size={24} />
            </div>
            <div>
              <h3 className="asistencia-stat-number">{stats.total}</h3>
              <p className="asistencia-stat-label">Total Asistencias</p>
            </div>
          </div>
          
          <div className="asistencia-stat-card">
            <div className="asistencia-stat-icon" style={{backgroundColor: '#d1fae5', color: '#10b981'}}>
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="asistencia-stat-number">{stats.presentes}</h3>
              <p className="asistencia-stat-label">Presentes</p>
            </div>
          </div>
          
          <div className="asistencia-stat-card">
            <div className="asistencia-stat-icon" style={{backgroundColor: '#fee2e2', color: '#ef4444'}}>
              <UserX size={24} />
            </div>
            <div>
              <h3 className="asistencia-stat-number">{stats.ausentes}</h3>
              <p className="asistencia-stat-label">Ausentes</p>
            </div>
          </div>
          
          <div className="asistencia-stat-card">
            <div className="asistencia-stat-icon" style={{backgroundColor: '#fef3c7', color: '#f59e0b'}}>
              <Clock3 size={24} />
            </div>
            <div>
              <h3 className="asistencia-stat-number">{stats.tarde}</h3>
              <p className="asistencia-stat-label">Tarde</p>
            </div>
          </div>
          
          <div className="asistencia-stat-card">
            <div className="asistencia-stat-icon" style={{backgroundColor: '#dbeafe', color: '#3b82f6'}}>
              <FileText size={24} />
            </div>
            <div>
              <h3 className="asistencia-stat-number">{stats.justificados}</h3>
              <p className="asistencia-stat-label">Justificados</p>
            </div>
          </div>
          
          <div className="asistencia-stat-card">
            <div className="asistencia-stat-icon" style={{backgroundColor: '#f0f9ff', color: '#0ea5e9'}}>
              <Percent size={24} />
            </div>
            <div>
              <h3 className="asistencia-stat-number">{stats.porcentajeAsistencia}%</h3>
              <p className="asistencia-stat-label">% Asistencia</p>
            </div>
          </div>
          
          <div className="asistencia-stat-card">
            <div className="asistencia-stat-icon" style={{backgroundColor: '#f0f9ff', color: '#0ea5e9'}}>
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="asistencia-stat-number">{stats.hoyCount}</h3>
              <p className="asistencia-stat-label">Hoy</p>
            </div>
          </div>
          
          <div className="asistencia-stat-card">
            <div className="asistencia-stat-icon" style={{backgroundColor: '#f0f9ff', color: '#0ea5e9'}}>
              <CalendarRange size={24} />
            </div>
            <div>
              <h3 className="asistencia-stat-number">{stats.ultimaSemana}</h3>
              <p className="asistencia-stat-label">Última Semana</p>
            </div>
          </div>
        </div>

        {/* BARRA DE HERRAMIENTAS */}
        <div className="asistencia-toolbar">
          <div className="asistencia-toolbar-row">
            <div className="asistencia-search-container">
              <div className="asistencia-search">
                <Search className="asistencia-search-icon" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="asistencia-search-input"
                  placeholder="Buscar por deportista, actividad o observaciones..."
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="asistencia-filters">
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="asistencia-filter-select"
                disabled={loading}
              >
                <option value="all">Todos los estados</option>
                <option value="presente">Presente</option>
                <option value="ausente">Ausente</option>
                <option value="tarde">Tarde</option>
                <option value="justificado">Justificado</option>
              </select>
              
              <select
                value={deportistaFilter}
                onChange={(e) => setDeportistaFilter(e.target.value)}
                className="asistencia-filter-select"
                disabled={loading}
              >
                <option value="all">Todos los deportistas</option>
                {deportistas.map(dep => (
                  <option key={dep.id_deportista} value={dep.id_deportista}>
                    {dep.nombres} {dep.apellidos}
                  </option>
                ))}
              </select>
              
              <select
                value={grupoFilter}
                onChange={(e) => setGrupoFilter(e.target.value)}
                className="asistencia-filter-select"
                disabled={loading}
              >
                <option value="all">Todos los grupos</option>
                {grupos.map(grupo => (
                  <option key={grupo.id_grupo} value={grupo.id_grupo}>
                    {grupo.nombre}
                  </option>
                ))}
              </select>
              
              <input
                type="date"
                value={fechaFilter}
                onChange={(e) => setFechaFilter(e.target.value)}
                className="asistencia-filter-input"
                disabled={loading}
              />
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="asistencia-btn asistencia-btn-secondary"
                disabled={loading}
              >
                <ArrowUpDown size={18} />
                {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
              </button>
              
              <button
                onClick={() => loadAsistencias(1)}
                className="asistencia-btn asistencia-btn-primary"
                disabled={loading}
              >
                <Filter size={18} />
                Filtrar
              </button>
            </div>
          </div>
          
          {/* ACCIONES MASIVAS */}
          {selectedAsistencias.length > 0 && (
            <div className="asistencia-toolbar-actions">
              <div className="asistencia-bulk-actions">
                <span className="asistencia-bulk-info">
                  {selectedAsistencias.length} asistencia(s) seleccionada(s)
                </span>
                <button
                  onClick={bulkDelete}
                  className="asistencia-btn asistencia-btn-danger asistencia-btn-sm"
                  disabled={loading}
                >
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
              
              <div className="asistencia-action-buttons">
                <button
                  onClick={() => setSelectedAsistencias([])}
                  className="asistencia-btn asistencia-btn-secondary asistencia-btn-icon"
                  title="Limpiar selección"
                  disabled={selectedAsistencias.length === 0 || loading}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}
          
          {/* ACCIONES ESPECIALES */}
          <div className="asistencia-toolbar-actions" style={{backgroundColor: '#f8fafc'}}>
            <div className="asistencia-special-actions">
              <button
                onClick={() => openReporteModal()}
                className="asistencia-btn asistencia-btn-primary asistencia-btn-sm"
                disabled={loading}
              >
                <FileBarChart size={16} /> Generar Reporte
              </button>
              <button
                onClick={openGrupoModal}
                className="asistencia-btn asistencia-btn-success asistencia-btn-sm"
                disabled={loading}
              >
                <ListChecks size={16} /> Asistencia Grupal
              </button>
              <button
                onClick={() => {
                  setFechaFilter(new Date().toISOString().split('T')[0]);
                  loadAsistencias(1);
                }}
                className="asistencia-btn asistencia-btn-secondary asistencia-btn-sm"
                disabled={loading}
              >
                <Calendar size={16} /> Ver Hoy
              </button>
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        {loading ? (
          <div className="asistencia-loading">
            <div className="asistencia-loading-spinner"></div>
            <p>Cargando asistencias...</p>
          </div>
        ) : error ? (
          <div className="asistencia-error">
            <AlertTriangle size={48} className="asistencia-error-icon" />
            <h3>Error al cargar asistencias</h3>
            <p>{error}</p>
            <button onClick={() => loadAsistencias()} className="asistencia-btn asistencia-btn-primary" style={{marginTop: '1rem'}}>
              <RefreshCw size={18} /> Reintentar
            </button>
          </div>
        ) : filteredAsistencias.length === 0 ? (
          <div className="asistencia-empty-state">
            <ClipboardCheck size={64} className="asistencia-empty-state-icon" />
            <h3>
              {searchTerm || estadoFilter !== 'all' || deportistaFilter !== 'all' || fechaFilter 
                ? 'No se encontraron resultados' 
                : 'No hay asistencias registradas'}
            </h3>
            <p>
              {searchTerm || estadoFilter !== 'all' || deportistaFilter !== 'all' || fechaFilter
                ? 'Intenta con otros términos de búsqueda o filtros' 
                : 'Comienza registrando la primera asistencia'}
            </p>
            <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
              <button onClick={openCreateModal} className="asistencia-btn asistencia-btn-primary">
                <Plus size={18} /> Nueva Asistencia
              </button>
              <button onClick={openGrupoModal} className="asistencia-btn asistencia-btn-success">
                <ListChecks size={18} /> Asistencia Grupal
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="asistencia-table-container">
              <div style={{
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '0.875rem',
                color: '#6b7280',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div className="text-truncate">
                  Mostrando {filteredAsistencias.length} de {totalItems} asistencias
                  {searchTerm && ` para "${searchTerm}"`}
                  {estadoFilter !== 'all' && ` con estado "${estadoFilter}"`}
                  {fechaFilter && ` del ${fechaFilter}`}
                </div>
                {totalPages > 1 && (
                  <div className="text-secondary">
                    Página {currentPage} de {totalPages}
                  </div>
                )}
              </div>
              
              <table className="asistencia-table">
                <thead>
                  <tr>
                    <th style={{width: '50px', minWidth: '50px'}}>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="asistencia-checkbox"
                        disabled={loading}
                      />
                    </th>
                    <th 
                      className="sortable" 
                      onClick={() => setSortBy('deportista')}
                      style={{cursor: 'pointer', minWidth: '200px'}}
                    >
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <User size={14} className="hidden sm:inline" />
                        <span>Deportista</span>
                        {sortBy === 'deportista' && (
                          <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th style={{minWidth: '150px'}}>Grupo</th>
                    <th style={{minWidth: '150px'}}>Actividad</th>
                    <th 
                      className="sortable" 
                      onClick={() => setSortBy('fecha')}
                      style={{cursor: 'pointer', minWidth: '120px'}}
                    >
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <Calendar size={14} className="hidden sm:inline" />
                        <span>Fecha</span>
                        {sortBy === 'fecha' && (
                          <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th style={{minWidth: '100px'}}>Hora</th>
                    <th 
                      className="sortable" 
                      onClick={() => setSortBy('estado')}
                      style={{cursor: 'pointer', minWidth: '120px'}}
                    >
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <Activity size={14} className="hidden sm:inline" />
                        <span>Estado</span>
                        {sortBy === 'estado' && (
                          <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th style={{minWidth: '200px'}}>Observaciones</th>
                    <th style={{minWidth: '140px'}}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAsistencias.map(asistencia => {
                    const asistenciaId = getAsistenciaId(asistencia);
                    const isSelected = selectedAsistencias.includes(asistenciaId);
                    
                    return (
                      <tr key={asistenciaId} className={isSelected ? 'selected' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAsistenciaSelection(asistenciaId)}
                            className="asistencia-checkbox"
                          />
                        </td>
                        <td>
                          <div style={{fontWeight: '600', color: '#1f2937'}}>
                            {asistencia.deportista?.apellidos}, {asistencia.deportista?.nombres}
                          </div>
                          <div style={{fontSize: '0.875rem', color: '#6b7280', marginTop: '2px'}}>
                            {asistencia.deportista?.numero_documento}
                          </div>
                        </td>
                        <td>
                          {asistencia.grupo && (
                            <div className="asistencia-info-item">
                              <GroupIcon size={12} style={{flexShrink: 0}} />
                              <span className="truncate">{asistencia.grupo.nombre}</span>
                            </div>
                          )}
                        </td>
                        <td>
                          {asistencia.actividad && (
                            <div className="asistencia-info-item">
                              <CalendarCheck size={12} style={{flexShrink: 0}} />
                              <span className="truncate">{asistencia.actividad.nombre}</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{fontWeight: '500', color: '#1f2937'}}>
                            {new Date(asistencia.fecha).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          {asistencia.hora_llegada && (
                            <div className="asistencia-info-item">
                              <Clock size={12} style={{flexShrink: 0}} />
                              <span>{asistencia.hora_llegada}</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div 
                            className="asistencia-estado-badge"
                            style={{
                              backgroundColor: getEstadoColor(asistencia.estado) + '20',
                              color: getEstadoColor(asistencia.estado),
                              borderColor: getEstadoColor(asistencia.estado)
                            }}
                          >
                            {getEstadoIcon(asistencia.estado)}
                            <span>{asistencia.estado}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{fontSize: '0.875rem', color: '#6b7280'}} className="truncate">
                            {asistencia.observaciones || '-'}
                          </div>
                        </td>
                        <td>
                          <div className="asistencia-action-buttons">
                            <button
                              onClick={() => openDetailModal(asistencia)}
                              className="asistencia-btn-action asistencia-btn-view"
                              title="Ver detalles"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(asistencia)}
                              className="asistencia-btn-action asistencia-btn-edit"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => openReporteModal(asistencia.id_deportista)}
                              className="asistencia-btn-action asistencia-btn-info"
                              title="Generar reporte"
                            >
                              <FileBarChart size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(asistencia)}
                              className="asistencia-btn-action asistencia-btn-danger"
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

              {/* PAGINACIÓN */}
              {totalPages > 1 && (
                <div className="asistencia-pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || loading}
                    className="asistencia-pagination-btn"
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
                        className={`asistencia-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        disabled={loading}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="asistencia-pagination-ellipsis">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="asistencia-pagination-btn"
                        disabled={loading}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || loading}
                    className="asistencia-pagination-btn"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* MODAL DE CREACIÓN/EDICIÓN */}
        {showModal && (
          <div className="asistencia-modal-overlay">
            <div className="asistencia-modal">
              <div className="asistencia-modal-header">
                <h2 className="asistencia-modal-title">
                  <ClipboardCheck size={22} />
                  {mode === 'create' ? 'Nueva Asistencia' : 'Editar Asistencia'}
                </h2>
                <button onClick={closeModal} className="asistencia-modal-close">
                  <X size={22} />
                </button>
              </div>

              <div className="asistencia-modal-content">
                <div className="asistencia-form-grid">
                  <div className="asistencia-form-group">
                    <label className="asistencia-form-label">
                      <User size={16} />
                      Deportista *
                    </label>
                    <select
                      value={form.id_deportista}
                      onChange={(e) => setForm({...form, id_deportista: e.target.value})}
                      className={`asistencia-form-select ${errors.id_deportista ? 'error' : ''}`}
                    >
                      <option value="">-- Selecciona un deportista --</option>
                      {deportistas.map(dep => (
                        <option key={dep.id_deportista} value={dep.id_deportista}>
                          {dep.nombres} {dep.apellidos} - {dep.numero_documento}
                        </option>
                      ))}
                    </select>
                    {errors.id_deportista && <span className="asistencia-form-error">{errors.id_deportista}</span>}
                  </div>

                  <div className="asistencia-form-group">
                    <label className="asistencia-form-label">
                      <GroupIcon size={16} />
                      Grupo *
                    </label>
                    <select
                      value={form.id_grupo}
                      onChange={(e) => setForm({...form, id_grupo: e.target.value})}
                      className={`asistencia-form-select ${errors.id_grupo ? 'error' : ''}`}
                    >
                      <option value="">-- Selecciona un grupo --</option>
                      {grupos.map(grupo => (
                        <option key={grupo.id_grupo} value={grupo.id_grupo}>
                          {grupo.nombre}
                        </option>
                      ))}
                    </select>
                    {errors.id_grupo && <span className="asistencia-form-error">{errors.id_grupo}</span>}
                  </div>

                  <div className="asistencia-form-group">
                    <label className="asistencia-form-label">
                      <CalendarCheck size={16} />
                      Actividad
                    </label>
                    <select
                      value={form.id_actividad}
                      onChange={(e) => setForm({...form, id_actividad: e.target.value})}
                      className="asistencia-form-select"
                    >
                      <option value="">-- Sin actividad específica --</option>
                      {actividades.map(act => (
                        <option key={act.id_actividad} value={act.id_actividad}>
                          {act.nombre} ({new Date(act.fecha_hora).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="asistencia-form-group">
                    <label className="asistencia-form-label">
                      <Calendar size={16} />
                      Fecha *
                    </label>
                    <input
                      type="date"
                      value={form.fecha}
                      onChange={(e) => setForm({...form, fecha: e.target.value})}
                      className={`asistencia-form-input ${errors.fecha ? 'error' : ''}`}
                    />
                    {errors.fecha && <span className="asistencia-form-error">{errors.fecha}</span>}
                  </div>

                  <div className="asistencia-form-group">
                    <label className="asistencia-form-label">
                      <Clock size={16} />
                      Hora de Llegada
                    </label>
                    <input
                      type="time"
                      value={form.hora_llegada}
                      onChange={(e) => setForm({...form, hora_llegada: e.target.value})}
                      className="asistencia-form-input"
                    />
                  </div>

                  <div className="asistencia-form-group">
                    <label className="asistencia-form-label">
                      <Shield size={16} />
                      Estado *
                    </label>
                    <select
                      value={form.estado}
                      onChange={(e) => setForm({...form, estado: e.target.value})}
                      className={`asistencia-form-select ${errors.estado ? 'error' : ''}`}
                    >
                      <option value="presente">Presente</option>
                      <option value="ausente">Ausente</option>
                      <option value="tarde">Tarde</option>
                      <option value="justificado">Justificado</option>
                    </select>
                    {errors.estado && <span className="asistencia-form-error">{errors.estado}</span>}
                  </div>

                  <div className="asistencia-form-group col-span-2">
                    <label className="asistencia-form-label">
                      <FileText size={16} />
                      Observaciones
                    </label>
                    <textarea
                      value={form.observaciones}
                      onChange={(e) => setForm({...form, observaciones: e.target.value})}
                      className="asistencia-form-textarea"
                      rows="3"
                      placeholder="Observaciones adicionales..."
                    />
                  </div>
                </div>
              </div>

              <div className="asistencia-modal-footer">
                <button onClick={closeModal} className="asistencia-btn asistencia-btn-secondary">
                  <X size={18} /> Cancelar
                </button>
                <button 
                  onClick={mode === 'create' ? createAsistencia : updateAsistencia} 
                  className="asistencia-btn asistencia-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Guardando...
                    </>
                  ) : mode === 'create' ? (
                    <>
                      <Plus size={18} /> Registrar
                    </>
                  ) : (
                    <>
                      <Edit2 size={18} /> Actualizar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE ASISTENCIA GRUPAL */}
        {showGrupoModal && (
          <div className="asistencia-modal-overlay">
            <div className="asistencia-modal asistencia-modal-lg">
              <div className="asistencia-modal-header">
                <h2 className="asistencia-modal-title">
                  <ListChecks size={22} />
                  Asistencia Grupal
                </h2>
                <button onClick={closeGrupoModal} className="asistencia-modal-close">
                  <X size={22} />
                </button>
              </div>

              <div className="asistencia-modal-content">
                <div className="asistencia-grupo-header">
                  <div className="asistencia-form-row">
                    <div className="asistencia-form-group">
                      <label className="asistencia-form-label">
                        <GroupIcon size={16} />
                        Grupo *
                      </label>
                      <select
                        value={asistenciaMasiva.id_grupo}
                        onChange={(e) => handleGrupoChange(e.target.value)}
                        className={`asistencia-form-select ${errors.id_grupo ? 'error' : ''}`}
                      >
                        <option value="">-- Selecciona un grupo --</option>
                        {grupos.map(grupo => (
                          <option key={grupo.id_grupo} value={grupo.id_grupo}>
                            {grupo.nombre}
                          </option>
                        ))}
                      </select>
                      {errors.id_grupo && <span className="asistencia-form-error">{errors.id_grupo}</span>}
                    </div>

                    <div className="asistencia-form-group">
                      <label className="asistencia-form-label">
                        <Calendar size={16} />
                        Fecha *
                      </label>
                      <input
                        type="date"
                        value={asistenciaMasiva.fecha}
                        onChange={(e) => setAsistenciaMasiva(prev => ({...prev, fecha: e.target.value}))}
                        className={`asistencia-form-input ${errors.fecha ? 'error' : ''}`}
                      />
                      {errors.fecha && <span className="asistencia-form-error">{errors.fecha}</span>}
                    </div>
                  </div>
                </div>

                {asistenciaMasiva.asistencias.length > 0 ? (
                  <div className="asistencia-grupo-table-container">
                    <table className="asistencia-grupo-table">
                      <thead>
                        <tr>
                          <th style={{width: '50px'}}>#</th>
                          <th>Deportista</th>
                          <th style={{width: '120px'}}>Estado</th>
                          <th style={{width: '100px'}}>Hora</th>
                          <th>Observaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asistenciaMasiva.asistencias.map((item, index) => (
                          <tr key={item.id_deportista}>
                            <td>{index + 1}</td>
                            <td>
                              <div style={{fontWeight: '600'}}>
                                {item.deportista?.nombres} {item.deportista?.apellidos}
                              </div>
                              <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                                #{item.deportista?.numero_camiseta || 'N/A'}
                              </div>
                            </td>
                            <td>
                              <div className="asistencia-estado-buttons">
                                <button
                                  onClick={() => cambiarEstadoMasiva(index, 'presente')}
                                  className={`asistencia-estado-btn ${item.estado === 'presente' ? 'active presente' : ''}`}
                                  title="Presente"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() => cambiarEstadoMasiva(index, 'ausente')}
                                  className={`asistencia-estado-btn ${item.estado === 'ausente' ? 'active ausente' : ''}`}
                                  title="Ausente"
                                >
                                  <XCircle size={16} />
                                </button>
                                <button
                                  onClick={() => cambiarEstadoMasiva(index, 'tarde')}
                                  className={`asistencia-estado-btn ${item.estado === 'tarde' ? 'active tarde' : ''}`}
                                  title="Tarde"
                                >
                                  <Clock3 size={16} />
                                </button>
                                <button
                                  onClick={() => cambiarEstadoMasiva(index, 'justificado')}
                                  className={`asistencia-estado-btn ${item.estado === 'justificado' ? 'active justificado' : ''}`}
                                  title="Justificado"
                                >
                                  <FileText size={16} />
                                </button>
                              </div>
                            </td>
                            <td>
                              <input
                                type="time"
                                value={item.hora_llegada || ''}
                                onChange={(e) => {
                                  const nuevasAsistencias = [...asistenciaMasiva.asistencias];
                                  nuevasAsistencias[index] = {
                                    ...nuevasAsistencias[index],
                                    hora_llegada: e.target.value
                                  };
                                  setAsistenciaMasiva(prev => ({
                                    ...prev,
                                    asistencias: nuevasAsistencias
                                  }));
                                }}
                                className="asistencia-hora-input"
                                disabled={item.estado === 'ausente'}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={item.observaciones || ''}
                                onChange={(e) => {
                                  const nuevasAsistencias = [...asistenciaMasiva.asistencias];
                                  nuevasAsistencias[index] = {
                                    ...nuevasAsistencias[index],
                                    observaciones: e.target.value
                                  };
                                  setAsistenciaMasiva(prev => ({
                                    ...prev,
                                    asistencias: nuevasAsistencias
                                  }));
                                }}
                                className="asistencia-obs-input"
                                placeholder="Observaciones..."
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div className="asistencia-resumen-grupo">
                      <div className="asistencia-resumen-item">
                        <span className="asistencia-resumen-label">Presentes:</span>
                        <span className="asistencia-resumen-value" style={{color: '#10b981'}}>
                          {asistenciaMasiva.asistencias.filter(a => a.estado === 'presente').length}
                        </span>
                      </div>
                      <div className="asistencia-resumen-item">
                        <span className="asistencia-resumen-label">Ausentes:</span>
                        <span className="asistencia-resumen-value" style={{color: '#ef4444'}}>
                          {asistenciaMasiva.asistencias.filter(a => a.estado === 'ausente').length}
                        </span>
                      </div>
                      <div className="asistencia-resumen-item">
                        <span className="asistencia-resumen-label">Tarde:</span>
                        <span className="asistencia-resumen-value" style={{color: '#f59e0b'}}>
                          {asistenciaMasiva.asistencias.filter(a => a.estado === 'tarde').length}
                        </span>
                      </div>
                      <div className="asistencia-resumen-item">
                        <span className="asistencia-resumen-label">Justificados:</span>
                        <span className="asistencia-resumen-value" style={{color: '#3b82f6'}}>
                          {asistenciaMasiva.asistencias.filter(a => a.estado === 'justificado').length}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="asistencia-no-deportistas">
                    <GroupIcon size={48} />
                    <p>Selecciona un grupo para cargar la lista de deportistas</p>
                  </div>
                )}
              </div>

              <div className="asistencia-modal-footer">
                <button onClick={closeGrupoModal} className="asistencia-btn asistencia-btn-secondary">
                  <X size={18} /> Cancelar
                </button>
                <button 
                  onClick={tomarAsistenciaGrupo} 
                  className="asistencia-btn asistencia-btn-success"
                  disabled={loading || asistenciaMasiva.asistencias.length === 0}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> Registrar Asistencia Grupal
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE REPORTE */}
        {showReporteModal && (
          <div className="asistencia-modal-overlay">
            <div className="asistencia-modal">
              <div className="asistencia-modal-header">
                <h2 className="asistencia-modal-title">
                  <FileBarChart size={22} />
                  {reporteData ? 'Reporte de Asistencia' : 'Generar Reporte'}
                </h2>
                <button onClick={closeReporteModal} className="asistencia-modal-close">
                  <X size={22} />
                </button>
              </div>

              <div className="asistencia-modal-content">
                {!reporteData ? (
                  <div className="asistencia-form-grid">
                    <div className="asistencia-form-group">
                      <label className="asistencia-form-label">
                        <User size={16} />
                        Deportista
                      </label>
                      <select
                        value={reporteForm.id_deportista}
                        onChange={(e) => setReporteForm({...reporteForm, id_deportista: e.target.value})}
                        className="asistencia-form-select"
                      >
                        <option value="">-- Todos los deportistas --</option>
                        {deportistas.map(dep => (
                          <option key={dep.id_deportista} value={dep.id_deportista}>
                            {dep.nombres} {dep.apellidos}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="asistencia-form-group">
                      <label className="asistencia-form-label">
                        <Calendar size={16} />
                        Fecha Desde *
                      </label>
                      <input
                        type="date"
                        value={reporteForm.fecha_desde}
                        onChange={(e) => setReporteForm({...reporteForm, fecha_desde: e.target.value})}
                        className="asistencia-form-input"
                      />
                    </div>

                    <div className="asistencia-form-group">
                      <label className="asistencia-form-label">
                        <Calendar size={16} />
                        Fecha Hasta *
                      </label>
                      <input
                        type="date"
                        value={reporteForm.fecha_hasta}
                        onChange={(e) => setReporteForm({...reporteForm, fecha_hasta: e.target.value})}
                        className="asistencia-form-input"
                      />
                    </div>

                    <div className="asistencia-form-group col-span-2">
                      <p className="asistencia-form-hint">
                        Selecciona el rango de fechas para generar el reporte de asistencia.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="asistencia-reporte-content">
                    <div className="asistencia-reporte-header">
                      <h3 className="asistencia-reporte-title">
                        Reporte de Asistencia
                      </h3>
                      <p className="asistencia-reporte-subtitle">
                        {reporteForm.fecha_desde} al {reporteForm.fecha_hasta}
                      </p>
                    </div>

                    <div className="asistencia-reporte-stats">
                      <div className="asistencia-reporte-stat">
                        <div className="asistencia-reporte-stat-label">Total</div>
                        <div className="asistencia-reporte-stat-value">{reporteData.total}</div>
                      </div>
                      <div className="asistencia-reporte-stat">
                        <div className="asistencia-reporte-stat-label">Presentes</div>
                        <div className="asistencia-reporte-stat-value" style={{color: '#10b981'}}>
                          {reporteData.presentes}
                        </div>
                      </div>
                      <div className="asistencia-reporte-stat">
                        <div className="asistencia-reporte-stat-label">Ausentes</div>
                        <div className="asistencia-reporte-stat-value" style={{color: '#ef4444'}}>
                          {reporteData.ausentes}
                        </div>
                      </div>
                      <div className="asistencia-reporte-stat">
                        <div className="asistencia-reporte-stat-label">Tarde</div>
                        <div className="asistencia-reporte-stat-value" style={{color: '#f59e0b'}}>
                          {reporteData.tarde}
                        </div>
                      </div>
                      <div className="asistencia-reporte-stat">
                        <div className="asistencia-reporte-stat-label">Justificados</div>
                        <div className="asistencia-reporte-stat-value" style={{color: '#3b82f6'}}>
                          {reporteData.justificados}
                        </div>
                      </div>
                      <div className="asistencia-reporte-stat">
                        <div className="asistencia-reporte-stat-label">% Asistencia</div>
                        <div className="asistencia-reporte-stat-value" style={{color: '#8b5cf6'}}>
                          {reporteData.porcentaje_asistencia}%
                        </div>
                      </div>
                    </div>

                    <div className="asistencia-reporte-chart">
                      <div className="asistencia-chart-bar" style={{width: `${reporteData.porcentaje_asistencia}%`}}>
                        <div className="asistencia-chart-bar-fill"></div>
                      </div>
                      <div className="asistencia-chart-label">
                        Porcentaje de Asistencia: {reporteData.porcentaje_asistencia}%
                      </div>
                    </div>

                    {reporteData.asistencias && (
                      <div className="asistencia-reporte-detalle">
                        <h4 className="asistencia-reporte-detalle-title">Detalle de Asistencias</h4>
                        <div className="asistencia-detalle-list">
                          {reporteData.asistencias.slice(0, 5).map((asist, index) => (
                            <div key={index} className="asistencia-detalle-item">
                              <span className="asistencia-detalle-fecha">
                                {new Date(asist.fecha).toLocaleDateString()}
                              </span>
                              <span 
                                className="asistencia-detalle-estado"
                                style={{color: getEstadoColor(asist.estado)}}
                              >
                                {asist.estado}
                              </span>
                              <span className="asistencia-detalle-hora">
                                {asist.hora_llegada || 'N/A'}
                              </span>
                            </div>
                          ))}
                          {reporteData.asistencias.length > 5 && (
                            <div className="asistencia-detalle-more">
                              +{reporteData.asistencias.length - 5} más
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="asistencia-modal-footer">
                {!reporteData ? (
                  <>
                    <button onClick={closeReporteModal} className="asistencia-btn asistencia-btn-secondary">
                      <X size={18} /> Cancelar
                    </button>
                    <button 
                      onClick={generarReporte} 
                      className="asistencia-btn asistencia-btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <FileBarChart size={18} /> Generar Reporte
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setReporteData(null)}
                      className="asistencia-btn asistencia-btn-secondary"
                    >
                      <RotateCcw size={18} /> Nuevo Reporte
                    </button>
                    <button 
                      onClick={() => {
                        // Función para imprimir o exportar el reporte
                        window.print();
                      }}
                      className="asistencia-btn asistencia-btn-success"
                    >
                      <Printer size={18} /> Imprimir
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
        {showDeleteModal && selected && (
          <div className="asistencia-modal-overlay">
            <div className="asistencia-modal asistencia-modal-sm">
              <div className="asistencia-modal-header">
                <h2 className="asistencia-modal-title">
                  <AlertTriangle size={22} />
                  Confirmar Eliminación
                </h2>
                <button onClick={closeDeleteModal} className="asistencia-modal-close">
                  <X size={22} />
                </button>
              </div>

              <div className="asistencia-modal-content">
                <div className="asistencia-delete-content">
                  <AlertTriangle size={48} className="asistencia-delete-icon" />
                  <h3 className="asistencia-delete-title">¿Eliminar asistencia?</h3>
                  <p className="asistencia-delete-message">
                    Estás por eliminar la asistencia de <strong>{selected.deportista?.nombres} {selected.deportista?.apellidos}</strong> del {new Date(selected.fecha).toLocaleDateString()}.
                  </p>
                  <p className="asistencia-delete-warning">
                    ⚠️ Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>

              <div className="asistencia-modal-footer">
                <button onClick={closeDeleteModal} className="asistencia-btn asistencia-btn-secondary">
                  <X size={18} /> Cancelar
                </button>
                <button 
                  onClick={() => deleteAsistencia(getAsistenciaId(selected))} 
                  className="asistencia-btn asistencia-btn-danger"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} /> Eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Asistencia;