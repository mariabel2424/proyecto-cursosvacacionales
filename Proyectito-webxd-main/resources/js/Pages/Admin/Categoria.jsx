import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, X, Filter, Search, RefreshCw, 
  Eye, ChevronLeft, ChevronRight, AlertTriangle, 
  CheckCircle, XCircle, Users, Tag, User, Calendar,
  Download, Upload, MoreVertical, CheckSquare, Square,
  ArrowUpDown, BarChart3, Activity, TrendingUp, TrendingDown,
  Users as UsersIcon, Info
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/categoria.css';

const API_CATEGORIAS = 'http://127.0.0.1:8000/api/categorias';
const API_DEPORTISTAS = 'http://127.0.0.1:8000/api/deportistas';

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

const Categoria = () => {
  // Estados principales
  const [categorias, setCategorias] = useState([]);
  const [filteredCategorias, setFilteredCategorias] = useState([]);
  const [deportistasCount, setDeportistasCount] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mode, setMode] = useState('create');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  
  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [generoFilter, setGeneroFilter] = useState('all');
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Selección masiva
  const [selectedCategorias, setSelectedCategorias] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Formulario
  const [form, setForm] = useState({
    nombre: '',
    edad_minima: '',
    edad_maxima: '',
    genero: 'mixto',
    descripcion: '',
    activo: true
  });

  // Obtener ID de categoría
  const getCategoriaId = (categoria) => {
    return categoria.id_categoria || categoria.id || 0;
  };

  // Cargar categorías
  const loadCategorias = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = authHeaders();
      const res = await fetch(API_CATEGORIAS, { headers });
      
      if (!res.ok) throw new Error('Error al cargar categorías');
      
      const data = await res.json();
      let categoriasData = [];
      
      if (data.data && Array.isArray(data.data)) {
        categoriasData = data.data;
      } else if (Array.isArray(data)) {
        categoriasData = data;
      }
      
      setCategorias(categoriasData);
      setFilteredCategorias(categoriasData);
      setTotalPages(Math.ceil(categoriasData.length / itemsPerPage));
      
      // Cargar conteo de deportistas para cada categoría
      loadDeportistasCount(categoriasData);
      
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar las categorías. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar conteo de deportistas por categoría
  const loadDeportistasCount = async (categoriasData) => {
    try {
      const headers = authHeaders();
      const counts = {};
      
      for (const categoria of categoriasData) {
        const categoriaId = getCategoriaId(categoria);
        try {
          const res = await fetch(`${API_DEPORTISTAS}?id_categoria=${categoriaId}`, { headers });
          
          if (res.ok) {
            const data = await res.json();
            counts[categoriaId] = Array.isArray(data) ? data.length : 
                                (data.data && Array.isArray(data.data) ? data.data.length : 0);
          } else {
            counts[categoriaId] = 0;
          }
        } catch (err) {
          console.error(`Error cargando deportistas para categoría ${categoriaId}:`, err);
          counts[categoriaId] = 0;
        }
      }
      
      setDeportistasCount(counts);
    } catch (error) {
      console.error('Error cargando conteo de deportistas:', error);
      // Si hay error, inicializar counts como objeto vacío
      setDeportistasCount({});
    }
  };

  useEffect(() => {
    loadCategorias();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...categorias];

    // Búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(categoria =>
        categoria.nombre?.toLowerCase().includes(term) ||
        categoria.descripcion?.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(categoria => categoria.activo === isActive);
    }

    // Filtro por género
    if (generoFilter !== 'all') {
      filtered = filtered.filter(categoria => categoria.genero === generoFilter);
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

    setFilteredCategorias(filtered);
    setCurrentPage(1);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  }, [categorias, searchTerm, statusFilter, generoFilter, sortBy, sortOrder]);

  // Datos paginados
  const paginatedCategorias = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCategorias.slice(startIndex, endIndex);
  }, [filteredCategorias, currentPage, itemsPerPage]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = categorias.length;
    const active = categorias.filter(c => c.activo === true).length;
    const inactive = categorias.filter(c => c.activo === false).length;
    
    // Conteo por género
    const masculino = categorias.filter(c => c.genero === 'masculino').length;
    const femenino = categorias.filter(c => c.genero === 'femenino').length;
    const mixto = categorias.filter(c => c.genero === 'mixto').length;
    
    // Total deportistas en categorías activas
    const totalDeportistas = Object.values(deportistasCount).reduce((sum, count) => sum + count, 0);
    
    return { 
      total, 
      active, 
      inactive, 
      masculino, 
      femenino, 
      mixto,
      totalDeportistas 
    };
  }, [categorias, deportistasCount]);

  // Componente para ícono de género
  const GenderIcon = ({ genero, size = 12 }) => {
    const emojis = {
      masculino: '♂',
      femenino: '♀', 
      mixto: '⚥'
    };
    
    const colors = {
      masculino: '#3b82f6',
      femenino: '#ec4899',
      mixto: '#8b5cf6'
    };
    
    return (
      <span style={{
        fontSize: `${size}px`,
        color: colors[genero] || '#6b7280',
        display: 'inline-block',
        lineHeight: 1
      }}>
        {emojis[genero] || '?'}
      </span>
    );
  };

  // CRUD Operations
  const createCategoria = async () => {
    if (!validateForm()) return;
    
    const payload = {
      nombre: form.nombre.trim(),
      edad_minima: parseInt(form.edad_minima) || 0,
      edad_maxima: parseInt(form.edad_maxima) || 0,
      genero: form.genero,
      descripcion: form.descripcion.trim(),
      activo: form.activo
    };

    try {
      const res = await fetch(API_CATEGORIAS, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const responseData = await res.json();
      
      if (res.ok) {
        closeModal();
        loadCategorias();
        alert('✅ Categoría creada exitosamente');
      } else {
        handleApiError(responseData);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  const updateCategoria = async () => {
    if (!validateForm() || !selected) return;
    
    const payload = {
      nombre: form.nombre.trim(),
      edad_minima: parseInt(form.edad_minima) || 0,
      edad_maxima: parseInt(form.edad_maxima) || 0,
      genero: form.genero,
      descripcion: form.descripcion.trim(),
      activo: form.activo
    };

    try {
      const res = await fetch(`${API_CATEGORIAS}/${getCategoriaId(selected)}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const responseData = await res.json();

      if (res.ok) {
        closeModal();
        loadCategorias();
        alert('✅ Categoría actualizada exitosamente');
      } else {
        handleApiError(responseData);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  const deleteCategoria = async (id) => {
    if (!id) return;
    
    try {
      const res = await fetch(`${API_CATEGORIAS}/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (res.ok) {
        closeDeleteModal();
        loadCategorias();
        alert('✅ Categoría eliminada exitosamente');
      } else {
        const error = await res.json();
        alert(`❌ ${error.message || 'Error al eliminar categoría'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  const toggleCategoriaStatus = async (categoria, nuevoEstado) => {
    if (!confirm(`¿${nuevoEstado ? 'Activar' : 'Desactivar'} la categoría "${categoria.nombre}"?`)) return;
    
    try {
      const res = await fetch(`${API_CATEGORIAS}/${getCategoriaId(categoria)}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ activo: nuevoEstado })
      });

      if (res.ok) {
        loadCategorias();
        alert(`✅ Categoría ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`);
      } else {
        alert('❌ Error al cambiar estado de la categoría');
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
    if (form.edad_minima === '') newErrors.edad_minima = 'La edad mínima es requerida';
    if (form.edad_maxima === '') newErrors.edad_maxima = 'La edad máxima es requerida';
    
    if (form.edad_minima !== '' && form.edad_maxima !== '') {
      const min = parseInt(form.edad_minima);
      const max = parseInt(form.edad_maxima);
      
      if (min < 0) newErrors.edad_minima = 'La edad mínima debe ser mayor o igual a 0';
      if (max < 0) newErrors.edad_maxima = 'La edad máxima debe ser mayor o igual a 0';
      if (min > max) newErrors.edad_maxima = 'La edad máxima debe ser mayor que la mínima';
    }
    
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
      nombre: '',
      edad_minima: '',
      edad_maxima: '',
      genero: 'mixto',
      descripcion: '',
      activo: true
    });
    setErrors({});
    setSelected(null);
    setShowModal(true);
  };

  const openEditModal = (categoria) => {
    setMode('edit');
    setSelected(categoria);
    setForm({ 
      nombre: categoria.nombre || '',
      edad_minima: categoria.edad_minima || '',
      edad_maxima: categoria.edad_maxima || '',
      genero: categoria.genero || 'mixto',
      descripcion: categoria.descripcion || '',
      activo: categoria.activo === undefined ? true : categoria.activo
    });
    setErrors({});
    setShowModal(true);
  };

  const openDetailModal = (categoria) => {
    setSelected(categoria);
    setShowDetailModal(true);
  };

  const openDeleteModal = (categoria) => {
    setSelected(categoria);
    setShowDeleteModal(true);
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

  // Selection
  const toggleCategoriaSelection = (id) => {
    setSelectedCategorias(prev => {
      if (prev.includes(id)) {
        return prev.filter(categoriaId => categoriaId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedCategorias([]);
    } else {
      const allIds = paginatedCategorias.map(c => getCategoriaId(c));
      setSelectedCategorias(allIds);
    }
    setSelectAll(!selectAll);
  };

  // Bulk actions
  const bulkToggleStatus = async (status) => {
    if (selectedCategorias.length === 0) {
      alert('❌ Selecciona al menos una categoría');
      return;
    }

    if (!confirm(`${status ? 'Activar' : 'Desactivar'} ${selectedCategorias.length} categoría(s)?`)) return;

    try {
      const promises = selectedCategorias.map(id => 
        fetch(`${API_CATEGORIAS}/${id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ activo: status })
        })
      );

      await Promise.all(promises);
      loadCategorias();
      alert(`✅ ${selectedCategorias.length} categoría(s) ${status ? 'activadas' : 'desactivadas'} exitosamente`);
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error en la operación masiva');
    }
  };

  const bulkDelete = async () => {
    if (selectedCategorias.length === 0) {
      alert('❌ Selecciona al menos una categoría');
      return;
    }

    if (!confirm(`¿Eliminar ${selectedCategorias.length} categoría(s)? Esta acción no se puede deshacer.`)) return;

    try {
      const promises = selectedCategorias.map(id => 
        fetch(`${API_CATEGORIAS}/${id}`, {
          method: 'DELETE',
          headers: authHeaders()
        })
      );

      await Promise.all(promises);
      loadCategorias();
      alert(`✅ ${selectedCategorias.length} categoría(s) eliminadas exitosamente`);
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error en la eliminación masiva');
    }
  };

  return (
    <div className="categoria-container">
      <Sidebar />
      
      <div className="categoria-content">
        <Topbar />
        
        {/* HEADER */}
        <div className="categoria-header">
          <div>
            <h1 className="categoria-title">
              <Tag size={28} />
              Gestión de Categorías
            </h1>
            <p className="categoria-subtitle">Administra las categorías por edad y género</p>
          </div>
          <button onClick={openCreateModal} className="categoria-btn categoria-btn-primary">
            <Plus size={20} /> Nueva Categoría
          </button>
        </div>

        {/* ESTADÍSTICAS */}
        <div className="categoria-stats-grid">
          <div className="categoria-stat-card">
            <div className="categoria-stat-icon" style={{backgroundColor: '#f5f3ff', color: '#7c3aed'}}>
              <Tag size={24} />
            </div>
            <div className="categoria-stat-content">
              <h3 className="categoria-stat-number">{stats.total}</h3>
              <p className="categoria-stat-label">Total Categorías</p>
            </div>
          </div>
          
          <div className="categoria-stat-card">
            <div className="categoria-stat-icon" style={{backgroundColor: '#d1fae5', color: '#10b981'}}>
              <CheckCircle size={24} />
            </div>
            <div className="categoria-stat-content">
              <h3 className="categoria-stat-number">{stats.active}</h3>
              <p className="categoria-stat-label">Categorías Activas</p>
              {stats.total > 0 && (
                <div className="categoria-stat-trend positive">
                  <TrendingUp size={12} />
                  {Math.round((stats.active / stats.total) * 100)}%
                </div>
              )}
            </div>
          </div>
          
          <div className="categoria-stat-card">
            <div className="categoria-stat-icon" style={{backgroundColor: '#fee2e2', color: '#ef4444'}}>
              <Users size={24} />
            </div>
            <div className="categoria-stat-content">
              <h3 className="categoria-stat-number">{stats.totalDeportistas}</h3>
              <p className="categoria-stat-label">Deportistas Totales</p>
            </div>
          </div>
          
          <div className="categoria-stat-card">
            <div className="categoria-stat-icon" style={{backgroundColor: '#fef3c7', color: '#f59e0b'}}>
              <Activity size={24} />
            </div>
            <div className="categoria-stat-content">
              <h3 className="categoria-stat-number">{stats.mixto}</h3>
              <p className="categoria-stat-label">Categorías Mixtas</p>
              <div className="categoria-stat-trend">
                <span style={{color: '#6b7280', fontSize: '0.75rem'}}>
                  M: {stats.masculino} | F: {stats.femenino}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BARRA DE HERRAMIENTAS */}
        <div className="categoria-toolbar">
          <div className="categoria-search-container">
            <div className="categoria-search">
              <Search className="categoria-search-icon" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="categoria-search-input"
                placeholder="Buscar categorías..."
              />
            </div>
            
            <div className="categoria-filters">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="categoria-filter-select"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Solo activas</option>
                <option value="inactive">Solo inactivas</option>
              </select>
              
              <select
                value={generoFilter}
                onChange={(e) => setGeneroFilter(e.target.value)}
                className="categoria-filter-select"
              >
                <option value="all">Todos los géneros</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="mixto">Mixto</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="categoria-btn categoria-btn-secondary"
              >
                <ArrowUpDown size={18} />
                Ordenar
              </button>
            </div>
          </div>
          
          {/* ACCIONES MASIVAS */}
          {selectedCategorias.length > 0 && (
            <div className="categoria-actions">
              <div className="categoria-bulk-actions">
                <span className="categoria-bulk-info">
                  {selectedCategorias.length} categoría(s) seleccionada(s)
                </span>
                <button
                  onClick={() => bulkToggleStatus(true)}
                  className="categoria-btn categoria-btn-success categoria-btn-sm"
                >
                  <CheckCircle size={16} /> Activar
                </button>
                <button
                  onClick={() => bulkToggleStatus(false)}
                  className="categoria-btn categoria-btn-danger categoria-btn-sm"
                >
                  <XCircle size={16} /> Desactivar
                </button>
                <button
                  onClick={bulkDelete}
                  className="categoria-btn categoria-btn-danger categoria-btn-sm"
                >
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
              
              <div className="categoria-toolbar-buttons">
                <button
                  onClick={loadCategorias}
                  className="categoria-btn categoria-btn-secondary categoria-btn-icon"
                  title="Actualizar"
                >
                  <RefreshCw size={18} />
                </button>
                <button
                  onClick={() => setSelectedCategorias([])}
                  className="categoria-btn categoria-btn-secondary categoria-btn-icon"
                  title="Limpiar selección"
                  disabled={selectedCategorias.length === 0}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CONTENIDO PRINCIPAL */}
        {loading ? (
          <div className="categoria-loading">
            <div className="categoria-loading-spinner"></div>
            <p>Cargando categorías...</p>
          </div>
        ) : error ? (
          <div className="categoria-error">
            <AlertTriangle size={48} className="categoria-error-icon" />
            <h3>Error al cargar categorías</h3>
            <p>{error}</p>
            <button onClick={loadCategorias} className="categoria-btn categoria-btn-primary" style={{marginTop: '1rem'}}>
              <RefreshCw size={18} /> Reintentar
            </button>
          </div>
        ) : filteredCategorias.length === 0 ? (
          <div className="categoria-empty-state">
            <Tag size={64} className="categoria-empty-state-icon" />
            <h3>
              {searchTerm ? 'No se encontraron resultados' : 'No hay categorías registradas'}
            </h3>
            <p>
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza creando tu primera categoría'}
            </p>
            <button onClick={openCreateModal} className="categoria-btn categoria-btn-primary" style={{marginTop: '1.5rem'}}>
              <Plus size={18} /> Crear Categoría
            </button>
          </div>
        ) : (
          <>
            <div className="categoria-table-container">
              <table className="categoria-table">
                <thead>
                  <tr>
                    <th style={{width: '50px'}}>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="categoria-checkbox"
                      />
                    </th>
                    <th className="sortable" onClick={() => setSortBy('nombre')}>
                      Nombre
                      {sortBy === 'nombre' && (
                        <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th>Rango de Edad</th>
                    <th>Género</th>
                    <th>Deportistas</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCategorias.map(categoria => {
                    const categoriaId = getCategoriaId(categoria);
                    const isSelected = selectedCategorias.includes(categoriaId);
                    const deportistas = deportistasCount[categoriaId] || 0;
                    
                    return (
                      <tr key={categoriaId} className={isSelected ? 'selected' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCategoriaSelection(categoriaId)}
                            className="categoria-checkbox"
                          />
                        </td>
                        <td>
                          <div style={{fontWeight: '600', color: '#1f2937'}}>
                            {categoria.nombre}
                          </div>
                          {categoria.descripcion && (
                            <div style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem'}}>
                              {categoria.descripcion.substring(0, 50)}
                              {categoria.descripcion.length > 50 ? '...' : ''}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="categoria-age-range">
                            <span>{categoria.edad_minima} años</span>
                            <span className="separator">-</span>
                            <span>{categoria.edad_maxima} años</span>
                          </div>
                        </td>
                        <td>
                          <span className={`categoria-badge-gender categoria-badge-${categoria.genero}`}>
                            <GenderIcon genero={categoria.genero} size={12} />
                            {categoria.genero === 'masculino' ? 'Masculino' : 
                             categoria.genero === 'femenino' ? 'Femenino' : 'Mixto'}
                          </span>
                        </td>
                        <td>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <User size={14} style={{color: '#6b7280'}} />
                            <span>{deportistas} deportistas</span>
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => toggleCategoriaStatus(categoria, !categoria.activo)}
                            className={`categoria-badge ${categoria.activo ? 'categoria-badge-active' : 'categoria-badge-inactive'}`}
                          >
                            {categoria.activo ? (
                              <>
                                <CheckCircle size={12} /> Activa
                              </>
                            ) : (
                              <>
                                <XCircle size={12} /> Inactiva
                              </>
                            )}
                          </button>
                        </td>
                        <td>
                          <div className="categoria-actions-cell">
                            <button
                              onClick={() => openDetailModal(categoria)}
                              className="categoria-action-btn categoria-action-btn-view"
                              title="Ver detalles"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(categoria)}
                              className="categoria-action-btn categoria-action-btn-edit"
                              title="Editar categoría"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(categoria)}
                              className="categoria-action-btn categoria-action-btn-delete"
                              title="Eliminar categoría"
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
              <div className="categoria-pagination">
                <div className="categoria-pagination-info">
                  Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredCategorias.length)} a{' '}
                  {Math.min(currentPage * itemsPerPage, filteredCategorias.length)} de{' '}
                  {filteredCategorias.length} categorías
                </div>
                
                <div className="categoria-pagination-controls">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="categoria-pagination-btn"
                  >
                    <ChevronLeft size={18} />
                    Anterior
                  </button>
                  
                  <div className="categoria-pagination-pages">
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
                          className={`categoria-pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="categoria-pagination-btn"
                  >
                    Siguiente
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* MODAL CREAR/EDITAR CATEGORÍA */}
        {showModal && (
          <div className="categoria-modal-overlay">
            <div className="categoria-modal categoria-modal-lg">
              <div className="categoria-modal-header">
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '12px'}}>
                  <div style={{
                    padding: '12px',
                    backgroundColor: mode === 'create' ? '#f5f3ff' : '#fef3c7',
                    borderRadius: '12px',
                    color: mode === 'create' ? '#7c3aed' : '#d97706'
                  }}>
                    <Tag size={24} />
                  </div>
                  <div>
                    <h2 className="categoria-modal-title">
                      {mode === 'create' ? 'Crear Nueva Categoría' : 'Editar Categoría'}
                    </h2>
                    <p className="categoria-modal-subtitle">
                      {mode === 'create' ? 'Complete los detalles de la nueva categoría' : 'Modifique los detalles de la categoría'}
                    </p>
                  </div>
                </div>
                <button onClick={closeModal} className="categoria-modal-close">
                  <X size={20} />
                </button>
              </div>
              
              <div className="categoria-modal-body">
                <form className="categoria-form" onSubmit={(e) => e.preventDefault()}>
                  {/* Nombre */}
                  <div className="categoria-form-group">
                    <label className="categoria-form-label required">
                      <Tag size={16} />
                      Nombre de la categoría
                    </label>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={e => setForm({...form, nombre: e.target.value})}
                      className={`categoria-form-input ${errors.nombre ? 'border-red-500' : ''}`}
                      placeholder="Ej: Sub-15, Juvenil, Senior"
                      maxLength="100"
                    />
                    {errors.nombre && (
                      <div className="categoria-form-error">{errors.nombre}</div>
                    )}
                  </div>
                  
                  {/* Edad Mínima y Máxima */}
                  <div className="categoria-form-row">
                    <div className="categoria-form-group">
                      <label className="categoria-form-label required">
                        <Calendar size={16} />
                        Edad Mínima (años)
                      </label>
                      <input
                        type="number"
                        value={form.edad_minima}
                        onChange={e => setForm({...form, edad_minima: e.target.value})}
                        className={`categoria-form-input ${errors.edad_minima ? 'border-red-500' : ''}`}
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                      {errors.edad_minima && (
                        <div className="categoria-form-error">{errors.edad_minima}</div>
                      )}
                    </div>
                    
                    <div className="categoria-form-group">
                      <label className="categoria-form-label required">
                        <Calendar size={16} />
                        Edad Máxima (años)
                      </label>
                      <input
                        type="number"
                        value={form.edad_maxima}
                        onChange={e => setForm({...form, edad_maxima: e.target.value})}
                        className={`categoria-form-input ${errors.edad_maxima ? 'border-red-500' : ''}`}
                        placeholder="99"
                        min="0"
                        max="100"
                      />
                      {errors.edad_maxima && (
                        <div className="categoria-form-error">{errors.edad_maxima}</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Género */}
                  <div className="categoria-form-group">
                    <label className="categoria-form-label required">
                      <UsersIcon size={16} />
                      Género
                    </label>
                    <select
                      value={form.genero}
                      onChange={e => setForm({...form, genero: e.target.value})}
                      className="categoria-form-select"
                    >
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="mixto">Mixto</option>
                    </select>
                    <div className="categoria-form-help">
                      Determina el género de los deportistas en esta categoría
                    </div>
                  </div>
                  
                  {/* Descripción */}
                  <div className="categoria-form-group">
                    <label className="categoria-form-label">
                      <Info size={16} />
                      Descripción
                    </label>
                    <textarea
                      value={form.descripcion}
                      onChange={e => setForm({...form, descripcion: e.target.value})}
                      className="categoria-form-textarea"
                      placeholder="Descripción opcional de la categoría..."
                      rows="3"
                      maxLength="500"
                    />
                    <div className="categoria-form-help">
                      {form.descripcion.length}/500 caracteres
                    </div>
                  </div>
                  
                  {/* Estado */}
                  <div className="categoria-form-group">
                    <label className="categoria-form-label">Estado</label>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <label className="categoria-switch">
                        <input
                          type="checkbox"
                          checked={form.activo}
                          onChange={e => setForm({...form, activo: e.target.checked})}
                        />
                        <span className="categoria-switch-slider"></span>
                      </label>
                      <span style={{fontSize: '0.875rem', color: form.activo ? '#10b981' : '#6b7280'}}>
                        {form.activo ? 'Categoría Activa' : 'Categoría Inactiva'}
                      </span>
                    </div>
                    <div className="categoria-form-help">
                      Las categorías inactivas no estarán disponibles para nuevos registros
                    </div>
                  </div>
                </form>
              </div>
              
              <div className="categoria-modal-footer">
                <button onClick={closeModal} className="categoria-btn categoria-btn-secondary">
                  Cancelar
                </button>
                <button 
                  onClick={mode === 'create' ? createCategoria : updateCategoria}
                  className="categoria-btn categoria-btn-primary"
                >
                  {mode === 'create' ? 'Crear Categoría' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DETALLE */}
        {showDetailModal && selected && (
          <div className="categoria-modal-overlay">
            <div className="categoria-modal categoria-modal-lg">
              <div className="categoria-modal-header">
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '12px'}}>
                  <div style={{
                    padding: '12px',
                    backgroundColor: selected.activo ? '#d1fae5' : '#fee2e2',
                    borderRadius: '12px',
                    color: selected.activo ? '#10b981' : '#ef4444'
                  }}>
                    <Tag size={24} />
                  </div>
                  <div>
                    <h2 className="categoria-modal-title">{selected.nombre}</h2>
                    <p className="categoria-modal-subtitle">Detalles completos de la categoría</p>
                  </div>
                </div>
                <button onClick={closeModal} className="categoria-modal-close">
                  <X size={20} />
                </button>
              </div>
              
              <div className="categoria-modal-body">
                <div className="categoria-details">
                  <div className="categoria-detail-section">
                    <h3 className="categoria-detail-title">Información General</h3>
                    <div className="categoria-detail-grid">
                      <div className="categoria-detail-item">
                        <span className="categoria-detail-label">ID</span>
                        <span className="categoria-detail-value">#{getCategoriaId(selected)}</span>
                      </div>
                      <div className="categoria-detail-item">
                        <span className="categoria-detail-label">Estado</span>
                        <span className={`categoria-badge ${selected.activo ? 'categoria-badge-active' : 'categoria-badge-inactive'}`}>
                          {selected.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <div className="categoria-detail-item">
                        <span className="categoria-detail-label">Género</span>
                        <span className={`categoria-badge-gender categoria-badge-${selected.genero}`}>
                          <GenderIcon genero={selected.genero} size={12} />
                          {selected.genero === 'masculino' ? 'Masculino' : 
                           selected.genero === 'femenino' ? 'Femenino' : 'Mixto'}
                        </span>
                      </div>
                      <div className="categoria-detail-item">
                        <span className="categoria-detail-label">Deportistas</span>
                        <span className="categoria-detail-value">
                          {deportistasCount[getCategoriaId(selected)] || 0} registrados
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="categoria-detail-section">
                    <h3 className="categoria-detail-title">Rango de Edad</h3>
                    <div className="categoria-detail-grid">
                      <div className="categoria-detail-item">
                        <span className="categoria-detail-label">Edad Mínima</span>
                        <span className="categoria-detail-value">{selected.edad_minima} años</span>
                      </div>
                      <div className="categoria-detail-item">
                        <span className="categoria-detail-label">Edad Máxima</span>
                        <span className="categoria-detail-value">{selected.edad_maxima} años</span>
                      </div>
                      <div className="categoria-detail-item">
                        <span className="categoria-detail-label">Rango Total</span>
                        <span className="categoria-detail-value">
                          {selected.edad_maxima - selected.edad_minima} años de diferencia
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {selected.descripcion && (
                    <div className="categoria-detail-section">
                      <h3 className="categoria-detail-title">Descripción</h3>
                      <p className="categoria-detail-description">
                        {selected.descripcion}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="categoria-modal-footer">
                <button onClick={closeModal} className="categoria-btn categoria-btn-secondary">
                  Cerrar
                </button>
                <button 
                  onClick={() => {
                    closeModal();
                    openEditModal(selected);
                  }}
                  className="categoria-btn categoria-btn-primary"
                >
                  <Edit2 size={18} /> Editar Categoría
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL ELIMINAR */}
        {showDeleteModal && selected && (
          <div className="categoria-modal-overlay">
            <div className="categoria-modal">
              <div className="categoria-modal-header">
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div className="categoria-delete-icon">
                    <AlertTriangle size={28} />
                  </div>
                  <div>
                    <h2 className="categoria-modal-title" style={{color: '#ef4444'}}>Eliminar Categoría</h2>
                    <p className="categoria-modal-subtitle">Esta acción no se puede deshacer</p>
                  </div>
                </div>
              </div>
              
              <div className="categoria-modal-body">
                <div className="categoria-delete-confirm">
                  <p className="categoria-delete-message">
                    ¿Estás seguro de eliminar la categoría <strong>"{selected.nombre}"</strong>?
                  </p>
                  
                  <div className="categoria-delete-warning">
                    <AlertTriangle className="categoria-delete-warning-icon" size={20} />
                    <span>
                      <strong>Advertencia:</strong> Esta categoría tiene{' '}
                      {deportistasCount[getCategoriaId(selected)] || 0} deportistas asociados.
                    </span>
                  </div>
                  
                  <div className="categoria-delete-list">
                    <p>Esta acción eliminará permanentemente:</p>
                    <ul>
                      <li>La categoría del sistema</li>
                      <li>Todos los deportistas asociados perderán esta categoría</li>
                      <li>La relación con otras entidades del sistema</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="categoria-modal-footer">
                <button onClick={closeDeleteModal} className="categoria-btn categoria-btn-secondary">
                  Cancelar
                </button>
                <button 
                  onClick={() => deleteCategoria(getCategoriaId(selected))}
                  className="categoria-btn categoria-btn-danger"
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

export default Categoria;