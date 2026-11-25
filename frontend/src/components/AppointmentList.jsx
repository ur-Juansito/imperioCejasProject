import React, { useCallback, useEffect, useState, useMemo } from 'react';
import api, { getErrorMessage } from '../services/api';
import AppointmentCalendar from './AppointmentCalendar';

const statusLabel = {
  PENDIENTE: 'Pendiente de aprobación',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada / rechazada',
  ATENDIDA: 'Atendida',
  COMPLETADA: 'Atendida' // compatibilidad con bases antiguas
};

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
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
  <div class="row"><strong>Fecha</strong><span>${escapeHtml(String(item.fecha).slice(0, 10))}</span></div>
  <div class="row"><strong>Hora</strong><span>${escapeHtml(String(item.hora).slice(0, 5))}</span></div>
  <div class="row"><strong>Valor del servicio</strong><span>${Number(item.servicio_precio || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</span></div>
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
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarVisible, setCalendarVisible] = useState(true);

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await api.get('/appointments');
      setAppointments(response.data.data || []);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar las citas.'));
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

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

  const handleSelectDate = (dateString) => {
    // Si se hace clic en la fecha ya seleccionada, alterna o mantiene
    if (selectedDate === dateString) {
      setSelectedDate(null);
    } else {
      setSelectedDate(dateString);
    }
  };

  const displayedAppointments = useMemo(() => {
    if (!selectedDate) return appointments;
    return appointments.filter(
      (item) => String(item.fecha).slice(0, 10) === selectedDate
    );
  }, [appointments, selectedDate]);

  const canApprove = ['ADMIN', 'PROFESIONAL'].includes(user?.rol);
  const isClient = user?.rol === 'CLIENTE';

  return (
    <section className="panel">
      <div className="section-heading-row">
        <div className="section-heading">
          <p className="eyebrow">AGENDA INTERACTIVA</p>
          <h2>{canApprove ? 'Solicitudes y citas programadas' : 'Mis citas programadas'}</h2>
          <p className="muted">
            {canApprove
              ? 'Haz clic en cualquier día del calendario para revisar las citas asignadas a esa fecha.'
              : 'Consulta tus citas en el calendario. Haz clic en un día para ver tus tratamientos programados.'}
          </p>
        </div>
        <div className="view-toggle-actions">
          <button
            type="button"
            className={`btn-outline ${calendarVisible ? 'active-view' : ''}`}
            onClick={() => setCalendarVisible((v) => !v)}
          >
            {calendarVisible ? 'Ocultar calendario' : 'Mostrar calendario'}
          </button>
          {selectedDate && (
            <button
              type="button"
              className="btn-outline"
              onClick={() => setSelectedDate(null)}
            >
              Ver todas las citas ({appointments.length})
            </button>
          )}
        </div>
      </div>

      {error && <p className="alert error">{error}</p>}

      {/* Calendario interactivo con citas programadas */}
      {calendarVisible && (
        <AppointmentCalendar
          appointments={appointments}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          onClearDate={() => setSelectedDate(null)}
        />
      )}

      {/* Título de la sección de listado según filtro */}
      <div className="list-status-header">
        {selectedDate ? (
          <div className="selected-day-banner">
            <div>
              <h3>
                Citas del día <span>{selectedDate}</span>
              </h3>
              <p className="muted">
                {displayedAppointments.length === 1
                  ? 'Hay 1 cita programada para esta fecha.'
                  : `Hay ${displayedAppointments.length} citas programadas para esta fecha.`}
              </p>
            </div>
            <button
              type="button"
              className="btn-small neutral"
              onClick={() => setSelectedDate(null)}
            >
              ✕ Quitar filtro de día
            </button>
          </div>
        ) : (
          <div className="all-days-banner">
            <h3>Todas las citas registradas</h3>
            <span className="count-badge">{appointments.length} en total</span>
          </div>
        )}
      </div>

      {!displayedAppointments.length ? (
        <div className="empty-calendar-state">
          <span className="empty-icon">📅</span>
          <p className="empty-text">
            {selectedDate
              ? `No hay ninguna cita programada para el día ${selectedDate}.`
              : 'Todavía no hay citas registradas en la agenda.'}
          </p>
          {selectedDate && (
            <button
              type="button"
              className="btn-outline"
              onClick={() => setSelectedDate(null)}
            >
              Ver citas de otras fechas
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Profesional</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayedAppointments.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.cliente_nombre || item.cliente_email}
                    <small className="cell-sub">{item.cliente_email}</small>
                  </td>
                  <td>{item.servicio_nombre}</td>
                  <td>{item.profesional_nombre}</td>
                  <td>
                    <span className="date-tag">{String(item.fecha).slice(0, 10)}</span>
                  </td>
                  <td>
                    <strong className="time-tag">{String(item.hora).slice(0, 5)}</strong>
                  </td>
                  <td>
                    <span className={`status status-${item.estado.toLowerCase()}`}>
                      {statusLabel[item.estado] || item.estado}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn-small neutral"
                        type="button"
                        onClick={() => downloadReceipt(item)}
                      >
                        Comprobante
                      </button>
                      {canApprove && item.estado === 'PENDIENTE' && (
                        <>
                          <button
                            className="btn-small approve"
                            disabled={busyId === item.id}
                            onClick={() => updateStatus(item.id, 'confirmar')}
                          >
                            Aprobar
                          </button>
                          <button
                            className="btn-small reject"
                            disabled={busyId === item.id}
                            onClick={() => updateStatus(item.id, 'rechazar')}
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                      {canApprove && item.estado === 'CONFIRMADA' && (
                        <button
                          className="btn-small approve"
                          disabled={busyId === item.id}
                          onClick={() => updateStatus(item.id, 'atendida')}
                        >
                          Marcar atendida
                        </button>
                      )}
                      {isClient && ['PENDIENTE', 'CONFIRMADA'].includes(item.estado) && (
                        <button
                          className="btn-small reject"
                          disabled={busyId === item.id}
                          onClick={() => updateStatus(item.id, 'cancelar')}
                        >
                          Cancelar
                        </button>
                      )}
                      {!(
                        (canApprove && ['PENDIENTE', 'CONFIRMADA'].includes(item.estado)) ||
                        (isClient && ['PENDIENTE', 'CONFIRMADA'].includes(item.estado))
                      ) && <span className="muted">—</span>}
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
