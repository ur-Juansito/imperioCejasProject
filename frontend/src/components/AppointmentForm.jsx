import React, { useState, useEffect } from 'react';
import api from '../services/api';
export default function AppointmentForm({ onCreated }) {
  const [services, setServices] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [servicioId, setServicioId] = useState('');
  const [profesionalId, setProfesionalId] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/services').then(res => setServices(res.data.data));
    api.get('/professionals').then(res => setProfesionales(res.data.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', { servicio_id: servicioId, profesional_id: profesionalId, fecha, hora });
      setMsg('¡Cita agendada con éxito!');
      setServicioId(''); setProfesionalId(''); setFecha(''); setHora('');
      if(onCreated) onCreated();
    } catch(err) { setMsg('Error al agendar cita'); }
  };

  return (
    <div style={{ maxWidth: '550px', margin: '2rem auto', padding: '2.5rem', background: '#141414', border: '1px solid #c5a059', borderRadius: '12px' }}>
      <h2 style={{ color: '#d4af37', textAlign: 'center' }}>Agendar Cita</h2>
      {msg && <p style={{ textAlign: 'center', color: '#5cb85c' }}>{msg}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <select value={servicioId} onChange={e=>setServicioId(e.target.value)} required style={{ padding: '12px', background: '#0f0f0f', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}>
          <option value="">Seleccione servicio</option>
          {services.map(s => <option key={s.id} value={s.id}>{s.nombre} (${s.precio})</option>)}
        </select>
        <select value={profesionalId} onChange={e=>setProfesionalId(e.target.value)} required style={{ padding: '12px', background: '#0f0f0f', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}>
          <option value="">Seleccione profesional</option>
          {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre_completo} - {p.especialidad}</option>)}
        </select>
        <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} required style={{ padding: '12px', background: '#0f0f0f', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
        <input type="time" value={hora} onChange={e=>setHora(e.target.value)} required style={{ padding: '12px', background: '#0f0f0f', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
        <button type="submit" className="btn-gold" style={{ padding: '12px' }}>Confirmar</button>
      </form>
    </div>
  );
}
