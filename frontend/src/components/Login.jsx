import React, { useState } from 'react';
import api from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLoginSuccess(response.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible iniciar sesión. Verifica tus datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-card">
      <p className="eyebrow">ÉCLAT STUDIO</p>
      <h2>Bienvenida</h2>
      <p className="muted">Inicia sesión para gestionar tus citas.</p>
      {error && <p className="alert error">{error}</p>}
      <form onSubmit={handleSubmit} className="form-stack">
        <label>Correo electrónico
          <input type="email" autoComplete="email" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label>Contraseña
          <input type="password" autoComplete="current-password" placeholder="Tu contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Ingresando…' : 'Iniciar sesión'}</button>
      </form>
    </section>
  );
}
