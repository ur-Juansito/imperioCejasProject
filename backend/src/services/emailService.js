const nodemailer = require('nodemailer');

/**
 * Servicio de envío de correos electrónicos para Imperio de las Cejas.
 * Soporta configuración SMTP estándar (Gmail, Outlook, SendGrid, Mailgun, etc.)
 * y fallback automático a registro en consola / cuenta de prueba si no se configuran credenciales SMTP.
 */

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
      auth: { user, pass },
      tls: {
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false'
      }
    });
    console.log(`[EmailService] Configurado transporte SMTP: ${host}`);
  } else {
    // Transporte simulado para desarrollo o cuando aún no se configura SMTP en producción
    transporter = {
      sendMail: async (options) => {
        console.log('\n======================================================');
        console.log('[EmailService - SIMULACIÓN / LOG]');
        console.log(`Para: ${options.to}`);
        console.log(`Asunto: ${options.subject}`);
        console.log(`Fecha: ${new Date().toISOString()}`);
        console.log('--- Contenido del mensaje ---');
        console.log(options.text || options.html);
        console.log('======================================================\n');
        return { messageId: `mock-${Date.now()}`, simulated: true };
      }
    };
    console.log('[EmailService] SMTP no configurado completamente. Los correos se registrarán en consola.');
  }

  return transporter;
};

/**
 * Notifica al administrador cuando uno o varios trabajadores inician sesión.
 */
