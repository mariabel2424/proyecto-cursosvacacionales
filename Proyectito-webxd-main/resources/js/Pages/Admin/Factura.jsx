import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, Edit2, Trash2, X, Search, RefreshCw, Eye, Calendar,
  ChevronLeft, ChevronRight, AlertTriangle, Save, Clock,
  Users, DollarSign, FileText, Filter, Download, Printer,
  CheckCircle, XCircle, Clock as ClockIcon, TrendingUp,
  TrendingDown, CreditCard, Receipt, Wallet, Activity,
  List, Grid, BarChart, PieChart, Settings, Upload,
  Share2, Shield, Zap, Target, Award, MapPin,
  CalendarDays, Timer, UserCheck, UserX, Mail,
  Phone, Home, Building, Tag, Percent, Calculator,
  Archive, CheckSquare, Square, CreditCard as CardIcon
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/factura.css';

const API_FACTURAS = 'http://127.0.0.1:8000/api/facturas';
const API_DEPORTISTAS = 'http://127.0.0.1:8000/api/deportistas';
const API_REPORTES = 'http://127.0.0.1:8000/api/facturas/reporte-facturacion';

const authHeaders = (isFormData = false) => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return {};
  }
  
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

const Factura = () => {
  // Estados principales
  const [facturas, setFacturas] = useState([]);
  const [deportistas, setDeportistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modales
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [showReporteModal, setShowReporteModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  
  const [mode, setMode] = useState('create');
  const [selectedFactura, setSelectedFactura] = useState(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [deportistaFilter, setDeportistaFilter] = useState('all');
  const [fechaDesdeFilter, setFechaDesdeFilter] = useState('');
  const [fechaHastaFilter, setFechaHastaFilter] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list', 'grid', 'cards'
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 15;
  
  // Formulario factura
  const [form, setForm] = useState({
    id_deportista: '',
    concepto: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    descuento: 0,
    impuesto: 0,
    metodo_pago: '',
    observaciones: '',
    detalles: [
      {
        concepto: '',
        descripcion: '',
        cantidad: 1,
        precio_unitario: 0,
        descuento: 0
      }
    ]
  });
  
  // Formulario pago
  const [formPago, setFormPago] = useState({
    monto: 0,
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago: 'efectivo',
    referencia: '',
    observaciones: '',
    comprobante: null
  });
  
  // Formulario reporte
  const [formReporte, setFormReporte] = useState({
    fecha_desde: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    fecha_hasta: new Date().toISOString().split('T')[0]
  });
  
  const [errors, setErrors] = useState({});
  const [detallesFactura, setDetallesFactura] = useState([]);
  const [reporteData, setReporteData] = useState([]);

  // Estados disponibles
  const estados = [
    { value: 'pendiente', label: 'Pendiente', color: '#f59e0b', icon: ClockIcon },
    { value: 'pagada', label: 'Pagada', color: '#10b981', icon: CheckCircle },
    { value: 'vencida', label: 'Vencida', color: '#ef4444', icon: AlertTriangle },
    { value: 'cancelada', label: 'Cancelada', color: '#6b7280', icon: XCircle }
  ];

  // Métodos de pago
  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo', icon: DollarSign },
    { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
    { value: 'transferencia', label: 'Transferencia', icon: Receipt },
    { value: 'cheque', label: 'Cheque', icon: FileText },
    { value: 'otro', label: 'Otro', icon: Wallet }
  ];

  // Cargar datos iniciales
  useEffect(() => {
    loadFacturas();
    loadDeportistas();
  }, []);

  // Monitorear cambios en deportistas
  useEffect(() => {
    console.log('🔍 [DEBUG] Estado de deportistas actualizado:', {
      deportistas,
      esArray: Array.isArray(deportistas),
      longitud: Array.isArray(deportistas) ? deportistas.length : 'no es array',
      tipo: typeof deportistas
    });
  }, [deportistas]);

  // Monitorear cambios en facturas
  useEffect(() => {
    console.log('🔍 [DEBUG] Estado de facturas actualizado:', {
      facturas,
      longitud: facturas.length,
      primeraFactura: facturas[0]
    });
  }, [facturas]);

  // Cargar facturas
  const loadFacturas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Construir query params solo si tienen valor
      const params = {};
      
      if (currentPage) params.page = currentPage;
      if (estadoFilter && estadoFilter !== 'all') params.estado = estadoFilter;
      if (deportistaFilter && deportistaFilter !== 'all') params.id_deportista = deportistaFilter;
      
      // Solo agregar fechas si tienen valor
      if (fechaDesdeFilter && fechaDesdeFilter.trim() !== '') {
        params.fecha_desde = fechaDesdeFilter;
      }
      
      if (fechaHastaFilter && fechaHastaFilter.trim() !== '') {
        params.fecha_hasta = fechaHastaFilter;
      }
      
      if (searchTerm && searchTerm.trim() !== '') {
        params.search = searchTerm;
      }
      
      const queryParams = new URLSearchParams(params);
      
      console.log('🔍 [DEBUG] URL de petición facturas:', `${API_FACTURAS}?${queryParams}`);
      console.log('🔍 [DEBUG] Parámetros:', params);
      
      const response = await fetch(`${API_FACTURAS}?${queryParams}`, {
        headers: authHeaders()
      });
      
      console.log('🔍 [DEBUG] Response status:', response.status);
      console.log('🔍 [DEBUG] Response status text:', response.statusText);
      
      if (!response.ok) {
        // Intentar obtener más información del error
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.text();
          console.error('🔍 [DEBUG] Error response body:', errorData);
          errorMessage = `Error ${response.status}: ${errorData || response.statusText}`;
        } catch (e) {
          console.error('🔍 [DEBUG] Error al leer error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('🔍 [DEBUG] Data recibida de API facturas:', data);
      
      if (data.data) {
        console.log('🔍 [DEBUG] Facturas recibidas (data.data):', data.data);
        setFacturas(data.data);
        setTotalPages(data.last_page || 1);
      } else if (Array.isArray(data)) {
        console.log('🔍 [DEBUG] Facturas recibidas (array directo):', data);
        setFacturas(data);
        setTotalPages(Math.ceil(data.length / itemsPerPage));
      } else {
        console.log('🔍 [DEBUG] Estructura inesperada:', data);
        setFacturas([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('❌ [ERROR] Error loading facturas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar deportistas
  const loadDeportistas = async () => {
    try {
      console.log('🔍 [DEBUG] Cargando deportistas desde:', API_DEPORTISTAS);
      
      const response = await fetch(API_DEPORTISTAS, {
        headers: authHeaders()
      });
      
      console.log('🔍 [DEBUG] Response deportistas status:', response.status);
      
      if (!response.ok) {
        console.error('❌ [ERROR] Error response deportistas:', response.statusText);
        return;
      }
      
      const data = await response.json();
      console.log('🔍 [DEBUG] Data recibida de API deportistas:', data);
      console.log('🔍 [DEBUG] Tipo de data.data:', typeof data.data);
      console.log('🔍 [DEBUG] Es array data.data?', Array.isArray(data.data));
      console.log('🔍 [DEBUG] Keys de data.data:', data.data ? Object.keys(data.data) : 'no data');
      
      let deportistasData = [];
      
      if (data.data) {
        // Verificar diferentes estructuras posibles
        if (Array.isArray(data.data)) {
          deportistasData = data.data;
          console.log('✅ [DEBUG] Deportistas en data.data (array), cantidad:', data.data.length);
        } else if (typeof data.data === 'object') {
          // Podría ser un objeto con propiedades que contienen arrays
          // Intentar extraer cualquier array que pueda contener deportistas
          const possibleArrays = Object.values(data.data).filter(value => Array.isArray(value));
          if (possibleArrays.length > 0) {
            // Tomar el primer array encontrado
            deportistasData = possibleArrays[0];
            console.log('✅ [DEBUG] Deportistas en objeto data.data, encontrado array en propiedad, cantidad:', deportistasData.length);
          } else {
            // Convertir objeto a array si tiene la estructura correcta
            deportistasData = Object.values(data.data).filter(item => 
              item && typeof item === 'object' && (item.id_deportista || item.id)
            );
            console.log('✅ [DEBUG] Deportistas extraídos de objeto data.data, cantidad:', deportistasData.length);
          }
        }
      } else if (Array.isArray(data)) {
        deportistasData = data;
        console.log('✅ [DEBUG] Deportistas es un array directo, cantidad:', data.length);
      } else if (data.deportistas && Array.isArray(data.deportistas)) {
        deportistasData = data.deportistas;
        console.log('✅ [DEBUG] Deportistas en data.deportistas, cantidad:', data.deportistas.length);
      }
      
      console.log('🔍 [DEBUG] Deportistas a guardar:', deportistasData);
      console.log('🔍 [DEBUG] Primer deportista (si existe):', deportistasData[0]);
      
      setDeportistas(deportistasData);
      
    } catch (error) {
      console.error('❌ [ERROR] Error loading deportistas:', error);
      console.error('❌ [ERROR] Stack trace:', error.stack);
    }
  };

  // Cargar detalles de factura
  const loadFacturaDetalle = async (id) => {
    try {
      const response = await fetch(`${API_FACTURAS}/${id}`, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedFactura(data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error loading factura detail:', error);
    }
  };

  // Generar reporte
  const generarReporte = async () => {
    try {
      const queryParams = new URLSearchParams({
        fecha_desde: formReporte.fecha_desde,
        fecha_hasta: formReporte.fecha_hasta
      });

      const response = await fetch(`${API_REPORTES}?${queryParams}`, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setReporteData(data);
        setShowReporteModal(true);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error al generar el reporte');
    }
  };

  // Aplicar filtros
  const applyFilters = () => {
    setCurrentPage(1);
    loadFacturas();
  };

  // Resetear filtros
  const resetFilters = () => {
    setSearchTerm('');
    setEstadoFilter('all');
    setDeportistaFilter('all');
    setFechaDesdeFilter('');
    setFechaHastaFilter('');
    setCurrentPage(1);
    loadFacturas();
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.id_deportista) newErrors.id_deportista = 'El deportista es requerido';
    if (!form.concepto) newErrors.concepto = 'El concepto es requerido';
    if (!form.fecha_emision) newErrors.fecha_emision = 'La fecha de emisión es requerida';
    
    // Validar detalles
    form.detalles.forEach((detalle, index) => {
      if (!detalle.concepto) newErrors[`detalles.${index}.concepto`] = 'Concepto requerido';
      if (!detalle.cantidad || detalle.cantidad < 1) newErrors[`detalles.${index}.cantidad`] = 'Cantidad inválida';
      if (!detalle.precio_unitario || detalle.precio_unitario < 0) newErrors[`detalles.${index}.precio_unitario`] = 'Precio inválido';
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // CRUD Operations
  const createFactura = async () => {
    if (!validateForm()) return;
    
    try {
      const response = await fetch(API_FACTURAS, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form)
      });
      
      if (response.ok) {
        const data = await response.json();
        alert('✅ Factura creada exitosamente');
        closeModal();
        loadFacturas();
      } else {
        const errorData = await response.json();
        alert(`❌ ${errorData.message || 'Error al crear factura'}`);
      }
    } catch (error) {
      console.error('Error creating factura:', error);
      alert('❌ Error de conexión');
    }
  };

  const updateFactura = async () => {
    if (!validateForm() || !selectedFactura) return;
    
    try {
      const response = await fetch(`${API_FACTURAS}/${selectedFactura.id_factura}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(form)
      });
      
      if (response.ok) {
        const data = await response.json();
        alert('✅ Factura actualizada exitosamente');
        closeModal();
        loadFacturas();
      } else {
        const errorData = await response.json();
        alert(`❌ ${errorData.message || 'Error al actualizar factura'}`);
      }
    } catch (error) {
      console.error('Error updating factura:', error);
      alert('❌ Error de conexión');
    }
  };

  const deleteFactura = async () => {
    if (!selectedFactura) return;
    
    try {
      const response = await fetch(`${API_FACTURAS}/${selectedFactura.id_factura}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        alert('✅ Factura eliminada exitosamente');
        closeDeleteModal();
        loadFacturas();
      } else {
        const errorData = await response.json();
        alert(`❌ ${errorData.message || 'Error al eliminar factura'}`);
      }
    } catch (error) {
      console.error('Error deleting factura:', error);
      alert('❌ Error de conexión');
    }
  };

  const registrarPago = async () => {
    if (!selectedFactura || !formPago) return;
    
    const formData = new FormData();
    Object.keys(formPago).forEach(key => {
      if (key === 'comprobante' && formPago[key]) {
        formData.append(key, formPago[key]);
      } else if (formPago[key] !== null) {
        formData.append(key, formPago[key]);
      }
    });
    
    try {
      const response = await fetch(`${API_FACTURAS}/${selectedFactura.id_factura}/registrar-pago`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        alert('✅ Pago registrado exitosamente');
        closePagoModal();
        loadFacturas();
      } else {
        const errorData = await response.json();
        alert(`❌ ${errorData.message || 'Error al registrar pago'}`);
      }
    } catch (error) {
      console.error('Error registrando pago:', error);
      alert('❌ Error de conexión');
    }
  };

  // Modal functions
  const openCreateModal = () => {
    setMode('create');
    setForm({
      id_deportista: '',
      concepto: '',
      fecha_emision: new Date().toISOString().split('T')[0],
      fecha_vencimiento: '',
      descuento: 0,
      impuesto: 0,
      metodo_pago: '',
      observaciones: '',
      detalles: [
        {
          concepto: '',
          descripcion: '',
          cantidad: 1,
          precio_unitario: 0,
          descuento: 0
        }
      ]
    });
    setErrors({});
    setSelectedFactura(null);
    setShowModal(true);
  };

  const openEditModal = (factura) => {
    if (factura.estado === 'pagada') {
      alert('⚠️ No se puede editar una factura pagada');
      return;
    }
    
    setMode('edit');
    setSelectedFactura(factura);
    setForm({
      id_deportista: factura.id_deportista || '',
      concepto: factura.concepto || '',
      fecha_emision: factura.fecha_emision ? factura.fecha_emision.split('T')[0] : '',
      fecha_vencimiento: factura.fecha_vencimiento ? factura.fecha_vencimiento.split('T')[0] : '',
      descuento: factura.descuento || 0,
      impuesto: factura.impuesto || 0,
      metodo_pago: factura.metodo_pago || '',
      observaciones: factura.observaciones || '',
      detalles: factura.detalles?.map(detalle => ({
        concepto: detalle.concepto,
        descripcion: detalle.descripcion || '',
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        descuento: detalle.descuento || 0
      })) || []
    });
    setErrors({});
    setShowModal(true);
  };

  const openPagoModal = (factura) => {
    if (factura.estado === 'pagada') {
      alert('⚠️ Esta factura ya está pagada completamente');
      return;
    }
    
    setSelectedFactura(factura);
    setFormPago({
      monto: factura.saldo_pendiente || factura.total,
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo_pago: 'efectivo',
      referencia: '',
      observaciones: '',
      comprobante: null
    });
    setShowPagoModal(true);
  };

  const openDeleteModal = (factura) => {
    if (factura.estado === 'pagada') {
      alert('⚠️ No se puede eliminar una factura pagada');
      return;
    }
    
    setSelectedFactura(factura);
    setShowDeleteModal(true);
  };

  const openDetallesModal = (detalles) => {
    setDetallesFactura(detalles);
    setShowDetallesModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFactura(null);
    setErrors({});
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedFactura(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedFactura(null);
  };

  const closePagoModal = () => {
    setShowPagoModal(false);
    setSelectedFactura(null);
    setFormPago({
      monto: 0,
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo_pago: 'efectivo',
      referencia: '',
      observaciones: '',
      comprobante: null
    });
  };

  const closeReporteModal = () => {
    setShowReporteModal(false);
    setReporteData([]);
  };

  const closeDetallesModal = () => {
    setShowDetallesModal(false);
    setDetallesFactura([]);
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
    return estadoObj ? estadoObj.icon : ClockIcon;
  };

  const getMetodoPagoIcon = (metodo) => {
    const metodoObj = metodosPago.find(m => m.value === metodo);
    return metodoObj ? metodoObj.icon : Wallet;
  };

  const getMetodoPagoLabel = (metodo) => {
    const metodoObj = metodosPago.find(m => m.value === metodo);
    return metodoObj ? metodoObj.label : 'Otro';
  };

  const formatFecha = (fecha) => {
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

  // Funciones para manejar detalles
  const addDetalle = () => {
    setForm({
      ...form,
      detalles: [
        ...form.detalles,
        {
          concepto: '',
          descripcion: '',
          cantidad: 1,
          precio_unitario: 0,
          descuento: 0
        }
      ]
    });
  };

  const removeDetalle = (index) => {
    if (form.detalles.length <= 1) {
      alert('Debe haber al menos un detalle');
      return;
    }
    
    setForm({
      ...form,
      detalles: form.detalles.filter((_, i) => i !== index)
    });
  };

  const updateDetalle = (index, field, value) => {
    const nuevosDetalles = [...form.detalles];
    nuevosDetalles[index][field] = value;
    
    setForm({
      ...form,
      detalles: nuevosDetalles
    });
  };

  // Calcular totales
  const calculateTotals = useMemo(() => {
    let subtotal = 0;
    let totalDetalles = 0;
    
    form.detalles.forEach(detalle => {
      const subtotalDetalle = detalle.cantidad * detalle.precio_unitario;
      const montoDetalle = subtotalDetalle - (detalle.descuento || 0);
      totalDetalles += montoDetalle;
    });
    
    subtotal = totalDetalles;
    const total = subtotal - (form.descuento || 0) + (form.impuesto || 0);
    
    return { subtotal, total };
  }, [form.detalles, form.descuento, form.impuesto]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = facturas.length;
    const pendientes = facturas.filter(f => f.estado === 'pendiente').length;
    const pagadas = facturas.filter(f => f.estado === 'pagada').length;
    const vencidas = facturas.filter(f => f.estado === 'vencida').length;
    
    // Totales monetarios
    const totalFacturado = facturas.reduce((sum, factura) => sum + (factura.total || 0), 0);
    const totalPendiente = facturas.reduce((sum, factura) => {
      if (factura.estado === 'pendiente' || factura.estado === 'vencida') {
        return sum + (factura.saldo_pendiente || factura.total || 0);
      }
      return sum;
    }, 0);
    const totalPagado = facturas.reduce((sum, factura) => {
      if (factura.estado === 'pagada') {
        return sum + (factura.total || 0);
      }
      return sum;
    }, 0);
    
    // Facturas del mes actual
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    const facturasMes = facturas.filter(f => {
      const fechaFactura = new Date(f.fecha_emision);
      return fechaFactura >= primerDiaMes && fechaFactura <= ultimoDiaMes;
    }).length;
    
    return { 
      total, 
      pendientes, 
      pagadas, 
      vencidas,
      totalFacturado,
      totalPendiente,
      totalPagado,
      facturasMes
    };
  }, [facturas]);

  // Reporte estadísticas
  const reporteStats = useMemo(() => {
    if (!reporteData.length) return null;
    
    const totalCantidad = reporteData.reduce((sum, item) => sum + (item.cantidad || 0), 0);
    const totalMonto = reporteData.reduce((sum, item) => sum + (item.total_monto || 0), 0);
    
    return {
      totalCantidad,
      totalMonto,
      porcentajes: reporteData.map(item => ({
        estado: item.estado,
        cantidad: item.cantidad,
        monto: item.total_monto,
        porcentaje: (item.cantidad / totalCantidad) * 100
      }))
    };
  }, [reporteData]);

  return (
    <div className="factura-container">
      <Sidebar />
      
      <div className="factura-content">
        <Topbar />
        
        <div className="factura-main">
          {/* HEADER */}
          <div className="factura-header">
            <div>
              <h1 className="factura-title">
                <DollarSign size={28} />
                Gestión de Facturas
              </h1>
              <p className="factura-subtitle">
                Administra las facturas y pagos de los deportistas
              </p>
            </div>
            <div className="factura-header-actions">
              <button 
                onClick={() => setShowReporteModal(true)}
                className="factura-btn-secondary"
              >
                <BarChart size={20} />
                Generar Reporte
              </button>
              <button 
                onClick={openCreateModal}
                className="factura-btn-primary"
              >
                <Plus size={20} />
                Nueva Factura
              </button>
            </div>
          </div>

          {/* ESTADÍSTICAS */}
          <div className="factura-stats-grid">
            <div className="factura-stat-card">
              <div className="factura-stat-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                <FileText size={24} />
              </div>
              <div>
                <h3 className="factura-stat-number">{stats.total}</h3>
                <p className="factura-stat-label">Total Facturas</p>
              </div>
            </div>
            <div className="factura-stat-card">
              <div className="factura-stat-icon" style={{background: '#fef3c7', color: '#f59e0b'}}>
                <ClockIcon size={24} />
              </div>
              <div>
                <h3 className="factura-stat-number">{stats.pendientes}</h3>
                <p className="factura-stat-label">Pendientes</p>
              </div>
            </div>
            <div className="factura-stat-card">
              <div className="factura-stat-icon" style={{background: '#dcfce7', color: '#10b981'}}>
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="factura-stat-number">{formatCurrency(stats.totalPagado)}</h3>
                <p className="factura-stat-label">Total Pagado</p>
              </div>
            </div>
            <div className="factura-stat-card">
              <div className="factura-stat-icon" style={{background: '#fee2e2', color: '#ef4444'}}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="factura-stat-number">{formatCurrency(stats.totalPendiente)}</h3>
                <p className="factura-stat-label">Por Cobrar</p>
              </div>
            </div>
          </div>

          {/* FILTROS */}
          <div className="factura-filters">
            <div className="factura-filters-row">
              <div className="factura-search-container">
                <Search className="factura-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por número, concepto o deportista..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  className="factura-search-input"
                />
              </div>
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="factura-filter-select"
              >
                <option value="all">Todos los estados</option>
                {estados.map(estado => (
                  <option key={estado.value} value={estado.value}>{estado.label}</option>
                ))}
              </select>
              <select
                value={deportistaFilter}
                onChange={(e) => setDeportistaFilter(e.target.value)}
                className="factura-filter-select"
              >
                <option value="all">Todos los deportistas</option>
                {deportistas && Array.isArray(deportistas) ? (
                  deportistas.length > 0 ? (
                    deportistas.map(deportista => {
                      // Verificar que el deportista tenga las propiedades necesarias
                      const id = deportista.id_deportista || deportista.id;
                      const nombre = deportista.nombre || deportista.nombres || deportista.nombre_completo || '';
                      const apellido = deportista.apellido || deportista.apellidos || '';
                      
                      return (
                        <option key={id} value={id}>
                          {nombre} {apellido}
                        </option>
                      );
                    })
                  ) : (
                    <option value="" disabled>No hay deportistas</option>
                  )
                ) : (
                  <option value="" disabled>Cargando deportistas...</option>
                )}
              </select>
              <input
                type="date"
                value={fechaDesdeFilter}
                onChange={(e) => setFechaDesdeFilter(e.target.value)}
                className="factura-filter-date"
                placeholder="Desde"
              />
              <input
                type="date"
                value={fechaHastaFilter}
                onChange={(e) => setFechaHastaFilter(e.target.value)}
                className="factura-filter-date"
                placeholder="Hasta"
              />
              <button onClick={applyFilters} className="factura-btn-secondary">
                <Filter size={18} />
                Aplicar
              </button>
              <button onClick={resetFilters} className="factura-btn-secondary">
                <RefreshCw size={18} />
                Limpiar
              </button>
            </div>
          </div>

          {/* VISTAS */}
          <div className="factura-view-controls">
            <div className="factura-view-buttons">
              <button
                onClick={() => setViewMode('list')}
                className={`factura-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                title="Vista de lista"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`factura-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                title="Vista de cuadrícula"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`factura-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                title="Vista de tarjetas"
              >
                <FileText size={18} />
              </button>
            </div>
            <div className="factura-view-info">
              {facturas.length} factura{facturas.length !== 1 ? 's' : ''} encontrada{facturas.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* CONTENIDO */}
          {loading ? (
            <div className="factura-loading">
              <div className="factura-loading-spinner"></div>
              <p className="factura-loading-text">Cargando facturas...</p>
            </div>
          ) : error ? (
            <div className="factura-error">
              <AlertTriangle size={48} />
              <h3>Error al cargar facturas</h3>
              <p>{error}</p>
              <button onClick={loadFacturas} className="factura-btn-primary">
                <RefreshCw size={18} />
                Reintentar
              </button>
            </div>
          ) : facturas.length === 0 ? (
            <div className="factura-empty-state">
              <FileText size={64} />
              <h3 className="factura-empty-title">No hay facturas registradas</h3>
              <p className="factura-empty-message">
                {searchTerm || estadoFilter !== 'all' || deportistaFilter !== 'all' || fechaDesdeFilter || fechaHastaFilter
                  ? 'No se encontraron facturas con los filtros aplicados'
                  : 'Crea tu primera factura para comenzar a gestionar pagos'}
              </p>
              <button onClick={openCreateModal} className="factura-btn-primary">
                <Plus size={18} />
                Crear Factura
              </button>
            </div>
          ) : (
            <>
              {/* VISTA DE LISTA */}
              {viewMode === 'list' && (
                <div className="factura-table-container">
                  <table className="factura-table">
                    <thead>
                      <tr>
                        <th>N° Factura</th>
                        <th>Deportista</th>
                        <th>Fecha Emisión</th>
                        <th>Fecha Vencimiento</th>
                        <th>Concepto</th>
                        <th>Total</th>
                        <th>Saldo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facturas.map(factura => {
                        const EstadoIcon = getEstadoIcon(factura.estado);
                        const saldoPendiente = factura.saldo_pendiente || factura.total;
                        
                        return (
                          <tr key={factura.id_factura} className="factura-table-row">
                            <td>
                              <div className="factura-numero">
                                <Tag size={12} />
                                <strong>{factura.numero_factura}</strong>
                              </div>
                            </td>
                            <td>
                              <div className="factura-deportista">
                                <Users size={14} />
                                <span>{factura.deportista?.nombre} {factura.deportista?.apellido}</span>
                              </div>
                            </td>
                            <td>
                              <div className="factura-fecha">
                                <Calendar size={12} />
                                {formatFecha(factura.fecha_emision)}
                              </div>
                            </td>
                            <td>
                              <div className={`factura-fecha ${factura.estado === 'vencida' ? 'vencida' : ''}`}>
                                {factura.fecha_vencimiento ? (
                                  <>
                                    <Calendar size={12} />
                                    {formatFecha(factura.fecha_vencimiento)}
                                  </>
                                ) : 'Sin vencimiento'}
                              </div>
                            </td>
                            <td>
                              <div className="factura-concepto" title={factura.concepto}>
                                {factura.concepto.length > 40 ? 
                                  `${factura.concepto.substring(0, 40)}...` : 
                                  factura.concepto
                                }
                              </div>
                            </td>
                            <td>
                              <div className="factura-total">
                                <DollarSign size={12} />
                                {formatCurrency(factura.total)}
                              </div>
                            </td>
                            <td>
                              <div className={`factura-saldo ${saldoPendiente > 0 ? 'pendiente' : 'pagado'}`}>
                                <DollarSign size={12} />
                                {formatCurrency(saldoPendiente)}
                              </div>
                            </td>
                            <td>
                              <div 
                                className="factura-estado-badge"
                                style={{
                                  backgroundColor: getEstadoColor(factura.estado) + '20',
                                  color: getEstadoColor(factura.estado)
                                }}
                              >
                                <EstadoIcon size={14} />
                                <span>{getEstadoLabel(factura.estado)}</span>
                              </div>
                            </td>
                            <td>
                              <div className="factura-actions">
                                <button
                                  onClick={() => loadFacturaDetalle(factura.id_factura)}
                                  className="factura-action-btn"
                                  title="Ver detalles"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => openEditModal(factura)}
                                  className="factura-action-btn"
                                  title="Editar"
                                  disabled={factura.estado === 'pagada'}
                                >
                                  <Edit2 size={16} />
                                </button>
                                {factura.estado !== 'pagada' && (
                                  <button
                                    onClick={() => openPagoModal(factura)}
                                    className="factura-action-btn"
                                    title="Registrar Pago"
                                  >
                                    <CreditCard size={16} />
                                  </button>
                                )}
                                {factura.detalles && factura.detalles.length > 0 && (
                                  <button
                                    onClick={() => openDetallesModal(factura.detalles)}
                                    className="factura-action-btn"
                                    title="Ver Detalles Factura"
                                  >
                                    <List size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() => openDeleteModal(factura)}
                                  className="factura-action-btn delete"
                                  title="Eliminar"
                                  disabled={factura.estado === 'pagada'}
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

              {/* VISTA DE CUADRÍCULA */}
              {viewMode === 'grid' && (
                <div className="factura-grid-container">
                  {facturas.map(factura => {
                    const EstadoIcon = getEstadoIcon(factura.estado);
                    const saldoPendiente = factura.saldo_pendiente || factura.total;
                    
                    return (
                      <div key={factura.id_factura} className="factura-card">
                        <div className="factura-card-header">
                          <div className="factura-card-numero">
                            <Tag size={12} />
                            <strong>{factura.numero_factura}</strong>
                          </div>
                          <div 
                            className="factura-card-estado"
                            style={{
                              backgroundColor: getEstadoColor(factura.estado) + '20',
                              color: getEstadoColor(factura.estado)
                            }}
                          >
                            <EstadoIcon size={12} />
                            <span>{getEstadoLabel(factura.estado)}</span>
                          </div>
                        </div>
                        
                        <div className="factura-card-deportista">
                          <Users size={14} />
                          <span>{factura.deportista?.nombre} {factura.deportista?.apellido}</span>
                        </div>
                        
                        <div className="factura-card-concepto">
                          <FileText size={12} />
                          <span>{factura.concepto}</span>
                        </div>
                        
                        <div className="factura-card-fechas">
                          <div className="factura-card-fecha">
                            <Calendar size={12} />
                            <span>Emisión: {formatFecha(factura.fecha_emision)}</span>
                          </div>
                          {factura.fecha_vencimiento && (
                            <div className={`factura-card-fecha ${factura.estado === 'vencida' ? 'vencida' : ''}`}>
                              <Calendar size={12} />
                              <span>Vence: {formatFecha(factura.fecha_vencimiento)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="factura-card-totales">
                          <div className="factura-card-total">
                            <DollarSign size={12} />
                            <span>Total: {formatCurrency(factura.total)}</span>
                          </div>
                          <div className={`factura-card-saldo ${saldoPendiente > 0 ? 'pendiente' : 'pagado'}`}>
                            <DollarSign size={12} />
                            <span>Saldo: {formatCurrency(saldoPendiente)}</span>
                          </div>
                        </div>
                        
                        <div className="factura-card-actions">
                          <button
                            onClick={() => loadFacturaDetalle(factura.id_factura)}
                            className="factura-card-action"
                            title="Ver detalles"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEditModal(factura)}
                            className="factura-card-action"
                            title="Editar"
                            disabled={factura.estado === 'pagada'}
                          >
                            <Edit2 size={14} />
                          </button>
                          {factura.estado !== 'pagada' && (
                            <button
                              onClick={() => openPagoModal(factura)}
                              className="factura-card-action"
                              title="Registrar Pago"
                            >
                              <CreditCard size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PAGINACIÓN */}
              {viewMode === 'list' && totalPages > 1 && (
                <div className="factura-pagination">
                  <div className="factura-pagination-info">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="factura-pagination-controls">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="factura-pagination-btn"
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
                          className={`factura-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="factura-pagination-btn"
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

      {/* MODAL CREAR/EDITAR FACTURA */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content wide">
            <div className="modal-header">
              <h3 className="modal-title">
                {mode === 'create' ? (
                  <>
                    <Plus size={20} />
                    Nueva Factura
                  </>
                ) : (
                  <>
                    <Edit2 size={20} />
                    Editar Factura
                  </>
                )}
              </h3>
              <button onClick={closeModal} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-form-grid">
                {/* Información básica */}
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Users size={14} />
                    Deportista
                  </label>
                  <select
                    value={form.id_deportista}
                    onChange={(e) => setForm({...form, id_deportista: e.target.value})}
                    className={`modal-form-input ${errors.id_deportista ? 'error' : ''}`}
                  >
                    <option value="">Seleccionar deportista</option>
                    {deportistas && Array.isArray(deportistas) && deportistas.length > 0 ? (
                      deportistas.map(deportista => {
                        const id = deportista.id_deportista || deportista.id;
                        const nombre = deportista.nombre || deportista.nombres || deportista.nombre_completo || 'Sin nombre';
                        const apellido = deportista.apellido || deportista.apellidos || '';
                        
                        return (
                          <option key={id} value={id}>
                            {nombre} {apellido}
                          </option>
                        );
                      })
                    ) : (
                      <option value="" disabled>
                        {loading ? 'Cargando deportistas...' : 'No hay deportistas disponibles'}
                      </option>
                    )}
                  </select>
                  {errors.id_deportista && (
                    <span className="modal-form-error">{errors.id_deportista}</span>
                  )}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <FileText size={14} />
                    Concepto
                  </label>
                  <input
                    type="text"
                    value={form.concepto}
                    onChange={(e) => setForm({...form, concepto: e.target.value})}
                    className={`modal-form-input ${errors.concepto ? 'error' : ''}`}
                    placeholder="Concepto general de la factura"
                  />
                  {errors.concepto && (
                    <span className="modal-form-error">{errors.concepto}</span>
                  )}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Calendar size={14} />
                    Fecha Emisión
                  </label>
                  <input
                    type="date"
                    value={form.fecha_emision}
                    onChange={(e) => setForm({...form, fecha_emision: e.target.value})}
                    className={`modal-form-input ${errors.fecha_emision ? 'error' : ''}`}
                  />
                  {errors.fecha_emision && (
                    <span className="modal-form-error">{errors.fecha_emision}</span>
                  )}
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Calendar size={14} />
                    Fecha Vencimiento
                  </label>
                  <input
                    type="date"
                    value={form.fecha_vencimiento}
                    onChange={(e) => setForm({...form, fecha_vencimiento: e.target.value})}
                    className="modal-form-input"
                  />
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Percent size={14} />
                    Descuento General
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.descuento}
                    onChange={(e) => setForm({...form, descuento: parseFloat(e.target.value) || 0})}
                    className="modal-form-input"
                  />
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Percent size={14} />
                    Impuesto
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.impuesto}
                    onChange={(e) => setForm({...form, impuesto: parseFloat(e.target.value) || 0})}
                    className="modal-form-input"
                  />
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <CreditCard size={14} />
                    Método de Pago
                  </label>
                  <select
                    value={form.metodo_pago}
                    onChange={(e) => setForm({...form, metodo_pago: e.target.value})}
                    className="modal-form-input"
                  >
                    <option value="">Seleccionar método</option>
                    {metodosPago.map(metodo => (
                      <option key={metodo.value} value={metodo.value}>{metodo.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    <List size={14} />
                    Observaciones
                  </label>
                  <textarea
                    value={form.observaciones}
                    onChange={(e) => setForm({...form, observaciones: e.target.value})}
                    className="modal-form-input"
                    rows="3"
                    placeholder="Notas adicionales sobre la factura..."
                  />
                </div>
                
                {/* DETALLES DE FACTURA */}
                <div className="modal-form-section full-width">
                  <div className="modal-form-section-header">
                    <h4 className="modal-form-section-title">
                      <List size={16} />
                      Detalles de la Factura
                    </h4>
                    <button onClick={addDetalle} className="modal-form-section-btn">
                      <Plus size={16} />
                      Agregar Detalle
                    </button>
                  </div>
                  
                  {form.detalles.map((detalle, index) => (
                    <div key={index} className="detalle-factura-row">
                      <div className="detalle-factura-col">
                        <label className="detalle-factura-label">Concepto</label>
                        <input
                          type="text"
                          value={detalle.concepto}
                          onChange={(e) => updateDetalle(index, 'concepto', e.target.value)}
                          className={`modal-form-input ${errors[`detalles.${index}.concepto`] ? 'error' : ''}`}
                          placeholder="Descripción del servicio/producto"
                        />
                        {errors[`detalles.${index}.concepto`] && (
                          <span className="modal-form-error">{errors[`detalles.${index}.concepto`]}</span>
                        )}
                      </div>
                      
                      <div className="detalle-factura-col">
                        <label className="detalle-factura-label">Descripción</label>
                        <input
                          type="text"
                          value={detalle.descripcion}
                          onChange={(e) => updateDetalle(index, 'descripcion', e.target.value)}
                          className="modal-form-input"
                          placeholder="Detalles adicionales"
                        />
                      </div>
                      
                      <div className="detalle-factura-col">
                        <label className="detalle-factura-label">Cantidad</label>
                        <input
                          type="number"
                          min="1"
                          value={detalle.cantidad}
                          onChange={(e) => updateDetalle(index, 'cantidad', parseInt(e.target.value) || 1)}
                          className={`modal-form-input ${errors[`detalles.${index}.cantidad`] ? 'error' : ''}`}
                        />
                        {errors[`detalles.${index}.cantidad`] && (
                          <span className="modal-form-error">{errors[`detalles.${index}.cantidad`]}</span>
                        )}
                      </div>
                      
                      <div className="detalle-factura-col">
                        <label className="detalle-factura-label">Precio Unitario</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={detalle.precio_unitario}
                          onChange={(e) => updateDetalle(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                          className={`modal-form-input ${errors[`detalles.${index}.precio_unitario`] ? 'error' : ''}`}
                        />
                        {errors[`detalles.${index}.precio_unitario`] && (
                          <span className="modal-form-error">{errors[`detalles.${index}.precio_unitario`]}</span>
                        )}
                      </div>
                      
                      <div className="detalle-factura-col">
                        <label className="detalle-factura-label">Descuento</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={detalle.descuento}
                          onChange={(e) => updateDetalle(index, 'descuento', parseFloat(e.target.value) || 0)}
                          className="modal-form-input"
                        />
                      </div>
                      
                      <div className="detalle-factura-col actions">
                        <button
                          onClick={() => removeDetalle(index)}
                          className="detalle-factura-remove"
                          disabled={form.detalles.length <= 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* RESUMEN DE TOTALES */}
                  <div className="factura-totales-resumen">
                    <div className="factura-total-item">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(calculateTotals.subtotal)}</span>
                    </div>
                    <div className="factura-total-item">
                      <span>Descuento General:</span>
                      <span>-{formatCurrency(form.descuento)}</span>
                    </div>
                    <div className="factura-total-item">
                      <span>Impuesto:</span>
                      <span>+{formatCurrency(form.impuesto)}</span>
                    </div>
                    <div className="factura-total-item total">
                      <strong>Total:</strong>
                      <strong>{formatCurrency(calculateTotals.total)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeModal} className="modal-btn-secondary">
                Cancelar
              </button>
              <button 
                onClick={mode === 'create' ? createFactura : updateFactura}
                className="modal-btn-primary"
              >
                {mode === 'create' ? (
                  <>
                    <Plus size={18} />
                    Crear Factura
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE FACTURA */}
      {showDetailModal && selectedFactura && (
        <div className="modal-overlay">
          <div className="modal-content wide">
            <div className="modal-header">
              <h3 className="modal-title">
                <Eye size={20} />
                Detalles de Factura
              </h3>
              <button onClick={closeDetailModal} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="factura-detail-header">
                <div className="factura-detail-info">
                  <div className="factura-detail-numero">
                    <Tag size={20} />
                    <h2>{selectedFactura.numero_factura}</h2>
                  </div>
                  <div 
                    className="factura-detail-estado"
                    style={{
                      backgroundColor: getEstadoColor(selectedFactura.estado) + '20',
                      color: getEstadoColor(selectedFactura.estado)
                    }}
                  >
                    {getEstadoLabel(selectedFactura.estado)}
                  </div>
                </div>
                
                <div className="factura-detail-totals">
                  <div className="factura-detail-total">
                    <span>Total Factura:</span>
                    <strong>{formatCurrency(selectedFactura.total)}</strong>
                  </div>
                  <div className={`factura-detail-saldo ${selectedFactura.saldo_pendiente > 0 ? 'pendiente' : 'pagado'}`}>
                    <span>Saldo Pendiente:</span>
                    <strong>{formatCurrency(selectedFactura.saldo_pendiente || 0)}</strong>
                  </div>
                  <div className="factura-detail-pagado">
                    <span>Total Pagado:</span>
                    <strong>{formatCurrency(selectedFactura.total_pagado || 0)}</strong>
                  </div>
                </div>
              </div>
              
              <div className="factura-detail-grid">
                <div className="factura-detail-section">
                  <h4 className="factura-detail-section-title">
                    <Users size={16} />
                    Información del Deportista
                  </h4>
                  <div className="factura-detail-section-content">
                    <div className="factura-detail-field">
                      <span className="factura-detail-label">Nombre:</span>
                      <span className="factura-detail-value">
                        {selectedFactura.deportista?.nombre} {selectedFactura.deportista?.apellido}
                      </span>
                    </div>
                    <div className="factura-detail-field">
                      <span className="factura-detail-label">Email:</span>
                      <span className="factura-detail-value">
                        {selectedFactura.deportista?.email || 'No especificado'}
                      </span>
                    </div>
                    <div className="factura-detail-field">
                      <span className="factura-detail-label">Teléfono:</span>
                      <span className="factura-detail-value">
                        {selectedFactura.deportista?.telefono || 'No especificado'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="factura-detail-section">
                  <h4 className="factura-detail-section-title">
                    <Calendar size={16} />
                    Fechas
                  </h4>
                  <div className="factura-detail-section-content">
                    <div className="factura-detail-field">
                      <span className="factura-detail-label">Emisión:</span>
                      <span className="factura-detail-value">
                        {formatFecha(selectedFactura.fecha_emision)}
                      </span>
                    </div>
                    <div className="factura-detail-field">
                      <span className="factura-detail-label">Vencimiento:</span>
                      <span className="factura-detail-value">
                        {selectedFactura.fecha_vencimiento ? 
                          formatFecha(selectedFactura.fecha_vencimiento) : 
                          'Sin vencimiento'
                        }
                      </span>
                    </div>
                    <div className="factura-detail-field">
                      <span className="factura-detail-label">Concepto:</span>
                      <span className="factura-detail-value">
                        {selectedFactura.concepto}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="factura-detail-section">
                  <h4 className="factura-detail-section-title">
                    <CreditCard size={16} />
                    Información de Pago
                  </h4>
                  <div className="factura-detail-section-content">
                    <div className="factura-detail-field">
                      <span className="factura-detail-label">Método:</span>
                      <span className="factura-detail-value">
                        {selectedFactura.metodo_pago ? getMetodoPagoLabel(selectedFactura.metodo_pago) : 'No especificado'}
                      </span>
                    </div>
                    <div className="factura-detail-field">
                      <span className="factura-detail-label">Descuento:</span>
                      <span className="factura-detail-value">
                        {formatCurrency(selectedFactura.descuento || 0)}
                      </span>
                    </div>
                    <div className="factura-detail-field">
                      <span className="factura-detail-label">Impuesto:</span>
                      <span className="factura-detail-value">
                        {formatCurrency(selectedFactura.impuesto || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* DETALLES DE LA FACTURA */}
              {selectedFactura.detalles && selectedFactura.detalles.length > 0 && (
                <div className="factura-detail-section full-width">
                  <h4 className="factura-detail-section-title">
                    <List size={16} />
                    Detalles de la Factura
                  </h4>
                  <div className="factura-detail-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Concepto</th>
                          <th>Descripción</th>
                          <th>Cantidad</th>
                          <th>Precio Unitario</th>
                          <th>Descuento</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedFactura.detalles.map((detalle, index) => (
                          <tr key={index}>
                            <td>{detalle.concepto}</td>
                            <td>{detalle.descripcion || '-'}</td>
                            <td>{detalle.cantidad}</td>
                            <td>{formatCurrency(detalle.precio_unitario)}</td>
                            <td>{formatCurrency(detalle.descuento || 0)}</td>
                            <td>{formatCurrency(detalle.monto || detalle.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* PAGOS REGISTRADOS */}
              {selectedFactura.pagos && selectedFactura.pagos.length > 0 && (
                <div className="factura-detail-section full-width">
                  <h4 className="factura-detail-section-title">
                    <CheckCircle size={16} />
                    Pagos Registrados
                  </h4>
                  <div className="factura-pagos-list">
                    {selectedFactura.pagos.map((pago, index) => (
                      <div key={index} className="factura-pago-item">
                        <div className="factura-pago-info">
                          <div className="factura-pago-numero">
                            <Tag size={12} />
                            <span>{pago.numero_pago}</span>
                          </div>
                          <div className="factura-pago-fecha">
                            <Calendar size={12} />
                            <span>{formatFecha(pago.fecha_pago)}</span>
                          </div>
                          <div className="factura-pago-metodo">
                            <CreditCard size={12} />
                            <span>{getMetodoPagoLabel(pago.metodo_pago)}</span>
                          </div>
                          <div className="factura-pago-monto">
                            <DollarSign size={12} />
                            <strong>{formatCurrency(pago.monto)}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedFactura.observaciones && (
                <div className="factura-detail-section full-width">
                  <h4 className="factura-detail-section-title">
                    <List size={16} />
                    Observaciones
                  </h4>
                  <div className="factura-detail-observaciones">
                    {selectedFactura.observaciones}
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
                  openEditModal(selectedFactura);
                }}
                className="modal-btn-primary"
                disabled={selectedFactura.estado === 'pagada'}
              >
                <Edit2 size={18} />
                Editar Factura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR FACTURA */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <AlertTriangle size={20} />
                Confirmar Eliminación
              </h3>
              <button onClick={closeDeleteModal} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-modal-content">
                <AlertTriangle size={48} className="delete-modal-icon" />
                <h4>¿Estás seguro de eliminar esta factura?</h4>
                <p>Esta acción no se puede deshacer. Se eliminarán todos los datos relacionados con esta factura.</p>
                {selectedFactura && (
                  <div className="delete-modal-info">
                    <div className="delete-modal-factura">
                      <strong>{selectedFactura.numero_factura}</strong>
                    </div>
                    <div className="delete-modal-deportista">
                      {selectedFactura.deportista?.nombre} {selectedFactura.deportista?.apellido}
                    </div>
                    <div className="delete-modal-monto">
                      Total: {formatCurrency(selectedFactura.total)}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeDeleteModal} className="modal-btn-secondary">
                Cancelar
              </button>
              <button onClick={deleteFactura} className="modal-btn-danger">
                <Trash2 size={18} />
                Eliminar Factura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR PAGO */}
      {showPagoModal && selectedFactura && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <CreditCard size={20} />
                Registrar Pago
              </h3>
              <button onClick={closePagoModal} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="pago-modal-header">
                <div className="pago-modal-factura-info">
                  <div className="pago-modal-factura-numero">
                    <Tag size={14} />
                    <span>{selectedFactura.numero_factura}</span>
                  </div>
                  <div className="pago-modal-factura-deportista">
                    <Users size={14} />
                    <span>{selectedFactura.deportista?.nombre} {selectedFactura.deportista?.apellido}</span>
                  </div>
                </div>
                
                <div className="pago-modal-saldo-info">
                  <div className="pago-modal-saldo-total">
                    <span>Total Factura:</span>
                    <strong>{formatCurrency(selectedFactura.total)}</strong>
                  </div>
                  <div className="pago-modal-saldo-pendiente">
                    <span>Saldo Pendiente:</span>
                    <strong>{formatCurrency(selectedFactura.saldo_pendiente || selectedFactura.total)}</strong>
                  </div>
                </div>
              </div>
              
              <div className="modal-form-grid">
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <DollarSign size={14} />
                    Monto del Pago
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max={selectedFactura.saldo_pendiente || selectedFactura.total}
                    value={formPago.monto}
                    onChange={(e) => setFormPago({...formPago, monto: parseFloat(e.target.value) || 0})}
                    className="modal-form-input"
                  />
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Calendar size={14} />
                    Fecha de Pago
                  </label>
                  <input
                    type="date"
                    value={formPago.fecha_pago}
                    onChange={(e) => setFormPago({...formPago, fecha_pago: e.target.value})}
                    className="modal-form-input"
                  />
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <CreditCard size={14} />
                    Método de Pago
                  </label>
                  <select
                    value={formPago.metodo_pago}
                    onChange={(e) => setFormPago({...formPago, metodo_pago: e.target.value})}
                    className="modal-form-input"
                  >
                    {metodosPago.map(metodo => (
                      <option key={metodo.value} value={metodo.value}>{metodo.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    <Tag size={14} />
                    Referencia
                  </label>
                  <input
                    type="text"
                    value={formPago.referencia}
                    onChange={(e) => setFormPago({...formPago, referencia: e.target.value})}
                    className="modal-form-input"
                    placeholder="Número de referencia, cheque, etc."
                  />
                </div>
                
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    <Upload size={14} />
                    Comprobante (opcional)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFormPago({...formPago, comprobante: e.target.files[0]})}
                    className="modal-form-input"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <small className="modal-form-hint">
                    Archivos permitidos: PDF, JPG, PNG (máx. 5MB)
                  </small>
                </div>
                
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    <List size={14} />
                    Observaciones
                  </label>
                  <textarea
                    value={formPago.observaciones}
                    onChange={(e) => setFormPago({...formPago, observaciones: e.target.value})}
                    className="modal-form-input"
                    rows="3"
                    placeholder="Notas adicionales sobre el pago..."
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closePagoModal} className="modal-btn-secondary">
                Cancelar
              </button>
              <button onClick={registrarPago} className="modal-btn-primary">
                <CheckCircle size={18} />
                Registrar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REPORTE DE FACTURACIÓN */}
      {showReporteModal && (
        <div className="modal-overlay">
          <div className="modal-content wide">
            <div className="modal-header">
              <h3 className="modal-title">
                <BarChart size={20} />
                Reporte de Facturación
              </h3>
              <button onClick={closeReporteModal} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="reporte-form">
                <div className="modal-form-grid">
                  <div className="modal-form-group">
                    <label className="modal-form-label">
                      <Calendar size={14} />
                      Fecha Desde
                    </label>
                    <input
                      type="date"
                      value={formReporte.fecha_desde}
                      onChange={(e) => setFormReporte({...formReporte, fecha_desde: e.target.value})}
                      className="modal-form-input"
                    />
                  </div>
                  
                  <div className="modal-form-group">
                    <label className="modal-form-label">
                      <Calendar size={14} />
                      Fecha Hasta
                    </label>
                    <input
                      type="date"
                      value={formReporte.fecha_hasta}
                      onChange={(e) => setFormReporte({...formReporte, fecha_hasta: e.target.value})}
                      className="modal-form-input"
                    />
                  </div>
                </div>
                
                <div className="reporte-actions">
                  <button onClick={generarReporte} className="modal-btn-primary">
                    <BarChart size={18} />
                    Generar Reporte
                  </button>
                </div>
              </div>
              
              {reporteData.length > 0 && reporteStats && (
                <div className="reporte-resultados">
                  <div className="reporte-resumen">
                    <h4 className="reporte-resumen-title">
                      <BarChart size={18} />
                      Resumen del Reporte
                    </h4>
                    <div className="reporte-resumen-stats">
                      <div className="reporte-resumen-stat">
                        <span>Total Facturas:</span>
                        <strong>{reporteStats.totalCantidad}</strong>
                      </div>
                      <div className="reporte-resumen-stat">
                        <span>Total Facturado:</span>
                        <strong>{formatCurrency(reporteStats.totalMonto)}</strong>
                      </div>
                    </div>
                  </div>
                  
                  <div className="reporte-detalle">
                    <h4 className="reporte-detalle-title">
                      <List size={18} />
                      Detalle por Estado
                    </h4>
                    <div className="reporte-detalle-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Estado</th>
                            <th>Cantidad</th>
                            <th>Monto Total</th>
                            <th>Porcentaje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reporteStats.porcentajes.map((item, index) => (
                            <tr key={index}>
                              <td>
                                <div 
                                  className="reporte-estado-badge"
                                  style={{
                                    backgroundColor: getEstadoColor(item.estado) + '20',
                                    color: getEstadoColor(item.estado)
                                  }}
                                >
                                  {getEstadoLabel(item.estado)}
                                </div>
                              </td>
                              <td>{item.cantidad}</td>
                              <td>{formatCurrency(item.monto)}</td>
                              <td>
                                <div className="reporte-porcentaje">
                                  <div className="reporte-porcentaje-bar">
                                    <div 
                                      className="reporte-porcentaje-fill"
                                      style={{
                                        width: `${item.porcentaje}%`,
                                        backgroundColor: getEstadoColor(item.estado)
                                      }}
                                    ></div>
                                  </div>
                                  <span>{item.porcentaje.toFixed(1)}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="reporte-exportar">
                    <button className="modal-btn-secondary">
                      <Download size={16} />
                      Exportar a Excel
                    </button>
                    <button className="modal-btn-secondary">
                      <Printer size={16} />
                      Imprimir Reporte
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button onClick={closeReporteModal} className="modal-btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLES DE FACTURA */}
      {showDetallesModal && detallesFactura.length > 0 && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <List size={20} />
                Detalles de Factura
              </h3>
              <button onClick={closeDetallesModal} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detalles-factura-table">
                <table>
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th>Descripción</th>
                      <th>Cantidad</th>
                      <th>Precio Unitario</th>
                      <th>Descuento</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detallesFactura.map((detalle, index) => (
                      <tr key={index}>
                        <td>{detalle.concepto}</td>
                        <td>{detalle.descripcion || '-'}</td>
                        <td>{detalle.cantidad}</td>
                        <td>{formatCurrency(detalle.precio_unitario)}</td>
                        <td>{formatCurrency(detalle.descuento || 0)}</td>
                        <td>{formatCurrency(detalle.monto || detalle.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="5"><strong>Total:</strong></td>
                      <td>
                        <strong>
                          {formatCurrency(detallesFactura.reduce((sum, detalle) => 
                            sum + (detalle.monto || detalle.subtotal), 0
                          ))}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeDetallesModal} className="modal-btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Factura;