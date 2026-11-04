-- Ejecuta esta migración UNA SOLA VEZ sobre la base de datos que ya usa la aplicación.
-- Selecciona primero la base correcta en Aiven (por ejemplo: USE imperio_cejas_db;).

-- Vincula cada perfil profesional con su usuario de inicio de sesión.
ALTER TABLE Profesionales
  ADD COLUMN usuario_id INT NULL AFTER id;

CREATE UNIQUE INDEX uq_profesionales_usuario_id
  ON Profesionales (usuario_id);

ALTER TABLE Profesionales
  ADD CONSTRAINT fk_profesionales_usuario
  FOREIGN KEY (usuario_id) REFERENCES Usuarios(id)
  ON DELETE SET NULL;

-- Horarios de trabajo: dia_semana usa 1=lunes, 2=martes, ... 7=domingo.
CREATE TABLE IF NOT EXISTS Horarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profesional_id INT NOT NULL,
  dia_semana TINYINT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_horarios_dia CHECK (dia_semana BETWEEN 1 AND 7),
  CONSTRAINT chk_horarios_rango CHECK (hora_inicio < hora_fin),
  CONSTRAINT fk_horarios_profesional
    FOREIGN KEY (profesional_id) REFERENCES Profesionales(id)
    ON DELETE CASCADE,
  INDEX idx_horarios_profesional_dia (profesional_id, dia_semana, activo)
);

-- Índice para acelerar la consulta de reservas por profesional y fecha.
CREATE INDEX idx_citas_profesional_fecha_estado
  ON Citas (profesional_id, fecha, estado);
