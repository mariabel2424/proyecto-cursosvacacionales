import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, Edit2, Trash2, X, Search, RefreshCw, Eye,
  ChevronLeft, ChevronRight, AlertTriangle, Save,
  Users, User, Phone, Mail, MapPin, Shield, Award,
  CheckCircle, XCircle, Link as LinkIcon, TrendingUp,
  Star, UserPlus, Unlink
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/tutor.css';

const API_TUTORES = 'http://127.0.0.1:8000/api/tutores';
const API_DEPORTISTAS = 'http://127.0.0.1:8000/api/deportistas';
const API_RELACIONES = 'http://127.0.0.1:8000/api/deportista-tutor';
const API_USUARIOS = 'http://127.0.0.1:8000/api/usuarios';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  console.log('🔑 Token obtenido:', token ? 'Sí' : 'No');
  if (!token) {
    console.warn('⚠️ No hay token, redirigiendo a login');
    window.location.href = '/login';
    return {};
  }
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const Tutor = () => {
  console.log('🚀 Componente TutorDeportista renderizado');
  
  // Estados principales
  const [activeTab, setActiveTab] = useState('tutores');
  const [tutores, setTutores] = useState([]);
  const [deportistas, setDeportistas] = useState([]);
  const [relaciones, setRelaciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  
  const [filteredTutores, setFilteredTutores] = useState([]);
  const [filteredRelaciones, setFilteredRelaciones] = useState([]);
  
  // Modales
  const [showModalTutor, setShowModalTutor] = useState(false);
  const [showModalRelacion, setShowModalRelacion] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  const [mode, setMode] = useState('create');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  
  // Filtros Tutores
  const [searchTermTutor, setSearchTermTutor] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [parentescoFilter, setParentescoFilter] = useState('all');
  
  // Filtros Relaciones
  const [searchTermRelacion, setSearchTermRelacion] = useState('');
  const [deportistaFilter, setDeportistaFilter] = useState('all');
  const [tutorFilter, setTutorFilter] = useState('all');
  const [principalFilter, setPrincipalFilter] = useState('all');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Data para modales
  const [deportistasDelTutor, setDeportistasDelTutor] = useState([]);
  const [tutoresDeDeportista, setTutoresDeDeportista] = useState([]);
  const [estadisticasTutor, setEstadisticasTutor] = useState(null);
  
  // Formulario Tutor
  const [formTutor, setFormTutor] = useState({
    id_usuario: '',
    nombres: '',
    apellidos: '',
    cedula: '',
    telefono: '',
    email: '',
    direccion: '',
    parentesco: 'padre',
    activo: true
  });
  
  // Formulario Relación
  const [formRelacion, setFormRelacion] = useState({
    id_deportista: '',
    id_tutor: '',
    principal: false
  });

  const parentescos = [
    { value: 'padre', label: 'Padre' },
    { value: 'madre', label: 'Madre' },
    { value: 'abuelo', label: 'Abuelo' },
    { value: 'abuela', label: 'Abuela' },
    { value: 'tio', label: 'Tío' },
    { value: 'tia', label: 'Tía' },
    { value: 'hermano', label: 'Hermano' },
    { value: 'hermana', label: 'Hermana' },
    { value: 'tutor_legal', label: 'Tutor Legal' },
    { value: 'otro', label: 'Otro' }
  ];

 // Cargar tutores - VERSIÓN MEJORADA
const loadTutores = useCallback(async () => {
  console.log('📥 Cargando tutores...');
  console.log('🔗 URL:', API_TUTORES);
  
  setLoading(true);
  try {
    const headers = authHeaders();
    console.log('📤 Headers para tutores:', headers);
    
    console.log('🔍 Realizando fetch...');
    const res = await fetch(API_TUTORES, { 
      headers
    });
    
    console.log('📊 Respuesta tutores - Status:', res.status, 'OK:', res.ok);
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Datos de tutores recibidos (crudo):', data);
      
      // Manejar diferentes estructuras de respuesta
      let tutoresData = [];
      
      if (data.data) {
        // Caso 1: data.data es un array (Laravel pagination)
        if (Array.isArray(data.data)) {
          console.log('📄 Caso 1: data.data es array directamente');
          tutoresData = data.data;
        }
        // Caso 2: data.data es un objeto con propiedad data
        else if (data.data.data && Array.isArray(data.data.data)) {
          console.log('📄 Caso 2: data.data.data es array');
          tutoresData = data.data.data;
        }
        // Caso 3: data.data es un objeto pero no tiene la estructura esperada
        else if (typeof data.data === 'object') {
          console.log('📄 Caso 3: data.data es objeto, buscando arrays dentro...');
          // Buscar cualquier propiedad que sea array
          for (const key in data.data) {
            if (Array.isArray(data.data[key])) {
              console.log(`✅ Encontrado array en propiedad "${key}"`);
              tutoresData = data.data[key];
              break;
            }
          }
        }
      } 
      // Caso 4: La respuesta es directamente un array
      else if (Array.isArray(data)) {
        console.log('📄 Caso 4: Respuesta es directamente array');
        tutoresData = data;
      }
      
      console.log('👥 Tutores extraídos:', tutoresData.length);
      if (tutoresData.length > 0) {
        console.log('📝 Primer tutor:', tutoresData[0]);
      }
      
      setTutores(tutoresData);
      applyFiltersTutores(tutoresData);
      
    } else {
      const errorText = await res.text();
      console.error('❌ Error en respuesta tutores:', res.status, errorText);
      alert(`Error ${res.status}: No se pudieron cargar los tutores`);
    }
  } catch (error) {
    console.error('❌ Error al cargar tutores:', error);
    console.error('🔍 Detalles del error:', error.message);
    alert('Error de conexión al cargar tutores: ' + error.message);
  } finally {
    setLoading(false);
    console.log('📥 Fin carga tutores');
  }
}, []);

// Cargar deportistas - VERSIÓN MEJORADA
const loadDeportistas = useCallback(async () => {
  console.log('📥 Cargando deportistas...');
  try {
    const headers = authHeaders();
    const res = await fetch(API_DEPORTISTAS, { headers });
    console.log('📊 Respuesta deportistas - Status:', res.status, 'OK:', res.ok);
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Datos de deportistas recibidos (crudo):', data);
      
      // Manejar diferentes estructuras de respuesta
      let deportistasData = [];
      
      if (data.data) {
        if (Array.isArray(data.data)) {
          deportistasData = data.data;
        } else if (data.data.data && Array.isArray(data.data.data)) {
          deportistasData = data.data.data;
        } else if (typeof data.data === 'object') {
          // Buscar arrays dentro del objeto
          for (const key in data.data) {
            if (Array.isArray(data.data[key])) {
              deportistasData = data.data[key];
              break;
            }
          }
        }
      } else if (Array.isArray(data)) {
        deportistasData = data;
      }
      
      console.log('👥 Deportistas extraídos:', deportistasData.length);
      setDeportistas(deportistasData);
    } else {
      const errorText = await res.text();
      console.error('❌ Error en respuesta deportistas:', res.status, errorText);
    }
  } catch (error) {
    console.error('❌ Error al cargar deportistas:', error);
  }
}, []);

