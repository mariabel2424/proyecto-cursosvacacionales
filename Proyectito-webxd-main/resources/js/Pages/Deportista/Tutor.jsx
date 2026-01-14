import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import Sidebar from "./Sidebar";
import "../../../css/Deportista/Tutor.css";
import {
  Users,
  User,
  Phone,
  Mail,
  AlertCircle,
  Plus,
  Star,
  Edit,
  Trash2,
  X,
  Check,
  Search,
  Loader,
  LogIn // Icono para login
} from 'lucide-react';

const Tutor = () => {
  // Estados principales
  const [tutores, setTutores] = useState([]);
  const [tutorPrincipal, setTutorPrincipal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Estados para formularios
  const [showAgregarTutorForm, setShowAgregarTutorForm] = useState(false);
  const [showDetalleTutor, setShowDetalleTutor] = useState(false);
  const [tutorSeleccionado, setTutorSeleccionado] = useState(null);
  
  // Formulario para agregar tutor
  const [formTutor, setFormTutor] = useState({
    id_tutor: '',
    principal: false,
    parentesco: ''
  });
  
  // Estado para búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [tutoresDisponibles, setTutoresDisponibles] = useState([]);
  const [buscando, setBuscando] = useState(false);
  
  // Sistema de mensajes
  const [mensaje, setMensaje] = useState(null);

  const navigate = useNavigate();

  // Mapeo de parentescos
  const parentescoMap = {
    padre: 'Padre',
    madre: 'Madre',
    abuelo: 'Abuelo',
    abuela: 'Abuela',
    tio: 'Tío',
    tia: 'Tía',
    hermano: 'Hermano',
    hermana: 'Hermana',
    tutor_legal: 'Tutor Legal',
    otro: 'Otro'
  };

  // Obtener ID del deportista
  const getDeportistaId = () => {
    return 1; // Cambia esto por el ID real del deportista
  };

  // Obtener token de localStorage
  const getToken = () => {
    return localStorage.getItem('token') || 
           localStorage.getItem('access_token') ||
           sessionStorage.getItem('token');
  };

  // Obtener usuario autenticado
  const getCurrentUser = () => {
    const userStr = localStorage.getItem('user') || 
                    sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };

  // Configurar axios con base URL y headers
  useEffect(() => {
    const token = getToken();
    const user = getCurrentUser();
    
    // Configurar base URL para todas las peticiones axios
    axios.defaults.baseURL = 'http://localhost:8000/api';
    axios.defaults.headers.common['Accept'] = 'application/json';
    axios.defaults.headers.common['Content-Type'] = 'application/json';
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      
      // Si hay usuario, verificar si es el deportista correcto
      if (user) {
        console.log('Usuario autenticado:', user);
        // Aquí podrías verificar si el usuario tiene acceso a este deportista
      }
    } else {
      setIsAuthenticated(false);
    }
    
    setAuthLoading(false);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      cargarDatos();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
      setError('No autenticado. Por favor inicie sesión.');
    }
  }, [authLoading, isAuthenticated]);

  // Función para iniciar sesión (simulada o real)
  const handleLogin = () => {
    // Redirigir a página de login
    navigate('/login');
    
    // O si tienes un modal de login:
    // setShowLoginModal(true);
  };

  // Función para probar con credenciales de prueba (solo desarrollo)
  const loginWithTestAccount = async () => {
    try {
      setAuthLoading(true);
      
      // Credenciales de prueba - ajusta según tu API
      const response = await axios.post('/auth/login', {
        email: 'test@example.com', // Cambia por un usuario real
        password: 'password123'
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setIsAuthenticated(true);
        setError(null);
        
        // Recargar datos después de login
        await cargarDatos();
        
        mostrarMensaje('success', 'Sesión iniciada correctamente');
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      mostrarMensaje('error', 'Credenciales incorrectas');
    } finally {
      setAuthLoading(false);
    }
  };

const cargarDatos = async () => {
  if (!isAuthenticated) {
    setError('No autenticado. Por favor inicie sesión.');
    setLoading(false);
    return;
  }

  setLoading(true);
  setError(null);
  
  // CORREGIR: Obtener el deportistaId usando la función getDeportistaId
  const deportistaId = getDeportistaId(); // <-- AQUÍ ESTABA EL ERROR
  
  try {
    console.log(`🔍 Cargando tutores para deportista ID: ${deportistaId}`);
    
    // USAR DATOS REALES
    const tutoresResponse = await axios.get(`/deportista-tutor/deportista/${deportistaId}/tutores`);
    
    console.log('📋 Respuesta completa:', tutoresResponse);
    console.log('📋 Datos de tutores:', tutoresResponse.data);
    
    // NOTA: Según tu controlador Laravel, la respuesta NO tiene campo 'success'
    // Tu controlador retorna directamente los datos, no un objeto con {success, data, message}
    
    // Remover la validación que busca 'success'
    const responseData = tutoresResponse.data;
    
    // Verificar estructura real de la respuesta
    if (!responseData) {
      throw new Error('No se recibieron datos del servidor');
    }
    
    // Extraer datos según la estructura REAL de tu backend
    // Según tu controlador, la respuesta es:
    // {
    //   deportista: "Nombre Apellido",
    //   total_tutores: 2,
    //   tutor_principal: {...},
    //   tutores: [...]
    // }
    
    const tutoresData = responseData.tutores || [];
    const principalData = responseData.tutor_principal;
    
    setTutores(tutoresData);
    
    if (principalData) {
      setTutorPrincipal(principalData);
    } else if (tutoresData.length > 0) {
      const principalEncontrado = tutoresData.find(t => t.principal === true || t.es_principal === true);
      if (principalEncontrado) {
        setTutorPrincipal(principalEncontrado);
      }
    }
    
    console.log(`✅ Tutores cargados: ${tutoresData.length}`);
    console.log('📊 Tutor principal:', principalData);
    
  } catch (err) {
    console.error('❌ Error completo:', err);
    console.error('❌ Error response:', err.response);
    
    if (err.response) {
      console.error('📊 Detalles error:', err.response.data);
      
      // Si hay error 500, mostrar detalles específicos
      if (err.response.status === 500) {
        // Mostrar información específica del error 500
        const errorDetail = err.response.data;
        let errorMessage = 'Error del servidor';
        
        if (errorDetail.message) {
          errorMessage = errorDetail.message;
        }
        
        if (errorDetail.error && typeof errorDetail.error === 'string') {
          errorMessage += ` - ${errorDetail.error}`;
        }
        
        setError(errorMessage);
      } else if (err.response.status === 404) {
        setError('No se encontró la información del deportista.');
      } else {
        setError(`Error ${err.response.status}: ${err.response.data?.message || 'Error desconocido'}`);
      }
    } else if (err.request) {
      setError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
    } else {
      setError('Error: ' + err.message);
    }
  } finally {
    setLoading(false);
  }
};

  // Buscar tutores disponibles para agregar
  const buscarTutores = async () => {
    if (!busqueda.trim() || !isAuthenticated) {
      setTutoresDisponibles([]);
      return;
    }

    setBuscando(true);
    try {
      const response = await axios.get('/tutores', {
        params: { buscar: busqueda }
      });
      
      const tutoresAsignadosIds = tutores.map(t => t.id_tutor || t.id || t.tutor?.id_tutor);
      let tutoresFiltrados = [];
      
      if (response.data && Array.isArray(response.data)) {
        tutoresFiltrados = response.data.filter(tutor => 
          !tutoresAsignadosIds.includes(tutor.id_tutor || tutor.id)
        );
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        tutoresFiltrados = response.data.data.filter(tutor => 
          !tutoresAsignadosIds.includes(tutor.id_tutor || tutor.id)
        );
      }
      
      setTutoresDisponibles(tutoresFiltrados);
    } catch (err) {
      console.error('Error al buscar tutores:', err);
      if (err.response?.status === 401) {
        mostrarMensaje('error', 'Sesión expirada. Inicie sesión nuevamente.');
        setIsAuthenticated(false);
      } else {
        mostrarMensaje('error', 'Error al buscar tutores disponibles');
      }
      setTutoresDisponibles([]);
    } finally {
      setBuscando(false);
    }
  };

  // Agregar tutor
  const handleAgregarTutor = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      mostrarMensaje('error', 'Debe iniciar sesión para agregar tutores');
      return;
    }
    
    if (!formTutor.id_tutor) {
      mostrarMensaje('error', 'Por favor seleccione un tutor');
      return;
    }
    if (!formTutor.parentesco) {
      mostrarMensaje('error', 'Por favor seleccione un parentesco');
      return;
    }

    try {
      await axios.post('/deportista-tutor', {
        deportista_id: getDeportistaId(),
        tutor_id: formTutor.id_tutor,
        parentesco: formTutor.parentesco,
        es_principal: formTutor.principal
      });
      
      await cargarDatos();
      setShowAgregarTutorForm(false);
      setFormTutor({ id_tutor: '', principal: false, parentesco: '' });
      setBusqueda('');
      setTutoresDisponibles([]);
      
      mostrarMensaje('success', 'Tutor agregado exitosamente');
    } catch (err) {
      console.error('Error al agregar tutor:', err.response?.data || err);
      if (err.response?.status === 401) {
        mostrarMensaje('error', 'Sesión expirada. Inicie sesión nuevamente.');
        setIsAuthenticated(false);
      } else {
        mostrarMensaje('error', err.response?.data?.message || 'Error al agregar tutor');
      }
    }
  };

  // Cambiar tutor principal
  const handleCambiarPrincipal = async (idTutor, nombreTutor) => {
    if (!isAuthenticated) {
      mostrarMensaje('error', 'Debe iniciar sesión para realizar esta acción');
      return;
    }

    if (window.confirm(`¿Está seguro de hacer a ${nombreTutor} tutor principal?`)) {
      try {
        await axios.put(`/deportista-tutor/deportista/${getDeportistaId()}/cambiar-principal`, {
          tutor_id: idTutor
        });
        
        await cargarDatos();
        mostrarMensaje('success', 'Tutor principal actualizado');
      } catch (err) {
        console.error('Error al cambiar tutor principal:', err);
        if (err.response?.status === 401) {
          mostrarMensaje('error', 'Sesión expirada. Inicie sesión nuevamente.');
          setIsAuthenticated(false);
        } else {
          mostrarMensaje('error', err.response?.data?.message || 'Error al cambiar tutor principal');
        }
      }
    }
  };

  // Eliminar tutor
  const handleEliminarTutor = async (idRelacion, nombreTutor) => {
    if (!isAuthenticated) {
      mostrarMensaje('error', 'Debe iniciar sesión para realizar esta acción');
      return;
    }

    if (window.confirm(`¿Está seguro de eliminar al tutor ${nombreTutor}?`)) {
      try {
        await axios.delete(`/deportista-tutor/${idRelacion}`);
        
        await cargarDatos();
        mostrarMensaje('success', 'Tutor eliminado exitosamente');
      } catch (err) {
        console.error('Error al eliminar tutor:', err.response?.data || err);
        if (err.response?.status === 401) {
          mostrarMensaje('error', 'Sesión expirada. Inicie sesión nuevamente.');
          setIsAuthenticated(false);
        } else {
          mostrarMensaje('error', err.response?.data?.message || 'Error al eliminar tutor');
        }
      }
    }
  };

  // Ver detalle del tutor
  const handleVerDetalleTutor = async (idTutor) => {
    if (!isAuthenticated) {
      mostrarMensaje('error', 'Debe iniciar sesión para ver detalles');
      return;
    }

    try {
      const response = await axios.get(`/tutores/${idTutor}`);
      setTutorSeleccionado(response.data);
      setShowDetalleTutor(true);
    } catch (err) {
      console.error('Error al cargar detalle del tutor:', err);
      if (err.response?.status === 401) {
        mostrarMensaje('error', 'Sesión expirada. Inicie sesión nuevamente.');
        setIsAuthenticated(false);
      } else {
        mostrarMensaje('error', 'Error al cargar información del tutor');
      }
    }
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 5000);
  };

  // Seleccionar tutor del buscador
  const seleccionarTutor = (tutor) => {
    setFormTutor({
      ...formTutor,
      id_tutor: tutor.id_tutor || tutor.id,
      parentesco: 'padre'
    });
    setBusqueda(`${tutor.nombres || tutor.nombre} ${tutor.apellidos} (${tutor.cedula || tutor.identificacion})`);
    setTutoresDisponibles([]);
  };

  // Función para obtener nombre del tutor
  const getNombreTutor = (tutor) => {
    return tutor.nombre || 
           tutor.nombres || 
           `${tutor.nombres || ''} ${tutor.apellidos || ''}`.trim() ||
           'Nombre no disponible';
  };

  // Función para obtener teléfono del tutor
  const getTelefonoTutor = (tutor) => {
    return tutor.telefono || 
           tutor.telefono_contacto || 
           tutor.telefono_movil ||
           'No disponible';
  };

  // Función para obtener email del tutor
  const getEmailTutor = (tutor) => {
    return tutor.email || 
           tutor.correo || 
           'No disponible';
  };

  // Función para obtener parentesco del tutor
  const getParentescoTutor = (tutor) => {
    return tutor.parentesco || 
           tutor.pivot?.parentesco ||
           'No especificado';
  };

  // Modal para agregar tutor
  const ModalAgregarTutor = () => (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h3>Agregar Nuevo Tutor</h3>
          <button onClick={() => setShowAgregarTutorForm(false)} className="modal-close">
            <X />
          </button>
        </div>
        
        <form onSubmit={handleAgregarTutor}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="buscarTutor">Buscar Tutor</label>
              <div className="search-wrapper">
                <input
                  type="text"
                  id="buscarTutor"
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    if (e.target.value.length > 2) {
                      buscarTutores();
                    } else {
                      setTutoresDisponibles([]);
                    }
                  }}
                  placeholder="Buscar por nombre, cédula o email..."
                  className="form-control"
                />
                <Search className="search-icon" />
              </div>
              
              {buscando && (
                <div className="search-loading">
                  <Loader className="spinner" size={16} />
                  Buscando tutores...
                </div>
              )}
              
              {tutoresDisponibles.length > 0 && (
                <div className="search-results">
                  {tutoresDisponibles.map((tutor) => (
                    <div
                      key={tutor.id_tutor || tutor.id}
                      className={`search-result-item ${
                        formTutor.id_tutor === (tutor.id_tutor || tutor.id) ? 'selected' : ''
                      }`}
                      onClick={() => seleccionarTutor(tutor)}
                    >
                      <User className="result-icon" />
                      <div className="result-info">
                        <strong>{tutor.nombres || tutor.nombre} {tutor.apellidos}</strong>
                        <span>Cédula: {tutor.cedula || tutor.identificacion}</span>
                        <span>Email: {tutor.email || tutor.correo}</span>
                      </div>
                      {formTutor.id_tutor === (tutor.id_tutor || tutor.id) && (
                        <Check className="check-icon" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {formTutor.id_tutor && (
              <div className="form-group">
                <label htmlFor="parentesco">Parentesco</label>
                <select
                  id="parentesco"
                  value={formTutor.parentesco}
                  onChange={(e) => setFormTutor({...formTutor, parentesco: e.target.value})}
                  className="form-control"
                  required
                >
                  <option value="">Seleccionar parentesco</option>
                  <option value="padre">Padre</option>
                  <option value="madre">Madre</option>
                  <option value="abuelo">Abuelo</option>
                  <option value="abuela">Abuela</option>
                  <option value="tio">Tío</option>
                  <option value="tia">Tía</option>
                  <option value="hermano">Hermano</option>
                  <option value="hermana">Hermana</option>
                  <option value="tutor_legal">Tutor Legal</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            )}
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formTutor.principal}
                  onChange={(e) => setFormTutor({...formTutor, principal: e.target.checked})}
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">¿Es tutor principal?</span>
              </label>
              <p className="form-help">El tutor principal será el contacto preferente en emergencias.</p>
            </div>
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              onClick={() => setShowAgregarTutorForm(false)}
              className="btn btn-cancel"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!formTutor.id_tutor || !formTutor.parentesco}
            >
              Agregar Tutor
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Pantalla de login
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="tutor-container">
        <Sidebar />
        <div className="tutor-content">
          <div className="login-required">
            <div className="login-card">
              <LogIn size={64} className="login-icon" />
              <h2>Acceso Requerido</h2>
              <p>Para ver y gestionar los tutores, debes iniciar sesión.</p>
              
              <div className="login-actions">
                <button onClick={handleLogin} className="btn btn-primary btn-login">
                  <LogIn className="btn-icon" />
                  Iniciar Sesión
                </button>
                
                {/* Solo para desarrollo - eliminar en producción */}
                <button 
                  onClick={loginWithTestAccount} 
                  className="btn btn-secondary btn-test"
                  style={{ marginTop: '10px' }}
                >
                  <User className="btn-icon" />
                  Usar cuenta de prueba (Desarrollo)
                </button>
              </div>
              
              <div className="login-help">
                <p className="help-text">
                  <AlertCircle size={16} />
                  Si no tienes una cuenta, contacta al administrador del sistema.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="tutor-container">
        <Sidebar />
        <div className="tutor-content">
          <div className="loading-screen">
            <Loader className="spinner animate-spin" size={48} />
            <p>{authLoading ? 'Verificando autenticación...' : 'Cargando información de tutores...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tutor-container">
      <Sidebar />
      
      {/* Mensajes */}
      {mensaje && (
        <div className={`mensaje ${mensaje.tipo}`}>
          <div className="mensaje-content">
            {mensaje.tipo === 'success' ? (
              <Check className="icon-success" />
            ) : (
              <AlertCircle className="icon-error" />
            )}
            <span>{mensaje.texto}</span>
          </div>
          <button onClick={() => setMensaje(null)} className="mensaje-close">
            <X />
          </button>
        </div>
      )}

      <div className="tutor-main">
        {/* Encabezado */}
        <div className="tutor-header">
          <div className="header-top">
            <h1 className="title">
              <Users className="title-icon" />
              MIS TUTORES
            </h1>
            <p className="subtitle">Gestiona tus tutores registrados</p>
            {error && (
              <div className="error-banner">
                <AlertCircle size={20} />
                <span>{error}</span>
                <button onClick={cargarDatos} className="btn-reintentar">
                  Reintentar
                </button>
              </div>
            )}
          </div>
          
          <div className="header-actions">
            <button
              onClick={() => setShowAgregarTutorForm(true)}
              className="btn btn-primary"
              disabled={!isAuthenticated}
            >
              <Plus className="btn-icon" />
              Agregar Tutor
            </button>
          </div>
        </div>

        {/* Tutor Principal */}
        {tutorPrincipal && (
          <div className="card-principal">
            <div className="principal-header">
              <Star className="star-gold" />
              <h3>Tutor Principal</h3>
            </div>
            
            <div className="principal-content">
              <div className="principal-avatar">
                <User className="avatar-icon" />
              </div>
              
              <div className="principal-info">
                <h4>{getNombreTutor(tutorPrincipal)}</h4>
                <div className="principal-details">
                  <div className="detail">
                    <Phone className="detail-icon" />
                    <span>{getTelefonoTutor(tutorPrincipal)}</span>
                  </div>
                  <div className="detail">
                    <Mail className="detail-icon" />
                    <span>{getEmailTutor(tutorPrincipal)}</span>
                  </div>
                  <div className="detail">
                    <span className="badge-parentesco">
                      {parentescoMap[getParentescoTutor(tutorPrincipal)] || getParentescoTutor(tutorPrincipal)}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleVerDetalleTutor(tutorPrincipal.id_tutor || tutorPrincipal.id)}
                className="btn-details"
                disabled={!isAuthenticated}
              >
                <Edit className="details-icon" />
                Ver Detalles
              </button>
            </div>
          </div>
        )}

        {/* Lista de Tutores */}
        <div className="card-section">
          <div className="section-header">
            <h2>Todos los Tutores</h2>
            <span className="badge">{tutores.length} tutor(es)</span>
          </div>
          
          {tutores.length === 0 ? (
            <div className="empty-state">
              <Users className="empty-icon" />
              <h4>No hay tutores registrados</h4>
              <p>Agrega tu primer tutor para comenzar</p>
              <button
                onClick={() => setShowAgregarTutorForm(true)}
                className="btn btn-primary"
                disabled={!isAuthenticated}
              >
                <Plus className="btn-icon" />
                Agregar Primer Tutor
              </button>
            </div>
          ) : (
            <div className="tutores-list">
              {tutores.map((tutor) => {
                const idRelacion = tutor.id_relacion || tutor.pivot?.id || tutor.id;
                const idTutor = tutor.id_tutor || tutor.id || tutor.tutor?.id;
                const nombre = getNombreTutor(tutor);
                const esPrincipal = tutor.es_principal === true || 
                                   tutor.principal === true || 
                                   tutor.pivot?.es_principal === true;
                
                return (
                  <div key={idRelacion} className="tutor-item">
                    <div className="tutor-header">
                      <div className="tutor-avatar">
                        <User className="avatar-icon" />
                      </div>
                      <div className="tutor-info">
                        <h4>{nombre}</h4>
                        <div className="tutor-meta">
                          <span className="parentesco">
                            {parentescoMap[getParentescoTutor(tutor)] || getParentescoTutor(tutor)}
                          </span>
                          {esPrincipal && (
                            <span className="badge-primary">
                              <Star className="badge-icon" />
                              Principal
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="tutor-contact">
                      <div className="contact-item">
                        <Phone className="contact-icon" />
                        <span>{getTelefonoTutor(tutor)}</span>
                      </div>
                      <div className="contact-item">
                        <Mail className="contact-icon" />
                        <span>{getEmailTutor(tutor)}</span>
                      </div>
                    </div>
                    
                    <div className="tutor-actions">
                      {!esPrincipal && (
                        <button
                          onClick={() => handleCambiarPrincipal(idTutor, nombre)}
                          className="btn-icon btn-star"
                          title="Hacer principal"
                          disabled={!isAuthenticated}
                        >
                          <Star />
                        </button>
                      )}
                      <button
                        onClick={() => handleVerDetalleTutor(idTutor)}
                        className="btn-icon btn-edit"
                        title="Ver detalles"
                        disabled={!isAuthenticated}
                      >
                        <Edit />
                      </button>
                      {!esPrincipal && (
                        <button
                          onClick={() => handleEliminarTutor(idRelacion, nombre)}
                          className="btn-icon btn-delete"
                          title="Eliminar"
                          disabled={!isAuthenticated}
                        >
                          <Trash2 />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Agregar Tutor */}
      {showAgregarTutorForm && <ModalAgregarTutor />}

      {/* Modal Detalle Tutor */}
      {showDetalleTutor && tutorSeleccionado && (
        <div className="modal-backdrop">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>Detalle del Tutor</h3>
              <button onClick={() => setShowDetalleTutor(false)} className="modal-close">
                <X />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detalle-grid">
                <div className="detalle-col">
                  <h4>Información Personal</h4>
                  <div className="info-list">
                    <div className="info-item">
                      <span className="info-label">Nombre:</span>
                      <span className="info-value">
                        {tutorSeleccionado.nombres || tutorSeleccionado.nombre} {tutorSeleccionado.apellidos}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Cédula:</span>
                      <span className="info-value">{tutorSeleccionado.cedula || tutorSeleccionado.identificacion}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Parentesco:</span>
                      <span className="info-value">
                        {parentescoMap[tutorSeleccionado.parentesco] || tutorSeleccionado.parentesco}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Estado:</span>
                      <span className={`info-value status-${tutorSeleccionado.activo ? 'active' : 'inactive'}`}>
                        {tutorSeleccionado.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="detalle-col">
                  <h4>Contacto</h4>
                  <div className="info-list">
                    <div className="info-item">
                      <Phone className="info-icon" />
                      <span className="info-value">{tutorSeleccionado.telefono}</span>
                    </div>
                    <div className="info-item">
                      <Mail className="info-icon" />
                      <span className="info-value">{tutorSeleccionado.email}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Deportistas asociados */}
              {tutorSeleccionado.deportistas && tutorSeleccionado.deportistas.length > 0 && (
                <div className="detalle-section">
                  <h4>Deportistas Asociados</h4>
                  <div className="deportistas-list">
                    {tutorSeleccionado.deportistas.map((deportista, idx) => (
                      <div key={idx} className="deportista-item">
                        <User className="deportista-icon" />
                        <div className="deportista-info">
                          <strong>{deportista.nombre}</strong>
                          <div className="deportista-details">
                            <span>Edad: {deportista.edad}</span>
                            <span>Categoría: {deportista.categoria}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowDetalleTutor(false)}
                className="btn btn-cancel"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tutor;