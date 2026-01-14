import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Eye, Search, Filter, RefreshCw, Calendar,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle,
  XCircle, Clock, DollarSign, CreditCard, Receipt,
  FileText, Wallet, CheckSquare, X, Trash2,
  Edit2, Download, Printer, BarChart, TrendingUp,
  TrendingDown, Shield, Users, Tag, List, Grid,
  ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight,
  MoreVertical, Copy, ExternalLink, Activity, Zap,
  AlertCircle, Info, Mail, Phone, MapPin, Globe,
  Upload, Share2, Settings, Bell, Star, Award,
  Target, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/pago.css';

const API_PAGOS = 'http://127.0.0.1:8000/api/pagos';
const API_FACTURAS = 'http://127.0.0.1:8000/api/facturas';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  console.log('🔐 Token obtenido:', token ? 'Sí' : 'No');
  console.log('🔐 Token (primeros 20 chars):', token ? `${token.substring(0, 20)}...` : 'No hay token');
  
  if (!token) {
    console.error('❌ No hay token, redirigiendo a login');
    window.location.href = '/login';
    return {};
  }
  
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};
const Pago = () => {
  // Estados principales
  const [pagos, setPagos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showVerificarModal, setShowVerificarModal] = useState(false);
  const [showRechazarModal, setShowRechazarModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  
  const [selectedPago, setSelectedPago] = useState(null);
  const [selectedFactura, setSelectedFactura] = useState(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [facturaFilter, setFacturaFilter] = useState('all');
  const [metodoFilter, setMetodoFilter] = useState('all');
  const [fechaDesdeFilter, setFechaDesdeFilter] = useState('');
  const [fechaHastaFilter, setFechaHastaFilter] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list', 'grid', 'cards'
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 15;
  
  // Formularios
  const [formObservaciones, setFormObservaciones] = useState('');
  const [formEdit, setFormEdit] = useState({
    estado: '',
    observaciones: ''
  });
  
  const [errors, setErrors] = useState({});

  // Estados disponibles
  const estados = [
    { value: 'verificado', label: 'Verificado', color: '#10b981', icon: CheckCircle, badge: 'success' },
    { value: 'pendiente', label: 'Pendiente', color: '#f59e0b', icon: Clock, badge: 'warning' },
    { value: 'rechazado', label: 'Rechazado', color: '#ef4444', icon: XCircle, badge: 'danger' }
  ];

  // Métodos de pago
  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo', icon: DollarSign, color: '#10b981' },
    { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard, color: '#3b82f6' },
    { value: 'transferencia', label: 'Transferencia', icon: Receipt, color: '#8b5cf6' },
    { value: 'cheque', label: 'Cheque', icon: FileText, color: '#f59e0b' },
    { value: 'otro', label: 'Otro', icon: Wallet, color: '#64748b' }
  ];

  // Función para normalizar datos
  const normalizarPago = (pago) => {
  console.log('🔄 Normalizando pago RAW:', pago);
  console.log('🔄 Keys del pago:', Object.keys(pago));
  
  // Muestra todo el contenido del pago
  for (const key in pago) {
    console.log(`🔄 ${key}:`, pago[key], 'Tipo:', typeof pago[key]);
  }
  
  const normalized = {
    ...pago,
    // Asegurar que tenemos id e id_pago
    id: pago.id || pago.id_pago || pago.ID,
    id_pago: pago.id_pago || pago.id || pago.ID,
    // Normalizar IDs de relaciones
    id_factura: pago.id_factura || pago.factura?.id_factura || pago.id_factura,
    // Asegurar que las propiedades críticas existan
    numero_pago: pago.numero_pago || pago.numero || `PAGO-${pago.id_pago || pago.id || ''}`,
    monto: pago.monto || pago.monto_pago || 0,
    estado: pago.estado || 'pendiente',
    metodo_pago: pago.metodo_pago || pago.metodo || 'otro',
    fecha_pago: pago.fecha_pago || pago.fecha || pago.created_at || pago.fecha_creacion,
    // Preservar la relación completa si existe
    factura: pago.factura || null
  };
  
  console.log('🔄 Pago normalizado:', normalized);
  return normalized;
};



 
  // Cargar datos iniciales
  useEffect(() => {
    console.log('useEffect inicial - Cargando datos');
    loadPagos();
    loadFacturas();
  }, []);

  // Cargar pagos
 const loadPagos = async () => {
  console.log('====== loadPagos INICIO ======');
  setLoading(true);
  setError(null);
  
  try {
    // Construir query params dinámicamente, excluyendo los vacíos
    const params = {
      page: currentPage
    };
    
    // Solo agregar filtros si no son 'all' o vacíos
    if (estadoFilter !== 'all' && estadoFilter.trim() !== '') {
      params.estado = estadoFilter;
    }
    
    if (facturaFilter !== 'all' && facturaFilter.trim() !== '') {
      params.id_factura = facturaFilter;
    }
    
    if (metodoFilter !== 'all' && metodoFilter.trim() !== '') {
      params.metodo_pago = metodoFilter;
    }
    
    if (searchTerm.trim() !== '') {
      params.search = searchTerm;
    }
    
    const queryParams = new URLSearchParams(params);
    const url = `${API_PAGOS}?${queryParams}`;
    
    console.log('🔍 URL COMPLETA DE LA API:', url);
    console.log('🔍 Parámetros enviados:', params);
    
    const response = await fetch(url, {
      headers: authHeaders()
    });
    
    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📦 DATOS COMPLETOS de la API:', data);
    
    let pagosData = [];
    
    if (data.data && Array.isArray(data.data)) {
      console.log('✅ Formato paginado encontrado');
      console.log('📊 Cantidad de pagos recibidos:', data.data.length);
      
      pagosData = data.data.map(normalizarPago);
      
      // Usar data.total si existe y es mayor que 0, sino usar data.data.length
      const totalRegistros = data.total > 0 ? data.total : data.data.length;
      setTotalPages(data.last_page || 1);
      
      console.log('📝 Total de registros:', totalRegistros);
      console.log('📝 Total de páginas:', data.last_page);
    } else if (Array.isArray(data)) {
      console.log('✅ Formato array directo');
      pagosData = data.map(normalizarPago);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
    } else {
      console.error('❌ Formato de datos desconocido:', data);
      setTotalPages(1);
    }
    
    console.log('📝 Pagos normalizados:', pagosData);
    console.log('📝 Cantidad de pagos normalizados:', pagosData.length);
    
    setPagos(pagosData);
    
  } catch (err) {
    console.error('❌ Error en loadPagos:', err);
    setError(err.message);
  } finally {
    console.log('====== loadPagos FIN ======');
    setLoading(false);
  }
};
  // Cargar facturas
  const loadFacturas = async () => {
    console.log('loadFacturas ejecutado');
    
    try {
      const response = await fetch(API_FACTURAS, {
        headers: authHeaders()
      });
      
      console.log('Response facturas:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Datos facturas:', data);
        
        let facturasData = [];
        
        if (data.data && Array.isArray(data.data)) {
          facturasData = data.data.map(f => ({
            ...f,
            id: f.id_factura || f.id,
            id_factura: f.id_factura || f.id
          }));
        } else if (Array.isArray(data)) {
          facturasData = data.map(f => ({
            ...f,
            id: f.id_factura || f.id,
            id_factura: f.id_factura || f.id
          }));
        }
        
        console.log('Facturas normalizadas:', facturasData);
        setFacturas(facturasData);
      }
    } catch (error) {
      console.error('Error en loadFacturas:', error);
    }
  };

  // Cargar detalles del pago
  const loadPagoDetalle = async (id) => {
    console.log('loadPagoDetalle para ID:', id);
    
    try {
      const response = await fetch(`${API_PAGOS}/${id}`, {
        headers: authHeaders()
      });
      
      console.log('Response detalle:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Detalle del pago:', data);
        const pagoNormalizado = normalizarPago(data);
        setSelectedPago(pagoNormalizado);
        setShowDetailModal(true);
      } else {
        console.error('Error cargando detalle:', response.statusText);
      }
    } catch (error) {
      console.error('Error en loadPagoDetalle:', error);
      alert('Error al cargar detalles del pago');
    }
  };

  // Aplicar filtros
  const applyFilters = () => {
    console.log('Aplicando filtros');
    setCurrentPage(1);
    loadPagos();
  };

  // Resetear filtros
  const resetFilters = () => {
    console.log('Reseteando filtros');
    setSearchTerm('');
    setEstadoFilter('all');
    setFacturaFilter('all');
    setMetodoFilter('all');
    setFechaDesdeFilter('');
    setFechaHastaFilter('');
    setCurrentPage(1);
    loadPagos();
  };

  // Operaciones CRUD
  const verificarPago = async () => {
    console.log('verificarPago ejecutado');
    if (!selectedPago) return;
    
    const pagoId = selectedPago.id_pago || selectedPago.id;
    console.log('Verificando pago ID:', pagoId);
    
    try {
      const response = await fetch(`${API_PAGOS}/${pagoId}/verificar`, {
        method: 'POST',
        headers: authHeaders()
      });
      
      console.log('Response verificar:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Pago verificado:', data);
        alert('✅ Pago verificado exitosamente');
        closeVerificarModal();
        loadPagos();
      } else {
        const errorData = await response.json();
        console.error('Error al verificar:', errorData);
        alert(`❌ ${errorData.message || 'Error al verificar pago'}`);
      }
    } catch (error) {
      console.error('Error verificando pago:', error);
      alert('❌ Error de conexión');
    }
  };

  const rechazarPago = async () => {
    console.log('rechazarPago ejecutado');
    if (!selectedPago || !formObservaciones.trim()) {
      alert('Por favor, ingrese las observaciones para rechazar el pago');
      return;
    }
    
    const pagoId = selectedPago.id_pago || selectedPago.id;
    console.log('Rechazando pago ID:', pagoId);
    
    try {
      const response = await fetch(`${API_PAGOS}/${pagoId}/rechazar`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ observaciones: formObservaciones })
      });
      
      console.log('Response rechazar:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Pago rechazado:', data);
        alert('✅ Pago rechazado exitosamente');
        closeRechazarModal();
        loadPagos();
      } else {
        const errorData = await response.json();
        console.error('Error al rechazar:', errorData);
        alert(`❌ ${errorData.message || 'Error al rechazar pago'}`);
      }
    } catch (error) {
      console.error('Error rechazando pago:', error);
      alert('❌ Error de conexión');
    }
  };

  const updatePago = async () => {
    console.log('updatePago ejecutado');
    if (!selectedPago || !formEdit.estado) return;
    
    const pagoId = selectedPago.id_pago || selectedPago.id;
    console.log('Actualizando pago ID:', pagoId);
    
    try {
      const response = await fetch(`${API_PAGOS}/${pagoId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(formEdit)
      });
      
      console.log('Response actualizar:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Pago actualizado:', data);
        alert('✅ Pago actualizado exitosamente');
        closeEditModal();
        loadPagos();
      } else {
        const errorData = await response.json();
        console.error('Error al actualizar:', errorData);
        alert(`❌ ${errorData.message || 'Error al actualizar pago'}`);
      }
    } catch (error) {
      console.error('Error updating pago:', error);
      alert('❌ Error de conexión');
    }
  };

  const deletePago = async () => {
    console.log('deletePago ejecutado');
    if (!selectedPago) return;
    
    const pagoId = selectedPago.id_pago || selectedPago.id;
    console.log('Eliminando pago ID:', pagoId);
    
    try {
      const response = await fetch(`${API_PAGOS}/${pagoId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      console.log('Response eliminar:', response.status);
      
      if (response.ok) {
        console.log('Pago eliminado');
        alert('✅ Pago eliminado exitosamente');
        closeDeleteModal();
        loadPagos();
      } else {
        const errorData = await response.json();
        console.error('Error al eliminar:', errorData);
        alert(`❌ ${errorData.message || 'Error al eliminar pago'}`);
      }
    } catch (error) {
      console.error('Error deleting pago:', error);
      alert('❌ Error de conexión');
    }
  };

  // Modal functions
  const openDetailModal = (pago) => {
    console.log('openDetailModal ejecutado:', pago);
    setSelectedPago(pago);
    setShowDetailModal(true);
  };

  const openVerificarModal = (pago) => {
    console.log('openVerificarModal ejecutado:', pago);
    setSelectedPago(pago);
    setShowVerificarModal(true);
  };

  const openRechazarModal = (pago) => {
    console.log('openRechazarModal ejecutado:', pago);
    setSelectedPago(pago);
    setFormObservaciones('');
    setShowRechazarModal(true);
  };

  const openEditModal = (pago) => {
    console.log('openEditModal ejecutado:', pago);
    setSelectedPago(pago);
    setFormEdit({
      estado: pago.estado,
      observaciones: pago.observaciones || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (pago) => {
    console.log('openDeleteModal ejecutado:', pago);
    
    if (pago.estado === 'verificado') {
      alert('⚠️ No se puede eliminar un pago verificado');
      return;
    }
    
    setSelectedPago(pago);
    setShowDeleteModal(true);
  };

  const closeDetailModal = () => {
    console.log('closeDetailModal ejecutado');
    setShowDetailModal(false);
    setSelectedPago(null);
  };

  const closeDeleteModal = () => {
    console.log('closeDeleteModal ejecutado');
    setShowDeleteModal(false);
    setSelectedPago(null);
  };

  const closeVerificarModal = () => {
    console.log('closeVerificarModal ejecutado');
    setShowVerificarModal(false);
    setSelectedPago(null);
  };

  const closeRechazarModal = () => {
    console.log('closeRechazarModal ejecutado');
    setShowRechazarModal(false);
    setSelectedPago(null);
    setFormObservaciones('');
  };

  const closeEditModal = () => {
    console.log('closeEditModal ejecutado');
    setShowEditModal(false);
    setSelectedPago(null);
    setFormEdit({ estado: '', observaciones: '' });
  };

  const closeEstadisticasModal = () => {
    console.log('closeEstadisticasModal ejecutado');
    setShowEstadisticasModal(false);
  };

  // Helper functions
  const getEstadoColor = (estado) => {
    const estadoObj = estados.find(e => e.value === estado);
    return estadoObj ? estadoObj.color : '#6b7280';
  };

  const getEstadoLabel = (estado) => {
    const estadoObj = estados.find(e => e.value === estado);
    return estadoObj ? estadoObj.label : estado;
  };

  const getEstadoIcon = (estado) => {
    const estadoObj = estados.find(e => e.value === estado);
    return estadoObj ? estadoObj.icon : Clock;
  };

  const getEstadoBadge = (estado) => {
    const estadoObj = estados.find(e => e.value === estado);
    return estadoObj ? estadoObj.badge : 'neutral';
  };

  const getMetodoPagoIcon = (metodo) => {
    const metodoObj = metodosPago.find(m => m.value === metodo);
    return metodoObj ? metodoObj.icon : Wallet;
  };

  const getMetodoPagoLabel = (metodo) => {
    const metodoObj = metodosPago.find(m => m.value === metodo);
    return metodoObj ? metodoObj.label : 'Otro';
  };

  const getMetodoPagoColor = (metodo) => {
    const metodoObj = metodosPago.find(m => m.value === metodo);
    return metodoObj ? metodoObj.color : '#64748b';
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFechaSimple = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Estadísticas
  const stats = useMemo(() => {
    console.log('Calculando estadísticas con pagos:', pagos);
    
    const total = pagos.length;
    const verificados = pagos.filter(p => p.estado === 'verificado').length;
    const pendientes = pagos.filter(p => p.estado === 'pendiente').length;
    const rechazados = pagos.filter(p => p.estado === 'rechazado').length;
    
    // Totales monetarios
    const totalMonto = pagos.reduce((sum, pago) => sum + (pago.monto || 0), 0);
    const montoVerificados = pagos
      .filter(p => p.estado === 'verificado')
      .reduce((sum, pago) => sum + (pago.monto || 0), 0);
    const montoPendientes = pagos
      .filter(p => p.estado === 'pendiente')
      .reduce((sum, pago) => sum + (pago.monto || 0), 0);
    
    // Pagos del mes actual
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    const pagosMes = pagos.filter(p => {
      if (!p.fecha_pago) return false;
      const fechaPago = new Date(p.fecha_pago);
      return fechaPago >= primerDiaMes && fechaPago <= ultimoDiaMes;
    });
    
    const totalMes = pagosMes.reduce((sum, pago) => sum + (pago.monto || 0), 0);
    const verificadosMes = pagosMes.filter(p => p.estado === 'verificado').length;
    
    // Métodos de pago más utilizados
    const metodosCount = {};
    pagos.forEach(pago => {
      const metodo = pago.metodo_pago || 'otro';
      metodosCount[metodo] = (metodosCount[metodo] || 0) + 1;
    });
    
    const metodoMasUsado = Object.entries(metodosCount)
      .sort(([,a], [,b]) => b - a)[0] || ['efectivo', 0];
    
    const statsResult = { 
      total, 
      verificados, 
      pendientes, 
      rechazados,
      totalMonto,
      montoVerificados,
      montoPendientes,
      pagosMes: pagosMes.length,
      totalMes,
      verificadosMes,
      metodoMasUsado: {
        metodo: metodoMasUsado[0],
        count: metodoMasUsado[1]
      }
    };
    
    console.log('Estadísticas calculadas:', statsResult);
    return statsResult;
  }, [pagos]);

  // Métodos de pago estadísticas
  const metodosStats = useMemo(() => {
    const stats = {};
    metodosPago.forEach(metodo => {
      const pagosMetodo = pagos.filter(p => p.metodo_pago === metodo.value);
      stats[metodo.value] = {
        label: metodo.label,
        color: metodo.color,
        count: pagosMetodo.length,
        total: pagosMetodo.reduce((sum, pago) => sum + (pago.monto || 0), 0),
        verificados: pagosMetodo.filter(p => p.estado === 'verificado').length,
        porcentaje: pagos.length > 0 ? (pagosMetodo.length / pagos.length) * 100 : 0
      };
    });
    return stats;
  }, [pagos]);

  // Facturas con pagos pendientes
  const facturasConPagos = useMemo(() => {
    return facturas.filter(factura => {
      const pagosFactura = pagos.filter(p => p.id_factura === factura.id_factura);
      return pagosFactura.length > 0;
    }).slice(0, 5); // Mostrar solo las primeras 5
  }, [facturas, pagos]);

  // Agregar useEffect para depurar cambios
  useEffect(() => {
    console.log('🔄 ESTADO pagos CAMBIÓ:', {
      length: pagos.length,
      datos: pagos.map(p => ({ 
        id: p.id_pago || p.id,
        numero_pago: p.numero_pago,
        monto: p.monto,
        estado: p.estado
      }))
    });
  }, [pagos]);

  useEffect(() => {
    console.log('🔄 ESTADO loading CAMBIÓ:', loading);
  }, [loading]);

  useEffect(() => {
    console.log('🔄 ESTADO error CAMBIÓ:', error);
  }, [error]);

  console.log('Render - Estado actual:', {
    loading,
    error,
    pagosLength: pagos.length,
    pagos: pagos,
    stats
  });

  // Verificar estructura de datos en el render
  console.log('=== INSPECCIÓN RENDER ===');
  console.log('Pagos para renderizar:', pagos);
  if (pagos.length > 0) {
    console.log('Primer pago estructura:', pagos[0]);
    console.log('Keys del primer pago:', Object.keys(pagos[0]));
  }

  return (
    <div className="pago-container">
      <Sidebar />
      
      <div className="pago-content">
        <Topbar />
        
        <div className="pago-main">
          {/* HEADER */}
          <div className="pago-header">
            <div>
              <h1 className="pago-title">
                <CreditCard size={28} />
                Gestión de Pagos
              </h1>
              <p className="pago-subtitle">
                Administra y verifica los pagos registrados
              </p>
            </div>
            <div className="pago-header-actions">
              <button 
                onClick={() => setShowEstadisticasModal(true)}
                className="pago-btn-secondary"
              >
                <BarChart size={20} />
                Ver Estadísticas
              </button>
            </div>

          </div>

          {/* ESTADÍSTICAS */}
          <div className="pago-stats-grid">
            <div className="pago-stat-card">
              <div className="pago-stat-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                <DollarSign size={24} />
              </div>
              <div>
                <h3 className="pago-stat-number">{formatCurrency(stats.totalMonto)}</h3>
                <p className="pago-stat-label">Total Pagos</p>
              </div>
            </div>
            <div className="pago-stat-card">
              <div className="pago-stat-icon" style={{background: '#dcfce7', color: '#10b981'}}>
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="pago-stat-number">{stats.verificados}</h3>
                <p className="pago-stat-label">Verificados</p>
              </div>
            </div>
            <div className="pago-stat-card">
              <div className="pago-stat-icon" style={{background: '#fef3c7', color: '#f59e0b'}}>
                <Clock size={24} />
              </div>
              <div>
                <h3 className="pago-stat-number">{stats.pendientes}</h3>
                <p className="pago-stat-label">Pendientes</p>
              </div>
            </div>
            <div className="pago-stat-card">
              <div className="pago-stat-icon" style={{background: '#fee2e2', color: '#ef4444'}}>
                <XCircle size={24} />
              </div>
              <div>
                <h3 className="pago-stat-number">{stats.rechazados}</h3>
                <p className="pago-stat-label">Rechazados</p>
              </div>
            </div>
          </div>

          {/* FILTROS */}
          <div className="pago-filters">
            <div className="pago-filters-row">
              <div className="pago-search-container">
                <Search className="pago-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por número, referencia o factura..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  className="pago-search-input"
                />
              </div>
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="pago-filter-select"
              >
                <option value="all">Todos los estados</option>
                {estados.map(estado => (
                  <option key={estado.value} value={estado.value}>{estado.label}</option>
                ))}
              </select>
              <select
                value={facturaFilter}
                onChange={(e) => setFacturaFilter(e.target.value)}
                className="pago-filter-select"
              >
                <option value="all">Todas las facturas</option>
                {facturas.map(factura => (
                  <option key={factura.id_factura} value={factura.id_factura}>
                    {factura.numero_factura}
                  </option>
                ))}
              </select>
              <select
                value={metodoFilter}
                onChange={(e) => setMetodoFilter(e.target.value)}
                className="pago-filter-select"
              >
                <option value="all">Todos los métodos</option>
                {metodosPago.map(metodo => (
                  <option key={metodo.value} value={metodo.value}>{metodo.label}</option>
                ))}
              </select>
              <button onClick={applyFilters} className="pago-btn-secondary">
                <Filter size={18} />
                Aplicar
              </button>
              <button onClick={resetFilters} className="pago-btn-secondary">
                <RefreshCw size={18} />
                Limpiar
              </button>
            </div>
          </div>

          {/* VISTAS */}
          <div className="pago-view-controls">
            <div className="pago-view-buttons">
              <button
                onClick={() => setViewMode('list')}
                className={`pago-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                title="Vista de lista"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`pago-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                title="Vista de cuadrícula"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`pago-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                title="Vista de tarjetas"
              >
                <CreditCard size={18} />
              </button>
            </div>
            <div className="pago-view-info">
              {pagos.length} pago{pagos.length !== 1 ? 's' : ''} encontrado{pagos.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* CONTENIDO */}
          {loading ? (
            <div className="pago-loading">
              <div className="pago-loading-spinner"></div>
              <p className="pago-loading-text">Cargando pagos...</p>
            </div>
          ) : error ? (
            <div className="pago-error">
              <AlertTriangle size={48} />
              <h3>Error al cargar pagos</h3>
              <p>{error}</p>
              <button onClick={loadPagos} className="pago-btn-primary">
                <RefreshCw size={18} />
                Reintentar
              </button>
            </div>
          ) : pagos.length === 0 ? (
            <div className="pago-empty-state">
              <CreditCard size={64} />
              <h3 className="pago-empty-title">No hay pagos registrados</h3>
              <p className="pago-empty-message">
                {searchTerm || estadoFilter !== 'all' || facturaFilter !== 'all' || metodoFilter !== 'all'
                  ? 'No se encontraron pagos con los filtros aplicados'
                  : 'No se han registrado pagos todavía'}
              </p>
              <button onClick={resetFilters} className="pago-btn-primary">
                <RefreshCw size={18} />
                Ver Todos los Pagos
              </button>
            </div>
          ) : (
            <>
              {/* VISTA DE LISTA */}
              {viewMode === 'list' && (
                <div className="pago-table-container">
                  <table className="pago-table">
                    <thead>
                      <tr>
                        <th>N° Pago</th>
                        <th>Factura</th>
                        <th>Deportista</th>
                        <th>Fecha Pago</th>
                        <th>Método</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagos.map((pago, index) => {
                        const EstadoIcon = getEstadoIcon(pago.estado);
                        const MetodoIcon = getMetodoPagoIcon(pago.metodo_pago);
                        const pagoId = pago.id_pago || pago.id;
                        
                        console.log(`Renderizando pago ${index}:`, {
                          id: pagoId,
                          tieneId: !!pagoId,
                          numero_pago: pago.numero_pago,
                          monto: pago.monto,
                          estado: pago.estado
                        });
                        
                        return (
                          <tr key={pagoId || `pago-${index}`} className="pago-table-row">
                            <td>
                              <div className="pago-numero">
                                <Tag size={12} />
                                <strong>{pago.numero_pago || `PAGO-${pagoId}`}</strong>
                              </div>
                            </td>
                            <td>
                              {pago.factura ? (
                                <div className="pago-factura">
                                  <FileText size={14} />
                                  <span>{pago.factura.numero_factura}</span>
                                  <div className="pago-factura-deportista">
                                    <Users size={12} />
                                    {pago.factura.deportista?.nombre || ''} {pago.factura.deportista?.apellido || ''}
                                  </div>
                                </div>
                              ) : (
                                <span className="pago-sin-factura">Sin factura</span>
                              )}
                            </td>
                            <td>
                              {pago.factura?.deportista ? (
                                <div className="pago-deportista">
                                  <Users size={14} />
                                  <span>{pago.factura.deportista.nombre || ''} {pago.factura.deportista.apellido || ''}</span>
                                </div>
                              ) : (
                                <span className="pago-sin-deportista">No disponible</span>
                              )}
                            </td>
                            <td>
                              <div className="pago-fecha">
                                <Calendar size={12} />
                                {formatFechaSimple(pago.fecha_pago)}
                              </div>
                            </td>
                            <td>
                              <div 
                                className="pago-metodo"
                                style={{ color: getMetodoPagoColor(pago.metodo_pago) }}
                              >
                                <MetodoIcon size={14} />
                                <span>{getMetodoPagoLabel(pago.metodo_pago)}</span>
                              </div>
                            </td>
                            <td>
                              <div className="pago-monto">
                                <DollarSign size={14} />
                                <strong>{formatCurrency(pago.monto || 0)}</strong>
                              </div>
                            </td>
                            <td>
                              <div 
                                className={`pago-estado-badge ${getEstadoBadge(pago.estado)}`}
                                style={{
                                  backgroundColor: getEstadoColor(pago.estado) + '20',
                                  color: getEstadoColor(pago.estado)
                                }}
                              >
                                <EstadoIcon size={14} />
                                <span>{getEstadoLabel(pago.estado)}</span>
                              </div>
                            </td>
                            <td>
                              <div className="pago-actions">
                                <button
                                  onClick={() => openDetailModal(pago)}
                                  className="pago-action-btn"
                                  title="Ver detalles"
                                >
                                  <Eye size={16} />
                                </button>
                                
                                {pago.estado === 'pendiente' && (
                                  <>
                                    <button
                                      onClick={() => openVerificarModal(pago)}
                                      className="pago-action-btn success"
                                      title="Verificar pago"
                                    >
                                      <CheckCircle size={16} />
                                    </button>
                                    <button
                                      onClick={() => openRechazarModal(pago)}
                                      className="pago-action-btn danger"
                                      title="Rechazar pago"
                                    >
                                      <XCircle size={16} />
                                    </button>
                                  </>
                                )}
                                
                                <button
                                  onClick={() => openEditModal(pago)}
                                  className="pago-action-btn"
                                  title="Editar"
                                >
                                  <Edit2 size={16} />
                                </button>
                                
                                <button
                                  onClick={() => openDeleteModal(pago)}
                                  className="pago-action-btn delete"
                                  title="Eliminar"
                                  disabled={pago.estado === 'verificado'}
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
              )}

              {/* PAGINACIÓN */}
              {viewMode === 'list' && totalPages > 1 && (
                <div className="pago-pagination">
                  <div className="pago-pagination-info">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="pago-pagination-controls">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="pago-pagination-btn"
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
                          className={`pago-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="pago-pagination-btn"
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

      {/* MODAL DETALLE PAGO */}
      {showDetailModal && selectedPago && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <Eye size={20} />
                Detalles del Pago
              </h3>
              <button onClick={closeDetailModal} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="pago-detail-header">
                <div className="pago-detail-info">
                  <div className="pago-detail-numero">
                    <Tag size={20} />
                    <h2>{selectedPago.numero_pago}</h2>
                  </div>
                  <div 
                    className={`pago-detail-estado ${getEstadoBadge(selectedPago.estado)}`}
                    style={{
                      backgroundColor: getEstadoColor(selectedPago.estado) + '20',
                      color: getEstadoColor(selectedPago.estado)
                    }}
                  >
                    {getEstadoLabel(selectedPago.estado)}
                  </div>
                </div>
                
                <div className="pago-detail-monto">
                  <div className="pago-detail-monto-label">Monto del Pago</div>
                  <div className="pago-detail-monto-value">
                    {formatCurrency(selectedPago.monto)}
                  </div>
                </div>
              </div>
              
              <div className="pago-detail-grid">
                <div className="pago-detail-section">
                  <h4 className="pago-detail-section-title">
                    <CreditCard size={16} />
                    Información del Pago
                  </h4>
                  <div className="pago-detail-section-content">
                    <div className="pago-detail-field">
                      <span className="pago-detail-label">Fecha de Pago:</span>
                      <span className="pago-detail-value">
                        {formatFecha(selectedPago.fecha_pago)}
                      </span>
                    </div>
                    <div className="pago-detail-field">
                      <span className="pago-detail-label">Método de Pago:</span>
                      <span className="pago-detail-value">
                        <div 
                          className="pago-detail-metodo"
                          style={{ color: getMetodoPagoColor(selectedPago.metodo_pago) }}
                        >
                          {getMetodoPagoIcon(selectedPago.metodo_pago)({ size: 14 })}
                          <span>{getMetodoPagoLabel(selectedPago.metodo_pago)}</span>
                        </div>
                      </span>
                    </div>
                    <div className="pago-detail-field">
                      <span className="pago-detail-label">Referencia:</span>
                      <span className="pago-detail-value">
                        {selectedPago.referencia || 'Sin referencia'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="pago-detail-section">
                  <h4 className="pago-detail-section-title">
                    <FileText size={16} />
                    Información de Factura
                  </h4>
                  <div className="pago-detail-section-content">
                    {selectedPago.factura ? (
                      <>
                        <div className="pago-detail-field">
                          <span className="pago-detail-label">N° Factura:</span>
                          <span className="pago-detail-value">
                            {selectedPago.factura.numero_factura}
                          </span>
                        </div>
                        <div className="pago-detail-field">
                          <span className="pago-detail-label">Deportista:</span>
                          <span className="pago-detail-value">
                            {selectedPago.factura.deportista?.nombre} {selectedPago.factura.deportista?.apellido}
                          </span>
                        </div>
                        <div className="pago-detail-field">
                          <span className="pago-detail-label">Total Factura:</span>
                          <span className="pago-detail-value">
                            {formatCurrency(selectedPago.factura.total || 0)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="pago-detail-field">
                        <span className="pago-detail-label">Información:</span>
                        <span className="pago-detail-value">Sin factura asociada</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedPago.observaciones && (
                <div className="pago-detail-section full-width">
                  <h4 className="pago-detail-section-title">
                    <List size={16} />
                    Observaciones
                  </h4>
                  <div className="pago-detail-observaciones">
                    {selectedPago.observaciones}
                  </div>
                </div>
              )}
              
              {selectedPago.comprobante && (
                <div className="pago-detail-section full-width">
                  <h4 className="pago-detail-section-title">
                    <FileText size={16} />
                    Comprobante
                  </h4>
                  <div className="pago-detail-comprobante">
                    <a 
                      href={`http://127.0.0.1:8000/storage/${selectedPago.comprobante}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pago-detail-comprobante-link"
                    >
                      <FileText size={16} />
                      <span>Ver comprobante</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button onClick={closeDetailModal} className="modal-btn-secondary">
                Cerrar
              </button>
              <button 
                onClick={() => {
                  closeDetailModal();
                  openEditModal(selectedPago);
                }}
                className="modal-btn-primary"
              >
                <Edit2 size={18} />
                Editar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VERIFICAR PAGO */}
      {showVerificarModal && selectedPago && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <CheckCircle size={20} />
                Verificar Pago
              </h3>
              <button onClick={closeVerificarModal} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="verificar-modal-content">
                <div className="verificar-modal-icon">
                  <CheckCircle size={48} />
                </div>
                <h4>¿Estás seguro de verificar este pago?</h4>
                <p>Esta acción cambiará el estado del pago a "Verificado" y no se podrá revertir.</p>
                
                <div className="verificar-modal-info">
                  <div className="verificar-modal-item">
                    <span>N° Pago:</span>
                    <strong>{selectedPago.numero_pago}</strong>
                  </div>
                  <div className="verificar-modal-item">
                    <span>Monto:</span>
                    <strong>{formatCurrency(selectedPago.monto)}</strong>
                  </div>
                  <div className="verificar-modal-item">
                    <span>Factura:</span>
                    <strong>{selectedPago.factura?.numero_factura || 'Sin factura'}</strong>
                  </div>
                  <div className="verificar-modal-item">
                    <span>Fecha:</span>
                    <strong>{formatFechaSimple(selectedPago.fecha_pago)}</strong>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeVerificarModal} className="modal-btn-secondary">
                Cancelar
              </button>
              <button onClick={verificarPago} className="modal-btn-primary">
                <CheckCircle size={18} />
                Verificar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RECHAZAR PAGO */}
      {showRechazarModal && selectedPago && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <XCircle size={20} />
                Rechazar Pago
              </h3>
              <button onClick={closeRechazarModal} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="rechazar-modal-content">
                <div className="rechazar-modal-icon">
                  <XCircle size={48} />
                </div>
                <h4>¿Estás seguro de rechazar este pago?</h4>
                <p>Esta acción cambiará el estado del pago a "Rechazado".</p>
                
                <div className="rechazar-modal-info">
                  <div className="rechazar-modal-item">
                    <span>N° Pago:</span>
                    <strong>{selectedPago.numero_pago}</strong>
                  </div>
                  <div className="rechazar-modal-item">
                    <span>Monto:</span>
                    <strong>{formatCurrency(selectedPago.monto)}</strong>
                  </div>
                  <div className="rechazar-modal-item">
                    <span>Deportista:</span>
                    <strong>
                      {selectedPago.factura?.deportista?.nombre} {selectedPago.factura?.deportista?.apellido}
                    </strong>
                  </div>
                </div>
                
                <div className="rechazar-modal-form">
                  <label className="modal-form-label">
                    <List size={14} />
                    Motivo del Rechazo
                  </label>
                  <textarea
                    value={formObservaciones}
                    onChange={(e) => setFormObservaciones(e.target.value)}
                    className="modal-form-input"
                    rows="4"
                    placeholder="Describe el motivo del rechazo..."
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeRechazarModal} className="modal-btn-secondary">
                Cancelar
              </button>
              <button onClick={rechazarPago} className="modal-btn-danger">
                <XCircle size={18} />
                Rechazar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PAGO */}
      {showEditModal && selectedPago && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <Edit2 size={20} />
                Editar Pago
              </h3>
              <button onClick={closeEditModal} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="edit-modal-content">
                <div className="edit-modal-info">
                  <div className="edit-modal-item">
                    <span>N° Pago:</span>
                    <strong>{selectedPago.numero_pago}</strong>
                  </div>
                  <div className="edit-modal-item">
                    <span>Monto:</span>
                    <strong>{formatCurrency(selectedPago.monto)}</strong>
                  </div>
                  <div className="edit-modal-item">
                    <span>Factura:</span>
                    <strong>{selectedPago.factura?.numero_factura || 'Sin factura'}</strong>
                  </div>
                </div>
                
                <div className="modal-form-grid">
                  <div className="modal-form-group">
                    <label className="modal-form-label">
                      <CheckCircle size={14} />
                      Estado
                    </label>
                    <select
                      value={formEdit.estado}
                      onChange={(e) => setFormEdit({...formEdit, estado: e.target.value})}
                      className="modal-form-input"
                    >
                      {estados.map(estado => (
                        <option key={estado.value} value={estado.value}>{estado.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="modal-form-group full-width">
                    <label className="modal-form-label">
                      <List size={14} />
                      Observaciones
                    </label>
                    <textarea
                      value={formEdit.observaciones}
                      onChange={(e) => setFormEdit({...formEdit, observaciones: e.target.value})}
                      className="modal-form-input"
                      rows="4"
                      placeholder="Observaciones adicionales..."
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeEditModal} className="modal-btn-secondary">
                Cancelar
              </button>
              <button onClick={updatePago} className="modal-btn-primary">
                <Edit2 size={18} />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR PAGO */}
      {showDeleteModal && selectedPago && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <AlertTriangle size={20} />
                Eliminar Pago
              </h3>
              <button onClick={closeDeleteModal} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-modal-content">
                <AlertTriangle size={48} className="delete-modal-icon" />
                <h4>¿Estás seguro de eliminar este pago?</h4>
                <p>Esta acción no se puede deshacer. Se eliminarán todos los datos relacionados con este pago.</p>
                
                <div className="delete-modal-info">
                  <div className="delete-modal-pago">
                    <div className="delete-modal-item">
                      <span>N° Pago:</span>
                      <strong>{selectedPago.numero_pago}</strong>
                    </div>
                    <div className="delete-modal-item">
                      <span>Monto:</span>
                      <strong>{formatCurrency(selectedPago.monto)}</strong>
                    </div>
                    <div className="delete-modal-item">
                      <span>Factura:</span>
                      <strong>{selectedPago.factura?.numero_factura || 'Sin factura'}</strong>
                    </div>
                    <div className="delete-modal-item">
                      <span>Estado:</span>
                      <div 
                        className={`delete-modal-estado ${getEstadoBadge(selectedPago.estado)}`}
                        style={{ color: getEstadoColor(selectedPago.estado) }}
                      >
                        {getEstadoLabel(selectedPago.estado)}
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
              <button onClick={deletePago} className="modal-btn-danger">
                <Trash2 size={18} />
                Eliminar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ESTADÍSTICAS */}
      {showEstadisticasModal && (
        <div className="modal-overlay">
          <div className="modal-content wide">
            <div className="modal-header">
              <h3 className="modal-title">
                <BarChart size={20} />
                Estadísticas de Pagos
              </h3>
              <button onClick={closeEstadisticasModal} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="estadisticas-grid">
                <div className="estadisticas-card">
                  <h4 className="estadisticas-card-title">
                    <DollarSign size={18} />
                    Resumen General
                  </h4>
                  <div className="estadisticas-card-content">
                    <div className="estadisticas-item">
                      <span>Total Pagos:</span>
                      <strong>{stats.total}</strong>
                    </div>
                    <div className="estadisticas-item">
                      <span>Monto Total:</span>
                      <strong>{formatCurrency(stats.totalMonto)}</strong>
                    </div>
                    <div className="estadisticas-item">
                      <span>Pagos este Mes:</span>
                      <strong>{stats.pagosMes}</strong>
                    </div>
                    <div className="estadisticas-item">
                      <span>Monto del Mes:</span>
                      <strong>{formatCurrency(stats.totalMes)}</strong>
                    </div>
                  </div>
                </div>
                
                <div className="estadisticas-card">
                  <h4 className="estadisticas-card-title">
                    <CheckCircle size={18} />
                    Por Estado
                  </h4>
                  <div className="estadisticas-card-content">
                    {estados.map(estado => {
                      const count = pagos.filter(p => p.estado === estado.value).length;
                      const porcentaje = stats.total > 0 ? (count / stats.total) * 100 : 0;
                      const monto = pagos
                        .filter(p => p.estado === estado.value)
                        .reduce((sum, pago) => sum + (pago.monto || 0), 0);
                      
                      return (
                        <div key={estado.value} className="estadisticas-item">
                          <div className="estadisticas-item-header">
                            <span 
                              className="estadisticas-item-color"
                              style={{ backgroundColor: estado.color }}
                            />
                            <span>{estado.label}:</span>
                          </div>
                          <div className="estadisticas-item-values">
                            <strong>{count}</strong>
                            <span>({porcentaje.toFixed(1)}%)</span>
                            <span className="estadisticas-monto">{formatCurrency(monto)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="estadisticas-card full-width">
                  <h4 className="estadisticas-card-title">
                    <CreditCard size={18} />
                    Por Método de Pago
                  </h4>
                  <div className="estadisticas-card-content">
                    <div className="estadisticas-metodos-grid">
                      {metodosPago.map(metodo => {
                        const metodoStats = metodosStats[metodo.value];
                        
                        return (
                          <div key={metodo.value} className="estadisticas-metodo">
                            <div className="estadisticas-metodo-header">
                              <div 
                                className="estadisticas-metodo-icon"
                                style={{ color: metodo.color }}
                              >
                                {metodo.icon({ size: 20 })}
                              </div>
                              <div className="estadisticas-metodo-info">
                                <h5>{metodo.label}</h5>
                                <span>{metodoStats.count} pagos</span>
                              </div>
                            </div>
                            <div className="estadisticas-metodo-stats">
                              <div className="estadisticas-metodo-monto">
                                {formatCurrency(metodoStats.total)}
                              </div>
                              <div className="estadisticas-metodo-porcentaje">
                                <div className="estadisticas-metodo-bar">
                                  <div 
                                    className="estadisticas-metodo-fill"
                                    style={{
                                      width: `${metodoStats.porcentaje}%`,
                                      backgroundColor: metodo.color
                                    }}
                                  />
                                </div>
                                <span>{metodoStats.porcentaje.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeEstadisticasModal} className="modal-btn-secondary">
                Cerrar
              </button>
              <button className="modal-btn-primary">
                <Download size={18} />
                Exportar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pago;