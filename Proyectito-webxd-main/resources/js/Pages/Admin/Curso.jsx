import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, Edit2, Trash2, X, Search, RefreshCw, Eye,
  ChevronLeft, ChevronRight, AlertTriangle, Save,
  Calendar, DollarSign, Users, BookOpen, Clock,
  CheckCircle, XCircle, Filter, ArrowUpDown, Image as ImageIcon,
  User, Mail, Phone, MapPin, FileText
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/curso.css';

const API_CURSOS = 'http://127.0.0.1:8000/api/cursos';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return {};
  }
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const Curso = () => {
  // Estados principales
  const [cursos, setCursos] = useState([]);
  const [filteredCursos, setFilteredCursos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mode, setMode] = useState('create');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  
  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Selección masiva
  const [selectedCursos, setSelectedCursos] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Preview de imagen
  const [imagePreview, setImagePreview] = useState(null);
  
  // Formulario
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    representante: '',
    email_representante: '',
    telefono_representante: '',
    tipo: 'vacacional',
    cupo_maximo: '',
    precio: '',
    estado: 'abierto',
    imagen: null
  });

  // Cargar cursos
  const loadCursos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_CURSOS, { headers: authHeaders() });
      if (!res.ok) throw new Error('Error al cargar cursos');
      
      const data = await res.json();
      
      let cursosData = [];
      if (data.data && Array.isArray(data.data)) {
        cursosData = data.data;
        setCurrentPage(data.current_page || 1);
        setTotalPages(data.last_page || 1);
      } else if (Array.isArray(data)) {
        cursosData = data;
      }
      
      setCursos(cursosData);
      applyFiltersAndSearch(cursosData);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCursos();
  }, [loadCursos]);

  // Aplicar filtros y búsqueda
  useEffect(() => {
    applyFiltersAndSearch(cursos);
  }, [searchTerm, tipoFilter, estadoFilter, sortBy, sortOrder]);

  const applyFiltersAndSearch = (data) => {
    let filtered = [...data];

    // Búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(curso =>
        curso.nombre?.toLowerCase().includes(term) ||
        curso.representante?.toLowerCase().includes(term) ||
        curso.descripcion?.toLowerCase().includes(term)
      );
    }

    // Filtro por tipo
    if (tipoFilter !== 'all') {
      filtered = filtered.filter(curso => curso.tipo === tipoFilter);
    }

    // Filtro por estado
    if (estadoFilter !== 'all') {
      filtered = filtered.filter(curso => curso.estado === estadoFilter);
    }

    // Ordenación
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
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

    setFilteredCursos(filtered);
    setCurrentPage(1);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setSelectedCursos([]);
    setSelectAll(false);
  };

  // Paginación
  const paginatedCursos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCursos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCursos, currentPage]);

  // Validación
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!form.descripcion.trim()) newErrors.descripcion = 'La descripción es requerida';
    if (!form.fecha_inicio) newErrors.fecha_inicio = 'La fecha de inicio es requerida';
    if (!form.fecha_fin) newErrors.fecha_fin = 'La fecha de fin es requerida';
    if (!form.representante.trim()) newErrors.representante = 'El representante es requerido';
    
    if (form.fecha_fin && form.fecha_inicio && form.fecha_fin <= form.fecha_inicio) {
      newErrors.fecha_fin = 'La fecha fin debe ser posterior a la fecha inicio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // CRUD Operations
  const createCurso = async () => {
    if (!validateForm()) return;
    
    const formData = new FormData();
    Object.keys(form).forEach(key => {
      if (form[key] !== null && form[key] !== '') {
        formData.append(key, form[key]);
      }
    });

    try {
      const headers = authHeaders();
      delete headers['Content-Type'];
      
      const res = await fetch(API_CURSOS, {
        method: 'POST',
        headers,
        body: formData
      });

      if (res.ok) {
        closeModal();
        loadCursos();
        alert('✅ Curso creado exitosamente');
      } else {
        const error = await res.json();
        handleApiError(error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  const updateCurso = async () => {
    if (!validateForm() || !selected) return;
    
    const formData = new FormData();
    Object.keys(form).forEach(key => {
      if (form[key] !== null && form[key] !== '') {
        formData.append(key, form[key]);
      }
    });
    formData.append('_method', 'PUT');

    try {
      const headers = authHeaders();
      delete headers['Content-Type'];
      
      const res = await fetch(`${API_CURSOS}/${selected.id_curso}`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (res.ok) {
        closeModal();
        loadCursos();
        alert('✅ Curso actualizado exitosamente');
      } else {
        const error = await res.json();
        handleApiError(error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  const deleteCurso = async (id) => {
    try {
      const res = await fetch(`${API_CURSOS}/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (res.ok) {
        closeDeleteModal();
        loadCursos();
        alert('✅ Curso eliminado exitosamente');
      } else {
        alert('❌ Error al eliminar curso');
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
    }
  };

  // Modal functions
  const openCreateModal = () => {
    setMode('create');
    setForm({
      nombre: '',
      descripcion: '',
      fecha_inicio: '',
      fecha_fin: '',
      representante: '',
      email_representante: '',
      telefono_representante: '',
      tipo: 'vacacional',
      cupo_maximo: '',
      precio: '',
      estado: 'abierto',
      imagen: null
    });
    setErrors({});
    setImagePreview(null);
    setSelected(null);
    setShowModal(true);
  };

  const openEditModal = (curso) => {
    setMode('edit');
    setSelected(curso);
    setForm({
      nombre: curso.nombre || '',
      descripcion: curso.descripcion || '',
      fecha_inicio: curso.fecha_inicio || '',
      fecha_fin: curso.fecha_fin || '',
      representante: curso.representante || '',
      email_representante: curso.email_representante || '',
      telefono_representante: curso.telefono_representante || '',
      tipo: curso.tipo || 'vacacional',
      cupo_maximo: curso.cupo_maximo || '',
      precio: curso.precio || '',
      estado: curso.estado || 'abierto',
      imagen: null
    });
    setImagePreview(curso.imagen ? `http://127.0.0.1:8000/storage/${curso.imagen}` : null);
    setErrors({});
    setShowModal(true);
  };

  const openDetailModal = (curso) => {
    setSelected(curso);
    setShowDetailModal(true);
  };

  const openDeleteModal = (curso) => {
    setSelected(curso);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowDetailModal(false);
    setErrors({});
    setImagePreview(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelected(null);
  };

  // Image handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, imagen: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Selection
  const toggleCursoSelection = (id) => {
    setSelectedCursos(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedCursos([]);
    } else {
      setSelectedCursos(paginatedCursos.map(c => c.id_curso));
    }
    setSelectAll(!selectAll);
  };

  // Bulk delete
  const bulkDelete = async () => {
    if (selectedCursos.length === 0) return;
    
    if (!confirm(`¿Eliminar ${selectedCursos.length} curso(s)?`)) return;

    try {
      await Promise.all(
        selectedCursos.map(id => 
          fetch(`${API_CURSOS}/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
          })
        )
      );
      
      loadCursos();
      alert(`✅ ${selectedCursos.length} curso(s) eliminados`);
    } catch (error) {
      alert('❌ Error en la eliminación masiva');
    }
  };

  // Estadísticas
  const stats = useMemo(() => {
    const total = cursos.length;
    const vacacional = cursos.filter(c => c.tipo === 'vacacional').length;
    const permanente = cursos.filter(c => c.tipo === 'permanente').length;
    const abiertos = cursos.filter(c => c.estado === 'abierto').length;
    
    return { total, vacacional, permanente, abiertos };
  }, [cursos]);

  // Helpers
  const getEstadoBadgeClass = (estado) => {
    const classes = {
      'abierto': 'bg-green-100 text-green-800 border-green-200',
      'cerrado': 'bg-red-100 text-red-800 border-red-200',
      'en_proceso': 'bg-blue-100 text-blue-800 border-blue-200',
      'cancelado': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return classes[estado] || classes.abierto;
  };

  const getEstadoIcon = (estado) => {
    const icons = {
      'abierto': <CheckCircle size={14} />,
      'cerrado': <XCircle size={14} />,
      'en_proceso': <Clock size={14} />,
      'cancelado': <AlertTriangle size={14} />
    };
    return icons[estado] || icons.abierto;
  };

  const getTipoLabel = (tipo) => {
    return tipo === 'vacacional' ? 'Vacacional' : 'Permanente';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="curso-container">
      <Sidebar />
      
      <div className="curso-content">
        <Topbar />
        
        {/* HEADER */}
        <div className="curso-header">
          <div>
            <h1 className="curso-title">
              <BookOpen size={28} />
              Gestión de Cursos
            </h1>
            <p className="curso-subtitle">Administra los cursos vacacionales y permanentes</p>
          </div>
          <button onClick={openCreateModal} className="curso-btn-primary">
            <Plus size={20} /> Nuevo Curso
          </button>
        </div>

        {/* STATS */}
        <div className="curso-stats-grid">
          <div className="curso-stat-card">
            <div className="curso-stat-icon bg-blue-100 text-blue-600">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="curso-stat-number">{stats.total}</h3>
              <p className="curso-stat-label">Total Cursos</p>
            </div>
          </div>
          
          <div className="curso-stat-card">
            <div className="curso-stat-icon bg-purple-100 text-purple-600">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="curso-stat-number">{stats.vacacional}</h3>
              <p className="curso-stat-label">Vacacionales</p>
            </div>
          </div>
          
          <div className="curso-stat-card">
            <div className="curso-stat-icon bg-orange-100 text-orange-600">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="curso-stat-number">{stats.permanente}</h3>
              <p className="curso-stat-label">Permanentes</p>
            </div>
          </div>
          
          <div className="curso-stat-card">
            <div className="curso-stat-icon bg-green-100 text-green-600">
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="curso-stat-number">{stats.abiertos}</h3>
              <p className="curso-stat-label">Abiertos</p>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="curso-actions-container">
          <div className="curso-search-container">
            <div className="curso-search-input">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')}>
                  <X size={18} />
                </button>
              )}
            </div>
            
            <div className="curso-filter-group">
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="curso-filter-select"
              >
                <option value="all">Todos los tipos</option>
                <option value="vacacional">Vacacional</option>
                <option value="permanente">Permanente</option>
              </select>
              
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="curso-filter-select"
              >
                <option value="all">Todos los estados</option>
                <option value="abierto">Abierto</option>
                <option value="cerrado">Cerrado</option>
                <option value="en_proceso">En Proceso</option>
                <option value="cancelado">Cancelado</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="curso-sort-btn"
              >
                <ArrowUpDown size={18} />
                {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
              </button>
            </div>
          </div>
          
          {selectedCursos.length > 0 && (
            <div className="curso-bulk-actions">
              <span className="curso-bulk-selected">
                {selectedCursos.length} curso(s) seleccionado(s)
              </span>
              <button onClick={bulkDelete} className="curso-bulk-btn-danger">
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          )}
          
          <div className="curso-actions-buttons">
            <button onClick={loadCursos} className="curso-action-btn">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="curso-loading">
            <div className="curso-loading-spinner"></div>
            <p>Cargando cursos...</p>
          </div>
        ) : filteredCursos.length === 0 ? (
          <div className="curso-empty-state">
            <BookOpen size={64} className="text-gray-300" />
            <h3>No se encontraron cursos</h3>
            <p>Comienza creando tu primer curso</p>
            <button onClick={openCreateModal} className="curso-btn-primary">
              <Plus size={18} /> Crear Curso
            </button>
          </div>
        ) : (
          <>
            <div className="curso-table-container">
              <table className="curso-table">
                <thead>
                  <tr>
                    <th style={{width: '50px'}}>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="curso-checkbox"
                      />
                    </th>
                    <th>Curso</th>
                    <th>Tipo</th>
                    <th>Fechas</th>
                    <th>Cupos</th>
                    <th>Precio</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCursos.map(curso => {
                    const isSelected = selectedCursos.includes(curso.id_curso);
                    const cupoDisponible = (curso.cupo_maximo || 0) - (curso.cupo_actual || 0);
                    
                    return (
                      <tr key={curso.id_curso} className={isSelected ? 'selected' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCursoSelection(curso.id_curso)}
                            className="curso-checkbox"
                          />
                        </td>
                        <td>
                          <div className="curso-info">
                            {curso.imagen && (
                              <img 
                                src={`http://127.0.0.1:8000/storage/${curso.imagen}`}
                                alt={curso.nombre}
                                className="curso-thumbnail"
                              />
                            )}
                            <div>
                              <div className="curso-nombre">{curso.nombre}</div>
                              <div className="curso-representante">
                                <User size={12} /> {curso.representante}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`curso-tipo-badge ${curso.tipo === 'vacacional' ? 'tipo-vacacional' : 'tipo-permanente'}`}>
                            {getTipoLabel(curso.tipo)}
                          </span>
                        </td>
                        <td>
                          <div className="curso-fechas">
                            <div><Calendar size={12} /> {formatDate(curso.fecha_inicio)}</div>
                            <div className="text-gray-400">hasta</div>
                            <div>{formatDate(curso.fecha_fin)}</div>
                          </div>
                        </td>
                        <td>
                          <div className="curso-cupos">
                            <Users size={14} />
                            <span>{curso.cupo_actual || 0}/{curso.cupo_maximo || 0}</span>
                            {cupoDisponible > 0 ? (
                              <span className="text-green-600 text-xs">({cupoDisponible} disponibles)</span>
                            ) : (
                              <span className="text-red-600 text-xs">(Completo)</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="curso-precio">
                            <DollarSign size={14} />
                            {formatCurrency(curso.precio)}
                          </div>
                        </td>
                        <td>
                          <span className={`curso-estado-badge ${getEstadoBadgeClass(curso.estado)}`}>
                            {getEstadoIcon(curso.estado)}
                            {curso.estado}
                          </span>
                        </td>
                        <td>
                          <div className="curso-actions">
                            <button
                              onClick={() => openDetailModal(curso)}
                              className="curso-btn-action curso-btn-view"
                              title="Ver detalles"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(curso)}
                              className="curso-btn-action curso-btn-edit"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(curso)}
                              className="curso-btn-action curso-btn-delete"
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

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="curso-pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="curso-pagination-btn"
                >
                  <ChevronLeft size={18} /> Anterior
                </button>
                
                <div className="curso-pagination-pages">
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
                        className={`curso-pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="curso-pagination-btn"
                >
                  Siguiente <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}

        {/* MODAL CREAR/EDITAR */}
        {showModal && (
          <div className="curso-modal-overlay">
            <div className="curso-modal curso-modal-lg">
              <div className="curso-modal-header">
                <div>
                  <h2 className="curso-modal-title">
                    {mode === 'create' ? 'Crear Nuevo Curso' : 'Editar Curso'}
                  </h2>
                  <p className="curso-modal-subtitle">
                    Complete la información del curso
                  </p>
                </div>
                <button onClick={closeModal} className="curso-modal-close">
                  <X size={20} />
                </button>
              </div>
              
              <div className="curso-modal-body">
                <div className="curso-form">
                  {/* Información básica */}
                  <div className="curso-form-section">
                    <h3 className="curso-form-section-title">
                      <FileText size={18} /> Información Básica
                    </h3>
                    
                    <div className="curso-form-group">
                      <label className="curso-form-label">Nombre del Curso *</label>
                      <input
                        type="text"
                        value={form.nombre}
                        onChange={(e) => setForm({...form, nombre: e.target.value})}
                        className={`curso-form-input ${errors.nombre ? 'border-red-500' : ''}`}
                        placeholder="Ej: Curso de Verano 2024"
                      />
                      {errors.nombre && <div className="curso-form-error">{errors.nombre}</div>}
                    </div>
                    
                    <div className="curso-form-group">
                      <label className="curso-form-label">Descripción *</label>
                      <textarea
                        value={form.descripcion}
                        onChange={(e) => setForm({...form, descripcion: e.target.value})}
                        className={`curso-form-textarea ${errors.descripcion ? 'border-red-500' : ''}`}
                        placeholder="Describe el curso..."
                        rows={3}
                      />
                      {errors.descripcion && <div className="curso-form-error">{errors.descripcion}</div>}
                    </div>
                    
                    <div className="curso-form-row">
                      <div className="curso-form-group">
                        <label className="curso-form-label">Tipo *</label>
                        <select
                          value={form.tipo}
                          onChange={(e) => setForm({...form, tipo: e.target.value})}
                          className="curso-form-select"
                        >
                          <option value="vacacional">Vacacional</option>
                          <option value="permanente">Permanente</option>
                        </select>
                      </div>
                      
                      <div className="curso-form-group">
                        <label className="curso-form-label">Estado</label>
                        <select
                          value={form.estado}
                          onChange={(e) => setForm({...form, estado: e.target.value})}
                          className="curso-form-select"
                        >
                          <option value="abierto">Abierto</option>
                          <option value="cerrado">Cerrado</option>
                          <option value="en_proceso">En Proceso</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Fechas */}
                  <div className="curso-form-section">
                    <h3 className="curso-form-section-title">
                      <Calendar size={18} /> Fechas
                    </h3>
                    
                    <div className="curso-form-row">
                      <div className="curso-form-group">
                        <label className="curso-form-label">Fecha Inicio *</label>
                        <input
                          type="date"
                          value={form.fecha_inicio}
                          onChange={(e) => setForm({...form, fecha_inicio: e.target.value})}
                          className={`curso-form-input ${errors.fecha_inicio ? 'border-red-500' : ''}`}
                        />
                        {errors.fecha_inicio && <div className="curso-form-error">{errors.fecha_inicio}</div>}
                      </div>
                      
                      <div className="curso-form-group">
                        <label className="curso-form-label">Fecha Fin *</label>
                        <input
                          type="date"
                          value={form.fecha_fin}
                          onChange={(e) => setForm({...form, fecha_fin: e.target.value})}
                          className={`curso-form-input ${errors.fecha_fin ? 'border-red-500' : ''}`}
                        />
                        {errors.fecha_fin && <div className="curso-form-error">{errors.fecha_fin}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Representante */}
                  <div className="curso-form-section">
                    <h3 className="curso-form-section-title">
                      <User size={18} /> Información del Representante
                    </h3>
                    
                    <div className="curso-form-group">
                      <label className="curso-form-label">Nombre Completo *</label>
                      <input
                        type="text"
                        value={form.representante}
                        onChange={(e) => setForm({...form, representante: e.target.value})}
                        className={`curso-form-input ${errors.representante ? 'border-red-500' : ''}`}
                        placeholder="Nombre del representante"
                      />
                      {errors.representante && <div className="curso-form-error">{errors.representante}</div>}
                    </div>
                    
                    <div className="curso-form-row">
                      <div className="curso-form-group">
                        <label className="curso-form-label">Email</label>
                        <input
                          type="email"
                          value={form.email_representante}
                          onChange={(e) => setForm({...form, email_representante: e.target.value})}
                          className="curso-form-input"
                          placeholder="correo@ejemplo.com"
                        />
                      </div>
                      
                      <div className="curso-form-group">
                        <label className="curso-form-label">Teléfono</label>
                        <input
                          type="tel"
                          value={form.telefono_representante}
                          onChange={(e) => setForm({...form, telefono_representante: e.target.value})}
                          className="curso-form-input"
                          placeholder="0999999999"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cupos y Precio */}
                  <div className="curso-form-section">
                    <h3 className="curso-form-section-title">
                      <DollarSign size={18} /> Cupos y Precio
                    </h3>
                    
                    <div className="curso-form-row">
                      <div className="curso-form-group">
                        <label className="curso-form-label">Cupo Máximo</label>
                        <input
                          type="number"
                          value={form.cupo_maximo}
                          onChange={(e) => setForm({...form, cupo_maximo: e.target.value})}
                          className="curso-form-input"
                          placeholder="Ej: 30"
                          min="1"
                        />
                      </div>
                      
                      <div className="curso-form-group">
                        <label className="curso-form-label">Precio (USD)</label>
                        <input
                          type="number"
                          value={form.precio}
                          onChange={(e) => setForm({...form, precio: e.target.value})}
                          className="curso-form-input"
                          placeholder="Ej: 150.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Imagen */}
                  <div className="curso-form-section">
                    <h3 className="curso-form-section-title">
                      <ImageIcon size={18} /> Imagen del Curso
                    </h3>
                    
                    <div className="curso-form-group">
                      <label className="curso-form-label">Subir Imagen</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="curso-form-input"
                      />
                      <div className="curso-form-help">
                        Formatos: JPG, PNG. Tamaño máximo: 2MB
                      </div>
                    </div>
                    
                    {imagePreview && (
                      <div className="curso-image-preview">
                        <img src={imagePreview} alt="Preview" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="curso-modal-footer">
                <button onClick={closeModal} className="curso-btn-secondary">
                  Cancelar
                </button>
                <button 
                  onClick={mode === 'create' ? createCurso : updateCurso}
                  className="curso-btn-primary"
                >
                  <Save size={18} />
                  {mode === 'create' ? 'Crear Curso' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DETALLE */}
        {showDetailModal && selected && (
          <div className="curso-modal-overlay">
            <div className="curso-modal curso-modal-lg">
              <div className="curso-modal-header">
                <div>
                  <h2 className="curso-modal-title">{selected.nombre}</h2>
                  <p className="curso-modal-subtitle">Información completa del curso</p>
                </div>
                <button onClick={closeModal} className="curso-modal-close">
                  <X size={20} />
                </button>
              </div>
              
              <div className="curso-modal-body">
                <div className="curso-detail-grid">
                  {/* Imagen */}
                  {selected.imagen && (
                    <div className="curso-detail-image">
                      <img 
                        src={`http://127.0.0.1:8000/storage/${selected.imagen}`}
                        alt={selected.nombre}
                      />
                    </div>
                  )}
                  
                  {/* Información General */}
                  <div className="curso-detail-card">
                    <h3 className="curso-detail-title">
                      <FileText size={18} /> Información General
                    </h3>
                    <div className="curso-detail-list">
                      <div className="curso-detail-item">
                        <span className="curso-detail-label">Tipo:</span>
                        <span className={`curso-tipo-badge ${selected.tipo === 'vacacional' ? 'tipo-vacacional' : 'tipo-permanente'}`}>
                          {getTipoLabel(selected.tipo)}
                        </span>
                      </div>
                      <div className="curso-detail-item">
                        <span className="curso-detail-label">Estado:</span>
                        <span className={`curso-estado-badge ${getEstadoBadgeClass(selected.estado)}`}>
                          {getEstadoIcon(selected.estado)}
                          {selected.estado}
                        </span>
                      </div>
                      <div className="curso-detail-item">
                        <span className="curso-detail-label">Descripción:</span>
                        <p className="curso-detail-description">{selected.descripcion}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fechas */}
                  <div className="curso-detail-card">
                    <h3 className="curso-detail-title">
                      <Calendar size={18} /> Fechas
                    </h3>
                    <div className="curso-detail-list">
                      <div className="curso-detail-item">
                        <span className="curso-detail-label">Inicio:</span>
                        <span className="curso-detail-value">{formatDate(selected.fecha_inicio)}</span>
                      </div>
                      <div className="curso-detail-item">
                        <span className="curso-detail-label">Fin:</span>
                        <span className="curso-detail-value">{formatDate(selected.fecha_fin)}</span>
                      </div>
                      <div className="curso-detail-item">
                        <span className="curso-detail-label">Duración:</span>
                        <span className="curso-detail-value">
                          {Math.ceil((new Date(selected.fecha_fin) - new Date(selected.fecha_inicio)) / (1000 * 60 * 60 * 24))} días
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Representante */}
                  <div className="curso-detail-card">
                    <h3 className="curso-detail-title">
                      <User size={18} /> Representante
                    </h3>
                    <div className="curso-detail-list">
                      <div className="curso-detail-item">
                        <span className="curso-detail-label">Nombre:</span>
                        <span className="curso-detail-value">{selected.representante}</span>
                      </div>
                      {selected.email_representante && (
                        <div className="curso-detail-item">
                          <span className="curso-detail-label">Email:</span>
                          <a href={`mailto:${selected.email_representante}`} className="curso-detail-link">
                            <Mail size={14} /> {selected.email_representante}
                          </a>
                        </div>
                      )}
                      {selected.telefono_representante && (
                        <div className="curso-detail-item">
                          <span className="curso-detail-label">Teléfono:</span>
                          <a href={`tel:${selected.telefono_representante}`} className="curso-detail-link">
                            <Phone size={14} /> {selected.telefono_representante}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Cupos y Precio */}
                  <div className="curso-detail-card">
                    <h3 className="curso-detail-title">
                      <Users size={18} /> Cupos y Precio
                    </h3>
                    <div className="curso-detail-list">
                      <div className="curso-detail-item">
                        <span className="curso-detail-label">Cupo Máximo:</span>
                        <span className="curso-detail-value">{selected.cupo_maximo || 'Sin límite'}</span>
                      </div>
                      <div className="curso-detail-item">
                        <span className="curso-detail-label">Cupo Actual:</span>
                        <span className="curso-detail-value">{selected.cupo_actual || 0}</span>
                      </div>
                      <div className="curso-detail-item">
                        <span className="curso-detail-label">Disponibles:</span>
                        <span className="curso-detail-value text-green-600">
                          {(selected.cupo_maximo || 0) - (selected.cupo_actual || 0)}
                        </span>
                      </div>
                      <div className="curso-detail-item">
                        <span className="curso-detail-label">Precio:</span>
                        <span className="curso-detail-value font-bold text-blue-600">
                          {formatCurrency(selected.precio)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="curso-modal-footer">
                <button onClick={closeModal} className="curso-btn-secondary">
                  Cerrar
                </button>
                <button 
                  onClick={() => {
                    closeModal();
                    openEditModal(selected);
                  }}
                  className="curso-btn-primary"
                >
                  <Edit2 size={18} /> Editar Curso
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL ELIMINAR */}
        {showDeleteModal && selected && (
          <div className="curso-modal-overlay">
            <div className="curso-modal">
              <div className="curso-modal-header">
                <div>
                  <h2 className="curso-modal-title text-red-700">Eliminar Curso</h2>
                  <p className="curso-modal-subtitle">Esta acción no se puede deshacer</p>
                </div>
              </div>
              
              <div className="curso-modal-body">
                <div className="curso-delete-warning">
                  <div className="curso-delete-icon">
                    <AlertTriangle size={48} />
                  </div>
                  <p className="curso-delete-message">
                    ¿Estás seguro de eliminar el curso <strong>"{selected.nombre}"</strong>?
                  </p>
                  
                  {selected.cupo_actual > 0 && (
                    <div className="curso-delete-alert">
                      <AlertTriangle size={16} />
                      <span>
                        <strong>Advertencia:</strong> Este curso tiene {selected.cupo_actual} inscripciones activas.
                      </span>
                    </div>
                  )}
                  
                  <div className="curso-delete-details">
                    <p>Esta acción eliminará permanentemente:</p>
                    <ul className="curso-delete-list">
                      <li>El curso y toda su información</li>
                      <li>Las inscripciones asociadas</li>
                      <li>Los registros de participantes</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="curso-modal-footer">
                <button onClick={closeDeleteModal} className="curso-btn-secondary">
                  Cancelar
                </button>
                <button 
                  onClick={() => deleteCurso(selected.id_curso)}
                  className="curso-btn-danger"
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

export default Curso;