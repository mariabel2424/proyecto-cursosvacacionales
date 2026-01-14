@extends('layouts.template')
@section('header')

    <header class="header_section">
      <div class="container-fluid">
        <nav class="navbar navbar-expand-lg custom_nav-container fixed-top">
          <a class="navbar-brand" href="index.html">
            <img src="{{ asset('assets/front/assets/images/Logo.png') }}" alt="">
            <span>
              Cursos Vacacionales 
            </span>
          </a>
          <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>

         <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav mr-auto">
             <li class="nav-item active">
              <a class="nav-link" href="#home">Inicio <span class="sr-only">(current)</span></a>
            </li>
            <li class="nav-item">
             <a class="nav-link" href="#cursos">Cursos</a>
            </li>
            <li class="nav-item">
             <a class="nav-link" href="#partidos">Próximos Partidos</a>
            </li>
            <li class="nav-item">
             <a class="nav-link" href="#service">Servicios</a>
            </li>
            <li class="nav-item">
             <a class="nav-link" href="#galery">Galería</a>
            </li>
              <li class="nav-item">
               <a class="nav-link" href="#contact">Contáctanos</a>
             </li>
            </ul>

  <div class="navbar-right-actions d-flex align-items-center">
    <a href="{{ url('/register') }}" class="nav-auth-btn nav-auth-btn-outline mr-2">Registrarse</a>
    <a href="{{ url ('/login') }}" class="nav-auth-btn">Iniciar sesión</a>
  </div>
</div>

        </nav>
      </div>
    </header>
@endsection

