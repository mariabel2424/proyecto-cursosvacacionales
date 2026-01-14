import React, { useState, useEffect, useRef } from 'react';
import {
  File, FileText, Image, Video, Music, Folder,
  Upload, Download, Trash2, Eye, Filter, Search,
  Paperclip, FileArchive, FileCode, FileSpreadsheet,
  FileVideo, FileAudio, FileImage, FileType, FileJson,
  Copy, Share2, MoreVertical, ExternalLink, CheckCircle,
  AlertCircle, XCircle, Info, ChevronLeft, ChevronRight,
  Grid, List, FolderOpen, HardDrive, Cloud, Server,
  Users, Calendar, Tag, FolderPlus, RefreshCw,
  BarChart, PieChart, TrendingUp, Zap, Shield, Lock,
  Unlock, Edit2, Star, Bookmark, Heart, ThumbsUp
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../../css/Admin/archivo.css';

const API_ARCHIVOS = 'http://127.0.0.1:8000/api/archivos';

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

const Archivo = () => {
  // Estados principales
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  const [selectedArchivo, setSelectedArchivo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [archivableTypeFilter, setArchivableTypeFilter] = useState('');
  const [archivableIdFilter, setArchivableIdFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'detailed'
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Formularios
  const [formData, setFormData] = useState({
    archivable_type: '',
    archivable_id: '',
    tipo: 'documento',
    descripcion: ''
  });
  
  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dropzoneRef = useRef(null);

  // Tipos de archivos
  const tipos = [
    { value: 'imagen', label: 'Imagen', icon: FileImage, color: '#10b981', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'] },
    { value: 'documento', label: 'Documento', icon: FileText, color: '#3b82f6', extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'] },
    { value: 'video', label: 'Video', icon: FileVideo, color: '#ef4444', extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'] },
    { value: 'audio', label: 'Audio', icon: FileAudio, color: '#8b5cf6', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac'] },
    { value: 'otro', label: 'Otro', icon: File, color: '#6b7280', extensions: [] }
  ];

  // Tipos de entidades relacionables
  const archivableTypes = [
    { value: 'App\\Models\\Usuario', label: 'Usuario' },
    { value: 'App\\Models\\Deportista', label: 'Deportista' },
    { value: 'App\\Models\\Factura', label: 'Factura' },
    { value: 'App\\Models\\Pago', label: 'Pago' },
    { value: 'App\\Models\\Escenario', label: 'Escenario' },
    { value: 'App\\Models\\Actividad', label: 'Actividad' }
  ];

  // Funciones helper
  const getTipoConfig = (tipo) => {
    return tipos.find(t => t.value === tipo) || tipos[0];
  };

  const getFileIcon = (extension, tipo) => {
    const extensionMap = {
      // Documentos
      'pdf': FileText,
      'doc': FileText,
      'docx': FileText,
      'txt': FileText,
      'rtf': FileText,
      'odt': FileText,
      
      // Hojas de cálculo
      'xls': FileSpreadsheet,
      'xlsx': FileSpreadsheet,
      'csv': FileSpreadsheet,
      
      // Presentaciones
      'ppt': FileType,
      'pptx': FileType,
      
      // Imágenes
      'jpg': FileImage,
      'jpeg': FileImage,
      'png': FileImage,
      'gif': FileImage,
      'bmp': FileImage,
      'svg': FileImage,
      'webp': FileImage,
      
      // Videos
      'mp4': FileVideo,
      'avi': FileVideo,
      'mov': FileVideo,
      'wmv': FileVideo,
      'flv': FileVideo,
      'mkv': FileVideo,
      
      // Audio
      'mp3': FileAudio,
      'wav': FileAudio,
      'ogg': FileAudio,
      'm4a': FileAudio,
      'flac': FileAudio,
      
      // Código
      'js': FileCode,
      'jsx': FileCode,
      'ts': FileCode,
      'tsx': FileCode,
      'php': FileCode,
      'html': FileCode,
      'css': FileCode,
      'py': FileCode,
      'java': FileCode,
      'cpp': FileCode,
      
      // Comprimidos
      'zip': FileArchive,
      'rar': FileArchive,
      '7z': FileArchive,
      'tar': FileArchive,
      'gz': FileArchive,
      
      // Otros
      'json': FileJson,
      'xml': FileCode,
    };
    
    const tipoConfig = getTipoConfig(tipo);
    return extensionMap[extension.toLowerCase()] || tipoConfig.icon;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  // Cargar archivos
  const loadArchivos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: currentPage
      };
      
      if (tipoFilter !== 'all') params.tipo = tipoFilter;
      if (archivableTypeFilter.trim() !== '') params.archivable_type = archivableTypeFilter;
      if (archivableIdFilter.trim() !== '') params.archivable_id = archivableIdFilter;
      if (searchTerm.trim() !== '') params.search = searchTerm;
      
      const queryParams = new URLSearchParams(params);
      const url = `${API_ARCHIVOS}?${queryParams}`;
      
      console.log('🔍 Cargando archivos desde:', url);
      
      const response = await fetch(url, {
        headers: authHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('📦 Archivos recibidos:', data.data?.length || 0);
      setArchivos(data.data || []);
      setTotalPages(data.last_page || 1);
      
    } catch (err) {
      console.error('❌ Error cargando archivos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Subir archivo
  const uploadArchivo = async () => {
    if (!selectedFile) {
      alert('❌ Por favor, selecciona un archivo');
      return;
    }
    
    if (!formData.archivable_type || !formData.archivable_id) {
      alert('❌ Por favor, especifica la entidad relacionada');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setErrors({});
    
    try {
      const formDataToSend = new FormData();
      
      // Agregar archivo
      formDataToSend.append('archivo', selectedFile);
      
      // Agregar otros campos
      formDataToSend.append('archivable_type', formData.archivable_type);
      formDataToSend.append('archivable_id', formData.archivable_id);
      formDataToSend.append('tipo', formData.tipo);
      
      if (formData.descripcion.trim() !== '') {
        formDataToSend.append('descripcion', formData.descripcion);
      }
      
      console.log('📤 Enviando archivo:', {
        nombre: selectedFile.name,
        tamaño: selectedFile.size,
        tipo: selectedFile.type
      });
      
      // Simular progreso de carga (en producción usaría XMLHttpRequest o axios con onUploadProgress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      const token = localStorage.getItem('token');
      const response = await fetch(API_ARCHIVOS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formDataToSend
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const data = await response.json();
      console.log('📦 Response:', data);
      
      if (response.ok) {
        alert('✅ Archivo subido exitosamente');
        closeUploadModal();
        loadArchivos();
      } else {
        setErrors(data.errors || { message: data.message || 'Error al subir archivo' });
        alert(`❌ Error: ${data.message || 'No se pudo subir el archivo'}`);
      }
    } catch (error) {
      console.error('❌ Error subiendo archivo:', error);
      alert('❌ Error de conexión');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Descargar archivo
  const downloadArchivo = async (archivo) => {
    try {
      console.log('⬇️ Descargando archivo:', archivo.nombre_original);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ARCHIVOS}/${archivo.id_archivo}/descargar`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = archivo.nombre_original;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('✅ Archivo descargado exitosamente');
      } else {
        console.error('❌ Error descargando archivo');
        alert('❌ No se pudo descargar el archivo');
      }
    } catch (error) {
      console.error('❌ Error descargando:', error);
      alert('❌ Error de conexión');
    }
  };

  // Eliminar archivo
  const deleteArchivo = async () => {
    if (!selectedArchivo) return;
    
    try {
      const response = await fetch(`${API_ARCHIVOS}/${selectedArchivo.id_archivo}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      if (response.ok) {
        alert('✅ Archivo eliminado exitosamente');
        closeDeleteModal();
        loadArchivos();
      } else {
        alert('❌ Error al eliminar archivo');
      }
    } catch (error) {
      console.error('❌ Error eliminando archivo:', error);
      alert('❌ Error de conexión');
    }
  };

  // Previsualizar archivo
  const previewArchivo = async (archivo) => {
    try {
      if (archivo.tipo === 'imagen') {
        // Para imágenes, mostrar directamente
        const imageUrl = `http://127.0.0.1:8000/storage/${archivo.ruta}`;
        setPreviewUrl(imageUrl);
        setSelectedArchivo(archivo);
        setShowPreviewModal(true);
      } else if (archivo.tipo === 'documento' && archivo.extension === 'pdf') {
        // Para PDFs, usar el visor del navegador
        const pdfUrl = `http://127.0.0.1:8000/storage/${archivo.ruta}`;
        window.open(pdfUrl, '_blank');
      } else {
        // Para otros tipos, descargar o mostrar información
        setSelectedArchivo(archivo);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('❌ Error previsualizando archivo:', error);
    }
  };

  // Modal functions
  const openDetailModal = async (archivo) => {
    try {
      const response = await fetch(`${API_ARCHIVOS}/${archivo.id_archivo}`, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedArchivo(data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error cargando detalles:', error);
    }
  };

  const openUploadModal = () => {
    setFormData({
      archivable_type: '',
      archivable_id: '',
      tipo: 'documento',
      descripcion: ''
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrors({});
    setShowUploadModal(true);
  };

  const openDeleteModal = (archivo) => {
    setSelectedArchivo(archivo);
    setShowDeleteModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedArchivo(null);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setFormData({
      archivable_type: '',
      archivable_id: '',
      tipo: 'documento',
      descripcion: ''
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrors({});
    setUploading(false);
    setUploadProgress(0);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedArchivo(null);
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewUrl(null);
    setSelectedArchivo(null);
  };

  // Helper functions
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('❌ El archivo es demasiado grande (máximo 10MB)');
        return;
      }
      
      setSelectedFile(file);
      
      // Determinar tipo basado en extensión
      const extension = getFileExtension(file.name);
      const tipo = determinarTipoPorExtension(extension);
      
      setFormData(prev => ({
        ...prev,
        tipo: tipo
      }));
      
      // Crear preview si es imagen
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const determinarTipoPorExtension = (extension) => {
    const extensionMap = {
      // Imágenes
      'jpg': 'imagen',
      'jpeg': 'imagen',
      'png': 'imagen',
      'gif': 'imagen',
      'bmp': 'imagen',
      'svg': 'imagen',
      'webp': 'imagen',
      
      // Documentos
      'pdf': 'documento',
      'doc': 'documento',
      'docx': 'documento',
      'txt': 'documento',
      'rtf': 'documento',
      'odt': 'documento',
      'xls': 'documento',
      'xlsx': 'documento',
      'ppt': 'documento',
      'pptx': 'documento',
      
      // Videos
      'mp4': 'video',
      'avi': 'video',
      'mov': 'video',
      'wmv': 'video',
      'flv': 'video',
      'mkv': 'video',
      
      // Audio
      'mp3': 'audio',
      'wav': 'audio',
      'ogg': 'audio',
      'm4a': 'audio',
      'flac': 'audio',
    };
    
    return extensionMap[extension.toLowerCase()] || 'otro';
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropzoneRef.current) {
      dropzoneRef.current.classList.add('drag-over');
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropzoneRef.current) {
      dropzoneRef.current.classList.remove('drag-over');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (dropzoneRef.current) {
      dropzoneRef.current.classList.remove('drag-over');
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // Crear un evento similar al input para usar handleFileSelect
      const event = {
        target: {
          files: [file]
        }
      };
      handleFileSelect(event);
    }
  };

  // Estadísticas
  const stats = {
    total: archivos.length,
    imagenes: archivos.filter(a => a.tipo === 'imagen').length,
    documentos: archivos.filter(a => a.tipo === 'documento').length,
    videos: archivos.filter(a => a.tipo === 'video').length,
    audios: archivos.filter(a => a.tipo === 'audio').length,
    otros: archivos.filter(a => a.tipo === 'otro').length,
    totalSize: archivos.reduce((sum, a) => sum + (a.tamaño || 0), 0)
  };

  // Efectos
  useEffect(() => {
    loadArchivos();
  }, [currentPage, tipoFilter, archivableTypeFilter, archivableIdFilter, searchTerm]);

  return (
    <div className="archivo-container">
      <Sidebar />
      
      <div className="archivo-content">
        <Topbar />
        
        <div className="archivo-main">
          {/* HEADER */}
          <div className="archivo-header">
            <div>
              <h1 className="archivo-title">
                <Folder size={28} />
                Gestión de Archivos
              </h1>
              <p className="archivo-subtitle">
                Administra y organiza todos los archivos del sistema
              </p>
            </div>
            <div className="archivo-header-actions">
              <button 
                onClick={openUploadModal}
                className="archivo-btn-primary"
              >
                <Upload size={20} />
                Subir Archivo
              </button>
            </div>
          </div>

          {/* ESTADÍSTICAS */}
          <div className="archivo-stats-grid">
            <div className="archivo-stat-card">
              <div className="archivo-stat-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                <File size={24} />
              </div>
              <div>
                <h3 className="archivo-stat-number">{stats.total}</h3>
                <p className="archivo-stat-label">Archivos</p>
              </div>
            </div>
            <div className="archivo-stat-card">
              <div className="archivo-stat-icon" style={{background: '#dcfce7', color: '#10b981'}}>
                <FileImage size={24} />
              </div>
              <div>
                <h3 className="archivo-stat-number">{stats.imagenes}</h3>
                <p className="archivo-stat-label">Imágenes</p>
              </div>
            </div>
            <div className="archivo-stat-card">
              <div className="archivo-stat-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                <FileText size={24} />
              </div>
              <div>
                <h3 className="archivo-stat-number">{stats.documentos}</h3>
                <p className="archivo-stat-label">Documentos</p>
              </div>
            </div>
            <div className="archivo-stat-card">
              <div className="archivo-stat-icon" style={{background: '#fee2e2', color: '#ef4444'}}>
                <FileVideo size={24} />
              </div>
              <div>
                <h3 className="archivo-stat-number">{stats.videos}</h3>
                <p className="archivo-stat-label">Videos</p>
              </div>
            </div>
            <div className="archivo-stat-card">
              <div className="archivo-stat-icon" style={{background: '#f3e8ff', color: '#8b5cf6'}}>
                <FileAudio size={24} />
              </div>
              <div>
                <h3 className="archivo-stat-number">{stats.audios}</h3>
                <p className="archivo-stat-label">Audios</p>
              </div>
            </div>
            <div className="archivo-stat-card">
              <div className="archivo-stat-icon" style={{background: '#f1f5f9', color: '#64748b'}}>
                <HardDrive size={24} />
              </div>
              <div>
                <h3 className="archivo-stat-number">{formatFileSize(stats.totalSize)}</h3>
                <p className="archivo-stat-label">Espacio Total</p>
              </div>
            </div>
          </div>

          {/* FILTROS */}
          <div className="archivo-filters">
            <div className="archivo-filters-row">
              <div className="archivo-search-container">
                <Search className="archivo-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Buscar archivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="archivo-search-input"
                />
              </div>
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="archivo-filter-select"
              >
                <option value="all">Todos los tipos</option>
                {tipos.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
              <select
                value={archivableTypeFilter}
                onChange={(e) => setArchivableTypeFilter(e.target.value)}
                className="archivo-filter-select"
              >
                <option value="">Todas las entidades</option>
                {archivableTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="ID de entidad"
                value={archivableIdFilter}
                onChange={(e) => setArchivableIdFilter(e.target.value)}
                className="archivo-id-input"
              />
              <button onClick={loadArchivos} className="archivo-btn-secondary">
                <Filter size={18} />
                Filtrar
              </button>
              <button onClick={() => {
                setSearchTerm('');
                setTipoFilter('all');
                setArchivableTypeFilter('');
                setArchivableIdFilter('');
              }} className="archivo-btn-secondary">
                <RefreshCw size={18} />
                Limpiar
              </button>
            </div>
          </div>

          {/* CONTENIDO */}
          {loading ? (
            <div className="archivo-loading">
              <div className="archivo-loading-spinner"></div>
              <p>Cargando archivos...</p>
            </div>
          ) : error ? (
            <div className="archivo-error">
              <AlertCircle size={48} />
              <h3>Error al cargar archivos</h3>
              <p>{error}</p>
              <button onClick={loadArchivos} className="archivo-btn-primary">
                <RefreshCw size={18} />
                Reintentar
              </button>
            </div>
          ) : archivos.length === 0 ? (
            <div className="archivo-empty-state">
              <FolderOpen size={64} />
              <h3>No hay archivos</h3>
              <p>
                {searchTerm || tipoFilter !== 'all' || archivableTypeFilter || archivableIdFilter
                  ? 'No se encontraron archivos con los filtros aplicados'
                  : 'Sube tu primer archivo para comenzar'}
              </p>
              <button onClick={openUploadModal} className="archivo-btn-primary">
                <Upload size={18} />
                Subir Archivo
              </button>
            </div>
          ) : (
            <>
              {/* VISTA DE GRID */}
              {viewMode === 'grid' && (
                <div className="archivo-grid">
                  {archivos.map((archivo) => {
                    const tipoConfig = getTipoConfig(archivo.tipo);
                    const FileIcon = getFileIcon(archivo.extension, archivo.tipo);
                    const extension = getFileExtension(archivo.nombre_original);
                    
                    return (
                      <div key={archivo.id_archivo} className="archivo-card">
                        <div className="archivo-card-header">
                          <div 
                            className="archivo-card-icon"
                            style={{
                              backgroundColor: tipoConfig.bgColor || `${tipoConfig.color}20`,
                              color: tipoConfig.color
                            }}
                          >
                            <FileIcon size={24} />
                            <div className="archivo-card-extension">
                              {extension.toUpperCase()}
                            </div>
                          </div>
                          <div className="archivo-card-status">
                            <div className="archivo-card-tipo" style={{ color: tipoConfig.color }}>
                              {tipoConfig.label}
                            </div>
                          </div>
                        </div>
                        
                        <div className="archivo-card-body">
                          <h3 className="archivo-card-title" title={archivo.nombre_original}>
                            {archivo.nombre_original.length > 30 
                              ? `${archivo.nombre_original.substring(0, 30)}...`
                              : archivo.nombre_original}
                          </h3>
                          
                          <div className="archivo-card-meta">
                            <div className="archivo-card-meta-item">
                              <File size={12} />
                              <span>{formatFileSize(archivo.tamaño || 0)}</span>
                            </div>
                            <div className="archivo-card-meta-item">
                              <Calendar size={12} />
                              <span>{formatFecha(archivo.created_at)}</span>
                            </div>
                          </div>
                          
                          {archivo.descripcion && (
                            <p className="archivo-card-description">
                              {archivo.descripcion.length > 80 
                                ? `${archivo.descripcion.substring(0, 80)}...`
                                : archivo.descripcion}
                            </p>
                          )}
                          
                          {archivo.usuario && (
                            <div className="archivo-card-usuario">
                              <Users size={12} />
                              <span>{archivo.usuario.nombre || 'Usuario'}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="archivo-card-footer">
                          <div className="archivo-card-actions">
                            <button
                              onClick={() => previewArchivo(archivo)}
                              className="archivo-card-action-btn"
                              title="Previsualizar"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => downloadArchivo(archivo)}
                              className="archivo-card-action-btn"
                              title="Descargar"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => openDetailModal(archivo)}
                              className="archivo-card-action-btn"
                              title="Ver detalles"
                            >
                              <Info size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(archivo)}
                              className="archivo-card-action-btn delete"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* VISTA DE LISTA */}
              {viewMode === 'list' && (
                <div className="archivo-table-container">
                  <table className="archivo-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Tamaño</th>
                        <th>Subido por</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archivos.map((archivo) => {
                        const tipoConfig = getTipoConfig(archivo.tipo);
                        const FileIcon = getFileIcon(archivo.extension, archivo.tipo);
                        
                        return (
                          <tr key={archivo.id_archivo} className="archivo-table-row">
                            <td>
                              <div className="archivo-nombre">
                                <div 
                                  className="archivo-nombre-icon"
                                  style={{ color: tipoConfig.color }}
                                >
                                  <FileIcon size={16} />
                                </div>
                                <div>
                                  <strong>{archivo.nombre_original}</strong>
                                  {archivo.descripcion && (
                                    <div className="archivo-descripcion">
                                      {archivo.descripcion}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div 
                                className="archivo-tipo"
                                style={{ color: tipoConfig.color }}
                              >
                                {tipoConfig.label}
                              </div>
                            </td>
                            <td>
                              <div className="archivo-tamaño">
                                {formatFileSize(archivo.tamaño || 0)}
                              </div>
                            </td>
                            <td>
                              {archivo.usuario ? (
                                <div className="archivo-usuario">
                                  <Users size={14} />
                                  <span>{archivo.usuario.nombre || archivo.usuario.email}</span>
                                </div>
                              ) : (
                                <span className="archivo-sin-usuario">-</span>
                              )}
                            </td>
                            <td>
                              <div className="archivo-fecha">
                                <Calendar size={12} />
                                {formatFecha(archivo.created_at)}
                              </div>
                            </td>
                            <td>
                              <div className="archivo-actions">
                                <button
                                  onClick={() => previewArchivo(archivo)}
                                  className="archivo-action-btn"
                                  title="Previsualizar"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => downloadArchivo(archivo)}
                                  className="archivo-action-btn"
                                  title="Descargar"
                                >
                                  <Download size={16} />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(archivo)}
                                  className="archivo-action-btn delete"
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
                </div>
              )}

              {/* PAGINACIÓN */}
              {totalPages > 1 && (
                <div className="archivo-pagination">
                  <div className="archivo-pagination-info">
                    Mostrando {archivos.length} archivos
                  </div>
                  <div className="archivo-pagination-controls">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="archivo-pagination-btn"
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
                          className={`archivo-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="archivo-pagination-btn"
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

      {/* MODALES */}

      {/* MODAL SUBIR ARCHIVO */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3 className="modal-title">
                <Upload size={20} />
                Subir Nuevo Archivo
              </h3>
              <button onClick={closeUploadModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    Seleccionar Archivo (máx. 10MB) *
                  </label>
                  
                  <div 
                    className={`file-upload-area ${previewUrl ? 'has-file' : ''}`}
                    ref={dropzoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="file-upload-input"
                      accept="*/*"                    />
                    
                    {previewUrl ? (
                      <div className="file-preview">
                        {selectedFile?.type?.startsWith('image/') ? (
                          <div className="image-preview">
                            <img src={previewUrl} alt="Preview" />
                            <div className="file-info">
                              <File size={16} />
                              <span>{selectedFile.name}</span>
                              <span className="file-size">
                                ({formatFileSize(selectedFile.size)})
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="file-info-large">
                            <div 
                              className="file-icon-large"
                              style={{
                                backgroundColor: `${getTipoConfig(formData.tipo).color}20`,
                                color: getTipoConfig(formData.tipo).color
                              }}
                            >
                              {(() => {
                                const IconComponent = getFileIcon(getFileExtension(selectedFile.name), formData.tipo);
                                return <IconComponent size={32} />;
                              })()}
                            </div>
                            <div className="file-details">
                              <h4>{selectedFile.name}</h4>
                              <p>{formatFileSize(selectedFile.size)} • {selectedFile.type}</p>
                              <div className="file-tags">
                                <span 
                                  className="file-tag"
                                  style={{ backgroundColor: `${getTipoConfig(formData.tipo).color}20`, color: getTipoConfig(formData.tipo).color }}
                                >
                                  {getTipoConfig(formData.tipo).label}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                          className="remove-file-btn"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <Upload size={48} />
                        <h4>Arrastra y suelta tu archivo aquí</h4>
                        <p>o haz clic para seleccionar</p>
                        <p className="upload-hint">Máximo 10MB por archivo</p>
                      </div>
                    )}
                    
                    {errors.archivo && (
                      <div className="form-error">{errors.archivo[0]}</div>
                    )}
                  </div>
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">
                    Tipo de Archivo *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="modal-form-input"
                  >
                    {tipos.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">
                    Entidad Relacionada *
                  </label>
                  <select
                    value={formData.archivable_type}
                    onChange={(e) => setFormData({...formData, archivable_type: e.target.value})}
                    className="modal-form-input"
                  >
                    <option value="">Seleccionar entidad...</option>
                    {archivableTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {errors.archivable_type && (
                    <div className="form-error">{errors.archivable_type[0]}</div>
                  )}
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">
                    ID de Entidad *
                  </label>
                  <input
                    type="number"
                    value={formData.archivable_id}
                    onChange={(e) => setFormData({...formData, archivable_id: e.target.value})}
                    className="modal-form-input"
                    placeholder="Ej: 1, 2, 3..."
                  />
                  {errors.archivable_id && (
                    <div className="form-error">{errors.archivable_id[0]}</div>
                  )}
                </div>

                <div className="modal-form-group full-width">
                  <label className="modal-form-label">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    className="modal-form-input"
                    rows="3"
                    placeholder="Agrega una descripción del archivo..."
                  />
                  {errors.descripcion && (
                    <div className="form-error">{errors.descripcion[0]}</div>
                  )}
                </div>

                {uploading && (
                  <div className="modal-form-group full-width">
                    <div className="upload-progress">
                      <div className="upload-progress-header">
                        <span>Subiendo archivo...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="upload-progress-bar">
                        <div 
                          className="upload-progress-fill"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={closeUploadModal}
                className="modal-btn-secondary"
                disabled={uploading}
              >
                Cancelar
              </button>
              <button
                onClick={uploadArchivo}
                className="modal-btn-primary"
                disabled={uploading || !selectedFile}
              >
                {uploading ? (
                  <>
                    <div className="spinner-small"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Subir Archivo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLES */}
      {showDetailModal && selectedArchivo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <Info size={20} />
                Detalles del Archivo
              </h3>
              <button onClick={closeDetailModal} className="modal-close-btn">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-container">
                <div className="detail-header">
                  <div 
                    className="detail-icon"
                    style={{
                      backgroundColor: `${getTipoConfig(selectedArchivo.tipo).color}20`,
                      color: getTipoConfig(selectedArchivo.tipo).color
                    }}
                  >
                    {(() => {
                      const IconComponent = getFileIcon(selectedArchivo.extension, selectedArchivo.tipo);
                      return <IconComponent size={32} />;
                    })()}
                  </div>
                  <div className="detail-title">
                    <h4>{selectedArchivo.nombre_original}</h4>
                    <div className="detail-tags">
                      <span 
                        className="detail-tag"
                        style={{ backgroundColor: `${getTipoConfig(selectedArchivo.tipo).color}20`, color: getTipoConfig(selectedArchivo.tipo).color }}
                      >
                        {getTipoConfig(selectedArchivo.tipo).label}
                      </span>
                      <span className="detail-tag secondary">
                        {selectedArchivo.extension.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Tamaño:</label>
                    <span>{formatFileSize(selectedArchivo.tamaño || 0)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Subido el:</label>
                    <span>{formatFecha(selectedArchivo.created_at)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Última modificación:</label>
                    <span>{formatFecha(selectedArchivo.updated_at)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Entidad relacionada:</label>
                    <span>
                      {(() => {
                        const type = archivableTypes.find(t => t.value === selectedArchivo.archivable_type);
                        return type ? `${type.label} #${selectedArchivo.archivable_id}` : selectedArchivo.archivable_type;
                      })()}
                    </span>
                  </div>
                  
                  {selectedArchivo.usuario && (
                    <>
                      <div className="detail-item">
                        <label>Subido por:</label>
                        <span>{selectedArchivo.usuario.nombre || selectedArchivo.usuario.email}</span>
                      </div>
                      <div className="detail-item">
                        <label>Email:</label>
                        <span>{selectedArchivo.usuario.email}</span>
                      </div>
                    </>
                  )}
                </div>

                {selectedArchivo.descripcion && (
                  <div className="detail-section">
                    <label>Descripción:</label>
                    <p className="detail-description">{selectedArchivo.descripcion}</p>
                  </div>
                )}

                <div className="detail-section">
                  <label>Ruta del archivo:</label>
                  <div className="detail-path">
                    <code>{selectedArchivo.ruta}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedArchivo.ruta);
                        alert('Ruta copiada al portapapeles');
                      }}
                      className="detail-copy-btn"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div className="detail-actions">
                  <button
                    onClick={() => {
                      closeDetailModal();
                      previewArchivo(selectedArchivo);
                    }}
                    className="detail-action-btn"
                  >
                    <Eye size={18} />
                    Previsualizar
                  </button>
                  <button
                    onClick={() => {
                      closeDetailModal();
                      downloadArchivo(selectedArchivo);
                    }}
                    className="detail-action-btn"
                  >
                    <Download size={18} />
                    Descargar
                  </button>
                  <button
                    onClick={() => {
                      closeDetailModal();
                      openDeleteModal(selectedArchivo);
                    }}
                    className="detail-action-btn delete"
                  >
                    <Trash2 size={18} />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {showDeleteModal && selectedArchivo && (
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
                <h4>¿Estás seguro de eliminar este archivo?</h4>
                <p>
                  Se eliminará permanentemente: <strong>{selectedArchivo.nombre_original}</strong>
                </p>
                <div className="delete-info">
                  <div className="delete-info-item">
                    <File size={14} />
                    <span>{formatFileSize(selectedArchivo.tamaño || 0)}</span>
                  </div>
                  <div className="delete-info-item">
                    {(() => {
                      const IconComponent = getFileIcon(selectedArchivo.extension, selectedArchivo.tipo);
                      return <IconComponent size={14} />;
                    })()}
                    <span>{selectedArchivo.extension.toUpperCase()}</span>
                  </div>
                  <div className="delete-info-item">
                    <Calendar size={14} />
                    <span>{formatFecha(selectedArchivo.created_at)}</span>
                  </div>
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
                onClick={deleteArchivo}
                className="modal-btn-danger"
              >
                <Trash2 size={18} />
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW */}
      {showPreviewModal && previewUrl && (
        <div className="modal-overlay preview">
          <div className="modal-content preview">
            <div className="modal-header">
              <div className="preview-title">
                {(() => {
                  const IconComponent = getFileIcon(selectedArchivo.extension, selectedArchivo.tipo);
                  return <IconComponent size={20} />;
                })()}
                <span>{selectedArchivo.nombre_original}</span>
              </div>
              <div className="preview-actions">
                <button
                  onClick={() => downloadArchivo(selectedArchivo)}
                  className="preview-action-btn"
                  title="Descargar"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={closePreviewModal}
                  className="modal-close-btn"
                >
                  &times;
                </button>
              </div>
            </div>
            
            <div className="modal-body preview-body">
              <div className="image-preview-container">
                <img 
                  src={previewUrl} 
                  alt={selectedArchivo.nombre_original}
                  className="preview-image"
                />
              </div>
            </div>
            
            <div className="modal-footer preview-footer">
              <div className="preview-info">
                <div className="preview-info-item">
                  <File size={14} />
                  <span>{formatFileSize(selectedArchivo.tamaño || 0)}</span>
                </div>
                <div className="preview-info-item">
                  <span>{selectedArchivo.extension.toUpperCase()}</span>
                </div>
                <div className="preview-info-item">
                  <Calendar size={14} />
                  <span>{formatFecha(selectedArchivo.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Archivo;