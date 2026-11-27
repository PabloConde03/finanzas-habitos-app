-- Esquema de la base de datos SQLite de Finanzas & Hábitos
-- El backend ejecuta este archivo al arrancar (IF NOT EXISTS evita errores si ya existen)

-- Movimientos de dinero: cada fila es un ingreso o un gasto
CREATE TABLE IF NOT EXISTS transacciones (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo        TEXT    NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
    cantidad    REAL    NOT NULL CHECK (cantidad > 0),
    categoria   TEXT    NOT NULL DEFAULT 'general',
    descripcion TEXT,
    fecha       TEXT    NOT NULL DEFAULT (date('now'))  -- formato ISO: AAAA-MM-DD
);

-- Hábitos que el usuario quiere mantener, con su racha de días seguidos
CREATE TABLE IF NOT EXISTS habitos (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre       TEXT    NOT NULL UNIQUE,
    descripcion  TEXT,
    racha_actual INTEGER NOT NULL DEFAULT 0 CHECK (racha_actual >= 0),
    ultima_fecha TEXT,                                  -- último día completado (NULL si nunca)
    creado_en    TEXT    NOT NULL DEFAULT (datetime('now'))
);
