import React from 'react';

export default function Navbar({ user, onLogout }) {
  return (
    <header className="topbar">
      <a className="brand" href="#inicio" aria-label="Imperio de las Cejas, inicio">
        <span className="brand-logo-wrap"><img src="/logo-imperio-cejas.png" alt="" /></span>
        <span className="brand-copy"><strong>IMPERIO</strong><small>DE LAS CEJAS</small></span>
      </a>
      <div className="topbar-user">
        <div className="user-greeting"><strong>{user?.nombre || user?.email}</strong><small>{user?.rol || ''}</small></div>
        {user && <button className="btn-outline" onClick={onLogout}>Cerrar sesión</button>}
      </div>
    </header>
  );
}
