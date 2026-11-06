import React, { useState } from 'react';
import api, { getErrorMessage } from '../services/api';

const MIN_PASSWORD = 8;

export default function Register({ onRegisterSuccess, onGoLogin }) {
  const [form, setForm] = useState({ nombre_completo: '', telefono: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password.length < MIN_PASSWORD) {
      return setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
    }
    if (form.password !== form.confirm) {
      return setError('Las contraseñas no coinciden.');
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        nombre_completo: form.nombre_completo.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        password: form.password
      });
      // El backend devuelve el token: la persona queda con la sesión iniciada.
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onRegisterSuccess(response.data.user);
    } catch (err) {
      setError(getErrorMessage(err, 'No fue posible crear la cuenta.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-card">
      <p className="eyebrow">IMPERIO DE LAS CEJAS</p>
      <h2>Crear cuenta</h2>
      <p className="muted">Regístrate para solicitar tus citas en línea.</p>
      {error && <p className="alert error" role="alert">{error}</p>}
      <form onSubmit={handleSubmit} className="form-stack">
        <label>Nombre completo
          <input type="text" autoComplete="name" placeholder="Tu nombre y apellido" value={form.nombre_completo} onChange={update('nombre_completo')} minLength={2} maxLength={150} required />
        </label>
        <label>Teléfono <span className="optional">(opcional)</span>
          <input type="tel" autoComplete="tel" placeholder="300 123 4567" value={form.telefono} onChange={update('telefono')} maxLength={20} />
        </label>
        <label>Correo electrónico
          <input type="email" autoComplete="email" placeholder="correo@ejemplo.com" value={form.email} onChange={update('email')} maxLength={100} required />
        </label>
        <label>Contraseña
          <input type="password" autoComplete="new-password" placeholder={`Mínimo ${MIN_PASSWORD} caracteres`} value={form.password} onChange={update('password')} minLength={MIN_PASSWORD} maxLength={72} required />
        </label>
        <label>Confirmar contraseña
          <input type="password" autoComplete="new-password" placeholder="Repite la contraseña" value={form.confirm} onChange={update('confirm')} required />
        </label>
        <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Creando cuenta…' : 'Crear cuenta'}</button>
      </form>
      <p className="auth-switch">¿Ya tienes cuenta? <button type="button" className="link-button" onClick={onGoLogin}>Iniciar sesión</button></p>
    </section>
  );
}