// Cargar relaciones - VERSIÓN MEJORADA
const loadRelaciones = useCallback(async () => {
  console.log('📥 Cargando relaciones...');
  setLoading(true);
  try {
    const headers = authHeaders();
    const res = await fetch(API_RELACIONES, { headers });
    console.log('📊 Respuesta relaciones - Status:', res.status, 'OK:', res.ok);
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Datos de relaciones recibidos (crudo):', data);
      
      // Manejar diferentes estructuras de respuesta
      let relacionesData = [];
      
      if (data.data) {
        if (Array.isArray(data.data)) {
          relacionesData = data.data;
        } else if (data.data.data && Array.isArray(data.data.data)) {
          relacionesData = data.data.data;
        } else if (typeof data.data === 'object') {
          for (const key in data.data) {
            if (Array.isArray(data.data[key])) {
              relacionesData = data.data[key];
              break;
            }
          }
        }
      } else if (Array.isArray(data)) {
        relacionesData = data;
      }
      
      console.log('👥 Relaciones extraídas:', relacionesData.length);
      setRelaciones(relacionesData);
      applyFiltersRelaciones(relacionesData);
    } else {
      const errorText = await res.text();
      console.error('❌ Error en respuesta relaciones:', res.status, errorText);
    }
  } catch (error) {
    console.error('❌ Error al cargar relaciones:', error);
  } finally {
    setLoading(false);
    console.log('📥 Fin carga relaciones');
  }
}, []);

