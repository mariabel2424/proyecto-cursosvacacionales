import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importación de las rutas
import FinanzasDashboard from './Pages/Financiero/Dashboard';
import EntrenadorDashboard from './Pages/Entrenador/Dashboard';

//admin
import AdminDashboard from './Pages/Admin/Dashboard';
import AdminUser from './Pages/Admin/Usuario';
import AdminRol from './Pages/Admin/Rol';
import AdminCategoria from './Pages/Admin/Categoria';
import AdminPermiso from './Pages/Admin/Permiso';
import AdminClub from './Pages/Admin/Club';
import AdminGrupoCurso from './Pages/Admin/GrupoCurso'; 
import AdminDeportista from './Pages/Admin/Deportista';
import Curso from './Pages/Admin/Curso';
import AdminInscripcionCurso from './Pages/Admin/InscripcionCurso';
import AdminTutor from './Pages/Admin/Tutor';
import Asistencia from './Pages/Admin/Asistencia';
import AdminInstructor from './Pages/Admin/Instructor';
import AdminCampeonanto from './Pages/Admin/Campeonato';
import AsminPartido from './Pages/Admin/Partido';
import AdminFactura from './Pages/Admin/Factura';
import AdminPago from './Pages/Admin/Pago';
import AdminEscenario from './Pages/Admin/Escenario';
import Actividad from './Pages/Admin/Actividad';
import AdminNotificacion from './Pages/Admin/Notificacion';
import AdminArchivo from './Pages/Admin/Archivo';
import AdminConfiguracion from './Pages/Admin/Configuracion';

//Deportista
import DeportistaDashboard from './Pages/Deportista/Dashboard';
import DeportistaPerfil from './Pages/Deportista/Perfil';
import DeportistaTutor from './Pages/Deportista/Tutor';
import DeportistaEstadistica from './Pages/Deportista/Estadistica';
import DeportistaCurso from './Pages/Deportista/Curso';
import DeportistaInscribir from './Pages/Deportista/InscribirCurso';

import TutorDashboard from './Pages/Tutor/Dashboard';
import RecepcionistaDashboard from './Pages/Recepcionista/Dashboard';
import InstructorDashboard from './Pages/Instructor/Dashboard';
import Login from './Pages/Login';
import Register from './Pages/Register';
   
import RecuperarContrasena from './Pages/recuperarcontrasena';
import ReestablecerContrasena from './Pages/reestablecercontrasena';



ReactDOM.createRoot(document.getElementById("react-root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/financiero/dashboard" element={<FinanzasDashboard />} />
        <Route path="/entrenador/dashboard" element={<EntrenadorDashboard />} />

        <Route path="/deportista/dashboard" element={<DeportistaDashboard />} />
        <Route path="/deportista/perfil" element={<DeportistaPerfil/>}/>
        <Route path="/deportista/tutores" element={<DeportistaTutor/>}/>
        <Route path="/deportista/estadisticas" element={<DeportistaEstadistica/>}/>
        <Route path="/deportista/cursos" element={<DeportistaCurso/>}/>
        <Route path="/deportista/inscribir" element={<DeportistaInscribir/>}/>
        
        
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/usuario" element={<AdminUser />} />
        <Route path="/admin/rol" element={<AdminRol />} />
        <Route path="/admin/categoria" element={<AdminCategoria />} />
        <Route path="/admin/permiso" element={<AdminPermiso />} />
        <Route path="/admin/club" element={<AdminClub />} />
        <Route path="/admin/grupocurso" element={<AdminGrupoCurso />} />
        <Route path="/admin/deportista" element={<AdminDeportista />} />
        <Route path="/admin/curso" element={<Curso />} />
        <Route path="/admin/inscripcioncurso" element={<AdminInscripcionCurso />} />
        <Route path="/admin/tutor" element={<AdminTutor />} />
        <Route path="/admin/asistencia" element={<Asistencia />} />
        <Route path="/admin/instructor" element={<AdminInstructor />} />
        <Route path="/admin/campeonato" element={<AdminCampeonanto />} />
        <Route path="/admin/partido" element={<AsminPartido />} />
        <Route path="/admin/factura" element={<AdminFactura />} />
        <Route path="/admin/pago" element={<AdminPago />} />
        <Route path="/admin/escenario" element={<AdminEscenario />} />
        <Route path="/admin/actividad" element={<Actividad />} />
        <Route path="/admin/notificacion" element={<AdminNotificacion />} />
        <Route path="/admin/archivo" element={<AdminArchivo />} />
        <Route path="/admin/configuracion" element={<AdminConfiguracion />} />


        <Route path="/tutor/dashboard" element={<TutorDashboard />} />
        <Route path="/recepcionista/dashboard" element={<RecepcionistaDashboard />} />
        <Route path="/instructor/dashboard" element={<InstructorDashboard />} />

       <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
      <Route path="/reestablecer-contrasena" element={<ReestablecerContrasena />} />




        {/* Añade otras rutas según sea necesario */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
