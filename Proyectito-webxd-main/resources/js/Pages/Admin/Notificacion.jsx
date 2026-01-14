import React, { useState, useEffect } from 'react';
import {
  Bell, BellOff, CheckCircle, AlertCircle, Info, AlertTriangle,
  XCircle, Mail, MessageSquare, Check, CheckSquare, XSquare,
  Trash2, Eye, Filter, Search, RefreshCw, Clock, Calendar,
  ExternalLink, MoreVertical, Download, Archive, Inbox,
  Star, Bookmark, Share2, Copy, ChevronRight, ChevronLeft,
  ChevronDown, ChevronUp, BellRing, BellDot, MailOpen, MailCheck
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/notificacion.css';

const API_NOTIFICACIONES = 'http://127.0.0.1:8000/api/notificaciones';

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

const Notificacion = () => {
  // Estados principales
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  
  const [selectedNotificacion, setSelectedNotificacion] = useState(null);
  
  // Filtros
  const [leidaFilter, setLeidaFilter] = useState('all'); // 'all', 'leidas', 'no_leidas'
  const [tipoFilter, setTipoFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUnread, setTotalUnread] = useState(0);
  
  // Formularios
  const [formData, setFormData] = useState({
    usuario_id: '',
    tipo: 'info',
    titulo: '',
    mensaje: '',
    url: '',
    data: {}
  });
  
  const [errors, setErrors] = useState({});
  const [viewMode, setViewMode] = useState('list'); // 'list', 'compact', 'cards'
  const [expandedNotificacion, setExpandedNotificacion] = useState(null);

  // Tipos de notificaciones
  const tipos = [
    { value: 'info', label: 'Información', color: '#3b82f6', icon: Info, bgColor: '#dbeafe' },
    { value: 'success', label: 'Éxito', color: '#10b981', icon: CheckCircle, bgColor: '#dcfce7' },
    { value: 'warning', label: 'Advertencia', color: '#f59e0b', icon: AlertTriangle, bgColor: '#fef3c7' },
    { value: 'error', label: 'Error', color: '#ef4444', icon: XCircle, bgColor: '#fee2e2' },
    { value: 'mensaje', label: 'Mensaje', color: '#8b5cf6', icon: MessageSquare, bgColor: '#f3e8ff' }
  ];

  // Funciones helper
  const getTipoConfig = (tipo) => {
    return tipos.find(t => t.value === tipo) || tipos[0];
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
      return 'Ahora mismo';
    } else if (diffMins < 60) {
      return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  const formatFechaCompleta = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Cargar notificaciones
  const loadNotificaciones = async () => {
  console.log('🔍 loadNotificaciones INICIO');
  setLoading(true);
  setError(null);
  
  try {
    const params = {
      page: currentPage,
      per_page: 20 // Asegúrate de pedir suficiente
    };
    
    if (leidaFilter !== 'all') {
      params.leida = leidaFilter === 'leidas' ? 1 : 0;
    }
    
    if (tipoFilter !== 'all') {
      params.tipo = tipoFilter;
    }
    
    if (searchTerm.trim() !== '') {
      params.search = searchTerm;
    }
    
    const queryParams = new URLSearchParams(params);
    const url = `${API_NOTIFICACIONES}?${queryParams}`;
    
    console.log('🔍 URL de la API:', url);
    console.log('🔍 Parámetros:', params);
    
    const response = await fetch(url, {
      headers: authHeaders()
    });
    
    console.log('🔍 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('🔍 DATOS RECIBIDOS de la API:', data);
    console.log('🔍 Total registros (data.total):', data.total);
    console.log('🔍 Total páginas (data.last_page):', data.last_page);
    console.log('🔍 Datos actuales (data.data):', data.data);
    console.log('🔍 Cantidad de notificaciones recibidas:', data.data?.length || 0);
    
    setNotificaciones(data.data || []);
    setTotalPages(data.last_page || 1);
    
    // Verifica si hay más páginas
    if (data.last_page > 1) {
      console.log(`⚠️ Hay ${data.last_page} páginas. Estás viendo la página ${currentPage}`);
    }
    
  } catch (err) {
    console.error('❌ Error cargando notificaciones:', err);
    setError(err.message);
  } finally {
    console.log('🔍 loadNotificaciones FIN');
    setLoading(false);
  }
};

  // Cambia esta línea (línea ~170):
const loadUnreadCount = async () => {
  try {
    // ❌ ESTO ESTÁ MAL - URL incorrecta
    // const response = await fetch(`${API_NOTIFICACIONES}/no-leidas`, {
    
    // ✅ ESTO ES CORRECTO - Usa la ruta correcta
    const response = await fetch(`${API_NOTIFICACIONES}/no-leidas/cantidad`, {
      headers: authHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      setTotalUnread(data.cantidad || 0);
    }
  } catch (error) {
    console.error('Error cargando contador de no leídas:', error);
  }
};
  // Operaciones CRUD
  const createNotificacion = async () => {
    setErrors({});
    
    try {
      const dataToSend = { ...formData };
      
      // Validar que data sea objeto
      if (typeof dataToSend.data !== 'object') {
        dataToSend.data = {};
      }
      
      const response = await fetch(API_NOTIFICACIONES, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(dataToSend)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('✅ Notificación creada exitosamente');
        closeCreateModal();
        loadNotificaciones();
      } else {
        setErrors(data.errors || { message: data.message || 'Error al crear notificación' });
        alert(`❌ Error: ${data.message || 'Revise los datos ingresados'}`);
      }
    } catch (error) {
      console.error('Error creando notificación:', error);
      alert('❌ Error de conexión');
    }
  };

  const markAsRead = async (id) => {
    try {
      const response = await fetch(`${API_NOTIFICACIONES}/${id}/marcar-leida`, {
        method: 'POST',
        headers: authHeaders()
      });
      
      if (response.ok) {
        // Actualizar estado local
        setNotificaciones(prev => prev.map(notif => 
          notif.id_notificacion === id 
            ? { ...notif, leida: true, fecha_lectura: new Date().toISOString() }
            : notif
        ));
        loadUnreadCount();
      }
    } catch (error) {
      console.error('Error marcando como leída:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_NOTIFICACIONES}/marcar-todas-leidas`, {
        method: 'POST',
        headers: authHeaders()
      });
      
      if (response.ok) {
        alert('✅ Todas las notificaciones marcadas como leídas');
        // Actualizar estado local
        setNotificaciones(prev => prev.map(notif => ({
          ...notif,
          leida: true,
          fecha_lectura: new Date().toISOString()
        })));
        setTotalUnread(0);
      }
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      alert('❌ Error al marcar notificaciones');
    }
  };

  const deleteNotificacion = async () => {
    if (!selectedNotificacion) return;
    
    try {
      const response = await fetch(`${API_NOTIFICACIONES}/${selectedNotificacion.id_notificacion}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      if (response.ok) {
        alert('✅ Notificación eliminada exitosamente');
        closeDeleteModal();
        loadNotificaciones();
        loadUnreadCount();
      } else {
        alert('❌ Error al eliminar notificación');
      }
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      alert('❌ Error de conexión');
    }
  };

  // Modal functions
  const openDetailModal = async (notificacion) => {
    try {
      const response = await fetch(`${API_NOTIFICACIONES}/${notificacion.id_notificacion}`, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedNotificacion(data);
        setShowDetailModal(true);
        
        // Si no estaba leída, actualizar localmente
        if (!notificacion.leida) {
          setNotificaciones(prev => prev.map(notif => 
            notif.id_notificacion === notificacion.id_notificacion 
              ? { ...notif, leida: true, fecha_lectura: new Date().toISOString() }
              : notif
          ));
          setTotalUnread(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error cargando detalles:', error);
    }
  };

  const openCreateModal = () => {
    setFormData({
      usuario_id: '',
      tipo: 'info',
      titulo: '',
      mensaje: '',
      url: '',
      data: {}
    });
    setErrors({});
    setShowCreateModal(true);
  };

  const openDeleteModal = (notificacion) => {
    setSelectedNotificacion(notificacion);
    setShowDeleteModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedNotificacion(null);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      usuario_id: '',
      tipo: 'info',
      titulo: '',
      mensaje: '',
      url: '',
      data: {}
    });
    setErrors({});
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedNotificacion(null);
  };

  const closeFiltersModal = () => {
    setShowFiltersModal(false);
  };

  // Helper functions
  const toggleNotificacion = (id) => {
    setExpandedNotificacion(expandedNotificacion === id ? null : id);
  };

  const handleQuickAction = async (notificacion, action) => {
    switch (action) {
      case 'read':
        await markAsRead(notificacion.id_notificacion);
        break;
      case 'delete':
        openDeleteModal(notificacion);
        break;
      case 'view':
        openDetailModal(notificacion);
        break;
      default:
        break;
    }
  };

  // Estadísticas
  const stats = {
    total: notificaciones.length,
    unread: notificaciones.filter(n => !n.leida).length,
    read: notificaciones.filter(n => n.leida).length,
    today: notificaciones.filter(n => {
      const notifDate = new Date(n.created_at);
      const today = new Date();
      return notifDate.toDateString() === today.toDateString();
    }).length
  };

  // Efectos
  useEffect(() => {
    loadNotificaciones();
    loadUnreadCount();
  }, [currentPage, leidaFilter, tipoFilter, searchTerm]);

  // Auto-refresh cada 30 segundos para nuevas notificaciones
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showDetailModal && !showCreateModal && !showDeleteModal) {
        loadUnreadCount();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [showDetailModal, showCreateModal, showDeleteModal]);

  return (
    <div className="notificacion-container">
      <Sidebar />
      
      <div className="notificacion-content">
        <Topbar />
        
        <div className="notificacion-main">
          {/* HEADER */}
          <div className="notificacion-header">
            <div>
              <h1 className="notificacion-title">
                <Bell size={28} />
                Notificaciones
                {totalUnread > 0 && (
                  <span className="notificacion-badge">
                    {totalUnread}
                  </span>
                )}
              </h1>
              <p className="notificacion-subtitle">
                Gestiona tus notificaciones y alertas del sistema
              </p>
            </div>
            <div className="notificacion-header-actions">
              <button 
                onClick={markAllAsRead}
                className="notificacion-btn-secondary"
                disabled={stats.unread === 0}
                title="Marcar todas como leídas"
              >
                <CheckSquare size={20} />
                Marcar todas leídas
              </button>
              <button 
                onClick={openCreateModal}
                className="notificacion-btn-secondary"
                title="Crear notificación"
              >
                <Mail size={20} />
                Nueva Notificación
              </button>
            </div>
          </div>

          {/* ESTADÍSTICAS */}
          <div className="notificacion-stats-grid">
            <div className="notificacion-stat-card">
              <div className="notificacion-stat-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                <Bell size={24} />
              </div>
              <div>
                <h3 className="notificacion-stat-number">{stats.total}</h3>
                <p className="notificacion-stat-label">Total</p>
              </div>
            </div>
            <div className="notificacion-stat-card">
              <div className="notificacion-stat-icon" style={{background: '#fee2e2', color: '#ef4444'}}>
                <BellRing size={24} />
              </div>
              <div>
                <h3 className="notificacion-stat-number">{stats.unread}</h3>
                <p className="notificacion-stat-label">No Leídas</p>
              </div>
            </div>
            <div className="notificacion-stat-card">
              <div className="notificacion-stat-icon" style={{background: '#dcfce7', color: '#10b981'}}>
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="notificacion-stat-number">{stats.read}</h3>
                <p className="notificacion-stat-label">Leídas</p>
              </div>
            </div>
            <div className="notificacion-stat-card">
              <div className="notificacion-stat-icon" style={{background: '#fef3c7', color: '#f59e0b'}}>
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="notificacion-stat-number">{stats.today}</h3>
                <p className="notificacion-stat-label">Hoy</p>
              </div>
            </div>
          </div>

          {/* FILTROS RÁPIDOS */}
          <div className="notificacion-filters">
            <div className="notificacion-filters-row">
              <div className="notificacion-search-container">
                <Search className="notificacion-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Buscar en notificaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="notificacion-search-input"
                />
              </div>
              
              <div className="notificacion-filter-buttons">
                <button
                  onClick={() => setLeidaFilter('all')}
                  className={`notificacion-filter-btn ${leidaFilter === 'all' ? 'active' : ''}`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setLeidaFilter('no_leidas')}
                  className={`notificacion-filter-btn ${leidaFilter === 'no_leidas' ? 'active' : ''}`}
                >
                  <BellRing size={14} />
                  No leídas
                  {stats.unread > 0 && (
                    <span className="notificacion-filter-badge">{stats.unread}</span>
                  )}
                </button>
                <button
                  onClick={() => setLeidaFilter('leidas')}
                  className={`notificacion-filter-btn ${leidaFilter === 'leidas' ? 'active' : ''}`}
                >
                  <CheckCircle size={14} />
                  Leídas
                </button>
              </div>
              
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="notificacion-filter-select"
              >
                <option value="all">Todos los tipos</option>
                {tipos.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
              
              <button onClick={loadNotificaciones} className="notificacion-btn-secondary">
                <Filter size={18} />
                Aplicar
              </button>
              
              <button onClick={() => {
                setSearchTerm('');
                setLeidaFilter('all');
                setTipoFilter('all');
              }} className="notificacion-btn-secondary">
                <RefreshCw size={18} />
                Limpiar
              </button>
            </div>
          </div>

          {/* VISTA DE NOTIFICACIONES */}
          {loading ? (
            <div className="notificacion-loading">
              <div className="notificacion-loading-spinner"></div>
              <p>Cargando notificaciones...</p>
            </div>
          ) : error ? (
            <div className="notificacion-error">
              <AlertCircle size={48} />
              <h3>Error al cargar notificaciones</h3>
              <p>{error}</p>
              <button onClick={loadNotificaciones} className="notificacion-btn-primary">
                <RefreshCw size={18} />
                Reintentar
              </button>
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="notificacion-empty-state">
              <BellOff size={64} />
              <h3>No hay notificaciones</h3>
              <p>
                {searchTerm || leidaFilter !== 'all' || tipoFilter !== 'all'
                  ? 'No se encontraron notificaciones con los filtros aplicados'
                  : '¡Todo está al día! No tienes notificaciones pendientes.'}
              </p>
              <button onClick={() => {
                setSearchTerm('');
                setLeidaFilter('all');
                setTipoFilter('all');
              }} className="notificacion-btn-primary">
                <RefreshCw size={18} />
                Ver Todas
              </button>
            </div>
          ) : (
            <>
              {/* VISTA DE LISTA */}
              {viewMode === 'list' && (
                <div className="notificacion-list">
                  {notificaciones.map((notificacion) => {
                    const tipoConfig = getTipoConfig(notificacion.tipo);
                    const TipoIcon = tipoConfig.icon;
                    const isExpanded = expandedNotificacion === notificacion.id_notificacion;
                    
                    return (
                      <div 
                        key={notificacion.id_notificacion} 
                        className={`notificacion-item ${notificacion.leida ? 'read' : 'unread'} ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => toggleNotificacion(notificacion.id_notificacion)}
                      >
                        <div className="notificacion-item-header">
                          <div className="notificacion-item-icon">
                            <div 
                              className="notificacion-icon-badge"
                              style={{
                                backgroundColor: tipoConfig.bgColor,
                                color: tipoConfig.color
                              }}
                            >
                              <TipoIcon size={18} />
                            </div>
                          </div>
                          
                          <div className="notificacion-item-content">
                            <div className="notificacion-item-title">
                              <h4>{notificacion.titulo}</h4>
                              {!notificacion.leida && (
                                <div className="notificacion-unread-dot"></div>
                              )}
                            </div>
                            
                            <div className="notificacion-item-preview">
                              <p>{notificacion.mensaje.length > 100 
                                ? `${notificacion.mensaje.substring(0, 100)}...`
                                : notificacion.mensaje}</p>
                            </div>
                            
                            <div className="notificacion-item-meta">
                              <span className="notificacion-item-time">
                                <Clock size={12} />
                                {formatFecha(notificacion.created_at)}
                              </span>
                              <span className="notificacion-item-type" style={{ color: tipoConfig.color }}>
                                {tipoConfig.label}
                              </span>
                            </div>
                          </div>
                          
                          <div className="notificacion-item-actions">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAction(notificacion, 'read');
                              }}
                              className="notificacion-action-btn"
                              title="Marcar como leída"
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetailModal(notificacion);
                              }}
                              className="notificacion-action-btn"
                              title="Ver detalles"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(notificacion);
                              }}
                              className="notificacion-action-btn delete"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNotificacion(notificacion.id_notificacion);
                              }}
                              className="notificacion-expand-btn"
                              title={isExpanded ? "Contraer" : "Expandir"}
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="notificacion-item-details">
                            <div className="notificacion-detail-message">
                              <p>{notificacion.mensaje}</p>
                            </div>
                            
                            {notificacion.url && (
                              <div className="notificacion-detail-url">
                                <a 
                                  href={notificacion.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="notificacion-url-link"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink size={14} />
                                  <span>Ver más información</span>
                                </a>
                              </div>
                            )}
                            
                            <div className="notificacion-detail-actions">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAction(notificacion, 'read');
                                }}
                                className="notificacion-detail-btn"
                              >
                                <Check size={16} />
                                Marcar como leída
                              </button>
                              {notificacion.url && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(notificacion.url, '_blank');
                                  }}
                                  className="notificacion-detail-btn primary"
                                >
                                  <ExternalLink size={16} />
                                  Acceder
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* VISTA COMPACTA */}
              {viewMode === 'compact' && (
                <div className="notificacion-compact-list">
                  {notificaciones.map((notificacion) => {
                    const tipoConfig = getTipoConfig(notificacion.tipo);
                    const TipoIcon = tipoConfig.icon;
                    
                    return (
                      <div 
                        key={notificacion.id_notificacion} 
                        className={`notificacion-compact-item ${notificacion.leida ? 'read' : 'unread'}`}
                        onClick={() => openDetailModal(notificacion)}
                      >
                        <div className="notificacion-compact-icon">
                          <div 
                            className="notificacion-icon-badge"
                            style={{
                              backgroundColor: tipoConfig.bgColor,
                              color: tipoConfig.color
                            }}
                          >
                            <TipoIcon size={16} />
                          </div>
                        </div>
                        
                        <div className="notificacion-compact-content">
                          <div className="notificacion-compact-title">
                            <h4>{notificacion.titulo}</h4>
                            {!notificacion.leida && (
                              <div className="notificacion-unread-dot"></div>
                            )}
                          </div>
                          <p className="notificacion-compact-preview">
                            {notificacion.mensaje.length > 60 
                              ? `${notificacion.mensaje.substring(0, 60)}...`
                              : notificacion.mensaje}
                          </p>
                          <span className="notificacion-compact-time">
                            {formatFecha(notificacion.created_at)}
                          </span>
                        </div>
                        
                        <div className="notificacion-compact-actions">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAction(notificacion, 'read');
                            }}
                            className="notificacion-compact-action-btn"
                            title="Marcar como leída"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PAGINACIÓN */}
              {totalPages > 1 && (
                <div className="notificacion-pagination">
                  <div className="notificacion-pagination-info">
                    Mostrando {notificaciones.length} notificaciones
                  </div>
                  <div className="notificacion-pagination-controls">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="notificacion-pagination-btn"
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
                          className={`notificacion-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="notificacion-pagination-btn"
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

      {/* MODAL DETALLE NOTIFICACIÓN */}
      {showDetailModal && selectedNotificacion && (() => {
        const tipoConfig = getTipoConfig(selectedNotificacion.tipo);
        const TipoIcon = tipoConfig.icon;
        
        return (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-header-content">
                  <div 
                    className="modal-notificacion-icon"
                    style={{
                      backgroundColor: tipoConfig.bgColor,
                      color: tipoConfig.color
                    }}
                  >
                    <TipoIcon size={20} />
                  </div>
                  <div>
                    <h3 className="modal-title">{selectedNotificacion.titulo}</h3>
                    <div className="modal-subtitle">
                      <span style={{ color: tipoConfig.color }}>{tipoConfig.label}</span>
                      <span>•</span>
                      <span>{formatFechaCompleta(selectedNotificacion.created_at)}</span>
                    </div>
                  </div>
                </div>
                <button onClick={closeDetailModal} className="modal-close-btn">
                  &times;
                </button>
              </div>
              
              <div className="modal-body">
                <div className="notificacion-detail-message">
                  <p>{selectedNotificacion.mensaje}</p>
                </div>
                
                {selectedNotificacion.data && Object.keys(selectedNotificacion.data).length > 0 && (
                  <div className="notificacion-detail-data">
                    <h4>Información Adicional</h4>
                    <div className="notificacion-data-grid">
                      {Object.entries(selectedNotificacion.data).map(([key, value]) => (
                        <div key={key} className="notificacion-data-item">
                          <span className="notificacion-data-label">{key}:</span>
                          <span className="notificacion-data-value">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedNotificacion.url && (
                  <div className="notificacion-detail-url">
                    <h4>Enlace Relacionado</h4>
                    <a 
                      href={selectedNotificacion.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="notificacion-url-link"
                    >
                      <ExternalLink size={16} />
                      <span>{selectedNotificacion.url}</span>
                    </a>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button onClick={closeDetailModal} className="modal-btn-secondary">
                  Cerrar
                </button>
                {!selectedNotificacion.leida && (
                  <button 
                    onClick={async () => {
                      await markAsRead(selectedNotificacion.id_notificacion);
                      closeDetailModal();
                    }}
                    className="modal-btn-primary"
                  >
                    <Check size={18} />
                    Marcar como leída
                  </button>
                )}
                {selectedNotificacion.url && (
                  <button 
                    onClick={() => window.open(selectedNotificacion.url, '_blank')}
                    className="modal-btn-primary"
                  >
                    <ExternalLink size={18} />
                    Acceder
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL CREAR NOTIFICACIÓN */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <Mail size={20} />
                Nueva Notificación
              </h3>
              <button onClick={closeCreateModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    Tipo *
                  </label>
                  <div className="tipo-selector-grid">
                    {tipos.map(tipo => {
                      const TipoIcon = tipo.icon;
                      return (
                        <div 
                          key={tipo.value}
                          className={`tipo-selector-item ${formData.tipo === tipo.value ? 'selected' : ''}`}
                          onClick={() => setFormData({...formData, tipo: tipo.value})}
                          style={{ 
                            borderColor: formData.tipo === tipo.value ? tipo.color : '#e5e7eb',
                            backgroundColor: formData.tipo === tipo.value ? tipo.bgColor : 'white'
                          }}
                        >
                          <div 
                            className="tipo-selector-icon"
                            style={{ color: tipo.color }}
                          >
                            <TipoIcon size={18} />
                          </div>
                          <span className="tipo-selector-label">{tipo.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    className="modal-form-input"
                    placeholder="Título de la notificación"
                    maxLength="200"
                  />
                  {errors.titulo && <span className="modal-form-error">{errors.titulo}</span>}
                </div>
                
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    Mensaje *
                  </label>
                  <textarea
                    value={formData.mensaje}
                    onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
                    className="modal-form-input"
                    rows="4"
                    placeholder="Contenido de la notificación..."
                  />
                  {errors.mensaje && <span className="modal-form-error">{errors.mensaje}</span>}
                </div>
                
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    URL (Opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                    className="modal-form-input"
                    placeholder="https://ejemplo.com"
                  />
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    Usuario ID *
                  </label>
                  <input
                    type="text"
                    value={formData.usuario_id}
                    onChange={(e) => setFormData({...formData, usuario_id: e.target.value})}
                    className="modal-form-input"
                    placeholder="ID del usuario"
                  />
                  {errors.usuario_id && <span className="modal-form-error">{errors.usuario_id}</span>}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeCreateModal} className="modal-btn-secondary">
                Cancelar
              </button>
              <button onClick={createNotificacion} className="modal-btn-primary">
                <Mail size={18} />
                Crear Notificación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR NOTIFICACIÓN */}
      {showDeleteModal && selectedNotificacion && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <AlertCircle size={20} />
                Eliminar Notificación
              </h3>
              <button onClick={closeDeleteModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-modal-content">
                <AlertCircle size={48} />
                <h4>¿Estás seguro de eliminar esta notificación?</h4>
                <p>Esta acción no se puede deshacer.</p>
                
                <div className="delete-modal-info">
                  <div className="delete-modal-notificacion">
                    <div className="delete-modal-item">
                      <span>Título:</span>
                      <strong>{selectedNotificacion.titulo}</strong>
                    </div>
                    <div className="delete-modal-item">
                      <span>Tipo:</span>
                      <div 
                        className="delete-modal-tipo"
                        style={{ color: getTipoConfig(selectedNotificacion.tipo).color }}
                      >
                        {getTipoConfig(selectedNotificacion.tipo).label}
                      </div>
                    </div>
                    <div className="delete-modal-item">
                      <span>Fecha:</span>
                      <strong>{formatFecha(selectedNotificacion.created_at)}</strong>
                    </div>
                    <div className="delete-modal-item">
                      <span>Estado:</span>
                      <div className={`delete-modal-estado ${selectedNotificacion.leida ? 'read' : 'unread'}`}>
                        {selectedNotificacion.leida ? 'Leída' : 'No leída'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeDeleteModal} className="modal-btn-secondary">
                Cancelar
              </button>
              <button onClick={deleteNotificacion} className="modal-btn-danger">
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

export default Notificacion;