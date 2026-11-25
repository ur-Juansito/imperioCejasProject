import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import PasswordRecovery from './components/PasswordRecovery';
import AppointmentForm from './components/AppointmentForm';
import AppointmentList from './components/AppointmentList';
import PublicHome from './components/PublicHome';
import AdminPanel from './components/AdminPanel';
import ManagementPanel from './components/ManagementPanel';

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const [view, setView] = useState('agenda');
  const [selectedService, setSelectedService] = useState('');
  const [authView, setAuthView] = useState(null);
  const [bookingIntent, setBookingIntent] = useState(false);

  const logout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    setUser(null); setView('agenda'); setSelectedService(''); setAuthView(null);
  };

  const requestBooking = serviceId => {
    setSelectedService(serviceId ? String(serviceId) : '');
    setBookingIntent(true);
    if (!user) { setAuthView('login'); return; }
    setView('booking');
    document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' });
  };

  const onAuthenticated = newUser => {
    setUser(newUser); setAuthView(null);
    if (bookingIntent && newUser.rol === 'CLIENTE') setView('booking');
    else setView('agenda');
  };

  if (!user) return (
    <>
      <PublicHome onBook={requestBooking} onLogin={() => { setBookingIntent(false); setAuthView('login'); }} onRegister={() => { setBookingIntent(false); setAuthView('register'); }} />
      {authView && <div className="auth-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setAuthView(null); }}>
        <div className="auth-modal" role="dialog" aria-modal="true" aria-label={authView === 'login' ? 'Iniciar sesión' : authView === 'forgot' ? 'Recuperar contraseña' : 'Crear cuenta'}>
          <button className="modal-close" onClick={() => setAuthView(null)} aria-label="Cerrar">×</button>
          <div className="modal-brand"><img src="/logo-imperio-cejas.png" alt="Imperio de las Cejas" /></div>
          {authView === 'login'
            ? <Login onLoginSuccess={onAuthenticated} onGoRegister={() => setAuthView('register')} onGoForgot={() => setAuthView('forgot')} />
            : authView === 'forgot'
            ? <PasswordRecovery onGoLogin={() => setAuthView('login')} />
            : <Register onRegisterSuccess={onAuthenticated} onGoLogin={() => setAuthView('login')} />}
        </div>
      </div>}
    </>
  );

  const isAdmin = user.rol === 'ADMIN';
  const isProfessional = user.rol === 'PROFESIONAL';
  const isClient = user.rol === 'CLIENTE';
  const title = isAdmin ? 'Administración' : isProfessional ? 'Panel profesional' : 'Tu espacio de belleza';
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio"><span className="brand-logo-wrap"><img src="/logo-imperio-cejas.png" alt="" /></span><span className="brand-copy"><strong>IMPERIO</strong><small>DE LAS CEJAS</small></span></a>
        <div className="topbar-user"><div className="user-greeting"><strong>{user.nombre || user.email}</strong><small>{title}</small></div><button className="btn-outline" onClick={logout}>Cerrar sesión</button></div>
      </header>
      <main className="content" id="inicio">
        <section className="welcome"><p className="eyebrow">BELLEZA Y CUIDADO · EXPERIENCIA EXCLUSIVA</p><h1>{title}</h1><p className="muted">{isClient ? 'Solicita tus tratamientos y consulta el estado de tus reservas.' : isAdmin ? 'Gestiona servicios, profesionales, horarios y reservas del estudio.' : 'Gestiona tu disponibilidad, tus horarios y las solicitudes de tus clientes.'}</p></section>
        <section className="workspace" id="workspace">
          <nav className="tabs" aria-label="Opciones del panel">
            {isClient && <><button className={`tab ${view === 'booking' ? 'active' : ''}`} onClick={() => setView('booking')}>Solicitar cita</button><button className={`tab ${view === 'agenda' ? 'active' : ''}`} onClick={() => setView('agenda')}>Mis citas</button></>}
            {!isClient && <><button className={`tab ${view === 'agenda' ? 'active' : ''}`} onClick={() => setView('agenda')}>Agenda</button><button className={`tab ${view === 'management' ? 'active' : ''}`} onClick={() => setView('management')}>Servicios y horarios</button></>}
            {isAdmin && <button className={`tab ${view === 'admin' ? 'active' : ''}`} onClick={() => setView('admin')}>Administración</button>}
          </nav>
          {isClient && view === 'booking' ? <AppointmentForm key={selectedService || 'new'} initialServiceId={selectedService} onCreated={() => { setSelectedService(''); setView('agenda'); }} />
            : view === 'management' && (isAdmin || isProfessional) ? <ManagementPanel user={user} />
            : view === 'admin' && isAdmin ? <AdminPanel currentUser={user} />
            : <AppointmentList user={user} />}
        </section>
      </main>
      <footer className="footer">Imperio de las Cejas <span>·</span> Tu belleza, nuestra dedicación.</footer>
    </div>
  );
}
