<!DOCTYPE html>
<html lang="es">

<head>
  <!-- Basic -->
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />

  <!-- Mobile Metas -->
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

  <!-- Site Metas -->
  <title>Cursos Vacacionales</title>

  <!-- Slider stylesheet -->
  <link rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.1.3/assets/owl.carousel.min.css" />

  <!-- Bootstrap -->
  <link rel="stylesheet" href="{{ asset('assets/front/assets/css/bootstrap.css') }}" />

  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css?family=Dosis:400,500|Poppins:400,700&display=swap" rel="stylesheet">

  <!-- CSS GLOBAL (afecta a todo el sistema) -->
  <link rel="stylesheet" href="{{ asset('assets/front/assets/css/style.css') }}">
  <link rel="stylesheet" href="{{ asset('assets/front/assets/css/responsive.css') }}">

  <!-- CSS POR PÁGINA -->
  @yield('styles')
</head>

<body>

  <!-- HEADER -->
  @yield('header')

  <!-- CONTENIDO -->
  @yield('contenido')

  <!-- FOOTER -->
  <section class="container-fluid footer_section">
    <p>
      &copy; 2025 Todos los derechos reservados
    </p>
  </section>

  <!-- SCRIPTS -->
  <script src="{{ asset('assets/front/assets/js/jquery-3.4.1.min.js') }}"></script>
  <script src="{{ asset('assets/front/assets/js/bootstrap.js') }}"></script>

</body>
</html>
