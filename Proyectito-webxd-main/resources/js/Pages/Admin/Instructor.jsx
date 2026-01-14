import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, X, Filter, Search, RefreshCw, 
    Eye, ChevronLeft, ChevronRight, AlertTriangle, 
  CheckCircle, XCircle, Users, Calendar, 
  Download, MoreVertical, CheckSquare, Square,
  ArrowUpDown, BarChart3, Mail, Phone, 
  User, Shield, Clock, Activity,
  Upload as UploadIcon, UserPlus, Users as UsersIcon, 
  FileText, UserCheck, BookOpen,
  Award as AwardIcon, Star, Edit, Filter as FilterIcon,
  Users as GroupIcon, PersonStanding, 
  Clock as ClockIcon, TrendingUp as TrendingUpIcon,
  ClipboardList, CalendarCheck, CheckCheck, Clock3, 
  Printer, CalendarRange, UserCheck as UserCheckIcon, 
  UserX, BarChart2, ListChecks, ClipboardCheck, 
  Percent, FileText as FileTextIcon, Save, 
  Book, BookOpen as BookOpenIcon, GraduationCap, School, 
  BookMarked, Award as AwardIcon2, 
  Target as TargetIcon, UserCog, Settings, 
  Layers, Hash, TrendingUp, TrendingDown,
  Mail as MailIcon, Phone as PhoneIcon, MapPin,
  Briefcase, Award, BookOpenCheck, Star as StarIcon,
  BarChart, PieChart, LineChart, DownloadCloud,
  RotateCcw, CheckSquare as CheckSquareIcon,
  Square as SquareIcon, ChevronDown, ChevronUp,
  ExternalLink, Copy, MoreHorizontal,
  Users as UsersGroup, UserMinus, UserPlus as UserPlusIcon2,

  BadgeCheck, // Reemplazo para Certificate
  Trophy, // Reemplazo alternativo
  FileBadge, // Otro reemplazo posible
  BookOpenText // Para BookOpenCheck
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/instructor.css';

const API_INSCRIPCIONES = 'http://127.0.0.1:8000/api/inscripciones-curso';
const API_INSTRUCTORES = 'http://127.0.0.1:8000/api/instructores';
const API_INSTRUCTOR_GRUPO = 'http://127.0.0.1:8000/api/instructor-grupo';
const API_CURSOS = 'http://127.0.0.1:8000/api/cursos';
const API_GRUPOS = 'http://127.0.0.1:8000/api/grupos-curso';
const API_DEPORTISTAS = 'http://127.0.0.1:8000/api/deportistas';
const API_USUARIOS = 'http://127.0.0.1:8000/api/usuarios';

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

