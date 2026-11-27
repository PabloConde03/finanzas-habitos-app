// Conexión única a SQLite: crea la base de datos y las tablas si no existen
import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// En módulos ES6 no existe __dirname: lo calculamos a partir de la URL de este archivo
const __dirname = dirname(fileURLToPath(import.meta.url));

// backend/data/finanzas.db  (ignorado por Git gracias a *.db)
const carpetaDatos = join(__dirname, '..', 'data');
mkdirSync(carpetaDatos, { recursive: true });

const db = new Database(join(carpetaDatos, 'finanzas.db'));

// Ejecuta el esquema versionado en docs/ (IF NOT EXISTS lo hace seguro en cada arranque)
const rutaEsquema = join(__dirname, '..', '..', 'docs', 'esquema-bd.sql');
db.exec(readFileSync(rutaEsquema, 'utf8'));

export default db;
