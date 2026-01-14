import React, { useState, useEffect } from 'react';
import {
  Users, Trophy, Calendar, DollarSign, Activity, TrendingUp,
  AlertTriangle, CheckCircle, Clock, BarChart2, Target,
  Award, Heart, Star, Shield, Zap, ArrowUpRight, ArrowDownRight,
  ChevronRight, MoreVertical, RefreshCw, Download, Filter,
  TrendingDown, UserCheck, Users as UsersIcon, Home, BookOpen,
  FileText, CalendarDays, Package, CreditCard, Bell, Settings,
  Activity as ActivityIcon, Target as TargetIcon
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/Dashboard.css';

const API_DASHBOARD = 'http://127.0.0.1:8000/api/dashboard';

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

const Dashboard = () => {
  // Estados para los datos del dashboard
  const [estadisticas, setEstadisticas] = useState(null);
  const [proximasActividades, setProximasActividades] = useState([]);
  const [facturacionMensual, setFacturacionMensual] = useState([]);
  
  // Estados de carga y error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtros
  const [timeRange, setTimeRange] = useState('mes');

  // Cargar datos del dashboard (solo los que funcionan)
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 Cargando datos del dashboard...');
      
      // Intentar cargar solo los endpoints que funcionan
      // 1. Estadísticas generales (esto debería funcionar)
      const estadisticasRes = await fetch(`${API_DASHBOARD}/estadisticas`, {
        headers: authHeaders()
      });
      
      if (!estadisticasRes.ok) {
        throw new Error(`Error ${estadisticasRes.status} al cargar estadísticas`);
      }
      
      const estadisticasData = await estadisticasRes.json();
      console.log('✅ Estadísticas cargadas:', estadisticasData);
      setEstadisticas(estadisticasData);
      
      // 2. Proximas actividades (esto también debería funcionar)
      try {
        const actividadesRes = await fetch(`${API_DASHBOARD}/proximas-actividades`, {
          headers: authHeaders()
        });
        
        if (actividadesRes.ok) {
          const actividadesData = await actividadesRes.json();
          console.log('✅ Actividades cargadas:', actividadesData);
          setProximasActividades(actividadesData.partidos || []);
        }
      } catch (actividadesError) {
        console.warn('⚠️ No se pudieron cargar las actividades:', actividadesError);
      }
      
      // 3. Facturación mensual
      try {
        const facturacionRes = await fetch(`${API_DASHBOARD}/facturacion-mensual`, {
          headers: authHeaders()
        });
        
        if (facturacionRes.ok) {
          const facturacionData = await facturacionRes.json();
          console.log('✅ Facturación cargada:', facturacionData);
          setFacturacionMensual(facturacionData);
        }
      } catch (facturacionError) {
        console.warn('⚠️ No se pudo cargar la facturación:', facturacionError);
      }
      
      // Nota: No intentamos cargar lesiones y destacados porque dan error 500
      
    } catch (err) {
      console.error('❌ Error cargando dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Función para formatear hora
  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5);
  };

  // Calcular porcentajes para las tarjetas
  const calcularPorcentaje = (actual, total) => {
    if (!total || total === 0) return 0;
    return Math.round((actual / total) * 100);
  };

  // Renderizar tarjeta de estadística
  const renderStatCard = ({ title, value, icon: Icon, color, bgColor, subtitle }) => {
    return (
      <div className="dashboard-stat-card">
        <div className="dashboard-stat-icon" style={{ background: bgColor, color }}>
          <Icon size={24} />
        </div>
        <div className="dashboard-stat-content">
          <h3 className="dashboard-stat-value">{value}</h3>
          <p className="dashboard-stat-title">{title}</p>
          {subtitle && (
            <p className="dashboard-stat-subtitle">{subtitle}</p>
          )}
        </div>
      </div>
    );
  };

  // Renderizar gráfico simple de barras
  const renderSimpleBarChart = (data, color = '#3b82f6') => {
    if (!data || data.length === 0) {
      return (
        <div className="dashboard-chart-empty">
          <BarChart2 size={32} />
          <p>No hay datos de facturación disponibles</p>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(item => item.total || 0));
    
    return (
      <div className="dashboard-simple-chart">
        {data.map((item, index) => {
          const height = maxValue > 0 ? (item.total / maxValue) * 100 : 0;
          const monthName = getMonthName(item.mes);
          
          return (
            <div key={index} className="dashboard-chart-bar-container">
              <div className="dashboard-chart-bar-label">{monthName}</div>
              <div className="dashboard-chart-bar">
                <div 
                  className="dashboard-chart-bar-fill"
                  style={{ 
                    height: `${height}%`,
                    backgroundColor: color
                  }}
                />
              </div>
              <div className="dashboard-chart-bar-value">
                {formatCurrency(item.total)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper para nombres de meses
  const getMonthName = (monthNumber) => {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    return months[monthNumber - 1] || `Mes ${monthNumber}`;
  };

  // Efecto para cargar datos
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Renderizar loading
  if (loading && !estadisticas) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <div className="dashboard-content">
          <Topbar />
          <div className="dashboard-main">
            <div className="dashboard-loading">
              <div className="dashboard-loading-spinner"></div>
              <p>Cargando dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar error
  if (error && !estadisticas) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <div className="dashboard-content">
          <Topbar />
          <div className="dashboard-main">
            <div className="dashboard-error">
              <AlertTriangle size={48} />
              <h3>Error al cargar el dashboard</h3>
              <p>{error}</p>
              <button onClick={loadDashboardData} className="dashboard-btn-primary">
                <RefreshCw size={18} />
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <div className="dashboard-content">
        <Topbar />
        
        <div className="dashboard-main">
          {/* HEADER */}
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title">
                <Home size={28} />
                Panel de Control
              </h1>
              <p className="dashboard-subtitle">
                Resumen general del sistema deportivo
              </p>
            </div>
            <div className="dashboard-header-actions">
              <div className="dashboard-time-selector">
                <select 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="dashboard-select"
                >
                  <option value="hoy">Hoy</option>
                  <option value="semana">Esta semana</option>
                  <option value="mes">Este mes</option>
                  <option value="trimestre">Este trimestre</option>
                  <option value="año">Este año</option>
                </select>
              </div>
              <button 
                onClick={loadDashboardData}
                className="dashboard-btn-secondary"
              >
                <RefreshCw size={18} />
                Actualizar
              </button>
            </div>
          </div>

          {/* ESTADÍSTICAS PRINCIPALES */}
          <div className="dashboard-stats-grid">
            {/* Deportistas */}
            {estadisticas?.deportistas && (
              renderStatCard({
                title: "Deportistas Totales",
                value: estadisticas.deportistas.total || 0,
                icon: Users,
                color: '#3b82f6',
                bgColor: '#dbeafe',
                subtitle: `${estadisticas.deportistas.activos || 0} activos • ${estadisticas.deportistas.lesionados || 0} lesionados`
              })
            )}

            {/* Clubes */}
            {estadisticas?.clubes && (
              renderStatCard({
                title: "Clubes Activos",
                value: estadisticas.clubes.activos || 0,
                icon: Trophy,
                color: '#10b981',
                bgColor: '#dcfce7',
                subtitle: `${estadisticas.clubes.total || 0} clubes registrados`
              })
            )}

            {/* Campeonatos */}
            {estadisticas?.campeonatos && (
              renderStatCard({
                title: "Campeonatos Activos",
                value: estadisticas.campeonatos.en_curso || 0,
                icon: Target,
                color: '#8b5cf6',
                bgColor: '#f3e8ff',
                subtitle: `${estadisticas.campeonatos.total || 0} total • ${estadisticas.campeonatos.finalizados || 0} finalizados`
              })
            )}

            {/* Cursos */}
            {estadisticas?.cursos && (
              renderStatCard({
                title: "Cursos Abiertos",
                value: estadisticas.cursos.abiertos || 0,
                icon: BookOpen,
                color: '#f59e0b',
                bgColor: '#fef3c7',
                subtitle: `${estadisticas.cursos.total || 0} cursos registrados`
              })
            )}

            {/* Facturación del Mes */}
            {estadisticas?.facturacion && (
              renderStatCard({
                title: "Facturación del Mes",
                value: formatCurrency(estadisticas.facturacion.total_mes || 0),
                icon: DollarSign,
                color: '#ef4444',
                bgColor: '#fee2e2',
                subtitle: `${estadisticas.facturacion.vencidas || 0} facturas vencidas`
              })
            )}

            {/* Porcentaje de Actividad */}
            {estadisticas?.deportistas && (
              renderStatCard({
                title: "Tasa de Actividad",
                value: `${calcularPorcentaje(
                  estadisticas.deportistas.activos || 0,
                  estadisticas.deportistas.total || 0
                )}%`,
                icon: Activity,
                color: '#06b6d4',
                bgColor: '#cffafe'
              })
            )}
          </div>

          {/* GRÁFICOS Y TABLAS PRINCIPALES */}
          <div className="dashboard-main-grid">
            {/* FACTURACIÓN MENSUAL */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h3 className="dashboard-card-title">
                  <BarChart2 size={20} />
                  Facturación Mensual
                </h3>
                <div className="dashboard-card-actions">
                  <button className="dashboard-card-action-btn">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
              <div className="dashboard-card-body">
                {renderSimpleBarChart(facturacionMensual, '#3b82f6')}
              </div>
              {facturacionMensual.length > 0 && (
                <div className="dashboard-card-footer">
                  <div className="dashboard-card-summary">
                    <div className="dashboard-summary-item">
                      <span className="dashboard-summary-label">Total anual:</span>
                      <span className="dashboard-summary-value">
                        {formatCurrency(facturacionMensual.reduce((sum, item) => sum + (item.total || 0), 0))}
                      </span>
                    </div>
                    <div className="dashboard-summary-item">
                      <span className="dashboard-summary-label">Promedio mensual:</span>
                      <span className="dashboard-summary-value">
                        {formatCurrency(
                          facturacionMensual.length > 0 
                            ? facturacionMensual.reduce((sum, item) => sum + (item.total || 0), 0) / facturacionMensual.length
                            : 0
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PRÓXIMAS ACTIVIDADES */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h3 className="dashboard-card-title">
                  <Calendar size={20} />
                  Próximas Actividades
                </h3>
                <div className="dashboard-card-actions">
                  <button className="dashboard-card-action-btn">
                    <CalendarDays size={18} />
                  </button>
                </div>
              </div>
              <div className="dashboard-card-body">
                {proximasActividades.length === 0 ? (
                  <div className="dashboard-empty-state">
                    <Calendar size={32} />
                    <p>No hay actividades programadas</p>
                  </div>
                ) : (
                  <div className="dashboard-actividades-list">
                    {proximasActividades.map((actividad, index) => {
                      const partido = actividad;
                      
                      return (
                        <div key={index} className="dashboard-actividad-item">
                          <div className="dashboard-actividad-fecha">
                            <div className="dashboard-actividad-dia">
                              {new Date(partido.fecha).getDate()}
                            </div>
                            <div className="dashboard-actividad-mes">
                              {new Date(partido.fecha).toLocaleDateString('es-ES', { month: 'short' })}
                            </div>
                          </div>
                          <div className="dashboard-actividad-info">
                            <div className="dashboard-actividad-equipos">
                              <div className="dashboard-actividad-equipo">
                                <span className="dashboard-equipo-nombre">
                                  {partido.clubLocal?.nombre || 'Local'}
                                </span>
                                <span className="dashboard-equipo-escudo">
                                  {partido.clubLocal?.escudo ? '🏆' : '⚽'}
                                </span>
                              </div>
                              <div className="dashboard-actividad-vs">VS</div>
                              <div className="dashboard-actividad-equipo">
                                <span className="dashboard-equipo-escudo">
                                  {partido.clubVisitante?.escudo ? '🏆' : '⚽'}
                                </span>
                                <span className="dashboard-equipo-nombre">
                                  {partido.clubVisitante?.nombre || 'Visitante'}
                                </span>
                              </div>
                            </div>
                            <div className="dashboard-actividad-detalles">
                              <Clock size={12} />
                              <span>{formatTime(partido.hora)}</span>
                              <span className="dashboard-actividad-lugar">
                                {partido.escenario || 'Por definir'}
                              </span>
                            </div>
                          </div>
                          <div className="dashboard-actividad-estado">
                            <div className="dashboard-estado-badge">
                              {partido.estado === 'programado' ? 'Programado' : partido.estado}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="dashboard-card-footer">
                <button 
                  onClick={() => window.location.href = '/admin/partido'}
                  className="dashboard-card-link"
                >
                  Ver calendario completo
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* RESUMEN DEL SISTEMA */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h3 className="dashboard-card-title">
                  <Bell size={20} />
                  Resumen del Sistema
                </h3>
                <div className="dashboard-card-actions">
                  <button className="dashboard-card-action-btn">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
              <div className="dashboard-card-body">
                <div className="dashboard-resumen-list">
                  {estadisticas?.deportistas && (
                    <div className="dashboard-resumen-item">
                      <div className="dashboard-resumen-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                        <Users size={16} />
                      </div>
                      <div className="dashboard-resumen-content">
                        <h4 className="dashboard-resumen-title">Deportistas</h4>
                        <p className="dashboard-resumen-text">
                          {estadisticas.deportistas.total} registrados, {estadisticas.deportistas.activos} activos
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {estadisticas?.clubes && (
                    <div className="dashboard-resumen-item">
                      <div className="dashboard-resumen-icon" style={{background: '#dcfce7', color: '#10b981'}}>
                        <Trophy size={16} />
                      </div>
                      <div className="dashboard-resumen-content">
                        <h4 className="dashboard-resumen-title">Clubes</h4>
                        <p className="dashboard-resumen-text">
                          {estadisticas.clubes.total} clubes, {estadisticas.clubes.activos} activos
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {estadisticas?.campeonatos && (
                    <div className="dashboard-resumen-item">
                      <div className="dashboard-resumen-icon" style={{background: '#f3e8ff', color: '#8b5cf6'}}>
                        <Target size={16} />
                      </div>
                      <div className="dashboard-resumen-content">
                        <h4 className="dashboard-resumen-title">Campeonatos</h4>
                        <p className="dashboard-resumen-text">
                          {estadisticas.campeonatos.en_curso} en curso, {estadisticas.campeonatos.finalizados} finalizados
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {estadisticas?.cursos && (
                    <div className="dashboard-resumen-item">
                      <div className="dashboard-resumen-icon" style={{background: '#fef3c7', color: '#f59e0b'}}>
                        <BookOpen size={16} />
                      </div>
                      <div className="dashboard-resumen-content">
                        <h4 className="dashboard-resumen-title">Cursos</h4>
                        <p className="dashboard-resumen-text">
                          {estadisticas.cursos.total} cursos, {estadisticas.cursos.abiertos} abiertos
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="dashboard-card-footer">
                <button 
                  onClick={() => window.location.href = '/admin/deportista'}
                  className="dashboard-card-link"
                >
                  Ver todos los deportistas
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* ACCIONES RÁPIDAS */}
          <div className="dashboard-acciones-rapidas">
            <h3 className="dashboard-acciones-title">
              <Zap size={20} />
              Acciones Rápidas
            </h3>
            <div className="dashboard-acciones-grid">
              <button 
                onClick={() => window.location.href = '/admin/deportista'}
                className="dashboard-accion-btn"
              >
                <Users size={20} />
                <span>Nuevo Deportista</span>
              </button>
              <button 
                onClick={() => window.location.href = '/admin/curso'}
                className="dashboard-accion-btn"
              >
                <BookOpen size={20} />
                <span>Nuevo Curso</span>
              </button>
              <button 
                onClick={() => window.location.href = '/admin/partido'}
                className="dashboard-accion-btn"
              >
                <Calendar size={20} />
                <span>Programar Partido</span>
              </button>
              <button 
                onClick={() => window.location.href = '/admin/factura'}
                className="dashboard-accion-btn"
              >
                <DollarSign size={20} />
                <span>Generar Factura</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;