const Instructores = () => {
  // Estado para controlar la pestaña activa
  const [activeTab, setActiveTab] = useState('inscripciones');
  
  // ========== ESTADOS COMUNES ==========
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ========== ESTADOS PARA INSCRIPCIONES ==========
  const [inscripciones, setInscripciones] = useState([]);
  const [filteredInscripciones, setFilteredInscripciones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [deportistas, setDeportistas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  
  // Estados para modal de inscripciones
  const [showInscripcionModal, setShowInscripcionModal] = useState(false);
  const [showInscripcionDetailModal, setShowInscripcionDetailModal] = useState(false);
  const [showInscripcionDeleteModal, setShowInscripcionDeleteModal] = useState(false);
  const [inscripcionMode, setInscripcionMode] = useState('create');
  const [selectedInscripcion, setSelectedInscripcion] = useState(null);
  
  // Filtros para inscripciones
  const [inscripcionSearch, setInscripcionSearch] = useState('');
  const [inscripcionEstadoFilter, setInscripcionEstadoFilter] = useState('all');
  const [inscripcionCursoFilter, setInscripcionCursoFilter] = useState('all');
  const [inscripcionGrupoFilter, setInscripcionGrupoFilter] = useState('all');
  
  // Formulario inscripción
  const [inscripcionForm, setInscripcionForm] = useState({
    id_curso: '',
    id_grupo: '',
    id_usuario: '',
    id_deportista: '',
    fecha_inscripcion: new Date().toISOString().split('T')[0],
    observaciones: '',
    estado: 'activa',
    calificacion: '',
    comentarios: ''
  });
  
  // ========== ESTADOS PARA INSTRUCTORES ==========
  const [instructores, setInstructores] = useState([]);
  const [filteredInstructores, setFilteredInstructores] = useState([]);
  
  // Estados para modal de instructores
  const [showInstructorModal, setShowInstructorModal] = useState(false);
  const [showInstructorDetailModal, setShowInstructorDetailModal] = useState(false);
  const [showInstructorDeleteModal, setShowInstructorDeleteModal] = useState(false);
  const [instructorMode, setInstructorMode] = useState('create');
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  
  // Filtros para instructores
  const [instructorSearch, setInstructorSearch] = useState('');
  const [instructorEstadoFilter, setInstructorEstadoFilter] = useState('all');
  
  // Formulario instructor
  const [instructorForm, setInstructorForm] = useState({
    id_usuario: '',
    especialidad: '',
    certificaciones: '',
    foto: null,
    activo: true
  });
  
  // ========== ESTADOS PARA INSTRUCTOR-GRUPO ==========
  const [instructorGrupos, setInstructorGrupos] = useState([]);
  const [filteredInstructorGrupos, setFilteredInstructorGrupos] = useState([]);
  
  // Estados para modal de instructor-grupo
  const [showInstructorGrupoModal, setShowInstructorGrupoModal] = useState(false);
  const [showInstructorGrupoDeleteModal, setShowInstructorGrupoDeleteModal] = useState(false);
  const [instructorGrupoMode, setInstructorGrupoMode] = useState('create');
  const [selectedInstructorGrupo, setSelectedInstructorGrupo] = useState(null);
  
  // Formulario instructor-grupo
  const [instructorGrupoForm, setInstructorGrupoForm] = useState({
    id_instructor: '',
    id_grupo: '',
    coordinador: false
  });
  
  // ========== PAGINACIÓN COMÚN ==========
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage] = useState(15);
  
  // ========== FUNCIONES COMUNES ==========
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };
  
  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'activa':
      case 'presente':
      case true: return '#10b981';
      case 'completada': return '#3b82f6';
      case 'cancelada':
      case 'ausente':
      case false: return '#ef4444';
      case 'pendiente': return '#f59e0b';
      default: return '#6b7280';
    }
  };
  
  const getEstadoIcon = (estado) => {
    switch(estado) {
      case 'activa':
      case 'presente':
      case true: return <CheckCircle size={14} />;
      case 'completada': return <Certificate size={14} />;
      case 'cancelada':
      case 'ausente':
      case false: return <XCircle size={14} />;
      case 'pendiente': return <Clock3 size={14} />;
      default: return <XCircle size={14} />;
    }
  };
  
  // ========== FUNCIONES PARA INSCRIPCIONES ==========
  const loadInscripciones = async () => {
    setLoading(true);
    try {
      let url = `${API_INSCRIPCIONES}`;
      const headers = authHeaders();
      const res = await fetch(url, { headers });
      
      if (!res.ok) throw new Error('Error al cargar inscripciones');
      
      const data = await res.json();
      const inscripcionesData = Array.isArray(data) ? data : (data.data || []);
      
      setInscripciones(inscripcionesData);
      setFilteredInscripciones(inscripcionesData);
      setTotalItems(inscripcionesData.length);
      setTotalPages(Math.ceil(inscripcionesData.length / perPage));
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar inscripciones');
    } finally {
      setLoading(false);
    }
  };
  
  const loadInscripcionData = async () => {
    try {
      // Cargar cursos
      const cursosRes = await fetch(API_CURSOS, { headers: authHeaders() });
      if (cursosRes.ok) {
        const cursosData = await cursosRes.json();
        setCursos(Array.isArray(cursosData) ? cursosData : []);
      }
      
      // Cargar grupos
      const gruposRes = await fetch(API_GRUPOS, { headers: authHeaders() });
      if (gruposRes.ok) {
        const gruposData = await gruposRes.json();
        setGrupos(Array.isArray(gruposData) ? gruposData : []);
      }
      
      // Cargar deportistas
      const deportistasRes = await fetch(API_DEPORTISTAS, { headers: authHeaders() });
      if (deportistasRes.ok) {
        const deportistasData = await deportistasRes.json();
        setDeportistas(Array.isArray(deportistasData) ? deportistasData : []);
      }
      
      // Cargar usuarios (tutores)
      const usuariosRes = await fetch(API_USUARIOS, { headers: authHeaders() });
      if (usuariosRes.ok) {
        const usuariosData = await usuariosRes.json();
        setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };
  
  // Filtros para inscripciones
  useEffect(() => {
    if (activeTab !== 'inscripciones') return;
    
    let filtered = [...inscripciones];
    
    if (inscripcionEstadoFilter !== 'all') {
      filtered = filtered.filter(i => i.estado === inscripcionEstadoFilter);
    }
    
    if (inscripcionCursoFilter !== 'all') {
      filtered = filtered.filter(i => i.id_curso == inscripcionCursoFilter);
    }
    
    if (inscripcionGrupoFilter !== 'all') {
      filtered = filtered.filter(i => i.id_grupo == inscripcionGrupoFilter);
    }
    
    if (inscripcionSearch) {
      const term = inscripcionSearch.toLowerCase();
      filtered = filtered.filter(i =>
        (i.deportista?.nombres && i.deportista.nombres.toLowerCase().includes(term)) ||
        (i.deportista?.apellidos && i.deportista.apellidos.toLowerCase().includes(term)) ||
        (i.curso?.nombre && i.curso.nombre.toLowerCase().includes(term)) ||
        (i.observaciones && i.observaciones.toLowerCase().includes(term))
      );
    }
    
    setFilteredInscripciones(filtered);
    setCurrentPage(1);
    setTotalPages(Math.ceil(filtered.length / perPage));
  }, [inscripciones, inscripcionSearch, inscripcionEstadoFilter, inscripcionCursoFilter, inscripcionGrupoFilter, activeTab]);
  
  // ========== FUNCIONES PARA INSTRUCTORES ==========
  const loadInstructores = async () => {
    setLoading(true);
    try {
      let url = `${API_INSTRUCTORES}`;
      const headers = authHeaders();
      const res = await fetch(url, { headers });
      
      if (!res.ok) throw new Error('Error al cargar instructores');
      
      const data = await res.json();
      const instructoresData = Array.isArray(data) ? data : (data.data || []);
      
      setInstructores(instructoresData);
      setFilteredInstructores(instructoresData);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar instructores');
    } finally {
      setLoading(false);
    }
  };
  
  // Filtros para instructores
  useEffect(() => {
    if (activeTab !== 'instructores') return;
    
    let filtered = [...instructores];
    
    if (instructorEstadoFilter !== 'all') {
      const activo = instructorEstadoFilter === 'activo';
      filtered = filtered.filter(i => i.activo === activo);
    }
    
    if (instructorSearch) {
      const term = instructorSearch.toLowerCase();
      filtered = filtered.filter(i =>
        (i.usuario?.nombre && i.usuario.nombre.toLowerCase().includes(term)) ||
        (i.usuario?.apellido && i.usuario.apellido.toLowerCase().includes(term)) ||
        (i.especialidad && i.especialidad.toLowerCase().includes(term)) ||
        (i.certificaciones && i.certificaciones.toLowerCase().includes(term))
      );
    }
    
    setFilteredInstructores(filtered);
    setCurrentPage(1);
    setTotalPages(Math.ceil(filtered.length / perPage));
  }, [instructores, instructorSearch, instructorEstadoFilter, activeTab]);
  
  // ========== FUNCIONES PARA INSTRUCTOR-GRUPO ==========
  const loadInstructorGrupos = async () => {
    setLoading(true);
    try {
      let url = `${API_INSTRUCTOR_GRUPO}`;
      const headers = authHeaders();
      const res = await fetch(url, { headers });
      
      if (!res.ok) throw new Error('Error al cargar instructor-grupo');
      
      const data = await res.json();
      const instructorGruposData = Array.isArray(data) ? data : (data.data || []);
      
      setInstructorGrupos(instructorGruposData);
      setFilteredInstructorGrupos(instructorGruposData);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar instructor-grupo');
    } finally {
      setLoading(false);
    }
  };
  
  // ========== CRUD INSCRIPCIONES ==========
  const createInscripcion = async () => {
    try {
      const res = await fetch(API_INSCRIPCIONES, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(inscripcionForm)
      });
      
      if (res.ok) {
        closeInscripcionModal();
        await loadInscripciones();
        alert('✅ Inscripción creada exitosamente');
      } else {
        const error = await res.json();
        alert(`❌ ${error.message || 'Error al crear inscripción'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };
  
  const updateInscripcion = async () => {
    if (!selectedInscripcion) return;
    
    try {
      const res = await fetch(`${API_INSCRIPCIONES}/${selectedInscripcion.id_inscripcion}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(inscripcionForm)
      });
      
      if (res.ok) {
        closeInscripcionModal();
        await loadInscripciones();
        alert('✅ Inscripción actualizada exitosamente');
      } else {
        const error = await res.json();
        alert(`❌ ${error.message || 'Error al actualizar inscripción'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };
  
  const deleteInscripcion = async (id) => {
    try {
      const res = await fetch(`${API_INSCRIPCIONES}/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      if (res.ok) {
        closeInscripcionDeleteModal();
        await loadInscripciones();
        alert('✅ Inscripción eliminada exitosamente');
      } else {
        const error = await res.json();
        alert(`❌ ${error.message || 'Error al eliminar inscripción'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };
  
  // ========== CRUD INSTRUCTORES ==========
  const createInstructor = async () => {
    try {
      const res = await fetch(API_INSTRUCTORES, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(instructorForm)
      });
      
      if (res.ok) {
        closeInstructorModal();
        await loadInstructores();
        alert('✅ Instructor creado exitosamente');
      } else {
        const error = await res.json();
        alert(`❌ ${error.message || 'Error al crear instructor'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };
  
  const updateInstructor = async () => {
    if (!selectedInstructor) return;
    
    try {
      const res = await fetch(`${API_INSTRUCTORES}/${selectedInstructor.id_instructor}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(instructorForm)
      });
      
      if (res.ok) {
        closeInstructorModal();
        await loadInstructores();
        alert('✅ Instructor actualizado exitosamente');
      } else {
        const error = await res.json();
        alert(`❌ ${error.message || 'Error al actualizar instructor'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };
  
  const deleteInstructor = async (id) => {
    try {
      const res = await fetch(`${API_INSTRUCTORES}/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      if (res.ok) {
        closeInstructorDeleteModal();
        await loadInstructores();
        alert('✅ Instructor eliminado exitosamente');
      } else {
        const error = await res.json();
        alert(`❌ ${error.message || 'Error al eliminar instructor'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };
  
  // ========== CRUD INSTRUCTOR-GRUPO ==========
  const createInstructorGrupo = async () => {
    try {
      const res = await fetch(API_INSTRUCTOR_GRUPO, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(instructorGrupoForm)
      });
      
      if (res.ok) {
        closeInstructorGrupoModal();
        await loadInstructorGrupos();
        alert('✅ Instructor asignado al grupo exitosamente');
      } else {
        const error = await res.json();
        alert(`❌ ${error.message || 'Error al asignar instructor'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };
  
  const deleteInstructorGrupo = async (id) => {
    try {
      const res = await fetch(`${API_INSTRUCTOR_GRUPO}/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      if (res.ok) {
        closeInstructorGrupoDeleteModal();
        await loadInstructorGrupos();
        alert('✅ Asignación eliminada exitosamente');
      } else {
        const error = await res.json();
        alert(`❌ ${error.message || 'Error al eliminar asignación'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };
  
  // ========== MODALES INSCRIPCIONES ==========
  const openCreateInscripcionModal = () => {
    setInscripcionMode('create');
    setInscripcionForm({
      id_curso: '',
      id_grupo: '',
      id_usuario: '',
      id_deportista: '',
      fecha_inscripcion: new Date().toISOString().split('T')[0],
      observaciones: '',
      estado: 'activa',
      calificacion: '',
      comentarios: ''
    });
    setSelectedInscripcion(null);
    setShowInscripcionModal(true);
  };
  
  const openEditInscripcionModal = (inscripcion) => {
    setInscripcionMode('edit');
    setSelectedInscripcion(inscripcion);
    setInscripcionForm({
      id_curso: inscripcion.id_curso || '',
      id_grupo: inscripcion.id_grupo || '',
      id_usuario: inscripcion.id_usuario || '',
      id_deportista: inscripcion.id_deportista || '',
      fecha_inscripcion: inscripcion.fecha_inscripcion ? inscripcion.fecha_inscripcion.split('T')[0] : new Date().toISOString().split('T')[0],
      observaciones: inscripcion.observaciones || '',
      estado: inscripcion.estado || 'activa',
      calificacion: inscripcion.calificacion || '',
      comentarios: inscripcion.comentarios || ''
    });
    setShowInscripcionModal(true);
  };
  
  const openInscripcionDetailModal = (inscripcion) => {
    setSelectedInscripcion(inscripcion);
    setShowInscripcionDetailModal(true);
  };
  
  const openInscripcionDeleteModal = (inscripcion) => {
    setSelectedInscripcion(inscripcion);
    setShowInscripcionDeleteModal(true);
  };
  
  const closeInscripcionModal = () => {
    setShowInscripcionModal(false);
    setShowInscripcionDetailModal(false);
  };
  
  const closeInscripcionDeleteModal = () => {
    setShowInscripcionDeleteModal(false);
    setSelectedInscripcion(null);
  };
  
  // ========== MODALES INSTRUCTORES ==========
  const openCreateInstructorModal = () => {
    setInstructorMode('create');
    setInstructorForm({
      id_usuario: '',
      especialidad: '',
      certificaciones: '',
      foto: null,
      activo: true
    });
    setSelectedInstructor(null);
    setShowInstructorModal(true);
  };
  
  const openEditInstructorModal = (instructor) => {
    setInstructorMode('edit');
    setSelectedInstructor(instructor);
    setInstructorForm({
      id_usuario: instructor.id_usuario || '',
      especialidad: instructor.especialidad || '',
      certificaciones: instructor.certificaciones || '',
      foto: null,
      activo: instructor.activo ?? true
    });
    setShowInstructorModal(true);
  };
  
  const openInstructorDetailModal = (instructor) => {
    setSelectedInstructor(instructor);
    setShowInstructorDetailModal(true);
  };
  
  const openInstructorDeleteModal = (instructor) => {
    setSelectedInstructor(instructor);
    setShowInstructorDeleteModal(true);
  };
  
  const closeInstructorModal = () => {
    setShowInstructorModal(false);
    setShowInstructorDetailModal(false);
  };
  
  const closeInstructorDeleteModal = () => {
    setShowInstructorDeleteModal(false);
    setSelectedInstructor(null);
  };
  
  // ========== MODALES INSTRUCTOR-GRUPO ==========
  const openCreateInstructorGrupoModal = () => {
    setInstructorGrupoMode('create');
    setInstructorGrupoForm({
      id_instructor: '',
      id_grupo: '',
      coordinador: false
    });
    setSelectedInstructorGrupo(null);
    setShowInstructorGrupoModal(true);
  };
  
  const openInstructorGrupoDeleteModal = (instructorGrupo) => {
    setSelectedInstructorGrupo(instructorGrupo);
    setShowInstructorGrupoDeleteModal(true);
  };
  
  const closeInstructorGrupoModal = () => {
    setShowInstructorGrupoModal(false);
  };
  
  const closeInstructorGrupoDeleteModal = () => {
    setShowInstructorGrupoDeleteModal(false);
    setSelectedInstructorGrupo(null);
  };
  
  // ========== CARGA INICIAL ==========
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'inscripciones') {
          await Promise.all([loadInscripciones(), loadInscripcionData()]);
        } else if (activeTab === 'instructores') {
          await loadInstructores();
        } else if (activeTab === 'instructor-grupo') {
          await loadInstructorGrupos();
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, [activeTab]);
  
  // ========== DATOS PAGINADOS ==========
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    
    if (activeTab === 'inscripciones') {
      return filteredInscripciones.slice(startIndex, endIndex);
    } else if (activeTab === 'instructores') {
      return filteredInstructores.slice(startIndex, endIndex);
    } else if (activeTab === 'instructor-grupo') {
      return filteredInstructorGrupos.slice(startIndex, endIndex);
    }
    return [];
  }, [currentPage, perPage, activeTab, filteredInscripciones, filteredInstructores, filteredInstructorGrupos]);
  
  // ========== ESTADÍSTICAS ==========
  const stats = useMemo(() => {
    if (activeTab === 'inscripciones') {
      const total = inscripciones.length;
      const activas = inscripciones.filter(i => i.estado === 'activa').length;
      const completadas = inscripciones.filter(i => i.estado === 'completada').length;
      const canceladas = inscripciones.filter(i => i.estado === 'cancelada').length;
      
      return { total, activas, completadas, canceladas };
    } else if (activeTab === 'instructores') {
      const total = instructores.length;
      const activos = instructores.filter(i => i.activo).length;
      const inactivos = instructores.filter(i => !i.activo).length;
      const conGrupos = instructores.filter(i => i.grupos && i.grupos.length > 0).length;
      
      return { total, activos, inactivos, conGrupos };
    }
    return { total: 0 };
  }, [activeTab, inscripciones, instructores]);
  
  // ========== RENDERIZADO CONDICIONAL ==========
  const renderHeader = () => {
    switch(activeTab) {
      case 'inscripciones':
        return {
          title: 'Inscripciones a Cursos',
          subtitle: 'Administra las inscripciones de deportistas a cursos',
          icon: <Book size={28} />
        };
      case 'instructores':
        return {
          title: 'Instructores',
          subtitle: 'Administra los instructores del sistema',
          icon: <GraduationCap size={28} />
        };
      case 'instructor-grupo':
        return {
          title: 'Asignación Instructores-Grupos',
          subtitle: 'Asigna instructores a grupos de cursos',
          icon: <UsersGroup size={28} />
        };
      default:
        return {
          title: 'Cursos e Instructores',
          subtitle: 'Administración completa',
          icon: <School size={28} />
        };
    }
  };
  
  const renderStats = () => {
    if (activeTab === 'inscripciones') {
      return (
        <div className="cursos-stats-grid">
          <div className="cursos-stat-card">
            <div className="cursos-stat-icon" style={{backgroundColor: '#f0f9ff', color: '#0ea5e9'}}>
              <Book size={24} />
            </div>
            <div>
              <h3 className="cursos-stat-number">{stats.total}</h3>
              <p className="cursos-stat-label">Total Inscripciones</p>
            </div>
          </div>
          
          <div className="cursos-stat-card">
            <div className="cursos-stat-icon" style={{backgroundColor: '#d1fae5', color: '#10b981'}}>
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="cursos-stat-number">{stats.activas}</h3>
              <p className="cursos-stat-label">Activas</p>
            </div>
          </div>
          
          <div className="cursos-stat-card">
            <div className="cursos-stat-icon" style={{backgroundColor: '#dbeafe', color: '#3b82f6'}}>
              <BadgeCheck size={24} />
            </div>
            <div>
              <h3 className="cursos-stat-number">{stats.completadas}</h3>
              <p className="cursos-stat-label">Completadas</p>
            </div>
          </div>
          
          <div className="cursos-stat-card">
            <div className="cursos-stat-icon" style={{backgroundColor: '#fee2e2', color: '#ef4444'}}>
              <XCircle size={24} />
            </div>
            <div>
              <h3 className="cursos-stat-number">{stats.canceladas}</h3>
              <p className="cursos-stat-label">Canceladas</p>
            </div>
          </div>
        </div>
      );
    } else if (activeTab === 'instructores') {
      return (
        <div className="cursos-stats-grid">
          <div className="cursos-stat-card">
            <div className="cursos-stat-icon" style={{backgroundColor: '#f0f9ff', color: '#0ea5e9'}}>
              <Users size={24} />
            </div>
            <div>
              <h3 className="cursos-stat-number">{stats.total}</h3>
              <p className="cursos-stat-label">Total Instructores</p>
            </div>
          </div>
          
          <div className="cursos-stat-card">
            <div className="cursos-stat-icon" style={{backgroundColor: '#d1fae5', color: '#10b981'}}>
              <UserCheck size={24} />
            </div>
            <div>
              <h3 className="cursos-stat-number">{stats.activos}</h3>
              <p className="cursos-stat-label">Activos</p>
            </div>
          </div>
          
          <div className="cursos-stat-card">
            <div className="cursos-stat-icon" style={{backgroundColor: '#fee2e2', color: '#ef4444'}}>
              <UserX size={24} />
            </div>
            <div>
              <h3 className="cursos-stat-number">{stats.inactivos}</h3>
              <p className="cursos-stat-label">Inactivos</p>
            </div>
          </div>
          
          <div className="cursos-stat-card">
            <div className="cursos-stat-icon" style={{backgroundColor: '#f0f9ff', color: '#0ea5e9'}}>
              <GroupIcon size={24} />
            </div>
            <div>
              <h3 className="cursos-stat-number">{stats.conGrupos}</h3>
              <p className="cursos-stat-label">Con Grupos</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  const renderTable = () => {
    if (loading) {
      return (
        <div className="cursos-loading">
          <div className="cursos-loading-spinner"></div>
          <p>Cargando datos...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="cursos-error">
          <AlertTriangle size={48} className="cursos-error-icon" />
          <h3>Error al cargar datos</h3>
          <p>{error}</p>
          <button onClick={() => {
            if (activeTab === 'inscripciones') loadInscripciones();
            else if (activeTab === 'instructores') loadInstructores();
            else loadInstructorGrupos();
          }} className="cursos-btn cursos-btn-primary" style={{marginTop: '1rem'}}>
            <RefreshCw size={18} /> Reintentar
          </button>
        </div>
      );
    }
    
    if (activeTab === 'inscripciones' && filteredInscripciones.length === 0) {
      return (
        <div className="cursos-empty-state">
          <Book size={64} className="cursos-empty-state-icon" />
          <h3>
            {inscripcionSearch || inscripcionEstadoFilter !== 'all' 
              ? 'No se encontraron resultados' 
              : 'No hay inscripciones registradas'}
          </h3>
          <p>
            {inscripcionSearch || inscripcionEstadoFilter !== 'all'
              ? 'Intenta con otros términos de búsqueda o filtros' 
              : 'Comienza creando tu primera inscripción'}
          </p>
          <button onClick={openCreateInscripcionModal} className="cursos-btn cursos-btn-primary" style={{marginTop: '1.5rem'}}>
            <Plus size={18} /> Nueva Inscripción
          </button>
        </div>
      );
    }
    
    if (activeTab === 'instructores' && filteredInstructores.length === 0) {
      return (
        <div className="cursos-empty-state">
          <GraduationCap size={64} className="cursos-empty-state-icon" />
          <h3>
            {instructorSearch || instructorEstadoFilter !== 'all' 
              ? 'No se encontraron resultados' 
              : 'No hay instructores registrados'}
          </h3>
          <p>
            {instructorSearch || instructorEstadoFilter !== 'all'
              ? 'Intenta con otros términos de búsqueda o filtros' 
              : 'Comienza creando tu primer instructor'}
          </p>
          <button onClick={openCreateInstructorModal} className="cursos-btn cursos-btn-primary" style={{marginTop: '1.5rem'}}>
            <Plus size={18} /> Nuevo Instructor
          </button>
        </div>
      );
    }
    
    if (activeTab === 'instructor-grupo' && filteredInstructorGrupos.length === 0) {
      return (
        <div className="cursos-empty-state">
          <UsersGroup size={64} className="cursos-empty-state-icon" />
          <h3>No hay asignaciones instructor-grupo</h3>
          <p>Comienza asignando un instructor a un grupo</p>
          <button onClick={openCreateInstructorGrupoModal} className="cursos-btn cursos-btn-primary" style={{marginTop: '1.5rem'}}>
            <Plus size={18} /> Nueva Asignación
          </button>
        </div>
      );
    }
    
    return (
      <div className="cursos-table-container">
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
            Mostrando {paginatedData.length} de {
              activeTab === 'inscripciones' ? filteredInscripciones.length :
              activeTab === 'instructores' ? filteredInstructores.length :
              filteredInstructorGrupos.length
            } registros
          </div>
          {totalPages > 1 && (
            <div className="text-secondary">
              Página {currentPage} de {totalPages}
            </div>
          )}
        </div>
        
        {renderTableContent()}
        
        {/* PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="cursos-pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="cursos-pagination-btn"
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
                  className={`cursos-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                  disabled={loading}
                >
                  {pageNum}
                </button>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="cursos-pagination-ellipsis">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="cursos-pagination-btn"
                  disabled={loading}
                >
                  {totalPages}
                </button>
              </>
            )}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || loading}
              className="cursos-pagination-btn"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    );
  };
  
  const renderTableContent = () => {
    if (activeTab === 'inscripciones') {
      return (
        <table className="cursos-table">
          <thead>
            <tr>
              <th style={{minWidth: '150px'}}>Deportista</th>
              <th style={{minWidth: '150px'}}>Curso</th>
              <th style={{minWidth: '120px'}}>Grupo</th>
              <th style={{minWidth: '100px'}}>Fecha</th>
              <th style={{minWidth: '100px'}}>Estado</th>
              <th style={{minWidth: '80px'}}>Calificación</th>
              <th style={{minWidth: '140px'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(inscripcion => (
              <tr key={inscripcion.id_inscripcion}>
                <td>
                  <div style={{fontWeight: '600', color: '#1f2937'}}>
                    {inscripcion.deportista?.nombres} {inscripcion.deportista?.apellidos}
                  </div>
                  <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                    {inscripcion.deportista?.numero_documento}
                  </div>
                </td>
                <td>
                  <div style={{fontWeight: '500'}}>
                    {inscripcion.curso?.nombre}
                  </div>
                  <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                    {inscripcion.curso?.codigo}
                  </div>
                </td>
                <td>
                  {inscripcion.grupo?.nombre || '-'}
                </td>
                <td>
                  {formatDate(inscripcion.fecha_inscripcion)}
                </td>
                <td>
                  <div 
                    className="cursos-estado-badge"
                    style={{
                      backgroundColor: getEstadoColor(inscripcion.estado) + '20',
                      color: getEstadoColor(inscripcion.estado),
                      borderColor: getEstadoColor(inscripcion.estado)
                    }}
                  >
                    {getEstadoIcon(inscripcion.estado)}
                    <span>{inscripcion.estado}</span>
                  </div>
                </td>
                <td>
                  <div style={{fontWeight: '600', color: '#1f2937'}}>
                    {inscripcion.calificacion || '-'}
                  </div>
                </td>
                <td>
                  <div className="cursos-action-buttons">
                    <button
                      onClick={() => openInscripcionDetailModal(inscripcion)}
                      className="cursos-btn-action cursos-btn-view"
                      title="Ver detalles"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => openEditInscripcionModal(inscripcion)}
                      className="cursos-btn-action cursos-btn-edit"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => openInscripcionDeleteModal(inscripcion)}
                      className="cursos-btn-action cursos-btn-danger"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (activeTab === 'instructores') {
      return (
        <table className="cursos-table">
          <thead>
            <tr>
              <th style={{minWidth: '200px'}}>Instructor</th>
              <th style={{minWidth: '150px'}}>Especialidad</th>
              <th style={{minWidth: '100px'}}>Certificaciones</th>
              <th style={{minWidth: '100px'}}>Estado</th>
              <th style={{minWidth: '100px'}}>Grupos</th>
              <th style={{minWidth: '140px'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(instructor => (
              <tr key={instructor.id_instructor}>
                <td>
                  <div style={{fontWeight: '600', color: '#1f2937'}}>
                    {instructor.usuario?.nombre} {instructor.usuario?.apellido}
                  </div>
                  <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                    {instructor.usuario?.email}
                  </div>
                </td>
                <td>
                  <div style={{fontWeight: '500'}}>
                    {instructor.especialidad}
                  </div>
                </td>
                <td>
                  <div style={{fontSize: '0.875rem'}} className="truncate">
                    {instructor.certificaciones || '-'}
                  </div>
                </td>
                <td>
                  <div 
                    className="cursos-estado-badge"
                    style={{
                      backgroundColor: getEstadoColor(instructor.activo) + '20',
                      color: getEstadoColor(instructor.activo),
                      borderColor: getEstadoColor(instructor.activo)
                    }}
                  >
                    {getEstadoIcon(instructor.activo)}
                    <span>{instructor.activo ? 'Activo' : 'Inactivo'}</span>
                  </div>
                </td>
                <td>
                  <div style={{fontWeight: '600', color: '#1f2937'}}>
                    {instructor.grupos?.length || 0}
                  </div>
                </td>
                <td>
                  <div className="cursos-action-buttons">
                    <button
                      onClick={() => openInstructorDetailModal(instructor)}
                      className="cursos-btn-action cursos-btn-view"
                      title="Ver detalles"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => openEditInstructorModal(instructor)}
                      className="cursos-btn-action cursos-btn-edit"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => openInstructorDeleteModal(instructor)}
                      className="cursos-btn-action cursos-btn-danger"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (activeTab === 'instructor-grupo') {
      return (
        <table className="cursos-table">
          <thead>
            <tr>
              <th style={{minWidth: '200px'}}>Instructor</th>
              <th style={{minWidth: '200px'}}>Grupo</th>
              <th style={{minWidth: '120px'}}>Rol</th>
              <th style={{minWidth: '140px'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(asignacion => (
              <tr key={asignacion.id || asignacion.pivot?.id}>
                <td>
                  <div style={{fontWeight: '600', color: '#1f2937'}}>
                    {asignacion.instructor?.usuario?.nombre} {asignacion.instructor?.usuario?.apellido}
                  </div>
                  <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                    {asignacion.instructor?.especialidad}
                  </div>
                </td>
                <td>
                  <div style={{fontWeight: '500'}}>
                    {asignacion.grupo?.nombre}
                  </div>
                  <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                    {asignacion.grupo?.curso?.nombre}
                  </div>
                </td>
                <td>
                  <div 
                    className="cursos-estado-badge"
                    style={{
                      backgroundColor: asignacion.coordinador ? '#dbeafe' : '#f3f4f6',
                      color: asignacion.coordinador ? '#3b82f6' : '#6b7280',
                      borderColor: asignacion.coordinador ? '#3b82f6' : '#d1d5db'
                    }}
                  >
                    {asignacion.coordinador ? 'Coordinador' : 'Instructor'}
                  </div>
                </td>
                <td>
                  <div className="cursos-action-buttons">
                    <button
                      onClick={() => openInstructorGrupoDeleteModal(asignacion)}
                      className="cursos-btn-action cursos-btn-danger"
                      title="Eliminar asignación"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    return null;
  };
  
  const renderSearchFilters = () => {
    if (activeTab === 'inscripciones') {
      return (
        <div className="cursos-filters">
          <select
            value={inscripcionEstadoFilter}
            onChange={(e) => setInscripcionEstadoFilter(e.target.value)}
            className="cursos-filter-select"
            disabled={loading}
          >
            <option value="all">Todos los estados</option>
            <option value="activa">Activa</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
          
          <select
            value={inscripcionCursoFilter}
            onChange={(e) => setInscripcionCursoFilter(e.target.value)}
            className="cursos-filter-select"
            disabled={loading}
          >
            <option value="all">Todos los cursos</option>
            {Array.isArray(cursos) && cursos.map(curso => (
              <option key={curso.id_curso} value={curso.id_curso}>
                {curso.nombre}
              </option>
            ))}
          </select>
          
          <select
            value={inscripcionGrupoFilter}
            onChange={(e) => setInscripcionGrupoFilter(e.target.value)}
            className="cursos-filter-select"
            disabled={loading}
          >
            <option value="all">Todos los grupos</option>
            {Array.isArray(grupos) && grupos.map(grupo => (
              <option key={grupo.id_grupo} value={grupo.id_grupo}>
                {grupo.nombre}
              </option>
            ))}
          </select>
        </div>
      );
    } else if (activeTab === 'instructores') {
      return (
        <div className="cursos-filters">
          <select
            value={instructorEstadoFilter}
            onChange={(e) => setInstructorEstadoFilter(e.target.value)}
            className="cursos-filter-select"
            disabled={loading}
          >
            <option value="all">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      );
    }
    return null;
  };
  
  const renderCreateButton = () => {
    switch(activeTab) {
      case 'inscripciones':
        return (
          <button 
            onClick={openCreateInscripcionModal} 
            className="cursos-btn cursos-btn-primary"
            style={{flexShrink: 0}}
          >
            <Plus size={20} /> <span className="hidden sm:inline">Nueva Inscripción</span>
          </button>
        );
      case 'instructores':
        return (
          <button 
            onClick={openCreateInstructorModal} 
            className="cursos-btn cursos-btn-primary"
            style={{flexShrink: 0}}
          >
            <Plus size={20} /> <span className="hidden sm:inline">Nuevo Instructor</span>
          </button>
        );
      case 'instructor-grupo':
        return (
          <button 
            onClick={openCreateInstructorGrupoModal} 
            className="cursos-btn cursos-btn-primary"
            style={{flexShrink: 0}}
          >
            <Plus size={20} /> <span className="hidden sm:inline">Nueva Asignación</span>
          </button>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="cursos-container">
      <Sidebar />
      
      <div className="cursos-content">
        <Topbar />
        
        {/* HEADER */}
        <div className="cursos-header">
          <div style={{flex: 1, minWidth: 0}}>
            <h1 className="cursos-title">
              {renderHeader().icon}
              {renderHeader().title}
            </h1>
            <p className="cursos-subtitle">
              {renderHeader().subtitle}
            </p>
          </div>
          
          <div className="cursos-header-actions">
            <button 
              onClick={() => {
                if (activeTab === 'inscripciones') loadInscripciones();
                else if (activeTab === 'instructores') loadInstructores();
                else loadInstructorGrupos();
              }} 
              className="cursos-btn cursos-btn-secondary"
              disabled={loading}
              title="Actualizar lista"
            >
              <RefreshCw size={20} /> <span className="hidden sm:inline">Actualizar</span>
            </button>
            {renderCreateButton()}
          </div>
        </div>
        
        {/* PESTAÑAS */}
        <div className="cursos-tabs">
          <button
            className={`cursos-tab ${activeTab === 'inscripciones' ? 'active' : ''}`}
            onClick={() => setActiveTab('inscripciones')}
          >
            <Book size={18} />
            <span>Inscripciones</span>
          </button>
          <button
            className={`cursos-tab ${activeTab === 'instructores' ? 'active' : ''}`}
            onClick={() => setActiveTab('instructores')}
          >
            <GraduationCap size={18} />
            <span>Instructores</span>
          </button>
          <button
            className={`cursos-tab ${activeTab === 'instructor-grupo' ? 'active' : ''}`}
            onClick={() => setActiveTab('instructor-grupo')}
          >
            <UsersGroup size={18} />
            <span>Instructor-Grupo</span>
          </button>
        </div>
        
        {/* ESTADÍSTICAS */}
        {renderStats()}
        
        {/* BARRA DE HERRAMIENTAS */}
        <div className="cursos-toolbar">
          <div className="cursos-toolbar-row">
            <div className="cursos-search-container">
              <div className="cursos-search">
                <Search className="cursos-search-icon" size={18} />
                <input
                  type="text"
                  value={
                    activeTab === 'inscripciones' ? inscripcionSearch :
                    activeTab === 'instructores' ? instructorSearch :
                    ''
                  }
                  onChange={(e) => {
                    if (activeTab === 'inscripciones') setInscripcionSearch(e.target.value);
                    else if (activeTab === 'instructores') setInstructorSearch(e.target.value);
                  }}
                  className="cursos-search-input"
                  placeholder={
                    activeTab === 'inscripciones' ? "Buscar por deportista o curso..." :
                    activeTab === 'instructores' ? "Buscar por nombre o especialidad..." :
                    "Buscar..."
                  }
                  disabled={loading}
                />
              </div>
            </div>
            
            {renderSearchFilters()}
          </div>
        </div>
        
        {/* CONTENIDO PRINCIPAL */}
        {renderTable()}
        
        {/* MODALES PARA INSCRIPCIONES */}
        {showInscripcionModal && (
          <div className="cursos-modal-overlay">
            <div className="cursos-modal cursos-modal-lg">
              <div className="cursos-modal-header">
                <h2 className="cursos-modal-title">
                  <Book size={22} />
                  {inscripcionMode === 'create' ? 'Nueva Inscripción' : 'Editar Inscripción'}
                </h2>
                <button onClick={closeInscripcionModal} className="cursos-modal-close">
                  <X size={22} />
                </button>
              </div>
              
              <div className="cursos-modal-content">
                <div className="cursos-form-grid">
                  <div className="cursos-form-group">
                    <label className="cursos-form-label">
                      <Book size={16} />
                      Curso *
                    </label>
                    <select
                      value={inscripcionForm.id_curso}
                      onChange={(e) => setInscripcionForm({...inscripcionForm, id_curso: e.target.value})}
                      className="cursos-form-select"
                    >
                      <option value="">-- Selecciona un curso --</option>
                      {Array.isArray(cursos) && cursos.map(curso => (
                        <option key={curso.id_curso} value={curso.id_curso}>
                          {curso.nombre} ({curso.codigo})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="cursos-form-group">
                    <label className="cursos-form-label">
                      <GroupIcon size={16} />
                      Grupo *
                    </label>
                    <select
                      value={inscripcionForm.id_grupo}
                      onChange={(e) => setInscripcionForm({...inscripcionForm, id_grupo: e.target.value})}
                      className="cursos-form-select"
                    >
                      <option value="">-- Selecciona un grupo --</option>
                      {Array.isArray(grupos) && grupos.map(grupo => (
                        <option key={grupo.id_grupo} value={grupo.id_grupo}>
                          {grupo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="cursos-form-group">
                    <label className="cursos-form-label">
                      <User size={16} />
                      Tutor *
                    </label>
                    <select
                      value={inscripcionForm.id_usuario}
                      onChange={(e) => setInscripcionForm({...inscripcionForm, id_usuario: e.target.value})}
                      className="cursos-form-select"
                    >
                      <option value="">-- Selecciona un tutor --</option>
                      {Array.isArray(usuarios) && usuarios.map(usuario => (
                        <option key={usuario.id_usuario} value={usuario.id_usuario}>
                          {usuario.nombre} {usuario.apellido}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="cursos-form-group">
                    <label className="cursos-form-label">
                      <User size={16} />
                      Deportista *
                    </label>
                    <select
                      value={inscripcionForm.id_deportista}
                      onChange={(e) => setInscripcionForm({...inscripcionForm, id_deportista: e.target.value})}
                      className="cursos-form-select"
                    >
                      <option value="">-- Selecciona un deportista --</option>
                      {Array.isArray(deportistas) && deportistas.map(dep => (
                        <option key={dep.id_deportista} value={dep.id_deportista}>
                          {dep.nombres} {dep.apellidos} - {dep.numero_documento}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="cursos-form-group">
                    <label className="cursos-form-label">
                      <Calendar size={16} />
                      Fecha Inscripción *
                    </label>
                    <input
                      type="date"
                      value={inscripcionForm.fecha_inscripcion}
                      onChange={(e) => setInscripcionForm({...inscripcionForm, fecha_inscripcion: e.target.value})}
                      className="cursos-form-input"
                    />
                  </div>
                  
                  <div className="cursos-form-group">
                    <label className="cursos-form-label">
                      <Shield size={16} />
                      Estado *
                    </label>
                    <select
                      value={inscripcionForm.estado}
                      onChange={(e) => setInscripcionForm({...inscripcionForm, estado: e.target.value})}
                      className="cursos-form-select"
                    >
                      <option value="activa">Activa</option>
                      <option value="completada">Completada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                  
                  <div className="cursos-form-group col-span-2">
                    <label className="cursos-form-label">
                      <FileText size={16} />
                      Observaciones
                    </label>
                    <textarea
                      value={inscripcionForm.observaciones}
                      onChange={(e) => setInscripcionForm({...inscripcionForm, observaciones: e.target.value})}
                      className="cursos-form-textarea"
                      rows="3"
                      placeholder="Observaciones adicionales..."
                    />
                  </div>
                  
                  {inscripcionMode === 'edit' && (
                    <>
                      <div className="cursos-form-group">
                        <label className="cursos-form-label">
                          <Star size={16} />
                          Calificación
                        </label>
                        <input
                          type="number"
                          value={inscripcionForm.calificacion}
                          onChange={(e) => setInscripcionForm({...inscripcionForm, calificacion: e.target.value})}
                          className="cursos-form-input"
                          placeholder="0-100"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                      
                      <div className="cursos-form-group">
                        <label className="cursos-form-label">
                          <FileText size={16} />
                          Comentarios
                        </label>
                        <textarea
                          value={inscripcionForm.comentarios}
                          onChange={(e) => setInscripcionForm({...inscripcionForm, comentarios: e.target.value})}
                          className="cursos-form-textarea"
                          rows="2"
                          placeholder="Comentarios sobre el desempeño..."
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="cursos-modal-footer">
                <button onClick={closeInscripcionModal} className="cursos-btn cursos-btn-secondary">
                  <X size={18} /> Cancelar
                </button>
                <button 
                  onClick={inscripcionMode === 'create' ? createInscripcion : updateInscripcion} 
                  className="cursos-btn cursos-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Guardando...
                    </>
                  ) : inscripcionMode === 'create' ? (
                    <>
                      <Plus size={18} /> Crear Inscripción
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
        
        {/* MODALES PARA INSTRUCTORES */}
        {showInstructorModal && (
          <div className="cursos-modal-overlay">
            <div className="cursos-modal">
              <div className="cursos-modal-header">
                <h2 className="cursos-modal-title">
                  <GraduationCap size={22} />
                  {instructorMode === 'create' ? 'Nuevo Instructor' : 'Editar Instructor'}
                </h2>
                <button onClick={closeInstructorModal} className="cursos-modal-close">
                  <X size={22} />
                </button>
              </div>
              
              <div className="cursos-modal-content">
                <div className="cursos-form-grid">
                  <div className="cursos-form-group">
                    <label className="cursos-form-label">
                      <User size={16} />
                      Usuario *
                    </label>
                    <select
                      value={instructorForm.id_usuario}
                      onChange={(e) => setInstructorForm({...instructorForm, id_usuario: e.target.value})}
                      className="cursos-form-select"
                    >
                      <option value="">-- Selecciona un usuario --</option>
                      {Array.isArray(usuarios) && usuarios.map(usuario => (
                        <option key={usuario.id_usuario} value={usuario.id_usuario}>
                          {usuario.nombre} {usuario.apellido} - {usuario.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="cursos-form-group">
                    <label className="cursos-form-label">
                      <AwardIcon size={16} />
                      Especialidad *
                    </label>
                    <input
                      type="text"
                      value={instructorForm.especialidad}
                      onChange={(e) => setInstructorForm({...instructorForm, especialidad: e.target.value})}
                      className="cursos-form-input"
                      placeholder="Ej: Fútbol, Natación, Atletismo..."
                    />
                  </div>
                  
                  <div className="cursos-form-group">
                    <label className="cursos-form-label">
                      <Certificate size={16} />
                      Certificaciones
                    </label>
                    <textarea
                      value={instructorForm.certificaciones}
                      onChange={(e) => setInstructorForm({...instructorForm, certificaciones: e.target.value})}
                      className="cursos-form-textarea"
                      rows="3"
                      placeholder="Lista de certificaciones separadas por coma..."
                    />
                  </div>
                  
                  <div className="cursos-form-group">
                    <label className="cursos-form-label">
                      <Shield size={16} />
                      Estado
                    </label>
                    <select
                      value={instructorForm.activo}
                      onChange={(e) => setInstructorForm({...instructorForm, activo: e.target.value === 'true'})}
                      className="cursos-form-select"
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="cursos-modal-footer">
                <button onClick={closeInstructorModal} className="cursos-btn cursos-btn-secondary">
                  <X size={18} /> Cancelar
                </button>
                <button 
                  onClick={instructorMode === 'create' ? createInstructor : updateInstructor} 
                  className="cursos-btn cursos-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Guardando...
                    </>
                  ) : instructorMode === 'create' ? (
                    <>
                      <Plus size={18} /> Crear Instructor
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
        
        {/* MODALES PARA INSTRUCTOR-GRUPO */}
        {showInstructorGrupoModal && (
          <div className="cursos-modal-overlay">
            <div className="cursos-modal">
              <div className="cursos-modal-header">
                <h2 className="cursos-modal-title">
                  <UsersGroup size={22} />
                  Nueva Asignación Instructor-Grupo
                </h2>
                <button onClick={closeInstructorGrupoModal} className="cursos-modal-close">
                  <X size={22} />
                </button>
              </div>
              
              <div className="cursos-modal-content">
                <div className="cursos-form-grid">
                  <div className="cursos-form-group">
                    <label className="cursos-form-label">
                      <GraduationCap size={16} />
                      Instructor *
                    </label>
                    <select
                      value={instructorGrupoForm.id_instructor}
                      onChange={(e) => setInstructorGrupoForm({...instructorGrupoForm, id_instructor: e.target.value})}
                      className="cursos-form-select"
                    >
                      <option value="">-- Selecciona un instructor --</option>
                      {Array.isArray(instructores) && instructores.map(instructor => (
                        <option key={instructor.id_instructor} value={instructor.id_instructor}>
                          {instructor.usuario?.nombre} {instructor.usuario?.apellido} - {instructor.especialidad}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="cursos-form-group">
                    <label className="cursos-form-label">
                      <GroupIcon size={16} />
                      Grupo *
                    </label>
                    <select
                      value={instructorGrupoForm.id_grupo}
                      onChange={(e) => setInstructorGrupoForm({...instructorGrupoForm, id_grupo: e.target.value})}
                      className="cursos-form-select"
                    >
                      <option value="">-- Selecciona un grupo --</option>
                      {Array.isArray(grupos) && grupos.map(grupo => (
                        <option key={grupo.id_grupo} value={grupo.id_grupo}>
                          {grupo.nombre} - {grupo.curso?.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="cursos-form-group col-span-2">
                    <label className="cursos-form-label">
                      <UserCog size={16} />
                      <span>
                        <input
                          type="checkbox"
                          checked={instructorGrupoForm.coordinador}
                          onChange={(e) => setInstructorGrupoForm({...instructorGrupoForm, coordinador: e.target.checked})}
                          className="cursos-checkbox"
                          style={{marginRight: '8px'}}
                        />
                        Es coordinador del grupo
                      </span>
                    </label>
                    <p className="cursos-form-hint">
                      El coordinador es el instructor principal responsable del grupo.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="cursos-modal-footer">
                <button onClick={closeInstructorGrupoModal} className="cursos-btn cursos-btn-secondary">
                  <X size={18} /> Cancelar
                </button>
                <button 
                  onClick={createInstructorGrupo} 
                  className="cursos-btn cursos-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Asignando...
                    </>
                  ) : (
                    <>
                      <Plus size={18} /> Asignar Instructor
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* MODALES DE ELIMINACIÓN (COMUNES) */}
        {showInscripcionDeleteModal && selectedInscripcion && (
          <DeleteModal
            title="Eliminar Inscripción"
            message={`¿Estás seguro de eliminar la inscripción de ${selectedInscripcion.deportista?.nombres} ${selectedInscripcion.deportista?.apellidos} al curso ${selectedInscripcion.curso?.nombre}?`}
            onCancel={closeInscripcionDeleteModal}
            onConfirm={() => deleteInscripcion(selectedInscripcion.id_inscripcion)}
            loading={loading}
          />
        )}
        
        {showInstructorDeleteModal && selectedInstructor && (
          <DeleteModal
            title="Eliminar Instructor"
            message={`¿Estás seguro de eliminar al instructor ${selectedInstructor.usuario?.nombre} ${selectedInstructor.usuario?.apellido}?`}
            onCancel={closeInstructorDeleteModal}
            onConfirm={() => deleteInstructor(selectedInstructor.id_instructor)}
            loading={loading}
          />
        )}
        
        {showInstructorGrupoDeleteModal && selectedInstructorGrupo && (
          <DeleteModal
            title="Eliminar Asignación"
            message="¿Estás seguro de eliminar esta asignación instructor-grupo?"
            onCancel={closeInstructorGrupoDeleteModal}
            onConfirm={() => deleteInstructorGrupo(selectedInstructorGrupo.id || selectedInstructorGrupo.pivot?.id)}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

// Componente de modal de eliminación reutilizable
const DeleteModal = ({ title, message, onCancel, onConfirm, loading }) => (
  <div className="cursos-modal-overlay">
    <div className="cursos-modal cursos-modal-sm">
      <div className="cursos-modal-header">
        <h2 className="cursos-modal-title">
          <AlertTriangle size={22} />
          {title}
        </h2>
        <button onClick={onCancel} className="cursos-modal-close">
          <X size={22} />
        </button>
      </div>
      
      <div className="cursos-modal-content">
        <div className="cursos-delete-content">
          <AlertTriangle size={48} className="cursos-delete-icon" />
          <h3 className="cursos-delete-title">Confirmar Eliminación</h3>
          <p className="cursos-delete-message">{message}</p>
          <p className="cursos-delete-warning">⚠️ Esta acción no se puede deshacer.</p>
        </div>
      </div>
      
      <div className="cursos-modal-footer">
        <button onClick={onCancel} className="cursos-btn cursos-btn-secondary">
          <X size={18} /> Cancelar
        </button>
        <button 
          onClick={onConfirm} 
          className="cursos-btn cursos-btn-danger"
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
);

export default Instructores;