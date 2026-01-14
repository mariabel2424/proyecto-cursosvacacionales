import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../css/recuperar.css";

export default function RecuperarContrasena() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [errores, setErrores] = useState([]);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nuevosErrores = [];
    if (!email.trim()) {
      nuevosErrores.push("El correo es obligatorio.");
    } else if (!email.includes("@")) {
      nuevosErrores.push("El correo no es válido.");
    }

    if (nuevosErrores.length > 0) {
      setErrores(nuevosErrores);
      setMensaje("");
      return;
    }

    try {
      setCargando(true);
      setErrores([]);
      setMensaje("");

      const response = await fetch(
        "http://127.0.0.1:8000/api/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const erroresLaravel = Object.values(data.errors).flat();
          setErrores(erroresLaravel);
        } else if (data.message) {
          setErrores([data.message]);
        } else {
          setErrores(["Ocurrió un error al enviar el enlace."]);
        }
        setMensaje("");
        return;
      }

      setMensaje("Hemos enviado un enlace de recuperación a tu correo.");
      setErrores([]);
    } catch (error) {
      console.error(error);
      setErrores(["Error de conexión con el servidor."]);
      setMensaje("");
    } finally {
      setCargando(false);
    }
  };

  const handleBack = () => {
    window.history.back(); // retroceder a la pantalla anterior
  };

  return (
    <div className="recuperar-page">
      <div className="recuperar-container">
        {/* Botón X arriba a la derecha */}
        <button
          type="button"
          className="close-button"
          onClick={handleBack}
        >
          ✕
        </button>

        <h2>Recuperar Contraseña</h2>

        {mensaje && <p className="mensaje-ok">{mensaje}</p>}
        {errores.length > 0 && (
          <div className="alert" role="alert">
            <ul>
              {errores.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Correo electrónico:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ingresa tu correo"
            required
            disabled={cargando}
          />

          <button type="submit" disabled={cargando}>
            {cargando ? "Enviando..." : "Enviar codigo"}
          </button>
        </form>

        <p className="info-link">
          ¿Ya recibiste el código?{" "}
          <Link to="/reestablecer-contrasena">Haz clic aquí</Link>
        </p>

        <p className="info-link">
          <Link to="/">Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
