// src/api.js — URL centralizada, todos los módulos usan este archivo

const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:4000/api'
  : 'https://api-gestion-cajas.onrender.com/api';

export default BASE_URL;

// Función auxiliar para headers con token
const obtenerHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// ── AUTH ──────────────────────────────────────────────────────────
export const loginUser = (data) =>
  fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json());

export const registerUser = (data) =>
  fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: obtenerHeaders(),
    body: JSON.stringify(data)
  }).then(res => res.json());

// ── USUARIOS ──────────────────────────────────────────────────────
export const getUsuarios = () =>
  fetch(`${BASE_URL}/usuarios`, { headers: obtenerHeaders() }).then(res => res.json());

export const getUsuarioById = (id) =>
  fetch(`${BASE_URL}/usuarios/${id}`, { headers: obtenerHeaders() }).then(res => res.json());

export const createUsuario = (data) =>
  fetch(`${BASE_URL}/usuarios`, {
    method: 'POST',
    headers: obtenerHeaders(),
    body: JSON.stringify(data)
  }).then(res => res.json());

export const updateUsuario = (id, data) =>
  fetch(`${BASE_URL}/usuarios/${id}`, {
    method: 'PUT',
    headers: obtenerHeaders(),
    body: JSON.stringify(data)
  }).then(res => res.json());

export const deleteUsuario = (id) =>
  fetch(`${BASE_URL}/usuarios/${id}`, {
    method: 'DELETE',
    headers: obtenerHeaders()
  }).then(res => res.json());

// ── INVENTARIO ────────────────────────────────────────────────────
export const getInventario = (params = '') =>
  fetch(`${BASE_URL}/inventario${params ? '?' + params : ''}`, { headers: obtenerHeaders() }).then(res => res.json());

export const getInventarioPorGuia = (codigo) =>
  fetch(`${BASE_URL}/inventario/guia/${encodeURIComponent(codigo)}`, { headers: obtenerHeaders() }).then(res => res.json());

export const importarInventario = (guias) =>
  fetch(`${BASE_URL}/inventario/importar`, {
    method: 'POST',
    headers: obtenerHeaders(),
    body: JSON.stringify(guias)
  }).then(res => res.json());

export const updateInventario = (id, data) =>
  fetch(`${BASE_URL}/inventario/${id}`, {
    method: 'PUT',
    headers: obtenerHeaders(),
    body: JSON.stringify(data)
  }).then(res => res.json());

export const deleteInventario = (id) =>
  fetch(`${BASE_URL}/inventario/${id}`, {
    method: 'DELETE',
    headers: obtenerHeaders()
  }).then(res => res.json());

// ── ENTREGAS ──────────────────────────────────────────────────────
export const getEntregas = (params = '') =>
  fetch(`${BASE_URL}/entregas${params ? '?' + params : ''}`, { headers: obtenerHeaders() }).then(res => res.json());

export const createEntrega = (data) =>
  fetch(`${BASE_URL}/entregas`, {
    method: 'POST',
    headers: obtenerHeaders(),
    body: JSON.stringify(data)
  }).then(res => res.json());

// ── ENVÍOS ────────────────────────────────────────────────────────
export const getEnvios = (params = '') =>
  fetch(`${BASE_URL}/envios${params ? '?' + params : ''}`, { headers: obtenerHeaders() }).then(res => res.json());

export const createEnvio = (data) =>
  fetch(`${BASE_URL}/envios`, {
    method: 'POST',
    headers: obtenerHeaders(),
    body: JSON.stringify(data)
  }).then(res => res.json());

// ── GASTOS ────────────────────────────────────────────────────────
export const getGastos = (params = '') =>
  fetch(`${BASE_URL}/gastos${params ? '?' + params : ''}`, { headers: obtenerHeaders() }).then(res => res.json());

export const createGasto = (data) =>
  fetch(`${BASE_URL}/gastos`, {
    method: 'POST',
    headers: obtenerHeaders(),
    body: JSON.stringify(data)
  }).then(res => res.json());

export const deleteGasto = (id) =>
  fetch(`${BASE_URL}/gastos/${id}`, {
    method: 'DELETE',
    headers: obtenerHeaders()
  }).then(res => res.json());

// ── INFORMES ──────────────────────────────────────────────────────
export const getCierreDia = (fecha) =>
  fetch(`${BASE_URL}/informes/cierre-dia?fecha=${fecha}`, { headers: obtenerHeaders() }).then(res => res.json());

export const cerrarCaja = (data) =>
  fetch(`${BASE_URL}/informes/cierre-dia`, {
    method: 'POST',
    headers: obtenerHeaders(),
    body: JSON.stringify(data)
  }).then(res => res.json());

// ── MOVIMIENTOS ───────────────────────────────────────────────────
export const getMovimientos = () =>
  fetch(`${BASE_URL}/movimientos`, { headers: obtenerHeaders() }).then(res => res.json());

export const getBalanceCaja = () =>
  fetch(`${BASE_URL}/movimientos/balance`, { headers: obtenerHeaders() }).then(res => res.json());