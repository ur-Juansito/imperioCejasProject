import React, { useState, useMemo } from 'react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/**
 * Componente de Calendario interactivo para Imperio de las Cejas.
 * Muestra los días del mes, destaca los días con citas programadas y
 * al hacer clic en un día, filtra y muestra las citas de esa fecha.
 */
export default function AppointmentCalendar({
  appointments = [],
  selectedDate,
  onSelectDate,
  onClearDate
}) {
  const today = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Iniciar la vista del mes en la fecha seleccionada o en la fecha de hoy
  const [currentViewDate, setCurrentViewDate] = useState(() => {
    const initial = selectedDate || today;
    const [y, m] = initial.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  // Mapeo de fecha 'YYYY-MM-DD' -> array de citas de ese día
  const appointmentsByDate = useMemo(() => {
    const map = {};
    for (const appt of appointments) {
      if (!appt.fecha) continue;
      const dateStr = String(appt.fecha).slice(0, 10);
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(appt);
    }
    return map;
  }, [appointments]);

  // Generar las celdas del mes (lunes a domingo)
  const calendarDays = useMemo(() => {
    const days = [];
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Día de la semana del primer día (0=Dom, 1=Lun, ..., 6=Sáb)
    // Convertimos a Lunes=0 ... Domingo=6
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

    // Días del mes anterior para rellenar la primera fila
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateString: dateStr,
        isCurrentMonth: false,
        appointments: appointmentsByDate[dateStr] || []
      });
    }

    // Días del mes actual
    const daysInMonth = lastDayOfMonth.getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateString: dateStr,
        isCurrentMonth: true,
        appointments: appointmentsByDate[dateStr] || []
      });
    }

    // Días del próximo mes para completar la última fila de 7 días
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateString: dateStr,
        isCurrentMonth: false,
        appointments: appointmentsByDate[dateStr] || []
      });
    }

    return days;
  }, [year, month, appointmentsByDate]);

  const prevMonth = () => {
    setCurrentViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentViewDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const [tY, tM] = today.split('-').map(Number);
    setCurrentViewDate(new Date(tY, tM - 1, 1));
    onSelectDate(today);
  };

  return (
    <div className="appointment-calendar-container">
      {/* Barra superior de navegación de mes */}
      <div className="calendar-header">
        <div className="calendar-title-wrap">
          <span className="calendar-icon">📅</span>
          <h3>{MONTH_NAMES[month]} <span className="calendar-year">{year}</span></h3>
        </div>
        <div className="calendar-nav-buttons">
          <button
            type="button"
            className="calendar-btn-nav"
            onClick={prevMonth}
            title="Mes anterior"
            aria-label="Mes anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className="calendar-btn-today"
            onClick={goToToday}
          >
            Hoy
          </button>
          <button
            type="button"
            className="calendar-btn-nav"
            onClick={nextMonth}
            title="Mes siguiente"
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="calendar-weekdays-grid">
        {WEEKDAY_NAMES.map((w) => (
          <div key={w} className="calendar-weekday-header">
            {w}
          </div>
        ))}
      </div>

      {/* Grilla de días */}
      <div className="calendar-days-grid">
        {calendarDays.map((cell, idx) => {
          const isSelected = selectedDate === cell.dateString;
          const isToday = today === cell.dateString;
          const hasAppts = cell.appointments.length > 0;

          return (
            <button
              key={`${cell.dateString}-${idx}`}
              type="button"
              onClick={() => onSelectDate(cell.dateString)}
              className={`calendar-day-cell ${
                cell.isCurrentMonth ? 'in-month' : 'out-of-month'
              } ${isSelected ? 'is-selected' : ''} ${
                isToday ? 'is-today' : ''
              } ${hasAppts ? 'has-appointments' : ''}`}
              title={`Clic para ver citas del ${cell.dateString}${
                hasAppts ? ` (${cell.appointments.length} cita${cell.appointments.length > 1 ? 's' : ''})` : ' (Sin citas)'
              }`}
            >
              <span className="day-number">{cell.dayNumber}</span>
              {hasAppts && (
                <div className="appointment-pill-badge">
                  <span className="badge-count">{cell.appointments.length}</span>
                  <span className="badge-label">
                    {cell.appointments.length === 1 ? 'cita' : 'citas'}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Resumen o indicador si hay filtro activo */}
      {selectedDate && (
        <div className="calendar-filter-bar">
          <div className="filter-info">
            <span className="filter-dot">●</span>
            <span>
              Filtrando citas para el{' '}
              <strong>{selectedDate}</strong> (
              {(appointmentsByDate[selectedDate] || []).length} cita
              {(appointmentsByDate[selectedDate] || []).length === 1 ? '' : 's'}
              )
            </span>
          </div>
          <button
            type="button"
            className="btn-clear-filter"
            onClick={onClearDate}
          >
            ✕ Ver todas las citas
          </button>
        </div>
      )}
    </div>
  );
}
