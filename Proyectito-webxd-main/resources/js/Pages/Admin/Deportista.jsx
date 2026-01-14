import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, X, Filter, Search, RefreshCw, 
  Eye, ChevronLeft, ChevronRight, AlertTriangle, 
  CheckCircle, XCircle, Users, Trophy, Calendar, 
  Download, Upload, MoreVertical, CheckSquare, Square,
  ArrowUpDown, BarChart3, Home, Mail, Phone, MapPin,
  User, Shield, Clock, Activity, TrendingUp, TrendingDown,
  Image, Upload as UploadIcon, Facebook, Twitter, Instagram,
  Globe, UserPlus, Users as UsersIcon, Award, Target,
  Heart, Ruler, Scale, Footprints, Shirt, FileText,
  Stethoscope, UserCheck, Smartphone, Briefcase, BookOpen,
  Award as AwardIcon, Star, Target as TargetIcon, Zap,
  Check, X as XIcon, Edit, ExternalLink, Copy, Filter as FilterIcon,
  Users as GroupIcon, PersonStanding, Dumbbell, CalendarDays,
  Clock as ClockIcon, TrendingUp as TrendingUpIcon, AlertOctagon,
  ClipboardList, CreditCard, Building, Flag, Coffee
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/deportista.css';

const API_DEPORTISTAS = 'http://127.0.0.1:8000/api/deportistas';
const API_CATEGORIAS = 'http://127.0.0.1:8000/api/categorias';
const API_USUARIOS = 'http://127.0.0.1:8000/api/usuarios';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  console.log('🔑 Token encontrado en localStorage:', token ? 'SÍ' : 'NO');
  
  if (!token) {
    console.log('❌ No hay token, redirigiendo a login');
    window.location.href = '/login';
    return {};
  }
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const Deportista = () => {
  // Estados principales
  const [deportistas, setDeportistas] = useState([]);
  const [filteredDeportistas, setFilteredDeportistas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
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
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [generoFilter, setGeneroFilter] = useState('all');
  const [categoriaFilter, setCategoriaFilter] = useState('all');
  const [sortBy, setSortBy] = useState('apellidos');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage] = useState(15);
  
  // Selección masiva
  const [selectedDeportistas, setSelectedDeportistas] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Formulario
  const [form, setForm] = useState({
    id_usuario: '',
    id_categoria: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    genero: 'masculino',
    tipo_documento: 'DNI',
    numero_documento: '',
    foto: null,
    direccion: '',
    correo: '',
    telefono: '',
    altura: '',
    peso: '',
    pie_habil: '',
    numero_camiseta: '',
    estado: 'activo',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    contacto_emergencia_relacion: ''
  });

  // Foto preview
  const [fotoPreview, setFotoPreview] = useState(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  // Obtener ID del deportista
  const getDeportistaId = (deportista) => {
    return deportista.id_deportista || deportista.id || 0;
  };

  // Cargar deportistas - VERSIÓN CORREGIDA
  const loadDeportistas = async (page = 1, estado = '', search = '', genero = '', categoria = '') => {
    console.log('🔄 Cargando deportistas...');
    console.log('📝 Parámetros:', { page, estado, search, genero, categoria });
    
    setLoading(true);
    setError(null);
    try {
      let url = `${API_DEPORTISTAS}?page=${page}`;
      
      if (estado && estado !== 'all') {
        url += `&estado=${estado}`;
      }
      
      if (genero && genero !== 'all') {
        url += `&genero=${genero}`;
      }
      
      if (categoria && categoria !== 'all') {
        url += `&id_categoria=${categoria}`;
      }
      
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      console.log('🌐 URL de la petición:', url);
      
      const headers = authHeaders();
      console.log('📨 Headers de autenticación:', headers);
      
      const res = await fetch(url, { headers });
      
      console.log('📊 Respuesta HTTP:', res.status, res.statusText);
      
      if (!res.ok) {
        console.error('❌ Error en la respuesta:', res.status, res.statusText);
        throw new Error(`Error al cargar deportistas: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('✅ Datos de deportistas recibidos (completo):', data);
      console.log('📋 Tipo de datos:', typeof data);
      console.log('🔢 Es array?', Array.isArray(data));
      console.log('📦 Tiene propiedad data?', data.data !== undefined);
      
      if (data.data) {
        console.log('📊 Tipo de data.data:', typeof data.data);
        console.log('🔢 data.data es array?', Array.isArray(data.data));
      }
      
      // Manejar respuesta paginada de Laravel - VERSIÓN CORREGIDA
      let deportistasData = [];
      let paginationData = {};
      
      if (data.data && typeof data.data === 'object') {
        // Caso 1: data.data es un objeto con propiedad 'data' (paginación Laravel)
        if (data.data.data && Array.isArray(data.data.data)) {
          console.log('📄 Caso 1: data.data tiene propiedad data (array)');
          deportistasData = data.data.data;
          paginationData = {
            currentPage: data.data.current_page || page,
            totalPages: data.data.last_page || 1,
            totalItems: data.data.total || data.data.data.length,
            perPage: data.data.per_page || perPage
          };
        }
        // Caso 2: data.data es directamente un array
        else if (Array.isArray(data.data)) {
          console.log('📄 Caso 2: data.data es directamente array');
          deportistasData = data.data;
          paginationData = {
            currentPage: data.current_page || page,
            totalPages: data.last_page || 1,
            totalItems: data.total || data.data.length,
            perPage: data.per_page || perPage
          };
        }
        // Caso 3: data.data es un objeto pero no tiene la estructura esperada
        else {
          console.log('⚠️ Caso 3: data.data es objeto pero no tiene estructura clara');
          console.log('📦 Estructura de data.data:', data.data);
          
          // Buscar cualquier propiedad que sea array y pueda contener deportistas
          const arrayProperties = Object.entries(data.data)
            .filter(([key, value]) => Array.isArray(value))
            .map(([key, value]) => ({ key, value }));
          
          console.log('🔍 Propiedades array encontradas:', arrayProperties);
          
          if (arrayProperties.length > 0) {
            // Usar el primer array encontrado (generalmente es el de deportistas)
            deportistasData = arrayProperties[0].value;
            console.log(`✅ Usando array de propiedad "${arrayProperties[0].key}" con ${deportistasData.length} elementos`);
          } else {
            console.error('❌ No se encontraron arrays en data.data');
          }
          
          paginationData = {
            currentPage: data.current_page || page,
            totalPages: data.last_page || 1,
            totalItems: data.total || deportistasData.length,
            perPage: data.per_page || perPage
          };
        }
      } else if (Array.isArray(data)) {
        // Caso 4: La respuesta es directamente un array
        console.log('📄 Caso 4: Respuesta es directamente array');
        deportistasData = data;
        paginationData = {
          currentPage: 1,
          totalPages: Math.ceil(data.length / perPage),
          totalItems: data.length,
          perPage: perPage
        };
      } else {
        console.error('❌ Formato de respuesta no reconocido');
        console.error('📦 Estructura completa:', data);
        setError('Formato de datos incorrecto del servidor');
        return;
      }
      
      // Verificar que deportistasData es un array válido
      if (!Array.isArray(deportistasData)) {
        console.error('❌ deportistasData no es un array:', deportistasData);
        setError('Error procesando los datos de deportistas');
        return;
      }
      
      console.log('👥 Deportistas cargados:', deportistasData.length);
      if (deportistasData.length > 0) {
        console.log('📝 Primer deportista:', deportistasData[0]);
        console.log('🔍 Tipo del primer elemento:', typeof deportistasData[0]);
      }
      
      console.log('📊 Datos de paginación:', paginationData);
      
      setDeportistas(deportistasData);
      setFilteredDeportistas(deportistasData);
      setCurrentPage(paginationData.currentPage);
      setTotalPages(paginationData.totalPages);
      setTotalItems(paginationData.totalItems);
      
    } catch (error) {
      console.error('❌ Error en loadDeportistas:', error);
      console.error('🔍 Stack trace:', error.stack);
      setError(`Error al cargar los deportistas: ${error.message}`);
    } finally {
      console.log('🏁 Finalizando carga, setting loading false');
      setLoading(false);
    }
  };

  // Cargar datos auxiliares - VERSIÓN CORREGIDA
  const loadData = async () => {
    console.log('🔄 Cargando datos auxiliares...');
    try {
      // Cargar categorías
      console.log('📦 Cargando categorías desde:', API_CATEGORIAS);
      const catRes = await fetch(API_CATEGORIAS, { headers: authHeaders() });
      console.log('📊 Respuesta categorías:', catRes.status, catRes.statusText);
      
      if (catRes.ok) {
        const catData = await catRes.json();
        console.log('✅ Categorías recibidas:', catData);
        
        // Extraer array de categorías
        let categoriasArray = [];
        if (catData.data && Array.isArray(catData.data)) {
          categoriasArray = catData.data;
        } else if (Array.isArray(catData)) {
          categoriasArray = catData;
        } else if (catData.data && typeof catData.data === 'object' && catData.data.data && Array.isArray(catData.data.data)) {
          categoriasArray = catData.data.data;
        }
        
        console.log('🏷️ Categorías procesadas:', categoriasArray.length);
        if (categoriasArray.length > 0) {
          console.log('📝 Primera categoría:', categoriasArray[0]);
        }
        setCategorias(categoriasArray);
      } else {
        console.error('❌ Error cargando categorías:', catRes.status);
      }

      // Cargar usuarios
      console.log('👥 Cargando usuarios desde:', `${API_USUARIOS}?activos=true`);
      const userRes = await fetch(`${API_USUARIOS}?activos=true`, { headers: authHeaders() });
      console.log('📊 Respuesta usuarios:', userRes.status, userRes.statusText);
      
      if (userRes.ok) {
        const userData = await userRes.json();
        console.log('✅ Usuarios recibidos:', userData);
        
        // Extraer array de usuarios
        let usuariosArray = [];
        if (userData.data && Array.isArray(userData.data)) {
          usuariosArray = userData.data;
        } else if (Array.isArray(userData)) {
          usuariosArray = userData;
        } else if (userData.data && typeof userData.data === 'object' && userData.data.data && Array.isArray(userData.data.data)) {
          usuariosArray = userData.data.data;
        }
        
        console.log('👤 Usuarios procesados:', usuariosArray.length);
        if (usuariosArray.length > 0) {
          console.log('📝 Primer usuario:', usuariosArray[0]);
        }
        setUsuarios(usuariosArray);
      } else {
        console.error('❌ Error cargando usuarios:', userRes.status);
      }
    } catch (error) {
      console.error('❌ Error cargando datos auxiliares:', error);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    console.log('🚀 Componente montado, cargando datos iniciales');
    loadDeportistas();
    loadData();
  }, []);

  // Aplicar filtros y búsqueda en el cliente
  useEffect(() => {
    console.log('🔍 Aplicando filtros en cliente...');
    console.log('📊 Deportistas antes de filtrar:', deportistas.length);
    console.log('🎯 Filtros:', { searchTerm, estadoFilter, generoFilter, categoriaFilter, sortBy, sortOrder });
    
    // Filtrar solo objetos válidos (evitar null/undefined)
    let filtered = deportistas.filter(dep => dep && typeof dep === 'object');
    console.log('🔢 Deportistas válidos para filtrar:', filtered.length);

    // Filtro por estado
    if (estadoFilter !== 'all') {
      filtered = filtered.filter(dep => dep.estado === estadoFilter);
      console.log(`📊 Después de filtrar por estado "${estadoFilter}":`, filtered.length);
    }

    // Filtro por género
    if (generoFilter !== 'all') {
      filtered = filtered.filter(dep => dep.genero === generoFilter);
      console.log(`📊 Después de filtrar por género "${generoFilter}":`, filtered.length);
    }

    // Filtro por categoría
    if (categoriaFilter !== 'all') {
      filtered = filtered.filter(dep => dep.id_categoria == categoriaFilter);
      console.log(`📊 Después de filtrar por categoría "${categoriaFilter}":`, filtered.length);
    }

    // Búsqueda por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(dep =>
        (dep.nombres && dep.nombres.toLowerCase().includes(term)) ||
        (dep.apellidos && dep.apellidos.toLowerCase().includes(term)) ||
        (dep.numero_documento && dep.numero_documento.toLowerCase().includes(term)) ||
        (dep.correo && dep.correo.toLowerCase().includes(term))
      );
      console.log(`📊 Después de buscar "${searchTerm}":`, filtered.length);
    }

    // Ordenación
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      if (sortBy === 'edad') {
        aValue = calcularEdad(a.fecha_nacimiento);
        bValue = calcularEdad(b.fecha_nacimiento);
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      return sortOrder === 'asc' ? 
        (aValue < bValue ? -1 : 1) : 
        (bValue < aValue ? -1 : 1);
    });

    console.log('✅ Deportistas después de todos los filtros:', filtered.length);
    setFilteredDeportistas(filtered);
    setCurrentPage(1);
    setTotalPages(Math.ceil(filtered.length / perPage));
    setSelectedDeportistas([]);
    setSelectAll(false);
  }, [deportistas, searchTerm, estadoFilter, generoFilter, categoriaFilter, sortBy, sortOrder]);

  // Calcular edad con manejo de errores
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) {
      return 0;
    }
    try {
      const hoy = new Date();
      const nacimiento = new Date(fechaNacimiento);
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mes = hoy.getMonth() - nacimiento.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      return edad;
    } catch (error) {
      console.error('❌ Error calculando edad:', error);
      return 0;
    }
  };

  // Calcular IMC con manejo de errores
  const calcularIMC = (peso, altura) => {
    if (!peso || !altura || altura === 0 || isNaN(peso) || isNaN(altura)) {
      return null;
    }
    try {
      const imc = (parseFloat(peso) / (parseFloat(altura) * parseFloat(altura))).toFixed(2);
      return imc;
    } catch (error) {
      console.error('❌ Error calculando IMC:', error);
      return null;
    }
  };

  // Datos paginados para mostrar
  const paginatedDeportistas = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginated = filteredDeportistas.slice(startIndex, endIndex);
    
    console.log('📄 Deportistas paginados:', {
      total: filteredDeportistas.length,
      perPage,
      currentPage,
      startIndex,
      endIndex,
      paginatedCount: paginated.length
    });
    
    return paginated;
  }, [filteredDeportistas, currentPage, perPage]);

  // Estadísticas con manejo de errores
  const stats = useMemo(() => {
    console.log('📊 Calculando estadísticas...');
    
    // Filtrar solo deportistas válidos
    const deportistasValidos = deportistas.filter(dep => dep && typeof dep === 'object');
    
    const total = deportistasValidos.length;
    const activos = deportistasValidos.filter(d => d.estado === 'activo').length;
    const lesionados = deportistasValidos.filter(d => d.estado === 'lesionado').length;
    const suspendidos = deportistasValidos.filter(d => d.estado === 'suspendido').length;
    const retirados = deportistasValidos.filter(d => d.estado === 'retirado').length;
    
    const masculinos = deportistasValidos.filter(d => d.genero === 'masculino').length;
    const femeninos = deportistasValidos.filter(d => d.genero === 'femenino').length;
    
    // Edad promedio
    const edades = deportistasValidos.map(d => calcularEdad(d.fecha_nacimiento)).filter(edad => edad > 0);
    const edadPromedio = edades.length > 0 ? (edades.reduce((a, b) => a + b, 0) / edades.length).toFixed(1) : 0;
    
    // IMC promedio
    const imcs = deportistasValidos.map(d => calcularIMC(d.peso, d.altura)).filter(imc => imc !== null);
    const imcPromedio = imcs.length > 0 ? (imcs.reduce((a, b) => a + parseFloat(b), 0) / imcs.length).toFixed(2) : 0;
    
    console.log('📈 Estadísticas calculadas:', {
      total, 
      activos, 
      lesionados, 
      suspendidos,
      retirados,
      masculinos,
      femeninos,
      edadPromedio,
      imcPromedio
    });
    
    return { 
      total, 
      activos, 
      lesionados, 
      suspendidos,
      retirados,
      masculinos,
      femeninos,
      edadPromedio,
      imcPromedio
    };
  }, [deportistas]);

  // CRUD Operations
  const createDeportista = async () => {
    console.log('➕ Creando deportista...');
    console.log('📋 Datos del formulario:', form);
    
    if (!validateForm()) return;
    
    try {
      const formData = new FormData();
      
      // Agregar campos del formulario
      Object.keys(form).forEach(key => {
        if (key === 'foto' && form.foto instanceof File) {
          formData.append(key, form.foto);
        } else if (form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });
      
      const headers = authHeaders();
      delete headers['Content-Type'];
      console.log('📨 Headers para crear deportista:', headers);
      
      const res = await fetch(API_DEPORTISTAS, {
        method: 'POST',
        headers,
        body: formData
      });

      const responseData = await res.json();
      console.log('📊 Respuesta creación deportista:', responseData);
      
      if (res.ok) {
        console.log('✅ Deportista creado exitosamente');
        closeModal();
        await loadDeportistas();
        alert('✅ Deportista creado exitosamente');
      } else {
        console.error('❌ Error creación deportista:', responseData);
        handleApiError(responseData);
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  const updateDeportista = async () => {
    console.log('✏️ Actualizando deportista...');
    console.log('📋 Datos del formulario:', form);
    
    if (!validateForm() || !selected) return;
    
    try {
      const formData = new FormData();
      
      // Agregar campos del formulario
      Object.keys(form).forEach(key => {
        if (key === 'foto' && form.foto instanceof File) {
          formData.append(key, form.foto);
        } else if (form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });
      
      // Método PUT para Laravel
      formData.append('_method', 'PUT');
      
      const headers = authHeaders();
      delete headers['Content-Type'];
      console.log('📨 Headers para actualizar deportista:', headers);
      
      const res = await fetch(`${API_DEPORTISTAS}/${getDeportistaId(selected)}`, {
        method: 'POST',
        headers,
        body: formData
      });

      const responseData = await res.json();
      console.log('📊 Respuesta actualización deportista:', responseData);

      if (res.ok) {
        console.log('✅ Deportista actualizado exitosamente');
        closeModal();
        await loadDeportistas();
        alert('✅ Deportista actualizado exitosamente');
      } else {
        console.error('❌ Error actualización deportista:', responseData);
        handleApiError(responseData);
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  const deleteDeportista = async (id) => {
    console.log('🗑️ Eliminando deportista ID:', id);
    
    if (!id) return;
    
    try {
      const res = await fetch(`${API_DEPORTISTAS}/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (res.ok) {
        console.log('✅ Deportista eliminado exitosamente');
        closeDeleteModal();
        await loadDeportistas();
        alert('✅ Deportista eliminado exitosamente');
      } else {
        const error = await res.json();
        console.error('❌ Error eliminación deportista:', error);
        alert(`❌ ${error.message || 'Error al eliminar deportista'}`);
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  const cambiarEstado = async (id, estado) => {
    console.log('🔄 Cambiando estado deportista:', { id, estado });
    
    try {
      const res = await fetch(`${API_DEPORTISTAS}/${id}/cambiar-estado`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ estado })
      });

      if (res.ok) {
        console.log('✅ Estado cambiado exitosamente');
        await loadDeportistas();
        alert(`✅ Estado cambiado a "${estado}" exitosamente`);
      } else {
        const error = await res.json();
        console.error('❌ Error cambiando estado:', error);
        alert(`❌ ${error.message || 'Error al cambiar estado'}`);
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      alert('❌ Error de conexión con el servidor');
    }
  };

  // Validación
  const validateForm = () => {
    console.log('🔍 Validando formulario...');
    const newErrors = {};
    
    if (!form.id_usuario) newErrors.id_usuario = 'El usuario es requerido';
    if (!form.nombres.trim()) newErrors.nombres = 'Los nombres son requeridos';
    if (!form.apellidos.trim()) newErrors.apellidos = 'Los apellidos son requeridos';
    if (!form.fecha_nacimiento) newErrors.fecha_nacimiento = 'La fecha de nacimiento es requerida';
    if (!form.tipo_documento) newErrors.tipo_documento = 'El tipo de documento es requerido';
    if (!form.numero_documento.trim()) newErrors.numero_documento = 'El número de documento es requerido';
    if (form.correo && !/\S+@\S+\.\S+/.test(form.correo)) newErrors.correo = 'Email inválido';
    
    console.log('📋 Errores de validación:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApiError = (responseData) => {
    console.log('⚠️ Manejo de error de API:', responseData);
    
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

  // Foto handling
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    console.log('📸 Archivo seleccionado:', file);
    
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        console.log('❌ Archivo demasiado grande:', file.size);
        alert('La foto no debe pesar más de 2MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        console.log('❌ Tipo de archivo no válido:', file.type);
        alert('Por favor, selecciona una imagen válida');
        return;
      }
      
      setForm({...form, foto: file});
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('🖼️ Preview creado');
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Modal functions
  const openCreateModal = () => {
    console.log('📝 Abriendo modal de creación');
    setMode('create');
    const fechaHoy = new Date().toISOString().split('T')[0];
    const fecha18Anios = new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0];
    
    setForm({
      id_usuario: '',
      id_categoria: '',
      nombres: '',
      apellidos: '',
      fecha_nacimiento: fecha18Anios,
      genero: 'masculino',
      tipo_documento: 'DNI',
      numero_documento: '',
      foto: null,
      direccion: '',
      correo: '',
      telefono: '',
      altura: '',
      peso: '',
      pie_habil: '',
      numero_camiseta: '',
      estado: 'activo',
      contacto_emergencia_nombre: '',
      contacto_emergencia_telefono: '',
      contacto_emergencia_relacion: ''
    });
    setFotoPreview(null);
    setErrors({});
    setSelected(null);
    setShowModal(true);
  };

  const openEditModal = (deportista) => {
    console.log('✏️ Abriendo modal de edición:', deportista);
    setMode('edit');
    setSelected(deportista);
    setForm({ 
      id_usuario: deportista.id_usuario || '',
      id_categoria: deportista.id_categoria || '',
      nombres: deportista.nombres || '',
      apellidos: deportista.apellidos || '',
      fecha_nacimiento: deportista.fecha_nacimiento ? deportista.fecha_nacimiento.split('T')[0] : '',
      genero: deportista.genero || 'masculino',
      tipo_documento: deportista.tipo_documento || 'DNI',
      numero_documento: deportista.numero_documento || '',
      foto: null,
      direccion: deportista.direccion || '',
      correo: deportista.correo || '',
      telefono: deportista.telefono || '',
      altura: deportista.altura || '',
      peso: deportista.peso || '',
      pie_habil: deportista.pie_habil || '',
      numero_camiseta: deportista.numero_camiseta || '',
      estado: deportista.estado || 'activo',
      contacto_emergencia_nombre: deportista.contacto_emergencia_nombre || '',
      contacto_emergencia_telefono: deportista.contacto_emergencia_telefono || '',
      contacto_emergencia_relacion: deportista.contacto_emergencia_relacion || ''
    });
    setFotoPreview(deportista.foto ? `http://127.0.0.1:8000/storage/${deportista.foto}` : null);
    setErrors({});
    setShowModal(true);
  };

  const openDetailModal = async (deportista) => {
    console.log('👁️ Abriendo modal de detalles:', deportista);
    
    try {
      const headers = authHeaders();
      const res = await fetch(`${API_DEPORTISTAS}/${getDeportistaId(deportista)}`, { headers });
      
      if (res.ok) {
        const deportistaDetalle = await res.json();
        console.log('✅ Detalles del deportista:', deportistaDetalle);
        setSelected(deportistaDetalle);
        setShowDetailModal(true);
      } else {
        console.error('❌ Error cargando detalles:', res.status);
        setSelected(deportista);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('❌ Error cargando detalles:', error);
      setSelected(deportista);
      setShowDetailModal(true);
    }
  };

  const openDeleteModal = (deportista) => {
    console.log('🗑️ Abriendo modal de eliminación:', deportista);
    setSelected(deportista);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    console.log('❌ Cerrando modal');
    setShowModal(false);
    setShowDetailModal(false);
    setErrors({});
    setFotoPreview(null);
  };

  const closeDeleteModal = () => {
    console.log('❌ Cerrando modal de eliminación');
    setShowDeleteModal(false);
    setSelected(null);
  };

  // Selection
  const toggleDeportistaSelection = (id) => {
    console.log('✓ Cambiando selección deportista ID:', id);
    setSelectedDeportistas(prev => {
      if (prev.includes(id)) {
        return prev.filter(deportistaId => deportistaId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleSelectAll = () => {
    console.log('✓ Cambiando selección de todos');
    if (selectAll) {
      setSelectedDeportistas([]);
    } else {
      const allIds = paginatedDeportistas.map(d => getDeportistaId(d));
      setSelectedDeportistas(allIds);
    }
    setSelectAll(!selectAll);
  };

  // Bulk actions
  const bulkToggleEstado = async (estado) => {
    console.log('🔄 Cambio masivo de estado:', estado, 'para', selectedDeportistas.length, 'deportistas');
    
    if (selectedDeportistas.length === 0) {
      alert('❌ Selecciona al menos un deportista');
      return;
    }

    if (!confirm(`¿Cambiar estado a "${estado}" de ${selectedDeportistas.length} deportista(s)?`)) return;

    try {
      const promises = selectedDeportistas.map(id => 
        fetch(`${API_DEPORTISTAS}/${id}/cambiar-estado`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ estado })
        })
      );

      await Promise.all(promises);
      await loadDeportistas();
      alert(`✅ ${selectedDeportistas.length} deportista(s) actualizado(s) exitosamente`);
    } catch (error) {
      console.error('❌ Error en operación masiva:', error);
      alert('❌ Error en la operación masiva');
    }
  };

  const bulkDelete = async () => {
    console.log('🗑️ Eliminación masiva de:', selectedDeportistas.length, 'deportistas');
    
    if (selectedDeportistas.length === 0) {
      alert('❌ Selecciona al menos un deportista');
      return;
    }

    if (!confirm(`¿Eliminar ${selectedDeportistas.length} deportista(s)? Esta acción no se puede deshacer.`)) return;

    try {
      const promises = selectedDeportistas.map(id => 
        fetch(`${API_DEPORTISTAS}/${id}`, {
          method: 'DELETE',
          headers: authHeaders()
        })
      );

      await Promise.all(promises);
      await loadDeportistas();
      alert(`✅ ${selectedDeportistas.length} deportista(s) eliminado(s) exitosamente`);
    } catch (error) {
      console.error('❌ Error en eliminación masiva:', error);
      alert('❌ Error en la eliminación masiva');
    }
  };

  // Obtener color del estado
  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'activo': return '#10b981';
      case 'lesionado': return '#f59e0b';
      case 'suspendido': return '#ef4444';
      case 'retirado': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // Obtener icono del estado
  const getEstadoIcon = (estado) => {
    switch(estado) {
      case 'activo': return <CheckCircle size={14} />;
      case 'lesionado': return <AlertTriangle size={14} />;
      case 'suspendido': return <XCircle size={14} />;
      case 'retirado': return <UserCheck size={14} />;
      default: return <XCircle size={14} />;
    }
  };

  // Obtener color del género
  const getGeneroColor = (genero) => {
    switch(genero) {
      case 'masculino': return '#3b82f6';
      case 'femenino': return '#ec4899';
      default: return '#6b7280';
    }
  };

  // Obtener icono del género
  const getGeneroIcon = (genero) => {
    switch(genero) {
      case 'masculino': return <User size={14} />;
      case 'femenino': return <User size={14} />;
      default: return <User size={14} />;
    }
  };

  // Obtener texto del pie hábil
  const getPieHabilText = (pie) => {
    switch(pie) {
      case 'derecho': return 'Derecho';
      case 'izquierdo': return 'Izquierdo';
      case 'ambidiestro': return 'Ambidiestro';
      default: return 'No especificado';
    }
  };

  // Manejar cambio de filtro
  const handleFilterChange = async () => {
    console.log('🔍 Aplicando filtros en servidor...');
    await loadDeportistas(
      1, 
      estadoFilter !== 'all' ? estadoFilter : '', 
      searchTerm,
      generoFilter !== 'all' ? generoFilter : '',
      categoriaFilter !== 'all' ? categoriaFilter : ''
    );
  };

  return (
    <div className="deportista-container">
      <Sidebar />
      
      <div className="deportista-content">
        <Topbar />
        
        {/* HEADER */}
        <div className="deportista-header">
          <div style={{flex: 1, minWidth: 0}}>
            <h1 className="deportista-title">
              <PersonStanding size={28} />
              Gestión de Deportistas
            </h1>
            <p className="deportista-subtitle">
              Administra los deportistas registrados en el sistema
            </p>
          </div>
          
          <div className="deportista-header-actions">
            <button 
              onClick={() => {
                loadDeportistas();
                loadData();
              }} 
              className="deportista-btn deportista-btn-secondary"
              disabled={loading}
              title="Actualizar lista"
            >
              <RefreshCw size={20} /> <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button 
              onClick={openCreateModal} 
              className="deportista-btn deportista-btn-primary"
              style={{flexShrink: 0}}
            >
              <Plus size={20} /> <span className="hidden sm:inline">Nuevo Deportista</span>
            </button>
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        <div className="deportista-stats-grid">
          <div className="deportista-stat-card">
            <div className="deportista-stat-icon" style={{backgroundColor: '#f0f9ff', color: '#0ea5e9'}}>
              <Users size={24} />
            </div>
            <div>
              <h3 className="deportista-stat-number">{stats.total}</h3>
              <p className="deportista-stat-label">Total Deportistas</p>
            </div>
          </div>
          
          <div className="deportista-stat-card">
            <div className="deportista-stat-icon" style={{backgroundColor: '#d1fae5', color: '#10b981'}}>
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="deportista-stat-number">{stats.activos}</h3>
              <p className="deportista-stat-label">Activos</p>
            </div>
          </div>
          
          <div className="deportista-stat-card">
            <div className="deportista-stat-icon" style={{backgroundColor: '#fef3c7', color: '#f59e0b'}}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="deportista-stat-number">{stats.lesionados}</h3>
              <p className="deportista-stat-label">Lesionados</p>
            </div>
          </div>
          
          <div className="deportista-stat-card">
            <div className="deportista-stat-icon" style={{backgroundColor: '#fee2e2', color: '#ef4444'}}>
              <XCircle size={24} />
            </div>
            <div>
              <h3 className="deportista-stat-number">{stats.suspendidos}</h3>
              <p className="deportista-stat-label">Suspendidos</p>
            </div>
          </div>
          
          <div className="deportista-stat-card">
            <div className="deportista-stat-icon" style={{backgroundColor: '#f0f9ff', color: '#0ea5e9'}}>
              <User size={24} />
            </div>
            <div>
              <h3 className="deportista-stat-number">{stats.masculinos}</h3>
              <p className="deportista-stat-label">Masculinos</p>
            </div>
          </div>
          
          <div className="deportista-stat-card">
            <div className="deportista-stat-icon" style={{backgroundColor: '#fce7f3', color: '#ec4899'}}>
              <User size={24} />
            </div>
            <div>
              <h3 className="deportista-stat-number">{stats.femeninos}</h3>
              <p className="deportista-stat-label">Femeninos</p>
            </div>
          </div>
          
          <div className="deportista-stat-card">
            <div className="deportista-stat-icon" style={{backgroundColor: '#f0f9ff', color: '#0ea5e9'}}>
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="deportista-stat-number">{stats.edadPromedio}</h3>
              <p className="deportista-stat-label">Edad Promedio</p>
            </div>
          </div>
          
          <div className="deportista-stat-card">
            <div className="deportista-stat-icon" style={{backgroundColor: '#f0f9ff', color: '#0ea5e9'}}>
              <Scale size={24} />
            </div>
            <div>
              <h3 className="deportista-stat-number">{stats.imcPromedio}</h3>
              <p className="deportista-stat-label">IMC Promedio</p>
            </div>
          </div>
        </div>

        {/* BARRA DE HERRAMIENTAS */}
        <div className="deportista-toolbar">
          <div className="deportista-toolbar-row">
            <div className="deportista-search-container">
              <div className="deportista-search">
                <Search className="deportista-search-icon" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                  className="deportista-search-input"
                  placeholder="Buscar deportistas por nombre, apellido o documento..."
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="deportista-filters">
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="deportista-filter-select"
                disabled={loading}
              >
                <option value="all">Todos los estados</option>
                <option value="activo">Solo activos</option>
                <option value="lesionado">Solo lesionados</option>
                <option value="suspendido">Solo suspendidos</option>
                <option value="retirado">Solo retirados</option>
              </select>
              
              <select
                value={generoFilter}
                onChange={(e) => setGeneroFilter(e.target.value)}
                className="deportista-filter-select"
                disabled={loading}
              >
                <option value="all">Todos los géneros</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
              </select>
              
              <select
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                className="deportista-filter-select"
                disabled={loading}
              >
                <option value="all">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat.id_categoria} value={cat.id_categoria}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="deportista-btn deportista-btn-secondary"
                disabled={loading}
              >
                <ArrowUpDown size={18} />
                {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
              </button>
              
              <button
                onClick={handleFilterChange}
                className="deportista-btn deportista-btn-primary"
                disabled={loading}
              >
                <Filter size={18} />
                Filtrar
              </button>
            </div>
          </div>
          
          {/* ACCIONES MASIVAS */}
          {selectedDeportistas.length > 0 && (
            <div className="deportista-toolbar-actions">
              <div className="deportista-bulk-actions">
                <span className="deportista-bulk-info">
                  {selectedDeportistas.length} deportista(s) seleccionado(s)
                </span>
                <button
                  onClick={() => bulkToggleEstado('activo')}
                  className="deportista-btn deportista-btn-success deportista-btn-sm"
                  disabled={loading}
                >
                  <CheckCircle size={16} /> Activar
                </button>
                <button
                  onClick={() => bulkToggleEstado('lesionado')}
                  className="deportista-btn deportista-btn-warning deportista-btn-sm"
                  disabled={loading}
                >
                  <AlertTriangle size={16} /> Lesionar
                </button>
                <button
                  onClick={() => bulkToggleEstado('suspendido')}
                  className="deportista-btn deportista-btn-warning deportista-btn-sm"
                  disabled={loading}
                >
                  <XCircle size={16} /> Suspender
                </button>
                <button
                  onClick={() => bulkToggleEstado('retirado')}
                  className="deportista-btn deportista-btn-secondary deportista-btn-sm"
                  disabled={loading}
                >
                  <UserCheck size={16} /> Retirar
                </button>
                <button
                  onClick={bulkDelete}
                  className="deportista-btn deportista-btn-danger deportista-btn-sm"
                  disabled={loading}
                >
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
              
              <div className="deportista-action-buttons">
                <button
                  onClick={() => setSelectedDeportistas([])}
                  className="deportista-btn deportista-btn-secondary deportista-btn-icon"
                  title="Limpiar selección"
                  disabled={selectedDeportistas.length === 0 || loading}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CONTENIDO PRINCIPAL */}
        {loading ? (
          <div className="deportista-loading">
            <div className="deportista-loading-spinner"></div>
            <p>Cargando deportistas...</p>
          </div>
        ) : error ? (
          <div className="deportista-error">
            <AlertTriangle size={48} className="deportista-error-icon" />
            <h3>Error al cargar deportistas</h3>
            <p>{error}</p>
            <button onClick={() => loadDeportistas()} className="deportista-btn deportista-btn-primary" style={{marginTop: '1rem'}}>
              <RefreshCw size={18} /> Reintentar
            </button>
          </div>
        ) : filteredDeportistas.length === 0 ? (
          <div className="deportista-empty-state">
            <PersonStanding size={64} className="deportista-empty-state-icon" />
            <h3>
              {searchTerm || estadoFilter !== 'all' || generoFilter !== 'all' || categoriaFilter !== 'all' 
                ? 'No se encontraron resultados' 
                : 'No hay deportistas registrados'}
            </h3>
            <p>
              {searchTerm || estadoFilter !== 'all' || generoFilter !== 'all' || categoriaFilter !== 'all'
                ? 'Intenta con otros términos de búsqueda o filtros' 
                : 'Comienza creando tu primer deportista'}
            </p>
            <button onClick={openCreateModal} className="deportista-btn deportista-btn-primary" style={{marginTop: '1.5rem'}}>
              <Plus size={18} /> Crear Deportista
            </button>
          </div>
        ) : (
          <>
            <div className="deportista-table-container">
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
                  Mostrando {filteredDeportistas.length} de {totalItems} deportistas
                  {searchTerm && ` para "${searchTerm}"`}
                  {estadoFilter !== 'all' && ` con estado "${estadoFilter}"`}
                  {generoFilter !== 'all' && ` de género "${generoFilter}"`}
                </div>
                {totalPages > 1 && (
                  <div className="text-secondary">
                    Página {currentPage} de {totalPages}
                  </div>
                )}
              </div>
              
              <table className="deportista-table">
                <thead>
                  <tr>
                    <th style={{width: '50px', minWidth: '50px'}}>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="deportista-checkbox"
                        disabled={loading}
                      />
                    </th>
                    <th style={{minWidth: '80px'}}>Foto</th>
                    <th 
                      className="sortable" 
                      onClick={() => setSortBy('apellidos')}
                      style={{cursor: 'pointer', minWidth: '200px'}}
                    >
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <User size={14} className="hidden sm:inline" />
                        <span>Deportista</span>
                        {sortBy === 'apellidos' && (
                          <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th style={{minWidth: '150px'}}>Información</th>
                    <th style={{minWidth: '150px'}}>Datos Deportivos</th>
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
                    <th style={{minWidth: '120px'}}>Contacto</th>
                    <th style={{minWidth: '140px'}}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDeportistas.map(deportista => {
                    const deportistaId = getDeportistaId(deportista);
                    const isSelected = selectedDeportistas.includes(deportistaId);
                    const edad = calcularEdad(deportista.fecha_nacimiento);
                    const imc = calcularIMC(deportista.peso, deportista.altura);
                    
                    return (
                      <tr key={deportistaId} className={isSelected ? 'selected' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleDeportistaSelection(deportistaId)}
                            className="deportista-checkbox"
                          />
                        </td>
                        <td>
                          {deportista.foto ? (
                            <img 
                              src={`http://127.0.0.1:8000/storage/${deportista.foto}`}
                              alt={`${deportista.nombres} ${deportista.apellidos}`}
                              className="deportista-foto"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="deportista-foto-placeholder" 
                            style={{display: deportista.foto ? 'none' : 'flex'}}
                          >
                            <User size={20} />
                          </div>
                        </td>
                        <td>
                          <div style={{fontWeight: '600', color: '#1f2937'}}>
                            {deportista.apellidos}, {deportista.nombres}
                          </div>
                          <div style={{fontSize: '0.875rem', color: '#6b7280', marginTop: '2px'}}>
                            <div className="deportista-info-item">
                              <FileText size={12} style={{flexShrink: 0}} />
                              <span>{deportista.tipo_documento}: {deportista.numero_documento}</span>
                            </div>
                            <div className="deportista-info-item">
                              <Calendar size={12} style={{flexShrink: 0}} />
                              <span>{edad} años</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{fontSize: '0.875rem'}}>
                            <div 
                              className="deportista-genero-badge"
                              style={{
                                backgroundColor: getGeneroColor(deportista.genero) + '20',
                                color: getGeneroColor(deportista.genero),
                                borderColor: getGeneroColor(deportista.genero),
                                marginBottom: '4px'
                              }}
                            >
                              {getGeneroIcon(deportista.genero)}
                              <span>{deportista.genero}</span>
                            </div>
                            {deportista.categoria && (
                              <div className="deportista-info-item">
                                <AwardIcon size={12} style={{flexShrink: 0}} />
                                <span className="truncate">{deportista.categoria.nombre}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{fontSize: '0.875rem'}}>
                            {deportista.altura && deportista.peso && (
                              <div className="deportista-info-item">
                                <Scale size={12} style={{flexShrink: 0}} />
                                <span>
                                  {deportista.altura}m - {deportista.peso}kg 
                                  {imc && ` (IMC: ${imc})`}
                                </span>
                              </div>
                            )}
                            {deportista.pie_habil && (
                              <div className="deportista-info-item">
                                <Footprints size={12} style={{flexShrink: 0}} />
                                <span>{getPieHabilText(deportista.pie_habil)}</span>
                              </div>
                            )}
                            {deportista.numero_camiseta && (
                              <div className="deportista-info-item">
                                <Shirt size={12} style={{flexShrink: 0}} />
                                <span>#{deportista.numero_camiseta}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div 
                            className="deportista-estado-badge"
                            style={{
                              backgroundColor: getEstadoColor(deportista.estado) + '20',
                              color: getEstadoColor(deportista.estado),
                              borderColor: getEstadoColor(deportista.estado)
                            }}
                          >
                            {getEstadoIcon(deportista.estado)}
                            <span>{deportista.estado}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{fontSize: '0.875rem'}}>
                            {deportista.telefono && (
                              <div className="deportista-info-item">
                                <Phone size={12} style={{flexShrink: 0}} />
                                <span className="truncate">{deportista.telefono}</span>
                              </div>
                            )}
                            {deportista.correo && (
                              <div className="deportista-info-item">
                                <Mail size={12} style={{flexShrink: 0}} />
                                <span className="truncate">{deportista.correo}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="deportista-action-buttons">
                            <button
                              onClick={() => openDetailModal(deportista)}
                              className="deportista-btn-action deportista-btn-view"
                              title="Ver detalles"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(deportista)}
                              className="deportista-btn-action deportista-btn-edit"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => cambiarEstado(deportistaId, 
                                deportista.estado === 'activo' ? 'lesionado' : 'activo'
                              )}
                              className="deportista-btn-action deportista-btn-warning"
                              title={deportista.estado === 'activo' ? 'Marcar como lesionado' : 'Marcar como activo'}
                            >
                              {deportista.estado === 'activo' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                            </button>
                            <button
                              onClick={() => openDeleteModal(deportista)}
                              className="deportista-btn-action deportista-btn-danger"
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
                <div className="deportista-pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || loading}
                    className="deportista-pagination-btn"
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
                        className={`deportista-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        disabled={loading}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="deportista-pagination-ellipsis">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="deportista-pagination-btn"
                        disabled={loading}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || loading}
                    className="deportista-pagination-btn"
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
          <div className="deportista-modal-overlay">
            <div className="deportista-modal deportista-modal-lg">
              <div className="deportista-modal-header">
                <h2 className="deportista-modal-title">
                  <PersonStanding size={22} />
                  {mode === 'create' ? 'Nuevo Deportista' : 'Editar Deportista'}
                </h2>
                <button onClick={closeModal} className="deportista-modal-close">
                  <X size={22} />
                </button>
              </div>

              <div className="deportista-modal-content">
                <div className="deportista-form-grid">
                  {/* Columna 1: Información Personal */}
                  <div className="deportista-form-section">
                    <h3 className="deportista-form-section-title">
                      <User size={18} />
                      Información Personal
                    </h3>
                    
                    {/* Foto upload */}
                    <div className="deportista-foto-upload-section">
                      <div className="deportista-foto-preview">
                        {fotoPreview ? (
                          <img src={fotoPreview} alt="Foto preview" className="deportista-foto-preview-img" />
                        ) : (
                          <div className="deportista-foto-placeholder">
                            <User size={24} />
                          </div>
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          id="foto-upload"
                          accept="image/*"
                          onChange={handleFotoChange}
                          className="deportista-file-input"
                        />
                        <label htmlFor="foto-upload" className="deportista-btn deportista-btn-secondary">
                          <UploadIcon size={16} />
                          {form.foto instanceof File ? 'Cambiar Foto' : 'Subir Foto'}
                        </label>
                        <p className="deportista-file-hint">Máx. 2MB. Formatos: JPG, PNG, GIF</p>
                      </div>
                    </div>
                    
                    <div className="deportista-form-group">
                      <label className="deportista-form-label">
                        <User size={16} />
                        Usuario *
                      </label>
                      <select
                        value={form.id_usuario}
                        onChange={(e) => setForm({...form, id_usuario: e.target.value})}
                        className={`deportista-form-select ${errors.id_usuario ? 'error' : ''}`}
                      >
                        <option value="">-- Selecciona un usuario --</option>
                        {usuarios.map(usuario => (
                          <option key={usuario.id_usuario} value={usuario.id_usuario}>
                            {usuario.nombre} - {usuario.email}
                          </option>
                        ))}
                      </select>
                      {errors.id_usuario && <span className="deportista-form-error">{errors.id_usuario}</span>}
                    </div>

                    <div className="deportista-form-group">
                      <label className="deportista-form-label">
                        <User size={16} />
                        Nombres *
                      </label>
                      <input
                        type="text"
                        value={form.nombres}
                        onChange={(e) => setForm({...form, nombres: e.target.value})}
                        className={`deportista-form-input ${errors.nombres ? 'error' : ''}`}
                        placeholder="Ej: Juan Carlos"
                      />
                      {errors.nombres && <span className="deportista-form-error">{errors.nombres}</span>}
                    </div>

                    <div className="deportista-form-group">
                      <label className="deportista-form-label">
                        <User size={16} />
                        Apellidos *
                      </label>
                      <input
                        type="text"
                        value={form.apellidos}
                        onChange={(e) => setForm({...form, apellidos: e.target.value})}
                        className={`deportista-form-input ${errors.apellidos ? 'error' : ''}`}
                        placeholder="Ej: Pérez González"
                      />
                      {errors.apellidos && <span className="deportista-form-error">{errors.apellidos}</span>}
                    </div>

                    <div className="deportista-form-row">
                      <div className="deportista-form-group">
                        <label className="deportista-form-label">
                          <Calendar size={16} />
                          Fecha Nacimiento *
                        </label>
                        <input
                          type="date"
                          value={form.fecha_nacimiento}
                          onChange={(e) => setForm({...form, fecha_nacimiento: e.target.value})}
                          className={`deportista-form-input ${errors.fecha_nacimiento ? 'error' : ''}`}
                        />
                        {errors.fecha_nacimiento && <span className="deportista-form-error">{errors.fecha_nacimiento}</span>}
                      </div>

                      <div className="deportista-form-group">
                        <label className="deportista-form-label">
                          <User size={16} />
                          Género *
                        </label>
                        <select
                          value={form.genero}
                          onChange={(e) => setForm({...form, genero: e.target.value})}
                          className="deportista-form-select"
                        >
                          <option value="masculino">Masculino</option>
                          <option value="femenino">Femenino</option>
                        </select>
                      </div>
                    </div>

                    <div className="deportista-form-row">
                      <div className="deportista-form-group">
                        <label className="deportista-form-label">
                          <FileText size={16} />
                          Tipo Documento *
                        </label>
                        <select
                          value={form.tipo_documento}
                          onChange={(e) => setForm({...form, tipo_documento: e.target.value})}
                          className={`deportista-form-select ${errors.tipo_documento ? 'error' : ''}`}
                        >
                          <option value="DNI">DNI</option>
                          <option value="Pasaporte">Pasaporte</option>
                          <option value="Cédula">Cédula</option>
                          <option value="Otro">Otro</option>
                        </select>
                        {errors.tipo_documento && <span className="deportista-form-error">{errors.tipo_documento}</span>}
                      </div>

                      <div className="deportista-form-group">
                        <label className="deportista-form-label">
                          <FileText size={16} />
                          N° Documento *
                        </label>
                        <input
                          type="text"
                          value={form.numero_documento}
                          onChange={(e) => setForm({...form, numero_documento: e.target.value})}
                          className={`deportista-form-input ${errors.numero_documento ? 'error' : ''}`}
                          placeholder="Ej: 12345678"
                        />
                        {errors.numero_documento && <span className="deportista-form-error">{errors.numero_documento}</span>}
                      </div>
                    </div>

                    <div className="deportista-form-group">
                      <label className="deportista-form-label">
                        <AwardIcon size={16} />
                        Categoría
                      </label>
                      <select
                        value={form.id_categoria}
                        onChange={(e) => setForm({...form, id_categoria: e.target.value})}
                        className="deportista-form-select"
                      >
                        <option value="">-- Sin categoría --</option>
                        {categorias.map(cat => (
                          <option key={cat.id_categoria} value={cat.id_categoria}>
                            {cat.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Columna 2: Datos Deportivos */}
                  <div className="deportista-form-section">
                    <h3 className="deportista-form-section-title">
                      <Dumbbell size={18} />
                      Datos Deportivos
                    </h3>

                    <div className="deportista-form-row">
                      <div className="deportista-form-group">
                        <label className="deportista-form-label">
                          <Ruler size={16} />
                          Altura (m)
                        </label>
                        <input
                          type="number"
                          value={form.altura}
                          onChange={(e) => setForm({...form, altura: e.target.value})}
                          className="deportista-form-input"
                          placeholder="1.75"
                          step="0.01"
                          min="0.5"
                          max="2.5"
                        />
                      </div>

                      <div className="deportista-form-group">
                        <label className="deportista-form-label">
                          <Scale size={16} />
                          Peso (kg)
                        </label>
                        <input
                          type="number"
                          value={form.peso}
                          onChange={(e) => setForm({...form, peso: e.target.value})}
                          className="deportista-form-input"
                          placeholder="70"
                          step="0.1"
                          min="20"
                          max="200"
                        />
                      </div>
                    </div>

                    <div className="deportista-form-row">
                      <div className="deportista-form-group">
                        <label className="deportista-form-label">
                          <Footprints size={16} />
                          Pie Hábil
                        </label>
                        <select
                          value={form.pie_habil}
                          onChange={(e) => setForm({...form, pie_habil: e.target.value})}
                          className="deportista-form-select"
                        >
                          <option value="">-- Seleccionar --</option>
                          <option value="derecho">Derecho</option>
                          <option value="izquierdo">Izquierdo</option>
                          <option value="ambidiestro">Ambidiestro</option>
                        </select>
                      </div>

                      <div className="deportista-form-group">
                        <label className="deportista-form-label">
                          <Shirt size={16} />
                          N° Camiseta
                        </label>
                        <input
                          type="number"
                          value={form.numero_camiseta}
                          onChange={(e) => setForm({...form, numero_camiseta: e.target.value})}
                          className="deportista-form-input"
                          placeholder="10"
                          min="1"
                          max="99"
                        />
                      </div>
                    </div>

                    <div className="deportista-form-group">
                      <label className="deportista-form-label">
                        <Shield size={16} />
                        Estado *
                      </label>
                      <select
                        value={form.estado}
                        onChange={(e) => setForm({...form, estado: e.target.value})}
                        className="deportista-form-select"
                      >
                        <option value="activo">Activo</option>
                        <option value="lesionado">Lesionado</option>
                        <option value="suspendido">Suspendido</option>
                        <option value="retirado">Retirado</option>
                      </select>
                    </div>
                  </div>

                  {/* Columna 3: Contacto y Emergencia */}
                  <div className="deportista-form-section">
                    <h3 className="deportista-form-section-title">
                      <Smartphone size={18} />
                      Contacto
                    </h3>

                    <div className="deportista-form-group">
                      <label className="deportista-form-label">
                        <Mail size={16} />
                        Email
                      </label>
                      <input
                        type="email"
                        value={form.correo}
                        onChange={(e) => setForm({...form, correo: e.target.value})}
                        className={`deportista-form-input ${errors.correo ? 'error' : ''}`}
                        placeholder="deportista@ejemplo.com"
                      />
                      {errors.correo && <span className="deportista-form-error">{errors.correo}</span>}
                    </div>

                    <div className="deportista-form-group">
                      <label className="deportista-form-label">
                        <Phone size={16} />
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={form.telefono}
                        onChange={(e) => setForm({...form, telefono: e.target.value})}
                        className="deportista-form-input"
                        placeholder="+1234567890"
                      />
                    </div>

                    <div className="deportista-form-group">
                      <label className="deportista-form-label">
                        <MapPin size={16} />
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={form.direccion}
                        onChange={(e) => setForm({...form, direccion: e.target.value})}
                        className="deportista-form-input"
                        placeholder="Dirección completa"
                      />
                    </div>

                    <h3 className="deportista-form-section-title" style={{marginTop: '1.5rem'}}>
                      <AlertTriangle size={18} />
                      Contacto de Emergencia
                    </h3>

                    <div className="deportista-form-group">
                      <label className="deportista-form-label">
                        <User size={16} />
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={form.contacto_emergencia_nombre}
                        onChange={(e) => setForm({...form, contacto_emergencia_nombre: e.target.value})}
                        className="deportista-form-input"
                        placeholder="Nombre completo"
                      />
                    </div>

                    <div className="deportista-form-row">
                      <div className="deportista-form-group">
                        <label className="deportista-form-label">
                          <Phone size={16} />
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          value={form.contacto_emergencia_telefono}
                          onChange={(e) => setForm({...form, contacto_emergencia_telefono: e.target.value})}
                          className="deportista-form-input"
                          placeholder="+1234567890"
                        />
                      </div>

                      <div className="deportista-form-group">
                        <label className="deportista-form-label">
                          <User size={16} />
                          Relación
                        </label>
                        <select
                          value={form.contacto_emergencia_relacion}
                          onChange={(e) => setForm({...form, contacto_emergencia_relacion: e.target.value})}
                          className="deportista-form-select"
                        >
                          <option value="">-- Seleccionar --</option>
                          <option value="Padre">Padre</option>
                          <option value="Madre">Madre</option>
                          <option value="Hermano/a">Hermano/a</option>
                          <option value="Tutor">Tutor</option>
                          <option value="Esposo/a">Esposo/a</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="deportista-modal-footer">
                <button onClick={closeModal} className="deportista-btn deportista-btn-secondary">
                  <X size={18} /> Cancelar
                </button>
                <button 
                  onClick={mode === 'create' ? createDeportista : updateDeportista} 
                  className="deportista-btn deportista-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Guardando...
                    </>
                  ) : mode === 'create' ? (
                    <>
                      <Plus size={18} /> Crear Deportista
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
          <div className="deportista-modal-overlay">
            <div className="deportista-modal deportista-modal-lg">
              <div className="deportista-modal-header">
                <h2 className="deportista-modal-title">
                  <PersonStanding size={22} />
                  Detalles del Deportista
                </h2>
                <div className="deportista-modal-header-actions">
                  <button 
                    onClick={() => openEditModal(selected)}
                    className="deportista-btn deportista-btn-primary deportista-btn-sm"
                  >
                    <Edit2 size={16} /> Editar
                  </button>
                  <button onClick={closeModal} className="deportista-modal-close">
                    <X size={22} />
                  </button>
                </div>
              </div>

              <div className="deportista-modal-content">
                {/* Header del deportista */}
                <div className="deportista-detail-header">
                  <div className="deportista-detail-foto">
                    {selected.foto ? (
                      <img 
                        src={`http://127.0.0.1:8000/storage/${selected.foto}`}
                        alt={`${selected.nombres} ${selected.apellidos}`}
                        className="deportista-detail-foto-img"
                      />
                    ) : (
                      <div className="deportista-detail-foto-placeholder">
                        <User size={32} />
                      </div>
                    )}
                  </div>
                  <div className="deportista-detail-header-info">
                    <h3 className="deportista-detail-name">
                      {selected.apellidos}, {selected.nombres}
                    </h3>
                    <div className="deportista-detail-estado">
                      <div 
                        className="deportista-estado-badge"
                        style={{
                          backgroundColor: getEstadoColor(selected.estado) + '20',
                          color: getEstadoColor(selected.estado),
                          borderColor: getEstadoColor(selected.estado)
                        }}
                      >
                        {getEstadoIcon(selected.estado)}
                        <span>{selected.estado}</span>
                      </div>
                      <div 
                        className="deportista-genero-badge"
                        style={{
                          backgroundColor: getGeneroColor(selected.genero) + '20',
                          color: getGeneroColor(selected.genero),
                          borderColor: getGeneroColor(selected.genero)
                        }}
                      >
                        {getGeneroIcon(selected.genero)}
                        <span>{selected.genero}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información principal */}
                <div className="deportista-detail-grid">
                  <div className="deportista-detail-section">
                    <h4 className="deportista-detail-section-title">
                      <User size={18} />
                      Información Personal
                    </h4>
                    <div className="deportista-detail-info-list">
                      <div className="deportista-detail-info-item">
                        <span className="deportista-detail-info-label">Documento:</span>
                        <span className="deportista-detail-info-value">
                          {selected.tipo_documento}: {selected.numero_documento}
                        </span>
                      </div>
                      <div className="deportista-detail-info-item">
                        <span className="deportista-detail-info-label">Fecha Nacimiento:</span>
                        <span className="deportista-detail-info-value">
                          {new Date(selected.fecha_nacimiento).toLocaleDateString()} 
                          ({calcularEdad(selected.fecha_nacimiento)} años)
                        </span>
                      </div>
                      {selected.categoria && (
                        <div className="deportista-detail-info-item">
                          <span className="deportista-detail-info-label">Categoría:</span>
                          <span className="deportista-detail-info-value">{selected.categoria.nombre}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="deportista-detail-section">
                    <h4 className="deportista-detail-section-title">
                      <Dumbbell size={18} />
                      Datos Deportivos
                    </h4>
                    <div className="deportista-detail-info-list">
                      {selected.altura && selected.peso && (
                        <div className="deportista-detail-info-item">
                          <span className="deportista-detail-info-label">Altura / Peso:</span>
                          <span className="deportista-detail-info-value">
                            {selected.altura}m - {selected.peso}kg
                            {calcularIMC(selected.peso, selected.altura) && 
                              ` (IMC: ${calcularIMC(selected.peso, selected.altura)})`
                            }
                          </span>
                        </div>
                      )}
                      {selected.pie_habil && (
                        <div className="deportista-detail-info-item">
                          <span className="deportista-detail-info-label">Pie Hábil:</span>
                          <span className="deportista-detail-info-value">{getPieHabilText(selected.pie_habil)}</span>
                        </div>
                      )}
                      {selected.numero_camiseta && (
                        <div className="deportista-detail-info-item">
                          <span className="deportista-detail-info-label">N° Camiseta:</span>
                          <span className="deportista-detail-info-value">#{selected.numero_camiseta}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="deportista-detail-section">
                    <h4 className="deportista-detail-section-title">
                      <Smartphone size={18} />
                      Contacto
                    </h4>
                    <div className="deportista-detail-info-list">
                      {selected.telefono && (
                        <div className="deportista-detail-info-item">
                          <span className="deportista-detail-info-label">Teléfono:</span>
                          <a href={`tel:${selected.telefono}`} className="deportista-detail-info-link">
                            {selected.telefono}
                          </a>
                        </div>
                      )}
                      {selected.correo && (
                        <div className="deportista-detail-info-item">
                          <span className="deportista-detail-info-label">Email:</span>
                          <a href={`mailto:${selected.correo}`} className="deportista-detail-info-link">
                            {selected.correo}
                          </a>
                        </div>
                      )}
                      {selected.direccion && (
                        <div className="deportista-detail-info-item">
                          <span className="deportista-detail-info-label">Dirección:</span>
                          <span className="deportista-detail-info-value">{selected.direccion}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(selected.contacto_emergencia_nombre || selected.contacto_emergencia_telefono) && (
                    <div className="deportista-detail-section">
                      <h4 className="deportista-detail-section-title">
                        <AlertTriangle size={18} />
                        Contacto de Emergencia
                      </h4>
                      <div className="deportista-detail-info-list">
                        {selected.contacto_emergencia_nombre && (
                          <div className="deportista-detail-info-item">
                            <span className="deportista-detail-info-label">Nombre:</span>
                            <span className="deportista-detail-info-value">{selected.contacto_emergencia_nombre}</span>
                          </div>
                        )}
                        {selected.contacto_emergencia_telefono && (
                          <div className="deportista-detail-info-item">
                            <span className="deportista-detail-info-label">Teléfono:</span>
                            <a href={`tel:${selected.contacto_emergencia_telefono}`} className="deportista-detail-info-link">
                              {selected.contacto_emergencia_telefono}
                            </a>
                          </div>
                        )}
                        {selected.contacto_emergencia_relacion && (
                          <div className="deportista-detail-info-item">
                            <span className="deportista-detail-info-label">Relación:</span>
                            <span className="deportista-detail-info-value">{selected.contacto_emergencia_relacion}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="deportista-modal-footer">
                <button onClick={closeModal} className="deportista-btn deportista-btn-secondary">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
        {showDeleteModal && selected && (
          <div className="deportista-modal-overlay">
            <div className="deportista-modal deportista-modal-sm">
              <div className="deportista-modal-header">
                <h2 className="deportista-modal-title">
                  <AlertTriangle size={22} />
                  Confirmar Eliminación
                </h2>
                <button onClick={closeDeleteModal} className="deportista-modal-close">
                  <X size={22} />
                </button>
              </div>

              <div className="deportista-modal-content">
                <div className="deportista-delete-content">
                  <AlertTriangle size={48} className="deportista-delete-icon" />
                  <h3 className="deportista-delete-title">¿Eliminar deportista?</h3>
                  <p className="deportista-delete-message">
                    Estás por eliminar al deportista <strong>{selected.nombres} {selected.apellidos}</strong>.
                    Esta acción no se puede deshacer.
                  </p>
                  <p className="deportista-delete-warning">
                    ⚠️ Se eliminarán todos los datos asociados al deportista.
                  </p>
                </div>
              </div>

              <div className="deportista-modal-footer">
                <button onClick={closeDeleteModal} className="deportista-btn deportista-btn-secondary">
                  <X size={18} /> Cancelar
                </button>
                <button 
                  onClick={() => deleteDeportista(getDeportistaId(selected))} 
                  className="deportista-btn deportista-btn-danger"
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
      </div>
    </div>
  );
};

export default Deportista;