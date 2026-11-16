import React, { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';

const emptyForm = { nombre_completo: '', email: '', password: '', especialidad: '' };

export default function AdminPanel({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyUser, setBusyUser] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.data || []);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la lista de usuarios.'));
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const updateField = event => setForm(prev => ({ ...prev, [event.target.name]: event.target.value }));

  const createProfessional = async event => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await api.post('/admin/professionals', form);
      setForm(emptyForm);
      setMessage('El profesional y su cuenta de acceso fueron creados.');
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear el profesional.'));
    } finally {
      setLoading(false);
    }
  };

  const removeUser = async user => {
    const confirmed = window.confirm(
      `¿Eliminar a ${user.nombre || user.email}?\n\nTambién se eliminarán sus citas y reseñas asociadas. Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;
    setBusyUser(user.id);
    setError('');
    setMessage('');
    try {
      await api.delete(`/admin/users/${user.id}`);
      setMessage('Usuario eliminado correctamente.');
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo eliminar el usuario.'));
    } finally {
      setBusyUser(null);
    }
  };

  return (
    <section className="admin-layout">
      <div className="panel admin-create">
        <div className="section-heading">
          <p className="eyebrow">GESTIÓN DEL EQUIPO</p>
          <h2>Crear profesional</h2>
          <p className="muted">Se creará una cuenta con rol PROFESIONAL y su perfil asociado.</p>
        </div>
        {message && <p className="alert success">{message}</p>}
        {error && <p className="alert error">{error}</p>}
        <form className="form-stack" onSubmit={createProfessional}>
          <label>Nombre completo
            <input name="nombre_completo" value={form.nombre_completo} onChange={updateField} minLength={2} maxLength={150} required />
          </label>
          <label>Correo electrónico
            <input name="email" type="email" value={form.email} onChange={updateField} maxLength={100} required />
          </label>
          <label>Contraseña inicial
            <input name="password" type="password" value={form.password} onChange={updateField} minLength={8} maxLength={72} required />
          </label>
          <label>Especialidad
            <input name="especialidad" value={form.especialidad} onChange={updateField} maxLength={100} placeholder="Ej. Micropigmentación de cejas" />
          </label>
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Creando…' : 'Crear profesional'}</button>
        </form>
      </div>

      <div className="panel admin-users">
        <div className="section-heading">
          <p className="eyebrow">CUENTAS REGISTRADAS</p>
          <h2>Usuarios del sistema</h2>
          <p className="muted">Administra las cuentas de clientes y profesionales.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Acción</th></tr></thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.nombre}</td>
                  <td>{user.email}</td>
                  <td><span className={`status status-${String(user.rol).toLowerCase()}`}>{user.rol}</span></td>
                  <td>
                    {Number(user.id) === Number(currentUser?.id) ? <span className="muted">Tu cuenta</span> : (
                      <button type="button" className="btn-small reject" disabled={busyUser === user.id} onClick={() => removeUser(user)}>
                        {busyUser === user.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan="4" className="empty-cell">No hay usuarios para mostrar.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
