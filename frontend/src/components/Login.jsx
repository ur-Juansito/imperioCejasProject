import React, { useState } from 'react';
import api, { getErrorMessage } from '../services/api';

export default function Login({ onLoginSuccess, onGoRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email: email.trim(), password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLoginSuccess(response.data.user);
    } catch (err) {
      setError(getErrorMessage(err, 'No fue posible iniciar sesión.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-card">
      <p className="eyebrow">IMPERIO DE LAS CEJAS</p>
      <h2>Bienvenida</h2>
      <p className="muted">Inicia sesión para gestionar tus citas.</p>
      {error && <p className="alert error" role="alert">{error}</p>}
      <form onSubmit={handleSubmit} className="form-stack">
        <label>Correo electrónico
          <input type="email" autoComplete="email" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label>Contraseña
          <input type="password" autoComplete="current-password" placeholder="Tu contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Ingresando…' : 'Iniciar sesión'}</button>
      </form>
      <p className="auth-switch">¿Aún no tienes cuenta? <button type="button" className="link-button" onClick={onGoRegister}>Crear cuenta</button></p>
    </section>
  );
}
