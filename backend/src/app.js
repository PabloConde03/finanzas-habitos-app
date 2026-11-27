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

// ---------- Arranque ----------

app.listen(PUERTO, () => {
  console.log(`API escuchando en http://localhost:${PUERTO}`);
});
