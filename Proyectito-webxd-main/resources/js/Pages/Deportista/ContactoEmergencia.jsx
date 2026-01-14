import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from "./Sidebar";
import "../../../css/Deportista/ContactoEmergencia.css";
import {
  ShieldAlert,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Plus,
  User,
  X,
  Check,
  Loader,
  Edit,
  Trash2
} from 'lucide-react';

const ContactoEmergencia = () => {
  // Estados principales
  const [contactosEmergencia, setContactosEmergencia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para formularios
  const [showAgregarContactoForm, setShowAgregarContactoForm] = useState(false);
  const [showEditarContactoForm, setShowEditarContactoForm] = useState(false);
  const [contactoSeleccionado, setContactoSeleccionado] = useState(null);
  
  // Formulario para contacto de emergencia
  const [formContactoEmergencia, setFormContactoEmergencia] = useState({
    nombre: '',
    parentesco: 'padre',
    telefono: '',
    email: '',
    direccion: '',
    tipo: 'secundario'
  });
  
  // Sistema de mensajes
  const [mensaje, setMensaje] = useState(null);

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
    primo: 'Primo',
    prima: 'Prima',
    vecino: 'Vecino',
    amigo: 'Amigo',
    otro: 'Otro'
  };

  // Mapeo de tipos
  const tipoMap = {
    principal: 'Principal',
    secundario: 'Secundario',
    emergencia: 'Emergencia adicional'
  };

  // Obtener ID del deportista
  const getDeportistaId = () => {
    return 1; // Cambia esto por el ID real del deportista
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarContactos();
  }, []);

  const cargarContactos = async () => {
    setLoading(true);
    setError(null);
    
    const deportistaId = getDeportistaId();
    
    try {
      console.log(`🔍 Cargando contactos de emergencia para deportista ID: ${deportistaId}`);
      
      const response = await axios.get(`/deportista-tutor/deportista/${deportistaId}/contactos-emergencia`);
      console.log('📞 Respuesta de contactos:', response.data);
      
      let contactosData = [];
      if (response.data) {
        if (response.data.contactos && Array.isArray(response.data.contactos)) {
          contactosData = response.data.contactos;
        } else if (Array.isArray(response.data)) {
          contactosData = response.data;
        }
      }
      
      setContactosEmergencia(contactosData);
      console.log(`✅ Contactos cargados: ${contactosData.length}`);
      
    } catch (err) {
      console.error('❌ Error al cargar contactos:', err);
      
      if (err.response) {
        if (err.response.status === 404) {
          setError('No se encontró la información del deportista.');
        } else if (err.response.status === 500) {
          setError('Error interno del servidor.');
        } else {
          setError(`Error ${err.response.status}: ${err.response.data?.message || 'Error desconocido'}`);
        }
      } else if (err.request) {
        setError('No se pudo conectar con el servidor.');
      } else {
        setError('Error de configuración: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Agregar contacto de emergencia
  const handleAgregarContactoEmergencia = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/deportista-tutor/deportista/${getDeportistaId()}/agregar-emergencia`, formContactoEmergencia);
      
      await cargarContactos();
      setShowAgregarContactoForm(false);
      setFormContactoEmergencia({
        nombre: '',
        parentesco: 'padre',
        telefono: '',
        email: '',
        direccion: '',
        tipo: 'secundario'
      });
      
      mostrarMensaje('success', 'Contacto de emergencia agregado exitosamente');
    } catch (err) {
      console.error('Error al agregar contacto de emergencia:', err);
      mostrarMensaje('error', err.response?.data?.message || 'Error al agregar contacto');
    }
  };

  // Editar contacto de emergencia
  const handleEditarContactoEmergencia = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/contactos-emergencia/${contactoSeleccionado.id_contacto}`, formContactoEmergencia);
      
      await cargarContactos();
      setShowEditarContactoForm(false);
      setContactoSeleccionado(null);
      resetForm();
      
      mostrarMensaje('success', 'Contacto actualizado exitosamente');
    } catch (err) {
      console.error('Error al editar contacto:', err);
      mostrarMensaje('error', 'Error al actualizar contacto');
    }
  };

  // Eliminar contacto de emergencia
  const handleEliminarContacto = async (idContacto, nombre) => {
    if (window.confirm(`¿Está seguro de eliminar el contacto de emergencia "${nombre}"?`)) {
      try {
        await axios.delete(`/contactos-emergencia/${idContacto}`);
        
        await cargarContactos();
        mostrarMensaje('success', 'Contacto eliminado exitosamente');
      } catch (err) {
        console.error('Error al eliminar contacto:', err);
        mostrarMensaje('error', 'Error al eliminar contacto');
      }
    }
  };

  // Cargar contacto para editar
  const handleEditarContacto = (contacto) => {
    setContactoSeleccionado(contacto);
    setFormContactoEmergencia({
      nombre: contacto.nombre,
      parentesco: contacto.parentesco,
      telefono: contacto.telefono,
      email: contacto.email || '',
      direccion: contacto.direccion || '',
      tipo: contacto.tipo || 'secundario'
    });
    setShowEditarContactoForm(true);
  };

  // Resetear formulario
  const resetForm = () => {
    setFormContactoEmergencia({
      nombre: '',
      parentesco: 'padre',
      telefono: '',
      email: '',
      direccion: '',
      tipo: 'secundario'
    });
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 5000);
  };

  // Modal para agregar/editar contacto
  const ModalContactoForm = ({ esEdicion = false }) => (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h3>{esEdicion ? 'Editar Contacto' : 'Agregar Contacto de Emergencia'}</h3>
          <button onClick={() => {
            if (esEdicion) {
              setShowEditarContactoForm(false);
              setContactoSeleccionado(null);
            } else {
              setShowAgregarContactoForm(false);
            }
            resetForm();
          }} className="modal-close">
            <X />
          </button>
        </div>
        
        <form onSubmit={esEdicion ? handleEditarContactoEmergencia : handleAgregarContactoEmergencia}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="nombre">Nombre Completo *</label>
              <input
                type="text"
                id="nombre"
                value={formContactoEmergencia.nombre}
                onChange={(e) => setFormContactoEmergencia({...formContactoEmergencia, nombre: e.target.value})}
                placeholder="Nombre del contacto"
                required
                className="form-control"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="parentesco">Parentesco *</label>
                <select
                  id="parentesco"
                  value={formContactoEmergencia.parentesco}
                  onChange={(e) => setFormContactoEmergencia({...formContactoEmergencia, parentesco: e.target.value})}
                  required
                  className="form-control"
                >
                  {Object.entries(parentescoMap).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="tipo">Tipo de Contacto</label>
                <select
                  id="tipo"
                  value={formContactoEmergencia.tipo}
                  onChange={(e) => setFormContactoEmergencia({...formContactoEmergencia, tipo: e.target.value})}
                  className="form-control"
                >
                  {Object.entries(tipoMap).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="telefono">Teléfono *</label>
              <input
                type="tel"
                id="telefono"
                value={formContactoEmergencia.telefono}
                onChange={(e) => setFormContactoEmergencia({...formContactoEmergencia, telefono: e.target.value})}
                placeholder="Número de teléfono"
                required
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={formContactoEmergencia.email}
                onChange={(e) => setFormContactoEmergencia({...formContactoEmergencia, email: e.target.value})}
                placeholder="Correo electrónico"
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="direccion">Dirección</label>
              <textarea
                id="direccion"
                value={formContactoEmergencia.direccion}
                onChange={(e) => setFormContactoEmergencia({...formContactoEmergencia, direccion: e.target.value})}
                placeholder="Dirección completa"
                rows="3"
                className="form-control"
              />
            </div>
            
            <div className="form-info">
              <AlertCircle size={16} />
              <span>Los campos marcados con * son obligatorios</span>
            </div>
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              onClick={() => {
                if (esEdicion) {
                  setShowEditarContactoForm(false);
                  setContactoSeleccionado(null);
                } else {
                  setShowAgregarContactoForm(false);
                }
                resetForm();
              }}
              className="btn btn-cancel"
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {esEdicion ? 'Actualizar Contacto' : 'Agregar Contacto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="contacto-container">
        <Sidebar />
        <div className="contacto-content">
          <div className="loading-screen">
            <Loader className="spinner animate-spin" size={48} />
            <p>Cargando contactos de emergencia...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contacto-container">
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

      <div className="contacto-main">
        {/* Encabezado */}
        <div className="contacto-header">
          <div className="header-top">
            <h1 className="title">
              <ShieldAlert className="title-icon" />
              CONTACTOS DE EMERGENCIA
            </h1>
            <p className="subtitle">Gestiona tus contactos para situaciones de emergencia</p>
            {error && (
              <div className="error-banner">
                <AlertCircle size={20} />
                <span>{error}</span>
                <button onClick={cargarContactos} className="btn-reintentar">
                  Reintentar
                </button>
              </div>
            )}
          </div>
          
          <div className="header-actions">
            <button
              onClick={() => setShowAgregarContactoForm(true)}
              className="btn btn-primary"
            >
              <Plus className="btn-icon" />
              Agregar Contacto
            </button>
          </div>
        </div>

        {/* Contactos de Emergencia */}
        <div className="card-section">
          <div className="section-header">
            <div className="section-title">
              <ShieldAlert className="section-icon" />
              <h2>Mis Contactos de Emergencia</h2>
            </div>
            <span className="badge">{contactosEmergencia.length} contacto(s)</span>
          </div>
          
          {contactosEmergencia.length === 0 ? (
            <div className="empty-state">
              <ShieldAlert className="empty-icon" />
              <h4>No hay contactos de emergencia</h4>
              <p>Agrega contactos para situaciones de emergencia</p>
              <button
                onClick={() => setShowAgregarContactoForm(true)}
                className="btn btn-primary"
              >
                <UserPlus className="btn-icon" />
                Agregar Primer Contacto
              </button>
            </div>
          ) : (
            <div className="emergencia-grid">
              {contactosEmergencia.map((contacto, index) => (
                <div key={contacto.id_contacto || index} className="emergencia-card">
                  <div className="emergencia-header">
                    <div className="emergencia-type">
                      {contacto.tipo === 'principal' || contacto.tipo === 'Principal' ? (
                        <ShieldAlert className="type-icon primary" />
                      ) : (
                        <User className="type-icon secondary" />
                      )}
                      <span className={`type-badge ${contacto.tipo?.toLowerCase() || 'secundario'}`}>
                        {tipoMap[contacto.tipo?.toLowerCase()] || 'Contacto'}
                      </span>
                    </div>
                    
                    <div className="emergencia-actions">
                      <button
                        onClick={() => handleEditarContacto(contacto)}
                        className="btn-icon btn-edit"
                        title="Editar"
                      >
                        <Edit />
                      </button>
                      <button
                        onClick={() => handleEliminarContacto(
                          contacto.id_contacto || contacto.id, 
                          contacto.nombre
                        )}
                        className="btn-icon btn-delete"
                        title="Eliminar"
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                  
                  <div className="emergencia-content">
                    <h4>{contacto.nombre}</h4>
                    <p className="parentesco">
                      {parentescoMap[contacto.parentesco] || contacto.parentesco}
                    </p>
                    
                    <div className="emergencia-contact">
                      <div className="contact-item">
                        <Phone className="contact-icon" />
                        <span>{contacto.telefono}</span>
                      </div>
                      
                      {contacto.email && (
                        <div className="contact-item">
                          <Mail className="contact-icon" />
                          <span>{contacto.email}</span>
                        </div>
                      )}
                      
                      {contacto.direccion && (
                        <div className="contact-item">
                          <MapPin className="contact-icon" />
                          <span className="direccion-text">{contacto.direccion}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="emergencia-notas">
                      {contacto.notas && (
                        <p className="notas-text">{contacto.notas}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Información importante */}
        <div className="info-card">
          <div className="info-header">
            <ShieldAlert className="info-icon" />
            <h3>Importante</h3>
          </div>
          <div className="info-content">
            <ul>
              <li>Los contactos de emergencia serán notificados en situaciones críticas</li>
              <li>Mantén la información actualizada para garantizar una respuesta rápida</li>
              <li>Se recomienda tener al menos 2 contactos de emergencia registrados</li>
              <li>El contacto principal será el primero en ser contactado</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal Agregar Contacto */}
      {showAgregarContactoForm && <ModalContactoForm />}
      
      {/* Modal Editar Contacto */}
      {showEditarContactoForm && <ModalContactoForm esEdicion={true} />}
    </div>
  );
};

export default ContactoEmergencia;