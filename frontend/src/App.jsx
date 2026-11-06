import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import AppointmentForm from './components/AppointmentForm';
import AppointmentList from './components/AppointmentList';

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  });
  const [view, setView] = useState('form');
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return (
      <main className="auth-page">
        {authView === 'login'
          ? <Login onLoginSuccess={setUser} onGoRegister={() => setAuthView('register')} />
          : <Register onRegisterSuccess={(newUser) => { setView('form'); setUser(newUser); }} onGoLogin={() => setAuthView('login')} />}
      </main>
    );
  }

  const canRequest = user.rol === 'CLIENTE';
  const title = user.rol === 'PROFESIONAL' ? 'Panel profesional' : user.rol === 'ADMIN' ? 'Administración' : 'Tu espacio de belleza';

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="El Imperio de las Cejas, inicio">
          <span className="brand-mark">I</span>
          <span><strong>IMPERIO</strong><small>DE LAS CEJAS</small></span>
        </a>
        <div className="topbar-user">
          <div><strong>{user.nombre || user.email}</strong><small>{title}</small></div>
          <button className="btn-outline" onClick={logout}>Cerrar sesión</button>
        </div>
      </header>
      <main className="content">
        <div className="welcome">
          <p className="eyebrow">IMPERIO DE LAS CEJAS · BELLEZA Y CUIDADO</p>
          <h1>{title}</h1>
          <p className="muted">{canRequest ? 'Solicita tu tratamiento y espera la aprobación de nuestro equipo.' : 'Gestiona las solicitudes y el estado de las citas.'}</p>
        </div>
        <nav className="tabs">
          {canRequest && <button className={view === 'form' ? 'tab active' : 'tab'} onClick={() => setView('form')}>Solicitar cita</button>}
          <button className={view === 'list' ? 'tab active' : 'tab'} onClick={() => setView('list')}>{canRequest ? 'Mis citas' : 'Gestionar agenda'}</button>
        </nav>
        {view === 'form' && canRequest
          ? <AppointmentForm onCreated={() => setView('list')} />
          : <AppointmentList user={user} />}
      </main>
      <footer className="footer">El Imperio de las Cejas · Tu belleza, nuestra dedicación.</footer>
    </div>
  );
}
