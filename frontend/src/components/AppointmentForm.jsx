import React, { useEffect, useState } from 'react';
import api from '../services/api';

const today = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export default function AppointmentForm({ onCreated }) {
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/services'), api.get('/professionals')])
      .then(([serviceResponse, professionalResponse]) => {
        setServices(serviceResponse.data.data || []);
        setProfessionals(professionalResponse.data.data || []);
      })
      .catch(() => setError('No se pudo cargar el catálogo. Intenta nuevamente.'));
  }, []);

  useEffect(() => {
    setTime('');
    setSlots([]);
    setMessage('');
    if (!serviceId || !professionalId || !date) return;
    api.get('/appointments/availability', {
      params: { servicio_id: serviceId, profesional_id: professionalId, fecha: date }
    }).then(response => {
      setSlots(response.data.data?.slots || []);
      if (!(response.data.data?.slots || []).length) {
        setMessage(response.data.data?.message || 'No hay horarios disponibles para esta fecha.');
      }
    }).catch(err => {
      setError(err.response?.data?.message || 'No se pudieron consultar los horarios.');
    });
  }, [serviceId, professionalId, date]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await api.post('/appointments', {
        servicio_id: Number(serviceId),
        profesional_id: Number(professionalId),
        fecha: date,
        hora: time
      });
      setMessage('¡Solicitud enviada! Tu cita quedó pendiente de aprobación profesional.');
      setServiceId('');
      setProfessionalId('');
      setDate('');
      setTime('');
      setSlots([]);
      if (onCreated) onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel form-panel">
      <div className="section-heading">
        <p className="eyebrow">RESERVAS</p>
        <h2>Solicitar una cita</h2>
        <p className="muted">Elige el tratamiento y un horario. El profesional confirmará tu solicitud.</p>
      </div>
      {message && <p className="alert success">{message}</p>}
      {error && <p className="alert error">{error}</p>}
      <form onSubmit={handleSubmit} className="form-stack">
        <label>Servicio
          <select value={serviceId} onChange={e => setServiceId(e.target.value)} required>
            <option value="">Selecciona un servicio</option>
            {services.map(service => <option key={service.id} value={service.id}>{service.nombre} · ${Number(service.precio).toLocaleString('es-CO')}</option>)}
          </select>
        </label>
        <label>Profesional
          <select value={professionalId} onChange={e => setProfessionalId(e.target.value)} required>
            <option value="">Selecciona un profesional</option>
            {professionals.map(person => <option key={person.id} value={person.id}>{person.nombre_completo}{person.especialidad ? ` · ${person.especialidad}` : ''}</option>)}
          </select>
        </label>
        <label>Fecha
          <input type="date" min={today()} value={date} onChange={e => setDate(e.target.value)} required />
        </label>
        <label>Horario disponible
          <select value={time} onChange={e => setTime(e.target.value)} required disabled={!slots.length}>
            <option value="">{slots.length ? 'Selecciona un horario' : 'Primero selecciona servicio, profesional y fecha'}</option>
            {slots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
          </select>
        </label>
        <button className="btn-primary" type="submit" disabled={loading || !time}>{loading ? 'Enviando…' : 'Enviar solicitud de cita'}</button>
      </form>
      <p className="hint">Tu reserva no estará confirmada hasta que el profesional la apruebe.</p>
    </section>
  );
}
