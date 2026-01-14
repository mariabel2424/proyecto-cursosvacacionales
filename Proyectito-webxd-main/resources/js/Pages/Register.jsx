
import React, { useState, useEffect } from "react";
import "../../css/register.css";

export default function Register() {
  const API_BASE_URL = "http://localhost:8000/api";

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    email: "",
    telefono: "",
    direccion: "",
    fecha_nacimiento: "",
    genero: "",
    password: "",
    password_confirmation: "",
    id_rol: "4", // Rol Deportista por defecto
  });

  const [inscripcionData, setInscripcionData] = useState({
    id_curso: "",
    id_grupo: "",
  });

  // Estados para datos de la API
  const [cursos, setCursos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [cargandoCursos, setCargandoCursos] = useState(true);

  const [pagoRealizado, setPagoRealizado] = useState("");
  const [comprobante, setComprobante] = useState(null);

  const [mensaje, setMensaje] = useState("");
  const [errores, setErrores] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Estados para validación en tiempo real
  const [validacionCedula, setValidacionCedula] = useState({ valida: null, mensaje: "" });
  const [validacionPassword, setValidacionPassword] = useState({ valida: null, mensaje: "" });
  const [passwordsCoinciden, setPasswordsCoinciden] = useState({ valida: null, mensaje: "" });

  // Cargar cursos disponibles al montar el componente
  useEffect(() => {
    cargarCursos();
    cargarCategorias();
  }, []);

  // Cargar grupos cuando se selecciona un curso
  useEffect(() => {
    if (inscripcionData.id_curso) {
      cargarGrupos(inscripcionData.id_curso);
    }
  }, [inscripcionData.id_curso]);

  // Validar cédula en tiempo real
  useEffect(() => {
    if (formData.cedula) {
      validarCedulaEcuatoriana(formData.cedula);
    } else {
      setValidacionCedula({ valida: null, mensaje: "" });
    }
  }, [formData.cedula]);

  // Validar contraseña en tiempo real
  useEffect(() => {
    if (formData.password) {
      validarPassword(formData.password);
    } else {
      setValidacionPassword({ valida: null, mensaje: "" });
    }
  }, [formData.password]);

  // Validar coincidencia de contraseñas en tiempo real
  useEffect(() => {
    if (formData.password_confirmation) {
      validarCoincidenciaPasswords();
    } else {
      setPasswordsCoinciden({ valida: null, mensaje: "" });
    }
  }, [formData.password, formData.password_confirmation]);

  const cargarCursos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cursos`);
      if (response.ok) {
        const data = await response.json();
        setCursos(data.data || data);
      }
    } catch (error) {
      console.error("Error al cargar cursos:", error);
    } finally {
      setCargandoCursos(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categorias`);
      if (response.ok) {
        const data = await response.json();
        setCategorias(data.data || data);
      }
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  };

  const cargarGrupos = async (idCurso) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cursos/${idCurso}/grupos-disponibles`);
      if (response.ok) {
        const data = await response.json();
        setGrupos(data.data || data);
      }
    } catch (error) {
      try {
        const responseGrupos = await fetch(`${API_BASE_URL}/grupos-curso`);
        if (responseGrupos.ok) {
          const dataGrupos = await responseGrupos.json();
          const gruposDelCurso = (dataGrupos.data || dataGrupos).filter(
            g => g.id_curso == idCurso
          );
          setGrupos(gruposDelCurso);
        }
      } catch (e) {
        console.error("Error al cargar grupos:", e);
      }
    }
  };

  // Validación de cédula ecuatoriana
  const validarCedulaEcuatoriana = (cedula) => {
    // Verificar que tenga 10 dígitos
    if (!/^\d{10}$/.test(cedula)) {
      setValidacionCedula({ valida: false, mensaje: "La cédula debe tener 10 dígitos numéricos" });
      return false;
    }

    // Los dos primeros dígitos deben estar entre 01 y 24 (provincias del Ecuador)
    const provincia = parseInt(cedula.substring(0, 2));
    if (provincia < 1 || provincia > 24) {
      setValidacionCedula({ valida: false, mensaje: "Código de provincia inválido (01-24)" });
      return false;
    }

    // El tercer dígito debe ser menor a 6 (0-5 para cédulas de personas naturales)
    const tercerDigito = parseInt(cedula.charAt(2));
    if (tercerDigito > 5) {
      setValidacionCedula({ valida: false, mensaje: "El tercer dígito debe ser menor a 6" });
      return false;
    }

    // Algoritmo de validación del dígito verificador
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 9; i++) {
      let valor = parseInt(cedula.charAt(i)) * coeficientes[i];
      if (valor >= 10) {
        valor -= 9;
      }
      suma += valor;
    }

    const digitoVerificador = parseInt(cedula.charAt(9));
    const resultado = suma % 10 === 0 ? 0 : 10 - (suma % 10);

    if (resultado !== digitoVerificador) {
      setValidacionCedula({ valida: false, mensaje: "Número de cédula inválido" });
      return false;
    }

    setValidacionCedula({ valida: true, mensaje: "✓ Cédula válida" });
    return true;
  };

  // Validación de contraseña
  const validarPassword = (password) => {
    const erroresPassword = [];

    if (password.length < 8) {
      erroresPassword.push("Mínimo 8 caracteres");
    }
    if (!/[A-Z]/.test(password)) {
      erroresPassword.push("Al menos una mayúscula");
    }
    if (!/[a-z]/.test(password)) {
      erroresPassword.push("Al menos una minúscula");
    }
    if (!/[0-9]/.test(password)) {
      erroresPassword.push("Al menos un número");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      erroresPassword.push("Al menos un carácter especial (!@#$%^&*)");
    }

    if (erroresPassword.length > 0) {
      setValidacionPassword({ 
        valida: false, 
        mensaje: "Contraseña débil: " + erroresPassword.join(", ") 
      });
      return false;
    }

    setValidacionPassword({ valida: true, mensaje: "✓ Contraseña segura" });
    return true;
  };

  // Validación de coincidencia de contraseñas
  const validarCoincidenciaPasswords = () => {
    if (!formData.password_confirmation) {
      setPasswordsCoinciden({ valida: null, mensaje: "" });
      return false;
    }

    if (formData.password !== formData.password_confirmation) {
      setPasswordsCoinciden({ valida: false, mensaje: "✗ Las contraseñas no coinciden" });
      return false;
    }

    setPasswordsCoinciden({ valida: true, mensaje: "✓ Las contraseñas coinciden" });
    return true;
  };

  const handleRegresar = () => {
    window.history.back();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validar que solo se ingresen números en la cédula
    if (name === "cedula") {
      const soloNumeros = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        [name]: soloNumeros,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleInscripcionChange = (e) => {
    const { name, value } = e.target;
    setInscripcionData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validarFormulario = () => {
    const nuevosErrores = [];

    // Validaciones de campos requeridos
    if (!formData.nombre || formData.nombre.trim() === "") {
      nuevosErrores.push("El nombre es obligatorio");
    } else if (formData.nombre.length < 2) {
      nuevosErrores.push("El nombre debe tener al menos 2 caracteres");
    }

    if (!formData.apellido || formData.apellido.trim() === "") {
      nuevosErrores.push("El apellido es obligatorio");
    } else if (formData.apellido.length < 2) {
      nuevosErrores.push("El apellido debe tener al menos 2 caracteres");
    }

    // Validación de cédula
    if (!formData.cedula) {
      nuevosErrores.push("La cédula es obligatoria");
    } else if (!validarCedulaEcuatoriana(formData.cedula)) {
      nuevosErrores.push("La cédula ecuatoriana no es válida");
    }

    // Validación de email
    if (!formData.email) {
      nuevosErrores.push("El correo electrónico es obligatorio");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nuevosErrores.push("El correo electrónico no es válido");
    }

    // Validación de fecha de nacimiento
    if (!formData.fecha_nacimiento) {
      nuevosErrores.push("La fecha de nacimiento es obligatoria");
    } else {
      const fechaNac = new Date(formData.fecha_nacimiento);
      const hoy = new Date();
      const edad = hoy.getFullYear() - fechaNac.getFullYear();
      
      if (edad < 5) {
        nuevosErrores.push("Debe tener al menos 5 años para inscribirse");
      } else if (edad > 100) {
        nuevosErrores.push("Por favor, verifica la fecha de nacimiento");
      }
    }

    // Validación de género
    if (!formData.genero) {
      nuevosErrores.push("Debe seleccionar un género");
    }

    // Validación de teléfono (opcional pero con formato)
    if (formData.telefono && !/^\d{10}$/.test(formData.telefono)) {
      nuevosErrores.push("El teléfono debe tener 10 dígitos");
    }

    // Validación de contraseña
    if (!formData.password) {
      nuevosErrores.push("La contraseña es obligatoria");
    } else if (!validarPassword(formData.password)) {
      nuevosErrores.push("La contraseña no cumple con los requisitos de seguridad");
    }

    // Validación de confirmación de contraseña
    if (!formData.password_confirmation) {
      nuevosErrores.push("Debe confirmar la contraseña");
    } else if (formData.password !== formData.password_confirmation) {
      nuevosErrores.push("Las contraseñas no coinciden");
    }

    // Validación de curso
    if (!inscripcionData.id_curso) {
      nuevosErrores.push("Debe seleccionar un curso");
    }

    // Validación de pago
    if (!pagoRealizado) {
      nuevosErrores.push("Debe indicar si realizó el pago");
    }

    if (pagoRealizado === "si" && !comprobante) {
      nuevosErrores.push("Debe adjuntar el comprobante de pago");
    }

    return nuevosErrores;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nuevosErrores = validarFormulario();

    if (nuevosErrores.length > 0) {
      setErrores(nuevosErrores);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCargando(true);
    setErrores([]);
    setMensaje("");

    try {
      // Paso 1: Registrar el usuario
      const registroResponse = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const registroData = await registroResponse.json();

      if (!registroResponse.ok) {
        const erroresServidor = [];
        if (registroData.errors) {
          for (const campo in registroData.errors) {
            erroresServidor.push(registroData.errors[campo][0]);
          }
        } else {
          erroresServidor.push(registroData.message || "Error al registrar");
        }
        setErrores(erroresServidor);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Paso 2: Si el registro fue exitoso, hacer login automático
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok && loginData.access_token) {
        // Guardar token en localStorage
        localStorage.setItem("auth_token", loginData.access_token);
        localStorage.setItem("user_data", JSON.stringify(loginData.user));

        // Paso 3: Inscribir al curso si se seleccionó uno
        if (inscripcionData.id_curso) {
          const inscripcionPayload = {
            id_deportista: loginData.user.id,
            id_curso: inscripcionData.id_curso,
            id_grupo: inscripcionData.id_grupo || null,
            fecha_inscripcion: new Date().toISOString().split('T')[0],
            estado: "pendiente",
            pago_realizado: pagoRealizado === "si",
          };

          const inscripcionResponse = await fetch(
            `${API_BASE_URL}/inscripciones-curso`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${loginData.access_token}`,
              },
              body: JSON.stringify(inscripcionPayload),
            }
          );

          if (inscripcionResponse.ok) {
            // Paso 4: Subir comprobante si existe
            if (comprobante) {
              const formDataComprobante = new FormData();
              formDataComprobante.append("archivo", comprobante);
              formDataComprobante.append("tipo", "comprobante_pago");
              formDataComprobante.append("descripcion", "Comprobante de pago inscripción");

              await fetch(`${API_BASE_URL}/archivos`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${loginData.access_token}`,
                },
                body: formDataComprobante,
              });
            }

            setMensaje("✔ Registro e inscripción exitosos. Redirigiendo...");
          } else {
            setMensaje("✔ Registro exitoso. Error al inscribir al curso. Puede hacerlo desde su perfil.");
          }
        } else {
          setMensaje("✔ Registro exitoso. Redirigiendo...");
        }

        // Limpiar formulario
        setFormData({
          nombre: "",
          apellido: "",
          cedula: "",
          email: "",
          telefono: "",
          direccion: "",
          fecha_nacimiento: "",
          genero: "",
          password: "",
          password_confirmation: "",
          id_rol: "4",
        });
        setInscripcionData({ id_curso: "", id_grupo: "" });
        setPagoRealizado("");
        setComprobante(null);

        // Redirigir después de 2 segundos
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        setMensaje("✔ Registro exitoso. Por favor inicie sesión.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }

    } catch (error) {
      console.error("Error:", error);
      setErrores(["Error de conexión con el servidor."]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setCargando(false);
    }
  };

  const cursoSeleccionado = cursos.find(c => c.id == inscripcionData.id_curso);

  return (
    <div className="login-horizontal-container">
      <div className="login-left">
        <h2>Registro al Curso</h2>

        {mensaje && <div className="mensaje exito">{mensaje}</div>}

        {errores.length > 0 && (
          <div className="alert error">
            <strong>⚠ Por favor, corrija los siguientes errores:</strong>
            <ul>
              {errores.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <h3>Datos Personales</h3>
          
          <input
            type="text"
            name="nombre"
            placeholder="Nombre *"
            value={formData.nombre}
            onChange={handleChange}
            required
            minLength="2"
          />
          
          <input
            type="text"
            name="apellido"
            placeholder="Apellido *"
            value={formData.apellido}
            onChange={handleChange}
            required
            minLength="2"
          />
          
          <div className="input-with-validation">
            <input
              type="text"
              name="cedula"
              placeholder="Cédula ecuatoriana (10 dígitos) *"
              value={formData.cedula}
              onChange={handleChange}
              maxLength="10"
              required
              className={validacionCedula.valida === false ? "input-invalid" : validacionCedula.valida === true ? "input-valid" : ""}
            />
            {validacionCedula.mensaje && (
              <span className={`validation-message ${validacionCedula.valida ? "valid" : "invalid"}`}>
                {validacionCedula.mensaje}
              </span>
            )}
          </div>

          <div className="input-group">
  <label htmlFor="fecha_nacimiento" className="input-label">
    Fecha de nacimiento *
  </label>
  <input
    type="date"
    id="fecha_nacimiento"
    name="fecha_nacimiento"
    value={formData.fecha_nacimiento}
    onChange={handleChange}
    max={new Date().toISOString().split('T')[0]}
    required
  />
</div>


          <select
            name="genero"
            value={formData.genero}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione género *</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="otro">Otro</option>
          </select>

          <input
            type="email"
            name="email"
            placeholder="Correo electrónico *"
            value={formData.email}
            onChange={handleChange}
            required
          />
          
          <input
            type="text"
            name="telefono"
            placeholder="Teléfono (10 dígitos)"
            value={formData.telefono}
            onChange={handleChange}
            maxLength="10"
          />
          
          <input
            type="text"
            name="direccion"
            placeholder="Dirección"
            value={formData.direccion}
            onChange={handleChange}
          />

          <h3>Seguridad</h3>
          
          <div className="input-with-validation">
            <input
              type="password"
              name="password"
              placeholder="Contraseña *"
              value={formData.password}
              onChange={handleChange}
              required
              className={validacionPassword.valida === false ? "input-invalid" : validacionPassword.valida === true ? "input-valid" : ""}
            />
            {validacionPassword.mensaje && (
              <span className={`validation-message ${validacionPassword.valida ? "valid" : "invalid"}`}>
                {validacionPassword.mensaje}
              </span>
            )}
            <div className="password-requirements">
              <small>La contraseña debe tener:</small>
              <ul>
                <li>Mínimo 8 caracteres</li>
                <li>Al menos una mayúscula</li>
                <li>Al menos una minúscula</li>
                <li>Al menos un número</li>
                <li>Al menos un carácter especial (!@#$%^&*)</li>
              </ul>
            </div>
          </div>
          
          <div className="input-with-validation">
            <input
              type="password"
              name="password_confirmation"
              placeholder="Confirmar contraseña *"
              value={formData.password_confirmation}
              onChange={handleChange}
              required
              className={passwordsCoinciden.valida === false ? "input-invalid" : passwordsCoinciden.valida === true ? "input-valid" : ""}
            />
            {passwordsCoinciden.mensaje && (
              <span className={`validation-message ${passwordsCoinciden.valida ? "valid" : "invalid"}`}>
                {passwordsCoinciden.mensaje}
              </span>
            )}
          </div>

          <h3>Seleccionar Curso</h3>

          {cargandoCursos ? (
            <div className="loading-message">Cargando cursos disponibles...</div>
          ) : cursos.length === 0 ? (
            <div className="info-pago">
              <p>No hay cursos disponibles en este momento.</p>
            </div>
          ) : (
            <>
              <select
                name="id_curso"
                value={inscripcionData.id_curso}
                onChange={handleInscripcionChange}
                required
              >
                <option value="">Seleccione un curso *</option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nombre} - ${curso.precio || "0.00"}
                  </option>
                ))}
              </select>

              {cursoSeleccionado && (
                <div className="curso-info">
                  <p><strong>Descripción:</strong> {cursoSeleccionado.descripcion || "Sin descripción"}</p>
                  <p><strong>Duración:</strong> {cursoSeleccionado.duracion_horas || "N/A"} horas</p>
                  <p><strong>Precio:</strong> ${cursoSeleccionado.precio || "0.00"}</p>
                  <p><strong>Fecha inicio:</strong> {new Date(cursoSeleccionado.fecha_inicio).toLocaleDateString('es-ES')}</p>
                  <p><strong>Fecha fin:</strong> {new Date(cursoSeleccionado.fecha_fin).toLocaleDateString('es-ES')}</p>
                </div>
              )}

              {grupos.length > 0 && inscripcionData.id_curso && (
                <select
                  name="id_grupo"
                  value={inscripcionData.id_grupo}
                  onChange={handleInscripcionChange}
                >
                  <option value="">Seleccione un horario (opcional)</option>
                  {grupos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nombre} - {grupo.horario || "Horario por definir"}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}

          <h3>Información de Pago</h3>

          <select
            value={pagoRealizado}
            onChange={(e) => setPagoRealizado(e.target.value)}
            required
          >
            <option value="">¿Ha realizado el pago? *</option>
            <option value="si">Sí, ya pagué</option>
            <option value="no">No, aún no he pagado</option>
          </select>

          {pagoRealizado === "no" && (
            <div className="info-pago">
              <p><strong>Datos para realizar el pago:</strong></p>
              <p>Banco: Banco Pichincha</p>
              <p>N° Cuenta: 1234567890</p>
              <p>Tipo: Ahorros</p>
              <p>Nombre: Liga Cantonal Montecristi</p>
              <p className="nota">* Podrá subir el comprobante despues de haber hecho la transferencia</p>
            </div>
          )}

          {pagoRealizado === "si" && (
            <div className="comprobante-upload">
              <label>Adjuntar comprobante de pago: *</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setComprobante(e.target.files[0])}
                required
              />
              {comprobante && (
                <p className="archivo-seleccionado">
                  ✓ Archivo seleccionado: {comprobante.name}
                </p>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button
              type="button"
              className="botones secundario"
              onClick={handleRegresar}
              disabled={cargando}
            >
              ⬅ Regresar
            </button>

            <button
              type="submit"
              className="botones"
              disabled={cargando || (cargandoCursos && cursos.length === 0)}
            >
              {cargando ? "Registrando..." : "Registrarse"}
            </button>
          </div>

          <p className="login-link" style={{ marginTop: "15px", textAlign: "center" }}>
            ¿Ya tienes cuenta? <a href="/login">Inicia sesión aquí</a>
          </p>
        </form>
      </div>


 <div className="login-right">
        <img
          src="https://www.teatrocentrodearte.org/images/files/2024/0f2f6cd5-31d9-44e4-9c83-e95bf046cb9d.webp"
          alt="Registro"
        />

     
        <div className="info-text">
          <h1>Bienvenido</h1>
          <p>Regístrate y comienza tu aventura deportiva</p>
        </div>
      </div>
      </div>
    
  );
}