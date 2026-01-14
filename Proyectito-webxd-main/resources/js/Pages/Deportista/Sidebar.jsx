import React from "react";
import "../../../css/Deportista/Sidebar.css";

const Sidebar = () => {
    return (
        <div className="sidebar">
            {/* Header */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <i className="fas fa-running"></i>
                </div>
                <div className="sidebar-title">
                    <h4>🏆 Panel del Deportista</h4>
                    <small className="text-muted">Área Personal</small>
                </div>
            </div>

            <div className="sidebar-content">
                {/* Dashboard */}
                <div className="sidebar-section">
                    <h6 className="sidebar-section-title">INICIO</h6>
                    <a href="/deportista/dashboard" className="sidebar-link">
                        <i className="fas fa-chart-line"></i>
                        <span>Dashboard</span>
                    </a>
                </div>

                {/* Perfil */}
                <div className="sidebar-section">
                    <h6 className="sidebar-section-title">MI PERFIL</h6>
                    <a href="/deportista/perfil" className="sidebar-link">
                        <i className="fas fa-user"></i>
                        <span>Mi Perfil</span>
                    </a>
                    <a href="/deportista/tutores" className="sidebar-link">
                        <i className="fas fa-user-friends"></i>
                        <span>Mis Tutores</span>
                    </a>
                </div>

                {/* Entrenamiento */}
                <div className="sidebar-section">
                    <h6 className="sidebar-section-title">ENTRENAMIENTO</h6>
                    

                    <a href="/deportista/instructores" className="sidebar-link">
                        <i className="fas fa-chalkboard-teacher"></i>
                        <span>Mis Instructores</span>
                    </a>
                    <a href="/deportista/estadisticas" className="sidebar-link">
                        <i className="fas fa-chart-bar"></i>
                        <span>Mis Estadísticas</span>
                    </a>
                </div>

                {/* Cursos */}
                <div className="sidebar-section">
                    <h6 className="sidebar-section-title">CURSOS Y FORMACIÓN</h6>
                    <a href="/deportista/cursos" className="sidebar-link">
                        <i className="fas fa-book"></i>
                        <span>Mis Cursos</span>
                    </a>

                    <a href="/deportista/inscribir" className="sidebar-link">
                        <i className="fas fa-user-plus"></i>
                        <span>Inscribirme a Curso</span>
                    </a>
                </div>

                {/* Competiciones */}
                <div className="sidebar-section">
                    <h6 className="sidebar-section-title">COMPETICIONES</h6>

                    <a href="/deportista/partidos" className="sidebar-link">
                        <i className="fas fa-futbol"></i>
                        <span>Mis Partidos</span>
                    </a>
                    <a href="/deportista/partidos/proximos" className="sidebar-link">
                        <i className="fas fa-calendar-alt"></i>
                        <span>Próximos Partidos</span>
                    </a>
                    <a href="/deportista/clubes" className="sidebar-link">
                        <i className="fas fa-building"></i>
                        <span>Mis Clubes</span>
                    </a>
                </div>

                {/* Instalaciones */}
                <div className="sidebar-section">
                    <h6 className="sidebar-section-title">INSTALACIONES</h6>
                    <a href="/deportista/escenarios" className="sidebar-link">
                        <i className="fas fa-map-marked-alt"></i>
                        <span>Escenarios</span>
                    </a>
                    <a href="/deportista/actividades" className="sidebar-link">
                        <i className="fas fa-calendar-day"></i>
                        <span>Actividades</span>
                    </a>
                    <a href="/deportista/actividades/calendario" className="sidebar-link">
                        <i className="fas fa-calendar-alt"></i>
                        <span>Calendario Mensual</span>
                    </a>
                </div>

                {/* Finanzas */}
                <div className="sidebar-section">
                    <h6 className="sidebar-section-title">FINANZAS</h6>
                    <a href="/deportista/facturas" className="sidebar-link">
                        <i className="fas fa-file-invoice-dollar"></i>
                        <span>Mis Facturas</span>
                    </a>
                    <a href="/deportista/pagos" className="sidebar-link">
                        <i className="fas fa-credit-card"></i>
                        <span>Mis Pagos</span>
                    </a>
                    <a href="/deportista/facturas/pendientes" className="sidebar-link">
                        <i className="fas fa-exclamation-circle"></i>
                        <span>Pendientes de Pago</span>
                    </a>
                </div>


            </div>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="user-info">
                    <small className="text-muted">Sesión activa</small>
                </div>
                <a href="/auth/logout" className="logout-btn">
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Cerrar Sesión</span>
                </a>
            </div>
        </div>
    );
};

export default Sidebar;