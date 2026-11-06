#!/usr/bin/env node
/**
 * Crea o actualiza un usuario con la contraseña correctamente encriptada (bcrypt).
 * Úsalo para el ADMIN y los PROFESIONALES iniciales (el registro público solo crea CLIENTES).
 *
 *   npm run create-user -- correo@ejemplo.com ADMIN
 *   npm run create-user -- correo@ejemplo.com PROFESIONAL "Nombre Apellido" "Especialidad"
 *   npm run create-user -- correo@ejemplo.com CLIENTE "Nombre Apellido"
 *
 * La contraseña se pide por consola (no queda en el historial) o se toma de la variable
 * de entorno NEW_PASSWORD si la defines.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

const ROLES = ['ADMIN', 'PROFESIONAL', 'CLIENTE'];

function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    if (!stdin.isTTY) { // entrada redirigida: leer una línea sin ocultar
      let data = '';
      stdin.setEncoding('utf8');
      stdin.on('data', (c) => { data += c; if (data.includes('\n')) { stdin.pause(); resolve(data.split('\n')[0].trim()); } });
      return;
    }
    let value = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (ch) => {
      if (ch === '\r' || ch === '\n' || ch === '\u0004') {
        stdin.setRawMode(false); stdin.pause(); stdin.removeListener('data', onData);
        process.stdout.write('\n'); resolve(value);
      } else if (ch === '\u0003') { process.exit(130); }
      else if (ch === '\u007f' || ch === '\b') { value = value.slice(0, -1); }
      else { value += ch; }
    };
    stdin.on('data', onData);
  });
}

(async () => {
  const [emailArg, rolArg = 'CLIENTE', nombreArg, especialidadArg] = process.argv.slice(2);
  const email = String(emailArg || '').trim().toLowerCase();
  const rol = String(rolArg).toUpperCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !ROLES.includes(rol)) {
    console.error('Uso: npm run create-user -- <correo> <ADMIN|PROFESIONAL|CLIENTE> ["Nombre"] ["Especialidad"]');
    process.exit(1);
  }

  const password = process.env.NEW_PASSWORD || await askHidden('Contraseña (mínimo 8 caracteres): ');
  if (password.length < 8 || password.length > 72) {
    console.error('La contraseña debe tener entre 8 y 72 caracteres.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [found] = await conn.query('SELECT id FROM Usuarios WHERE email = ?', [email]);
    let userId;
    if (found.length) {
      userId = found[0].id;
      await conn.query('UPDATE Usuarios SET password = ?, rol = ? WHERE id = ?', [hash, rol, userId]);
      console.log(`Usuario existente actualizado (id ${userId}).`);
    } else {
      const [r] = await conn.query('INSERT INTO Usuarios (email, password, rol) VALUES (?, ?, ?)', [email, hash, rol]);
      userId = r.insertId;
      console.log(`Usuario creado (id ${userId}).`);
    }

    const nombre = nombreArg || email.split('@')[0];
    if (rol === 'PROFESIONAL') {
      // Vincula el perfil profesional con la cuenta (Profesionales.usuario_id)
      const [byUser] = await conn.query('SELECT id FROM Profesionales WHERE usuario_id = ?', [userId]);
      if (!byUser.length) {
        const [byName] = await conn.query('SELECT id FROM Profesionales WHERE usuario_id IS NULL AND nombre_completo = ? LIMIT 1', [nombre]);
        if (byName.length) {
          await conn.query('UPDATE Profesionales SET usuario_id = ? WHERE id = ?', [userId, byName[0].id]);
          console.log(`Perfil profesional existente vinculado (id ${byName[0].id}).`);
        } else {
          await conn.query('INSERT INTO Profesionales (usuario_id, nombre_completo, especialidad) VALUES (?, ?, ?)', [userId, nombre, especialidadArg || null]);
          console.log('Perfil profesional creado.');
        }
      }
    } else if (rol === 'CLIENTE') {
      const [cl] = await conn.query('SELECT id FROM Clientes WHERE usuario_id = ?', [userId]);
      if (!cl.length) {
        await conn.query('INSERT INTO Clientes (usuario_id, nombre_completo) VALUES (?, ?)', [userId, nombre]);
        console.log('Perfil de cliente creado.');
      }
    }

    await conn.commit();
    console.log(`Listo: ${email} (${rol}) ya puede iniciar sesión.`);
  } catch (e) {
    await conn.rollback();
    console.error('No se pudo completar la operación:', e.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
})();
