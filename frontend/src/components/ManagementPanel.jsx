import React, { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
const days = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'];
const emptyService = { nombre:'', descripcion:'', precio:'', duracion_minutos:'60' };
export default function ManagementPanel({ user }) {
  const admin = user?.rol === 'ADMIN';
  const [services,setServices]=useState([]), [professionals,setProfessionals]=useState([]);
  const [selected,setSelected]=useState(''), [schedule,setSchedule]=useState([]);
  const [service,setService]=useState(emptyService), [editing,setEditing]=useState(null);
  const [available,setAvailable]=useState(true), [status,setStatus]=useState('DISPONIBLE');
  const [error,setError]=useState(''), [message,setMessage]=useState(''), [busy,setBusy]=useState(false);
  const load = useCallback(async()=>{
    try {
      const [s,p]=await Promise.all([api.get('/services'), api.get(admin?'/admin/professionals':'/professionals/me')]);
      setServices(s.data.data||[]); setProfessionals(admin?(p.data.data||[]):(p.data.data?[p.data.data]:[]));
      if(admin && !selected && (p.data.data||[]).length) setSelected(String(p.data.data[0].id));
      const own = admin ? (p.data.data||[]).find(x=>String(x.id)===String(selected)) : p.data.data;
      if(own){setSelected(String(own.id));setAvailable(Boolean(own.disponible));setStatus(own.estado_servicio||'DISPONIBLE');}
    } catch(e){setError(getErrorMessage(e,'No se pudo cargar la información.'));}
  },[admin,selected]);
  useEffect(()=>{load();},[load]);
  const loadSchedule=useCallback(async()=>{
    if(!selected)return;
    try {const r=await api.get(admin?`/professionals/${selected}/schedule`:'/professionals/me/schedule');setSchedule(r.data.data||[]);}
    catch(e){setError(getErrorMessage(e,'No se pudo cargar el horario.'));}
  },[admin,selected]);
  useEffect(()=>{loadSchedule();},[loadSchedule]);
  const saveService=async e=>{
    e.preventDefault();setBusy(true);setError('');setMessage('');
    try{
      const payload={...service,precio:Number(service.precio),duracion_minutos:Number(service.duracion_minutos)};
      if(editing) await api.patch(`/services/${editing}`,payload); else await api.post('/services',payload);
      setService(emptyService);setEditing(null);setMessage('Servicio guardado correctamente.');await load();
    }catch(e){setError(getErrorMessage(e,'No se pudo guardar el servicio.'));}finally{setBusy(false);}
  };
  const editService=s=>{setEditing(s.id);setService({nombre:s.nombre,descripcion:s.descripcion||'',precio:String(s.precio),duracion_minutos:String(s.duracion_minutos)});};
  const toggleService=async s=>{try{await api.patch(`/services/${s.id}`,{activo:!s.activo});await load();}catch(e){setError(getErrorMessage(e));}};
  const updateDay=(day,field,value)=>setSchedule(prev=>{const found=prev.find(x=>x.dia_semana===day);const base=found||{dia_semana:day,hora_inicio:'09:00',hora_fin:'17:00',activo:false};return [...prev.filter(x=>x.dia_semana!==day),{...base,[field]:value}].sort((a,b)=>days.indexOf(a.dia_semana)-days.indexOf(b.dia_semana));});
  const saveSchedule=async()=>{setBusy(true);setError('');try{await api.put(admin?`/professionals/${selected}/schedule`:'/professionals/me/schedule',{horarios:schedule});setMessage('Horario actualizado.');await loadSchedule();}catch(e){setError(getErrorMessage(e,'No se pudo guardar el horario.'));}finally{setBusy(false);}};
  const saveAvailability=async()=>{try{await api.patch(admin?`/admin/professionals/${selected}/availability`:'/professionals/me/availability',{disponible:available,estado_servicio:status});setMessage('Disponibilidad actualizada.');await load();}catch(e){setError(getErrorMessage(e));}};
  return <section className="management-grid">
    <div className="panel"><div className="section-heading"><p className="eyebrow">CATÁLOGO</p><h2>{editing?'Editar servicio':'Registrar servicio'}</h2><p className="muted">Los servicios activos se mostrarán en la página pública.</p></div>
      <form className="form-stack" onSubmit={saveService}><label>Nombre<input required maxLength="100" value={service.nombre} onChange={e=>setService({...service,nombre:e.target.value})}/></label><label>Descripción<input value={service.descripcion} onChange={e=>setService({...service,descripcion:e.target.value})}/></label><div className="two-fields"><label>Precio (COP)<input type="number" min="0" step="100" required value={service.precio} onChange={e=>setService({...service,precio:e.target.value})}/></label><label>Duración (minutos)<input type="number" min="1" max="1440" required value={service.duracion_minutos} onChange={e=>setService({...service,duracion_minutos:e.target.value})}/></label></div><button className="btn-primary" disabled={busy}>{editing?'Guardar cambios':'Crear servicio'}</button>{editing&&<button type="button" className="btn-outline" onClick={()=>{setEditing(null);setService(emptyService);}}>Cancelar edición</button>}</form>
      <div className="management-list">{services.map(s=><div className="management-row" key={s.id}><div><strong>{s.nombre}</strong><small>{Number(s.precio).toLocaleString('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0})} · {s.duracion_minutos} min</small></div><div className="actions"><button className="btn-small neutral" onClick={()=>editService(s)}>Editar</button><button className={`btn-small ${s.activo?'approve':'reject'}`} onClick={()=>toggleService(s)}>{s.activo?'Visible':'Oculto'}</button></div></div>)}</div>
    </div>
    <div className="panel"><div className="section-heading"><p className="eyebrow">DISPONIBILIDAD Y AGENDA</p><h2>Horario profesional</h2><p className="muted">Activa los días y define las horas en que puedes recibir reservas.</p></div>
      {admin&&<label className="form-stack">Profesional<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Selecciona profesional</option>{professionals.map(p=><option key={p.id} value={p.id}>{p.nombre_completo}</option>)}</select></label>}
      {!admin&&professionals[0]&&<p className="muted">Profesional: {professionals[0].nombre_completo}</p>}
      <div className="availability-box"><label className="switch-line"><input type="checkbox" checked={available} onChange={e=>setAvailable(e.target.checked)}/> Disponible para recibir reservas</label><label>Estado del servicio<select value={status} onChange={e=>setStatus(e.target.value)}><option value="DISPONIBLE">Disponible</option><option value="ATENDIENDO">Atendiendo</option><option value="NO_DISPONIBLE">No disponible</option></select></label><button className="btn-outline" onClick={saveAvailability} disabled={!selected}>Guardar disponibilidad</button></div>
      <div className="schedule-list">{days.map(day=>{const h=schedule.find(x=>x.dia_semana===day)||{activo:false,hora_inicio:'09:00',hora_fin:'17:00'};return <div className="schedule-row" key={day}><label className="switch-line"><input type="checkbox" checked={Boolean(h.activo)} onChange={e=>updateDay(day,'activo',e.target.checked)}/>{day}</label><input aria-label={`Inicio ${day}`} type="time" value={String(h.hora_inicio||'09:00').slice(0,5)} onChange={e=>updateDay(day,'hora_inicio',e.target.value)}/><span> a </span><input aria-label={`Fin ${day}`} type="time" value={String(h.hora_fin||'17:00').slice(0,5)} onChange={e=>updateDay(day,'hora_fin',e.target.value)}/></div>})}</div>
      <button className="btn-primary full-button" onClick={saveSchedule} disabled={busy||!selected}>{busy?'Guardando…':'Guardar horario semanal'}</button>
    </div>
    {message&&<p className="alert success full-span">{message}</p>}{error&&<p className="alert error full-span">{error}</p>}
  </section>;
}
