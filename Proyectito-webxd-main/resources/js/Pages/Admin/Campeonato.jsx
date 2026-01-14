import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, Edit2, Trash2, X, Search, RefreshCw, Eye, Trophy,
  ChevronLeft, ChevronRight, AlertTriangle, Save, Calendar,
  Users, Award, Mail, Phone, FileText, MapPin, Clock, Filter,
  Star, TrendingUp, BarChart, Users as TeamIcon, Target,
  CheckCircle, XCircle, Upload, Download, Printer, Share2,
  Award as Cup, Target as TargetIcon, Hash, Flag, Image,
  Settings, EyeOff, Eye as EyeOn, Lock, Unlock, BookOpen,
  List, Grid, Table, PieChart, DollarSign, Shield, Activity
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/campeonato.css';

const API_CAMPEONATOS = 'http://127.0.0.1:8000/api/campeonatos';
const API_CLUBES = 'http://127.0.0.1:8000/api/clubes';
const API_CATEGORIAS = 'http://127.0.0.1:8000/api/categorias';

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

const Campeonato = () => {
  // Estados principales
  const [campeonatos, setCampeonatos] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modales
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInscripcionModal, setShowInscripcionModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  const [showFixtureModal, setShowFixtureModal] = useState(false);
  const [showGoleadoresModal, setShowGoleadoresModal] = useState(false);
  
  const [mode, setMode] = useState('create');
  const [selectedCampeonato, setSelectedCampeonato] = useState(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [categoriaFilter, setCategoriaFilter] = useState('all');
  const [sortBy, setSortBy] = useState('fecha_inicio');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Formulario
  const [form, setForm] = useState({
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    categoria: '',
    representante: '',
    email_representante: '',
    telefono_representante: '',
    descripcion: '',
    estado: 'planificado',
    imagen: null,
    reglas: []
  });
  
  // Formulario inscripción
  const [formInscripcion, setFormInscripcion] = useState({
    id_club: '',
    fecha_inscripcion: new Date().toISOString().split('T')[0]
  });
  
  const [imagenPreview, setImagenPreview] = useState(null);
  const [errors, setErrors] = useState({});
  
  // Estadísticas y datos adicionales
  const [tablaPosiciones, setTablaPosiciones] = useState([]);
  const [fixture, setFixture] = useState([]);
  const [goleadores, setGoleadores] = useState([]);
  const [campeonatoDetalle, setCampeonatoDetalle] = useState(null);
  
  // Categorías disponibles
  const categorias = [
    'Infantil', 'Juvenil', 'Sub-17', 'Sub-20', 'Mayores',
    'Femenino', 'Veteranos', 'Profesional', 'Amateur', 'Mixto'
  ];
  
  // Estados disponibles
  const estados = [
    { value: 'planificado', label: 'Planificado', color: '#3b82f6' },
    { value: 'en_curso', label: 'En Curso', color: '#10b981' },
    { value: 'finalizado', label: 'Finalizado', color: '#8b5cf6' },
    { value: 'cancelado', label: 'Cancelado', color: '#ef4444' }
  ];
  
  // Reglas predefinidas
  const reglasDisponibles = [
    'Tarjeta amarilla: 1 punto de sanción',
    'Tarjeta roja: 3 puntos de sanción',
    '3 tarjetas amarillas: 1 partido de suspensión',
    'Puntaje por victoria: 3 puntos',
    'Puntaje por empate: 1 punto',
    'Puntaje por derrota: 0 puntos',
    'Máximo 5 cambios por partido',
    'Lista de 18 jugadores por partido',
    'Uniforme completo obligatorio',
    'Documentación al día requerida',
    'Puntualidad requerida',
    'Respeto a árbitros y oficiales',
    'Prohibido jugar lesionado',
    'Uso obligatorio de espinilleras',
    'Sin protestas al árbitro'
  ];

  // Cargar datos iniciales
  useEffect(() => {
    console.log('useEffect ejecutado - Cargando datos iniciales');
    loadCampeonatos();
    loadClubes();
  }, []);

  // Cargar campeonatos
 const loadCampeonatos = async () => {
  console.log('====== loadCampeonatos INICIO ======');
  
  setLoading(true);
  setError(null);
  
  try {
    const url = `${API_CAMPEONATOS}?page=${currentPage}&search=${searchTerm}&estado=${estadoFilter !== 'all' ? estadoFilter : ''}&categoria=${categoriaFilter !== 'all' ? categoriaFilter : ''}&timestamp=${Date.now()}`;
    
    const response = await fetch(url, {
      headers: authHeaders(),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📦 Datos recibidos de API:', {
      total: data.total,
      dataLength: data.data?.length,
      primerItem: data.data?.[0]
    });
    
    // Verificar estructura de datos
    if (data.data && Array.isArray(data.data)) {
      // Normalizar datos para asegurar que tenemos id_campeonato
      const normalizedData = data.data.map(item => ({
        ...item,
        // Si por alguna razón viene como 'id', mapearlo a 'id_campeonato'
        id_campeonato: item.id_campeonato || item.id,
        // Asegurar que las reglas sean un array
        reglas: Array.isArray(item.reglas) ? item.reglas : 
               (typeof item.reglas === 'object' ? Object.values(item.reglas) : [])
      }));
      
      console.log('🔄 Normalizando datos:', normalizedData);
      
      setCampeonatos(normalizedData);
      setTotalPages(data.last_page || 1);
    } else {
      console.error('Formato de datos inesperado:', data);
      setCampeonatos([]);
      setTotalPages(1);
    }
  } catch (err) {
    console.error('❌ Error en loadCampeonatos:', err);
    setError(err.message);
  } finally {
    console.log('====== loadCampeonatos FIN ======');
    setLoading(false);
  }
};
  // Cargar clubes
  const loadClubes = async () => {
    console.log('loadClubes ejecutado');
    
    try {
      const response = await fetch(API_CLUBES, {
        headers: authHeaders()
      });
      
      console.log('Respuesta clubes:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Datos de clubes:', data);
        
        const clubesArray = Array.isArray(data) ? data : data.data || [];
        console.log('Clubes procesados:', clubesArray);
        setClubes(clubesArray);
      } else {
        console.error('Error cargando clubes:', response.statusText);
      }
    } catch (error) {
      console.error('Error en loadClubes:', error);
    }
  };

  // Cargar detalles del campeonato
  const loadCampeonatoDetalle = async (id) => {
    console.log('loadCampeonatoDetalle para ID:', id);
    
    try {
      const response = await fetch(`${API_CAMPEONATOS}/${id}`, {
        headers: authHeaders()
      });
      
      console.log('Respuesta detalle:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Detalle del campeonato:', data);
        setCampeonatoDetalle(data);
        setShowDetailModal(true);
      } else {
        console.error('Error cargando detalle:', response.statusText);
      }
    } catch (error) {
      console.error('Error en loadCampeonatoDetalle:', error);
    }
  };

  // Cargar tabla de posiciones
  const loadTablaPosiciones = async (id) => {
    console.log('loadTablaPosiciones para ID:', id);
    
    try {
      const response = await fetch(`${API_CAMPEONATOS}/${id}/tabla-posiciones`, {
        headers: authHeaders()
      });
      
      console.log('Respuesta tabla posiciones:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Tabla de posiciones:', data);
        setTablaPosiciones(data);
        setShowEstadisticasModal(true);
      } else {
        console.error('Error cargando tabla posiciones:', response.statusText);
      }
    } catch (error) {
      console.error('Error en loadTablaPosiciones:', error);
    }
  };

  // Cargar fixture
  const loadFixture = async (id) => {
    console.log('loadFixture para ID:', id);
    
    try {
      const response = await fetch(`${API_CAMPEONATOS}/${id}/fixture`, {
        headers: authHeaders()
      });
      
      console.log('Respuesta fixture:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fixture:', data);
        setFixture(data);
        setShowFixtureModal(true);
      } else {
        console.error('Error cargando fixture:', response.statusText);
      }
    } catch (error) {
      console.error('Error en loadFixture:', error);
    }
  };

  // Cargar goleadores
  const loadGoleadores = async (id) => {
    console.log('loadGoleadores para ID:', id);
    
    try {
      const response = await fetch(`${API_CAMPEONATOS}/${id}/goleadores`, {
        headers: authHeaders()
      });
      
      console.log('Respuesta goleadores:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Goleadores:', data);
        setGoleadores(data);
        setShowGoleadoresModal(true);
      } else {
        console.error('Error cargando goleadores:', response.statusText);
      }
    } catch (error) {
      console.error('Error en loadGoleadores:', error);
    }
  };

  // Aplicar filtros
  const applyFilters = () => {
    console.log('Aplicando filtros');
    loadCampeonatos();
  };

  // Resetear filtros
  const resetFilters = () => {
    console.log('Reseteando filtros');
    setSearchTerm('');
    setEstadoFilter('all');
    setCategoriaFilter('all');
    setCurrentPage(1);
    loadCampeonatos();
  };

  // Validar formulario
  const validateForm = () => {
    console.log('Validando formulario');
    const newErrors = {};
    
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!form.fecha_inicio) newErrors.fecha_inicio = 'La fecha de inicio es requerida';
    if (!form.categoria) newErrors.categoria = 'La categoría es requerida';
    if (!form.representante.trim()) newErrors.representante = 'El representante es requerido';
    
    if (form.fecha_fin && new Date(form.fecha_fin) < new Date(form.fecha_inicio)) {
      newErrors.fecha_fin = 'La fecha fin debe ser posterior a la fecha inicio';
    }
    
    if (form.email_representante && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_representante)) {
      newErrors.email_representante = 'Email inválido';
    }
    
    console.log('Errores de validación:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar imagen
  const handleImageChange = (e) => {
    console.log('handleImageChange ejecutado');
    const file = e.target.files[0];
    if (file) {
      console.log('Archivo seleccionado:', file.name, file.size, file.type);
      
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe pesar más de 2MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona una imagen válida');
        return;
      }
      
      setForm({...form, imagen: file});
      
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('Imagen cargada como preview');
        setImagenPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Crear FormData
  const createFormData = () => {
    console.log('Creando FormData');
    const formData = new FormData();
    
    Object.keys(form).forEach(key => {
      if (key === 'imagen' && form[key] instanceof File) {
        console.log('Agregando imagen al FormData:', form[key].name);
        formData.append(key, form[key]);
      } else if (key === 'reglas' && Array.isArray(form[key])) {
        console.log('Agregando reglas:', form[key]);
        form[key].forEach((regla, index) => {
          formData.append(`${key}[${index}]`, regla);
        });
      } else if (form[key] !== null && form[key] !== undefined && form[key] !== '') {
        console.log(`Agregando ${key}:`, form[key]);
        formData.append(key, form[key]);
      }
    });
    
    console.log('FormData creado');
    return formData;
  };

  // CRUD Operations
 const createCampeonato = async () => {
  console.log('createCampeonato ejecutado');
  if (!validateForm()) return;
  
  try {
    const formData = createFormData();
    console.log('FormData creado. Enviando a:', API_CAMPEONATOS);
    
    const response = await fetch(API_CAMPEONATOS, {
      method: 'POST',
      headers: authHeaders(true),
      body: formData
    });
    
    console.log('Respuesta crear - Status:', response.status);
    console.log('Respuesta crear - Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Respuesta crear - Texto crudo:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Respuesta crear - JSON parseado:', data);
    } catch (e) {
      console.error('Error parseando JSON:', e);
    }
    
    if (response.ok) {
      console.log('✅ Campeonato creado exitosamente:', data);
      alert('✅ Campeonato creado exitosamente');
      closeModal();
      
      // Forzar recarga inmediata
      console.log('Recargando campeonatos...');
      await loadCampeonatos();
      
      // También forzar recarga después de un breve delay
      setTimeout(() => {
        console.log('Recarga adicional después de 500ms');
        loadCampeonatos();
      }, 500);
    } else {
      console.error('❌ Error al crear:', data);
      alert(`❌ ${data?.message || 'Error al crear campeonato'}`);
    }
  } catch (error) {
    console.error('Error en createCampeonato:', error);
    alert('❌ Error de conexión');
  }
};

  const updateCampeonato = async () => {
    console.log('updateCampeonato ejecutado');
    if (!validateForm() || !selectedCampeonato) return;
    
    try {
      const formData = createFormData();
      formData.append('_method', 'PUT');
      console.log('Enviando datos para actualizar campeonato:', selectedCampeonato.id_campeonato);
      
      const response = await fetch(`${API_CAMPEONATOS}/${selectedCampeonato.id_campeonato}`, {
        method: 'POST',
        headers: authHeaders(true),
        body: formData
      });
      
      console.log('Respuesta actualizar:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Campeonato actualizado:', data);
        alert('✅ Campeonato actualizado exitosamente');
        closeModal();
        loadCampeonatos();
      } else {
        const errorData = await response.json();
        console.error('Error al actualizar:', errorData);
        alert(`❌ ${errorData.message || 'Error al actualizar campeonato'}`);
      }
    } catch (error) {
      console.error('Error en updateCampeonato:', error);
      alert('❌ Error de conexión');
    }
  };

  const deleteCampeonato = async () => {
    console.log('deleteCampeonato ejecutado:', selectedCampeonato?.id_campeonato);
    if (!selectedCampeonato) return;
    
    try {
      const response = await fetch(`${API_CAMPEONATOS}/${selectedCampeonato.id_campeonato}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      console.log('Respuesta eliminar:', response.status);
      
      if (response.ok) {
        console.log('Campeonato eliminado');
        alert('✅ Campeonato eliminado exitosamente');
        closeDeleteModal();
        loadCampeonatos();
      } else {
        const errorData = await response.json();
        console.error('Error al eliminar:', errorData);
        alert(`❌ ${errorData.message || 'Error al eliminar campeonato'}`);
      }
    } catch (error) {
      console.error('Error en deleteCampeonato:', error);
      alert('❌ Error de conexión');
    }
  };

  const inscribirClub = async () => {
    console.log('inscribirClub ejecutado');
    if (!formInscripcion.id_club || !selectedCampeonato) return;
    
    try {
      const response = await fetch(`${API_CAMPEONATOS}/${selectedCampeonato.id_campeonato}/inscribir-club`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(formInscripcion)
      });
      
      console.log('Respuesta inscribir:', response.status);
      
      if (response.ok) {
        console.log('Club inscrito exitosamente');
        alert('✅ Club inscrito exitosamente');
        closeInscripcionModal();
        loadCampeonatoDetalle(selectedCampeonato.id);
      } else {
        const errorData = await response.json();
        console.error('Error al inscribir:', errorData);
        alert(`❌ ${errorData.message || 'Error al inscribir club'}`);
      }
    } catch (error) {
      console.error('Error en inscribirClub:', error);
      alert('❌ Error de conexión');
    }
  };

  // Modal functions
  const openCreateModal = () => {
    console.log('openCreateModal ejecutado');
    setMode('create');
    setForm({
      nombre: '',
      fecha_inicio: '',
      fecha_fin: '',
      categoria: '',
      representante: '',
      email_representante: '',
      telefono_representante: '',
      descripcion: '',
      estado: 'planificado',
      imagen: null,
      reglas: []
    });
    setImagenPreview(null);
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (campeonato) => {
    console.log('openEditModal ejecutado:', campeonato);
    setMode('edit');
    setSelectedCampeonato(campeonato);
    setForm({
      nombre: campeonato.nombre || '',
      fecha_inicio: campeonato.fecha_inicio ? campeonato.fecha_inicio.split('T')[0] : '',
      fecha_fin: campeonato.fecha_fin ? campeonato.fecha_fin.split('T')[0] : '',
      categoria: campeonato.categoria || '',
      representante: campeonato.representante || '',
      email_representante: campeonato.email_representante || '',
      telefono_representante: campeonato.telefono_representante || '',
      descripcion: campeonato.descripcion || '',
      estado: campeonato.estado || 'planificado',
      imagen: null,
      reglas: campeonato.reglas || []
    });
    setImagenPreview(campeonato.imagen ? `http://127.0.0.1:8000/storage/${campeonato.imagen}` : null);
    setErrors({});
    setShowModal(true);
  };

  const openDeleteModal = (campeonato) => {
    console.log('openDeleteModal ejecutado:', campeonato);
    setSelectedCampeonato(campeonato);
    setShowDeleteModal(true);
  };

  const openInscripcionModal = (campeonato) => {
    console.log('openInscripcionModal ejecutado:', campeonato);
    setSelectedCampeonato(campeonato);
    setFormInscripcion({
      id_club: '',
      fecha_inscripcion: new Date().toISOString().split('T')[0]
    });
    setShowInscripcionModal(true);
  };

  const closeModal = () => {
    console.log('closeModal ejecutado');
    setShowModal(false);
    setSelectedCampeonato(null);
    setImagenPreview(null);
    setErrors({});
  };

  const closeDetailModal = () => {
    console.log('closeDetailModal ejecutado');
    setShowDetailModal(false);
    setCampeonatoDetalle(null);
  };

  const closeDeleteModal = () => {
    console.log('closeDeleteModal ejecutado');
    setShowDeleteModal(false);
    setSelectedCampeonato(null);
  };

  const closeInscripcionModal = () => {
    console.log('closeInscripcionModal ejecutado');
    setShowInscripcionModal(false);
    setSelectedCampeonato(null);
  };

  const closeEstadisticasModal = () => {
    console.log('closeEstadisticasModal ejecutado');
    setShowEstadisticasModal(false);
    setTablaPosiciones([]);
  };

  const closeFixtureModal = () => {
    console.log('closeFixtureModal ejecutado');
    setShowFixtureModal(false);
    setFixture([]);
  };

  const closeGoleadoresModal = () => {
    console.log('closeGoleadoresModal ejecutado');
    setShowGoleadoresModal(false);
    setGoleadores([]);
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

  const calcularDiasRestantes = (fechaInicio) => {
    if (!fechaInicio) return 0;
    const inicio = new Date(fechaInicio);
    const hoy = new Date();
    const diff = inicio.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const calcularProgreso = (campeonato) => {
    if (!campeonato.fecha_inicio || !campeonato.fecha_fin) return 0;
    
    const inicio = new Date(campeonato.fecha_inicio);
    const fin = new Date(campeonato.fecha_fin);
    const hoy = new Date();
    
    if (hoy < inicio) return 0;
    if (hoy > fin) return 100;
    
    const total = fin.getTime() - inicio.getTime();
    const transcurrido = hoy.getTime() - inicio.getTime();
    
    return Math.min(100, Math.round((transcurrido / total) * 100));
  };

  const toggleRegla = (regla) => {
    console.log('toggleRegla:', regla);
    setForm(prev => {
      if (prev.reglas.includes(regla)) {
        return {
          ...prev,
          reglas: prev.reglas.filter(r => r !== regla)
        };
      } else {
        return {
          ...prev,
          reglas: [...prev.reglas, regla]
        };
      }
    });
  };

  // Estadísticas
  const stats = useMemo(() => {
    console.log('Calculando estadísticas con campeonatos:', campeonatos);
    const total = campeonatos.length;
    const planificados = campeonatos.filter(c => c.estado === 'planificado').length;
    const enCurso = campeonatos.filter(c => c.estado === 'en_curso').length;
    const finalizados = campeonatos.filter(c => c.estado === 'finalizado').length;
    const cancelados = campeonatos.filter(c => c.estado === 'cancelado').length;
    
    const categoriasUnicas = [...new Set(campeonatos.map(c => c.categoria))];
    
    // Clubes inscritos totales
    const clubesInscritos = campeonatos.reduce((total, campeonato) => {
      return total + (campeonato.clubes?.length || 0);
    }, 0);
    
    const statsResult = { total, planificados, enCurso, finalizados, cancelados, categoriasUnicas: categoriasUnicas.length, clubesInscritos };
    console.log('Estadísticas calculadas:', statsResult);
    
    return statsResult;
  }, [campeonatos]);

  // Agregar un console.log para ver el estado en el render
  console.log('Render - Estado actual:', {
    loading,
    error,
    campeonatosLength: campeonatos.length,
    campeonatos: campeonatos,
    stats
  });

  return (
    <div className="campeonato-container">
      <Sidebar />
      
      <div className="campeonato-content">
        <Topbar />
        
        <div className="campeonato-main">
          {/* HEADER */}
          <div className="campeonato-header">
            <div>
              <h1 className="campeonato-title">
                <Trophy size={28} />
                Gestión de Campeonatos
              </h1>
              <p className="campeonato-subtitle">
                Administra torneos y competencias deportivas
              </p>
            </div>
            <button 
              onClick={openCreateModal}
              className="campeonato-btn-primary"
            >
              <Plus size={20} />
              Nuevo Campeonato
            </button>
          </div>

          {/* ESTADÍSTICAS */}
          <div className="campeonato-stats-grid">
            <div className="campeonato-stat-card">
              <div className="campeonato-stat-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                <Trophy size={24} />
              </div>
              <div>
                <h3 className="campeonato-stat-number">{stats.total}</h3>
                <p className="campeonato-stat-label">Total Campeonatos</p>
              </div>
            </div>
            <div className="campeonato-stat-card">
              <div className="campeonato-stat-icon" style={{background: '#dcfce7', color: '#10b981'}}>
                <Activity size={24} />
              </div>
              <div>
                <h3 className="campeonato-stat-number">{stats.enCurso}</h3>
                <p className="campeonato-stat-label">En Curso</p>
              </div>
            </div>
            <div className="campeonato-stat-card">
              <div className="campeonato-stat-icon" style={{background: '#fef3c7', color: '#f59e0b'}}>
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="campeonato-stat-number">{stats.planificados}</h3>
                <p className="campeonato-stat-label">Planificados</p>
              </div>
            </div>
            <div className="campeonato-stat-card">
              <div className="campeonato-stat-icon" style={{background: '#ede9fe', color: '#8b5cf6'}}>
                <TeamIcon size={24} />
              </div>
              <div>
                <h3 className="campeonato-stat-number">{stats.clubesInscritos}</h3>
                <p className="campeonato-stat-label">Clubes Inscritos</p>
              </div>
            </div>
          </div>

          {/* FILTROS */}
          <div className="campeonato-filters">
            <div className="campeonato-filters-row">
              <div className="campeonato-search-container">
                <Search className="campeonato-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Buscar campeonato por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  className="campeonato-search-input"
                />
              </div>
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="campeonato-filter-select"
              >
                <option value="all">Todos los estados</option>
                {estados.map(estado => (
                  <option key={estado.value} value={estado.value}>{estado.label}</option>
                ))}
              </select>
              <select
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                className="campeonato-filter-select"
              >
                <option value="all">Todas las categorías</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
              <button onClick={applyFilters} className="campeonato-btn-secondary">
                <Filter size={18} />
                Aplicar Filtros
              </button>
              <button onClick={resetFilters} className="campeonato-btn-secondary">
                <RefreshCw size={18} />
                Limpiar
              </button>
            </div>
          </div>

          {/* CONTENIDO */}
          {loading ? (
            <div className="campeonato-loading">
              <div className="campeonato-loading-spinner"></div>
              <p className="campeonato-loading-text">Cargando campeonatos...</p>
            </div>
          ) : error ? (
            <div className="campeonato-error">
              <AlertTriangle size={48} />
              <h3>Error al cargar campeonatos</h3>
              <p>{error}</p>
              <button onClick={loadCampeonatos} className="campeonato-btn-primary">
                <RefreshCw size={18} />
                Reintentar
              </button>
            </div>
          ) : campeonatos.length === 0 ? (
            <div className="campeonato-empty-state">
              <Trophy size={64} />
              <h3 className="campeonato-empty-title">No hay campeonatos registrados</h3>
              <p className="campeonato-empty-message">
                Comienza creando tu primer campeonato para organizar competencias
              </p>
              <button onClick={openCreateModal} className="campeonato-btn-primary">
                <Plus size={18} />
                Crear Campeonato
              </button>
            </div>
          ) : (
            <>
              {/* TABLA */}
              <div className="campeonato-table-container">
                <table className="campeonato-table">
                  <thead>
                    <tr>
                      <th>Imagen</th>
                      <th onClick={() => setSortBy('nombre')} style={{cursor: 'pointer'}}>
                        Nombre {sortBy === 'nombre' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => setSortBy('categoria')} style={{cursor: 'pointer'}}>
                        Categoría {sortBy === 'categoria' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Fechas</th>
                      <th onClick={() => setSortBy('estado')} style={{cursor: 'pointer'}}>
                        Estado {sortBy === 'estado' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Clubes</th>
                      <th>Progreso</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campeonatos.map(campeonato => {
                      const diasRestantes = calcularDiasRestantes(campeonato.fecha_inicio);
                      const progreso = calcularProgreso(campeonato);
                      
                      console.log('Renderizando campeonato:', campeonato.id, campeonato.nombre);
                      
                      return (
                        <tr key={campeonato.id} className="campeonato-table-row">
                          <td>
                            <div className="campeonato-image-cell">
                              {campeonato.imagen ? (
                                <img 
                                  src={`http://127.0.0.1:8000/storage/${campeonato.imagen}`}
                                  alt={campeonato.nombre}
                                  className="campeonato-image"
                                />
                              ) : (
                                <div className="campeonato-image-placeholder">
                                  <Trophy size={20} />
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="campeonato-info-cell">
                              <div className="campeonato-name">{campeonato.nombre}</div>
                              <div className="campeonato-representante">
                                <Users size={14} />
                                {campeonato.representante}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="campeonato-categoria-badge">
                              {campeonato.categoria}
                            </div>
                          </td>
                          <td>
                            <div className="campeonato-fechas">
                              <div className="campeonato-fecha">
                                <Calendar size={14} />
                                {new Date(campeonato.fecha_inicio).toLocaleDateString()}
                              </div>
                              {campeonato.fecha_fin && (
                                <div className="campeonato-fecha">
                                  <Calendar size={14} />
                                  {new Date(campeonato.fecha_fin).toLocaleDateString()}
                                </div>
                              )}
                              {campeonato.estado === 'planificado' && diasRestantes > 0 && (
                                <div className="campeonato-dias-restantes">
                                  <Clock size={14} />
                                  {diasRestantes} días
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div 
                              className="campeonato-estado-badge"
                              style={{
                                backgroundColor: getEstadoColor(campeonato.estado) + '20',
                                color: getEstadoColor(campeonato.estado)
                              }}
                            >
                              {getEstadoLabel(campeonato.estado)}
                            </div>
                          </td>
                          <td>
                            <div className="campeonato-clubes-cell">
                              <div className="campeonato-clubes-count">
                                <TeamIcon size={16} />
                                {campeonato.clubes?.length || 0} clubes
                              </div>
                              {campeonato.clubes && campeonato.clubes.length > 0 && (
                                <div className="campeonato-clubes-list">
                                  {campeonato.clubes.slice(0, 2).map(club => (
                                    <span key={club.id} className="campeonato-club-badge">
                                      {club.nombre?.substring(0, 10)}
                                    </span>
                                  ))}
                                  {campeonato.clubes.length > 2 && (
                                    <span className="campeonato-club-more">
                                      +{campeonato.clubes.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="campeonato-progreso">
                              <div className="campeonato-progreso-bar">
                                <div 
                                  className="campeonato-progreso-fill"
                                  style={{width: `${progreso}%`}}
                                />
                              </div>
                              <div className="campeonato-progreso-text">{progreso}%</div>
                            </div>
                          </td>
                          <td>
                            <div className="campeonato-actions">
                              <button
                                onClick={() => loadCampeonatoDetalle(campeonato.id)}
                                className="campeonato-action-btn"
                                title="Ver detalles"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => loadTablaPosiciones(campeonato.id)}
                                className="campeonato-action-btn"
                                title="Tabla de posiciones"
                              >
                                <BarChart size={16} />
                              </button>
                              <button
                                onClick={() => loadFixture(campeonato.id)}
                                className="campeonato-action-btn"
                                title="Ver fixture"
                              >
                                <Calendar size={16} />
                              </button>
                              <button
                                onClick={() => loadGoleadores(campeonato.id)}
                                className="campeonato-action-btn"
                                title="Goleadores"
                              >
                                <Target size={16} />
                              </button>
                              <button
                                onClick={() => openInscripcionModal(campeonato)}
                                className="campeonato-action-btn"
                                title="Inscribir club"
                              >
                                <TeamIcon size={16} />
                              </button>
                              <button
                                onClick={() => openEditModal(campeonato)}
                                className="campeonato-action-btn"
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => openDeleteModal(campeonato)}
                                className="campeonato-action-btn delete"
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
                <div className="campeonato-pagination">
                  <div className="campeonato-pagination-info">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="campeonato-pagination-controls">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="campeonato-pagination-btn"
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
                          className={`campeonato-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="campeonato-pagination-ellipsis">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="campeonato-pagination-btn"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="campeonato-pagination-btn"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* MODAL CREAR/EDITAR CAMPEONATO */}
          {showModal && (
            <div className="campeonato-modal-overlay">
              <div className="campeonato-modal large">
                <div className="campeonato-modal-header">
                  <h3 className="campeonato-modal-title">
                    <Trophy size={22} />
                    {mode === 'create' ? 'Nuevo Campeonato' : 'Editar Campeonato'}
                  </h3>
                  <button onClick={closeModal} className="campeonato-modal-close">
                    <X size={22} />
                  </button>
                </div>
                <div className="campeonato-modal-body">
                  <div className="campeonato-form">
                    {/* Imagen */}
                    <div className="campeonato-form-section">
                      <h4 className="campeonato-form-section-title">
                        <Image size={18} />
                        Imagen del Campeonato
                      </h4>
                      <div className="campeonato-image-upload">
                        <div className="campeonato-image-preview">
                          {imagenPreview ? (
                            <img src={imagenPreview} alt="Preview" className="campeonato-image-preview-img" />
                          ) : (
                            <div className="campeonato-image-preview-placeholder">
                              <Image size={32} />
                              <p>Seleccionar imagen</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <input
                            type="file"
                            id="image-upload"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="campeonato-file-input"
                          />
                          <label htmlFor="image-upload" className="campeonato-btn-secondary">
                            <Upload size={16} />
                            {form.imagen instanceof File ? 'Cambiar Imagen' : 'Subir Imagen'}
                          </label>
                          <p className="campeonato-file-hint">Máx. 2MB. Formatos: JPG, PNG, GIF</p>
                        </div>
                      </div>
                    </div>

                    {/* Información básica */}
                    <div className="campeonato-form-grid">
                      <div className="campeonato-form-group">
                        <label className="campeonato-form-label">
                          <Trophy size={16} />
                          Nombre *
                        </label>
                        <input
                          type="text"
                          value={form.nombre}
                          onChange={(e) => setForm({...form, nombre: e.target.value})}
                          className={`campeonato-form-input ${errors.nombre ? 'error' : ''}`}
                          placeholder="Ej: Torneo de Verano 2024"
                        />
                        {errors.nombre && (
                          <span className="campeonato-form-error">{errors.nombre}</span>
                        )}
                      </div>

                      <div className="campeonato-form-group">
                        <label className="campeonato-form-label">
                          <Award size={16} />
                          Categoría *
                        </label>
                        <select
                          value={form.categoria}
                          onChange={(e) => setForm({...form, categoria: e.target.value})}
                          className={`campeonato-form-select ${errors.categoria ? 'error' : ''}`}
                        >
                          <option value="">Seleccionar categoría</option>
                          {categorias.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        {errors.categoria && (
                          <span className="campeonato-form-error">{errors.categoria}</span>
                        )}
                      </div>

                      <div className="campeonato-form-group">
                        <label className="campeonato-form-label">
                          <Calendar size={16} />
                          Fecha Inicio *
                        </label>
                        <input
                          type="date"
                          value={form.fecha_inicio}
                          onChange={(e) => setForm({...form, fecha_inicio: e.target.value})}
                          className={`campeonato-form-input ${errors.fecha_inicio ? 'error' : ''}`}
                        />
                        {errors.fecha_inicio && (
                          <span className="campeonato-form-error">{errors.fecha_inicio}</span>
                        )}
                      </div>

                      <div className="campeonato-form-group">
                        <label className="campeonato-form-label">
                          <Calendar size={16} />
                          Fecha Fin
                        </label>
                        <input
                          type="date"
                          value={form.fecha_fin}
                          onChange={(e) => setForm({...form, fecha_fin: e.target.value})}
                          className={`campeonato-form-input ${errors.fecha_fin ? 'error' : ''}`}
                        />
                        {errors.fecha_fin && (
                          <span className="campeonato-form-error">{errors.fecha_fin}</span>
                        )}
                      </div>

                      <div className="campeonato-form-group">
                        <label className="campeonato-form-label">
                          <Activity size={16} />
                          Estado
                        </label>
                        <select
                          value={form.estado}
                          onChange={(e) => setForm({...form, estado: e.target.value})}
                          className="campeonato-form-select"
                        >
                          {estados.map(estado => (
                            <option key={estado.value} value={estado.value}>{estado.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Representante */}
                    <div className="campeonato-form-section">
                      <h4 className="campeonato-form-section-title">
                        <Users size={18} />
                        Información del Representante
                      </h4>
                      <div className="campeonato-form-grid">
                        <div className="campeonato-form-group">
                          <label className="campeonato-form-label">
                            <Users size={16} />
                            Representante *
                          </label>
                          <input
                            type="text"
                            value={form.representante}
                            onChange={(e) => setForm({...form, representante: e.target.value})}
                            className={`campeonato-form-input ${errors.representante ? 'error' : ''}`}
                            placeholder="Nombre completo"
                          />
                          {errors.representante && (
                            <span className="campeonato-form-error">{errors.representante}</span>
                          )}
                        </div>

                        <div className="campeonato-form-group">
                          <label className="campeonato-form-label">
                            <Mail size={16} />
                            Email
                          </label>
                          <input
                            type="email"
                            value={form.email_representante}
                            onChange={(e) => setForm({...form, email_representante: e.target.value})}
                            className={`campeonato-form-input ${errors.email_representante ? 'error' : ''}`}
                            placeholder="representante@email.com"
                          />
                          {errors.email_representante && (
                            <span className="campeonato-form-error">{errors.email_representante}</span>
                          )}
                        </div>

                        <div className="campeonato-form-group">
                          <label className="campeonato-form-label">
                            <Phone size={16} />
                            Teléfono
                          </label>
                          <input
                            type="tel"
                            value={form.telefono_representante}
                            onChange={(e) => setForm({...form, telefono_representante: e.target.value})}
                            className="campeonato-form-input"
                            placeholder="+1234567890"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Descripción */}
                    <div className="campeonato-form-section">
                      <h4 className="campeonato-form-section-title">
                        <FileText size={18} />
                        Descripción
                      </h4>
                      <div className="campeonato-form-group">
                        <textarea
                          value={form.descripcion}
                          onChange={(e) => setForm({...form, descripcion: e.target.value})}
                          className="campeonato-form-textarea"
                          placeholder="Descripción del campeonato..."
                          rows="4"
                        />
                      </div>
                    </div>

                    {/* Reglas */}
                    <div className="campeonato-form-section">
                      <h4 className="campeonato-form-section-title">
                        <BookOpen size={18} />
                        Reglas del Campeonato
                      </h4>
                      <div className="campeonato-reglas-grid">
                        {reglasDisponibles.map(regla => (
                          <div 
                            key={regla}
                            className={`campeonato-regla-checkbox ${form.reglas.includes(regla) ? 'selected' : ''}`}
                            onClick={() => toggleRegla(regla)}
                          >
                            <div className="campeonato-regla-checkbox-icon">
                              {form.reglas.includes(regla) ? (
                                <CheckCircle size={16} />
                              ) : (
                                <Circle size={16} />
                              )}
                            </div>
                            <span className="campeonato-regla-text">{regla}</span>
                          </div>
                        ))}
                      </div>
                      {form.reglas.length > 0 && (
                        <div className="campeonato-reglas-selected">
                          <strong>Reglas seleccionadas: {form.reglas.length}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="campeonato-modal-footer">
                  <button onClick={closeModal} className="campeonato-btn-secondary">
                    Cancelar
                  </button>
                  <button 
                    onClick={mode === 'create' ? createCampeonato : updateCampeonato}
                    className="campeonato-btn-primary"
                  >
                    <Save size={18} />
                    {mode === 'create' ? 'Crear Campeonato' : 'Actualizar Campeonato'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL DETALLE */}
          {showDetailModal && campeonatoDetalle && (
            <div className="campeonato-modal-overlay">
              <div className="campeonato-modal xl">
                <div className="campeonato-modal-header">
                  <h3 className="campeonato-modal-title">
                    <Trophy size={22} />
                    {campeonatoDetalle.nombre}
                  </h3>
                  <div className="campeonato-modal-header-actions">
                    <div 
                      className="campeonato-estado-badge campeonato-detalle-estado"
                      style={{
                        backgroundColor: getEstadoColor(campeonatoDetalle.estado) + '20',
                        color: getEstadoColor(campeonatoDetalle.estado)
                      }}
                    >
                      {getEstadoLabel(campeonatoDetalle.estado)}
                    </div>
                    <button onClick={closeDetailModal} className="campeonato-modal-close">
                      <X size={22} />
                    </button>
                  </div>
                </div>
                <div className="campeonato-modal-body">
                  <div className="campeonato-detalle">
                    {/* Header con imagen */}
                    <div className="campeonato-detalle-header">
                      <div className="campeonato-detalle-image">
                        {campeonatoDetalle.imagen ? (
                          <img 
                            src={`http://127.0.0.1:8000/storage/${campeonatoDetalle.imagen}`}
                            alt={campeonatoDetalle.nombre}
                            className="campeonato-detalle-image-img"
                          />
                        ) : (
                          <div className="campeonato-detalle-image-placeholder">
                            <Trophy size={48} />
                          </div>
                        )}
                      </div>
                      <div className="campeonato-detalle-info">
                        <h4 className="campeonato-detalle-nombre">{campeonatoDetalle.nombre}</h4>
                        <div className="campeonato-detalle-meta">
                          <div className="campeonato-detalle-meta-item">
                            <Award size={16} />
                            <span>{campeonatoDetalle.categoria}</span>
                          </div>
                          <div className="campeonato-detalle-meta-item">
                            <Calendar size={16} />
                            <span>{new Date(campeonatoDetalle.fecha_inicio).toLocaleDateString()}</span>
                          </div>
                          {campeonatoDetalle.fecha_fin && (
                            <div className="campeonato-detalle-meta-item">
                              <Calendar size={16} />
                              <span>{new Date(campeonatoDetalle.fecha_fin).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="campeonato-detalle-progreso">
                          <div className="campeonato-detalle-progreso-bar">
                            <div 
                              className="campeonato-detalle-progreso-fill"
                              style={{width: `${calcularProgreso(campeonatoDetalle)}%`}}
                            />
                          </div>
                          <div className="campeonato-detalle-progreso-text">
                            {calcularProgreso(campeonatoDetalle)}% completado
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Información */}
                    <div className="campeonato-detalle-grid">
                      <div className="campeonato-detalle-section">
                        <h5 className="campeonato-detalle-section-title">
                          <Users size={18} />
                          Representante
                        </h5>
                        <div className="campeonato-detalle-info-list">
                          <div className="campeonato-detalle-info-item">
                            <strong>Nombre:</strong> {campeonatoDetalle.representante}
                          </div>
                          {campeonatoDetalle.email_representante && (
                            <div className="campeonato-detalle-info-item">
                              <strong>Email:</strong> {campeonatoDetalle.email_representante}
                            </div>
                          )}
                          {campeonatoDetalle.telefono_representante && (
                            <div className="campeonato-detalle-info-item">
                              <strong>Teléfono:</strong> {campeonatoDetalle.telefono_representante}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="campeonato-detalle-section">
                        <h5 className="campeonato-detalle-section-title">
                          <TeamIcon size={18} />
                          Clubes Participantes ({campeonatoDetalle.clubes?.length || 0})
                        </h5>
                        {campeonatoDetalle.clubes && campeonatoDetalle.clubes.length > 0 ? (
                          <div className="campeonato-detalle-clubes">
                            {campeonatoDetalle.clubes.map(club => (
                              <div key={club.id} className="campeonato-detalle-club">
                                <div className="campeonato-detalle-club-avatar">
                                  {club.nombre?.charAt(0)}
                                </div>
                                <div className="campeonato-detalle-club-info">
                                  <div className="campeonato-detalle-club-nombre">{club.nombre}</div>
                                  {club.ciudad && (
                                    <div className="campeonato-detalle-club-ciudad">
                                      <MapPin size={12} />
                                      {club.ciudad}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="campeonato-detalle-empty">
                            <TeamIcon size={24} />
                            <p>No hay clubes inscritos</p>
                            <button 
                              onClick={() => {
                                closeDetailModal();
                                openInscripcionModal(campeonatoDetalle);
                              }}
                              className="campeonato-btn-secondary campeonato-btn-sm"
                            >
                              <TeamIcon size={14} />
                              Inscribir Club
                            </button>
                          </div>
                        )}
                      </div>

                      {campeonatoDetalle.descripcion && (
                        <div className="campeonato-detalle-section full-width">
                          <h5 className="campeonato-detalle-section-title">
                            <FileText size={18} />
                            Descripción
                          </h5>
                          <div className="campeonato-detalle-descripcion">
                            {campeonatoDetalle.descripcion}
                          </div>
                        </div>
                      )}

                      {campeonatoDetalle.reglas && campeonatoDetalle.reglas.length > 0 && (
                        <div className="campeonato-detalle-section full-width">
                          <h5 className="campeonato-detalle-section-title">
                            <BookOpen size={18} />
                            Reglas ({campeonatoDetalle.reglas.length})
                          </h5>
                          <div className="campeonato-detalle-reglas">
                            {campeonatoDetalle.reglas.map((regla, index) => (
                              <div key={index} className="campeonato-detalle-regla">
                                <CheckCircle size={16} />
                                <span>{regla}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="campeonato-modal-footer">
                  <button 
                    onClick={() => openInscripcionModal(campeonatoDetalle)}
                    className="campeonato-btn-primary"
                  >
                    <TeamIcon size={18} />
                    Inscribir Club
                  </button>
                  <button 
                    onClick={() => loadTablaPosiciones(campeonatoDetalle.id)}
                    className="campeonato-btn-secondary"
                  >
                    <BarChart size={18} />
                    Ver Tabla de Posiciones
                  </button>
                  <button onClick={closeDetailModal} className="campeonato-btn-secondary">
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL INSCRIPCIÓN */}
          {showInscripcionModal && selectedCampeonato && (
            <div className="campeonato-modal-overlay">
              <div className="campeonato-modal">
                <div className="campeonato-modal-header">
                  <h3 className="campeonato-modal-title">
                    <TeamIcon size={22} />
                    Inscribir Club
                  </h3>
                  <button onClick={closeInscripcionModal} className="campeonato-modal-close">
                    <X size={22} />
                  </button>
                </div>
                <div className="campeonato-modal-body">
                  <div className="campeonato-form">
                    <div className="campeonato-form-group">
                      <label className="campeonato-form-label">
                        Campeonato
                      </label>
                      <input
                        type="text"
                        value={selectedCampeonato.nombre}
                        className="campeonato-form-input"
                        disabled
                      />
                    </div>

                    <div className="campeonato-form-group">
                      <label className="campeonato-form-label">
                        <TeamIcon size={16} />
                        Club *
                      </label>
                      <select
                        value={formInscripcion.id_club}
                        onChange={(e) => setFormInscripcion({...formInscripcion, id_club: e.target.value})}
                        className="campeonato-form-select"
                      >
                        <option value="">Seleccionar club</option>
                        {clubes.map(club => (
                          <option key={club.id_club} value={club.id_club}>
                            {club.nombre} - {club.ciudad}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="campeonato-form-group">
                      <label className="campeonato-form-label">
                        <Calendar size={16} />
                        Fecha de Inscripción
                      </label>
                      <input
                        type="date"
                        value={formInscripcion.fecha_inscripcion}
                        onChange={(e) => setFormInscripcion({...formInscripcion, fecha_inscripcion: e.target.value})}
                        className="campeonato-form-input"
                      />
                    </div>
                  </div>
                </div>
                <div className="campeonato-modal-footer">
                  <button onClick={closeInscripcionModal} className="campeonato-btn-secondary">
                    Cancelar
                  </button>
                  <button 
                    onClick={inscribirClub}
                    className="campeonato-btn-primary"
                    disabled={!formInscripcion.id_club}
                  >
                    <TeamIcon size={18} />
                    Inscribir Club
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL TABLA DE POSICIONES */}
          {showEstadisticasModal && tablaPosiciones.length > 0 && (
            <div className="campeonato-modal-overlay">
              <div className="campeonato-modal xl">
                <div className="campeonato-modal-header">
                  <h3 className="campeonato-modal-title">
                    <BarChart size={22} />
                    Tabla de Posiciones
                  </h3>
                  <button onClick={closeEstadisticasModal} className="campeonato-modal-close">
                    <X size={22} />
                  </button>
                </div>
                <div className="campeonato-modal-body">
                  <div className="campeonato-tabla-container">
                    <table className="campeonato-tabla-posiciones">
                      <thead>
                        <tr>
                          <th>Pos</th>
                          <th>Club</th>
                          <th>PJ</th>
                          <th>PG</th>
                          <th>PE</th>
                          <th>PP</th>
                          <th>GF</th>
                          <th>GC</th>
                          <th>DG</th>
                          <th>Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tablaPosiciones.map((club, index) => (
                          <tr key={club.id_club}>
                            <td className="campeonato-tabla-pos">{index + 1}</td>
                            <td className="campeonato-tabla-club">{club.nombre}</td>
                            <td>{club.partidos_jugados || 0}</td>
                            <td>{club.partidos_ganados || 0}</td>
                            <td>{club.partidos_empatados || 0}</td>
                            <td>{club.partidos_perdidos || 0}</td>
                            <td>{club.goles_favor || 0}</td>
                            <td>{club.goles_contra || 0}</td>
                            <td>{(club.goles_favor || 0) - (club.goles_contra || 0)}</td>
                            <td className="campeonato-tabla-puntos">{club.puntos || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="campeonato-modal-footer">
                  <button onClick={closeEstadisticasModal} className="campeonato-btn-secondary">
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL FIXTURE */}
          {showFixtureModal && fixture.length > 0 && (
            <div className="campeonato-modal-overlay">
              <div className="campeonato-modal xl">
                <div className="campeonato-modal-header">
                  <h3 className="campeonato-modal-title">
                    <Calendar size={22} />
                    Fixture del Campeonato
                  </h3>
                  <button onClick={closeFixtureModal} className="campeonato-modal-close">
                    <X size={22} />
                  </button>
                </div>
                <div className="campeonato-modal-body">
                  <div className="campeonato-fixture-container">
                    {fixture.map((partido, index) => (
                      <div key={partido.id} className="campeonato-partido">
                        <div className="campeonato-partido-header">
                          <div className="campeonato-partido-fecha">
                            {new Date(partido.fecha).toLocaleDateString()} {partido.hora}
                          </div>
                          <div className="campeonato-partido-estadio">
                            {partido.escenario?.nombre || 'Por definir'}
                          </div>
                        </div>
                        <div className="campeonato-partido-equipos">
                          <div className="campeonato-partido-equipo local">
                            <div className="campeonato-partido-equipo-nombre">
                              {partido.club_local?.nombre}
                            </div>
                            <div className="campeonato-partido-marcador">
                              {partido.goles_local !== null ? partido.goles_local : '-'}
                            </div>
                          </div>
                          <div className="campeonato-partido-vs">vs</div>
                          <div className="campeonato-partido-equipo visitante">
                            <div className="campeonato-partido-marcador">
                              {partido.goles_visitante !== null ? partido.goles_visitante : '-'}
                            </div>
                            <div className="campeonato-partido-equipo-nombre">
                              {partido.club_visitante?.nombre}
                            </div>
                          </div>
                        </div>
                        <div className="campeonato-partido-estado">
                          {partido.estado === 'jugado' ? 'Finalizado' : 
                           partido.estado === 'en_juego' ? 'En Juego' : 
                           partido.estado === 'suspendido' ? 'Suspendido' : 'Programado'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="campeonato-modal-footer">
                  <button onClick={closeFixtureModal} className="campeonato-btn-secondary">
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL GOLEADORES */}
          {showGoleadoresModal && goleadores.length > 0 && (
            <div className="campeonato-modal-overlay">
              <div className="campeonato-modal">
                <div className="campeonato-modal-header">
                  <h3 className="campeonato-modal-title">
                    <Target size={22} />
                    Goleadores del Campeonato
                  </h3>
                  <button onClick={closeGoleadoresModal} className="campeonato-modal-close">
                    <X size={22} />
                  </button>
                </div>
                <div className="campeonato-modal-body">
                  <div className="campeonato-goleadores-container">
                    {goleadores.map((goleador, index) => (
                      <div key={goleador.id_deportista} className="campeonato-goleador">
                        <div className="campeonato-goleador-pos">{index + 1}</div>
                        <div className="campeonato-goleador-avatar">
                          {goleador.deportista?.nombres?.charAt(0)}
                        </div>
                        <div className="campeonato-goleador-info">
                          <div className="campeonato-goleador-nombre">
                            {goleador.deportista?.nombres} {goleador.deportista?.apellidos}
                          </div>
                          <div className="campeonato-goleador-club">
                            {goleador.deportista?.club_actual?.nombre}
                          </div>
                        </div>
                        <div className="campeonato-goleador-goles">
                          <Target size={16} />
                          <span className="campeonato-goleador-goles-count">{goleador.total_goles}</span>
                          goles
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="campeonato-modal-footer">
                  <button onClick={closeGoleadoresModal} className="campeonato-btn-secondary">
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL CONFIRMACIÓN ELIMINACIÓN */}
          {showDeleteModal && selectedCampeonato && (
            <div className="campeonato-modal-overlay">
              <div className="campeonato-modal">
                <div className="campeonato-modal-header warning">
                  <h3 className="campeonato-modal-title">
                    <AlertTriangle size={22} />
                    Confirmar Eliminación
                  </h3>
                  <button onClick={closeDeleteModal} className="campeonato-modal-close">
                    <X size={22} />
                  </button>
                </div>
                <div className="campeonato-modal-body">
                  <div className="campeonato-warning-message">
                    <p>
                      ¿Está seguro de eliminar el campeonato <strong>{selectedCampeonato.nombre}</strong>?
                    </p>
                    <div className="campeonato-warning-details">
                      <div className="campeonato-warning-item">
                        <Trophy size={16} />
                        <span>{selectedCampeonato.categoria}</span>
                      </div>
                      <div className="campeonato-warning-item">
                        <Calendar size={16} />
                        <span>{new Date(selectedCampeonato.fecha_inicio).toLocaleDateString()}</span>
                      </div>
                      <div className="campeonato-warning-item">
                        <TeamIcon size={16} />
                        <span>{selectedCampeonato.clubes?.length || 0} clubes inscritos</span>
                      </div>
                    </div>
                    <div className="campeonato-warning-alert">
                      <AlertTriangle size={16} />
                      Esta acción no se puede deshacer. Se eliminarán todos los datos asociados.
                    </div>
                  </div>
                </div>
                <div className="campeonato-modal-footer">
                  <button onClick={closeDeleteModal} className="campeonato-btn-secondary">
                    Cancelar
                  </button>
                  <button 
                    onClick={deleteCampeonato}
                    className="campeonato-btn-danger"
                  >
                    <Trash2 size={18} />
                    Sí, Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente Circle para las reglas
const Circle = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export default Campeonato;