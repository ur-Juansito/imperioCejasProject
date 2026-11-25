import React, { useState } from 'react';

/**
 * Componente de entrada de contraseña con botón integrado de alternancia (* / Ver contraseña).
 * Al hacer clic en el '*', alterna entre ocultar y mostrar la contraseña en texto claro.
 */
export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = 'Tu contraseña',
  autoComplete,
  required = false,
  minLength,
  maxLength,
  disabled = false,
  className = ''
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`password-input-wrapper ${className}`}>
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        disabled={disabled}
      />
      <button
        type="button"
        className={`password-toggle-btn ${visible ? 'is-visible' : ''}`}
        onClick={() => setVisible((prev) => !prev)}
        title={visible ? 'Ocultar contraseña' : 'Hacer clic en * para mostrar contraseña'}
        aria-label={visible ? 'Ocultar contraseña' : 'Hacer clic en el asterisco para ver contraseña oculta'}
      >
        <span className="asterisk-symbol" aria-hidden="true">*</span>
        <span className="toggle-text">{visible ? 'Ocultar' : 'Ver'}</span>
      </button>
    </div>
  );
}
