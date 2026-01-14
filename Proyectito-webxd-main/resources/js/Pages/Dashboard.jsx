import React from 'react';
import { Head } from '@inertiajs/react';

export default function Dashboard({ user }) {
    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <>
            <Head title="Dashboard" />
            <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
                <nav style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem 2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Dashboard</h1>
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </nav>

                <div style={{ padding: '2rem' }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                            Bienvenido, {user.nombre} {user.apellido}
                        </h2>
                        <div style={{ color: '#6b7280' }}>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Rol:</strong> {user.rol?.nombre}</p>
                            <p><strong>Teléfono:</strong> {user.telefono || 'No especificado'}</p>
                            <p><strong>Estado:</strong> <span style={{ color: user.status === 'activo' ? '#10b981' : '#ef4444' }}>{user.status}</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}