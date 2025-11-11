-- Tabla para registrar el control de tiempo de los empleados
CREATE TABLE IF NOT EXISTS registro_tiempo (
    id_registro SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    id_empleado INT NOT NULL,
    hora_entrada TIME,
    hora_salida TIME,
    estado VARCHAR(20) NOT NULL DEFAULT 'En Progreso',
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_empleado) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_estado CHECK (estado IN ('En Progreso', 'Completo', 'Ausente'))
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_registro_tiempo_fecha ON registro_tiempo(fecha);
CREATE INDEX idx_registro_tiempo_empleado ON registro_tiempo(id_empleado);
CREATE INDEX idx_registro_tiempo_estado ON registro_tiempo(estado);

-- Comentarios en la tabla
COMMENT ON TABLE registro_tiempo IS 'Tabla para controlar las horas trabajadas por los empleados';
COMMENT ON COLUMN registro_tiempo.id_registro IS 'ID único del registro de tiempo';
COMMENT ON COLUMN registro_tiempo.fecha IS 'Fecha del registro';
COMMENT ON COLUMN registro_tiempo.id_empleado IS 'ID del empleado (referencia a usuario)';
COMMENT ON COLUMN registro_tiempo.hora_entrada IS 'Hora de entrada del empleado';
COMMENT ON COLUMN registro_tiempo.hora_salida IS 'Hora de salida del empleado';
COMMENT ON COLUMN registro_tiempo.estado IS 'Estado del registro: En Progreso, Completo, Ausente';
COMMENT ON COLUMN registro_tiempo.observaciones IS 'Observaciones adicionales del registro';
COMMENT ON COLUMN registro_tiempo.fecha_creacion IS 'Fecha de creación del registro';

-- Datos de ejemplo (opcional - puedes comentar esta sección si no quieres datos de prueba)
-- Asegúrate de tener usuarios con estos IDs o ajusta según tu base de datos
/*
INSERT INTO registro_tiempo (fecha, id_empleado, hora_entrada, hora_salida, estado, observaciones) VALUES
    ('2024-02-16', 1, '08:00', NULL, 'En Progreso', NULL),
    ('2024-02-15', 2, '08:30', '17:30', 'Completo', NULL),
    ('2024-02-14', 2, '08:00', '17:00', 'Completo', NULL),
    ('2024-02-14', 3, '09:00', '18:00', 'Completo', NULL);
*/


