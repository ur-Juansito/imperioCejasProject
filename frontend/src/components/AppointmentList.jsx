import React, { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';

const statusLabel = {
  PENDIENTE: 'Pendiente de aprobación',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada / rechazada',
  ATENDIDA: 'Atendida',
  COMPLETADA: 'Atendida' // compatibilidad con bases antiguas
};

export default function AppointmentList({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await api.get('/appointments');
      setAppointments(response.data.data || []);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar las citas.'));
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const updateStatus = async (id, action) => {
    setBusyId(id);
    setError('');
    try {
      await api.patch(`/appointments/${id}/${action}`);
      await fetchAppointments();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo actualizar la cita.'));
    } finally {
      setBusyId(null);
    }
  };

  const canApprove = ['ADMIN', 'PROFESIONAL'].includes(user?.rol);
  const isClient = user?.rol === 'CLIENTE';

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">AGENDA</p>
        <h2>{canApprove ? 'Solicitudes y citas' : 'Mis citas'}</h2>
        <p className="muted">{canApprove ? 'Revisa las solicitudes pendientes y decide si las apruebas.' : 'Consulta el estado de tus solicitudes de reserva.'}</p>
      </div>
      {error && <p className="alert error">{error}</p>}
      {!appointments.length ? <p className="empty-state">Todavía no hay citas para mostrar.</p> : (
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Cliente</th><th>Servicio</th><th>Profesional</th><th>Fecha</th><th>Hora</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              {appointments.map(item => (
                <tr key={item.id}>
                  <td>{item.cliente_nombre || item.cliente_email}<small className="cell-sub">{item.cliente_email}</small></td>
                  <td>{item.servicio_nombre}</td>
                  <td>{item.profesional_nombre}</td>
                  <td>{String(item.fecha).slice(0, 10)}</td>
                  <td>{String(item.hora).slice(0, 5)}</td>
                  <td><span className={`status status-${item.estado.toLowerCase()}`}>{statusLabel[item.estado] || item.estado}</span></td>
                  <td>
                    <div className="actions">
                      {canApprove && item.estado === 'PENDIENTE' && <>
                        <button className="btn-small approve" disabled={busyId === item.id} onClick={() => updateStatus(item.id, 'confirmar')}>Aprobar</button>
                        <button className="btn-small reject" disabled={busyId === item.id} onClick={() => updateStatus(item.id, 'rechazar')}>Rechazar</button>
                      </>}
                      {canApprove && item.estado === 'CONFIRMADA' && (
                        <button className="btn-small approve" disabled={busyId === item.id} onClick={() => updateStatus(item.id, 'atendida')}>Marcar atendida</button>
                      )}
                      {(isClient && ['PENDIENTE', 'CONFIRMADA'].includes(item.estado)) && (
                        <button className="btn-small reject" disabled={busyId === item.id} onClick={() => updateStatus(item.id, 'cancelar')}>Cancelar</button>
                      )}
                      {!((canApprove && ['PENDIENTE', 'CONFIRMADA'].includes(item.estado)) || (isClient && ['PENDIENTE', 'CONFIRMADA'].includes(item.estado))) && <span className="muted">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