@section('contenido')
    <!-- Slider Section -->
    
    <!-- Cursos Disponibles Section -->
    <section class="cursos-section layout_padding" id="cursos">
      <div class="container">
        <div class="heading_container text-center mb-5">
          <h2 class="custom_heading">
            Cursos <span>Disponibles</span>
          </h2>
          <p class="text-muted">Descubre todos nuestros cursos vacacionales y encuentra el perfecto para ti</p>
        </div>
        
        <div id="cursosLoading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="sr-only">Cargando cursos...</span>
          </div>
          <p class="mt-3">Cargando cursos disponibles...</p>
        </div>

        <div id="cursosContainer" class="row" style="display: none;">
          <!-- Los cursos se cargarán dinámicamente aquí -->
        </div>

        <div id="cursosError" class="alert alert-warning text-center" style="display: none;">
          <i class="fas fa-exclamation-triangle"></i>
          <p class="mb-0">No se pudieron cargar los cursos. Por favor, intenta más tarde.</p>
        </div>
      </div>
    </section>

    <!-- Próximos Partidos Section -->
    <section class="partidos-section layout_padding bg-light" id="partidos">
      <div class="container">
        <div class="heading_container text-center mb-5">
          <h2 class="custom_heading">
            Próximos <span>Encuentros</span>
          </h2>
          <p class="text-muted">No te pierdas los emocionantes partidos que se vienen</p>
        </div>

        <div id="partidosLoading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="sr-only">Cargando partidos...</span>
          </div>
          <p class="mt-3">Cargando próximos encuentros...</p>
        </div>

        <div id="partidosContainer" class="row" style="display: none;">
          <!-- Los partidos se cargarán dinámicamente aquí -->
        </div>

        <div id="partidosError" class="alert alert-info text-center" style="display: none;">
          <i class="fas fa-info-circle"></i>
          <p class="mb-0">No hay partidos programados próximamente.</p>
        </div>
      </div>
    </section>

  <!-- Service Section -->
  <section class="service_section layout_padding" id="service">
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-6 offset-md-2">
          <h2 class="custom_heading">
            Nuestros <span>Servicios</span>
          </h2>
          <div class="container layout_padding2">
            <div class="row">
              <div class="col-md-4">
                <div class="img_box">
                  <img src="{{asset('assets/front/assets/images/s-1.png')}}" alt="">
                </div>
                <div class="detail_box">
                  <h6>
                    Coaching de Alto Nivel
                  </h6>
                  <p>
                    Entrenadores especializados con experiencia en formación juvenil. 
                    Aseguramos una metodología de enseñanza enfocada en la técnica correcta, 
                    disciplina y el desarrollo integral del deportista.
                  </p>
                </div>
              </div>
              <div class="col-md-4">
                <div class="img_box">
                  <img src="{{asset('assets/front/assets/images/s-2.png')}}" alt="">
                </div>
                <div class="detail_box">
                  <h6>
                    Instalaciones Seguras y Equipadas
                  </h6>
                  <p>
                    Entrena en un ambiente profesional y vigilado. 
                    Contamos con canchas, rings y espacios diseñados para maximizar el 
                    aprendizaje y garantizar la seguridad en cada sesión.
                  </p>
                </div>
              </div>
              <div class="col-md-4">
                <div class="img_box">
                  <img src="{{asset('assets/front/assets/images/s-3.png')}}" alt="">
                </div>
                <div class="detail_box">
                  <h6>
                    Desarrollo Social y Disciplina
                  </h6>
                  <p>
                    Más que deporte, es formación. Fomentamos el trabajo en equipo, el respeto 
                    y la autodisciplina, habilidades esenciales que llevarán a casa y 
                    aplicarán en la vida diaria.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <img src="{{asset('assets/front/assets/images/Tool.png')}}" alt="" class="w-100">
        </div>
      </div>
    </div>
  </section>

  <!-- Gallery Section -->
  <section class="gallery-section layout_padding" id="galery">
    <div class="container">
      <h2>
        Galería de Cursos
      </h2>
    </div>
    <div class="container">
      <div class="img_box box-3">
        <img src="{{asset('assets/front/assets/images/g-3.png')}}" alt="">
      </div>
      <div class="img_box box-4">
        <img src="{{asset('assets/front/assets/images/g-4.png')}}" alt="">
      </div>
      <div class="img_box box-5">
        <img src="{{asset('assets/front/assets/images/g-5.png')}}" alt="">
      </div>
    </div>
  </section>

  <!-- Buy Section -->
  <section class="buy_section layout_padding">
    <div class="container">
      <h2>
        Puedes Registrarte En Nuestros Cursos Vacacionales
      </h2>
      <p>
        ¡No dejes pasar el verano sin aprender algo nuevo! Inscríbete hoy y asegura tu cupo.
      </p>
      <div class="d-flex justify-content-center">
        <a href="/register">
          Registrarte
        </a>
      </div>
    </div>
  </section>

  <!-- Info Section -->
  <section class="info_section layout_padding2" id="contact">
    <div class="container">
      <div class="info_items">
        <a href="">
          <div class="item">
            <div class="img-box box-1">
              <img src="" alt="">
            </div>
            <div class="detail-box">
              <p>
                Montecristi, Manabí, Ecuador
              </p>
            </div>
          </div>
        </a>
        <a href="">
          <div class="item">
            <div class="img-box box-2">
              <img src="" alt="">
            </div>
            <div class="detail-box">
              <p>
                +593 981373472
              </p>
            </div>
          </div>
        </a>
        <a href="">
          <div class="item">
            <div class="img-box box-3">
              <img src="" alt="">
            </div>
            <div class="detail-box">
              <p>
                cursosvacacionalesmontecristi@gmail.com
              </p>
            </div>
          </div>
        </a>
      </div>
    </div>
  </section>

  <style>
    /* Estilos específicos para esta página */
    .cursos-section, .partidos-section {
      min-height: 400px;
    }

    .custom_heading {
      font-size: 2.5rem;
      font-weight: 700;
      color: #2c3e50;
    }

    .custom_heading span {
      color: #e74c3c;
    }

    /* Card de Curso */
    .curso-card {
      background: white;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 5px 20px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      margin-bottom: 30px;
      height: 100%;
    }

    .curso-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }

    .curso-card-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      position: relative;
    }

    .curso-card-header h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .curso-badge {
      position: absolute;
      top: 15px;
      right: 15px;
      background: rgba(255,255,255,0.3);
      backdrop-filter: blur(10px);
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .curso-card-body {
      padding: 25px;
    }

    .curso-info-item {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      color: #555;
    }

    .curso-info-item i {
      width: 30px;
      color: #667eea;
      font-size: 1.2rem;
    }

    .curso-description {
      color: #666;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .curso-footer {
      padding: 0 25px 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .curso-precio {
      font-size: 1.8rem;
      font-weight: 700;
      color: #667eea;
    }

    .btn-inscribir {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 30px;
      border-radius: 25px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
    }

    .btn-inscribir:hover {
      transform: scale(1.05);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
      color: white;
      text-decoration: none;
    }

    /* Card de Partido */
    .partido-card {
      background: white;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 5px 20px rgba(0,0,0,0.1);
      margin-bottom: 30px;
      transition: all 0.3s ease;
    }

    .partido-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }

    .partido-header {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 15px 20px;
      text-align: center;
    }

    .partido-fecha {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .partido-body {
      padding: 30px 20px;
    }

    .partido-equipos {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .equipo {
      text-align: center;
      flex: 1;
    }

    .equipo-nombre {
      font-size: 1.2rem;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 5px;
    }

    .equipo-logo {
      width: 60px;
      height: 60px;
      margin: 0 auto 10px;
      background: #f8f9fa;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
    }

    .vs-divider {
      font-size: 1.5rem;
      font-weight: 700;
      color: #e74c3c;
      padding: 0 20px;
    }

    .partido-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 10px;
      margin-top: 15px;
    }

    .partido-info-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      font-size: 0.95rem;
      color: #555;
    }

    .partido-info-item:last-child {
      margin-bottom: 0;
    }

    .partido-info-item i {
      width: 25px;
      color: #f5576c;
    }

    .spinner-border {
      width: 3rem;
      height: 3rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .custom_heading {
        font-size: 2rem;
      }

      .partido-equipos {
        flex-direction: column;
      }

      .vs-divider {
        padding: 15px 0;
      }
    }
  </style>

  <script>
    // API Base URL - Ajusta según tu configuración
    const API_BASE_URL = '{{ url("/api") }}';

    // Función para cargar cursos
    async function cargarCursos() {
      try {
        const response = await fetch(`${API_BASE_URL}/cursos`);
        
        if (!response.ok) {
          throw new Error('Error al cargar cursos');
        }

        const data = await response.json();
        const cursos = data.data || data;

        document.getElementById('cursosLoading').style.display = 'none';

        if (cursos && cursos.length > 0) {
          mostrarCursos(cursos);
          document.getElementById('cursosContainer').style.display = 'flex';
        } else {
          document.getElementById('cursosError').style.display = 'block';
        }
      } catch (error) {
        console.error('Error:', error);
        document.getElementById('cursosLoading').style.display = 'none';
        document.getElementById('cursosError').style.display = 'block';
      }
    }

    // Función para mostrar cursos
    function mostrarCursos(cursos) {
      const container = document.getElementById('cursosContainer');
      container.innerHTML = '';

      cursos.forEach(curso => {
        const fechaInicio = new Date(curso.fecha_inicio).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        const fechaFin = new Date(curso.fecha_fin).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });

        const cursoHTML = `
          <div class="col-md-6 col-lg-4">
            <div class="curso-card">
              <div class="curso-card-header">
                <h3>${curso.nombre}</h3>
                <span class="curso-badge">${curso.estado || 'Activo'}</span>
              </div>
              <div class="curso-card-body">
                <p class="curso-description">${curso.descripcion || 'Curso vacacional diseñado para desarrollar tus habilidades deportivas.'}</p>
                <div class="curso-info-item">
                  <i class="fas fa-calendar-alt"></i>
                  <span>Del ${fechaInicio} al ${fechaFin}</span>
                </div>
                <div class="curso-info-item">
                  <i class="fas fa-clock"></i>
                  <span>${curso.duracion_horas || 'N/A'} horas totales</span>
                </div>
                <div class="curso-info-item">
                  <i class="fas fa-users"></i>
                  <span>Cupos disponibles: ${curso.cupo_maximo || 'Limitado'}</span>
                </div>
              </div>
              <div class="curso-footer">
                <div class="curso-precio">$${curso.precio || '0.00'}</div>
                <a href="{{ url('/register') }}" class="btn-inscribir">Inscribirse</a>
              </div>
            </div>
          </div>
        `;
        container.innerHTML += cursoHTML;
      });
    }

    // Función para cargar próximos partidos
    async function cargarPartidos() {
      try {
        const response = await fetch(`${API_BASE_URL}/partidos/proximos/lista`);
        
        if (!response.ok) {
          throw new Error('Error al cargar partidos');
        }

        const data = await response.json();
        const partidos = data.data || data;

        document.getElementById('partidosLoading').style.display = 'none';

        if (partidos && partidos.length > 0) {
          mostrarPartidos(partidos);
          document.getElementById('partidosContainer').style.display = 'flex';
        } else {
          document.getElementById('partidosError').style.display = 'block';
        }
      } catch (error) {
        console.error('Error:', error);
        document.getElementById('partidosLoading').style.display = 'none';
        document.getElementById('partidosError').style.display = 'block';
      }
    }

    // Función para mostrar partidos
    function mostrarPartidos(partidos) {
      const container = document.getElementById('partidosContainer');
      container.innerHTML = '';

      partidos.slice(0, 6).forEach(partido => {
        const fecha = new Date(partido.fecha).toLocaleDateString('es-ES', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
        const hora = partido.hora || 'Por confirmar';

        const partidoHTML = `
          <div class="col-md-6 col-lg-4">
            <div class="partido-card">
              <div class="partido-header">
                <div class="partido-fecha">
                  <i class="fas fa-calendar"></i> ${fecha}
                </div>
              </div>
              <div class="partido-body">
                <div class="partido-equipos">
                  <div class="equipo">
                    <div class="equipo-logo">⚽</div>
                    <div class="equipo-nombre">${partido.club_local?.nombre || 'Equipo Local'}</div>
                  </div>
                  <div class="vs-divider">VS</div>
                  <div class="equipo">
                    <div class="equipo-logo">⚽</div>
                    <div class="equipo-nombre">${partido.club_visitante?.nombre || 'Equipo Visitante'}</div>
                  </div>
                </div>
                <div class="partido-info">
                  <div class="partido-info-item">
                    <i class="fas fa-clock"></i>
                    <span>Hora: ${hora}</span>
                  </div>
                  <div class="partido-info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${partido.escenario?.nombre || 'Escenario por confirmar'}</span>
                  </div>
                  <div class="partido-info-item">
                    <i class="fas fa-trophy"></i>
                    <span>${partido.campeonato?.nombre || 'Partido amistoso'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        container.innerHTML += partidoHTML;
      });
    }

    // Cargar datos al cargar la página
    document.addEventListener('DOMContentLoaded', function() {
      cargarCursos();
      cargarPartidos();
    });
  </script>
@endsection