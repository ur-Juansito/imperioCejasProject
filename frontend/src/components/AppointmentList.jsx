import React, { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';

const statusLabel = {
  PENDIENTE: 'Pendiente de aprobación',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada / rechazada',
  ATENDIDA: 'Atendida',
  COMPLETADA: 'Atendida' // compatibilidad con bases antiguas
};

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function downloadReceipt(item) {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Comprobante de cita #${item.id}</title>
  <style>
    body{font-family:Arial,sans-serif;background:#f5f2e9;color:#171717;padding:32px}.receipt{max-width:680px;margin:24px auto;background:white;padding:38px;border:1px solid #d4af37;border-radius:16px}
    h1{color:#9a741e;margin-bottom:4px}.muted{color:#666}.line{border-top:1px solid #ddd;margin:22px 0}.row{display:flex;justify-content:space-between;gap:18px;padding:9px 0}
    .status{display:inline-block;padding:7px 12px;border-radius:20px;background:#f4ead0;font-weight:bold}.print{background:#b88a22;color:#111;border:0;padding:12px 18px;border-radius:8px;cursor:pointer;margin-top:24px}
    @media print{body{background:white;padding:0}.receipt{border:0;margin:0 auto}.print{display:none}}
  </style></head><body><main class="receipt">
  <p class="muted">IMPERIO DE LAS CEJAS · COMPROBANTE</p><h1>Detalle de tu cita</h1><p class="muted">Comprobante #${escapeHtml(item.id)}</p><div class="line"></div>
  <div class="row"><strong>Cliente</strong><span>${escapeHtml(item.cliente_nombre || item.cliente_email)}</span></div>
  <div class="row"><strong>Servicio</strong><span>${escapeHtml(item.servicio_nombre)}</span></div>
  <div class="row"><strong>Profesional</strong><span>${escapeHtml(item.profesional_nombre)}</span></div>
  <div class="row"><strong>Fecha</strong><span>${escapeHtml(String(item.fecha).slice(0,10))}</span></div>
  <div class="row"><strong>Hora</strong><span>${escapeHtml(String(item.hora).slice(0,5))}</span></div>
  <div class="row"><strong>Valor del servicio</strong><span>${Number(item.servicio_precio || 0).toLocaleString('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0})}</span></div>
  <div class="line"></div><p>Estado: <span class="status">${escapeHtml(statusLabel[item.estado] || item.estado)}</span></p>
  <p class="muted">Este documento acredita los datos de la solicitud de cita. La reserva solo está confirmada cuando su estado lo indica.</p>
  <button class="print" onclick="window.print()">Imprimir / Guardar como PDF</button></main></body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `comprobante-cita-${item.id}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

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
                      <button className="btn-small neutral" type="button" onClick={() => downloadReceipt(item)}>Comprobante</button>
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
