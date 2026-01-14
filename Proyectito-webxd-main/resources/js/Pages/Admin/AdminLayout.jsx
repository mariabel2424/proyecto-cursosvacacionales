import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Footer from './Footer';
import '../../../css/Admin/layout.css';

export default function AdminLayout() {
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        cargarUsuario();
    }, []);

    const cargarUsuario = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                navigate('/login');
                return;
            }

            const userLocal = localStorage.getItem('user');
            if (userLocal) {
                setUser(JSON.parse(userLocal));
                return;
            }

            const response = await axios.get('http://localhost:8000/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });

            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
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
        } catch (err) {
            console.error('Error al cerrar sesión:', err);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    const menuItems = [
        { path: '/admin/dashboard', icon: '🏠', label: 'Dashboard' },
        { path: '/admin/usuarios', icon: '👥', label: 'Usuarios' },
        { path: '/admin/roles', icon: '🎭', label: 'Roles' },
        { path: '/admin/entrenamientos', icon: '💪', label: 'Entrenamientos' },
        { path: '/admin/reportes', icon: '📊', label: 'Reportes' },
        { path: '/admin/configuracion', icon: '⚙️', label: 'Configuración' },
    ];

    const isActive = (path) => location.pathname === path;

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
                        >
                            ☰
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold text-gray-800">
                                {user.nombre} {user.apellido}
                            </p>
                            <p className="text-xs text-gray-500">{user.rol?.nombre}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1">
                {/* Sidebar */}
                <aside
                    className={`${
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out`}
                >
                    <nav className="flex flex-col h-full pt-20 lg:pt-4">
                        <div className="flex-1 px-4 py-6 space-y-2">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                                        isActive(item.path)
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            ))}
                        </div>

                        {/* User info en sidebar (solo móvil) */}
                        <div className="lg:hidden p-4 border-t border-gray-200">
                            <p className="text-sm font-semibold text-gray-800">
                                {user.nombre} {user.apellido}
                            </p>
                            <p className="text-xs text-gray-500">{user.rol?.nombre}</p>
                        </div>
                    </nav>
                </aside>

                {/* Overlay para cerrar sidebar en móvil */}
                {sidebarOpen && (
                    <div
                        className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                        onClick={() => setSidebarOpen(false)}
                    ></div>
                )}

                {/* Main Content */}
                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
}