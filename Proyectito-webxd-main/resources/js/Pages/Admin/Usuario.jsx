import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, X, User, Mail, Phone, MapPin, Lock, 
  CheckCircle, XCircle, Search, Filter, RefreshCw, Eye, 
  ChevronLeft, ChevronRight, AlertTriangle, Shield, 
  Calendar, MapPin as MapIcon, Smartphone, Download, Upload,
  MoreVertical, Key, Archive, Ban, CheckSquare, Square,
  ArrowUpDown
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/usuario.css';

const API_USUARIOS = 'http://127.0.0.1:8000/api/usuarios';
const API_ROLES = 'http://127.0.0.1:8000/api/roles';

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

const Usuario = () => {
  // Estados principales
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mode, setMode] = useState('create');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rolFilter, setRolFilter] = useState('all');
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Estados para selección masiva
  const [selectedUsuarios, setSelectedUsuarios] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Formulario
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    id_rol: '',
    password: '',
    password_confirmation: '',
    status: 'activo'
  });

  /* ================= FETCH DATA ================= */
  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_USUARIOS, { headers: authHeaders() });
      if (!res.ok) throw new Error('Error al cargar usuarios');
      
      const data = await res.json();
      console.log('Datos de usuarios recibidos:', data);
      
      let usuariosData = [];
      if (data.data && Array.isArray(data.data)) {
        // Laravel pagination
        usuariosData = data.data;
        setCurrentPage(data.current_page || 1);
        setTotalPages(data.last_page || 1);
      } else if (Array.isArray(data)) {
        // Simple array
        usuariosData = data;
        setCurrentPage(1);
        setTotalPages(Math.ceil(data.length / itemsPerPage));
      }
      
      setUsuarios(usuariosData);
      applyFiltersAndSearch(usuariosData);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await fetch(API_ROLES, { headers: authHeaders() });
      const data = await res.json();
      
      if (data.data && Array.isArray(data.data)) {
        setRoles(data.data);
      } else if (Array.isArray(data)) {
        setRoles(data);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error('Error cargando roles:', error);
    }
  };

  useEffect(() => {
    loadUsuarios();
    loadRoles();
  }, []);

  /* ================= FILTROS Y BÚSQUEDA ================= */
  useEffect(() => {
    applyFiltersAndSearch(usuarios);
  }, [searchTerm, statusFilter, rolFilter, sortBy, sortOrder]);

  const applyFiltersAndSearch = (data) => {
    let filtered = [...data];

    // Búsqueda por nombre, apellido, email o teléfono
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(usuario =>
        usuario.nombre?.toLowerCase().includes(term) ||
        usuario.apellido?.toLowerCase().includes(term) ||
        usuario.email?.toLowerCase().includes(term) ||
        usuario.telefono?.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(usuario => usuario.status === statusFilter);
    }

    // Filtro por rol
    if (rolFilter !== 'all') {
      const rolId = parseInt(rolFilter);
      filtered = filtered.filter(usuario => 
        usuario.id_rol === rolId || 
        (usuario.rol && usuario.rol.id_rol === rolId)
      );
    }

    // Ordenación
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      // Manejo especial para campos anidados
      if (sortBy === 'rol') {
        aValue = a.rol?.nombre || '';
        bValue = b.rol?.nombre || '';
      } else if (sortBy === 'nombre_completo') {
        aValue = `${a.nombre} ${a.apellido}`.toLowerCase();
        bValue = `${b.nombre} ${b.apellido}`.toLowerCase();
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

    setFilteredUsuarios(filtered);
    setCurrentPage(1);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setSelectedUsuarios([]);
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
  const paginatedUsuarios = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsuarios.slice(startIndex, endIndex);
  }, [filteredUsuarios, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  /* ================= SELECTION ================= */
  const toggleUsuarioSelection = (id) => {
    setSelectedUsuarios(prev => {
      if (prev.includes(id)) {
        return prev.filter(usuarioId => usuarioId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedUsuarios([]);
    } else {
      const allIds = paginatedUsuarios.map(u => u.id_usuario || u.id);
      setSelectedUsuarios(allIds);
    }
    setSelectAll(!selectAll);
  };

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!form.apellido.trim()) newErrors.apellido = 'El apellido es requerido';
    if (!form.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (mode === 'create') {
      if (!form.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (form.password.length < 8) {
        newErrors.password = 'Mínimo 8 caracteres';
      } else if (form.password !== form.password_confirmation) {
        newErrors.password_confirmation = 'Las contraseñas no coinciden';
      }
    } else if (form.password && form.password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres';
    } else if (form.password && form.password !== form.password_confirmation) {
      newErrors.password_confirmation = 'Las contraseñas no coinciden';
    }
    
    if (!form.id_rol) newErrors.id_rol = 'Selecciona un rol';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ================= CRUD OPERATIONS ================= */
  const createUsuario = async () => {
    if (!validateForm()) return;
    
    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim(),
      telefono: form.telefono ? form.telefono.trim() : '',
      direccion: form.direccion ? form.direccion.trim() : '',
      id_rol: parseInt(form.id_rol),
      password: form.password,
      password_confirmation: form.password_confirmation,
      status: form.status
    };

    try {
      const res = await fetch(API_USUARIOS, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const responseData = await res.json();
      
      if (res.ok) {
        closeModal();
        loadUsuarios();
        alert('✅ Usuario creado exitosamente');
      } else {
        handleApiError(responseData);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  const updateUsuario = async () => {
    if (!validateForm() || !selected) return;
    
    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim(),
      telefono: form.telefono ? form.telefono.trim() : '',
      direccion: form.direccion ? form.direccion.trim() : '',
      id_rol: parseInt(form.id_rol),
      status: form.status
    };

    if (form.password) {
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    }

    try {
      const res = await fetch(`${API_USUARIOS}/${selected.id_usuario}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const responseData = await res.json();

      if (res.ok) {
        closeModal();
        loadUsuarios();
        alert('✅ Usuario actualizado exitosamente');
      } else {
        handleApiError(responseData);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  const deleteUsuario = async (id) => {
    if (!id) return;
    
    try {
      const res = await fetch(`${API_USUARIOS}/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (res.ok) {
        closeDeleteModal();
        loadUsuarios();
        alert('✅ Usuario eliminado exitosamente');
      } else {
        const error = await res.json();
        alert(`❌ ${error.message || 'Error al eliminar usuario'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  const toggleUsuarioStatus = async (usuario, nuevoStatus) => {
    if (!confirm(`¿Cambiar estado del usuario "${usuario.nombre}" a ${nuevoStatus}?`)) return;
    
    try {
      const res = await fetch(`${API_USUARIOS}/${usuario.id_usuario}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: nuevoStatus })
      });

      if (res.ok) {
        loadUsuarios();
        alert(`✅ Usuario ${nuevoStatus} exitosamente`);
      } else {
        alert('❌ Error al cambiar estado del usuario');
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
      apellido: '',
      email: '',
      telefono: '',
      direccion: '',
      id_rol: '',
      password: '',
      password_confirmation: '',
      status: 'activo'
    });
    setErrors({});
    setSelected(null);
    setShowModal(true);
  };

  const openEditModal = (usuario) => {
    setMode('edit');
    setSelected(usuario);
    
    setForm({ 
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      email: usuario.email || '',
      telefono: usuario.telefono || '',
      direccion: usuario.direccion || '',
      id_rol: usuario.id_rol || usuario.rol?.id_rol || '',
      password: '',
      password_confirmation: '',
      status: usuario.status || 'activo'
    });
    
    setErrors({});
    setShowModal(true);
  };

  const openDetailModal = (usuario) => {
    setSelected(usuario);
    setShowDetailModal(true);
  };

  const openDeleteModal = (usuario) => {
    setSelected(usuario);
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

  /* ================= BULK ACTIONS ================= */
  const bulkToggleStatus = async (status) => {
    if (selectedUsuarios.length === 0) {
      alert('❌ Selecciona al menos un usuario');
      return;
    }

    if (!confirm(`${status === 'activo' ? 'Activar' : 'Desactivar'} ${selectedUsuarios.length} usuario(s)?`)) return;

    try {
      const promises = selectedUsuarios.map(id => 
        fetch(`${API_USUARIOS}/${id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ status })
        })
      );

      await Promise.all(promises);
      loadUsuarios();
      alert(`✅ ${selectedUsuarios.length} usuario(s) ${status === 'activo' ? 'activados' : 'desactivados'} exitosamente`);
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error en la operación masiva');
    }
  };

  const bulkDelete = async () => {
    if (selectedUsuarios.length === 0) {
      alert('❌ Selecciona al menos un usuario');
      return;
    }

    if (!confirm(`¿Eliminar ${selectedUsuarios.length} usuario(s)? Esta acción no se puede deshacer.`)) return;

    try {
      const promises = selectedUsuarios.map(id => 
        fetch(`${API_USUARIOS}/${id}`, {
          method: 'DELETE',
          headers: authHeaders()
        })
      );

      await Promise.all(promises);
      loadUsuarios();
      alert(`✅ ${selectedUsuarios.length} usuario(s) eliminados exitosamente`);
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error en la eliminación masiva');
    }
  };

  /* ================= STATS ================= */
  const stats = useMemo(() => {
    const total = usuarios.length;
    const active = usuarios.filter(u => u.status === 'activo').length;
    const inactive = usuarios.filter(u => u.status === 'inactivo').length;
    const suspended = usuarios.filter(u => u.status === 'suspendido').length;
    
    return { total, active, inactive, suspended };
  }, [usuarios]);

  /* ================= RENDER ================= */
  return (
    <div className="usuario-container">
      <Sidebar />
      
      <div className="usuario-content">
        {/* TOPBAR */}
        <Topbar />
        {/* HEADER */}
        <div className="usuario-main">
        <div className="usuario-header">
          <div>
            
            <h1 className="usuario-title">
              <User size={28} className="inline mr-3 text-blue-600" />
              Gestión de Usuarios
            </h1>
            <p className="usuario-subtitle">Administra los usuarios del sistema</p>
          </div>
          <button onClick={openCreateModal} className="usuario-btn-primary">
            <Plus size={20} /> Nuevo Usuario
          </button>
        </div>

        {/* STATS */}
        <div className="usuario-stats-grid">
          <div className="usuario-stat-card bg-blue-50 border-blue-200">
            <div className="usuario-stat-icon bg-blue-100 text-blue-600">
              <User size={24} />
            </div>
            <div>
              <h3 className="usuario-stat-number">{stats.total}</h3>
              <p className="usuario-stat-label">Total de Usuarios</p>
            </div>
          </div>
          
          <div className="usuario-stat-card bg-green-50 border-green-200">
            <div className="usuario-stat-icon bg-green-100 text-green-600">
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="usuario-stat-number">{stats.active}</h3>
              <p className="usuario-stat-label">Usuarios Activos</p>
            </div>
          </div>
          
          <div className="usuario-stat-card bg-red-50 border-red-200">
            <div className="usuario-stat-icon bg-red-100 text-red-600">
              <XCircle size={24} />
            </div>
            <div>
              <h3 className="usuario-stat-number">{stats.inactive}</h3>
              <p className="usuario-stat-label">Usuarios Inactivos</p>
            </div>
          </div>
          
          <div className="usuario-stat-card bg-yellow-50 border-yellow-200">
            <div className="usuario-stat-icon bg-yellow-100 text-yellow-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="usuario-stat-number">{stats.suspended}</h3>
              <p className="usuario-stat-label">Usuarios Suspendidos</p>
            </div>
          </div>
        </div>

        {/* FILTERS AND ACTIONS */}
        <div className="usuario-actions-container">
          <div className="usuario-search-container">
            <div className="usuario-search-input">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, apellido, email o teléfono..."
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
            
            <div className="usuario-filter-group">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="usuario-filter-select"
              >
                <option value="all">Todos los estados</option>
                <option value="activo">Solo activos</option>
                <option value="inactivo">Solo inactivos</option>
                <option value="suspendido">Solo suspendidos</option>
              </select>
              
              <select
                value={rolFilter}
                onChange={(e) => setRolFilter(e.target.value)}
                className="usuario-filter-select"
              >
                <option value="all">Todos los roles</option>
                {roles.map(rol => (
                  <option key={rol.id_rol || rol.id} value={rol.id_rol || rol.id}>
                    {rol.nombre || rol.nombre_rol || rol.name}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="usuario-sort-btn"
                title={`Orden ${sortOrder === 'asc' ? 'ascendente' : 'descendente'}`}
              >
                <ArrowUpDown size={18} />
                {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
              </button>
            </div>
          </div>
          
          {/* BULK ACTIONS */}
          {selectedUsuarios.length > 0 && (
            <div className="usuario-bulk-actions">
              <span className="usuario-bulk-selected">
                {selectedUsuarios.length} usuario(s) seleccionado(s)
              </span>
              <button
                onClick={() => bulkToggleStatus('activo')}
                className="usuario-bulk-btn usuario-bulk-btn-activate"
              >
                <CheckCircle size={16} /> Activar
              </button>
              <button
                onClick={() => bulkToggleStatus('inactivo')}
                className="usuario-bulk-btn usuario-bulk-btn-deactivate"
              >
                <XCircle size={16} /> Desactivar
              </button>
              <button
                onClick={() => bulkToggleStatus('suspendido')}
                className="usuario-bulk-btn usuario-bulk-btn-suspend"
              >
                <Ban size={16} /> Suspender
              </button>
              <button
                onClick={bulkDelete}
                className="usuario-bulk-btn usuario-bulk-btn-danger"
              >
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          )}
          
          <div className="usuario-actions-buttons">
            <button
              onClick={loadUsuarios}
              className="usuario-action-btn"
              title="Actualizar lista"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() => setSelectedUsuarios([])}
              className="usuario-action-btn"
              title="Limpiar selección"
              disabled={selectedUsuarios.length === 0}
            >
              <X size={18} />
            </button>
            <button
              onClick={() => {/* Export functionality */}}
              className="usuario-action-btn"
              title="Exportar usuarios"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        {loading ? (
          <div className="usuario-loading">
            <div className="usuario-loading-spinner"></div>
            <p className="mt-4 text-gray-600">Cargando usuarios...</p>
          </div>
        ) : (
          <>
            {filteredUsuarios.length === 0 ? (
              <div className="usuario-empty-state">
                <User size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {searchTerm || statusFilter !== 'all' || rolFilter !== 'all' ? 'No se encontraron resultados' : 'No hay usuarios registrados'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || statusFilter !== 'all' || rolFilter !== 'all' 
                    ? 'Intenta con otros términos de búsqueda o filtros'
                    : 'Comienza creando tu primer usuario para el sistema'}
                </p>
                <button onClick={openCreateModal} className="usuario-btn-primary">
                  <Plus size={18} /> Crear Primer Usuario
                </button>
              </div>
            ) : (
              <>
                <div className="usuario-table-container">
                  <table className="usuario-table">
                    <thead>
                      <tr>
                        <th className="w-12">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={toggleSelectAll}
                            className="usuario-checkbox"
                          />
                        </th>
                        <th onClick={() => handleSort('nombre_completo')} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            Usuario
                            {sortBy === 'nombre_completo' && (
                              <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th onClick={() => handleSort('email')} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            Email
                            {sortBy === 'email' && (
                              <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th>Teléfono</th>
                        <th onClick={() => handleSort('rol')} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            Rol
                            {sortBy === 'rol' && (
                              <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th onClick={() => handleSort('status')} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            Estado
                            {sortBy === 'status' && (
                              <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th>Última Actividad</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsuarios.map(usuario => {
                        const isSelected = selectedUsuarios.includes(usuario.id_usuario || usuario.id);
                        
                        return (
                          <tr key={usuario.id_usuario || usuario.id} className={isSelected ? 'usuario-row-selected' : ''}>
                            <td>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleUsuarioSelection(usuario.id_usuario || usuario.id)}
                                className="usuario-checkbox"
                              />
                            </td>
                            <td>
                              <div className="flex items-center gap-3">
                                <div className={`usuario-avatar ${usuario.status === 'activo' ? 'usuario-avatar-active' : usuario.status === 'suspendido' ? 'usuario-avatar-suspended' : 'usuario-avatar-inactive'}`}>
                                  {usuario.nombre?.[0] || 'U'}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {usuario.nombre} {usuario.apellido}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: #{usuario.id_usuario}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <Mail size={14} className="text-gray-400" />
                                <span className="font-medium">{usuario.email}</span>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <Phone size={14} className="text-gray-400" />
                                <span>{usuario.telefono || 'N/A'}</span>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <Shield size={14} className="text-gray-400" />
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                  {usuario.rol?.nombre || 'Sin rol'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const nuevoStatus = usuario.status === 'activo' ? 'inactivo' : 'activo';
                                    toggleUsuarioStatus(usuario, nuevoStatus);
                                  }}
                                  className={`usuario-status-btn ${
                                    usuario.status === 'activo' ? 'usuario-status-active' : 
                                    usuario.status === 'suspendido' ? 'usuario-status-suspended' : 
                                    'usuario-status-inactive'
                                  }`}
                                  title={`Cambiar estado a ${usuario.status === 'activo' ? 'inactivo' : 'activo'}`}
                                >
                                  {usuario.status === 'activo' ? (
                                    <>
                                      <CheckCircle size={14} />
                                      <span>Activo</span>
                                    </>
                                  ) : usuario.status === 'suspendido' ? (
                                    <>
                                      <AlertTriangle size={14} />
                                      <span>Suspendido</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle size={14} />
                                      <span>Inactivo</span>
                                    </>
                                  )}
                                </button>
                                <span className={`usuario-status-dot ${
                                  usuario.status === 'activo' ? 'bg-green-500' : 
                                  usuario.status === 'suspendido' ? 'bg-yellow-500' : 
                                  'bg-red-500'
                                }`}></span>
                              </div>
                            </td>
                            <td>
                              <div className="text-sm text-gray-500">
                                {usuario.updated_at ? new Date(usuario.updated_at).toLocaleDateString() : 'N/A'}
                              </div>
                            </td>
                            <td>
                              <div className="usuario-actions">
                                <button
                                  onClick={() => openDetailModal(usuario)}
                                  className="usuario-btn-action usuario-btn-view"
                                  title="Ver detalles"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => openEditModal(usuario)}
                                  className="usuario-btn-action usuario-btn-edit"
                                  title="Editar usuario"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(usuario)}
                                  className="usuario-btn-action usuario-btn-delete"
                                  title="Eliminar usuario"
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
                  <div className="usuario-pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="usuario-pagination-btn usuario-pagination-prev"
                    >
                      <ChevronLeft size={18} />
                      Anterior
                    </button>
                    
                    <div className="usuario-pagination-pages">
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
                            className={`usuario-pagination-page ${currentPage === pageNum ? 'usuario-pagination-active' : ''}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="usuario-pagination-btn usuario-pagination-next"
                    >
                      Siguiente
                      <ChevronRight size={18} />
                    </button>
                    
                    <div className="usuario-pagination-info">
                      Página {currentPage} de {totalPages} • {filteredUsuarios.length} usuarios
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* MODAL CREAR/EDITAR USUARIO */}
        {showModal && (
          <div className="usuario-modal-overlay">
            <div className="usuario-modal usuario-modal-lg">
              <div className="usuario-modal-header">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${mode === 'create' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    <User size={24} />
                  </div>
                  <div>
                    <h2 className="usuario-modal-title">
                      {mode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
                    </h2>
                    <p className="usuario-modal-subtitle">
                      {mode === 'create' ? 'Complete los detalles del nuevo usuario' : 'Modifique los detalles del usuario'}
                    </p>
                  </div>
                </div>
                <button onClick={closeModal} className="usuario-modal-close">
                  <X size={20} />
                </button>
              </div>
              
              <div className="usuario-modal-body">
                <div className="usuario-form">
                  {/* Nombre y Apellido */}
                  <div className="usuario-form-row">
                    <div className="usuario-form-group">
                      <label className="usuario-form-label">
                        <User size={16} className="inline mr-1" />
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={form.nombre}
                        onChange={e => setForm({...form, nombre: e.target.value})}
                        className={`usuario-form-input ${errors.nombre ? 'border-red-500' : ''}`}
                        placeholder="Ingresa el nombre"
                      />
                      {errors.nombre && (
                        <div className="usuario-form-error">{errors.nombre}</div>
                      )}
                    </div>
                    
                    <div className="usuario-form-group">
                      <label className="usuario-form-label">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        value={form.apellido}
                        onChange={e => setForm({...form, apellido: e.target.value})}
                        className={`usuario-form-input ${errors.apellido ? 'border-red-500' : ''}`}
                        placeholder="Ingresa el apellido"
                      />
                      {errors.apellido && (
                        <div className="usuario-form-error">{errors.apellido}</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Email */}
                  <div className="usuario-form-group">
                    <label className="usuario-form-label">
                      <Mail size={16} className="inline mr-1" />
                      Email *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({...form, email: e.target.value})}
                      className={`usuario-form-input ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="ejemplo@correo.com"
                    />
                    {errors.email && (
                      <div className="usuario-form-error">{errors.email}</div>
                    )}
                  </div>
                  
                  {/* Teléfono y Rol */}
                  <div className="usuario-form-row">
                    <div className="usuario-form-group">
                      <label className="usuario-form-label">
                        <Phone size={16} className="inline mr-1" />
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={form.telefono}
                        onChange={e => setForm({...form, telefono: e.target.value})}
                        className="usuario-form-input"
                        placeholder="(000) 000-0000"
                      />
                    </div>
                    
                    <div className="usuario-form-group">
                      <label className="usuario-form-label">
                        <Shield size={16} className="inline mr-1" />
                        Rol *
                      </label>
                      <select
                        value={form.id_rol}
                        onChange={e => setForm({...form, id_rol: e.target.value})}
                        className={`usuario-form-select ${errors.id_rol ? 'border-red-500' : ''}`}
                      >
                        <option value="">Selecciona un rol</option>
                        {roles.map(rol => (
                          <option key={rol.id_rol || rol.id} value={rol.id_rol || rol.id}>
                            {rol.nombre || rol.nombre_rol || rol.name}
                          </option>
                        ))}
                      </select>
                      {errors.id_rol && (
                        <div className="usuario-form-error">{errors.id_rol}</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Dirección */}
                  <div className="usuario-form-group">
                    <label className="usuario-form-label">
                      <MapPin size={16} className="inline mr-1" />
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={form.direccion}
                      onChange={e => setForm({...form, direccion: e.target.value})}
                      className="usuario-form-input"
                      placeholder="Ingresa la dirección completa"
                    />
                  </div>
                  
                  {/* Contraseñas */}
                  <div className="usuario-form-row">
                    <div className="usuario-form-group">
                      <label className="usuario-form-label">
                        <Lock size={16} className="inline mr-1" />
                        {mode === 'create' ? 'Contraseña *' : 'Nueva Contraseña'}
                      </label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={e => setForm({...form, password: e.target.value})}
                        className={`usuario-form-input ${errors.password ? 'border-red-500' : ''}`}
                        placeholder={mode === 'create' ? 'Mínimo 8 caracteres' : 'Dejar en blanco para mantener'}
                      />
                      {errors.password && (
                        <div className="usuario-form-error">{errors.password}</div>
                      )}
                      <div className="usuario-form-help">
                        {mode === 'create' ? 'La contraseña es obligatoria' : 'Opcional. Dejar en blanco para mantener la actual'}
                      </div>
                    </div>
                    
                    <div className="usuario-form-group">
                      <label className="usuario-form-label">
                        Confirmar Contraseña
                      </label>
                      <input
                        type="password"
                        value={form.password_confirmation}
                        onChange={e => setForm({...form, password_confirmation: e.target.value})}
                        className={`usuario-form-input ${errors.password_confirmation ? 'border-red-500' : ''}`}
                        placeholder="Repite la contraseña"
                      />
                      {errors.password_confirmation && (
                        <div className="usuario-form-error">{errors.password_confirmation}</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Estado */}
                  <div className="usuario-form-group">
                    <label className="usuario-form-label">Estado del Usuario</label>
                    <div className="usuario-switch-container">
                      <button
                        type="button"
                        onClick={() => setForm({...form, status: 'activo'})}
                        className={`usuario-switch-option ${form.status === 'activo' ? 'usuario-switch-active' : ''}`}
                      >
                        <CheckCircle size={16} />
                        <span>Activo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({...form, status: 'inactivo'})}
                        className={`usuario-switch-option ${form.status === 'inactivo' ? 'usuario-switch-inactive' : ''}`}
                      >
                        <XCircle size={16} />
                        <span>Inactivo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({...form, status: 'suspendido'})}
                        className={`usuario-switch-option ${form.status === 'suspendido' ? 'usuario-switch-suspended' : ''}`}
                      >
                        <AlertTriangle size={16} />
                        <span>Suspendido</span>
                      </button>
                    </div>
                    <div className="usuario-form-help">
                      Los usuarios suspendidos no podrán acceder al sistema.
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="usuario-modal-footer">
                <button onClick={closeModal} className="usuario-btn-secondary">
                  Cancelar
                </button>
                <button 
                  onClick={mode === 'create' ? createUsuario : updateUsuario}
                  className="usuario-btn-primary"
                >
                  {mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DETALLE */}
        {showDetailModal && selected && (
          <div className="usuario-modal-overlay">
            <div className="usuario-modal usuario-modal-lg">
              <div className="usuario-modal-header">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${selected.status === 'activo' ? 'bg-green-100 text-green-600' : selected.status === 'suspendido' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                    <User size={28} />
                  </div>
                  <div>
                    <h2 className="usuario-modal-title">{selected.nombre} {selected.apellido}</h2>
                    <p className="usuario-modal-subtitle">Detalles completos del usuario</p>
                  </div>
                </div>
                <button onClick={closeModal} className="usuario-modal-close">
                  <X size={20} />
                </button>
              </div>
              
              <div className="usuario-modal-body">
                <div className="usuario-detail-grid">
                  <div className="usuario-detail-card">
                    <h3 className="usuario-detail-title">Información Personal</h3>
                    <div className="usuario-detail-list">
                      <div className="usuario-detail-item">
                        <span className="usuario-detail-label">ID:</span>
                        <span className="usuario-detail-value font-mono">#{selected.id_usuario}</span>
                      </div>
                      <div className="usuario-detail-item">
                        <span className="usuario-detail-label">Nombre:</span>
                        <span className="usuario-detail-value font-semibold">{selected.nombre}</span>
                      </div>
                      <div className="usuario-detail-item">
                        <span className="usuario-detail-label">Apellido:</span>
                        <span className="usuario-detail-value">{selected.apellido}</span>
                      </div>
                      <div className="usuario-detail-item">
                        <span className="usuario-detail-label">Email:</span>
                        <span className="usuario-detail-value">{selected.email}</span>
                      </div>
                      <div className="usuario-detail-item">
                        <span className="usuario-detail-label">Teléfono:</span>
                        <span className="usuario-detail-value">{selected.telefono || 'N/A'}</span>
                      </div>
                      {selected.direccion && (
                        <div className="usuario-detail-item">
                          <span className="usuario-detail-label">Dirección:</span>
                          <p className="usuario-detail-description">{selected.direccion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="usuario-detail-card">
                    <h3 className="usuario-detail-title">Información de Cuenta</h3>
                    <div className="usuario-detail-list">
                      <div className="usuario-detail-item">
                        <span className="usuario-detail-label">Rol:</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                          {selected.rol?.nombre || 'Sin rol'}
                        </span>
                      </div>
                      <div className="usuario-detail-item">
                        <span className="usuario-detail-label">Estado:</span>
                        <span className={`usuario-detail-status ${
                          selected.status === 'activo' ? 'usuario-detail-status-active' : 
                          selected.status === 'suspendido' ? 'usuario-detail-status-suspended' : 
                          'usuario-detail-status-inactive'
                        }`}>
                          {selected.status === 'activo' ? (
                            <>
                              <CheckCircle size={14} /> Activo
                            </>
                          ) : selected.status === 'suspendido' ? (
                            <>
                              <AlertTriangle size={14} /> Suspendido
                            </>
                          ) : (
                            <>
                              <XCircle size={14} /> Inactivo
                            </>
                          )}
                        </span>
                      </div>
                      <div className="usuario-detail-item">
                        <span className="usuario-detail-label">Creado:</span>
                        <span className="usuario-detail-value">
                          {selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      {selected.updated_at && (
                        <div className="usuario-detail-item">
                          <span className="usuario-detail-label">Actualizado:</span>
                          <span className="usuario-detail-value">
                            {new Date(selected.updated_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selected.deportista && (
                    <div className="usuario-detail-card usuario-detail-card-full">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="usuario-detail-title">Información de Deportista</h3>
                        <span className="usuario-badge">Deportista</span>
                      </div>
                      <div className="usuario-detail-list">
                        <div className="usuario-detail-item">
                          <span className="usuario-detail-label">Disciplina:</span>
                          <span className="usuario-detail-value">{selected.deportista.disciplina || 'N/A'}</span>
                        </div>
                        <div className="usuario-detail-item">
                          <span className="usuario-detail-label">Categoría:</span>
                          <span className="usuario-detail-value">{selected.deportista.categoria || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="usuario-modal-footer">
                <button onClick={closeModal} className="usuario-btn-secondary">
                  Cerrar
                </button>
                <button 
                  onClick={() => {
                    closeModal();
                    openEditModal(selected);
                  }}
                  className="usuario-btn-primary"
                >
                  <Edit2 size={18} /> Editar Usuario
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL ELIMINAR */}
        {showDeleteModal && selected && (
          <div className="usuario-modal-overlay">
            <div className="usuario-modal usuario-modal-sm">
              <div className="usuario-modal-header">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                    <AlertTriangle size={28} />
                  </div>
                  <div>
                    <h2 className="usuario-modal-title text-red-700">Eliminar Usuario</h2>
                    <p className="usuario-modal-subtitle">Esta acción no se puede deshacer</p>
                  </div>
                </div>
              </div>
              
              <div className="usuario-modal-body">
                <div className="usuario-delete-warning">
                  <p className="usuario-delete-message">
                    ¿Estás seguro de eliminar al usuario <strong>"{selected.nombre} {selected.apellido}"</strong>?
                  </p>
                  
                  <div className="usuario-delete-alert">
                    <AlertTriangle size={16} />
                    <span>
                      <strong>Advertencia:</strong> Esta acción eliminará permanentemente todos los datos asociados a este usuario.
                    </span>
                  </div>
                  
                  <div className="usuario-delete-details">
                    <p>Esta acción eliminará permanentemente:</p>
                    <ul className="usuario-delete-list">
                      <li>La cuenta de usuario</li>
                      <li>Todo el historial de actividades</li>
                      <li>Los datos personales asociados</li>
                      {selected.deportista && <li>La información de deportista</li>}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="usuario-modal-footer">
                <button onClick={closeDeleteModal} className="usuario-btn-secondary">
                  Cancelar
                </button>
                <button 
                  onClick={() => deleteUsuario(selected.id_usuario)}
                  className="usuario-btn-danger"
                >
                  <Trash2 size={18} /> Eliminar Permanentemente
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

export default Usuario;