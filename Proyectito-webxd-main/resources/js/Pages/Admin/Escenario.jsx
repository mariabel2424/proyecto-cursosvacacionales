import React, { useState, useEffect } from 'react';
import {
  MapPin, Calendar, Users, Tag, Clock, Building,
  CheckCircle, XCircle, AlertTriangle, Filter,
  Search, Plus, Edit2, Trash2, Eye, RefreshCw,
  Star, Shield, Zap, Wifi, Droplets, Thermometer,
  Volume2, Sun, Moon, Wind, ChevronRight,
  ChevronLeft, Download, Upload, Share2, Settings,
  BarChart, TrendingUp, Home, Settings as SettingsIcon,
  MoreVertical, ExternalLink, Copy, Heart, Bookmark,
  MessageSquare, ThumbsUp, Award, Target, Activity
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/escenario.css';

const API_ESCENARIOS = 'http://127.0.0.1:8000/api/escenarios';

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

const Escenario = () => {
  // Estados principales
  const [escenarios, setEscenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDisponibilidadModal, setShowDisponibilidadModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  
  const [selectedEscenario, setSelectedEscenario] = useState(null);
  const [selectedFecha, setSelectedFecha] = useState('');
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Formularios
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'cancha',
    capacidad: 20,
    descripcion: '',
    direccion: '',
    estado: 'disponible',
    servicios: []
  });
  
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Estados disponibles
  const estados = [
    { value: 'disponible', label: 'Disponible', color: '#10b981', icon: CheckCircle },
    { value: 'ocupado', label: 'Ocupado', color: '#f59e0b', icon: Clock },
    { value: 'mantenimiento', label: 'Mantenimiento', color: '#ef4444', icon: AlertTriangle },
    { value: 'cerrado', label: 'Cerrado', color: '#6b7280', icon: XCircle }
  ];

  // Tipos de escenarios
  const tipos = [
    { value: 'cancha', label: 'Cancha', icon: Home, color: '#10b981' },
    { value: 'gimnasio', label: 'Gimnasio', icon: Activity, color: '#3b82f6' },
    { value: 'piscina', label: 'Piscina', icon: Droplets, color: '#06b6d4' },
    { value: 'sala', label: 'Sala', icon: Building, color: '#8b5cf6' },
    { value: 'auditorio', label: 'Auditorio', icon: Volume2, color: '#f59e0b' },
    { value: 'pista', label: 'Pista', icon: Wind, color: '#84cc16' }
  ];

  // Servicios disponibles
  const serviciosOptions = [
    { id: 'iluminacion', label: 'Iluminación', icon: Sun },
    { id: 'vestuarios', label: 'Vestuarios', icon: Shield },
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'agua', label: 'Agua Potable', icon: Droplets },
    { id: 'climatizacion', label: 'Climatización', icon: Thermometer },
    { id: 'sonido', label: 'Sistema de Sonido', icon: Volume2 },
    { id: 'gradas', label: 'Gradas', icon: Users },
    { id: 'parking', label: 'Estacionamiento', icon: Shield }
  ];

  // Funciones helper para obtener configuraciones
  const getEstadoConfig = (estado) => {
    return estados.find(e => e.value === estado) || estados[0];
  };

  const getTipoConfig = (tipo) => {
    return tipos.find(t => t.value === tipo) || tipos[0];
  };

  const formatServicios = (servicios) => {
    if (!servicios || !Array.isArray(servicios)) return [];
    return servicios.map(servicioId => {
      const servicio = serviciosOptions.find(s => s.id === servicioId);
      return servicio || { id: servicioId, label: servicioId, icon: CheckCircle };
    });
  };

  // Cargar escenarios
  const loadEscenarios = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: currentPage
      };
      
      if (estadoFilter !== 'all') params.estado = estadoFilter;
      if (tipoFilter !== 'all') params.tipo = tipoFilter;
      if (searchTerm.trim() !== '') params.search = searchTerm;
      
      const queryParams = new URLSearchParams(params);
      const url = `${API_ESCENARIOS}?${queryParams}`;
      
      const response = await fetch(url, {
        headers: authHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setEscenarios(data.data || []);
      setTotalPages(data.last_page || 1);
      
    } catch (err) {
      console.error('Error cargando escenarios:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar disponibilidad
  const loadDisponibilidad = async (id, fecha) => {
    try {
      const response = await fetch(`${API_ESCENARIOS}/${id}/disponibilidad?fecha=${fecha}`, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error cargando disponibilidad:', error);
    }
    return null;
  };

  // CRUD operations
const createEscenario = async () => {
  setErrors({});
  
  try {
    const formDataToSend = new FormData();
    
    console.log('📤 Datos del formulario:', formData);
    
    // Agrega todos los campos al FormData
Object.keys(formData).forEach(key => {
  if (key === 'servicios' && Array.isArray(formData[key])) {
    // Enviar cada servicio como elemento separado del array
    formData[key].forEach((servicio, index) => {
      formDataToSend.append(`${key}[${index}]`, servicio);
    });
  } else if (key === 'imagen' && formData[key]) {
    formDataToSend.append(key, formData[key]);
  } else if (formData[key] !== null && formData[key] !== undefined) {
    formDataToSend.append(key, formData[key]);
  }
});
    // Debug: Mostrar lo que se está enviando
    console.log('📦 FormData enviado:');
    for (let [key, value] of formDataToSend.entries()) {
      console.log(`${key}:`, value);
    }
    
    const token = localStorage.getItem('token');
    console.log('🔐 Token:', token ? 'Presente' : 'Ausente');
    
    const response = await fetch(API_ESCENARIOS, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // NO incluir 'Content-Type' para FormData - el navegador lo establece automáticamente con el boundary
        'Accept': 'application/json'
      },
      body: formDataToSend
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📦 Response data:', data);
    
    if (response.ok) {
      alert('✅ Escenario creado exitosamente');
      closeCreateModal();
      loadEscenarios();
    } else {
      console.error('❌ Error del backend:', data);
      setErrors(data.errors || data.message || { message: 'Error al crear escenario' });
      
      // Mostrar errores específicos
      if (data.errors) {
        Object.keys(data.errors).forEach(key => {
          console.error(`❌ Error en ${key}:`, data.errors[key]);
        });
      }
      
      alert(`❌ Error: ${data.message || 'Revise los datos ingresados'}`);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    setErrors({ message: 'Error de conexión' });
    alert('❌ Error de conexión con el servidor');
  }
};

  const updateEscenario = async () => {
  setErrors({});
  
  if (!selectedEscenario) return;
  
  try {
    const formDataToSend = new FormData();
    
    console.log('📤 Datos para actualizar:', formData);
    
    // Agrega todos los campos al FormData
    Object.keys(formData).forEach(key => {
      if (key === 'servicios' && Array.isArray(formData[key])) {
        // Si servicios es un array, enviar cada elemento por separado
        formData[key].forEach((servicio, index) => {
          formDataToSend.append(`${key}[${index}]`, servicio);
        });
      } else if (key === 'imagen' && formData[key]) {
        // Solo enviar la imagen si hay una nueva
        if (typeof formData[key] !== 'string') { // Si no es una URL string
          formDataToSend.append(key, formData[key]);
        }
      } else if (formData[key] !== undefined && formData[key] !== null) {
        formDataToSend.append(key, formData[key]);
      }
    });
    
    // Agregar método PUT para Laravel (si usas _method)
    formDataToSend.append('_method', 'PUT');
    
    // Debug: Mostrar lo que se está enviando
    console.log('📦 FormData enviado para actualizar:');
    for (let [key, value] of formDataToSend.entries()) {
      console.log(`${key}:`, value);
    }
    
    const token = localStorage.getItem('token');
    console.log('🔐 Token:', token ? 'Presente' : 'Ausente');
    
    const response = await fetch(`${API_ESCENARIOS}/${selectedEscenario.id_escenario}`, {
      method: 'POST', // Usamos POST con _method=PUT para Laravel
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
        // NO incluir 'Content-Type' para FormData
      },
      body: formDataToSend
    });
    
    console.log('📊 Response status:', response.status);
    
    const data = await response.json();
    console.log('📦 Response data:', data);
    
    if (response.ok) {
      alert('✅ Escenario actualizado exitosamente');
      closeEditModal();
      loadEscenarios();
    } else {
      console.error('❌ Error del backend:', data);
      setErrors(data.errors || { message: data.message || 'Error al actualizar escenario' });
      
      if (data.errors) {
        Object.keys(data.errors).forEach(key => {
          console.error(`❌ Error en ${key}:`, data.errors[key]);
        });
      }
      
      alert(`❌ Error: ${data.message || 'Revise los datos ingresados'}`);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    setErrors({ message: 'Error de conexión' });
    alert('❌ Error de conexión con el servidor');
  }
};

  const deleteEscenario = async () => {
    if (!selectedEscenario) return;
    
    try {
      const response = await fetch(`${API_ESCENARIOS}/${selectedEscenario.id_escenario}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      if (response.ok) {
        alert('✅ Escenario eliminado exitosamente');
        closeDeleteModal();
        loadEscenarios();
      } else {
        alert('❌ Error al eliminar escenario');
      }
    } catch (error) {
      console.error('Error eliminando escenario:', error);
      alert('❌ Error de conexión');
    }
  };

  // Modal functions
  const openDetailModal = async (escenario) => {
    try {
      const response = await fetch(`${API_ESCENARIOS}/${escenario.id_escenario}`, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedEscenario(data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error cargando detalles:', error);
    }
  };

  const openCreateModal = () => {
    setFormData({
      nombre: '',
      tipo: 'cancha',
      capacidad: 20,
      descripcion: '',
      direccion: '',
      estado: 'disponible',
      servicios: []
    });
    setImagePreview(null);
    setErrors({});
    setShowCreateModal(true);
  };

  const openEditModal = (escenario) => {
  console.log('📝 Abriendo modal de edición para:', escenario);
  
  setSelectedEscenario(escenario);
  
  // Asegúrate de que los servicios sean un array
  const serviciosArray = Array.isArray(escenario.servicios) 
    ? escenario.servicios 
    : (escenario.servicios ? [escenario.servicios] : []);
  
  setFormData({
    nombre: escenario.nombre || '',
    tipo: escenario.tipo || 'cancha',
    capacidad: escenario.capacidad || 20,
    descripcion: escenario.descripcion || '',
    direccion: escenario.direccion || '',
    estado: escenario.estado || 'disponible',
    servicios: serviciosArray
  });
  
  // Si hay imagen, establecer el preview
  if (escenario.imagen) {
    const imageUrl = escenario.imagen.startsWith('http') 
      ? escenario.imagen 
      : `http://127.0.0.1:8000/storage/${escenario.imagen}`;
    
    console.log('🖼️ URL de imagen:', imageUrl);
    setImagePreview(imageUrl);
  } else {
    setImagePreview(null);
  }
  
  setErrors({});
  setShowEditModal(true);
  
  console.log('📋 FormData inicializado:', {
    nombre: escenario.nombre,
    servicios: serviciosArray
  });
};

  const openDeleteModal = (escenario) => {
    setSelectedEscenario(escenario);
    setShowDeleteModal(true);
  };

  const openDisponibilidadModal = (escenario) => {
    setSelectedEscenario(escenario);
    setSelectedFecha(new Date().toISOString().split('T')[0]);
    setShowDisponibilidadModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedEscenario(null);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      nombre: '',
      tipo: 'cancha',
      capacidad: 20,
      descripcion: '',
      direccion: '',
      estado: 'disponible',
      servicios: []
    });
    setImagePreview(null);
    setErrors({});
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedEscenario(null);
    setFormData({
      nombre: '',
      tipo: 'cancha',
      capacidad: 20,
      descripcion: '',
      direccion: '',
      estado: 'disponible',
      servicios: []
    });
    setImagePreview(null);
    setErrors({});
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedEscenario(null);
  };

  const closeDisponibilidadModal = () => {
    setShowDisponibilidadModal(false);
    setSelectedEscenario(null);
    setSelectedFecha('');
  };

  // Helper functions
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen debe ser menor a 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      setFormData({ ...formData, imagen: file });
    }
  };

  const toggleServicio = (servicioId) => {
    const currentServicios = formData.servicios || [];
    const newServicios = currentServicios.includes(servicioId)
      ? currentServicios.filter(id => id !== servicioId)
      : [...currentServicios, servicioId];
    
    setFormData({ ...formData, servicios: newServicios });
  };

  // Estadísticas
  const stats = {
    total: escenarios.length,
    disponibles: escenarios.filter(e => e.estado === 'disponible').length,
    ocupados: escenarios.filter(e => e.estado === 'ocupado').length,
    mantenimiento: escenarios.filter(e => e.estado === 'mantenimiento').length,
    capacidadTotal: escenarios.reduce((sum, e) => sum + (e.capacidad || 0), 0)
  };

  // Efectos
  useEffect(() => {
    loadEscenarios();
  }, [currentPage, estadoFilter, tipoFilter, searchTerm]);

  return (
    <div className="escenario-container">
      <Sidebar />
      
      <div className="escenario-content">
        <Topbar />
        
        <div className="escenario-main">
          {/* HEADER */}
          <div className="escenario-header">
            <div>
              <h1 className="escenario-title">
                <MapPin size={28} />
                Gestión de Escenarios
              </h1>
              <p className="escenario-subtitle">
                Administra las instalaciones deportivas disponibles
              </p>
            </div>
            <div className="escenario-header-actions">
              <button 
                onClick={() => setShowEstadisticasModal(true)}
                className="escenario-btn-secondary"
              >
                <BarChart size={20} />
                Estadísticas
              </button>
              <button 
                onClick={openCreateModal}
                className="escenario-btn-primary"
              >
                <Plus size={20} />
                Nuevo Escenario
              </button>
            </div>
          </div>

          {/* ESTADÍSTICAS */}
          <div className="escenario-stats-grid">
            <div className="escenario-stat-card">
              <div className="escenario-stat-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                <Building size={24} />
              </div>
              <div>
                <h3 className="escenario-stat-number">{stats.total}</h3>
                <p className="escenario-stat-label">Escenarios</p>
              </div>
            </div>
            <div className="escenario-stat-card">
              <div className="escenario-stat-icon" style={{background: '#dcfce7', color: '#10b981'}}>
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="escenario-stat-number">{stats.disponibles}</h3>
                <p className="escenario-stat-label">Disponibles</p>
              </div>
            </div>
            <div className="escenario-stat-card">
              <div className="escenario-stat-icon" style={{background: '#fef3c7', color: '#f59e0b'}}>
                <Clock size={24} />
              </div>
              <div>
                <h3 className="escenario-stat-number">{stats.ocupados}</h3>
                <p className="escenario-stat-label">Ocupados</p>
              </div>
            </div>
            <div className="escenario-stat-card">
              <div className="escenario-stat-icon" style={{background: '#fee2e2', color: '#ef4444'}}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="escenario-stat-number">{stats.mantenimiento}</h3>
                <p className="escenario-stat-label">Mantenimiento</p>
              </div>
            </div>
          </div>

          {/* FILTROS */}
          <div className="escenario-filters">
            <div className="escenario-filters-row">
              <div className="escenario-search-container">
                <Search className="escenario-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Buscar escenarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="escenario-search-input"
                />
              </div>
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="escenario-filter-select"
              >
                <option value="all">Todos los estados</option>
                {estados.map(estado => (
                  <option key={estado.value} value={estado.value}>{estado.label}</option>
                ))}
              </select>
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="escenario-filter-select"
              >
                <option value="all">Todos los tipos</option>
                {tipos.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
              <button onClick={loadEscenarios} className="escenario-btn-secondary">
                <Filter size={18} />
                Filtrar
              </button>
              <button onClick={() => {
                setSearchTerm('');
                setEstadoFilter('all');
                setTipoFilter('all');
              }} className="escenario-btn-secondary">
                <RefreshCw size={18} />
                Limpiar
              </button>
            </div>
          </div>

          {/* CONTENIDO */}
          {loading ? (
            <div className="escenario-loading">
              <div className="escenario-loading-spinner"></div>
              <p>Cargando escenarios...</p>
            </div>
          ) : error ? (
            <div className="escenario-error">
              <AlertTriangle size={48} />
              <h3>Error al cargar escenarios</h3>
              <p>{error}</p>
              <button onClick={loadEscenarios} className="escenario-btn-primary">
                <RefreshCw size={18} />
                Reintentar
              </button>
            </div>
          ) : escenarios.length === 0 ? (
            <div className="escenario-empty-state">
              <MapPin size={64} />
              <h3>No hay escenarios registrados</h3>
              <p>Crea tu primer escenario para comenzar</p>
              <button onClick={openCreateModal} className="escenario-btn-primary">
                <Plus size={18} />
                Crear Escenario
              </button>
            </div>
          ) : (
            <>
              {/* VISTA DE TARJETAS */}
              {viewMode === 'cards' && (
                <div className="escenario-cards-grid">
                  {escenarios.map((escenario) => {
                    const estadoConfig = getEstadoConfig(escenario.estado);
                    const tipoConfig = getTipoConfig(escenario.tipo);
                    const EstadoIcon = estadoConfig.icon;
                    const TipoIcon = tipoConfig.icon;
                    
                    return (
                      <div key={escenario.id_escenario} className="escenario-card">
                        <div className="escenario-card-header">
                          <div className="escenario-card-image">
                            {escenario.imagen ? (
                              <img 
                                src={`http://127.0.0.1:8000/storage/${escenario.imagen}`} 
                                alt={escenario.nombre}
                              />
                            ) : (
                              <div className="escenario-card-image-placeholder">
                                <Building size={48} />
                              </div>
                            )}
                          </div>
                          <div className="escenario-card-status">
                            <div 
                              className="escenario-status-badge"
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
                        
                        <div className="escenario-card-body">
                          <h3 className="escenario-card-title">
                            {escenario.nombre}
                          </h3>
                          <div className="escenario-card-meta">
                            <div className="escenario-card-meta-item">
                              <TipoIcon size={14} style={{ color: tipoConfig.color }} />
                              <span>{tipoConfig.label}</span>
                            </div>
                            <div className="escenario-card-meta-item">
                              <Users size={14} />
                              <span>Capacidad: {escenario.capacidad}</span>
                            </div>
                          </div>
                          
                          {escenario.descripcion && (
                            <p className="escenario-card-description">
                              {escenario.descripcion.length > 100 
                                ? `${escenario.descripcion.substring(0, 100)}...`
                                : escenario.descripcion}
                            </p>
                          )}
                          
                          {escenario.direccion && (
                            <div className="escenario-card-direccion">
                              <MapPin size={12} />
                              <span>{escenario.direccion}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="escenario-card-footer">
                          <div className="escenario-card-actions">
                            <button
                              onClick={() => openDetailModal(escenario)}
                              className="escenario-card-action-btn"
                              title="Ver detalles"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openDisponibilidadModal(escenario)}
                              className="escenario-card-action-btn"
                              title="Ver disponibilidad"
                            >
                              <Calendar size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(escenario)}
                              className="escenario-card-action-btn"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(escenario)}
                              className="escenario-card-action-btn delete"
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

              {/* PAGINACIÓN */}
              {totalPages > 1 && (
                <div className="escenario-pagination">
                  <div className="escenario-pagination-info">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="escenario-pagination-controls">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="escenario-pagination-btn"
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
                          className={`escenario-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="escenario-pagination-btn"
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

      {/* MODAL CREAR ESCENARIO */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3 className="modal-title">
                <Plus size={20} />
                Nuevo Escenario
              </h3>
              <button onClick={closeCreateModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Tag size={14} />
                    Nombre del Escenario *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="modal-form-input"
                    placeholder="Ej: Cancha Principal"
                  />
                  {errors.nombre && <span className="modal-form-error">{errors.nombre}</span>}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Home size={14} />
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
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Users size={14} />
                    Capacidad *
                  </label>
                  <input
                    type="number"
                    value={formData.capacidad}
                    onChange={(e) => setFormData({...formData, capacidad: parseInt(e.target.value) || 0})}
                    className="modal-form-input"
                    min="1"
                  />
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <CheckCircle size={14} />
                    Estado *
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
                    <MapPin size={14} />
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    className="modal-form-input"
                    placeholder="Dirección completa"
                  />
                </div>
                
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    className="modal-form-input"
                    rows="3"
                    placeholder="Descripción detallada del escenario..."
                  />
                </div>
                
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    Imagen del Escenario
                  </label>
                  <div className="modal-image-upload">
                    {imagePreview ? (
                      <div className="modal-image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <button 
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData({...formData, imagen: null});
                          }}
                          className="modal-image-remove"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <label className="modal-image-upload-area">
                        <Upload size={24} />
                        <span>Subir imagen (max 2MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="modal-image-input"
                        />
                      </label>
                    )}
                  </div>
                </div>
                
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    Servicios Disponibles
                  </label>
                  <div className="modal-servicios-grid">
                    {serviciosOptions.map(servicio => {
                      const ServicioIcon = servicio.icon;
                      return (
                        <div 
                          key={servicio.id}
                          className={`modal-servicio-item ${formData.servicios.includes(servicio.id) ? 'selected' : ''}`}
                          onClick={() => toggleServicio(servicio.id)}
                        >
                          <div className="modal-servicio-icon">
                            <ServicioIcon size={20} />
                          </div>
                          <span className="modal-servicio-label">{servicio.label}</span>
                          {formData.servicios.includes(servicio.id) && (
                            <div className="modal-servicio-check">
                              <CheckCircle size={16} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeCreateModal} className="modal-btn-secondary">
                Cancelar
              </button>
              <button onClick={createEscenario} className="modal-btn-primary">
                <Plus size={18} />
                Crear Escenario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE ESCENARIO */}
      {showDetailModal && selectedEscenario && (() => {
        const estadoConfig = getEstadoConfig(selectedEscenario.estado);
        const tipoConfig = getTipoConfig(selectedEscenario.tipo);
        const EstadoIcon = estadoConfig.icon;
        const TipoIcon = tipoConfig.icon;
        
        return (
          <div className="modal-overlay">
            <div className="modal-content large">
              <div className="modal-header">
                <h3 className="modal-title">
                  <Eye size={20} />
                  Detalles del Escenario
                </h3>
                <button onClick={closeDetailModal} className="modal-close-btn">
                  &times;
                </button>
              </div>
              
              <div className="modal-body">
                <div className="escenario-detail-header">
                  {selectedEscenario.imagen ? (
                    <div className="escenario-detail-image">
                      <img 
                        src={`http://127.0.0.1:8000/storage/${selectedEscenario.imagen}`} 
                        alt={selectedEscenario.nombre}
                      />
                    </div>
                  ) : null}
                  
                  <div className="escenario-detail-info">
                    <div className="escenario-detail-title">
                      <h2>{selectedEscenario.nombre}</h2>
                      <div 
                        className="escenario-detail-status"
                        style={{
                          backgroundColor: estadoConfig.color + '20',
                          color: estadoConfig.color
                        }}
                      >
                        <EstadoIcon size={16} />
                        <span>{estadoConfig.label}</span>
                      </div>
                    </div>
                    
                    <div className="escenario-detail-meta">
                      <div className="escenario-detail-meta-item">
                        <TipoIcon size={16} style={{ color: tipoConfig.color }} />
                        <span>{tipoConfig.label}</span>
                      </div>
                      <div className="escenario-detail-meta-item">
                        <Users size={16} />
                        <span>Capacidad: {selectedEscenario.capacidad} personas</span>
                      </div>
                      <div className="escenario-detail-meta-item">
                        <MapPin size={16} />
                        <span>{selectedEscenario.direccion || 'Sin dirección'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedEscenario.descripcion && (
                  <div className="escenario-detail-section">
                    <h4 className="escenario-detail-section-title">Descripción</h4>
                    <p className="escenario-detail-description">{selectedEscenario.descripcion}</p>
                  </div>
                )}
                
                {selectedEscenario.servicios && selectedEscenario.servicios.length > 0 && (
                  <div className="escenario-detail-section">
                    <h4 className="escenario-detail-section-title">Servicios Disponibles</h4>
                    <div className="escenario-detail-servicios">
                      {formatServicios(selectedEscenario.servicios).map(servicio => {
                        const ServicioIcon = servicio.icon;
                        return (
                          <div key={servicio.id} className="escenario-detail-servicio">
                            <div className="escenario-detail-servicio-icon">
                              <ServicioIcon size={16} />
                            </div>
                            <span>{servicio.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {selectedEscenario.actividades && selectedEscenario.actividades.length > 0 && (
                  <div className="escenario-detail-section">
                    <h4 className="escenario-detail-section-title">Actividades Programadas</h4>
                    <div className="escenario-detail-actividades">
                      {selectedEscenario.actividades.slice(0, 5).map(actividad => (
                        <div key={actividad.id_actividad} className="escenario-detail-actividad">
                          <Calendar size={14} />
                          <span>{actividad.nombre}</span>
                          <span className="escenario-detail-actividad-fecha">
                            {new Date(actividad.fecha).toLocaleDateString()}
                          </span>
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
                    openEditModal(selectedEscenario);
                  }}
                  className="modal-btn-primary"
                >
                  <Edit2 size={18} />
                  Editar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
{/* MODAL EDITAR ESCENARIO */}
{showEditModal && selectedEscenario && (
  <div className="modal-overlay">
    <div className="modal-content large">
      <div className="modal-header">
        <h3 className="modal-title">
          <Edit2 size={20} />
          Editar Escenario: {selectedEscenario.nombre}
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
              Nombre del Escenario *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              className="modal-form-input"
              placeholder="Ej: Cancha Principal"
            />
            {errors.nombre && <span className="modal-form-error">{errors.nombre}</span>}
          </div>
          
          <div className="modal-form-group">
            <label className="modal-form-label">
              <Home size={14} />
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
          </div>
          
          <div className="modal-form-group">
            <label className="modal-form-label">
              <Users size={14} />
              Capacidad *
            </label>
            <input
              type="number"
              value={formData.capacidad}
              onChange={(e) => setFormData({...formData, capacidad: parseInt(e.target.value) || 0})}
              className="modal-form-input"
              min="1"
            />
          </div>
          
          <div className="modal-form-group">
            <label className="modal-form-label">
              <CheckCircle size={14} />
              Estado *
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
              <MapPin size={14} />
              Dirección
            </label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({...formData, direccion: e.target.value})}
              className="modal-form-input"
              placeholder="Dirección completa"
            />
          </div>
          
          <div className="modal-form-group full-width">
            <label className="modal-form-label">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              className="modal-form-input"
              rows="3"
              placeholder="Descripción detallada del escenario..."
            />
          </div>
          
          <div className="modal-form-group full-width">
            <label className="modal-form-label">
              Imagen del Escenario
            </label>
            <div className="modal-image-upload">
              {imagePreview ? (
                <div className="modal-image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button 
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData({...formData, imagen: null});
                    }}
                    className="modal-image-remove"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <label className="modal-image-upload-area">
                  <Upload size={24} />
                  <span>Subir nueva imagen (max 2MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="modal-image-input"
                  />
                </label>
              )}
              <p className="modal-image-note">
                {selectedEscenario.imagen ? 
                  "Imagen actual: " + selectedEscenario.imagen : 
                  "Sin imagen actual"}
              </p>
            </div>
          </div>
          
          <div className="modal-form-group full-width">
            <label className="modal-form-label">
              Servicios Disponibles
            </label>
            <div className="modal-servicios-grid">
              {serviciosOptions.map(servicio => {
                const ServicioIcon = servicio.icon;
                const isSelected = formData.servicios && formData.servicios.includes(servicio.id);
                return (
                  <div 
                    key={servicio.id}
                    className={`modal-servicio-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleServicio(servicio.id)}
                  >
                    <div className="modal-servicio-icon">
                      <ServicioIcon size={20} />
                    </div>
                    <span className="modal-servicio-label">{servicio.label}</span>
                    {isSelected && (
                      <div className="modal-servicio-check">
                        <CheckCircle size={16} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      <div className="modal-footer">
        <button onClick={closeEditModal} className="modal-btn-secondary">
          Cancelar
        </button>
        <button onClick={updateEscenario} className="modal-btn-primary">
          <Edit2 size={18} />
          Actualizar Escenario
        </button>
      </div>
    </div>
  </div>
)}

      {/* MODAL DISPONIBILIDAD */}
      {showDisponibilidadModal && selectedEscenario && (() => {
        const estadoConfig = getEstadoConfig(selectedEscenario.estado);
        const EstadoIcon = estadoConfig.icon;
        
        return (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">
                  <Calendar size={20} />
                  Disponibilidad: {selectedEscenario.nombre}
                </h3>
                <button onClick={closeDisponibilidadModal} className="modal-close-btn">
                  &times;
                </button>
              </div>
              
              <div className="modal-body">
                <div className="disponibilidad-content">
                  <div className="disponibilidad-form">
                    <label>Selecciona una fecha:</label>
                    <input
                      type="date"
                      value={selectedFecha}
                      onChange={(e) => setSelectedFecha(e.target.value)}
                      className="modal-form-input"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div className="disponibilidad-info">
                    <div className="disponibilidad-status">
                      <div 
                        className="disponibilidad-status-badge"
                        style={{
                          backgroundColor: estadoConfig.color + '20',
                          color: estadoConfig.color
                        }}
                      >
                        <EstadoIcon size={16} />
                        <span>Estado actual: {estadoConfig.label}</span>
                      </div>
                    </div>
                    
                    {selectedFecha && (
                      <div className="disponibilidad-actions">
                        <button 
                          onClick={async () => {
                            const data = await loadDisponibilidad(selectedEscenario.id_escenario, selectedFecha);
                            if (data) {
                              alert(`Disponibilidad para ${selectedFecha}: ${data.disponible ? 'Disponible' : 'No disponible'}`);
                            }
                          }}
                          className="modal-btn-primary"
                        >
                          <Calendar size={18} />
                          Verificar Disponibilidad
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button onClick={closeDisponibilidadModal} className="modal-btn-secondary">
                  Cerrar
                </button>
                <button 
                  onClick={() => {
                    closeDisponibilidadModal();
                    openEditModal(selectedEscenario);
                  }}
                  className="modal-btn-primary"
                >
                  <Edit2 size={18} />
                  Editar Escenario
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL ELIMINAR */}
      {showDeleteModal && selectedEscenario && (() => {
        const estadoConfig = getEstadoConfig(selectedEscenario.estado);
        const tipoConfig = getTipoConfig(selectedEscenario.tipo);
        
        return (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">
                  <AlertTriangle size={20} />
                  Eliminar Escenario
                </h3>
                <button onClick={closeDeleteModal} className="modal-close-btn">
                  &times;
                </button>
              </div>
              
              <div className="modal-body">
                <div className="delete-modal-content">
                  <AlertTriangle size={48} />
                  <h4>¿Estás seguro de eliminar este escenario?</h4>
                  <p>Esta acción no se puede deshacer y se eliminarán todos los datos asociados.</p>
                  
                  <div className="delete-modal-info">
                    <div className="delete-modal-item">
                      <span>Nombre:</span>
                      <strong>{selectedEscenario.nombre}</strong>
                    </div>
                    <div className="delete-modal-item">
                      <span>Tipo:</span>
                      <strong>{tipoConfig.label}</strong>
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
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button onClick={closeDeleteModal} className="modal-btn-secondary">
                  Cancelar
                </button>
                <button onClick={deleteEscenario} className="modal-btn-danger">
                  <Trash2 size={18} />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Escenario;