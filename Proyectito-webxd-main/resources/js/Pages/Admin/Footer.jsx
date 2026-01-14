import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-800 text-white mt-auto">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Columna 1: Acerca de */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Acerca de</h3>
                        <p className="text-gray-400 text-sm">
                            Sistema de gestión deportiva para administrar usuarios, entrenamientos y más.
                        </p>
                    </div>

                    {/* Columna 2: Enlaces rápidos */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Enlaces Rápidos</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/" className="text-gray-400 hover:text-white text-sm">
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-gray-400 hover:text-white text-sm">
                                    Acerca de
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-gray-400 hover:text-white text-sm">
                                    Contacto
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Columna 3: Soporte */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Soporte</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/help" className="text-gray-400 hover:text-white text-sm">
                                    Ayuda
                                </Link>
                            </li>
                            <li>
                                <Link to="/faq" className="text-gray-400 hover:text-white text-sm">
                                    Preguntas Frecuentes
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="text-gray-400 hover:text-white text-sm">
                                    Política de Privacidad
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Columna 4: Contacto */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Contacto</h3>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li>📧 info@ejemplo.com</li>
                            <li>📞 +593 123 456 789</li>
                            <li>📍 Quito, Ecuador</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-700 mt-8 pt-8 text-center">
                    <p className="text-gray-400 text-sm">
                        © {currentYear} Sistema Deportivo. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
}