CREATE DATABASE IF NOT EXISTS imperio_cejas_db;
USE imperio_cejas_db;

CREATE TABLE IF NOT EXISTS Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('ADMIN', 'PROFESIONAL', 'CLIENTE') DEFAULT 'CLIENTE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    duracion_minutos INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Profesionales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    especialidad VARCHAR(100),
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    servicio_id INT NOT NULL,
    profesional_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado ENUM('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA') DEFAULT 'PENDIENTE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES Servicios(id) ON DELETE CASCADE,
    FOREIGN KEY (profesional_id) REFERENCES Profesionales(id) ON DELETE CASCADE
);

INSERT INTO Servicios (nombre, descripcion, precio, duracion_minutos) VALUES
('Diseño y Depilación con Hilo', 'Diseño personalizado de cejas con técnica de hilo.', 45000.00, 30),
('Laminación de Cejas', 'Tratamiento semipermanente para fijar y alinear los vellos.', 110000.00, 45),
('Microblading', 'Técnica pelo a pelo para rellenar cejas.', 350000.00, 120),
('Tintura con Henna', 'Coloración natural para mayor definición.', 55000.00, 40);

INSERT INTO Profesionales (nombre_completo, especialidad, telefono) VALUES
('Valeria Gomez', 'Master en Microblading y Diseño', '3001234567'),
('Sofia Restrepo', 'Especialista en Laminación y Depilación', '3109876543');
