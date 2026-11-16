import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';

const serviceVisuals = [
  {
    match: /ceja/i,
    label: 'CEJAS',
    quote: 'La armonía de tu rostro comienza con una mirada definida.',
    image: 'https://images.unsplash.com/photo-1583001809873-a128495da465?auto=format&fit=crop&w=900&q=85',
    fallback: 'cejas'
  },
  {
    match: /labio/i,
    label: 'LABIOS',
    quote: 'Un toque de color para resaltar tu belleza natural.',
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=85',
    fallback: 'labios'
  },
  {
    match: /ojos|linea|línea/i,
    label: 'OJOS',
    quote: 'Realza tu expresión con detalles delicados y elegantes.',
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=85',
    fallback: 'ojos'
  }
];

const visualFor = (service, index) =>
  serviceVisuals.find(item => item.match.test(service.nombre || '')) || serviceVisuals[index % serviceVisuals.length];

export default function ServicesSection({ onBook }) {
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/services')
      .then(response => setServices(response.data.data || []))
      .catch(err => setError(getErrorMessage(err, 'No se pudieron cargar los tratamientos.')));
  }, []);

  const featuredServices = services.filter(service => /ceja|labio|ojos|línea|linea/i.test(service.nombre || ''));

  return (
    <section className="services-section" id="servicios">
      <div className="section-heading centered">
        <p className="eyebrow">BELLEZA · PRECISIÓN · ARMONÍA</p>
        <h2 className="gold-gradient-text">Tratamientos exclusivos</h2>
        <p className="muted">Técnicas especializadas para realzar tu belleza natural.</p>
      </div>

      {error && <p className="alert error">{error}</p>}
      {!services.length && !error && <p className="empty-state">Cargando tratamientos…</p>}
      {!!services.length && !featuredServices.length && <p className="empty-state">No hay tratamientos destacados disponibles en este momento.</p>}

      <div className="service-grid">
        {featuredServices.map((service, index) => {
          const visual = visualFor(service, index);
          return (
            <article className="service-card" key={service.id}>
              <div className={`service-image service-image-${visual.fallback}`}>
                <img
                  src={visual.image}
                  alt={service.nombre}
                  loading="lazy"
                  onError={event => { event.currentTarget.style.display = 'none'; }}
                />
                <span className="service-tag">{visual.label}</span>
              </div>
              <div className="service-content">
                <p className="service-duration">{Number(service.duracion_minutos || 0)} MINUTOS</p>
                <h3>{service.nombre}</h3>
                <p className="service-description">{service.descripcion || 'Un tratamiento personalizado realizado por profesionales.'}</p>
                <blockquote>{visual.quote}</blockquote>
                <div className="service-footer">
                  <div>
                    <span className="muted price-caption">Desde</span>
                    <strong>{Number(service.precio).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</strong>
                  </div>
                  <button type="button" className="btn-primary btn-book" onClick={() => onBook?.(service.id)}>
                    Reservar
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
