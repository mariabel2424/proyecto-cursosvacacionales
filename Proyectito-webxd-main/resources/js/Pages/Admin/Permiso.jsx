import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, Edit2, Trash2, X, Search, RefreshCw, 
  Eye, ChevronLeft, ChevronRight, AlertTriangle, 
  Shield, Database, ArrowUpDown, Grid, Hash, 
  Zap, ShieldCheck, Folder, Users, Tag, Settings, FileText, Lock
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/permiso.css';

const API_PERMISOS = 'http://127.0.0.1:8000/api/permisos';
const API_MODULOS = 'http://127.0.0.1:8000/api/permisos/modulos/lista';

// Configuración de módulos centralizada
const MODULO_CONFIG = {
  usuarios: { color: '#8b5cf6', icon: Users, label: 'Usuarios' },
  roles: { color: '#3b82f6', icon: Shield, label: 'Roles' },
  deportistas: { color: '#10b981', icon: Users, label: 'Deportistas' },
  categorias: { color: '#f59e0b', icon: Tag, label: 'Categorías' },
  configuracion: { color: '#6b7280', icon: Settings, label: 'Configuración' },
  reportes: { color: '#ec4899', icon: FileText, label: 'Reportes' },
  administracion: { color: '#ef4444', icon: Shield, label: 'Administración' },
  sistema: { color: '#8b5cf6', icon: Database, label: 'Sistema' },
  dashboard: { color: '#8b5cf6', icon: Grid, label: 'Dashboard' },
  auth: { color: '#10b981', icon: Lock, label: 'Autenticación' },
  api: { color: '#3b82f6', icon: Database, label: 'API' },
  log: { color: '#6b7280', icon: FileText, label: 'Logs' }
};

// Hook personalizado para autenticación
const useAuth = () => {
  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return null;
    }
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  return { getHeaders };
};

// Hook para gestión de API
const useApi = () => {
  const { getHeaders } = useAuth();

  const fetchData = useCallback(async (url, options = {}) => {
    const headers = getHeaders();
    if (!headers) return null;

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return response.json();
  }, [getHeaders]);

  return { fetchData };
};

// Utilidades
const getPermisoId = (permiso) => permiso?.id || permiso?.id_permiso || 0;

const getModuloConfig = (modulo) => {
  if (!modulo) return MODULO_CONFIG.configuracion;
  
  const moduloLower = modulo.toLowerCase();
  const exactMatch = MODULO_CONFIG[moduloLower];
  if (exactMatch) return exactMatch;

  // Búsqueda parcial
  for (const [key, config] of Object.entries(MODULO_CONFIG)) {
    if (moduloLower.includes(key)) return config;
  }

  // Color por hash si no hay coincidencia
  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#ef4444'];
  const hash = moduloLower.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return { color: colors[hash % colors.length], icon: Folder, label: modulo };
};

