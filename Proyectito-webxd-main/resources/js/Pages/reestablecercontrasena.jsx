import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../css/reestablecer.css";

export default function ReestablecerContrasena() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const tokenFromUrl = params.get("token") || "";
  const emailFromUrl = params.get("email") || "";

  const [formData, setFormData] = useState({
    email: emailFromUrl,
    token: tokenFromUrl,
    password: "",
    password_confirmation: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [errores, setErrores] = useState([]);
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nuevosErrores = [];
    if (!formData.email.trim())
      nuevosErrores.push("El correo es obligatorio.");
    if (!formData.token.trim())
      nuevosErrores.push("El código/token es obligatorio.");
    if (formData.password.length < 6)
      nuevosErrores.push("La contraseña debe tener al menos 6 caracteres.");
    if (formData.password !== formData.password_confirmation)
      nuevosErrores.push("Las contraseñas no coinciden.");

    if (nuevosErrores.length > 0) {
      setErrores(nuevosErrores);
      setMensaje("");
      return;
    }

    try {
      setCargando(true);
      setErrores([]);
      setMensaje("");

      const response = await fetch("http://127.0.0.1:8000/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const erroresLaravel = Object.values(data.errors).flat();
          setErrores(erroresLaravel);
        } else if (data.message) {
          setErrores([data.message]);
        } else {
          setErrores(["Ocurrió un error al restablecer la contraseña."]);
        }
        setMensaje("");
        return;
      }

      setMensaje(
        "Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión."
      );
      setErrores([]);

      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      console.error(error);
      setErrores(["Error de conexión con el servidor."]);
      setMensaje("");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="reestablecer-page">
      <div className="reestablecer-container">
        <h2>Reestablecer Contraseña</h2>

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
            name="email"
            placeholder="Tu correo registrado"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={cargando}
          />

          <label htmlFor="token">Código / Token:</label>
          <input
            type="text"
            id="token"
            name="token"
            placeholder="Código que llegó a tu correo"
            value={formData.token}
            onChange={handleChange}
            required
            disabled={cargando}
          />

          <label htmlFor="password">Nueva contraseña:</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={cargando}
          />

          <label htmlFor="password_confirmation">Repite la contraseña:</label>
          <input
            type="password"
            id="password_confirmation"
            name="password_confirmation"
            placeholder="Repite tu nueva contraseña"
            value={formData.password_confirmation}
            onChange={handleChange}
            required
            disabled={cargando}
          />

          <button type="submit" disabled={cargando}>
            {cargando ? "Guardando..." : "Guardar nueva contraseña"}
          </button>
        </form>

        <p className="info-link">
          <Link to="/">Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
