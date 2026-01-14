import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        cargarUsuario();
    }, []);

    const cargarUsuario = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('🔑 Token encontrado:', token ? 'Sí' : 'No');
            
            if (!token) {
                console.log('❌ No hay token, redirigiendo al login');
                window.location.href = '/login';
                return;
            }

            // Primero intentar obtener del localStorage
            const userLocal = localStorage.getItem('user');
            if (userLocal) {
                console.log('✅ Usuario encontrado en localStorage');
                setUser(JSON.parse(userLocal));
                setLoading(false);
                return;
            }

            // Si no está en localStorage, hacer la petición al backend
            console.log('📡 Haciendo petición a /api/auth/me');
            const response = await axios.get('http://localhost:8000/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });

            console.log('✅ Respuesta del servidor:', response.data);
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
            setLoading(false);
        } catch (err) {
            console.error('❌ Error al cargar usuario:', err);
            console.error('❌ Respuesta del error:', err.response?.data);
            console.error('❌ Status del error:', err.response?.status);
            
            if (err.response?.status === 401) {
                console.log('⚠️ Token inválido o expirado, redirigiendo al login');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            } else {
                setError('Error al cargar los datos del usuario');
                setLoading(false);
            }
        }
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            
            await axios.post(
                'http://localhost:8000/api/auth/logout',
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    }
                }
            );

            // Limpiar datos locales
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Redirigir al login
            window.location.href = '/login';
        } catch (err) {
            console.error('Error al cerrar sesión:', err);
            // Limpiar de todas formas
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    };

    if (loading) {
        return (
            <div style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                backgroundColor: '#f3f4f6' 
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                        border: '4px solid #e5e7eb',
                        borderTop: '4px solid #3b82f6',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }}></div>
                    <p style={{ color: '#6b7280' }}>Cargando...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                backgroundColor: '#f3f4f6' 
            }}>
                <div style={{ 
                    backgroundColor: '#fee2e2', 
                    color: '#991b1b', 
                    padding: '1.5rem', 
                    borderRadius: '8px',
                    maxWidth: '500px'
                }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Error</h3>
                    <p>{error}</p>
                    <button 
                        onClick={() => window.location.href = '/login'}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Volver al Login
                    </button>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const rolColor = {
        'administrador': '#8b5cf6',
        'deportista': '#3b82f6',
        'instructor': '#10b981',
        'entrenador': '#f59e0b',
        'tutor': '#ec4899',
        'financiero': '#06b6d4',
        'recepcionista': '#6366f1'
    };

    const rolSlug = user.rol?.slug?.toLowerCase() || '';
    const colorRol = rolColor[rolSlug] || '#6b7280';

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
            {/* Navigation Bar */}
            <nav style={{ 
                backgroundColor: 'white', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                padding: '1rem 2rem',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                            Dashboard
                        </h1>
                        <span style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: colorRol,
                            color: 'white',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}>
                            {user.rol?.nombre || 'Sin rol'}
                        </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Welcome Card */}
                <div style={{ 
                    backgroundColor: 'white', 
                    padding: '2rem', 
                    borderRadius: '12px', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    marginBottom: '2rem'
                }}>
                    <h2 style={{ 
                        fontSize: '1.875rem', 
                        fontWeight: 'bold', 
                        marginBottom: '0.5rem',
                        color: '#111827'
                    }}>
                        ¡Bienvenido, {user.nombre} {user.apellido}! 👋
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                        Nos alegra verte de nuevo. Aquí tienes un resumen de tu información.
                    </p>
                </div>

                {/* Info Grid */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    {/* Info Card */}
                    <div style={{ 
                        backgroundColor: 'white', 
                        padding: '1.5rem', 
                        borderRadius: '12px', 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ 
                            fontSize: '1.125rem', 
                            fontWeight: '600', 
                            marginBottom: '1rem',
                            color: '#111827'
                        }}>
                            Información Personal
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <InfoItem label="Email" value={user.email} />
                            <InfoItem label="Teléfono" value={user.telefono || 'No especificado'} />
                            <InfoItem label="Dirección" value={user.direccion || 'No especificada'} />
                        </div>
                    </div>

                    {/* Role Card */}
                    <div style={{ 
                        backgroundColor: 'white', 
                        padding: '1.5rem', 
                        borderRadius: '12px', 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ 
                            fontSize: '1.125rem', 
                            fontWeight: '600', 
                            marginBottom: '1rem',
                            color: '#111827'
                        }}>
                            Rol y Estado
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                    Rol
                                </p>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '0.375rem 0.875rem',
                                    backgroundColor: colorRol,
                                    color: 'white',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}>
                                    {user.rol?.nombre || 'Sin rol'}
                                </span>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                    Estado de la cuenta
                                </p>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '0.375rem 0.875rem',
                                    backgroundColor: user.status === 'activo' ? '#d1fae5' : '#fee2e2',
                                    color: user.status === 'activo' ? '#065f46' : '#991b1b',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}>
                                    {user.status === 'activo' ? '✓ Activo' : '✕ Inactivo'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{ 
                    backgroundColor: 'white', 
                    padding: '1.5rem', 
                    borderRadius: '12px', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: '600', 
                        marginBottom: '1rem',
                        color: '#111827'
                    }}>
                        Acciones Rápidas
                    </h3>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '1rem'
                    }}>
                        <ActionButton 
                            label="Mi Perfil" 
                            icon="👤"
                            onClick={() => alert('Ir a Mi Perfil')}
                        />
                        <ActionButton 
                            label="Configuración" 
                            icon="⚙️"
                            onClick={() => alert('Ir a Configuración')}
                        />
                        <ActionButton 
                            label="Ayuda" 
                            icon="❓"
                            onClick={() => alert('Ir a Ayuda')}
                        />
                    </div>
                </div>
            </div>

            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
}

// Componente auxiliar para mostrar información
function InfoItem({ label, value }) {
    return (
        <div>
            <p style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                marginBottom: '0.25rem',
                fontWeight: '500'
            }}>
                {label}
            </p>
            <p style={{ 
                fontSize: '1rem', 
                color: '#111827',
                wordBreak: 'break-word'
            }}>
                {value}
            </p>
        </div>
    );
}

// Componente auxiliar para botones de acción
function ActionButton({ label, icon, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '1rem',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontWeight: '500',
                color: '#374151'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <span style={{ fontSize: '1.5rem' }}>{icon}</span>
            <span>{label}</span>
        </button>
    );
}
