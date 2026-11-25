import React, { useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import PasswordInput from './PasswordInput';

const MIN_PASSWORD = 8;

export default function PasswordRecovery({ onGoLogin, onSuccessLogin }) {
  const [step, setStep] = useState(1); // 1: comprobar correo, 2: ingresar código y nueva contraseña, 3: éxito
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Paso 1: Comprobar el correo y solicitar código
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase()
      });

      setSuccessMsg(response.data.message || 'Correo comprobado con éxito.');
      if (response.data.devCode) {
        setDevCode(response.data.devCode);
      }
      setStep(2);
    } catch (err) {
      setError(getErrorMessage(err, 'No fue posible comprobar el correo electrónico.'));
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Restablecer contraseña con código y nueva contraseña
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < MIN_PASSWORD) {
      return setError(`La nueva contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
    }

    if (newPassword !== confirmPassword) {
      return setError('Las contraseñas no coinciden.');
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword
      });

      setSuccessMsg(response.data.message || 'Contraseña restablecida exitosamente.');
      setStep(3);
    } catch (err) {
      setError(getErrorMessage(err, 'No fue posible restablecer la contraseña.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-card">
      <p className="eyebrow">IMPERIO DE LAS CEJAS</p>
      <h2>Recuperar contraseña</h2>
      <p className="muted">
        {step === 1 && 'Comprobaremos tu correo electrónico registrado para enviarte un código de seguridad.'}
        {step === 2 && 'Ingresa el código enviado a tu correo y define tu nueva contraseña.'}
        {step === 3 && '¡Tu contraseña ha sido actualizada con éxito!'}
      </p>

      {error && <p className="alert error" role="alert">{error}</p>}
      {successMsg && step !== 3 && <p className="alert success">{successMsg}</p>}

      {/* Si estamos en desarrollo o sin SMTP real configurado, mostramos el código para facilitar la prueba */}
      {devCode && step === 2 && (
        <div className="dev-code-banner">
          <small>Código de verificación (Modo de prueba):</small>
          <strong>{devCode}</strong>
          <button
            type="button"
            className="link-button"
            onClick={() => setCode(devCode)}
          >
            Autorrellenar código
          </button>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleVerifyEmail} className="form-stack">
          <label>
            Correo electrónico registrado
            <input
              type="email"
              autoComplete="email"
              placeholder="tu-correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Comprobando correo…' : 'Comprobar correo y enviar código'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleResetPassword} className="form-stack">
          <label>
            Código de verificación (6 dígitos)
            <input
              type="text"
              placeholder="Ej: 123456"
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </label>

          <label>
            Nueva contraseña
            <small className="field-hint">Haz clic en el asterisco <strong>*</strong> para ver u ocultar la contraseña.</small>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
              minLength={MIN_PASSWORD}
              maxLength={72}
              required
            />
          </label>

          <label>
            Confirmar nueva contraseña
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
              required
            />
          </label>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Actualizando contraseña…' : 'Restablecer contraseña'}
          </button>

          <button
            type="button"
            className="btn-outline full-button"
            onClick={() => { setStep(1); setError(''); }}
          >
            Cambiar de correo
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="form-stack text-center">
          <div className="success-icon-wrap">✓</div>
          <p className="success-copy">
            Tu contraseña ha sido restablecida correctamente. Ya puedes ingresar con tus nuevas credenciales.
          </p>
          <button className="btn-primary" type="button" onClick={onGoLogin}>
            Iniciar sesión ahora
          </button>
        </div>
      )}

      <p className="auth-switch">
        ¿Recordaste tu contraseña?{' '}
        <button type="button" className="link-button" onClick={onGoLogin}>
          Volver a iniciar sesión
        </button>
      </p>
    </section>
  );
}