const sendWorkerLoginNotification = async ({
  adminEmails = [],
  workerName,
  workerEmail,
  workerRole,
  loginTime = new Date(),
  ipAddress = 'No disponible',
  userAgent = 'No disponible'
}) => {
  try {
    const defaultAdmin = process.env.ADMIN_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL;
    const recipients = Array.from(new Set([...adminEmails, defaultAdmin].filter(Boolean)));

    if (!recipients.length) {
      console.warn('[EmailService] No se encontraron correos de administradores para notificar.');
      return false;
    }

    const formattedDate = new Intl.DateTimeFormat('es-CO', {
      timeZone: process.env.APP_TIMEZONE || 'America/Bogota',
      dateStyle: 'full',
      timeStyle: 'medium'
    }).format(loginTime);

    const subject = `[Imperio de las Cejas] Alerta: Inicio de sesión de trabajador (${workerName || workerEmail})`;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #0b0b0b; color: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #141414; border: 1px solid #d4af37; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #2b220e, #141414); padding: 24px; text-align: center; border-bottom: 1px solid rgba(212,175,55,0.4); }
          .header h1 { color: #f4e6b1; font-size: 20px; margin: 0; letter-spacing: 2px; }
          .header small { color: #d4af37; font-size: 11px; letter-spacing: 3px; }
          .body { padding: 28px; line-height: 1.6; }
          .card { background: #1c1b18; border: 1px solid rgba(212,175,55,0.25); border-radius: 8px; padding: 18px; margin: 20px 0; }
          .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #2a2a2a; }
          .item:last-child { border-bottom: none; }
          .label { color: #a9a294; font-weight: bold; }
          .value { color: #f7f4ec; text-align: right; }
          .footer { padding: 18px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #222; }
          .badge { background: #d4af37; color: #111; font-weight: bold; padding: 3px 8px; border-radius: 4px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <small>IMPERIO DE LAS CEJAS</small>
            <h1>NOTIFICACIÓN DE SEGURIDAD</h1>
          </div>
          <div class="body">
            <p>Estimado Administrador,</p>
            <p>Le informamos que un trabajador del estudio ha iniciado sesión en la plataforma:</p>
            <div class="card">
              <div class="item">
                <span class="label">Trabajador:</span>
                <span class="value"><strong>${workerName || 'No especificado'}</strong></span>
              </div>
              <div class="item">
                <span class="label">Correo:</span>
                <span class="value">${workerEmail}</span>
              </div>
              <div class="item">
                <span class="label">Rol:</span>
                <span class="value"><span class="badge">${workerRole || 'PROFESIONAL'}</span></span>
              </div>
              <div class="item">
                <span class="label">Fecha y Hora:</span>
                <span class="value">${formattedDate}</span>
              </div>
              <div class="item">
                <span class="label">Dirección IP:</span>
                <span class="value">${ipAddress}</span>
              </div>
              <div class="item">
                <span class="label">Dispositivo:</span>
                <span class="value" style="font-size: 12px; max-width: 280px; word-break: break-all;">${userAgent}</span>
              </div>
            </div>
            <p style="color: #bbb; font-size: 13px;">Si este acceso no fue autorizado, por favor ingrese a su panel de administración y revise los accesos o cambie las credenciales del usuario.</p>
          </div>
          <div class="footer">
            Imperio de las Cejas · Sistema Automatizado de Seguridad
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
[IMPERIO DE LAS CEJAS] NOTIFICACIÓN DE SEGURIDAD
Inicio de sesión de trabajador:

- Trabajador: ${workerName || 'No especificado'}
- Correo: ${workerEmail}
- Rol: ${workerRole || 'PROFESIONAL'}
- Fecha y Hora: ${formattedDate}
- Dirección IP: ${ipAddress}
- Dispositivo: ${userAgent}

Si este acceso no fue autorizado, por favor ingrese a su panel de administración para tomar las medidas necesarias.
    `.trim();

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Imperio de las Cejas" <no-reply@imperiodecejas.com>',
      to: recipients.join(', '),
      subject,
      text,
      html
    };

    const client = getTransporter();
    const info = await client.sendMail(mailOptions);
    console.log(`[EmailService] Notificación de inicio de sesión enviada a ${recipients.join(', ')} (ID: ${info.messageId || 'ok'})`);
    return true;
  } catch (error) {
    console.error('[EmailService] Error enviando correo de inicio de sesión:', error.message);
    return false;
  }
};

/**
 * Envía el código de verificación para la recuperación de contraseña.
 */
const sendPasswordRecoveryCode = async ({ email, code, userName }) => {
  try {
    const subject = `[Imperio de las Cejas] Código para recuperar tu contraseña: ${code}`;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #0b0b0b; color: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #141414; border: 1px solid #d4af37; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #2b220e, #141414); padding: 24px; text-align: center; border-bottom: 1px solid rgba(212,175,55,0.4); }
          .header h1 { color: #f4e6b1; font-size: 20px; margin: 0; letter-spacing: 2px; }
          .header small { color: #d4af37; font-size: 11px; letter-spacing: 3px; }
          .body { padding: 28px; line-height: 1.6; text-align: center; }
          .code-box { display: inline-block; background: #1f1b13; border: 2px dashed #d4af37; border-radius: 10px; padding: 16px 36px; margin: 24px 0; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #f4e6b1; }
          .footer { padding: 18px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #222; }
          .alert-note { color: #bbb; font-size: 13px; margin-top: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <small>IMPERIO DE LAS CEJAS</small>
            <h1>RECUPERACIÓN DE CONTRASEÑA</h1>
          </div>
          <div class="body">
            <p>Hola <strong>${userName || 'Cliente'}</strong>,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta asociada a este correo electrónico.</p>
            <p>Usa el siguiente código de verificación en la aplicación:</p>
            <div class="code-box">${code}</div>
            <p class="alert-note">Este código es de un solo uso y vencerá en <strong>15 minutos</strong>.<br>Si tú no hiciste esta solicitud, puedes ignorar este correo; tu contraseña actual continuará siendo segura.</p>
          </div>
          <div class="footer">
            Imperio de las Cejas · Tu belleza, nuestra dedicación.
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
[IMPERIO DE LAS CEJAS] RECUPERACIÓN DE CONTRASEÑA

Hola ${userName || 'Cliente'},

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
Tu código de verificación es: ${code}

Este código expira en 15 minutos. Si no solicitaste este cambio, por favor ignora este mensaje.
    `.trim();

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Imperio de las Cejas" <no-reply@imperiodecejas.com>',
      to: email,
      subject,
      text,
      html
    };

    const client = getTransporter();
    const info = await client.sendMail(mailOptions);
    console.log(`[EmailService] Código de recuperación enviado a ${email} (ID: ${info.messageId || 'ok'})`);
    return true;
  } catch (error) {
    console.error('[EmailService] Error enviando código de recuperación:', error.message);
    return false;
  }
};

module.exports = {
  sendWorkerLoginNotification,
  sendPasswordRecoveryCode
};
