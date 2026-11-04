import React, { useState } from 'react';
import Login from './components/Login';
import AppointmentForm from './components/AppointmentForm';
import AppointmentList from './components/AppointmentList';

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [view, setView] = useState('form');

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#0b0b0b' }}>
        <h1 style={{ color: '#d4af37', fontFamily: 'Georgia' }}>El Imperio de las Cejas</h1>
        <Login onLoginSuccess={setUser} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0b', color: '#fff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 3rem', borderBottom: '1px solid #333', background: '#121212' }}>
        <h1 style={{ color: '#d4af37', margin: 0, fontSize: '1.5rem' }}>El Imperio de las Cejas</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setView('form')} className="btn-gold" style={{ padding: '8px 16px' }}>Agendar Cita</button>
          <button onClick={() => setView('list')} className="btn-gold" style={{ padding: '8px 16px' }}>Ver Citas</button>
          <button onClick={() => { localStorage.clear(); setUser(null); }} style={{ background: 'transparent', border: '1px solid #d9534f', color: '#d9534f', padding: '8px 16px', borderRadius: '6px' }}>Salir</button>
        </div>
      </header>
      <main style={{ padding: '2rem' }}>
        {view === 'form' ? <AppointmentForm /> : <AppointmentList />}
      </main>
    </div>
  );
}
