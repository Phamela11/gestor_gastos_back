-- Script para crear las tablas de ventas en PostgreSQL

-- Tabla: detalle_venta
-- Esta tabla almacena el detalle de cada venta
CREATE TABLE IF NOT EXISTS detalle_venta (
    id_detalle_venta SERIAL PRIMARY KEY,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: venta
-- Esta tabla almacena la información principal de cada venta
CREATE TABLE IF NOT EXISTS venta (
    id_venta SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    id_detalle_venta INTEGER NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    total DECIMAL(10, 2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'Pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_venta_cliente FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente) ON DELETE RESTRICT,
    CONSTRAINT fk_venta_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_venta_detalle FOREIGN KEY (id_detalle_venta) REFERENCES detalle_venta(id_detalle_venta) ON DELETE CASCADE
);

-- Tabla: detalle_venta_producto
-- Esta tabla almacena los productos asociados a cada detalle de venta
CREATE TABLE IF NOT EXISTS detalle_venta_producto (
    id_detalle_venta_producto SERIAL PRIMARY KEY,
    id_detalle_venta INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dvp_detalle FOREIGN KEY (id_detalle_venta) REFERENCES detalle_venta(id_detalle_venta) ON DELETE CASCADE,
    CONSTRAINT fk_dvp_producto FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE RESTRICT,
    CONSTRAINT check_cantidad_positiva CHECK (cantidad > 0),
    CONSTRAINT check_precio_positivo CHECK (precio_unitario >= 0),
    CONSTRAINT check_subtotal_positivo CHECK (subtotal >= 0)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_venta_cliente ON venta(id_cliente);
CREATE INDEX IF NOT EXISTS idx_venta_usuario ON venta(id_usuario);
CREATE INDEX IF NOT EXISTS idx_venta_fecha ON venta(fecha);
CREATE INDEX IF NOT EXISTS idx_venta_estado ON venta(estado);
CREATE INDEX IF NOT EXISTS idx_dvp_detalle ON detalle_venta_producto(id_detalle_venta);
CREATE INDEX IF NOT EXISTS idx_dvp_producto ON detalle_venta_producto(id_producto);

-- Comentarios en las tablas
COMMENT ON TABLE detalle_venta IS 'Tabla que almacena los detalles generales de cada venta';
COMMENT ON TABLE venta IS 'Tabla principal que almacena la información de las ventas realizadas';
COMMENT ON TABLE detalle_venta_producto IS 'Tabla de relación que almacena los productos asociados a cada detalle de venta';

