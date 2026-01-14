import React, { useState, useEffect, useRef } from 'react';
import {
  Settings, Search, Filter, RefreshCw, Plus,
  Save, Edit2, Trash2, Eye, EyeOff, Lock, Unlock,
  ChevronLeft, ChevronRight, Copy, CheckCircle,
  AlertCircle, XCircle, Info, MoreVertical, Download,
  Upload, Calendar, Hash, ToggleLeft, ToggleRight,
  FileText, Code, Key, Folder, Globe, Mail, Shield,
  Bell, Database, Users, CreditCard, MessageSquare,
  Package, Terminal, Cloud, Server, Cpu, HardDrive,
  Wifi, ShieldCheck, BarChart, PieChart, TrendingUp,
  Zap, Moon, Sun, Palette, Image, FileJson,
  ChevronDown, ChevronUp, Grid, List, Star,
  Tag, Settings as SettingsIcon, Key as KeyIcon,
  FileCode, Text, ToggleLeft as ToggleLeftIcon,
  ToggleRight as ToggleRightIcon
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/configuracion.css';

// CORREGIR LA RUTA DE GRUPOS:
const API_CONFIGURACIONES = 'http://127.0.0.1:8000/api/configuraciones';
const API_GRUPOS = 'http://127.0.0.1:8000/api/configuraciones/grupos/lista'; // ← CORREGIDO

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

const Configuracion = () => {
  // Estados principales
  const [configuraciones, setConfiguraciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [configuracionesSeleccionadas, setConfiguracionesSeleccionadas] = useState([]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [grupoFilter, setGrupoFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [soloEditables, setSoloEditables] = useState(false);
  const [gruposColapsados, setGruposColapsados] = useState({});
  
  // Grupos disponibles
  const [grupos, setGrupos] = useState([]);
  
  // Formularios
  const [formData, setFormData] = useState({
    clave: '',
    valor: '',
    tipo: 'texto',
    grupo: 'general',
    descripcion: '',
    editable: true
  });
  
  const [editFormData, setEditFormData] = useState({
    valor: '',
    descripcion: ''
  });
  
  const [bulkEditData, setBulkEditData] = useState({});
  
  const [errors, setErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Tipos de configuración
  const tipos = [
    { value: 'texto', label: 'Texto', icon: Text, color: '#3b82f6', placeholder: 'Ingrese texto...' },
    { value: 'numero', label: 'Número', icon: Hash, color: '#10b981', placeholder: 'Ingrese número...' },
    { value: 'boolean', label: 'Booleano', icon: ToggleLeftIcon, color: '#8b5cf6', placeholder: 'Seleccione...' },
    { value: 'json', label: 'JSON', icon: FileJson, color: '#f59e0b', placeholder: 'Ingrese JSON...' },
    { value: 'fecha', label: 'Fecha', icon: Calendar, color: '#ef4444', placeholder: 'Seleccione fecha...' }
  ];

  // Grupos predefinidos con iconos
  const gruposPredefinidos = [
    { value: 'general', label: 'General', icon: Settings, color: '#3b82f6' },
    { value: 'sistema', label: 'Sistema', icon: Terminal, color: '#10b981' },
    { value: 'seguridad', label: 'Seguridad', icon: Shield, color: '#ef4444' },
    { value: 'correo', label: 'Correo', icon: Mail, color: '#8b5cf6' },
    { value: 'base_datos', label: 'Base de Datos', icon: Database, color: '#f59e0b' },
    { value: 'archivos', label: 'Archivos', icon: Folder, color: '#64748b' },
    { value: 'usuarios', label: 'Usuarios', icon: Users, color: '#06b6d4' },
    { value: 'pagos', label: 'Pagos', icon: CreditCard, color: '#84cc16' },
    { value: 'notificaciones', label: 'Notificaciones', icon: Bell, color: '#ec4899' },
    { value: 'api', label: 'API', icon: Code, color: '#6366f1' },
    { value: 'cache', label: 'Cache', icon: Zap, color: '#f97316' },
    { value: 'appearance', label: 'Apariencia', icon: Palette, color: '#d946ef' }
  ];

  // Funciones helper
  const getTipoConfig = (tipo) => {
    return tipos.find(t => t.value === tipo) || tipos[0];
  };

  const getGrupoConfig = (grupo) => {
    return gruposPredefinidos.find(g => g.value === grupo) || {
      value: grupo,
      label: grupo.charAt(0).toUpperCase() + grupo.slice(1).replace('_', ' '),
      icon: Folder,
      color: '#94a3b8'
    };
  };

  const formatValor = (valor, tipo) => {
    if (valor === null || valor === undefined) return 'No definido';
    
    switch (tipo) {
      case 'boolean':
        return valor === '1' || valor === 'true' || valor === true ? 'Sí' : 'No';
      case 'json':
        try {
          const parsed = JSON.parse(valor);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return valor;
        }
      case 'numero':
        return Number(valor).toLocaleString();
      default:
        return valor.toString();
    }
  };

  const getValorVisual = (config) => {
    const valor = config.valor;
    const tipo = config.tipo;
    
    if (valor === null || valor === undefined) {
      return <span className="valor-nulo">No definido</span>;
    }
    
    switch (tipo) {
      case 'boolean':
        const esVerdadero = valor === '1' || valor === 'true' || valor === true;
        return (
          <div className={`valor-booleano ${esVerdadero ? 'verdadero' : 'falso'}`}>
            {esVerdadero ? (
              <>
                <ToggleRightIcon size={16} />
                <span>Sí</span>
              </>
            ) : (
              <>
                <ToggleLeftIcon size={16} />
                <span>No</span>
              </>
            )}
          </div>
        );
        
      case 'json':
        return (
          <div className="valor-json">
            <Code size={12} />
            <span>JSON</span>
          </div>
        );
        
      case 'numero':
        return (
          <div className="valor-numero">
            <Hash size={12} />
            <span>{Number(valor).toLocaleString()}</span>
          </div>
        );
        
      case 'fecha':
        return (
          <div className="valor-fecha">
            <Calendar size={12} />
            <span>{new Date(valor).toLocaleDateString()}</span>
          </div>
        );
        
      default:
        return (
          <div className="valor-texto" title={valor}>
            {valor && valor.length > 50 ? `${valor.substring(0, 50)}...` : valor}
          </div>
        );
    }
  };

  const getIconoTipo = (tipo) => {
    const tipoConfig = getTipoConfig(tipo);
    const Icon = tipoConfig.icon;
    return <Icon size={16} color={tipoConfig.color} />;
  };

  const getIconoGrupo = (grupo) => {
    const grupoConfig = getGrupoConfig(grupo);
    const Icon = grupoConfig.icon;
    return <Icon size={16} color={grupoConfig.color} />;
  };

  // Cargar configuraciones
  const loadConfiguraciones = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const params = {};
    
    if (grupoFilter !== 'all') params.grupo = grupoFilter;
    if (tipoFilter !== 'all') params.tipo = tipoFilter;
    if (searchTerm.trim() !== '') params.search = searchTerm;
    if (soloEditables) params.editable = true;
    
    const queryParams = new URLSearchParams(params);
    const url = `${API_CONFIGURACIONES}?${queryParams}`;
    
    console.log('🔍 Cargando configuraciones desde:', url);
    
    const response = await fetch(url, {
      headers: authHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('📦 Configuraciones recibidas:', data.length || 0);
    
    // Normalizar los datos para asegurar que tengan id
    const configuracionesNormalizadas = (data || []).map((config, index) => ({
      ...config,
      // Si no hay id, usar id_configuracion, id_archivo, o crear uno temporal
      id: config.id || config.id_configuracion || config.id_archivo || `temp-${index}-${Date.now()}`,
      // Asegurar que las propiedades necesarias existan
      clave: config.clave || '',
      valor: config.valor || '',
      tipo: config.tipo || 'texto',
      grupo: config.grupo || 'general',
      descripcion: config.descripcion || '',
      editable: config.editable !== undefined ? config.editable : true,
      created_at: config.created_at || new Date().toISOString(),
      updated_at: config.updated_at || new Date().toISOString()
    }));
    
    console.log('📦 Configuraciones normalizadas:', configuracionesNormalizadas);
    setConfiguraciones(configuracionesNormalizadas);
    
    // Inicializar grupos colapsados
    const gruposUnicos = [...new Set(configuracionesNormalizadas.map(c => c.grupo))];
    const nuevosColapsados = {};
    gruposUnicos.forEach(grupo => {
      nuevosColapsados[grupo] = gruposColapsados[grupo] || false;
    });
    setGruposColapsados(nuevosColapsados);
    
  } catch (err) {
    console.error('❌ Error cargando configuraciones:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
  // Cargar grupos
  const loadGrupos = async () => {
    try {
      const response = await fetch(API_GRUPOS, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setGrupos(data);
      } else {
        // Si la API no existe, usar grupos extraídos de las configuraciones
        const gruposExtraidos = [...new Set(configuraciones.map(c => c.grupo))];
        setGrupos(gruposExtraidos);
      }
    } catch (error) {
      console.error('Error cargando grupos:', error);
      // Si hay error, usar grupos extraídos de las configuraciones
      const gruposExtraidos = [...new Set(configuraciones.map(c => c.grupo))];
      setGrupos(gruposExtraidos);
    }
  };

  // Crear configuración
  const createConfiguracion = async () => {
    setErrors({});
    
    try {
      const response = await fetch(API_CONFIGURACIONES, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage('✅ Configuración creada exitosamente');
        setTimeout(() => setSuccessMessage(null), 3000);
        closeCreateModal();
        loadConfiguraciones();
      } else {
        setErrors(data.errors || { message: data.message || 'Error al crear configuración' });
      }
    } catch (error) {
      console.error('❌ Error creando configuración:', error);
      setErrors({ message: 'Error de conexión' });
    }
  };

  // Actualizar configuración
  const updateConfiguracion = async () => {
    if (!selectedConfig) return;
    
    setEditErrors({});
    
    try {
      const response = await fetch(`${API_CONFIGURACIONES}/${selectedConfig.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(editFormData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage('✅ Configuración actualizada exitosamente');
        setTimeout(() => setSuccessMessage(null), 3000);
        closeEditModal();
        loadConfiguraciones();
      } else {
        setEditErrors(data.errors || { message: data.message || 'Error al actualizar configuración' });
      }
    } catch (error) {
      console.error('❌ Error actualizando configuración:', error);
      setEditErrors({ message: 'Error de conexión' });
    }
  };

  // Eliminar configuración
  const deleteConfiguracion = async () => {
    if (!selectedConfig) return;
    
    try {
      const response = await fetch(`${API_CONFIGURACIONES}/${selectedConfig.id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      if (response.ok) {
        setSuccessMessage('✅ Configuración eliminada exitosamente');
        setTimeout(() => setSuccessMessage(null), 3000);
        closeDeleteModal();
        loadConfiguraciones();
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.message || 'No se pudo eliminar la configuración'}`);
      }
    } catch (error) {
      console.error('❌ Error eliminando configuración:', error);
      alert('❌ Error de conexión');
    }
  };

  // Edición masiva
  const handleBulkEdit = async () => {
    if (configuracionesSeleccionadas.length === 0) return;
    
    try {
      const updates = [];
      
      for (const config of configuracionesSeleccionadas) {
        if (config.editable) {
          const valor = bulkEditData[config.id]?.valor !== undefined 
            ? bulkEditData[config.id].valor 
            : config.valor;
            
          const response = await fetch(`${API_CONFIGURACIONES}/${config.id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ valor })
          });
          
          updates.push(response);
        }
      }
      
      await Promise.all(updates);
      
      setSuccessMessage(`✅ ${updates.length} configuraciones actualizadas`);
      setTimeout(() => setSuccessMessage(null), 3000);
      closeBulkEditModal();
      loadConfiguraciones();
      setConfiguracionesSeleccionadas([]);
    } catch (error) {
      console.error('❌ Error en edición masiva:', error);
      alert('❌ Error al actualizar configuraciones');
    }
  };

  // Obtener valor por clave
  const obtenerPorClave = async (clave) => {
    try {
      const response = await fetch(`${API_CONFIGURACIONES}/clave/${clave}`, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Valor de ${clave}: ${data.valor}`);
      }
    } catch (error) {
      console.error('Error obteniendo valor:', error);
    }
  };

  // Modal functions
  const openCreateModal = () => {
    setFormData({
      clave: '',
      valor: '',
      tipo: 'texto',
      grupo: 'general',
      descripcion: '',
      editable: true
    });
    setErrors({});
    setShowCreateModal(true);
  };

  const openEditModal = (config) => {
    setSelectedConfig(config);
    setEditFormData({
      valor: config.valor || '',
      descripcion: config.descripcion || ''
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  const openDetailModal = async (config) => {
    try {
      const response = await fetch(`${API_CONFIGURACIONES}/${config.id}`, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedConfig(data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error cargando detalles:', error);
    }
  };

  const openDeleteModal = (config) => {
    setSelectedConfig(config);
    setShowDeleteModal(true);
  };

  const openBulkEditModal = () => {
    if (configuracionesSeleccionadas.length === 0) {
      alert('❌ Selecciona al menos una configuración para editar');
      return;
    }
    
    const initialData = {};
    configuracionesSeleccionadas.forEach(config => {
      initialData[config.id] = { valor: config.valor };
    });
    
    setBulkEditData(initialData);
    setShowBulkEditModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      clave: '',
      valor: '',
      tipo: 'texto',
      grupo: 'general',
      descripcion: '',
      editable: true
    });
    setErrors({});
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedConfig(null);
    setEditFormData({ valor: '', descripcion: '' });
    setEditErrors({});
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedConfig(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedConfig(null);
  };

  const closeBulkEditModal = () => {
    setShowBulkEditModal(false);
    setBulkEditData({});
  };

  // Toggle colapsar grupo
  const toggleGrupo = (grupo) => {
    setGruposColapsados(prev => ({
      ...prev,
      [grupo]: !prev[grupo]
    }));
  };

  // Seleccionar/deseleccionar configuración
  const toggleSeleccionConfig = (config) => {
    setConfiguracionesSeleccionadas(prev => {
      const existe = prev.find(c => c.id === config.id);
      if (existe) {
        return prev.filter(c => c.id !== config.id);
      } else {
        return [...prev, config];
      }
    });
  };

  // Seleccionar/deseleccionar todas
  const toggleSeleccionTodas = () => {
    const configuracionesFiltradas = configuraciones.filter(config => 
      config.editable && (!soloEditables || config.editable)
    );
    
    if (configuracionesSeleccionadas.length === configuracionesFiltradas.length) {
      setConfiguracionesSeleccionadas([]);
    } else {
      setConfiguracionesSeleccionadas(configuracionesFiltradas);
    }
  };

  // Exportar configuraciones
  const exportConfiguraciones = () => {
    const data = {
      fecha_exportacion: new Date().toISOString(),
      total_configuraciones: configuraciones.length,
      configuraciones: configuraciones
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `configuraciones_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Importar configuraciones
  const importConfiguraciones = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (!data.configuraciones || !Array.isArray(data.configuraciones)) {
          throw new Error('Formato de archivo inválido');
        }
        
        // Aquí podrías implementar la lógica para importar configuraciones
        alert(`Archivo listo para importar. ${data.configuraciones.length} configuraciones encontradas.`);
        console.log('Datos para importar:', data);
        
      } catch (error) {
        alert('❌ Error al leer el archivo: ' + error.message);
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Estadísticas
  const stats = {
    total: configuraciones.length,
    editables: configuraciones.filter(c => c.editable).length,
    noEditables: configuraciones.filter(c => !c.editable).length,
    porTipo: tipos.reduce((acc, tipo) => {
      acc[tipo.value] = configuraciones.filter(c => c.tipo === tipo.value).length;
      return acc;
    }, {}),
    porGrupo: configuraciones.reduce((acc, config) => {
      acc[config.grupo] = (acc[config.grupo] || 0) + 1;
      return acc;
    }, {})
  };

  // Efectos
  useEffect(() => {
    loadConfiguraciones();
  }, [grupoFilter, tipoFilter, soloEditables, searchTerm]);

  useEffect(() => {
    if (configuraciones.length > 0) {
      loadGrupos();
    }
  }, [configuraciones]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Agrupar configuraciones por grupo
  const configuracionesPorGrupo = configuraciones.reduce((acc, config) => {
    if (!acc[config.grupo]) {
      acc[config.grupo] = [];
    }
    acc[config.grupo].push(config);
    return acc;
  }, {});

  return (
    <div className="configuracion-container">
      <Sidebar />
      
      <div className="configuracion-content">
        <Topbar />
        
        <div className="configuracion-main">
          {/* HEADER */}
          <div className="configuracion-header">
            <div>
              <h1 className="configuracion-title">
                <Settings size={28} />
                Configuraciones del Sistema
              </h1>
              <p className="configuracion-subtitle">
                Administra todas las configuraciones de la aplicación
              </p>
            </div>
            <div className="configuracion-header-actions">
              <button 
                onClick={openCreateModal}
                className="configuracion-btn-primary"
              >
                <Plus size={20} />
                Nueva Configuración
              </button>
            </div>
          </div>

          {/* MENSAJES DE ÉXITO */}
          {successMessage && (
            <div className="success-message">
              <CheckCircle size={20} />
              {successMessage}
            </div>
          )}

          {/* ESTADÍSTICAS */}
          <div className="configuracion-stats-grid">
            <div className="configuracion-stat-card">
              <div className="configuracion-stat-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                <Settings size={24} />
              </div>
              <div>
                <h3 className="configuracion-stat-number">{stats.total}</h3>
                <p className="configuracion-stat-label">Total</p>
              </div>
            </div>
            <div className="configuracion-stat-card">
              <div className="configuracion-stat-icon" style={{background: '#dcfce7', color: '#10b981'}}>
                <Edit2 size={24} />
              </div>
              <div>
                <h3 className="configuracion-stat-number">{stats.editables}</h3>
                <p className="configuracion-stat-label">Editables</p>
              </div>
            </div>
            <div className="configuracion-stat-card">
              <div className="configuracion-stat-icon" style={{background: '#fef3c7', color: '#f59e0b'}}>
                <Lock size={24} />
              </div>
              <div>
                <h3 className="configuracion-stat-number">{stats.noEditables}</h3>
                <p className="configuracion-stat-label">Bloqueadas</p>
              </div>
            </div>
            <div className="configuracion-stat-card">
              <div className="configuracion-stat-icon" style={{background: '#f3e8ff', color: '#8b5cf6'}}>
                <Folder size={24} />
              </div>
              <div>
                <h3 className="configuracion-stat-number">{Object.keys(stats.porGrupo).length}</h3>
                <p className="configuracion-stat-label">Grupos</p>
              </div>
            </div>
          </div>

          {/* FILTROS Y ACCIONES */}
          <div className="configuracion-filters">
            <div className="configuracion-filters-row">
              <div className="configuracion-search-container">
                <Search className="configuracion-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Buscar configuraciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="configuracion-search-input"
                />
              </div>
              
              <select
                value={grupoFilter}
                onChange={(e) => setGrupoFilter(e.target.value)}
                className="configuracion-filter-select"
              >
                <option value="all">Todos los grupos</option>
                {grupos.map((grupo, index) => (
                  <option key={`grupo-filter-${index}`} value={grupo}>
                    {getGrupoConfig(grupo).label}
                  </option>
                ))}
              </select>
              
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="configuracion-filter-select"
              >
                <option value="all">Todos los tipos</option>
                {tipos.map((tipo, index) => (
                  <option key={`tipo-filter-${index}`} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
              
              <label className="configuracion-checkbox-label">
                <input
                  type="checkbox"
                  checked={soloEditables}
                  onChange={(e) => setSoloEditables(e.target.checked)}
                  className="configuracion-checkbox"
                />
                <span>Solo editables</span>
              </label>
              
              <button onClick={loadConfiguraciones} className="configuracion-btn-secondary">
                <Filter size={18} />
                Filtrar
              </button>
              
              <button onClick={() => {
                setSearchTerm('');
                setGrupoFilter('all');
                setTipoFilter('all');
                setSoloEditables(false);
              }} className="configuracion-btn-secondary">
                <RefreshCw size={18} />
                Limpiar
              </button>
            </div>
            
            {/* ACCIONES MASIVAS */}
            <div className="configuracion-acciones-masivas">
              <div className="configuracion-seleccion-info">
                <span>{configuracionesSeleccionadas.length} seleccionadas</span>
                <button 
                  onClick={toggleSeleccionTodas}
                  className="configuracion-btn-link"
                >
                  {configuracionesSeleccionadas.length === configuraciones.filter(c => c.editable).length 
                    ? 'Deseleccionar todas' 
                    : 'Seleccionar todas'}
                </button>
              </div>
              
              <div className="configuracion-acciones-buttons">
                <button
                  onClick={openBulkEditModal}
                  disabled={configuracionesSeleccionadas.length === 0}
                  className="configuracion-btn-secondary"
                >
                  <Edit2 size={18} />
                  Editar Masivamente
                </button>
                
                <input
                  type="file"
                  accept=".json"
                  onChange={importConfiguraciones}
                  className="configuracion-file-input"
                  id="import-file"
                />
                <label htmlFor="import-file" className="configuracion-btn-secondary">
                  <Upload size={18} />
                  Importar
                </label>
                
                <button
                  onClick={exportConfiguraciones}
                  className="configuracion-btn-secondary"
                >
                  <Download size={18} />
                  Exportar
                </button>
              </div>
            </div>
          </div>

          {/* CONTENIDO */}
          {loading ? (
            <div className="configuracion-loading">
              <div className="configuracion-loading-spinner"></div>
              <p>Cargando configuraciones...</p>
            </div>
          ) : error ? (
            <div className="configuracion-error">
              <AlertCircle size={48} />
              <h3>Error al cargar configuraciones</h3>
              <p>{error}</p>
              <button onClick={loadConfiguraciones} className="configuracion-btn-primary">
                <RefreshCw size={18} />
                Reintentar
              </button>
            </div>
          ) : configuraciones.length === 0 ? (
            <div className="configuracion-empty-state">
              <Settings size={64} />
              <h3>No hay configuraciones</h3>
              <p>
                {searchTerm || grupoFilter !== 'all' || tipoFilter !== 'all' || soloEditables
                  ? 'No se encontraron configuraciones con los filtros aplicados'
                  : 'Crea tu primera configuración para comenzar'}
              </p>
              <button onClick={openCreateModal} className="configuracion-btn-primary">
                <Plus size={18} />
                Crear Configuración
              </button>
            </div>
          ) : (
            <>
              {/* VISTA POR GRUPOS */}
              <div className="configuracion-grupos">
                {Object.entries(configuracionesPorGrupo)
                  .sort(([grupoA], [grupoB]) => grupoA.localeCompare(grupoB))
                  .map(([grupo, configs]) => {
                    const grupoConfig = getGrupoConfig(grupo);
                    const estaColapsado = gruposColapsados[grupo];
                    const Icon = grupoConfig.icon;
                    
                    return (
                      <div key={`grupo-${grupo}`} className="configuracion-grupo">
                        <div 
                          className="configuracion-grupo-header"
                          onClick={() => toggleGrupo(grupo)}
                        >
                          <div className="configuracion-grupo-info">
                            <div 
                              className="configuracion-grupo-icon"
                              style={{ color: grupoConfig.color }}
                            >
                              <Icon size={20} />
                            </div>
                            <div>
                              <h3 className="configuracion-grupo-title">
                                {grupoConfig.label}
                                <span className="configuracion-grupo-count">
                                  ({configs.length})
                                </span>
                              </h3>
                              <p className="configuracion-grupo-desc">
                                {configs.length} configuración{configs.length !== 1 ? 'es' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="configuracion-grupo-toggle">
                            {estaColapsado ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                          </div>
                        </div>
                        
                        {!estaColapsado && (
                          <div className="configuracion-grid">
                            {configs.map((config) => {
                              const tipoConfig = getTipoConfig(config.tipo);
                              const TipoIcon = tipoConfig.icon;
                              const estaSeleccionada = configuracionesSeleccionadas.some(c => c.id === config.id);
                              
                              return (
                                <div 
                                  key={`config-${config.id}`}
                                  className={`configuracion-card ${!config.editable ? 'no-editable' : ''} ${estaSeleccionada ? 'seleccionada' : ''}`}
                                >
                                  <div className="configuracion-card-header">
                                    <div className="configuracion-card-checkbox">
                                      <input
                                        type="checkbox"
                                        checked={estaSeleccionada}
                                        onChange={() => toggleSeleccionConfig(config)}
                                        disabled={!config.editable}
                                      />
                                    </div>
                                    
                                    <div className="configuracion-card-clave">
                                      <div className="configuracion-card-clave-row">
                                        <KeyIcon size={14} />
                                        <h4 title={config.clave}>{config.clave}</h4>
                                        {!config.editable && (
                                          <Lock size={14} className="configuracion-lock-icon" />
                                        )}
                                      </div>
                                      <div className="configuracion-card-tipo">
                                        <TipoIcon size={12} />
                                        <span style={{ color: tipoConfig.color }}>
                                          {tipoConfig.label}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="configuracion-card-valor">
                                      {getValorVisual(config)}
                                    </div>
                                  </div>
                                  
                                  <div className="configuracion-card-body">
                                    {config.descripcion && (
                                      <p className="configuracion-card-descripcion" title={config.descripcion}>
                                        {config.descripcion.length > 100 
                                          ? `${config.descripcion.substring(0, 100)}...` 
                                          : config.descripcion}
                                      </p>
                                    )}
                                    
                                    <div className="configuracion-card-meta">
                                      <div className="configuracion-card-meta-item">
                                        <Calendar size={12} />
                                        <span>{new Date(config.updated_at).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="configuracion-card-footer">
                                    <div className="configuracion-card-actions">
                                      <button
                                        onClick={() => obtenerPorClave(config.clave)}
                                        className="configuracion-card-action-btn"
                                        title="Obtener valor"
                                      >
                                        <Eye size={16} />
                                      </button>
                                      <button
                                        onClick={() => openDetailModal(config)}
                                        className="configuracion-card-action-btn"
                                        title="Ver detalles"
                                      >
                                        <Info size={16} />
                                      </button>
                                      {config.editable ? (
                                        <button
                                          onClick={() => openEditModal(config)}
                                          className="configuracion-card-action-btn"
                                          title="Editar"
                                        >
                                          <Edit2 size={16} />
                                        </button>
                                      ) : (
                                        <button
                                          className="configuracion-card-action-btn disabled"
                                          title="No editable"
                                          disabled
                                        >
                                          <Lock size={16} />
                                        </button>
                                      )}
                                      {config.editable && (
                                        <button
                                          onClick={() => openDeleteModal(config)}
                                          className="configuracion-card-action-btn delete"
                                          title="Eliminar"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODALES */}

      {/* MODAL CREAR CONFIGURACIÓN */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3 className="modal-title">
                <Plus size={20} />
                Crear Nueva Configuración
              </h3>
              <button onClick={closeCreateModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="modal-form-group">
                  <label className="modal-form-label">Clave *</label>
                  <input
                    type="text"
                    value={formData.clave}
                    onChange={(e) => setFormData({...formData, clave: e.target.value})}
                    className="modal-form-input"
                    placeholder="ej: app.nombre, db.host, mail.driver"
                    pattern="^[a-z][a-z0-9._]*[a-z0-9]$"
                    title="Use letras minúsculas, números, puntos y guiones bajos"
                  />
                  {errors.clave && (
                    <div className="form-error">{errors.clave[0]}</div>
                  )}
                  <div className="form-hint">
                    Usar formato: grupo.clave (ej: sistema.timezone)
                  </div>
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Tipo *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="modal-form-input"
                  >
                    {tipos.map((tipo, index) => (
                      <option key={`create-tipo-${index}`} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                  {errors.tipo && (
                    <div className="form-error">{errors.tipo[0]}</div>
                  )}
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Grupo *</label>
                  <select
                    value={formData.grupo}
                    onChange={(e) => setFormData({...formData, grupo: e.target.value})}
                    className="modal-form-input"
                  >
                    {gruposPredefinidos.map((grupo, index) => (
                      <option key={`create-grupo-${index}`} value={grupo.value}>
                        {grupo.label}
                      </option>
                    ))}
                  </select>
                  {errors.grupo && (
                    <div className="form-error">{errors.grupo[0]}</div>
                  )}
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Valor</label>
                  {formData.tipo === 'texto' && (
                    <input
                      type="text"
                      value={formData.valor}
                      onChange={(e) => setFormData({...formData, valor: e.target.value})}
                      className="modal-form-input"
                      placeholder="Ingrese el valor..."
                    />
                  )}
                  {formData.tipo === 'numero' && (
                    <input
                      type="number"
                      value={formData.valor}
                      onChange={(e) => setFormData({...formData, valor: e.target.value})}
                      className="modal-form-input"
                      placeholder="Ingrese un número..."
                    />
                  )}
                  {formData.tipo === 'boolean' && (
                    <select
                      value={formData.valor}
                      onChange={(e) => setFormData({...formData, valor: e.target.value})}
                      className="modal-form-input"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="true">Verdadero (Sí)</option>
                      <option value="false">Falso (No)</option>
                    </select>
                  )}
                  {formData.tipo === 'json' && (
                    <textarea
                      value={formData.valor}
                      onChange={(e) => setFormData({...formData, valor: e.target.value})}
                      className="modal-form-input"
                      rows="3"
                      placeholder='{"clave": "valor"}'
                    />
                  )}
                  {formData.tipo === 'fecha' && (
                    <input
                      type="datetime-local"
                      value={formData.valor}
                      onChange={(e) => setFormData({...formData, valor: e.target.value})}
                      className="modal-form-input"
                    />
                  )}
                  {errors.valor && (
                    <div className="form-error">{errors.valor[0]}</div>
                  )}
                </div>

                <div className="modal-form-group full-width">
                  <label className="modal-form-label">Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    className="modal-form-input"
                    rows="3"
                    placeholder="Describe el propósito de esta configuración..."
                  />
                  {errors.descripcion && (
                    <div className="form-error">{errors.descripcion[0]}</div>
                  )}
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.editable}
                      onChange={(e) => setFormData({...formData, editable: e.target.checked})}
                      className="modal-checkbox"
                    />
                    <span>Editable</span>
                  </label>
                  <div className="form-hint">
                    Si está desmarcado, la configuración no podrá ser modificada
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={closeCreateModal}
                className="modal-btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={createConfiguracion}
                className="modal-btn-primary"
              >
                <Save size={18} />
                Crear Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR CONFIGURACIÓN */}
      {showEditModal && selectedConfig && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <Edit2 size={20} />
                Editar Configuración
              </h3>
              <button onClick={closeEditModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-container">
                <div className="detail-header">
                  <div className="detail-info">
                    <h4 className="detail-clave">
                      <KeyIcon size={16} />
                      {selectedConfig.clave}
                    </h4>
                    <div className="detail-meta">
                      <span className="detail-tipo">
                        {getTipoConfig(selectedConfig.tipo).label}
                      </span>
                      <span className="detail-grupo">
                        {getGrupoConfig(selectedConfig.grupo).label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-form-grid">
                  <div className="modal-form-group full-width">
                    <label className="modal-form-label">Valor</label>
                    {selectedConfig.tipo === 'texto' && (
                      <input
                        type="text"
                        value={editFormData.valor}
                        onChange={(e) => setEditFormData({...editFormData, valor: e.target.value})}
                        className="modal-form-input"
                        placeholder="Ingrese el valor..."
                      />
                    )}
                    {selectedConfig.tipo === 'numero' && (
                      <input
                        type="number"
                        value={editFormData.valor}
                        onChange={(e) => setEditFormData({...editFormData, valor: e.target.value})}
                        className="modal-form-input"
                        placeholder="Ingrese un número..."
                      />
                    )}
                    {selectedConfig.tipo === 'boolean' && (
                      <select
                        value={editFormData.valor}
                        onChange={(e) => setEditFormData({...editFormData, valor: e.target.value})}
                        className="modal-form-input"
                      >
                        <option value="true">Verdadero (Sí)</option>
                        <option value="false">Falso (No)</option>
                      </select>
                    )}
                    {selectedConfig.tipo === 'json' && (
                      <textarea
                        value={editFormData.valor}
                        onChange={(e) => setEditFormData({...editFormData, valor: e.target.value})}
                        className="modal-form-input"
                        rows="5"
                        placeholder='{"clave": "valor"}'
                      />
                    )}
                    {selectedConfig.tipo === 'fecha' && (
                      <input
                        type="datetime-local"
                        value={editFormData.valor}
                        onChange={(e) => setEditFormData({...editFormData, valor: e.target.value})}
                        className="modal-form-input"
                      />
                    )}
                    {editErrors.valor && (
                      <div className="form-error">{editErrors.valor[0]}</div>
                    )}
                  </div>

                  <div className="modal-form-group full-width">
                    <label className="modal-form-label">Descripción</label>
                    <textarea
                      value={editFormData.descripcion}
                      onChange={(e) => setEditFormData({...editFormData, descripcion: e.target.value})}
                      className="modal-form-input"
                      rows="3"
                      placeholder="Describe el propósito de esta configuración..."
                    />
                    {editErrors.descripcion && (
                      <div className="form-error">{editErrors.descripcion[0]}</div>
                    )}
                  </div>

                  <div className="modal-form-group full-width">
                    <div className="form-info">
                      <Info size={16} />
                      <span>
                        Valor actual: <code>{formatValor(selectedConfig.valor, selectedConfig.tipo)}</code>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={closeEditModal}
                className="modal-btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={updateConfiguracion}
                className="modal-btn-primary"
              >
                <Save size={18} />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLES */}
      {showDetailModal && selectedConfig && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <Info size={20} />
                Detalles de Configuración
              </h3>
              <button onClick={closeDetailModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-container">
                <div className="detail-header">
                  <div className="detail-icon" style={{
                    backgroundColor: `${getGrupoConfig(selectedConfig.grupo).color}20`,
                    color: getGrupoConfig(selectedConfig.grupo).color
                  }}>
                    {getIconoGrupo(selectedConfig.grupo)}
                  </div>
                  <div className="detail-title">
                    <h4>{selectedConfig.clave}</h4>
                    <div className="detail-tags">
                      <span className="detail-tag tipo" style={{
                        backgroundColor: `${getTipoConfig(selectedConfig.tipo).color}20`,
                        color: getTipoConfig(selectedConfig.tipo).color
                      }}>
                        {getTipoConfig(selectedConfig.tipo).label}
                      </span>
                      <span className="detail-tag grupo">
                        {getGrupoConfig(selectedConfig.grupo).label}
                      </span>
                      {!selectedConfig.editable && (
                        <span className="detail-tag bloqueado">
                          <Lock size={12} />
                          No editable
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Clave:</label>
                    <span className="detail-clave-text">{selectedConfig.clave}</span>
                  </div>
                  <div className="detail-item">
                    <label>Tipo:</label>
                    <span className="detail-tipo-text">
                      {getIconoTipo(selectedConfig.tipo)}
                      {getTipoConfig(selectedConfig.tipo).label}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Grupo:</label>
                    <span className="detail-grupo-text">
                      {getIconoGrupo(selectedConfig.grupo)}
                      {getGrupoConfig(selectedConfig.grupo).label}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Editable:</label>
                    <span className={`detail-editable ${selectedConfig.editable ? 'si' : 'no'}`}>
                      {selectedConfig.editable ? 'Sí' : 'No'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Creado:</label>
                    <span>{new Date(selectedConfig.created_at).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Actualizado:</label>
                    <span>{new Date(selectedConfig.updated_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <label>Valor:</label>
                  <div className="detail-valor-box">
                    <pre>{formatValor(selectedConfig.valor, selectedConfig.tipo)}</pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedConfig.valor);
                        alert('Valor copiado al portapapeles');
                      }}
                      className="detail-copy-btn"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {selectedConfig.descripcion && (
                  <div className="detail-section">
                    <label>Descripción:</label>
                    <p className="detail-description">{selectedConfig.descripcion}</p>
                  </div>
                )}

                <div className="detail-actions">
                  {selectedConfig.editable && (
                    <button
                      onClick={() => {
                        closeDetailModal();
                        openEditModal(selectedConfig);
                      }}
                      className="detail-action-btn"
                    >
                      <Edit2 size={18} />
                      Editar
                    </button>
                  )}
                  {selectedConfig.editable && (
                    <button
                      onClick={() => {
                        closeDetailModal();
                        openDeleteModal(selectedConfig);
                      }}
                      className="detail-action-btn delete"
                    >
                      <Trash2 size={18} />
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {showDeleteModal && selectedConfig && (
        <div className="modal-overlay">
          <div className="modal-content small">
            <div className="modal-header">
              <h3 className="modal-title">
                <Trash2 size={20} />
                Confirmar Eliminación
              </h3>
              <button onClick={closeDeleteModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-confirmation">
                <div className="delete-icon">
                  <AlertCircle size={48} />
                </div>
                <h4>¿Estás seguro de eliminar esta configuración?</h4>
                <p>
                  Se eliminará permanentemente: <strong>{selectedConfig.clave}</strong>
                </p>
                <div className="delete-info">
                  <div className="delete-info-item">
                    {getIconoGrupo(selectedConfig.grupo)}
                    <span>{getGrupoConfig(selectedConfig.grupo).label}</span>
                  </div>
                  <div className="delete-info-item">
                    {getIconoTipo(selectedConfig.tipo)}
                    <span>{getTipoConfig(selectedConfig.tipo).label}</span>
                  </div>
                </div>
                <div className="delete-valor">
                  <label>Valor actual:</label>
                  <code>{formatValor(selectedConfig.valor, selectedConfig.tipo)}</code>
                </div>
                <p className="delete-warning">
                  <AlertCircle size={16} />
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={closeDeleteModal}
                className="modal-btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={deleteConfiguracion}
                className="modal-btn-danger"
              >
                <Trash2 size={18} />
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN MASIVA */}
      {showBulkEditModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3 className="modal-title">
                <Edit2 size={20} />
                Edición Masiva
              </h3>
              <button onClick={closeBulkEditModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="bulk-edit-header">
                <p>
                  Editando <strong>{configuracionesSeleccionadas.length}</strong> configuraciones seleccionadas
                </p>
              </div>
              
              <div className="bulk-edit-grid">
                {configuracionesSeleccionadas.map((config) => (
                  <div key={`bulk-edit-${config.id}`} className="bulk-edit-item">
                    <div className="bulk-edit-item-header">
                      <div className="bulk-edit-clave">
                        <KeyIcon size={14} />
                        <span>{config.clave}</span>
                      </div>
                      <div className="bulk-edit-tipo">
                        {getTipoConfig(config.tipo).label}
                      </div>
                    </div>
                    
                    <div className="bulk-edit-item-body">
                      <label>Valor:</label>
                      {config.tipo === 'texto' && (
                        <input
                          type="text"
                          value={bulkEditData[config.id]?.valor || config.valor || ''}
                          onChange={(e) => setBulkEditData({
                            ...bulkEditData,
                            [config.id]: { valor: e.target.value }
                          })}
                          className="bulk-edit-input"
                          placeholder="Nuevo valor..."
                        />
                      )}
                      {config.tipo === 'numero' && (
                        <input
                          type="number"
                          value={bulkEditData[config.id]?.valor || config.valor || ''}
                          onChange={(e) => setBulkEditData({
                            ...bulkEditData,
                            [config.id]: { valor: e.target.value }
                          })}
                          className="bulk-edit-input"
                          placeholder="Nuevo número..."
                        />
                      )}
                      {config.tipo === 'boolean' && (
                        <select
                          value={bulkEditData[config.id]?.valor || config.valor || ''}
                          onChange={(e) => setBulkEditData({
                            ...bulkEditData,
                            [config.id]: { valor: e.target.value }
                          })}
                          className="bulk-edit-input"
                        >
                          <option value="true">Verdadero (Sí)</option>
                          <option value="false">Falso (No)</option>
                        </select>
                      )}
                      {config.tipo === 'json' && (
                        <textarea
                          value={bulkEditData[config.id]?.valor || config.valor || ''}
                          onChange={(e) => setBulkEditData({
                            ...bulkEditData,
                            [config.id]: { valor: e.target.value }
                          })}
                          className="bulk-edit-input"
                          rows="2"
                          placeholder='{"nuevo": "valor"}'
                        />
                      )}
                      {config.tipo === 'fecha' && (
                        <input
                          type="datetime-local"
                          value={bulkEditData[config.id]?.valor || config.valor || ''}
                          onChange={(e) => setBulkEditData({
                            ...bulkEditData,
                            [config.id]: { valor: e.target.value }
                          })}
                          className="bulk-edit-input"
                        />
                      )}
                    </div>
                    
                    <div className="bulk-edit-item-footer">
                      <span className="bulk-edit-valor-actual">
                        Actual: {formatValor(config.valor, config.tipo)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={closeBulkEditModal}
                className="modal-btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkEdit}
                className="modal-btn-primary"
              >
                <Save size={18} />
                Guardar Cambios ({configuracionesSeleccionadas.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuracion;