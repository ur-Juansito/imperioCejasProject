import React, { useEffect, useState } from 'react';
import api from '../services/api';
export default function AppointmentList() {
  const [citas, setCitas] = useState([]);
  const fetchCitas = () => api.get('/appointments').then(res => setCitas(res.data.data));
  useEffect(() => { fetchCitas(); }, []);
  const handleDelete = async (id) => {
    if(window.confirm('¿Cancelar cita?')) {
      await api.delete(`/appointments/${id}`);
      fetchCitas();
    }
  };
  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem', background: '#141414', border: '1px solid #c5a059', borderRadius: '12px' }}>
      <h2 style={{ color: '#d4af37', textAlign: 'center' }}>Citas Programadas</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr style={{ color: '#d4af37', borderBottom: '1px solid #333', textAlign: 'left' }}>
            <th style={{padding: '10px'}}>Cliente</th><th style={{padding: '10px'}}>Servicio</th><th style={{padding: '10px'}}>Profesional</th><th style={{padding: '10px'}}>Fecha/Hora</th><th style={{padding: '10px'}}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {citas.map(c => (
            <tr key={c.id} style={{ borderBottom: '1px solid #222' }}>
              <td style={{padding: '10px'}}>{c.cliente_email}</td>
              <td style={{padding: '10px'}}>{c.servicio_nombre}</td>
              <td style={{padding: '10px'}}>{c.profesional_nombre}</td>
              <td style={{padding: '10px'}}>{c.fecha?.split('T')[0]} {c.hora}</td>
              <td style={{padding: '10px'}}><button onClick={()=>handleDelete(c.id)} style={{background:'#d9534f', color:'#fff', border:'none', padding:'6px 12px', borderRadius:'4px'}}>Eliminar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
