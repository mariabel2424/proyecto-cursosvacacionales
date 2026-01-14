import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, X, Shield, CheckCircle, XCircle, 
  Key, Users, Search, Filter, RefreshCw, Eye, Lock, Unlock,
  ChevronLeft, ChevronRight, AlertTriangle, Info, Save,
  CheckSquare, Square, ArrowUpDown, MoreVertical
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/rol.css';

const API_ROLES = 'http://127.0.0.1:8000/api/roles';
const API_ROLES_ALL = 'http://127.0.0.1:8000/api/roles/all';
const API_PERMISOS = 'http://127.0.0.1:8000/api/permisos';

/* ================= AUTH HEADERS ================= */
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

const Rol = () => {
  // Estados principales
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mode, setMode] = useState('create');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPermisos, setLoadingPermisos] = useState(true);
  const [errors, setErrors] = useState({});
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Estados para selección masiva
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Formulario
  const [form, setForm] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    activo: true,
    permisos: []
  });

  /* ================= FETCH DATA ================= */
  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ROLES, { headers: authHeaders() });
      if (!res.ok) throw new Error('Error al cargar roles');
      
      const data = await res.json();
      console.log('Datos de roles recibidos:', data);
      
      // Procesar diferentes estructuras de respuesta
      let rolesData = [];
      if (data.data && Array.isArray(data.data)) {
        rolesData = data.data;
        setCurrentPage(data.current_page || 1);
        setTotalPages(data.last_page || 1);
      } else if (Array.isArray(data)) {
        rolesData = data;
      } else if (data.roles && Array.isArray(data.roles)) {
        rolesData = data.roles;
      }
      
      setRoles(rolesData);
      applyFiltersAndSearch(rolesData);
      
    } catch (error) {
      console.error('Error:', error);
      await loadRolesSimple();
    } finally {
      setLoading(false);
    }
  };

  const loadRolesSimple = async () => {
    try {
      const res = await fetch(API_ROLES_ALL, { headers: authHeaders() });
      const data = await res.json();
      
      let rolesData = [];
      if (Array.isArray(data)) {
        rolesData = data;
      } else if (data.data && Array.isArray(data.data)) {
        rolesData = data.data;
      }
      
      setRoles(rolesData);
      applyFiltersAndSearch(rolesData);
      setCurrentPage(1);
      setTotalPages(Math.ceil(rolesData.length / itemsPerPage));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadPermisos = async () => {
    setLoadingPermisos(true);
    try {
      const res = await fetch(API_PERMISOS, { headers: authHeaders() });
      if (!res.ok) throw new Error('Error al cargar permisos');
      
      const data = await res.json();
      console.log('Datos de permisos recibidos:', data);
      
      if (data.data && Array.isArray(data.data)) {
        setPermisos(data.data);
      } else if (Array.isArray(data)) {
        setPermisos(data);
      } else {
        console.warn('Estructura inesperada de permisos:', data);
        setPermisos([]);
      }
    } catch (error) {
      console.error('Error cargando permisos:', error);
      setPermisos([]);
    } finally {
      setLoadingPermisos(false);
    }
  };

  useEffect(() => {
    loadRoles();
    loadPermisos();
  }, []);

  /* ================= FILTROS Y BÚSQUEDA ================= */
  useEffect(() => {
    applyFiltersAndSearch(roles);
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  const applyFiltersAndSearch = (data) => {
    let filtered = [...data];

    // Búsqueda por nombre, slug o descripción
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(rol =>
        rol.nombre?.toLowerCase().includes(term) ||
        rol.slug?.toLowerCase().includes(term) ||
        rol.descripcion?.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(rol => 
        statusFilter === 'active' ? rol.activo : !rol.activo
      );
    }

    // Ordenación
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      if (sortBy === 'activo') {
        aValue = a.activo ? 1 : 0;
        bValue = b.activo ? 1 : 0;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredRoles(filtered);
    setCurrentPage(1);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setSelectedRoles([]);
    setSelectAll(false);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  /* ================= PAGINACIÓN ================= */
  const paginatedRoles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRoles.slice(startIndex, endIndex);
  }, [filteredRoles, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  /* ================= SELECTION ================= */
  const toggleRoleSelection = (id) => {
    setSelectedRoles(prev => {
      if (prev.includes(id)) {
        return prev.filter(roleId => roleId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRoles([]);
    } else {
      const allIds = paginatedRoles.map(rol => rol.id_rol || rol.id);
      setSelectedRoles(allIds);
    }
    setSelectAll(!selectAll);
  };

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (form.nombre.length > 50) {
      newErrors.nombre = 'Máximo 50 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ================= CRUD OPERATIONS ================= */
  const createRol = async () => {
    if (!validateForm()) return;
    
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      activo: form.activo ? 1 : 0,
      permisos: form.permisos
    };

    try {
      const res = await fetch(API_ROLES, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const responseData = await res.json();
      
      if (res.ok) {
        closeModal();
        loadRoles();
        alert('✅ Rol creado exitosamente');
      } else {
        handleApiError(responseData);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  const updateRol = async () => {
    if (!validateForm() || !selected) return;
    
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      activo: form.activo ? 1 : 0,
      permisos: form.permisos
    };

    try {
      const res = await fetch(`${API_ROLES}/${selected.id_rol}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const responseData = await res.json();

      if (res.ok) {
        closeModal();
        loadRoles();
        alert('✅ Rol actualizado exitosamente');
      } else {
        handleApiError(responseData);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  const deleteRol = async (id) => {
    if (!id) return;
    
    try {
      const res = await fetch(`${API_ROLES}/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (res.ok) {
        closeDeleteModal();
        loadRoles();
        alert('✅ Rol eliminado exitosamente');
      } else {
        const error = await res.json();
        alert(`❌ ${error.message || 'Error al eliminar rol'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  const toggleRoleStatus = async (rol) => {
    if (!confirm(`¿${rol.activo ? 'Desactivar' : 'Activar'} el rol "${rol.nombre}"?`)) return;
    
    try {
      const res = await fetch(`${API_ROLES}/${rol.id_rol}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ activo: !rol.activo ? 1 : 0 })
      });

      if (res.ok) {
        loadRoles();
        alert(`✅ Rol ${rol.activo ? 'desactivado' : 'activado'} exitosamente`);
      } else {
        alert('❌ Error al cambiar estado del rol');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
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

  /* ================= MODAL FUNCTIONS ================= */
  const openCreateModal = () => {
    setMode('create');
    setForm({
      nombre: '',
      descripcion: '',
      activo: true,
      permisos: []
    });
    setErrors({});
    setSelected(null);
    setShowModal(true);
  };

  const openEditModal = (rol) => {
    setMode('edit');
    setSelected(rol);
    
    // Extraer permisos del rol
    const permisosIds = rol.permisos 
      ? rol.permisos.map(p => p.id_permiso || p.id || p.pivot?.permiso_id)
      : [];
    
    setForm({ 
      nombre: rol.nombre || '',
      descripcion: rol.descripcion || '',
      activo: rol.activo !== undefined ? Boolean(rol.activo) : true,
      permisos: permisosIds
    });
    
    setErrors({});
    setShowModal(true);
  };

  const openDetailModal = (rol) => {
    setSelected(rol);
    setShowDetailModal(true);
  };

  const openDeleteModal = (rol) => {
    setSelected(rol);
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

  /* ================= FORM HANDLERS ================= */
  const handleNombreChange = (e) => {
    const nombre = e.target.value;
    setForm({
      ...form,
      nombre,
      slug: nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    });
  };

  const togglePermiso = (permisoId) => {
    setForm(prev => {
      if (prev.permisos.includes(permisoId)) {
        return {
          ...prev,
          permisos: prev.permisos.filter(id => id !== permisoId)
        };
      } else {
        return {
          ...prev,
          permisos: [...prev.permisos, permisoId]
        };
      }
    });
  };

  const toggleAllPermisos = () => {
    if (form.permisos.length === permisos.length) {
      setForm({ ...form, permisos: [] });
    } else {
      const allIds = permisos.map(p => p.id_permiso || p.id);
      setForm({ ...form, permisos: allIds });
    }
  };

  /* ================= BULK ACTIONS ================= */
  const bulkToggleStatus = async (activate) => {
    if (selectedRoles.length === 0) {
      alert('❌ Selecciona al menos un rol');
      return;
    }

    if (!confirm(`${activate ? 'Activar' : 'Desactivar'} ${selectedRoles.length} rol(es)?`)) return;

    try {
      const promises = selectedRoles.map(id => 
        fetch(`${API_ROLES}/${id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ activo: activate ? 1 : 0 })
        })
      );

      await Promise.all(promises);
      loadRoles();
      alert(`✅ ${selectedRoles.length} rol(es) ${activate ? 'activados' : 'desactivados'} exitosamente`);
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error en la operación masiva');
    }
  };

  const bulkDelete = async () => {
    if (selectedRoles.length === 0) {
      alert('❌ Selecciona al menos un rol');
      return;
    }

    if (!confirm(`¿Eliminar ${selectedRoles.length} rol(es)? Esta acción no se puede deshacer.`)) return;

    try {
      const promises = selectedRoles.map(id => 
        fetch(`${API_ROLES}/${id}`, {
          method: 'DELETE',
          headers: authHeaders()
        })
      );

      await Promise.all(promises);
      loadRoles();
      alert(`✅ ${selectedRoles.length} rol(es) eliminados exitosamente`);
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error en la eliminación masiva');
    }
  };

  /* ================= STATS ================= */
  const stats = useMemo(() => {
    const total = roles.length;
    const active = roles.filter(r => r.activo).length;
    const inactive = total - active;
    const withPermissions = roles.filter(r => r.permisos && r.permisos.length > 0).length;
    
    return { total, active, inactive, withPermissions };
  }, [roles]);

  /* ================= RENDER ================= */
  return (
    
    <div className="rol-container">
      <Sidebar />
      
      <div className="rol-content">
        <Topbar  />
        
            {/* HEADER */}
            <div className="rol-header">
            <div>
                
                <h1 className="rol-title">
                <Shield size={28} className="inline mr-3 text-blue-600" />
                Gestión de Roles
                </h1>
                <p className="rol-subtitle">Administra los roles y permisos del sistema</p>
            </div>
            <button onClick={openCreateModal} className="rol-btn-primary">
                <Plus size={20} /> Nuevo Rol
            </button>
            </div>

        {/* STATS */}
        <div className="rol-stats-grid">
          <div className="rol-stat-card bg-blue-50 border-blue-200">
            <div className="rol-stat-icon bg-blue-100 text-blue-600">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="rol-stat-number">{stats.total}</h3>
              <p className="rol-stat-label">Total de Roles</p>
            </div>
          </div>
          
          <div className="rol-stat-card bg-green-50 border-green-200">
            <div className="rol-stat-icon bg-green-100 text-green-600">
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="rol-stat-number">{stats.active}</h3>
              <p className="rol-stat-label">Roles Activos</p>
            </div>
          </div>
          
          <div className="rol-stat-card bg-red-50 border-red-200">
            <div className="rol-stat-icon bg-red-100 text-red-600">
              <XCircle size={24} />
            </div>
            <div>
              <h3 className="rol-stat-number">{stats.inactive}</h3>
              <p className="rol-stat-label">Roles Inactivos</p>
            </div>
          </div>
          
          <div className="rol-stat-card bg-purple-50 border-purple-200">
            <div className="rol-stat-icon bg-purple-100 text-purple-600">
              <Key size={24} />
            </div>
            <div>
              <h3 className="rol-stat-number">{stats.withPermissions}</h3>
              <p className="rol-stat-label">Con Permisos</p>
            </div>
          </div>
        </div>

        {/* FILTERS AND ACTIONS */}
        <div className="rol-actions-container">
          <div className="rol-search-container">
            <div className="rol-search-input">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, slug o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            <div className="rol-filter-group">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rol-filter-select"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Solo activos</option>
                <option value="inactive">Solo inactivos</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rol-filter-select"
              >
                <option value="nombre">Ordenar por nombre</option>
                <option value="slug">Ordenar por slug</option>
                <option value="activo">Ordenar por estado</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="rol-sort-btn"
                title={`Orden ${sortOrder === 'asc' ? 'ascendente' : 'descendente'}`}
              >
                <ArrowUpDown size={18} />
                {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
              </button>
            </div>
          </div>
          
          {/* BULK ACTIONS */}
          {selectedRoles.length > 0 && (
            <div className="rol-bulk-actions">
              <span className="rol-bulk-selected">
                {selectedRoles.length} rol(es) seleccionado(s)
              </span>
              <button
                onClick={() => bulkToggleStatus(true)}
                className="rol-bulk-btn rol-bulk-btn-activate"
              >
                <CheckCircle size={16} /> Activar
              </button>
              <button
                onClick={() => bulkToggleStatus(false)}
                className="rol-bulk-btn rol-bulk-btn-deactivate"
              >
                <XCircle size={16} /> Desactivar
              </button>
              <button
                onClick={bulkDelete}
                className="rol-bulk-btn rol-bulk-btn-danger"
              >
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          )}
          
          <div className="rol-actions-buttons">
            <button
              onClick={loadRoles}
              className="rol-action-btn"
              title="Actualizar lista"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() => setSelectedRoles([])}
              className="rol-action-btn"
              title="Limpiar selección"
              disabled={selectedRoles.length === 0}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        {loading ? (
          <div className="rol-loading">
            <div className="rol-loading-spinner"></div>
            <p className="mt-4 text-gray-600">Cargando roles...</p>
          </div>
        ) : (
          <>
            {filteredRoles.length === 0 ? (
              <div className="rol-empty-state">
                <Shield size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No se encontraron resultados' : 'No hay roles registrados'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Intenta con otros términos de búsqueda o filtros'
                    : 'Comienza creando tu primer rol para el sistema'}
                </p>
                <button onClick={openCreateModal} className="rol-btn-primary">
                  <Plus size={18} /> Crear Primer Rol
                </button>
              </div>
            ) : (
              <>
                <div className="rol-table-container">
                  <table className="rol-table">
                    <thead>
                      <tr>
                        <th className="w-12">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={toggleSelectAll}
                            className="rol-checkbox"
                          />
                        </th>
                        <th onClick={() => handleSort('nombre')} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            Nombre
                            {sortBy === 'nombre' && (
                              <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th>Slug</th>
                        <th>Permisos</th>
                        <th onClick={() => handleSort('activo')} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            Estado
                            {sortBy === 'activo' && (
                              <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th>Creado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRoles.map(rol => {
                        const isSelected = selectedRoles.includes(rol.id_rol || rol.id);
                        const permisosCount = rol.permisos?.length || 0;
                        
                        return (
                          <tr key={rol.id_rol || rol.id} className={isSelected ? 'rol-row-selected' : ''}>
                            <td>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleRoleSelection(rol.id_rol || rol.id)}
                                className="rol-checkbox"
                              />
                            </td>
                            <td>
                              <div className="flex items-center gap-3">
                                <div className={`rol-avatar ${rol.activo ? 'rol-avatar-active' : 'rol-avatar-inactive'}`}>
                                  <Shield size={16} />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">{rol.nombre}</div>
                                  {rol.descripcion && (
                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                      {rol.descripcion}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <code className="rol-slug">{rol.slug}</code>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <Key size={14} className="text-gray-400" />
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${permisosCount > 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                                  {permisosCount} permiso{permisosCount !== 1 ? 's' : ''}
                                </span>
                                {permisosCount > 0 && rol.permisos && (
                                  <div className="rol-tooltip">
                                    <Info size={14} className="text-gray-400 cursor-help" />
                                    <div className="rol-tooltip-content">
                                      {rol.permisos.slice(0, 5).map(p => (
                                        <div key={p.id_permiso || p.id} className="rol-tooltip-item">
                                          {p.nombre}
                                        </div>
                                      ))}
                                      {permisosCount > 5 && (
                                        <div className="rol-tooltip-item text-gray-500">
                                          +{permisosCount - 5} más...
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleRoleStatus(rol)}
                                  className={`rol-status-btn ${rol.activo ? 'rol-status-active' : 'rol-status-inactive'}`}
                                  title={rol.activo ? 'Desactivar rol' : 'Activar rol'}
                                >
                                  {rol.activo ? (
                                    <>
                                      <CheckCircle size={14} />
                                      <span>Activo</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle size={14} />
                                      <span>Inactivo</span>
                                    </>
                                  )}
                                </button>
                                <span className={`rol-status-dot ${rol.activo ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              </div>
                            </td>
                            <td>
                              <div className="text-sm text-gray-500">
                                {rol.created_at ? new Date(rol.created_at).toLocaleDateString() : 'N/A'}
                              </div>
                            </td>
                            <td>
                              <div className="rol-actions">
                                <button
                                  onClick={() => openDetailModal(rol)}
                                  className="rol-btn-action rol-btn-view"
                                  title="Ver detalles"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => openEditModal(rol)}
                                  className="rol-btn-action rol-btn-edit"
                                  title="Editar rol"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(rol)}
                                  className="rol-btn-action rol-btn-delete"
                                  title="Eliminar rol"
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

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="rol-pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="rol-pagination-btn rol-pagination-prev"
                    >
                      <ChevronLeft size={18} />
                      Anterior
                    </button>
                    
                    <div className="rol-pagination-pages">
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
                            onClick={() => handlePageChange(pageNum)}
                            className={`rol-pagination-page ${currentPage === pageNum ? 'rol-pagination-active' : ''}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="rol-pagination-btn rol-pagination-next"
                    >
                      Siguiente
                      <ChevronRight size={18} />
                    </button>
                    
                    <div className="rol-pagination-info">
                      Página {currentPage} de {totalPages} • {filteredRoles.length} roles
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* MODAL CREAR/EDITAR ROL */}
        {showModal && (
          <div className="rol-modal-overlay">
            <div className="rol-modal rol-modal-lg">
              <div className="rol-modal-header">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${mode === 'create' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    <Shield size={24} />
                  </div>
                  <div>
                    <h2 className="rol-modal-title">
                      {mode === 'create' ? 'Crear Nuevo Rol' : 'Editar Rol'}
                    </h2>
                    <p className="rol-modal-subtitle">
                      {mode === 'create' ? 'Complete los detalles del nuevo rol' : 'Modifique los detalles del rol'}
                    </p>
                  </div>
                </div>
                <button onClick={closeModal} className="rol-modal-close">
                  <X size={20} />
                </button>
              </div>
              
              <div className="rol-modal-body">
                <div className="rol-form">
                  {/* Nombre y Slug */}
                  <div className="rol-form-row">
                    <div className="rol-form-group">
                      <label className="rol-form-label">
                        Nombre del Rol *
                      </label>
                      <input
                        type="text"
                        value={form.nombre}
                        onChange={handleNombreChange}
                        className={`rol-form-input ${errors.nombre ? 'border-red-500' : ''}`}
                        placeholder="Ej: Administrador, Usuario, Moderador"
                        maxLength={50}
                      />
                      {errors.nombre && (
                        <div className="rol-form-error">{errors.nombre}</div>
                      )}
                      <div className="rol-form-help">
                        Máximo 50 caracteres. El slug se generará automáticamente.
                      </div>
                    </div>
                    
                    <div className="rol-form-group">
                      <label className="rol-form-label">
                        Slug
                      </label>
                      <input
                        type="text"
                        value={form.slug}
                        readOnly
                        className="rol-form-input bg-gray-50"
                        placeholder="Se genera automáticamente"
                      />
                      <div className="rol-form-help">
                        Identificador único del rol (no editable)
                      </div>
                    </div>
                  </div>
                  
                  {/* Descripción */}
                  <div className="rol-form-group">
                    <label className="rol-form-label">
                      Descripción
                    </label>
                    <textarea
                      value={form.descripcion}
                      onChange={(e) => setForm({...form, descripcion: e.target.value})}
                      className="rol-form-textarea"
                      placeholder="Describa las funciones y responsabilidades de este rol..."
                      rows={3}
                    />
                    <div className="rol-form-help">
                      Esta descripción ayuda a identificar el propósito del rol.
                    </div>
                  </div>
                  
                  {/* Estado */}
                  <div className="rol-form-group">
                    <label className="rol-form-label">Estado del Rol</label>
                    <div className="rol-switch-container">
                      <button
                        type="button"
                        onClick={() => setForm({...form, activo: true})}
                        className={`rol-switch-option ${form.activo ? 'rol-switch-active' : ''}`}
                      >
                        <CheckCircle size={16} />
                        <span>Activo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({...form, activo: false})}
                        className={`rol-switch-option ${!form.activo ? 'rol-switch-inactive' : ''}`}
                      >
                        <XCircle size={16} />
                        <span>Inactivo</span>
                      </button>
                    </div>
                    <div className="rol-form-help">
                      Los roles inactivos no podrán ser asignados a nuevos usuarios.
                    </div>
                  </div>
                  
                  {/* Permisos */}
                  <div className="rol-form-group">
                    <div className="flex items-center justify-between mb-4">
                      <label className="rol-form-label flex items-center gap-2">
                        <Key size={18} />
                        Permisos del Rol
                      </label>
                      <button
                        type="button"
                        onClick={toggleAllPermisos}
                        className="rol-btn-small"
                      >
                        {form.permisos.length === permisos.length ? (
                          <>
                            <Square size={14} /> Desmarcar todos
                          </>
                        ) : (
                          <>
                            <CheckSquare size={14} /> Marcar todos
                          </>
                        )}
                      </button>
                    </div>
                    
                    {loadingPermisos ? (
                      <div className="text-center py-8">
                        <div className="rol-loading-spinner-small"></div>
                        <p className="text-gray-500 mt-2">Cargando permisos...</p>
                      </div>
                    ) : permisos.length === 0 ? (
                      <div className="rol-no-permissions">
                        <Key size={32} className="text-gray-300" />
                        <p className="text-gray-500">No hay permisos disponibles</p>
                      </div>
                    ) : (
                      <div className="rol-permissions-grid">
                        {permisos.map(permiso => {
                          const isSelected = form.permisos.includes(permiso.id_permiso || permiso.id);
                          const [module, action] = permiso.nombre.split('.');
                          
                          return (
                            <label
                              key={permiso.id_permiso || permiso.id}
                              className={`rol-permission-item ${isSelected ? 'rol-permission-selected' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => togglePermiso(permiso.id_permiso || permiso.id)}
                                className="hidden"
                              />
                              <div className="rol-permission-check">
                                {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                              </div>
                              <div className="rol-permission-content">
                                <div className="rol-permission-name">
                                  <span className="rol-permission-module">{module}</span>
                                  <span className="rol-permission-action">.{action}</span>
                                </div>
                                <div className="rol-permission-desc">
                                  {permiso.descripcion || 'Sin descripción'}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    
                    <div className="rol-permissions-summary">
                      <div className="rol-permissions-count">
                        <Key size={14} />
                        <span>{form.permisos.length} de {permisos.length} permisos seleccionados</span>
                      </div>
                      <div className="rol-permissions-categories">
                        {Object.entries(
                          permisos.reduce((acc, p) => {
                            const module = p.nombre.split('.')[0];
                            if (form.permisos.includes(p.id_permiso || p.id)) {
                              acc[module] = (acc[module] || 0) + 1;
                            }
                            return acc;
                          }, {})
                        ).map(([module, count]) => (
                          <span key={module} className="rol-permission-category">
                            {module}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="rol-modal-footer">
                <button onClick={closeModal} className="rol-btn-secondary">
                  Cancelar
                </button>
                <button 
                  onClick={mode === 'create' ? createRol : updateRol}
                  className="rol-btn-primary"
                  disabled={loadingPermisos}
                >
                  <Save size={18} />
                  {mode === 'create' ? 'Crear Rol' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DETALLE */}
        {showDetailModal && selected && (
          <div className="rol-modal-overlay">
            <div className="rol-modal rol-modal-lg">
              <div className="rol-modal-header">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${selected.activo ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <Shield size={28} />
                  </div>
                  <div>
                    <h2 className="rol-modal-title">{selected.nombre}</h2>
                    <p className="rol-modal-subtitle">Detalles completos del rol</p>
                  </div>
                </div>
                <button onClick={closeModal} className="rol-modal-close">
                  <X size={20} />
                </button>
              </div>
              
              <div className="rol-modal-body">
                <div className="rol-detail-grid">
                  <div className="rol-detail-card">
                    <h3 className="rol-detail-title">Información Básica</h3>
                    <div className="rol-detail-list">
                      <div className="rol-detail-item">
                        <span className="rol-detail-label">ID:</span>
                        <span className="rol-detail-value font-mono">#{selected.id_rol}</span>
                      </div>
                      <div className="rol-detail-item">
                        <span className="rol-detail-label">Nombre:</span>
                        <span className="rol-detail-value font-semibold">{selected.nombre}</span>
                      </div>
                      <div className="rol-detail-item">
                        <span className="rol-detail-label">Slug:</span>
                        <code className="rol-detail-code">{selected.slug}</code>
                      </div>
                      <div className="rol-detail-item">
                        <span className="rol-detail-label">Estado:</span>
                        <span className={`rol-detail-status ${selected.activo ? 'rol-detail-status-active' : 'rol-detail-status-inactive'}`}>
                          {selected.activo ? (
                            <>
                              <CheckCircle size={14} /> Activo
                            </>
                          ) : (
                            <>
                              <XCircle size={14} /> Inactivo
                            </>
                          )}
                        </span>
                      </div>
                      {selected.descripcion && (
                        <div className="rol-detail-item">
                          <span className="rol-detail-label">Descripción:</span>
                          <p className="rol-detail-description">{selected.descripcion}</p>
                        </div>
                      )}
                      <div className="rol-detail-item">
                        <span className="rol-detail-label">Creado:</span>
                        <span className="rol-detail-value">
                          {selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      {selected.updated_at && (
                        <div className="rol-detail-item">
                          <span className="rol-detail-label">Actualizado:</span>
                          <span className="rol-detail-value">
                            {new Date(selected.updated_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="rol-detail-card">
                    <h3 className="rol-detail-title">Permisos Asignados</h3>
                    {selected.permisos && selected.permisos.length > 0 ? (
                      <div className="rol-detail-permissions">
                        {selected.permisos.map(permiso => (
                          <div key={permiso.id_permiso || permiso.id} className="rol-detail-permission">
                            <div className="rol-detail-permission-header">
                              <Key size={14} className="text-gray-400" />
                              <span className="rol-detail-permission-name">{permiso.nombre}</span>
                            </div>
                            {permiso.descripcion && (
                              <div className="rol-detail-permission-desc">
                                {permiso.descripcion}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rol-no-permissions">
                        <Key size={32} className="text-gray-300" />
                        <p className="text-gray-500">No tiene permisos asignados</p>
                      </div>
                    )}
                  </div>
                  
                  {selected.usuarios && selected.usuarios.length > 0 && (
                    <div className="rol-detail-card rol-detail-card-full">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="rol-detail-title">Usuarios con este Rol</h3>
                        <span className="rol-badge">{selected.usuarios.length} usuario(s)</span>
                      </div>
                      <div className="rol-detail-users">
                        {selected.usuarios.slice(0, 10).map(usuario => (
                          <div key={usuario.id_usuario} className="rol-detail-user">
                            <div className="rol-detail-user-avatar">
                              {usuario.nombre?.[0] || 'U'}
                            </div>
                            <div className="rol-detail-user-info">
                              <div className="rol-detail-user-name">
                                {usuario.nombre} {usuario.apellido}
                              </div>
                              <div className="rol-detail-user-email">{usuario.email}</div>
                            </div>
                            <div className={`rol-detail-user-status ${usuario.status === 'activo' ? 'text-green-600' : 'text-red-600'}`}>
                              {usuario.status || 'N/A'}
                            </div>
                          </div>
                        ))}
                        {selected.usuarios.length > 10 && (
                          <div className="rol-detail-more">
                            <span className="text-gray-500">
                              ... y {selected.usuarios.length - 10} más
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="rol-modal-footer">
                <button onClick={closeModal} className="rol-btn-secondary">
                  Cerrar
                </button>
                <button 
                  onClick={() => {
                    closeModal();
                    openEditModal(selected);
                  }}
                  className="rol-btn-primary"
                >
                  <Edit2 size={18} /> Editar Rol
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL ELIMINAR */}
        {showDeleteModal && selected && (
          <div className="rol-modal-overlay">
            <div className="rol-modal rol-modal-sm">
              <div className="rol-modal-header">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                    <AlertTriangle size={28} />
                  </div>
                  <div>
                    <h2 className="rol-modal-title text-red-700">Eliminar Rol</h2>
                    <p className="rol-modal-subtitle">Esta acción no se puede deshacer</p>
                  </div>
                </div>
              </div>
              
              <div className="rol-modal-body">
                <div className="rol-delete-warning">
                  <p className="rol-delete-message">
                    ¿Estás seguro de eliminar el rol <strong>"{selected.nombre}"</strong>?
                  </p>
                  
                  {selected.usuarios && selected.usuarios.length > 0 && (
                    <div className="rol-delete-alert">
                      <AlertTriangle size={16} />
                      <span>
                        <strong>Advertencia:</strong> Este rol tiene {selected.usuarios.length} usuario(s) asignado(s).
                        Al eliminarlo, estos usuarios quedarán sin rol.
                      </span>
                    </div>
                  )}
                  
                  <div className="rol-delete-details">
                    <p>Esta acción eliminará permanentemente:</p>
                    <ul className="rol-delete-list">
                      <li>El rol "{selected.nombre}"</li>
                      <li>Todos los permisos asignados al rol</li>
                      <li>El historial de asignaciones</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="rol-modal-footer">
                <button onClick={closeDeleteModal} className="rol-btn-secondary">
                  Cancelar
                </button>
                <button 
                  onClick={() => deleteRol(selected.id_rol)}
                  className="rol-btn-danger"
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

export default Rol;