// Cargar usuarios - VERSIÓN MEJORADA
const loadUsuarios = useCallback(async () => {
  console.log('📥 Cargando usuarios...');
  try {
    const headers = authHeaders();
    const res = await fetch(API_USUARIOS, { headers });
    console.log('📊 Respuesta usuarios - Status:', res.status, 'OK:', res.ok);
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Datos de usuarios recibidos (crudo):', data);
      
      // Manejar diferentes estructuras de respuesta
      let usuariosData = [];
      
      if (data.data) {
        if (Array.isArray(data.data)) {
          usuariosData = data.data;
        } else if (data.data.data && Array.isArray(data.data.data)) {
          usuariosData = data.data.data;
        } else if (typeof data.data === 'object') {
          for (const key in data.data) {
            if (Array.isArray(data.data[key])) {
              usuariosData = data.data[key];
              break;
            }
          }
        }
      } else if (Array.isArray(data)) {
        usuariosData = data;
      }
      
      console.log('👥 Usuarios extraídos:', usuariosData.length);
      setUsuarios(usuariosData);
    } else {
      const errorText = await res.text();
      console.error('❌ Error en respuesta usuarios:', res.status, errorText);
    }
  } catch (error) {
    console.error('❌ Error al cargar usuarios:', error);
  }
}, []);
  useEffect(() => {
    console.log('🔁 useEffect principal ejecutado');
    console.log('🔑 Token en localStorage:', localStorage.getItem('token'));
    
    loadTutores();
    loadDeportistas();
    loadRelaciones();
    loadUsuarios();
  }, [loadTutores, loadDeportistas, loadRelaciones, loadUsuarios]);

  // Filtros Tutores
  useEffect(() => {
    console.log('🔍 Aplicando filtros de tutores');
    applyFiltersTutores(tutores);
  }, [searchTermTutor, estadoFilter, parentescoFilter, tutores]);

  const applyFiltersTutores = (data) => {
    console.log('🎯 Aplicando filtros tutores con data:', data.length, 'elementos');
    let filtered = [...data];

    if (searchTermTutor) {
      const term = searchTermTutor.toLowerCase();
      filtered = filtered.filter(t =>
        t.nombres?.toLowerCase().includes(term) ||
        t.apellidos?.toLowerCase().includes(term) ||
        t.cedula?.includes(term) ||
        t.email?.toLowerCase().includes(term)
      );
      console.log('🔎 Filtrado por término:', term, 'resultados:', filtered.length);
    }

    if (estadoFilter !== 'all') {
      const isActive = estadoFilter === 'activo';
      filtered = filtered.filter(t => t.activo === isActive);
      console.log('🎯 Filtrado por estado:', estadoFilter, 'resultados:', filtered.length);
    }

    if (parentescoFilter !== 'all') {
      filtered = filtered.filter(t => t.parentesco === parentescoFilter);
      console.log('🎯 Filtrado por parentesco:', parentescoFilter, 'resultados:', filtered.length);
    }

    setFilteredTutores(filtered);
    setCurrentPage(1);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    console.log('📊 Paginación: total páginas:', Math.ceil(filtered.length / itemsPerPage));
  };

  // Filtros Relaciones
  useEffect(() => {
    console.log('🔍 Aplicando filtros de relaciones');
    applyFiltersRelaciones(relaciones);
  }, [searchTermRelacion, deportistaFilter, tutorFilter, principalFilter, relaciones]);

  const applyFiltersRelaciones = (data) => {
    console.log('🎯 Aplicando filtros relaciones con data:', data.length, 'elementos');
    let filtered = [...data];

    if (searchTermRelacion) {
      const term = searchTermRelacion.toLowerCase();
      filtered = filtered.filter(r =>
        r.deportista?.nombres?.toLowerCase().includes(term) ||
        r.deportista?.apellidos?.toLowerCase().includes(term) ||
        r.tutor?.nombres?.toLowerCase().includes(term) ||
        r.tutor?.apellidos?.toLowerCase().includes(term)
      );
      console.log('🔎 Filtrado por término:', term, 'resultados:', filtered.length);
    }

    if (deportistaFilter !== 'all') {
      filtered = filtered.filter(r => r.id_deportista == deportistaFilter);
      console.log('🎯 Filtrado por deportista:', deportistaFilter, 'resultados:', filtered.length);
    }

    if (tutorFilter !== 'all') {
      filtered = filtered.filter(r => r.id_tutor == tutorFilter);
      console.log('🎯 Filtrado por tutor:', tutorFilter, 'resultados:', filtered.length);
    }

    if (principalFilter !== 'all') {
      const isPrincipal = principalFilter === 'principal';
      filtered = filtered.filter(r => r.principal === isPrincipal);
      console.log('🎯 Filtrado por principal:', principalFilter, 'resultados:', filtered.length);
    }

    setFilteredRelaciones(filtered);
    setCurrentPage(1);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  };

  // Paginación
  const paginatedData = useMemo(() => {
    const data = activeTab === 'tutores' ? filteredTutores : filteredRelaciones;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const result = data.slice(startIndex, startIndex + itemsPerPage);
    console.log('📄 Datos paginados:', {
      activeTab,
      currentPage,
      itemsPerPage,
      totalItems: data.length,
      showing: result.length
    });
    return result;
  }, [activeTab, filteredTutores, filteredRelaciones, currentPage]);

  // CRUD Tutores
  const validateTutorForm = () => {
    console.log('📋 Validando formulario tutor:', formTutor);
    const newErrors = {};
    if (!formTutor.id_usuario) newErrors.id_usuario = 'Seleccione un usuario';
    if (!formTutor.nombres.trim()) newErrors.nombres = 'Los nombres son requeridos';
    if (!formTutor.apellidos.trim()) newErrors.apellidos = 'Los apellidos son requeridos';
    if (!formTutor.cedula.trim()) newErrors.cedula = 'La cédula es requerida';
    if (!formTutor.telefono.trim()) newErrors.telefono = 'El teléfono es requerido';
    if (!formTutor.email.trim()) newErrors.email = 'El email es requerido';
    if (formTutor.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formTutor.email)) {
      newErrors.email = 'Email inválido';
    }
    console.log('📋 Errores de validación:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createTutor = async () => {
    console.log('➕ Creando tutor...', formTutor);
    if (!validateTutorForm()) return;
    
    try {
      const headers = { ...authHeaders(), 'Content-Type': 'application/json' };
      console.log('📤 Headers para crear tutor:', headers);
      
      const res = await fetch(API_TUTORES, {
        method: 'POST',
        headers,
        body: JSON.stringify(formTutor)
      });
      
      console.log('📊 Respuesta crear tutor - Status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Tutor creado exitosamente:', data);
        closeModal();
        loadTutores();
        alert('✅ Tutor registrado exitosamente');
      } else {
        const errorData = await res.json();
        console.error('❌ Error al crear tutor:', errorData);
        alert(`❌ Error: ${errorData.message || 'No se pudo crear el tutor'}`);
      }
    } catch (error) {
      console.error('❌ Error de conexión al crear tutor:', error);
      alert('❌ Error de conexión. Verifica tu conexión a internet.');
    }
  };

  const updateTutor = async () => {
    console.log('✏️ Actualizando tutor...', formTutor);
    if (!validateTutorForm() || !selected) return;
    
    try {
      const headers = { ...authHeaders(), 'Content-Type': 'application/json' };
      const res = await fetch(`${API_TUTORES}/${selected.id_tutor}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formTutor)
      });
      
      console.log('📊 Respuesta actualizar tutor - Status:', res.status);
      
      if (res.ok) {
        console.log('✅ Tutor actualizado');
        closeModal();
        loadTutores();
        alert('✅ Tutor actualizado');
      } else {
        const errorText = await res.text();
        console.error('❌ Error al actualizar tutor:', errorText);
        alert('❌ Error al actualizar tutor');
      }
    } catch (error) {
      console.error('❌ Error de conexión al actualizar tutor:', error);
      alert('❌ Error de conexión');
    }
  };

  const deleteTutor = async (id) => {
    console.log('🗑️ Eliminando tutor ID:', id);
    try {
      const headers = authHeaders();
      const res = await fetch(`${API_TUTORES}/${id}`, {
        method: 'DELETE',
        headers
      });
      
      console.log('📊 Respuesta eliminar tutor - Status:', res.status);
      
      if (res.ok) {
        console.log('✅ Tutor eliminado');
        closeDeleteModal();
        loadTutores();
        alert('✅ Tutor eliminado');
      } else {
        const errorData = await res.json();
        console.error('❌ Error al eliminar tutor:', errorData);
        alert(`❌ ${errorData.message || 'Error al eliminar tutor'}`);
      }
    } catch (error) {
      console.error('❌ Error de conexión al eliminar tutor:', error);
      alert('❌ Error de conexión');
    }
  };

  const toggleActivo = async (id) => {
    console.log('🔄 Cambiando estado activo para tutor ID:', id);
    try {
      const headers = authHeaders();
      const res = await fetch(`${API_TUTORES}/${id}/toggle-activo`, {
        method: 'POST',
        headers
      });
      
      console.log('📊 Respuesta toggle activo - Status:', res.status);
      
      if (res.ok) {
        console.log('✅ Estado actualizado');
        loadTutores();
        alert('✅ Estado actualizado');
      } else {
        console.error('❌ Error al actualizar estado');
      }
    } catch (error) {
      console.error('❌ Error de conexión al cambiar estado:', error);
      alert('❌ Error al actualizar');
    }
  };

  // CRUD Relaciones
  const validateRelacionForm = () => {
    console.log('📋 Validando formulario relación:', formRelacion);
    const newErrors = {};
    if (!formRelacion.id_deportista) newErrors.id_deportista = 'Seleccione un deportista';
    if (!formRelacion.id_tutor) newErrors.id_tutor = 'Seleccione un tutor';
    console.log('📋 Errores de validación relación:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createRelacion = async () => {
    console.log('➕ Creando relación...', formRelacion);
    if (!validateRelacionForm()) return;
    
    try {
      const headers = { ...authHeaders(), 'Content-Type': 'application/json' };
      const res = await fetch(API_RELACIONES, {
        method: 'POST',
        headers,
        body: JSON.stringify(formRelacion)
      });
      
      console.log('📊 Respuesta crear relación - Status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Relación creada exitosamente:', data);
        closeModal();
        loadRelaciones();
        alert('✅ Relación creada exitosamente');
      } else {
        const errorData = await res.json();
        console.error('❌ Error al crear relación:', errorData);
        alert(`❌ ${errorData.message || 'Error al crear relación'}`);
      }
    } catch (error) {
      console.error('❌ Error de conexión al crear relación:', error);
      alert('❌ Error de conexión');
    }
  };

  const deleteRelacion = async (id) => {
    console.log('🗑️ Eliminando relación ID:', id);
    try {
      const headers = authHeaders();
      const res = await fetch(`${API_RELACIONES}/${id}`, {
        method: 'DELETE',
        headers
      });
      
      console.log('📊 Respuesta eliminar relación - Status:', res.status);
      
      if (res.ok) {
        console.log('✅ Relación eliminada');
        closeDeleteModal();
        loadRelaciones();
        alert('✅ Relación eliminada');
      } else {
        const errorData = await res.json();
        console.error('❌ Error al eliminar relación:', errorData);
        alert(`❌ ${errorData.message || 'Error al eliminar relación'}`);
      }
    } catch (error) {
      console.error('❌ Error de conexión al eliminar relación:', error);
      alert('❌ Error de conexión');
    }
  };

  const cambiarPrincipal = async (idRelacion, value) => {
    console.log('⭐ Cambiando tutor principal:', { idRelacion, value });
    try {
      const headers = { ...authHeaders(), 'Content-Type': 'application/json' };
      const res = await fetch(`${API_RELACIONES}/${idRelacion}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ principal: value })
      });
      
      console.log('📊 Respuesta cambiar principal - Status:', res.status);
      
      if (res.ok) {
        console.log('✅ Tutor principal actualizado');
        loadRelaciones();
        alert('✅ Tutor principal actualizado');
      }
    } catch (error) {
      console.error('❌ Error al actualizar:', error);
      alert('❌ Error al actualizar');
    }
  };

  // Modales
  const openCreateTutorModal = () => {
    console.log('📝 Abriendo modal crear tutor');
    setMode('create');
    setFormTutor({
      id_usuario: '',
      nombres: '',
      apellidos: '',
      cedula: '',
      telefono: '',
      email: '',
      direccion: '',
      parentesco: 'padre',
      activo: true
    });
    setErrors({});
    setSelected(null);
    setShowModalTutor(true);
  };

  const openEditTutorModal = (tutor) => {
    console.log('📝 Abriendo modal editar tutor:', tutor);
    setMode('edit');
    setSelected(tutor);
    setFormTutor({
      id_usuario: tutor.id_usuario || '',
      nombres: tutor.nombres || '',
      apellidos: tutor.apellidos || '',
      cedula: tutor.cedula || '',
      telefono: tutor.telefono || '',
      email: tutor.email || '',
      direccion: tutor.direccion || '',
      parentesco: tutor.parentesco || 'padre',
      activo: tutor.activo !== undefined ? tutor.activo : true
    });
    setErrors({});
    setShowModalTutor(true);
  };

  const openCreateRelacionModal = () => {
    console.log('📝 Abriendo modal crear relación');
    setFormRelacion({
      id_deportista: '',
      id_tutor: '',
      principal: false
    });
    setErrors({});
    setShowModalRelacion(true);
  };

  const openDeleteModal = (item, type) => {
    console.log('🗑️ Abriendo modal eliminar:', { item, type });
    setSelected({ ...item, type });
    setShowDeleteModal(true);
  };

  const loadDeportistasDelTutor = async (id) => {
    console.log('👥 Cargando deportistas del tutor ID:', id);
    try {
      const headers = authHeaders();
      const res = await fetch(`${API_TUTORES}/${id}/deportistas`, { headers });
      console.log('📊 Respuesta deportistas del tutor - Status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Deportistas del tutor:', data);
        setDeportistasDelTutor(data);
        setShowDetailModal(true);
      } else {
        console.error('❌ Error al cargar deportistas del tutor');
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  };

  const loadTutoresDeDeportista = async (id) => {
    console.log('👥 Cargando tutores del deportista ID:', id);
    try {
      const headers = authHeaders();
      const res = await fetch(`${API_RELACIONES}/deportista/${id}/tutores`, { headers });
      console.log('📊 Respuesta tutores del deportista - Status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Tutores del deportista:', data);
        setTutoresDeDeportista(data);
        setShowDetailModal(true);
      } else {
        console.error('❌ Error al cargar tutores del deportista');
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  };

  const loadEstadisticas = async (id) => {
    console.log('📊 Cargando estadísticas del tutor ID:', id);
    try {
      const headers = authHeaders();
      const res = await fetch(`${API_TUTORES}/${id}/estadisticas`, { headers });
      console.log('📊 Respuesta estadísticas - Status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Estadísticas del tutor:', data);
        setEstadisticasTutor(data);
        setShowStatsModal(true);
      } else {
        console.error('❌ Error al cargar estadísticas');
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  };

  const closeModal = () => {
    console.log('❌ Cerrando modal');
    setShowModalTutor(false);
    setShowModalRelacion(false);
    setShowDetailModal(false);
    setShowStatsModal(false);
    setErrors({});
  };

  const closeDeleteModal = () => {
    console.log('❌ Cerrando modal eliminar');
    setShowDeleteModal(false);
    setSelected(null);
  };

  // Helpers
  const getParentescoLabel = (parentesco) => {
    const p = parentescos.find(p => p.value === parentesco);
    return p ? p.label : parentesco;
  };

  // Estadísticas
  const statsTutores = useMemo(() => {
    const total = tutores.length;
    const activos = tutores.filter(t => t.activo).length;
    const inactivos = total - activos;
    const padres = tutores.filter(t => t.parentesco === 'padre' || t.parentesco === 'madre').length;
    console.log('📊 Estadísticas tutores:', { total, activos, inactivos, padres });
    return { total, activos, inactivos, padres };
  }, [tutores]);

  const statsRelaciones = useMemo(() => {
    const total = relaciones.length;
    const principales = relaciones.filter(r => r.principal).length;
    const deportistasUnicos = new Set(relaciones.map(r => r.id_deportista)).size;
    const tutoresUnicos = new Set(relaciones.map(r => r.id_tutor)).size;
    console.log('📊 Estadísticas relaciones:', { total, principales, deportistasUnicos, tutoresUnicos });
    return { total, principales, deportistasUnicos, tutoresUnicos };
  }, [relaciones]);

  return (
    <div className="tutor-deportista-container">
      <Sidebar />
      
      <div className="tutor-deportista-content">
        <Topbar />
        
        <div className="tutor-deportista-main">
          {/* HEADER */}
          <div className="tutor-deportista-header">
            <div>
              <h1 className="tutor-deportista-title">
                <Shield size={28} />
                Gestión de Tutores y Relaciones
              </h1>
              <p className="tutor-deportista-subtitle">
                Administra tutores y sus relaciones con deportistas
              </p>
            </div>
            <button 
              onClick={activeTab === 'tutores' ? openCreateTutorModal : openCreateRelacionModal}
              className="tutor-deportista-btn-primary"
            >
              <Plus size={20} />
              {activeTab === 'tutores' ? 'Nuevo Tutor' : 'Nueva Relación'}
            </button>
          </div>

          {/* TABS */}
          <div className="tutor-deportista-tabs">
            <button
              onClick={() => {
                console.log('📌 Cambiando a pestaña tutores');
                setActiveTab('tutores');
                setCurrentPage(1);
              }}
              className={`tutor-deportista-tab ${activeTab === 'tutores' ? 'active' : ''}`}
            >
              <Shield size={20} />
              Tutores
              <span className="tutor-deportista-tab-badge">{statsTutores.total}</span>
            </button>
            <button
              onClick={() => {
                console.log('📌 Cambiando a pestaña relaciones');
                setActiveTab('relaciones');
                setCurrentPage(1);
              }}
              className={`tutor-deportista-tab ${activeTab === 'relaciones' ? 'active' : ''}`}
            >
              <LinkIcon size={20} />
              Relaciones
              <span className="tutor-deportista-tab-badge">{statsRelaciones.total}</span>
            </button>
          </div>

          {/* STATS */}
          {activeTab === 'tutores' ? (
            <div className="tutor-deportista-stats-grid">
              <div className="tutor-deportista-stat-card">
                <div className="tutor-deportista-stat-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="tutor-deportista-stat-number">{statsTutores.total}</h3>
                  <p className="tutor-deportista-stat-label">Total Tutores</p>
                </div>
              </div>
              <div className="tutor-deportista-stat-card">
                <div className="tutor-deportista-stat-icon" style={{background: '#dcfce7', color: '#16a34a'}}>
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h3 className="tutor-deportista-stat-number">{statsTutores.activos}</h3>
                  <p className="tutor-deportista-stat-label">Activos</p>
                </div>
              </div>
              <div className="tutor-deportista-stat-card">
                <div className="tutor-deportista-stat-icon" style={{background: '#fee2e2', color: '#dc2626'}}>
                  <XCircle size={24} />
                </div>
                <div>
                  <h3 className="tutor-deportista-stat-number">{statsTutores.inactivos}</h3>
                  <p className="tutor-deportista-stat-label">Inactivos</p>
                </div>
              </div>
              <div className="tutor-deportista-stat-card">
                <div className="tutor-deportista-stat-icon" style={{background: '#e9d5ff', color: '#9333ea'}}>
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="tutor-deportista-stat-number">{statsTutores.padres}</h3>
                  <p className="tutor-deportista-stat-label">Padres/Madres</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="tutor-deportista-stats-grid">
              <div className="tutor-deportista-stat-card">
                <div className="tutor-deportista-stat-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                  <LinkIcon size={24} />
                </div>
                <div>
                  <h3 className="tutor-deportista-stat-number">{statsRelaciones.total}</h3>
                  <p className="tutor-deportista-stat-label">Total Relaciones</p>
                </div>
              </div>
              <div className="tutor-deportista-stat-card">
                <div className="tutor-deportista-stat-icon" style={{background: '#fef3c7', color: '#f59e0b'}}>
                  <Star size={24} />
                </div>
                <div>
                  <h3 className="tutor-deportista-stat-number">{statsRelaciones.principales}</h3>
                  <p className="tutor-deportista-stat-label">Tutores Principales</p>
                </div>
              </div>
              <div className="tutor-deportista-stat-card">
                <div className="tutor-deportista-stat-icon" style={{background: '#dcfce7', color: '#16a34a'}}>
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="tutor-deportista-stat-number">{statsRelaciones.deportistasUnicos}</h3>
                  <p className="tutor-deportista-stat-label">Deportistas</p>
                </div>
              </div>
              <div className="tutor-deportista-stat-card">
                <div className="tutor-deportista-stat-icon" style={{background: '#e9d5ff', color: '#9333ea'}}>
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="tutor-deportista-stat-number">{statsRelaciones.tutoresUnicos}</h3>
                  <p className="tutor-deportista-stat-label">Tutores</p>
                </div>
              </div>
            </div>
          )}

          {/* FILTERS */}
          {activeTab === 'tutores' ? (
            <div className="tutor-deportista-filters">
              <div className="tutor-deportista-filters-row">
                <div className="tutor-deportista-search-container">
                  <Search className="tutor-deportista-search-icon" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar tutor por nombre, cédula o email..."
                    value={searchTermTutor}
                    onChange={(e) => {
                      console.log('🔍 Búsqueda tutor:', e.target.value);
                      setSearchTermTutor(e.target.value);
                    }}
                    className="tutor-deportista-search-input"
                  />
                </div>
                <select
                  value={estadoFilter}
                  onChange={(e) => {
                    console.log('🎯 Filtro estado:', e.target.value);
                    setEstadoFilter(e.target.value);
                  }}
                  className="tutor-deportista-filter-select"
                >
                  <option value="all">Todos los estados</option>
                  <option value="activo">Activos</option>
                  <option value="inactivo">Inactivos</option>
                </select>
                <select
                  value={parentescoFilter}
                  onChange={(e) => {
                    console.log('🎯 Filtro parentesco:', e.target.value);
                    setParentescoFilter(e.target.value);
                  }}
                  className="tutor-deportista-filter-select"
                >
                  <option value="all">Todos los parentescos</option>
                  {parentescos.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <button onClick={loadTutores} className="tutor-deportista-btn-refresh">
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="tutor-deportista-filters">
              <div className="tutor-deportista-filters-row">
                <div className="tutor-deportista-search-container">
                  <Search className="tutor-deportista-search-icon" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre de deportista o tutor..."
                    value={searchTermRelacion}
                    onChange={(e) => {
                      console.log('🔍 Búsqueda relación:', e.target.value);
                      setSearchTermRelacion(e.target.value);
                    }}
                    className="tutor-deportista-search-input"
                  />
                </div>
                <select
                  value={deportistaFilter}
                  onChange={(e) => {
                    console.log('🎯 Filtro deportista:', e.target.value);
                    setDeportistaFilter(e.target.value);
                  }}
                  className="tutor-deportista-filter-select"
                >
                  <option value="all">Todos los deportistas</option>
                  {deportistas.map(d => (
                    <option key={d.id_deportista} value={d.id_deportista}>
                      {d.nombres} {d.apellidos}
                    </option>
                  ))}
                </select>
                <select
                  value={tutorFilter}
                  onChange={(e) => {
                    console.log('🎯 Filtro tutor:', e.target.value);
                    setTutorFilter(e.target.value);
                  }}
                  className="tutor-deportista-filter-select"
                >
                  <option value="all">Todos los tutores</option>
                  {tutores.map(t => (
                    <option key={t.id_tutor} value={t.id_tutor}>
                      {t.nombres} {t.apellidos}
                    </option>
                  ))}
                </select>
                <select
                  value={principalFilter}
                  onChange={(e) => {
                    console.log('🎯 Filtro principal:', e.target.value);
                    setPrincipalFilter(e.target.value);
                  }}
                  className="tutor-deportista-filter-select"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="principal">Solo principales</option>
                  <option value="secundario">Solo secundarios</option>
                </select>
                <button onClick={loadRelaciones} className="tutor-deportista-btn-refresh">
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
          )}

          {/* CONTENT */}
          {loading ? (
            <div className="tutor-deportista-loading">
              <div className="tutor-deportista-loading-spinner"></div>
              <p className="tutor-deportista-loading-text">Cargando datos...</p>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="tutor-deportista-empty-state">
              {activeTab === 'tutores' ? <Shield size={64} /> : <LinkIcon size={64} />}
              <h3 className="tutor-deportista-empty-title">
                {activeTab === 'tutores' ? 'No hay tutores registrados' : 'No hay relaciones registradas'}
              </h3>
              <p className="tutor-deportista-empty-message">
                {activeTab === 'tutores' 
                  ? 'Crea tu primer tutor haciendo clic en "Nuevo Tutor"' 
                  : 'Crea tu primera relación haciendo clic en "Nueva Relación"'}
              </p>
            </div>
          ) : (
            <>
              {/* TABLE */}
              <div className="tutor-deportista-table-container">
                <table className="tutor-deportista-table">
                  <thead>
                    <tr>
                      {activeTab === 'tutores' ? (
                        <>
                          <th>ID</th>
                          <th>Información</th>
                          <th>Contacto</th>
                          <th>Parentesco</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </>
                      ) : (
                        <>
                          <th>ID</th>
                          <th>Deportista</th>
                          <th>Tutor</th>
                          <th>Principal</th>
                          <th>Fecha Registro</th>
                          <th>Acciones</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((item, index) => {
                      console.log('📋 Renderizando item:', index, item);
                      if (activeTab === 'tutores') {
                        return (
                          <tr key={item.id_tutor} className="tutor-deportista-table-row">
                            <td className="tutor-deportista-table-id">#{item.id_tutor}</td>
                            <td>
                              <div className="tutor-deportista-info-cell">
                                <div className="tutor-deportista-avatar">
                                  <User size={16} />
                                </div>
                                <div>
                                  <div className="tutor-deportista-name">
                                    {item.nombres} {item.apellidos}
                                  </div>
                                  <div className="tutor-deportista-subtext">
                                    Cédula: {item.cedula}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="tutor-deportista-contact-cell">
                                <div className="tutor-deportista-contact-item">
                                  <Phone size={14} />
                                  <span>{item.telefono}</span>
                                </div>
                                <div className="tutor-deportista-contact-item">
                                  <Mail size={14} />
                                  <span>{item.email}</span>
                                </div>
                                {item.direccion && (
                                  <div className="tutor-deportista-contact-item">
                                    <MapPin size={14} />
                                    <span className="tutor-deportista-truncate">{item.direccion}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="tutor-deportista-badge" style={{
                                background: item.parentesco === 'padre' || item.parentesco === 'madre' 
                                  ? '#dbeafe' 
                                  : '#f3e8ff',
                                color: item.parentesco === 'padre' || item.parentesco === 'madre'
                                  ? '#2563eb'
                                  : '#9333ea'
                              }}>
                                {getParentescoLabel(item.parentesco)}
                              </div>
                            </td>
                            <td>
                              <div className="tutor-deportista-status">
                                <div className={`tutor-deportista-status-dot ${item.activo ? 'active' : 'inactive'}`} />
                                <span>{item.activo ? 'Activo' : 'Inactivo'}</span>
                              </div>
                            </td>
                            <td>
                              <div className="tutor-deportista-actions">
                                <button 
                                  onClick={() => loadDeportistasDelTutor(item.id_tutor)}
                                  className="tutor-deportista-action-btn"
                                  title="Ver deportistas asociados"
                                >
                                  <Eye size={16} />
                                </button>
                                <button 
                                  onClick={() => loadEstadisticas(item.id_tutor)}
                                  className="tutor-deportista-action-btn"
                                  title="Ver estadísticas"
                                >
                                  <TrendingUp size={16} />
                                </button>
                                <button 
                                  onClick={() => openEditTutorModal(item)}
                                  className="tutor-deportista-action-btn"
                                  title="Editar"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => toggleActivo(item.id_tutor)}
                                  className={`tutor-deportista-action-btn ${item.activo ? 'deactivate' : 'activate'}`}
                                  title={item.activo ? 'Desactivar' : 'Activar'}
                                >
                                  {item.activo ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                </button>
                                <button 
                                  onClick={() => openDeleteModal(item, 'tutor')}
                                  className="tutor-deportista-action-btn delete"
                                  title="Eliminar"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      } else {
                        return (
                          <tr key={item.id_deportista_tutor} className="tutor-deportista-table-row">
                            <td className="tutor-deportista-table-id">#{item.id_deportista_tutor}</td>
                            <td>
                              <div className="tutor-deportista-info-cell">
                                <div className="tutor-deportista-avatar sport">
                                  <Award size={16} />
                                </div>
                                <div>
                                  <div className="tutor-deportista-name">
                                    {item.deportista?.nombres} {item.deportista?.apellidos}
                                  </div>
                                  <div className="tutor-deportista-subtext">
                                    Deportista #{item.id_deportista}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="tutor-deportista-info-cell">
                                <div className="tutor-deportista-avatar">
                                  <Shield size={16} />
                                </div>
                                <div>
                                  <div className="tutor-deportista-name">
                                    {item.tutor?.nombres} {item.tutor?.apellidos}
                                  </div>
                                  <div className="tutor-deportista-subtext">
                                    {getParentescoLabel(item.tutor?.parentesco)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="tutor-deportista-principal-toggle">
                                <button
                                  onClick={() => cambiarPrincipal(item.id_deportista_tutor, !item.principal)}
                                  className={`tutor-deportista-toggle-btn ${item.principal ? 'principal' : ''}`}
                                  title={item.principal ? 'Principal - Click para cambiar' : 'Secundario - Click para hacer principal'}
                                >
                                  <Star size={14} fill={item.principal ? "#fbbf24" : "none"} />
                                  <span>{item.principal ? 'Principal' : 'Secundario'}</span>
                                </button>
                              </div>
                            </td>
                            <td>
                              <div className="tutor-deportista-date">
                                {new Date(item.created_at || item.fecha_registro).toLocaleDateString()}
                              </div>
                            </td>
                            <td>
                              <div className="tutor-deportista-actions">
                                <button 
                                  onClick={() => loadTutoresDeDeportista(item.id_deportista)}
                                  className="tutor-deportista-action-btn"
                                  title="Ver todos los tutores"
                                >
                                  <Users size={16} />
                                </button>
                                <button 
                                  onClick={() => openDeleteModal(item, 'relacion')}
                                  className="tutor-deportista-action-btn delete"
                                  title="Eliminar relación"
                                >
                                  <Unlink size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              <div className="tutor-deportista-pagination">
                <div className="tutor-deportista-pagination-info">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, paginatedData.length)} de {paginatedData.length} {activeTab === 'tutores' ? 'tutores' : 'relaciones'}
                </div>
                <div className="tutor-deportista-pagination-controls">
                  <button
                    onClick={() => {
                      console.log('⬅️ Página anterior');
                      setCurrentPage(prev => Math.max(prev - 1, 1));
                    }}
                    disabled={currentPage === 1}
                    className="tutor-deportista-pagination-btn"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      if (totalPages <= 5) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      const showEllipsis = index < array.length - 1 && array[index + 1] - page > 1;
                      return (
                        <React.Fragment key={page}>
                          <button
                            onClick={() => {
                              console.log('📄 Cambiando a página:', page);
                              setCurrentPage(page);
                            }}
                            className={`tutor-deportista-pagination-btn ${currentPage === page ? 'active' : ''}`}
                          >
                            {page}
                          </button>
                          {showEllipsis && <span className="tutor-deportista-pagination-ellipsis">...</span>}
                        </React.Fragment>
                      );
                    })}
                  <button
                    onClick={() => {
                      console.log('➡️ Página siguiente');
                      setCurrentPage(prev => Math.min(prev + 1, totalPages));
                    }}
                    disabled={currentPage === totalPages}
                    className="tutor-deportista-pagination-btn"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* MODAL TUTOR */}
          {showModalTutor && (
            <div className="tutor-deportista-modal-overlay">
              <div className="tutor-deportista-modal">
                <div className="tutor-deportista-modal-header">
                  <h3 className="tutor-deportista-modal-title">
                    {mode === 'create' ? 'Nuevo Tutor' : 'Editar Tutor'}
                  </h3>
                  <button onClick={closeModal} className="tutor-deportista-modal-close">
                    <X size={20} />
                  </button>
                </div>
                <div className="tutor-deportista-modal-body">
                  <div className="tutor-deportista-form">
                    <div className="tutor-deportista-form-group">
                      <label className="tutor-deportista-form-label">
                        <User size={16} />
                        Usuario Asociado *
                      </label>
                      <select
                        value={formTutor.id_usuario}
                        onChange={(e) => {
                          console.log('👤 Cambiando usuario:', e.target.value);
                          setFormTutor({...formTutor, id_usuario: e.target.value});
                        }}
                        className={`tutor-deportista-form-select ${errors.id_usuario ? 'error' : ''}`}
                      >
                        <option value="">Seleccionar usuario</option>
                        {usuarios.filter(u => !u.es_deportista && !u.es_tutor).map(u => (
                          <option key={u.id_usuario} value={u.id_usuario}>
                            {u.nombre_usuario} ({u.email})
                          </option>
                        ))}
                      </select>
                      {errors.id_usuario && (
                        <span className="tutor-deportista-form-error">{errors.id_usuario}</span>
                      )}
                    </div>

                    <div className="tutor-deportista-form-row">
                      <div className="tutor-deportista-form-group">
                        <label className="tutor-deportista-form-label">
                          <User size={16} />
                          Nombres *
                        </label>
                        <input
                          type="text"
                          value={formTutor.nombres}
                          onChange={(e) => setFormTutor({...formTutor, nombres: e.target.value})}
                          className={`tutor-deportista-form-input ${errors.nombres ? 'error' : ''}`}
                          placeholder="Ingrese los nombres"
                        />
                        {errors.nombres && (
                          <span className="tutor-deportista-form-error">{errors.nombres}</span>
                        )}
                      </div>
                      <div className="tutor-deportista-form-group">
                        <label className="tutor-deportista-form-label">
                          <User size={16} />
                          Apellidos *
                        </label>
                        <input
                          type="text"
                          value={formTutor.apellidos}
                          onChange={(e) => setFormTutor({...formTutor, apellidos: e.target.value})}
                          className={`tutor-deportista-form-input ${errors.apellidos ? 'error' : ''}`}
                          placeholder="Ingrese los apellidos"
                        />
                        {errors.apellidos && (
                          <span className="tutor-deportista-form-error">{errors.apellidos}</span>
                        )}
                      </div>
                    </div>

                    <div className="tutor-deportista-form-row">
                      <div className="tutor-deportista-form-group">
                        <label className="tutor-deportista-form-label">
                          <User size={16} />
                          Cédula *
                        </label>
                        <input
                          type="text"
                          value={formTutor.cedula}
                          onChange={(e) => setFormTutor({...formTutor, cedula: e.target.value})}
                          className={`tutor-deportista-form-input ${errors.cedula ? 'error' : ''}`}
                          placeholder="Ingrese la cédula"
                        />
                        {errors.cedula && (
                          <span className="tutor-deportista-form-error">{errors.cedula}</span>
                        )}
                      </div>
                      <div className="tutor-deportista-form-group">
                        <label className="tutor-deportista-form-label">
                          <Phone size={16} />
                          Teléfono *
                        </label>
                        <input
                          type="tel"
                          value={formTutor.telefono}
                          onChange={(e) => setFormTutor({...formTutor, telefono: e.target.value})}
                          className={`tutor-deportista-form-input ${errors.telefono ? 'error' : ''}`}
                          placeholder="Ingrese el teléfono"
                        />
                        {errors.telefono && (
                          <span className="tutor-deportista-form-error">{errors.telefono}</span>
                        )}
                      </div>
                    </div>

                    <div className="tutor-deportista-form-group">
                      <label className="tutor-deportista-form-label">
                        <Mail size={16} />
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formTutor.email}
                        onChange={(e) => setFormTutor({...formTutor, email: e.target.value})}
                        className={`tutor-deportista-form-input ${errors.email ? 'error' : ''}`}
                        placeholder="Ingrese el email"
                      />
                      {errors.email && (
                        <span className="tutor-deportista-form-error">{errors.email}</span>
                      )}
                    </div>

                    <div className="tutor-deportista-form-group">
                      <label className="tutor-deportista-form-label">
                        <MapPin size={16} />
                        Dirección
                      </label>
                      <textarea
                        value={formTutor.direccion}
                        onChange={(e) => setFormTutor({...formTutor, direccion: e.target.value})}
                        className="tutor-deportista-form-textarea"
                        placeholder="Ingrese la dirección"
                        rows="3"
                      />
                    </div>

                    <div className="tutor-deportista-form-row">
                      <div className="tutor-deportista-form-group">
                        <label className="tutor-deportista-form-label">
                          <Users size={16} />
                          Parentesco
                        </label>
                        <select
                          value={formTutor.parentesco}
                          onChange={(e) => setFormTutor({...formTutor, parentesco: e.target.value})}
                          className="tutor-deportista-form-select"
                        >
                          {parentescos.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="tutor-deportista-form-group">
                        <label className="tutor-deportista-form-label">
                          Estado
                        </label>
                        <div className="tutor-deportista-switch">
                          <input
                            type="checkbox"
                            id="activo"
                            checked={formTutor.activo}
                            onChange={(e) => setFormTutor({...formTutor, activo: e.target.checked})}
                            className="tutor-deportista-switch-input"
                          />
                          <label htmlFor="activo" className="tutor-deportista-switch-label">
                            <span className="tutor-deportista-switch-slider"></span>
                            <span className="tutor-deportista-switch-text">
                              {formTutor.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="tutor-deportista-modal-footer">
                  <button onClick={closeModal} className="tutor-deportista-btn-secondary">
                    Cancelar
                  </button>
                  <button 
                    onClick={mode === 'create' ? createTutor : updateTutor}
                    className="tutor-deportista-btn-primary"
                  >
                    <Save size={18} />
                    {mode === 'create' ? 'Crear Tutor' : 'Actualizar Tutor'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL RELACION */}
          {showModalRelacion && (
            <div className="tutor-deportista-modal-overlay">
              <div className="tutor-deportista-modal">
                <div className="tutor-deportista-modal-header">
                  <h3 className="tutor-deportista-modal-title">
                    Nueva Relación Tutor-Deportista
                  </h3>
                  <button onClick={closeModal} className="tutor-deportista-modal-close">
                    <X size={20} />
                  </button>
                </div>
                <div className="tutor-deportista-modal-body">
                  <div className="tutor-deportista-form">
                    <div className="tutor-deportista-form-group">
                      <label className="tutor-deportista-form-label">
                        <Award size={16} />
                        Deportista *
                      </label>
                      <select
                        value={formRelacion.id_deportista}
                        onChange={(e) => setFormRelacion({...formRelacion, id_deportista: e.target.value})}
                        className={`tutor-deportista-form-select ${errors.id_deportista ? 'error' : ''}`}
                      >
                        <option value="">Seleccionar deportista</option>
                        {deportistas.filter(d => d.activo).map(d => (
                          <option key={d.id_deportista} value={d.id_deportista}>
                            {d.nombres} {d.apellidos} - {d.cedula}
                          </option>
                        ))}
                      </select>
                      {errors.id_deportista && (
                        <span className="tutor-deportista-form-error">{errors.id_deportista}</span>
                      )}
                    </div>

                    <div className="tutor-deportista-form-group">
                      <label className="tutor-deportista-form-label">
                        <Shield size={16} />
                        Tutor *
                      </label>
                      <select
                        value={formRelacion.id_tutor}
                        onChange={(e) => setFormRelacion({...formRelacion, id_tutor: e.target.value})}
                        className={`tutor-deportista-form-select ${errors.id_tutor ? 'error' : ''}`}
                      >
                        <option value="">Seleccionar tutor</option>
                        {tutores.filter(t => t.activo).map(t => (
                          <option key={t.id_tutor} value={t.id_tutor}>
                            {t.nombres} {t.apellidos} ({getParentescoLabel(t.parentesco)})
                          </option>
                        ))}
                      </select>
                      {errors.id_tutor && (
                        <span className="tutor-deportista-form-error">{errors.id_tutor}</span>
                      )}
                    </div>

                    <div className="tutor-deportista-form-group">
                      <label className="tutor-deportista-form-label">
                        <Star size={16} />
                        Tipo de Tutor
                      </label>
                      <div className="tutor-deportista-switch">
                        <input
                          type="checkbox"
                          id="principal"
                          checked={formRelacion.principal}
                          onChange={(e) => setFormRelacion({...formRelacion, principal: e.target.checked})}
                          className="tutor-deportista-switch-input"
                        />
                        <label htmlFor="principal" className="tutor-deportista-switch-label">
                          <span className="tutor-deportista-switch-slider"></span>
                          <span className="tutor-deportista-switch-text">
                            {formRelacion.principal ? 'Tutor Principal' : 'Tutor Secundario'}
                          </span>
                        </label>
                        <div className="tutor-deportista-form-hint">
                          El tutor principal recibirá notificaciones importantes
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="tutor-deportista-modal-footer">
                  <button onClick={closeModal} className="tutor-deportista-btn-secondary">
                    Cancelar
                  </button>
                  <button 
                    onClick={createRelacion}
                    className="tutor-deportista-btn-primary"
                  >
                    <LinkIcon size={18} />
                    Crear Relación
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL DETALLE */}
          {showDetailModal && (
            <div className="tutor-deportista-modal-overlay">
              <div className="tutor-deportista-modal large">
                <div className="tutor-deportista-modal-header">
                  <h3 className="tutor-deportista-modal-title">
                    {deportistasDelTutor.length > 0 ? 'Deportistas Asociados' : 'Tutores del Deportista'}
                  </h3>
                  <button onClick={closeModal} className="tutor-deportista-modal-close">
                    <X size={20} />
                  </button>
                </div>
                <div className="tutor-deportista-modal-body">
                  <div className="tutor-deportista-detail-list">
                    {(deportistasDelTutor.length > 0 ? deportistasDelTutor : tutoresDeDeportista).map((item, index) => (
                      <div key={index} className="tutor-deportista-detail-item">
                        <div className="tutor-deportista-detail-avatar">
                          {deportistasDelTutor.length > 0 ? <Award size={20} /> : <Shield size={20} />}
                        </div>
                        <div className="tutor-deportista-detail-content">
                          <div className="tutor-deportista-detail-name">
                            {item.nombres} {item.apellidos}
                          </div>
                          <div className="tutor-deportista-detail-meta">
                            {item.cedula && <span>Cédula: {item.cedula}</span>}
                            {item.parentesco && <span>Parentesco: {getParentescoLabel(item.parentesco)}</span>}
                            {item.telefono && <span>Teléfono: {item.telefono}</span>}
                          </div>
                          {item.principal !== undefined && (
                            <div className="tutor-deportista-detail-badge">
                              <Star size={12} fill={item.principal ? "#fbbf24" : "none"} />
                              {item.principal ? 'Tutor Principal' : 'Tutor Secundario'}
                            </div>
                          )}
                        </div>
                        <div className="tutor-deportista-detail-status">
                          <div className={`tutor-deportista-status-dot ${item.activo ? 'active' : 'inactive'}`} />
                          {item.activo ? 'Activo' : 'Inactivo'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="tutor-deportista-modal-footer">
                  <button onClick={closeModal} className="tutor-deportista-btn-primary">
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL ESTADISTICAS */}
          {showStatsModal && estadisticasTutor && (
            <div className="tutor-deportista-modal-overlay">
              <div className="tutor-deportista-modal large">
                <div className="tutor-deportista-modal-header">
                  <h3 className="tutor-deportista-modal-title">
                    Estadísticas del Tutor
                  </h3>
                  <button onClick={closeModal} className="tutor-deportista-modal-close">
                    <X size={20} />
                  </button>
                </div>
                <div className="tutor-deportista-modal-body">
                  <div className="tutor-deportista-stats-grid">
                    <div className="tutor-deportista-stat-card">
                      <div className="tutor-deportista-stat-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                        <Users size={24} />
                      </div>
                      <div>
                        <h3 className="tutor-deportista-stat-number">{estadisticasTutor.total_deportistas || 0}</h3>
                        <p className="tutor-deportista-stat-label">Deportistas Totales</p>
                      </div>
                    </div>
                    <div className="tutor-deportista-stat-card">
                      <div className="tutor-deportista-stat-icon" style={{background: '#fef3c7', color: '#f59e0b'}}>
                        <Star size={24} />
                      </div>
                      <div>
                        <h3 className="tutor-deportista-stat-number">{estadisticasTutor.principal_count || 0}</h3>
                        <p className="tutor-deportista-stat-label">Como Principal</p>
                      </div>
                    </div>
                    <div className="tutor-deportista-stat-card">
                      <div className="tutor-deportista-stat-icon" style={{background: '#dcfce7', color: '#16a34a'}}>
                        <Award size={24} />
                      </div>
                      <div>
                        <h3 className="tutor-deportista-stat-number">{estadisticasTutor.activos_count || 0}</h3>
                        <p className="tutor-deportista-stat-label">Deportistas Activos</p>
                      </div>
                    </div>
                    <div className="tutor-deportista-stat-card">
                      <div className="tutor-deportista-stat-icon" style={{background: '#e9d5ff', color: '#9333ea'}}>
                        <TrendingUp size={24} />
                      </div>
                      <div>
                        <h3 className="tutor-deportista-stat-number">{estadisticasTutor.relaciones_ultimo_mes || 0}</h3>
                        <p className="tutor-deportista-stat-label">Relaciones (último mes)</p>
                      </div>
                    </div>
                  </div>
                  
                  {estadisticasTutor.deportistas_por_deporte && (
                    <div className="tutor-deportista-stats-section">
                      <h4 className="tutor-deportista-stats-section-title">
                        Deportistas por Deporte
                      </h4>
                      <div className="tutor-deportista-chart">
                        {estadisticasTutor.deportistas_por_deporte.map((deporte, index) => (
                          <div key={index} className="tutor-deportista-chart-item">
                            <div className="tutor-deportista-chart-label">{deporte.nombre}</div>
                            <div className="tutor-deportista-chart-bar">
                              <div 
                                className="tutor-deportista-chart-fill"
                                style={{width: `${(deporte.count / Math.max(...estadisticasTutor.deportistas_por_deporte.map(d => d.count))) * 100}%`}}
                              />
                            </div>
                            <div className="tutor-deportista-chart-value">{deporte.count}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="tutor-deportista-modal-footer">
                  <button onClick={closeModal} className="tutor-deportista-btn-primary">
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL CONFIRMACION ELIMINAR */}
          {showDeleteModal && selected && (
            <div className="tutor-deportista-modal-overlay">
              <div className="tutor-deportista-modal">
                <div className="tutor-deportista-modal-header">
                  <h3 className="tutor-deportista-modal-title warning">
                    <AlertTriangle size={24} />
                    Confirmar Eliminación
                  </h3>
                  <button onClick={closeDeleteModal} className="tutor-deportista-modal-close">
                    <X size={20} />
                  </button>
                </div>
                <div className="tutor-deportista-modal-body">
                  <div className="tutor-deportista-warning-message">
                    <p>
                      ¿Está seguro de eliminar {selected.type === 'tutor' ? 'el tutor' : 'la relación'}?
                    </p>
                    {selected.type === 'tutor' ? (
                      <div className="tutor-deportista-warning-details">
                        <div className="tutor-deportista-warning-item">
                          <User size={16} />
                          <strong>{selected.nombres} {selected.apellidos}</strong>
                        </div>
                        <div className="tutor-deportista-warning-item">
                          <Mail size={16} />
                          {selected.email}
                        </div>
                        <div className="tutor-deportista-warning-item">
                          <Users size={16} />
                          {getParentescoLabel(selected.parentesco)}
                        </div>
                      </div>
                    ) : (
                      <div className="tutor-deportista-warning-details">
                        <div className="tutor-deportista-warning-item">
                          <Award size={16} />
                          <strong>Deportista:</strong> {selected.deportista?.nombres} {selected.deportista?.apellidos}
                        </div>
                        <div className="tutor-deportista-warning-item">
                          <Shield size={16} />
                          <strong>Tutor:</strong> {selected.tutor?.nombres} {selected.tutor?.apellidos}
                        </div>
                        <div className="tutor-deportista-warning-item">
                          <Star size={16} />
                          <strong>Tipo:</strong> {selected.principal ? 'Principal' : 'Secundario'}
                        </div>
                      </div>
                    )}
                    <div className="tutor-deportista-warning-alert">
                      <AlertTriangle size={16} />
                      Esta acción no se puede deshacer
                    </div>
                  </div>
                </div>
                <div className="tutor-deportista-modal-footer">
                  <button onClick={closeDeleteModal} className="tutor-deportista-btn-secondary">
                    Cancelar
                  </button>
                  <button 
                    onClick={() => selected.type === 'tutor' ? deleteTutor(selected.id_tutor) : deleteRelacion(selected.id_deportista_tutor)}
                    className="tutor-deportista-btn-danger"
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

export default Tutor;