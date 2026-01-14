import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, X, Filter, Search, RefreshCw, 
  Eye, ChevronLeft, ChevronRight, AlertTriangle, 
  CheckCircle, XCircle, Users, Trophy, Calendar, 
  Download, Upload, MoreVertical, CheckSquare, Square,
  ArrowUpDown, BarChart3, Home, Mail, Phone, MapPin,
  User, Shield, Clock, Activity, TrendingUp, TrendingDown,
  Image, Upload as UploadIcon, Facebook, Twitter, Instagram,
  Globe, UserPlus, Users as UsersIcon, Award, Target
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/club.css';

const API_CLUBES = 'http://127.0.0.1:8000/api/clubes';
const API_JUGADORES = 'http://127.0.0.1:8000/api/deportistas';

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

const Club = () => {
  // Estados principales
  const [clubes, setClubes] = useState([]);
  const [filteredClubes, setFilteredClubes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showJugadorModal, setShowJugadorModal] = useState(false);
  const [mode, setMode] = useState('create');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  
  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage] = useState(15); // Coincide con el paginate(15) del controlador
  
  // Selección masiva
  const [selectedClubes, setSelectedClubes] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Formulario
  const [form, setForm] = useState({
    nombre: '',
    fecha_creacion: '',
    fecha_fundacion: '',
    representante: '',
    email: '',
    telefono: '',
    direccion: '',
    descripcion: '',
    estado: 'activo',
    logo: null,
    redes_sociales: {
      facebook: '',
      twitter: '',
      instagram: '',
      web: ''
    }
  });

  // Formulario jugador
  const [formJugador, setFormJugador] = useState({
    id_deportista: '',
    fecha_ingreso: '',
    numero_camiseta: '',
    observaciones: ''
  });

  // Logo preview
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Obtener ID del club
  const getClubId = (club) => {
    return club.id_club || club.id || 0;
  };

  // Cargar clubes
  const loadClubes = async (page = 1, estado = '', search = '') => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_CLUBES}?page=${page}`;
      
      if (estado && estado !== 'all') {
        url += `&estado=${estado}`;
      }
      
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const headers = authHeaders();
      const res = await fetch(url, { headers });
      
      if (!res.ok) throw new Error('Error al cargar clubes');
      
      const data = await res.json();
      console.log('Datos de clubes recibidos:', data);
      
      // Manejar respuesta paginada de Laravel
      let clubesData = [];
      if (data.data && Array.isArray(data.data)) {
        clubesData = data.data;
        setCurrentPage(data.current_page || page);
        setTotalPages(data.last_page || 1);
        setTotalItems(data.total || data.data.length);
      } else if (Array.isArray(data)) {
        clubesData = data;
        setCurrentPage(1);
        setTotalPages(Math.ceil(data.length / perPage));
        setTotalItems(data.length);
      }
      
      setClubes(clubesData);
      setFilteredClubes(clubesData);
      
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar los clubes. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar jugadores disponibles
  const loadJugadoresDisponibles = async () => {
    try {
      const headers = authHeaders();
      const res = await fetch(`${API_JUGADORES}?disponibles=true`, { headers });
      
      if (res.ok) {
        const data = await res.json();
        setJugadoresDisponibles(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error cargando jugadores:', error);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadClubes();
  }, []);

  // Aplicar filtros y búsqueda en el cliente
  useEffect(() => {
    let filtered = [...clubes];

    // Filtro por estado
    if (estadoFilter !== 'all') {
      filtered = filtered.filter(club => club.estado === estadoFilter);
    }

    // Búsqueda por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(club =>
        (club.nombre && club.nombre.toLowerCase().includes(term)) ||
        (club.representante && club.representante.toLowerCase().includes(term)) ||
        (club.email && club.email.toLowerCase().includes(term)) ||
        (club.direccion && club.direccion.toLowerCase().includes(term))
      );
    }

    // Ordenación
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      return sortOrder === 'asc' ? 
        aValue.localeCompare(bValue) : 
        bValue.localeCompare(aValue);
    });

    setFilteredClubes(filtered);
    setCurrentPage(1);
    setTotalPages(Math.ceil(filtered.length / perPage));
    setSelectedClubes([]);
    setSelectAll(false);
  }, [clubes, searchTerm, estadoFilter, sortBy, sortOrder]);

  // Datos paginados para mostrar
  const paginatedClubes = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    return filteredClubes.slice(startIndex, endIndex);
  }, [filteredClubes, currentPage, perPage]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = clubes.length;
    const activos = clubes.filter(c => c.estado === 'activo').length;
    const inactivos = clubes.filter(c => c.estado === 'inactivo').length;
    const suspendidos = clubes.filter(c => c.estado === 'suspendido').length;
    
    // Total de jugadores en todos los clubes
    const totalJugadores = clubes.reduce((sum, club) => {
      return sum + (club.deportistas_activos_count || club.deportistasActivos?.length || 0);
    }, 0);
    
    // Club con más jugadores
    const clubMasJugadores = [...clubes].sort((a, b) => {
      const aCount = a.deportistas_activos_count || a.deportistasActivos?.length || 0;
      const bCount = b.deportistas_activos_count || b.deportistasActivos?.length || 0;
      return bCount - aCount;
    })[0];
    
    return { 
      total, 
      activos, 
      inactivos, 
      suspendidos,
      totalJugadores,
      clubMasJugadores
    };
  }, [clubes]);

  // CRUD Operations
  const createClub = async () => {
    if (!validateForm()) return;
    
    try {
      const formData = new FormData();
      
      // Agregar campos del formulario
      Object.keys(form).forEach(key => {
        if (key === 'redes_sociales') {
          formData.append(key, JSON.stringify(form[key]));
        } else if (key === 'logo' && form.logo instanceof File) {
          formData.append(key, form.logo);
        } else if (form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });
      
      const headers = authHeaders();
      delete headers['Content-Type']; // FormData establece su propio content-type
      
      const res = await fetch(API_CLUBES, {
        method: 'POST',
        headers,
        body: formData
      });

      const responseData = await res.json();
      
      if (res.ok) {
        closeModal();
        await loadClubes();
        alert('✅ Club creado exitosamente');
      } else {
        handleApiError(responseData);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  const updateClub = async () => {
    if (!validateForm() || !selected) return;
    
    try {
      const formData = new FormData();
      
      // Agregar campos del formulario
      Object.keys(form).forEach(key => {
        if (key === 'redes_sociales') {
          formData.append(key, JSON.stringify(form[key]));
        } else if (key === 'logo' && form.logo instanceof File) {
          formData.append(key, form.logo);
        } else if (form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });
      
      // Método PUT para Laravel
      formData.append('_method', 'PUT');
      
      const headers = authHeaders();
      delete headers['Content-Type'];
      
      const res = await fetch(`${API_CLUBES}/${getClubId(selected)}`, {
        method: 'POST',
        headers,
        body: formData
      });

      const responseData = await res.json();

      if (res.ok) {
        closeModal();
        await loadClubes();
        alert('✅ Club actualizado exitosamente');
      } else {
        handleApiError(responseData);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  const deleteClub = async (id) => {
    if (!id) return;
    
    try {
      const res = await fetch(`${API_CLUBES}/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (res.ok) {
        closeDeleteModal();
        await loadClubes();
        alert('✅ Club eliminado exitosamente');
      } else {
        const error = await res.json();
        alert(`❌ ${error.message || 'Error al eliminar club'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  // Agregar jugador al club
  const agregarJugador = async () => {
    if (!selected) return;
    
    const errors = {};
    if (!formJugador.id_deportista) errors.id_deportista = 'Selecciona un jugador';
    if (!formJugador.fecha_ingreso) errors.fecha_ingreso = 'La fecha de ingreso es requerida';
    
    if (Object.keys(errors).length > 0) {
      alert('Por favor, completa todos los campos requeridos');
      return;
    }
    
    try {
      const res = await fetch(`${API_CLUBES}/${getClubId(selected)}/agregar-jugador`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(formJugador)
      });

      if (res.ok) {
        closeJugadorModal();
        alert('✅ Jugador agregado al club exitosamente');
        
        // Recargar detalles del club
        if (showDetailModal) {
          openDetailModal(selected);
        }
      } else {
        const error = await res.json();
        alert(`❌ ${error.message || 'Error al agregar jugador'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  // Validación
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!form.fecha_creacion) newErrors.fecha_creacion = 'La fecha de creación es requerida';
    if (!form.representante.trim()) newErrors.representante = 'El representante es requerido';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Email inválido';
    
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

  // Logo handling
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('El logo no debe pesar más de 2MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona una imagen válida');
        return;
      }
      
      setForm({...form, logo: file});
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Modal functions
  const openCreateModal = () => {
    setMode('create');
    setForm({
      nombre: '',
      fecha_creacion: new Date().toISOString().split('T')[0],
      fecha_fundacion: '',
      representante: '',
      email: '',
      telefono: '',
      direccion: '',
      descripcion: '',
      estado: 'activo',
      logo: null,
      redes_sociales: {
        facebook: '',
        twitter: '',
        instagram: '',
        web: ''
      }
    });
    setLogoPreview(null);
    setErrors({});
    setSelected(null);
    setShowModal(true);
  };

  const openEditModal = (club) => {
    setMode('edit');
    setSelected(club);
    setForm({ 
      nombre: club.nombre || '',
      fecha_creacion: club.fecha_creacion ? club.fecha_creacion.split('T')[0] : '',
      fecha_fundacion: club.fecha_fundacion ? club.fecha_fundacion.split('T')[0] : '',
      representante: club.representante || '',
      email: club.email || '',
      telefono: club.telefono || '',
      direccion: club.direccion || '',
      descripcion: club.descripcion || '',
      estado: club.estado || 'activo',
      logo: null,
      redes_sociales: club.redes_sociales || {
        facebook: '',
        twitter: '',
        instagram: '',
        web: ''
      }
    });
    setLogoPreview(club.logo ? `http://127.0.0.1:8000/storage/${club.logo}` : null);
    setErrors({});
    setShowModal(true);
  };

  const openDetailModal = async (club) => {
    try {
      const headers = authHeaders();
      const res = await fetch(`${API_CLUBES}/${getClubId(club)}`, { headers });
      
      if (res.ok) {
        const clubDetalle = await res.json();
        setSelected(clubDetalle);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error cargando detalles:', error);
      setSelected(club);
      setShowDetailModal(true);
    }
  };

  const openDeleteModal = (club) => {
    setSelected(club);
    setShowDeleteModal(true);
  };

  const openJugadorModal = async (club) => {
    setSelected(club);
    setFormJugador({
      id_deportista: '',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      numero_camiseta: '',
      observaciones: ''
    });
    
    // Cargar jugadores disponibles
    await loadJugadoresDisponibles();
    setShowJugadorModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowDetailModal(false);
    setErrors({});
    setLogoPreview(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelected(null);
  };

  const closeJugadorModal = () => {
    setShowJugadorModal(false);
    setFormJugador({
      id_deportista: '',
      fecha_ingreso: '',
      numero_camiseta: '',
      observaciones: ''
    });
  };

  // Selection
  const toggleClubSelection = (id) => {
    setSelectedClubes(prev => {
      if (prev.includes(id)) {
        return prev.filter(clubId => clubId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedClubes([]);
    } else {
      const allIds = paginatedClubes.map(c => getClubId(c));
      setSelectedClubes(allIds);
    }
    setSelectAll(!selectAll);
  };

  // Bulk actions
  const bulkToggleEstado = async (estado) => {
    if (selectedClubes.length === 0) {
      alert('❌ Selecciona al menos un club');
      return;
    }

    if (!confirm(`¿Cambiar estado a "${estado}" de ${selectedClubes.length} club(es)?`)) return;

    try {
      const promises = selectedClubes.map(id => 
        fetch(`${API_CLUBES}/${id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ estado })
        })
      );

      await Promise.all(promises);
      await loadClubes();
      alert(`✅ ${selectedClubes.length} club(es) actualizado(s) exitosamente`);
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error en la operación masiva');
    }
  };

  const bulkDelete = async () => {
    if (selectedClubes.length === 0) {
      alert('❌ Selecciona al menos un club');
      return;
    }

    if (!confirm(`¿Eliminar ${selectedClubes.length} club(es)? Esta acción no se puede deshacer.`)) return;

    try {
      const promises = selectedClubes.map(id => 
        fetch(`${API_CLUBES}/${id}`, {
          method: 'DELETE',
          headers: authHeaders()
        })
      );

      await Promise.all(promises);
      await loadClubes();
      alert(`✅ ${selectedClubes.length} club(es) eliminado(s) exitosamente`);
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error en la eliminación masiva');
    }
  };

  // Obtener color del estado
  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'activo': return '#10b981';
      case 'inactivo': return '#6b7280';
      case 'suspendido': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  // Obtener icono del estado
  const getEstadoIcon = (estado) => {
    switch(estado) {
      case 'activo': return <CheckCircle size={14} />;
      case 'inactivo': return <XCircle size={14} />;
      case 'suspendido': return <AlertTriangle size={14} />;
      default: return <XCircle size={14} />;
    }
  };

  // Manejar cambio de filtro
  const handleFilterChange = async () => {
    await loadClubes(1, estadoFilter !== 'all' ? estadoFilter : '', searchTerm);
  };

  return (
    <div className="club-container">
      <Sidebar />
      
      <div className="club-content">
        <Topbar />
        
        {/* HEADER */}
        <div className="club-header">
          <div style={{flex: 1, minWidth: 0}}>
            <h1 className="club-title">
              <Trophy size={28} />
              Gestión de Clubes
            </h1>
            <p className="club-subtitle">
              Administra los clubes deportivos del sistema
            </p>
          </div>
          
          <div className="club-header-actions">
            <button 
              onClick={() => loadClubes()} 
              className="club-btn club-btn-secondary"
              disabled={loading}
              title="Actualizar lista"
            >
              <RefreshCw size={20} /> <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button 
              onClick={openCreateModal} 
              className="club-btn club-btn-primary"
              style={{flexShrink: 0}}
            >
              <Plus size={20} /> <span className="hidden sm:inline">Nuevo Club</span>
            </button>
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        <div className="club-stats-grid">
          <div className="club-stat-card">
            <div className="club-stat-icon" style={{backgroundColor: '#f0f9ff', color: '#0ea5e9'}}>
              <Trophy size={24} />
            </div>
            <div>
              <h3 className="club-stat-number">{stats.total}</h3>
              <p className="club-stat-label">Total Clubes</p>
            </div>
          </div>
          
          <div className="club-stat-card">
            <div className="club-stat-icon" style={{backgroundColor: '#d1fae5', color: '#10b981'}}>
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="club-stat-number">{stats.activos}</h3>
              <p className="club-stat-label">Clubes Activos</p>
            </div>
          </div>
          
          <div className="club-stat-card">
            <div className="club-stat-icon" style={{backgroundColor: '#fef3c7', color: '#f59e0b'}}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="club-stat-number">{stats.suspendidos}</h3>
              <p className="club-stat-label">Clubes Suspendidos</p>
            </div>
          </div>
          
          <div className="club-stat-card">
            <div className="club-stat-icon" style={{backgroundColor: '#f0f9ff', color: '#0ea5e9'}}>
              <Users size={24} />
            </div>
            <div>
              <h3 className="club-stat-number">{stats.totalJugadores}</h3>
              <p className="club-stat-label">Jugadores Totales</p>
            </div>
          </div>
        </div>

        {/* BARRA DE HERRAMIENTAS */}
        <div className="club-toolbar">
          <div className="club-toolbar-row">
            <div className="club-search-container">
              <div className="club-search">
                <Search className="club-search-icon" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                  className="club-search-input"
                  placeholder="Buscar clubes por nombre, representante o email..."
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="club-filters">
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="club-filter-select"
                disabled={loading}
              >
                <option value="all">Todos los estados</option>
                <option value="activo">Solo activos</option>
                <option value="inactivo">Solo inactivos</option>
                <option value="suspendido">Solo suspendidos</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="club-btn club-btn-secondary"
                disabled={loading}
              >
                <ArrowUpDown size={18} />
                {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
              </button>
              
              <button
                onClick={handleFilterChange}
                className="club-btn club-btn-primary"
                disabled={loading}
              >
                <Filter size={18} />
                Filtrar
              </button>
            </div>
          </div>
          
          {/* ACCIONES MASIVAS */}
          {selectedClubes.length > 0 && (
            <div className="club-toolbar-actions">
              <div className="club-bulk-actions">
                <span className="club-bulk-info">
                  {selectedClubes.length} club(es) seleccionado(s)
                </span>
                <button
                  onClick={() => bulkToggleEstado('activo')}
                  className="club-btn club-btn-success club-btn-sm"
                  disabled={loading}
                >
                  <CheckCircle size={16} /> Activar
                </button>
                <button
                  onClick={() => bulkToggleEstado('inactivo')}
                  className="club-btn club-btn-warning club-btn-sm"
                  disabled={loading}
                >
                  <XCircle size={16} /> Inactivar
                </button>
                <button
                  onClick={() => bulkToggleEstado('suspendido')}
                  className="club-btn club-btn-warning club-btn-sm"
                  disabled={loading}
                >
                  <AlertTriangle size={16} /> Suspender
                </button>
                <button
                  onClick={bulkDelete}
                  className="club-btn club-btn-danger club-btn-sm"
                  disabled={loading}
                >
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
              
              <div className="club-action-buttons">
                <button
                  onClick={() => setSelectedClubes([])}
                  className="club-btn club-btn-secondary club-btn-icon"
                  title="Limpiar selección"
                  disabled={selectedClubes.length === 0 || loading}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CONTENIDO PRINCIPAL */}
        {loading ? (
          <div className="club-loading">
            <div className="club-loading-spinner"></div>
            <p>Cargando clubes...</p>
          </div>
        ) : error ? (
          <div className="club-error">
            <AlertTriangle size={48} className="club-error-icon" />
            <h3>Error al cargar clubes</h3>
            <p>{error}</p>
            <button onClick={() => loadClubes()} className="club-btn club-btn-primary" style={{marginTop: '1rem'}}>
              <RefreshCw size={18} /> Reintentar
            </button>
          </div>
        ) : filteredClubes.length === 0 ? (
          <div className="club-empty-state">
            <Trophy size={64} className="club-empty-state-icon" />
            <h3>
              {searchTerm || estadoFilter !== 'all' ? 'No se encontraron resultados' : 'No hay clubes registrados'}
            </h3>
            <p>
              {searchTerm || estadoFilter !== 'all' 
                ? 'Intenta con otros términos de búsqueda o filtros' 
                : 'Comienza creando tu primer club deportivo'}
            </p>
            <button onClick={openCreateModal} className="club-btn club-btn-primary" style={{marginTop: '1.5rem'}}>
              <Plus size={18} /> Crear Club
            </button>
          </div>
        ) : (
          <>
            <div className="club-table-container">
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
                  Mostrando {filteredClubes.length} de {totalItems} clubes
                  {searchTerm && ` para "${searchTerm}"`}
                  {estadoFilter !== 'all' && ` con estado "${estadoFilter}"`}
                </div>
                {totalPages > 1 && (
                  <div className="text-secondary">
                    Página {currentPage} de {totalPages}
                  </div>
                )}
              </div>
              
              <table className="club-table">
                <thead>
                  <tr>
                    <th style={{width: '50px', minWidth: '50px'}}>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="club-checkbox"
                        disabled={loading}
                      />
                    </th>
                    <th style={{minWidth: '80px'}}>Logo</th>
                    <th 
                      className="sortable" 
                      onClick={() => setSortBy('nombre')}
                      style={{cursor: 'pointer', minWidth: '180px'}}
                    >
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <Trophy size={14} className="hidden sm:inline" />
                        <span>Nombre</span>
                        {sortBy === 'nombre' && (
                          <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th style={{minWidth: '200px'}}>Información</th>
                    <th style={{minWidth: '100px'}}>Jugadores</th>
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
                    <th 
                      className="sortable" 
                      onClick={() => setSortBy('fecha_creacion')}
                      style={{cursor: 'pointer', minWidth: '120px'}}
                    >
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <Calendar size={14} className="hidden sm:inline" />
                        <span>Creado</span>
                        {sortBy === 'fecha_creacion' && (
                          <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th style={{minWidth: '140px'}}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClubes.map(club => {
                    const clubId = getClubId(club);
                    const isSelected = selectedClubes.includes(clubId);
                    const jugadoresCount = club.deportistas_activos_count || club.deportistasActivos?.length || 0;
                    
                    return (
                      <tr key={clubId} className={isSelected ? 'selected' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleClubSelection(clubId)}
                            className="club-checkbox"
                          />
                        </td>
                        <td>
                          {club.logo ? (
                            <img 
                              src={`http://127.0.0.1:8000/storage/${club.logo}`}
                              alt={club.nombre}
                              className="club-logo"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="club-logo-placeholder" 
                            style={{display: club.logo ? 'none' : 'flex'}}
                          >
                            <Trophy size={20} />
                          </div>
                        </td>
                        <td>
                          <div style={{fontWeight: '600', color: '#1f2937'}}>{club.nombre}</div>
                          <div style={{fontSize: '0.875rem', color: '#6b7280', marginTop: '2px'}}>
                            {club.representante}
                          </div>
                        </td>
                        <td>
                          <div style={{fontSize: '0.875rem'}}>
                            {club.email && (
                              <div className="club-info-item">
                                <Mail size={12} style={{flexShrink: 0}} />
                                <span className="truncate">{club.email}</span>
                              </div>
                            )}
                            {club.telefono && (
                              <div className="club-info-item">
                                <Phone size={12} style={{flexShrink: 0}} />
                                <span className="truncate">{club.telefono}</span>
                              </div>
                            )}
                            {club.direccion && (
                              <div className="club-info-item">
                                <MapPin size={12} style={{flexShrink: 0}} />
                                <span className="truncate">{club.direccion}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="club-jugadores-count">
                            <Users size={16} />
                            <span>{jugadoresCount}</span>
                          </div>
                          {jugadoresCount > 0 && (
                            <button 
                              onClick={() => openDetailModal(club)}
                              className="club-view-jugadores"
                            >
                              Ver jugadores
                            </button>
                          )}
                        </td>
                        <td>
                          <div 
                            className="club-estado-badge"
                            style={{
                              backgroundColor: getEstadoColor(club.estado) + '20',
                              color: getEstadoColor(club.estado),
                              borderColor: getEstadoColor(club.estado)
                            }}
                          >
                            {getEstadoIcon(club.estado)}
                            <span>{club.estado}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                            {club.fecha_creacion ? new Date(club.fecha_creacion).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td>
                          <div className="club-action-buttons">
                            <button
                              onClick={() => openDetailModal(club)}
                              className="club-btn-action club-btn-view"
                              title="Ver detalles"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(club)}
                              className="club-btn-action club-btn-edit"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => openJugadorModal(club)}
                              className="club-btn-action club-btn-success"
                              title="Agregar jugador"
                            >
                              <UserPlus size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(club)}
                              className="club-btn-action club-btn-danger"
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
                <div className="club-pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || loading}
                    className="club-pagination-btn"
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
                        className={`club-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        disabled={loading}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="club-pagination-ellipsis">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="club-pagination-btn"
                        disabled={loading}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || loading}
                    className="club-pagination-btn"
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
          <div className="club-modal-overlay">
            <div className="club-modal">
              <div className="club-modal-header">
                <h2 className="club-modal-title">
                  <Trophy size={22} />
                  {mode === 'create' ? 'Nuevo Club' : 'Editar Club'}
                </h2>
                <button onClick={closeModal} className="club-modal-close">
                  <X size={22} />
                </button>
              </div>

              <div className="club-modal-content">
                {/* Logo upload */}
                <div className="club-logo-upload-section">
                  <div className="club-logo-preview">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="club-logo-preview-img" />
                    ) : (
                      <div className="club-logo-placeholder">
                        <Image size={24} />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="club-file-input"
                    />
                    <label htmlFor="logo-upload" className="club-btn club-btn-secondary">
                      <UploadIcon size={16} />
                      {form.logo instanceof File ? 'Cambiar Logo' : 'Subir Logo'}
                    </label>
                    <p className="club-file-hint">Máx. 2MB. Formatos: JPG, PNG, GIF</p>
                  </div>
                </div>

                {/* Formulario */}
                <div className="club-form-grid">
                  <div className="club-form-group">
                    <label className="club-form-label">
                      <Trophy size={16} />
                      Nombre del Club *
                    </label>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={(e) => setForm({...form, nombre: e.target.value})}
                      className={`club-form-input ${errors.nombre ? 'error' : ''}`}
                      placeholder="Ej: Club Deportivo..."
                    />
                    {errors.nombre && <span className="club-form-error">{errors.nombre}</span>}
                  </div>

                  <div className="club-form-group">
                    <label className="club-form-label">
                      <User size={16} />
                      Representante *
                    </label>
                    <input
                      type="text"
                      value={form.representante}
                      onChange={(e) => setForm({...form, representante: e.target.value})}
                      className={`club-form-input ${errors.representante ? 'error' : ''}`}
                      placeholder="Nombre del representante"
                    />
                    {errors.representante && <span className="club-form-error">{errors.representante}</span>}
                  </div>

                  <div className="club-form-group">
                    <label className="club-form-label">
                      <Calendar size={16} />
                      Fecha de Creación *
                    </label>
                    <input
                      type="date"
                      value={form.fecha_creacion}
                      onChange={(e) => setForm({...form, fecha_creacion: e.target.value})}
                      className={`club-form-input ${errors.fecha_creacion ? 'error' : ''}`}
                    />
                    {errors.fecha_creacion && <span className="club-form-error">{errors.fecha_creacion}</span>}
                  </div>

                  <div className="club-form-group">
                    <label className="club-form-label">
                      <Calendar size={16} />
                      Fecha de Fundación
                    </label>
                    <input
                      type="date"
                      value={form.fecha_fundacion}
                      onChange={(e) => setForm({...form, fecha_fundacion: e.target.value})}
                      className="club-form-input"
                    />
                  </div>

                  <div className="club-form-group">
                    <label className="club-form-label">
                      <Mail size={16} />
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({...form, email: e.target.value})}
                      className={`club-form-input ${errors.email ? 'error' : ''}`}
                      placeholder="club@ejemplo.com"
                    />
                    {errors.email && <span className="club-form-error">{errors.email}</span>}
                  </div>

                  <div className="club-form-group">
                    <label className="club-form-label">
                      <Phone size={16} />
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={form.telefono}
                      onChange={(e) => setForm({...form, telefono: e.target.value})}
                      className="club-form-input"
                      placeholder="+1234567890"
                    />
                  </div>

                  <div className="club-form-group col-span-2">
                    <label className="club-form-label">
                      <MapPin size={16} />
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={form.direccion}
                      onChange={(e) => setForm({...form, direccion: e.target.value})}
                      className="club-form-input"
                      placeholder="Dirección completa"
                    />
                  </div>

                  <div className="club-form-group col-span-2">
                    <label className="club-form-label">
                      <Shield size={16} />
                      Estado
                    </label>
                    <select
                      value={form.estado}
                      onChange={(e) => setForm({...form, estado: e.target.value})}
                      className="club-form-select"
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="suspendido">Suspendido</option>
                    </select>
                  </div>

                  <div className="club-form-group col-span-2">
                    <label className="club-form-label">
                      <Award size={16} />
                      Descripción
                    </label>
                    <textarea
                      value={form.descripcion}
                      onChange={(e) => setForm({...form, descripcion: e.target.value})}
                      className="club-form-textarea"
                      rows="3"
                      placeholder="Breve descripción del club..."
                    />
                  </div>

                  {/* Redes Sociales */}
                  <div className="club-form-group col-span-2">
                    <label className="club-form-label">
                      <Globe size={16} />
                      Redes Sociales
                    </label>
                    <div className="club-redes-grid">
                      <div className="club-redes-item">
                        <Facebook size={16} />
                        <input
                          type="url"
                          value={form.redes_sociales.facebook}
                          onChange={(e) => setForm({
                            ...form, 
                            redes_sociales: {...form.redes_sociales, facebook: e.target.value}
                          })}
                          className="club-form-input"
                          placeholder="Facebook URL"
                        />
                      </div>
                      <div className="club-redes-item">
                        <Twitter size={16} />
                        <input
                          type="url"
                          value={form.redes_sociales.twitter}
                          onChange={(e) => setForm({
                            ...form, 
                            redes_sociales: {...form.redes_sociales, twitter: e.target.value}
                          })}
                          className="club-form-input"
                          placeholder="Twitter URL"
                        />
                      </div>
                      <div className="club-redes-item">
                        <Instagram size={16} />
                        <input
                          type="url"
                          value={form.redes_sociales.instagram}
                          onChange={(e) => setForm({
                            ...form, 
                            redes_sociales: {...form.redes_sociales, instagram: e.target.value}
                          })}
                          className="club-form-input"
                          placeholder="Instagram URL"
                        />
                      </div>
                      <div className="club-redes-item">
                        <Globe size={16} />
                        <input
                          type="url"
                          value={form.redes_sociales.web}
                          onChange={(e) => setForm({
                            ...form, 
                            redes_sociales: {...form.redes_sociales, web: e.target.value}
                          })}
                          className="club-form-input"
                          placeholder="Sitio Web"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="club-modal-footer">
                <button onClick={closeModal} className="club-btn club-btn-secondary">
                  <X size={18} /> Cancelar
                </button>
                <button 
                  onClick={mode === 'create' ? createClub : updateClub} 
                  className="club-btn club-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Guardando...
                    </>
                  ) : mode === 'create' ? (
                    <>
                      <Plus size={18} /> Crear Club
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

        {/* MODAL DE DETALLE */}
        {showDetailModal && selected && (
          <div className="club-modal-overlay">
            <div className="club-modal club-modal-lg">
              <div className="club-modal-header">
                <h2 className="club-modal-title">
                  <Trophy size={22} />
                  {selected.nombre}
                </h2>
                <div className="club-modal-header-actions">
                  <button 
                    onClick={() => openJugadorModal(selected)}
                    className="club-btn club-btn-success club-btn-sm"
                  >
                    <UserPlus size={16} /> Agregar Jugador
                  </button>
                  <button onClick={closeModal} className="club-modal-close">
                    <X size={22} />
                  </button>
                </div>
              </div>

              <div className="club-modal-content">
                {/* Header del club */}
                <div className="club-detail-header">
                  <div className="club-detail-logo">
                    {selected.logo ? (
                      <img 
                        src={`http://127.0.0.1:8000/storage/${selected.logo}`}
                        alt={selected.nombre}
                        className="club-detail-logo-img"
                      />
                    ) : (
                      <div className="club-detail-logo-placeholder">
                        <Trophy size={32} />
                      </div>
                    )}
                  </div>
                  <div className="club-detail-header-info">
                    <h3 className="club-detail-name">{selected.nombre}</h3>
                    <div className="club-detail-estado">
                      <div 
                        className="club-estado-badge"
                        style={{
                          backgroundColor: getEstadoColor(selected.estado) + '20',
                          color: getEstadoColor(selected.estado),
                          borderColor: getEstadoColor(selected.estado)
                        }}
                      >
                        {getEstadoIcon(selected.estado)}
                        <span>{selected.estado}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información principal */}
                <div className="club-detail-grid">
                  <div className="club-detail-section">
                    <h4 className="club-detail-section-title">
                      <Shield size={18} />
                      Información General
                    </h4>
                    <div className="club-detail-info-list">
                      <div className="club-detail-info-item">
                        <span className="club-detail-info-label">Representante:</span>
                        <span className="club-detail-info-value">{selected.representante}</span>
                      </div>
                      <div className="club-detail-info-item">
                        <span className="club-detail-info-label">Fecha Creación:</span>
                        <span className="club-detail-info-value">
                          {new Date(selected.fecha_creacion).toLocaleDateString()}
                        </span>
                      </div>
                      {selected.fecha_fundacion && (
                        <div className="club-detail-info-item">
                          <span className="club-detail-info-label">Fecha Fundación:</span>
                          <span className="club-detail-info-value">
                            {new Date(selected.fecha_fundacion).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="club-detail-section">
                    <h4 className="club-detail-section-title">
                      <Users size={18} />
                      Jugadores ({selected.deportistasActivos?.length || 0})
                    </h4>
                    {selected.deportistasActivos && selected.deportistasActivos.length > 0 ? (
                      <div className="club-jugadores-list">
                        {selected.deportistasActivos.slice(0, 5).map(jugador => (
                          <div key={jugador.id_deportista} className="club-jugador-item">
                            <div className="club-jugador-avatar">
                              {jugador.nombre?.charAt(0) || 'J'}
                            </div>
                            <div className="club-jugador-info">
                              <span className="club-jugador-name">
                                {jugador.nombre} {jugador.apellido}
                              </span>
                              {jugador.numero_camiseta && (
                                <span className="club-jugador-number">
                                  #{jugador.numero_camiseta}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {selected.deportistasActivos.length > 5 && (
                          <div className="club-jugadores-more">
                            +{selected.deportistasActivos.length - 5} más
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="club-no-jugadores">
                        <Users size={24} />
                        <span>No hay jugadores en este club</span>
                        <button 
                          onClick={() => openJugadorModal(selected)}
                          className="club-btn club-btn-success club-btn-sm"
                          style={{marginTop: '0.5rem'}}
                        >
                          <UserPlus size={16} /> Agregar Primer Jugador
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="club-detail-section">
                    <h4 className="club-detail-section-title">
                      <Home size={18} />
                      Contacto
                    </h4>
                    <div className="club-detail-info-list">
                      {selected.email && (
                        <div className="club-detail-info-item">
                          <span className="club-detail-info-label">Email:</span>
                          <a href={`mailto:${selected.email}`} className="club-detail-info-link">
                            {selected.email}
                          </a>
                        </div>
                      )}
                      {selected.telefono && (
                        <div className="club-detail-info-item">
                          <span className="club-detail-info-label">Teléfono:</span>
                          <a href={`tel:${selected.telefono}`} className="club-detail-info-link">
                            {selected.telefono}
                          </a>
                        </div>
                      )}
                      {selected.direccion && (
                        <div className="club-detail-info-item">
                          <span className="club-detail-info-label">Dirección:</span>
                          <span className="club-detail-info-value">{selected.direccion}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selected.descripcion && (
                    <div className="club-detail-section">
                      <h4 className="club-detail-section-title">
                        <Award size={18} />
                        Descripción
                      </h4>
                      <p className="club-detail-description">{selected.descripcion}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="club-modal-footer">
                <button onClick={() => openEditModal(selected)} className="club-btn club-btn-primary">
                  <Edit2 size={18} /> Editar Club
                </button>
                <button onClick={closeModal} className="club-btn club-btn-secondary">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
        {showDeleteModal && selected && (
          <div className="club-modal-overlay">
            <div className="club-modal club-modal-sm">
              <div className="club-modal-header">
                <h2 className="club-modal-title">
                  <AlertTriangle size={22} />
                  Confirmar Eliminación
                </h2>
                <button onClick={closeDeleteModal} className="club-modal-close">
                  <X size={22} />
                </button>
              </div>

              <div className="club-modal-content">
                <div className="club-delete-content">
                  <AlertTriangle size={48} className="club-delete-icon" />
                  <h3 className="club-delete-title">¿Eliminar club?</h3>
                  <p className="club-delete-message">
                    Estás por eliminar el club <strong>{selected.nombre}</strong>.
                    Esta acción no se puede deshacer.
                  </p>
                  <p className="club-delete-warning">
                    ⚠️ Se eliminarán todos los datos asociados al club.
                  </p>
                </div>
              </div>

              <div className="club-modal-footer">
                <button onClick={closeDeleteModal} className="club-btn club-btn-secondary">
                  <X size={18} /> Cancelar
                </button>
                <button 
                  onClick={() => deleteClub(getClubId(selected))} 
                  className="club-btn club-btn-danger"
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

        {/* MODAL PARA AGREGAR JUGADOR */}
        {showJugadorModal && selected && (
          <div className="club-modal-overlay">
            <div className="club-modal">
              <div className="club-modal-header">
                <h2 className="club-modal-title">
                  <UserPlus size={22} />
                  Agregar Jugador al Club
                </h2>
                <button onClick={closeJugadorModal} className="club-modal-close">
                  <X size={22} />
                </button>
              </div>

              <div className="club-modal-content">
                <div className="club-form-group">
                  <label className="club-form-label">
                    <UsersIcon size={16} />
                    Seleccionar Jugador *
                  </label>
                  <select
                    value={formJugador.id_deportista}
                    onChange={(e) => setFormJugador({...formJugador, id_deportista: e.target.value})}
                    className="club-form-select"
                    required
                  >
                    <option value="">-- Selecciona un jugador --</option>
                    {jugadoresDisponibles.map(jugador => (
                      <option key={jugador.id_deportista} value={jugador.id_deportista}>
                        {jugador.nombre} {jugador.apellido} - {jugador.documento}
                      </option>
                    ))}
                  </select>
                  {jugadoresDisponibles.length === 0 && (
                    <div className="club-no-jugadores-msg">
                      <AlertTriangle size={16} />
                      <span>No hay jugadores disponibles. Primero crea jugadores en el módulo de Deportistas.</span>
                    </div>
                  )}
                </div>

                <div className="club-form-group">
                  <label className="club-form-label">
                    <Calendar size={16} />
                    Fecha de Ingreso *
                  </label>
                  <input
                    type="date"
                    value={formJugador.fecha_ingreso}
                    onChange={(e) => setFormJugador({...formJugador, fecha_ingreso: e.target.value})}
                    className="club-form-input"
                    required
                  />
                </div>

                <div className="club-form-group">
                  <label className="club-form-label">
                    <Target size={16} />
                    Número de Camiseta
                  </label>
                  <input
                    type="number"
                    value={formJugador.numero_camiseta}
                    onChange={(e) => setFormJugador({...formJugador, numero_camiseta: e.target.value})}
                    className="club-form-input"
                    placeholder="Ej: 10"
                    min="1"
                    max="99"
                  />
                </div>

                <div className="club-form-group">
                  <label className="club-form-label">
                    <Award size={16} />
                    Observaciones
                  </label>
                  <textarea
                    value={formJugador.observaciones}
                    onChange={(e) => setFormJugador({...formJugador, observaciones: e.target.value})}
                    className="club-form-textarea"
                    rows="2"
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>

              <div className="club-modal-footer">
                <button onClick={closeJugadorModal} className="club-btn club-btn-secondary">
                  <X size={18} /> Cancelar
                </button>
                <button 
                  onClick={agregarJugador} 
                  className="club-btn club-btn-success"
                  disabled={loading || jugadoresDisponibles.length === 0}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} /> Agregar Jugador
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

export default Club;