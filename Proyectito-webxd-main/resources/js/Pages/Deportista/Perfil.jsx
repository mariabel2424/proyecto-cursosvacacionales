import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, Calendar, Phone, Mail, MapPin, Heart, Award, 
  AlertCircle, Edit2, Camera, Activity, Save, X, Loader 
} from 'lucide-react';
import Sidebar from "./Sidebar";
import "../../../css/Deportista/Perfil.css";

const Perfil = () => {
  const [deportista, setDeportista] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Función para obtener headers de autenticación
  const authHeaders = useCallback(() => {
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
  }, []);

  // Función para headers de FormData
  const authFormHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return {};
    }
    return {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  // Función para parsear respuesta JSON con manejo de errores
  const parseJSONResponse = async (response) => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error('Error parsing JSON. Respuesta recibida:', text.substring(0, 500));
      if (text.includes('<!DOCTYPE')) {
        throw new Error('El servidor devolvió HTML en lugar de JSON. Verifica que la ruta del API esté correctamente configurada.');
      }
      throw new Error('Respuesta del servidor no es JSON válido');
    }
  };

  // Obtener datos del deportista autenticado
  const fetchDeportistaProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = authHeaders();
      
      // Método principal: Usar /api/auth/me para obtener el ID del deportista
      const meResponse = await fetch('/api/auth/me', {
        headers: headers
      });

      if (!meResponse.ok) {
        if (meResponse.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error(`Error ${meResponse.status}: No se pudo autenticar`);
      }

      const meData = await parseJSONResponse(meResponse);
      
      // Buscar id_deportista en la respuesta
      let idDeportista = null;
      
      if (meData.user?.deportista?.id_deportista) {
        idDeportista = meData.user.deportista.id_deportista;
      } else if (meData.user?.id_deportista) {
        idDeportista = meData.user.id_deportista;
      } else if (meData.deportista?.id_deportista) {
        idDeportista = meData.deportista.id_deportista;
      }

      if (!idDeportista) {
        setError('No tienes un perfil de deportista asociado. Contacta al administrador.');
        return;
      }
      
      // Obtener datos completos del deportista
      const deportistaResponse = await fetch(`/api/deportistas/${idDeportista}`, {
        headers: headers
      });

      if (!deportistaResponse.ok) {
        throw new Error(`Error ${deportistaResponse.status}: No se pudo cargar el perfil`);
      }

      const deportistaData = await parseJSONResponse(deportistaResponse);
      
      if (deportistaData.success && deportistaData.data) {
        setDeportista(deportistaData.data);
      } else {
        throw new Error(deportistaData.message || 'Error al cargar los datos del deportista');
      }
    } catch (err) {
      console.error('Error al cargar perfil:', err);
      setError(err.message || 'Error desconocido al cargar el perfil');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchDeportistaProfile();
  }, [fetchDeportistaProfile]);

  const handleEdit = () => {
    setFormData({
      telefono: deportista.telefono || '',
      direccion: deportista.direccion || '',
      altura: deportista.altura || '',
      peso: deportista.peso || '',
      pie_habil: deportista.pie_habil || 'derecho',
      numero_camiseta: deportista.numero_camiseta || '',
      contacto_emergencia_nombre: deportista.contacto_emergencia_nombre || '',
      contacto_emergencia_telefono: deportista.contacto_emergencia_telefono || '',
      contacto_emergencia_relacion: deportista.contacto_emergencia_relacion || ''
    });
    setEditing(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2048 * 1024) {
        alert('La imagen no debe superar los 2MB');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const data = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          data.append(key, formData[key]);
        }
      });

      if (selectedImage) {
        data.append('foto', selectedImage);
      }

      data.append('_method', 'PUT');

      const response = await fetch(`/api/deportistas/${deportista.id_deportista}`, {
        method: 'POST',
        headers: authFormHeaders(),
        body: data
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        
        const errorText = await response.text();
        let errorMessage = 'Error al actualizar el perfil';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = `${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        setDeportista(result.data);
        setEditing(false);
        setSelectedImage(null);
        setImagePreview(null);
        alert('Perfil actualizado exitosamente');
      } else {
        throw new Error(result.message || 'Error en la respuesta del servidor');
      }
    } catch (err) {
      console.error('Error al guardar:', err);
      setError(err.message);
      alert('Error al actualizar el perfil: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({});
    setSelectedImage(null);
    setImagePreview(null);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      activo: 'badge-activo',
      lesionado: 'badge-lesionado',
      suspendido: 'badge-suspendido',
      retirado: 'badge-retirado'
    };
    return `badge ${badges[estado] || badges.activo}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="perfil-loading">
        <Loader className="loading-spinner" />
        <p className="loading-text">Cargando perfil...</p>
      </div>
    );
  }

  if (error && !deportista) {
    return (
      <div className="perfil-error">
        <AlertCircle className="error-icon" />
        <p className="error-title">Error al cargar el perfil</p>
        <p className="error-description">{error}</p>
        <button onClick={fetchDeportistaProfile} className="btn-retry">
          Intentar nuevamente
        </button>
      </div>
    );
  }

  if (!deportista) {
    return (
      <div className="perfil-empty">
        <User className="empty-icon" />
        <p className="error-title">No se encontró información</p>
        <p className="empty-description">
          No se encontró información del deportista. Contacta al administrador para crear tu perfil deportivo.
        </p>
        <button onClick={fetchDeportistaProfile} className="btn-retry">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="perfil-container">
      <Sidebar />
      <div className="perfil-wrapper">
        {/* Header con foto y datos básicos */}
        <div className="perfil-header">
          <div className="perfil-banner"></div>
          
          <div className="perfil-photo-wrapper">
            <div className="perfil-content-header">
              <div className="perfil-photo-container">
                <div className="perfil-photo">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" />
                  ) : deportista.foto_url ? (
                    <img src={deportista.foto_url} alt={deportista.nombres} />
                  ) : (
                    <User className="perfil-photo-icon" />
                  )}
                </div>
                {editing && (
                  <label className="perfil-photo-upload">
                    <Camera className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
              
              <div className="perfil-info-basic">
                <h1 className="perfil-name">
                  {deportista.nombre_completo || `${deportista.nombres} ${deportista.apellidos}`}
                </h1>
                <div className="perfil-badges">
                  <span className={getEstadoBadge(deportista.estado)}>
                    {deportista.estado ? deportista.estado.charAt(0).toUpperCase() + deportista.estado.slice(1) : 'Activo'}
                  </span>
                  {deportista.categoria && (
                    <span className="badge badge-categoria">
                      {deportista.categoria.nombre}
                    </span>
                  )}
                  {deportista.numero_camiseta && (
                    <span className="badge badge-numero">
                      #{deportista.numero_camiseta}
                    </span>
                  )}
                </div>
                <p className="perfil-meta">
                  {deportista.edad ? `${deportista.edad} años` : ''} 
                  {deportista.edad && deportista.genero ? ' • ' : ''}
                  {deportista.genero || ''}
                </p>
              </div>

              <div className="perfil-actions">
                {!editing ? (
                  <button onClick={handleEdit} className="btn btn-primary">
                    <Edit2 className="w-4 h-4" />
                    Editar Perfil
                  </button>
                ) : (
                  <>
                    <button onClick={handleCancel} disabled={saving} className="btn btn-secondary">
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                    <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                      {saving ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Guardar
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {error && editing && (
              <div className="alert-error">
                <AlertCircle className="alert-error-icon" />
                <p className="alert-error-text">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Grid de información */}
        <div className="perfil-grid">
          {/* Información Personal */}
          <div className="perfil-card">
            <div className="perfil-card-header">
              <User className="perfil-card-icon" />
              <h2 className="perfil-card-title">Información Personal</h2>
            </div>
            <div className="info-items">
              <InfoItem 
                icon={<Calendar />} 
                label="Fecha de Nacimiento" 
                value={formatDate(deportista.fecha_nacimiento)} 
              />
              <InfoItem 
                icon={<User />} 
                label="Documento" 
                value={deportista.tipo_documento && deportista.numero_documento ? 
                  `${deportista.tipo_documento.toUpperCase()}: ${deportista.numero_documento}` : 
                  'No registrado'} 
              />
              <InfoItem 
                icon={<Mail />} 
                label="Correo" 
                value={deportista.correo || 'No registrado'} 
              />
              <InfoItem 
                icon={<Phone />} 
                label="Teléfono" 
                value={deportista.telefono || 'No registrado'} 
                editing={editing}
                name="telefono"
                onChange={handleChange}
                inputValue={formData.telefono}
              />
              <InfoItem 
                icon={<MapPin />} 
                label="Dirección" 
                value={deportista.direccion || 'No registrada'} 
                editing={editing}
                name="direccion"
                onChange={handleChange}
                inputValue={formData.direccion}
              />
            </div>
          </div>

          {/* Datos Deportivos */}
          <div className="perfil-card">
            <div className="perfil-card-header">
              <Activity className="perfil-card-icon" />
              <h2 className="perfil-card-title">Datos Deportivos</h2>
            </div>
            <div className="info-items">
              <InfoItem 
                icon={<Award />} 
                label="Altura" 
                value={deportista.altura ? `${deportista.altura} m` : 'No registrado'} 
                editing={editing}
                name="altura"
                type="number"
                step="0.01"
                onChange={handleChange}
                inputValue={formData.altura}
              />
              <InfoItem 
                icon={<Activity />} 
                label="Peso" 
                value={deportista.peso ? `${deportista.peso} kg` : 'No registrado'} 
                editing={editing}
                name="peso"
                type="number"
                onChange={handleChange}
                inputValue={formData.peso}
              />
              <InfoItem 
                icon={<Heart />} 
                label="IMC" 
                value={deportista.imc ? deportista.imc.toFixed(2) : 'N/A'} 
              />
              <InfoItem 
                icon={<Award />} 
                label="Pie Hábil" 
                value={deportista.pie_habil ? 
                  deportista.pie_habil.charAt(0).toUpperCase() + deportista.pie_habil.slice(1) : 
                  'No registrado'} 
                editing={editing}
                name="pie_habil"
                type="select"
                options={['derecho', 'izquierdo', 'ambos']}
                onChange={handleChange}
                inputValue={formData.pie_habil}
              />
              <InfoItem 
                icon={<Award />} 
                label="Número de Camiseta" 
                value={deportista.numero_camiseta || 'No asignado'} 
                editing={editing}
                name="numero_camiseta"
                type="number"
                min="1"
                max="99"
                onChange={handleChange}
                inputValue={formData.numero_camiseta}
              />
            </div>
          </div>

          {/* Contacto de Emergencia */}
          
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ 
  icon, 
  label, 
  value, 
  editing, 
  name, 
  onChange, 
  inputValue, 
  type = 'text', 
  step, 
  options, 
  min, 
  max 
}) => {
  return (
    <div className="info-item">
      <div className="info-item-icon">{icon}</div>
      <div className="info-item-content">
        <p className="info-item-label">{label}</p>
        {editing && name ? (
          type === 'select' ? (
            <select
              name={name}
              value={inputValue}
              onChange={onChange}
              className="info-item-select"
            >
              {options.map(opt => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              name={name}
              value={inputValue}
              onChange={onChange}
              step={step}
              min={min}
              max={max}
              className="info-item-input"
              placeholder={label}
            />
          )
        ) : (
          <p className="info-item-value">{value}</p>
        )}
      </div>
    </div>
  );
};

export default Perfil;