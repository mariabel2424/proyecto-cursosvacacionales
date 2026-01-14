import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Register({ roles }) {
    const { data, setData, post, processing, errors } = useForm({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        password: '',
        password_confirmation: '',
        id_rol: roles[0]?.id_rol || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <>
            <Head title="Registrarse" />
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', padding: '1rem' }}>
                <div style={{ width: '100%', maxWidth: '500px', padding: '2rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
                        Crear Cuenta
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px'
                                    }}
                                    required
                                />
                                {errors.nombre && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.nombre}</div>}
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                    Apellido
                                </label>
                                <input
                                    type="text"
                                    value={data.apellido}
                                    onChange={(e) => setData('apellido', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px'
                                    }}
                                    required
                                />
                                {errors.apellido && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.apellido}</div>}
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px'
                                }}
                                required
                            />
                            {errors.email && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.email}</div>}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                Teléfono (opcional)
                            </label>
                            <input
                                type="tel"
                                value={data.telefono}
                                onChange={(e) => setData('telefono', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px'
                                }}
                            />
                            {errors.telefono && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.telefono}</div>}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                Rol
                            </label>
                            <select
                                value={data.id_rol}
                                onChange={(e) => setData('id_rol', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px'
                                }}
                                required
                            >
                                {roles.map((rol) => (
                                    <option key={rol.id_rol} value={rol.id_rol}>
                                        {rol.nombre}
                                    </option>
                                ))}
                            </select>
                            {errors.id_rol && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.id_rol}</div>}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px'
                                }}
                                required
                            />
                            {errors.password && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.password}</div>}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                Confirmar Contraseña
                            </label>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px'
                                }}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                fontWeight: '500',
                                cursor: processing ? 'not-allowed' : 'pointer',
                                opacity: processing ? 0.7 : 1
                            }}
                        >
                            {processing ? 'Registrando...' : 'Registrarse'}
                        </button>
                    </form>

                    <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                        ¿Ya tienes cuenta?{' '}
                        <a href="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                            Inicia sesión aquí
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}