const Permiso = () => {
  const { fetchData } = useApi();
  
  // Estados principales
  const [permisos, setPermisos] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingModulos, setLoadingModulos] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados de UI
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mode, setMode] = useState('create');
  const [selected, setSelected] = useState(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [moduloFilter, setModuloFilter] = useState('all');
  const [sortBy, setSortBy] = useState('modulo');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Paginación - CAMBIADO A 10 POR PÁGINA
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;
  
  // Selección
  const [selectedPermisos, setSelectedPermisos] = useState([]);
  
  // Formulario
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    modulo: 'usuarios'
  });
  const [errors, setErrors] = useState({});

  // Cargar todos los permisos de forma paralela
  const loadAllPermisos = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Primera llamada para obtener metadata
      const firstPage = await fetchData(`${API_PERMISOS}?page=1`);
      if (!firstPage) return;

      const totalPages = firstPage.last_page || 1;
      
      if (totalPages === 1) {
        setPermisos(firstPage.data || []);
        return;
      }

      // Cargar todas las páginas en paralelo
      const pagePromises = Array.from({ length: totalPages }, (_, i) => 
        fetchData(`${API_PERMISOS}?page=${i + 1}`)
      );

      const results = await Promise.all(pagePromises);
      const allPermisos = results.flatMap(res => res?.data || []);
      
      setPermisos(allPermisos);
    } catch (err) {
      console.error('Error cargando permisos:', err);
      setError('Error al cargar los permisos. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  // Cargar módulos
  const loadModulos = useCallback(async () => {
    setLoadingModulos(true);
    try {
      const data = await fetchData(API_MODULOS);
      setModulos(Array.isArray(data) ? data : Object.keys(MODULO_CONFIG));
    } catch (err) {
      console.error('Error cargando módulos:', err);
      setModulos(Object.keys(MODULO_CONFIG));
    } finally {
      setLoadingModulos(false);
    }
  }, [fetchData]);

  // Cargar datos iniciales
  useEffect(() => {
    Promise.all([loadAllPermisos(), loadModulos()]);
  }, [loadAllPermisos, loadModulos]);

  // Permisos filtrados y ordenados (memoizado)
  const filteredAndSortedPermisos = useMemo(() => {
    let filtered = [...permisos];

    // Filtro por módulo
    if (moduloFilter !== 'all') {
      filtered = filtered.filter(p => 
        p.modulo?.toLowerCase() === moduloFilter.toLowerCase()
      );
    }

    // Búsqueda por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.nombre?.toLowerCase().includes(term) ||
        p.descripcion?.toLowerCase().includes(term) ||
        p.slug?.toLowerCase().includes(term) ||
        p.modulo?.toLowerCase().includes(term)
      );
    }

    // Ordenación
    filtered.sort((a, b) => {
      const aValue = (a[sortBy] || '').toString().toLowerCase();
      const bValue = (b[sortBy] || '').toString().toLowerCase();
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    return filtered;
  }, [permisos, moduloFilter, searchTerm, sortBy, sortOrder]);

  // Paginación (memoizado)
  const paginatedPermisos = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    return filteredAndSortedPermisos.slice(startIndex, startIndex + perPage);
  }, [filteredAndSortedPermisos, currentPage, perPage]);

  const totalPages = Math.ceil(filteredAndSortedPermisos.length / perPage);

  // Estadísticas (memoizado)
  const stats = useMemo(() => {
    const conteoModulos = permisos.reduce((acc, p) => {
      const mod = p.modulo || 'sin-modulo';
      acc[mod] = (acc[mod] || 0) + 1;
      return acc;
    }, {});

    const topModulos = Object.entries(conteoModulos)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3);

    return { total: permisos.length, topModulos, modulosUnicos: Object.keys(conteoModulos).length };
  }, [permisos]);

  // CRUD Operations
  const createPermiso = useCallback(async () => {
    const newErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!form.modulo.trim()) newErrors.modulo = 'El módulo es requerido';
    if (form.nombre.length > 100) newErrors.nombre = 'Máximo 100 caracteres';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const data = await fetchData(API_PERMISOS, {
        method: 'POST',
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          modulo: form.modulo
        })
      });

      if (data) {
        setShowModal(false);
        await loadAllPermisos();
        alert('✅ Permiso creado exitosamente');
      }
    } catch (err) {
      alert('❌ Error al crear permiso');
    }
  }, [form, fetchData, loadAllPermisos]);

  const updatePermiso = useCallback(async () => {
    if (!selected) return;

    const newErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!form.modulo.trim()) newErrors.modulo = 'El módulo es requerido';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const data = await fetchData(`${API_PERMISOS}/${getPermisoId(selected)}`, {
        method: 'PUT',
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          modulo: form.modulo
        })
      });

      if (data) {
        setShowModal(false);
        await loadAllPermisos();
        alert('✅ Permiso actualizado exitosamente');
      }
    } catch (err) {
      alert('❌ Error al actualizar permiso');
    }
  }, [form, selected, fetchData, loadAllPermisos]);

  const deletePermiso = useCallback(async (id) => {
    try {
      await fetchData(`${API_PERMISOS}/${id}`, { method: 'DELETE' });
      setShowDeleteModal(false);
      await loadAllPermisos();
      alert('✅ Permiso eliminado exitosamente');
    } catch (err) {
      alert('❌ Error al eliminar permiso');
    }
  }, [fetchData, loadAllPermisos]);

  const bulkDelete = useCallback(async () => {
    if (selectedPermisos.length === 0) return;
    
    if (!confirm(`¿Eliminar ${selectedPermisos.length} permiso(s)?`)) return;

    try {
      await Promise.all(
        selectedPermisos.map(id => 
          fetchData(`${API_PERMISOS}/${id}`, { method: 'DELETE' })
        )
      );
      
      setSelectedPermisos([]);
      await loadAllPermisos();
      alert(`✅ ${selectedPermisos.length} permiso(s) eliminados`);
    } catch (err) {
      alert('❌ Error en la eliminación masiva');
    }
  }, [selectedPermisos, fetchData, loadAllPermisos]);

  // Handlers
  const openCreateModal = useCallback(() => {
    setMode('create');
    setForm({ nombre: '', descripcion: '', modulo: 'usuarios' });
    setErrors({});
    setSelected(null);
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((permiso) => {
    setMode('edit');
    setSelected(permiso);
    setForm({
      nombre: permiso.nombre || '',
      descripcion: permiso.descripcion || '',
      modulo: permiso.modulo || 'usuarios'
    });
    setErrors({});
    setShowModal(true);
  }, []);

  const togglePermisoSelection = useCallback((id) => {
    setSelectedPermisos(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedPermisos(prev => 
      prev.length === paginatedPermisos.length 
        ? [] 
        : paginatedPermisos.map(p => getPermisoId(p))
    );
  }, [paginatedPermisos]);

  // Render helpers
  const renderModuloBadge = useCallback((modulo) => {
    const config = getModuloConfig(modulo);
    const Icon = config.icon;
    
    return (
      <span 
        className="permiso-badge-modulo"
        style={{ 
          backgroundColor: `${config.color}15`,
          color: config.color,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 500
        }}
      >
        <Icon size={14} />
        {config.label}
      </span>
    );
  }, []);

  if (loading) {
    return (
      <div className="permiso-container">
        <Sidebar />
        <div className="permiso-content">
          <Topbar />
          <div className="permiso-loading">
            <div className="permiso-loading-spinner"></div>
            <p>Cargando permisos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="permiso-container">
        <Sidebar />
        <div className="permiso-content">
          <Topbar />
          <div className="permiso-error">
            <AlertTriangle size={48} className="permiso-error-icon" />
            <h3>Error al cargar permisos</h3>
            <p>{error}</p>
            <button onClick={loadAllPermisos} className="permiso-btn permiso-btn-primary">
              <RefreshCw size={18} /> Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="permiso-container">
      <Sidebar />
      
      <div className="permiso-content">
        <Topbar />
        
        {/* Header */}
        <div className="permiso-header">
          <div style={{flex: 1, minWidth: 0}}>
            <h1 className="permiso-title">
              <ShieldCheck size={28} />
              Gestión de Permisos
            </h1>
            <p className="permiso-subtitle">
              {stats.total > 0 ? `${stats.total} permisos en el sistema` : 'Administra los permisos del sistema'}
            </p>
          </div>
          
          <div className="permiso-header-actions">
            <button 
              onClick={loadAllPermisos} 
              className="permiso-btn permiso-btn-secondary"
              disabled={loading}
            >
              <RefreshCw size={20} /> <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button onClick={openCreateModal} className="permiso-btn permiso-btn-primary">
              <Plus size={20} /> <span className="hidden sm:inline">Nuevo Permiso</span>
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="permiso-stats-grid">
          <div className="permiso-stat-card">
            <div className="permiso-stat-icon" style={{backgroundColor: '#f5f3ff', color: '#8b5cf6'}}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="permiso-stat-number">{stats.total}</h3>
              <p className="permiso-stat-label">Total Permisos</p>
            </div>
          </div>
          
          {stats.topModulos.map((modulo, index) => {
            const config = getModuloConfig(modulo.nombre);
            const Icon = config.icon;
            return (
              <div key={index} className="permiso-stat-card">
                <div 
                  className="permiso-stat-icon" 
                  style={{
                    backgroundColor: `${config.color}15`,
                    color: config.color
                  }}
                >
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="permiso-stat-number">{modulo.cantidad}</h3>
                  <p className="permiso-stat-label" style={{textTransform: 'capitalize'}}>
                    {config.label}
                  </p>
                </div>
              </div>
            );
          })}
          
          <div className="permiso-stat-card">
            <div className="permiso-stat-icon" style={{backgroundColor: '#f0f9ff', color: '#3b82f6'}}>
              <Grid size={24} />
            </div>
            <div>
              <h3 className="permiso-stat-number">{stats.modulosUnicos}</h3>
              <p className="permiso-stat-label">Módulos Únicos</p>
            </div>
          </div>
        </div>

        {/* Barra de herramientas */}
        <div className="permiso-toolbar">
          <div className="permiso-toolbar-row">
            <div className="permiso-search-container">
              <Search className="permiso-search-icon" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="permiso-search-input"
                placeholder="Buscar permisos..."
              />
            </div>
            
            <div className="permiso-filters">
              <select
                value={moduloFilter}
                onChange={(e) => {
                  setModuloFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="permiso-filter-select"
              >
                <option value="all">Todos los módulos</option>
                {modulos.map((modulo, index) => (
                  <option key={index} value={modulo}>
                    {getModuloConfig(modulo).label}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="permiso-btn permiso-btn-secondary"
              >
                <ArrowUpDown size={18} />
                {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
              </button>
            </div>
          </div>
          
          {/* Acciones masivas */}
          {selectedPermisos.length > 0 && (
            <div className="permiso-toolbar-actions">
              <div className="permiso-bulk-actions">
                <span className="permiso-bulk-info">
                  {selectedPermisos.length} permiso(s) seleccionado(s)
                </span>
                <button
                  onClick={bulkDelete}
                  className="permiso-btn permiso-btn-danger permiso-btn-sm"
                >
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabla */}
        {filteredAndSortedPermisos.length === 0 ? (
          <div className="permiso-empty-state">
            <Shield size={64} className="permiso-empty-state-icon" />
            <h3>No se encontraron resultados</h3>
            <p>Intenta con otros términos de búsqueda</p>
          </div>
        ) : (
          <>
            <div className="permiso-table-container">
              <div style={{
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '0.875rem',
                color: '#6b7280',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>
                  Mostrando {Math.min((currentPage - 1) * perPage + 1, filteredAndSortedPermisos.length)} a{' '}
                  {Math.min(currentPage * perPage, filteredAndSortedPermisos.length)} de{' '}
                  {filteredAndSortedPermisos.length} permisos
                </span>
                <span>
                  Página {currentPage} de {totalPages}
                </span>
              </div>
              
              <table className="permiso-table">
                <thead>
                  <tr>
                    <th style={{width: '50px'}}>
                      <input
                        type="checkbox"
                        checked={selectedPermisos.length === paginatedPermisos.length && paginatedPermisos.length > 0}
                        onChange={toggleSelectAll}
                        className="permiso-checkbox"
                      />
                    </th>
                    <th onClick={() => setSortBy('nombre')} style={{cursor: 'pointer'}}>
                      Nombre {sortBy === 'nombre' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Slug</th>
                    <th onClick={() => setSortBy('modulo')} style={{cursor: 'pointer'}}>
                      Módulo {sortBy === 'modulo' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPermisos.map(permiso => {
                    const id = getPermisoId(permiso);
                    return (
                      <tr key={id} className={selectedPermisos.includes(id) ? 'selected' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedPermisos.includes(id)}
                            onChange={() => togglePermisoSelection(id)}
                            className="permiso-checkbox"
                          />
                        </td>
                        <td>
                          <div style={{fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <Lock size={14} style={{color: getModuloConfig(permiso.modulo).color}} />
                            {permiso.nombre}
                          </div>
                        </td>
                        <td>
                          <code style={{
                            fontSize: '0.75rem',
                            backgroundColor: '#f3f4f6',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem'
                          }}>
                            {permiso.slug || 'N/A'}
                          </code>
                        </td>
                        <td>{renderModuloBadge(permiso.modulo)}</td>
                        <td style={{fontSize: '0.875rem', color: '#6b7280'}}>
                          {permiso.descripcion || 'Sin descripción'}
                        </td>
                        <td>
                          <div className="permiso-actions-cell">
                            <button
                              onClick={() => {
                                setSelected(permiso);
                                setShowDetailModal(true);
                              }}
                              className="permiso-action-btn permiso-action-btn-view"
                              title="Ver detalles"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(permiso)}
                              className="permiso-action-btn permiso-action-btn-edit"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelected(permiso);
                                setShowDeleteModal(true);
                              }}
                              className="permiso-action-btn permiso-action-btn-delete"
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

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="permiso-pagination">
                <div className="permiso-pagination-info">
                  Mostrando {(currentPage - 1) * perPage + 1} a{' '}
                  {Math.min(currentPage * perPage, filteredAndSortedPermisos.length)} de{' '}
                  {filteredAndSortedPermisos.length}
                </div>
                
                <div className="permiso-pagination-controls">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="permiso-pagination-btn"
                  >
                    <ChevronLeft size={18} /> Anterior
                  </button>
                  
                  <div className="permiso-pagination-pages">
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
                          className={`permiso-pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="permiso-pagination-btn"
                  >
                    Siguiente <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal Crear/Editar */}
        {showModal && (
          <div className="permiso-modal-overlay">
            <div className="permiso-modal">
              <div className="permiso-modal-header">
                <h2 className="permiso-modal-title">
                  {mode === 'create' ? 'Crear Nuevo Permiso' : 'Editar Permiso'}
                </h2>
                <button onClick={() => setShowModal(false)} className="permiso-modal-close">
                  <X size={20} />
                </button>
              </div>
              
              <div className="permiso-modal-body">
                <div className="permiso-form-group">
                  <label className="permiso-form-label required">Nombre del Permiso</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => setForm({...form, nombre: e.target.value})}
                    className="permiso-form-input"
                    placeholder="Ej: usuario.crear"
                    maxLength="100"
                  />
                  {errors.nombre && <div className="permiso-form-error">{errors.nombre}</div>}
                </div>
                
                <div className="permiso-form-group">
                  <label className="permiso-form-label required">Módulo</label>
                  <select
                    value={form.modulo}
                    onChange={e => setForm({...form, modulo: e.target.value})}
                    className="permiso-form-select"
                  >
                    {Object.entries(MODULO_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                  {errors.modulo && <div className="permiso-form-error">{errors.modulo}</div>}
                </div>
                
                <div className="permiso-form-group">
                  <label className="permiso-form-label">Descripción</label>
                  <textarea
                    value={form.descripcion}
                    onChange={e => setForm({...form, descripcion: e.target.value})}
                    className="permiso-form-textarea"
                    placeholder="Descripción del permiso..."
                    rows="3"
                    maxLength="500"
                  />
                  <div className="permiso-form-help">{form.descripcion.length}/500 caracteres</div>
                </div>
              </div>
              
              <div className="permiso-modal-footer">
                <button onClick={() => setShowModal(false)} className="permiso-btn permiso-btn-secondary">
                  Cancelar
                </button>
                <button 
                  onClick={mode === 'create' ? createPermiso : updatePermiso}
                  className="permiso-btn permiso-btn-primary"
                >
                  {mode === 'create' ? 'Crear Permiso' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detalle */}
        {showDetailModal && selected && (
          <div className="permiso-modal-overlay">
            <div className="permiso-modal permiso-modal-lg">
              <div className="permiso-modal-header">
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '12px'}}>
                  <div style={{
                    padding: '12px',
                    backgroundColor: `${getModuloConfig(selected.modulo).color}15`,
                    borderRadius: '12px',
                    color: getModuloConfig(selected.modulo).color
                  }}>
                    <Shield size={24} />
                  </div>
                  <div>
                    <h2 className="permiso-modal-title">{selected.nombre}</h2>
                    <p className="permiso-modal-subtitle">Detalles completos del permiso</p>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="permiso-modal-close">
                  <X size={20} />
                </button>
              </div>
              
              <div className="permiso-modal-body">
                <div className="permiso-details">
                  <div className="permiso-detail-section">
                    <h3 className="permiso-detail-title">Información General</h3>
                    <div className="permiso-detail-grid">
                      <div className="permiso-detail-item">
                        <span className="permiso-detail-label">ID</span>
                        <span className="permiso-detail-value">#{getPermisoId(selected)}</span>
                      </div>
                      <div className="permiso-detail-item">
                        <span className="permiso-detail-label">Slug</span>
                        <code style={{
                          fontFamily: 'monospace',
                          backgroundColor: '#f3f4f6',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem'
                        }}>
                          {selected.slug || 'N/A'}
                        </code>
                      </div>
                      <div className="permiso-detail-item">
                        <span className="permiso-detail-label">Módulo</span>
                        {renderModuloBadge(selected.modulo)}
                      </div>
                      <div className="permiso-detail-item">
                        <span className="permiso-detail-label">Creado</span>
                        <span className="permiso-detail-value">
                          {selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {selected.descripcion && (
                    <div className="permiso-detail-section">
                      <h3 className="permiso-detail-title">Descripción</h3>
                      <p className="permiso-detail-description">
                        {selected.descripcion}
                      </p>
                    </div>
                  )}
                  
                  {selected.roles && selected.roles.length > 0 && (
                    <div className="permiso-detail-section">
                      <h3 className="permiso-detail-title">Roles Asociados ({selected.roles.length})</h3>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginTop: '0.5rem'
                      }}>
                        {selected.roles.map(rol => (
                          <span key={rol.id || rol.id_rol} style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: '#dbeafe',
                            color: '#1d4ed8',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}>
                            {rol.nombre || rol.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="permiso-modal-footer">
                <button onClick={() => setShowDetailModal(false)} className="permiso-btn permiso-btn-secondary">
                  Cerrar
                </button>
                <button 
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(selected);
                  }}
                  className="permiso-btn permiso-btn-primary"
                >
                  <Edit2 size={18} /> Editar Permiso
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Eliminar */}
        {showDeleteModal && selected && (
          <div className="permiso-modal-overlay">
            <div className="permiso-modal">
              <div className="permiso-modal-header">
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div className="permiso-delete-icon">
                    <AlertTriangle size={28} />
                  </div>
                  <div>
                    <h2 className="permiso-modal-title" style={{color: '#ef4444'}}>Eliminar Permiso</h2>
                    <p className="permiso-modal-subtitle">Esta acción no se puede deshacer</p>
                  </div>
                </div>
              </div>
              
              <div className="permiso-modal-body">
                <div className="permiso-delete-confirm">
                  <p className="permiso-delete-message">
                    ¿Estás seguro de eliminar el permiso <strong>"{selected.nombre}"</strong>?
                  </p>
                  
                  <div className="permiso-delete-warning">
                    <AlertTriangle className="permiso-delete-warning-icon" size={20} />
                    <span>
                      <strong>Advertencia:</strong> Este permiso puede estar asociado a roles del sistema.
                    </span>
                  </div>
                  
                  <div className="permiso-delete-list">
                    <p>Esta acción eliminará permanentemente:</p>
                    <ul>
                      <li>El permiso del sistema</li>
                      <li>Las asociaciones con roles</li>
                      <li>El historial de uso del permiso</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="permiso-modal-footer">
                <button onClick={() => setShowDeleteModal(false)} className="permiso-btn permiso-btn-secondary">
                  Cancelar
                </button>
                <button 
                  onClick={() => deletePermiso(getPermisoId(selected))}
                  className="permiso-btn permiso-btn-danger"
                >
                  <Trash2 size={18} /> Eliminar Permanentemente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Permiso;