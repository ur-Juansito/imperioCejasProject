import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';

const money = value => Number(value || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const visuals = [
  'https://images.unsplash.com/photo-1583001809873-a128495da465?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1000&q=85'
];
export default function PublicHome({ onBook, onLogin, onRegister }) {
  const [services, setServices] = useState([]);
  const [works, setWorks] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api.get('/services'), api.get('/gallery')])
      .then(([s, g]) => { setServices(s.data.data || []); setWorks(g.data.data || []); })
      .catch(err => setError(getErrorMessage(err, 'No se pudo cargar toda la información pública.')));
  }, []);
  return <div className="public-site">
    <header className="public-nav">
      <a className="brand" href="#home"><span className="brand-logo-wrap"><img src="/logo-imperio-cejas.png" alt="" /></span><span className="brand-copy"><strong>IMPERIO</strong><small>DE LAS CEJAS</small></span></a>
      <nav><a href="#servicios-publicos">Servicios</a><a href="#galeria">Trabajos</a><a href="#contacto">Contacto</a></nav>
      <div className="public-actions"><button className="btn-outline" onClick={onLogin}>Iniciar sesión</button><button className="btn-primary" onClick={onRegister}>Registrarse</button></div>
    </header>
    <main>
      <section className="hero-public" id="home">
        <div className="hero-copy"><p className="eyebrow">ARTE · BELLEZA · PRECISIÓN</p><h1>Tu belleza,<br/><em>en su mejor expresión.</em></h1><p>Realzamos tu esencia con tratamientos especializados y atención personalizada. Descubre una experiencia de belleza pensada para ti.</p><div className="hero-buttons"><button className="btn-primary" onClick={() => onBook('')}>Agendar una cita</button><a className="text-link" href="#servicios-publicos">Explorar tratamientos ↘</a></div><div className="hero-note"><span>✦</span> Atención profesional · Resultados personalizados</div></div>
        <div className="hero-art"><div className="hero-image-main"><img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=90" alt="Experiencia de belleza" /></div><div className="hero-stamp">IMPERIO<br/><small>DE LAS CEJAS</small></div><div className="hero-caption">Belleza que habla<br/>por sí misma.</div></div>
      </section>
      <section className="public-intro"><p className="eyebrow">NUESTRA ESENCIA</p><h2>Detalles que transforman,<br/><span className="gold-gradient-text">confianza que permanece.</span></h2><p>Un espacio dedicado al cuidado estético, donde cada tratamiento se adapta a tus facciones, estilo y personalidad.</p></section>
      <section className="public-section" id="servicios-publicos"><div className="section-heading centered"><p className="eyebrow">DESCUBRE LO QUE HACEMOS</p><h2 className="gold-gradient-text">Nuestros servicios</h2><p className="muted">Conoce nuestros tratamientos y encuentra el ideal para ti.</p></div>
        {error && <p className="alert error">{error}</p>}
        <div className="public-service-grid">{services.map((s,i)=><article className="public-service-card" key={s.id}><div className="public-service-image"><img src={visuals[i%visuals.length]} alt={s.nombre}/><span>{String(s.duracion_minutos || 0)} MIN</span></div><div className="public-service-body"><h3>{s.nombre}</h3><p>{s.descripcion || 'Un tratamiento personalizado para realzar tu belleza.'}</p><div className="public-service-bottom"><strong>{money(s.precio)}</strong><button className="btn-primary" onClick={() => onBook(s.id)}>Agendar</button></div></div></article>)}</div>
        {!services.length && !error && <p className="empty-state">Cargando nuestros tratamientos…</p>}
      </section>
      <section className="public-gallery" id="galeria"><div className="section-heading centered"><p className="eyebrow">NUESTRO TRABAJO</p><h2>Resultados que inspiran</h2><p className="muted">Una selección de trabajos realizados en nuestro estudio.</p></div>
        {works.length ? <div className="gallery-grid">{works.slice(0,8).map(w=><figure key={w.id}><img src={w.url_imagen} alt={w.descripcion || 'Trabajo realizado'} loading="lazy"/>{w.descripcion && <figcaption>{w.descripcion}</figcaption>}</figure>)}</div> : <div className="gallery-empty"><span>✦</span><p>Muy pronto compartiremos aquí nuestros trabajos más recientes.</p></div>}
      </section>
      <section className="public-cta" id="contacto"><p className="eyebrow">ES MOMENTO DE TI</p><h2>¿Lista para reservar<br/>tu próxima experiencia?</h2><p>Elige tu tratamiento y solicita tu cita en pocos pasos.</p><button className="btn-primary" onClick={() => onBook('')}>Quiero agendar</button></section>
    </main>
    <footer className="public-footer"><img src="/logo-imperio-cejas.png" alt="Imperio de las Cejas"/><span>IMPERIO DE LAS CEJAS · Belleza y dedicación.</span><div><button onClick={onLogin}>Iniciar sesión</button><button onClick={onRegister}>Registrarse</button></div></footer>
  </div>;
}
