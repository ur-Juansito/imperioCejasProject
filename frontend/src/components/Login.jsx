import React, { useState } from 'react';
import api from '../services/api';
export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLoginSuccess(res.data.user);
    } catch (err) { setError('Credenciales inválidas'); }
  };
  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2.5rem', background: '#141414', border: '1px solid #c5a059', borderRadius: '12px' }}>
      <h2 style={{ color: '#d4af37', textAlign: 'center' }}>Iniciar Sesión</h2>
      {error && <p style={{ color: '#d9534f', textAlign: 'center' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <input type="email" placeholder="Correo" value={email} onChange={e=>setEmail(e.target.value)} required style={{ padding: '12px', background: '#0f0f0f', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
        <input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} required style={{ padding: '12px', background: '#0f0f0f', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
        <button type="submit" className="btn-gold" style={{ padding: '12px' }}>Entrar</button>
      </form>
    </div>
  );
}
