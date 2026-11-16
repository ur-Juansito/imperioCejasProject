import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import AppointmentForm from './components/AppointmentForm';
import AppointmentList from './components/AppointmentList';
import ServicesSection from './components/ServicesSection';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  });
  const [view, setView] = useState('form');
  const [selectedService, setSelectedService] = useState('');
  const [authView, setAuthView] = useState('login');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setView('form');
  };

  if (!user) {
    return (
      <main className="auth-page">
        <div className="auth-brand">
          <img src="/logo-imperio-cejas.png" alt="Imperio de las Cejas" />
          <p>IMPERIO DE LAS CEJAS</p>
        </div>
        {authView === 'login'
          ? <Login onLoginSuccess={setUser} onGoRegister={() => setAuthView('register')} />
          : <Register onRegisterSuccess={newUser => { setView('form'); setUser(newUser); }} onGoLogin={() => setAuthView('login')} />}
      </main>
    );
  }

  const canRequest = user.rol === 'CLIENTE';
  const isAdmin = user.rol === 'ADMIN';
  const title = user.rol === 'PROFESIONAL'
    ? 'Panel profesional'
    : isAdmin ? 'Administración' : 'Tu espacio de belleza';

  const bookService = serviceId => {
    setSelectedService(String(serviceId));
    setView('form');
    document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Imperio de las Cejas, inicio">
          <span className="brand-logo-wrap"><img src="/logo-imperio-cejas.png" alt="" /></span>
          <span className="brand-copy"><strong>IMPERIO</strong><small>DE LAS CEJAS</small></span>
        </a>
        <div className="topbar-user">
          <div className="user-greeting"><strong>{user.nombre || user.email}</strong><small>{title}</small></div>
          <button className="btn-outline" onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      <main className="content" id="inicio">
        <section className="welcome">
          <p className="eyebrow">BELLEZA Y CUIDADO · EXPERIENCIA EXCLUSIVA</p>
          <h1>{title}</h1>
          <p className="muted">
            {canRequest
              ? 'Descubre nuestros tratamientos y solicita tu cita. Nuestro equipo confirmará tu reserva.'
              : isAdmin
                ? 'Administra las cuentas, el equipo profesional y las reservas del estudio.'
                : 'Consulta tu agenda y gestiona las solicitudes de tus clientes.'}
          </p>
        </section>

        {canRequest && <ServicesSection onBook={bookService} />}

        <section className="workspace" id="workspace">
          <nav className="tabs" aria-label="Opciones del panel">
            {canRequest && <>
              <button className={view === 'form' ? 'tab active' : 'tab'} onClick={() => setView('form')}>Solicitar cita</button>
              <button className={view === 'list' ? 'tab active' : 'tab'} onClick={() => setView('list')}>Mis citas</button>
            </>}
            {!canRequest && <button className={view === 'list' ? 'tab active' : 'tab'} onClick={() => setView('list')}>Gestionar agenda</button>}
            {isAdmin && <button className={view === 'admin' ? 'tab active' : 'tab'} onClick={() => setView('admin')}>Usuarios y profesionales</button>}
          </nav>

          {view === 'form' && canRequest
            ? <AppointmentForm key={selectedService || 'new'} initialServiceId={selectedService} onCreated={() => { setSelectedService(''); setView('list'); }} />
            : view === 'admin' && isAdmin
              ? <AdminPanel currentUser={user} />
              : <AppointmentList user={user} />}
        </section>
      </main>
      <footer className="footer">Imperio de las Cejas <span>·</span> Tu belleza, nuestra dedicación.</footer>
    </div>
  );
}
