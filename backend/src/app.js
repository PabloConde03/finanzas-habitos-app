// Servidor Express: expone la API REST y sirve el frontend
import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import db from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PUERTO = process.env.PORT || 3000;

// Middleware: convierte el cuerpo JSON de las peticiones en req.body
app.use(express.json());

// Sirve los archivos de frontend/ (index.html, JS, CSS) desde el mismo servidor
app.use(express.static(join(__dirname, '..', '..', 'frontend')));

// ---------- Transacciones ----------

// GET /api/transacciones -> lista todas, la más reciente primero
app.get('/api/transacciones', (req, res) => {
  const filas = db
    .prepare('SELECT * FROM transacciones ORDER BY fecha DESC, id DESC')
    .all();
  res.json(filas);
});

// POST /api/transacciones -> crea una nueva
app.post('/api/transacciones', (req, res) => {
  const { tipo, cantidad, categoria, descripcion, fecha } = req.body ?? {};

  if (!['ingreso', 'gasto'].includes(tipo) || !(Number(cantidad) > 0)) {
    return res
      .status(400)
      .json({ error: 'tipo debe ser "ingreso" o "gasto" y cantidad un número mayor que 0' });
  }

  // Los ? son parámetros: los valores nunca se pegan dentro del SQL (evita inyección SQL)
  const resultado = db
    .prepare(
      `INSERT INTO transacciones (tipo, cantidad, categoria, descripcion, fecha)
       VALUES (?, ?, COALESCE(?, 'general'), ?, COALESCE(?, date('now')))`
    )
    .run(tipo, Number(cantidad), categoria ?? null, descripcion ?? null, fecha ?? null);

  const nueva = db
    .prepare('SELECT * FROM transacciones WHERE id = ?')
    .get(resultado.lastInsertRowid);
  res.status(201).json(nueva);
});

// ---------- Hábitos ----------

// GET /api/habitos -> lista todos por orden de creación
app.get('/api/habitos', (req, res) => {
  res.json(db.prepare('SELECT * FROM habitos ORDER BY id').all());
});

// POST /api/habitos -> crea un hábito nuevo (racha 0, nunca completado)
app.post('/api/habitos', (req, res) => {
  const { nombre, descripcion } = req.body ?? {};

  if (typeof nombre !== 'string' || nombre.trim() === '') {
    return res.status(400).json({ error: 'nombre es obligatorio' });
  }

  try {
    const resultado = db
      .prepare('INSERT INTO habitos (nombre, descripcion) VALUES (?, ?)')
      .run(nombre.trim(), descripcion ?? null);
    const nuevo = db.prepare('SELECT * FROM habitos WHERE id = ?').get(resultado.lastInsertRowid);
    res.status(201).json(nuevo);
  } catch (err) {
    // El UNIQUE del esquema impide dos hábitos con el mismo nombre
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: `ya existe un hábito llamado "${nombre.trim()}"` });
    }
    throw err;
  }
});

// POST /api/habitos/:id/completar -> marca el hábito como hecho hoy y actualiza la racha
app.post('/api/habitos/:id/completar', (req, res) => {
  const habito = db.prepare('SELECT * FROM habitos WHERE id = ?').get(req.params.id);
  if (!habito) {
    return res.status(404).json({ error: 'hábito no encontrado' });
  }

  // Pedimos las fechas a SQLite para usar el mismo reloj que el esquema
  const { hoy, ayer } = db.prepare("SELECT date('now') AS hoy, date('now', '-1 day') AS ayer").get();

  if (habito.ultima_fecha === hoy) {
    return res.status(409).json({ error: 'este hábito ya se completó hoy' });
  }

  // Si se hizo ayer la racha continúa; si no, empieza de nuevo
  const nuevaRacha = habito.ultima_fecha === ayer ? habito.racha_actual + 1 : 1;

  db.prepare('UPDATE habitos SET racha_actual = ?, ultima_fecha = ? WHERE id = ?')
    .run(nuevaRacha, hoy, habito.id);

  res.json(db.prepare('SELECT * FROM habitos WHERE id = ?').get(habito.id));
});

// ---------- Arranque ----------

app.listen(PUERTO, () => {
  console.log(`API escuchando en http://localhost:${PUERTO}`);
});
