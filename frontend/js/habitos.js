// Módulo de Hábitos: lista, crea y completa hábitos usando la API REST.

const API = '/api/habitos';

const form = document.getElementById('form-habito');
const lista = document.getElementById('lista-habitos');
const error = document.getElementById('error-habito');

// Fecha de hoy en UTC (YYYY-MM-DD), igual que date('now') de SQLite
function hoyUTC() {
  return new Date().toISOString().slice(0, 10);
}

// Muestra (o limpia) un mensaje de error en el bloque
function mostrarError(mensaje = '') {
  error.textContent = mensaje;
}

// Lee el campo "error" de una respuesta fallida
async function leerError(res) {
  try {
    const datos = await res.json();
    return datos.error || `Error ${res.status}`;
  } catch {
    return `Error ${res.status}`;
  }
}

// Crea un elemento con clases y texto (textContent: seguro frente a XSS)
function crear(etiqueta, clases, texto = '') {
  const el = document.createElement(etiqueta);
  el.className = clases;
  el.textContent = texto;
  return el;
}

// Construye la tarjeta <li> de un hábito
function crearTarjeta(habito) {
  const hechoHoy = habito.ultima_fecha === hoyUTC();

  const li = crear('li', 'flex items-center gap-4 rounded-2xl bg-white p-4');

  // Racha (llama + número de días)
  const racha = crear('div', 'flex flex-col items-center justify-center w-14 shrink-0 rounded-xl bg-orange-50 py-2 text-orange-500');
  racha.append(crear('span', 'text-xl', '🔥'), crear('span', 'text-xs font-semibold', `${habito.racha_actual} ${habito.racha_actual === 1 ? 'día' : 'días'}`));

  // Texto: nombre, descripción y última fecha
  const info = crear('div', 'flex-1 min-w-0');
  info.append(crear('p', 'font-semibold truncate', habito.nombre));
  if (habito.descripcion) {
    info.append(crear('p', 'text-sm text-slate-500 truncate', habito.descripcion));
  }
  const ultima = habito.ultima_fecha ? `Último: ${habito.ultima_fecha}` : 'Aún sin completar';
  info.append(crear('p', 'text-xs text-slate-400 mt-1', ultima));

  // Botón de completar
  const boton = crear('button', '', hechoHoy ? 'Hecho hoy ✓' : 'Completar hoy');
  boton.type = 'button';
  boton.disabled = hechoHoy;
  boton.className = hechoHoy
    ? 'rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-600 cursor-default'
    : 'rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700';
  boton.addEventListener('click', () => completarHabito(habito.id));

  li.append(racha, info, boton);
  return li;
}

// GET /api/habitos y pinta la lista
async function cargarHabitos() {
  try {
    const res = await fetch(API);
    if (!res.ok) return mostrarError(await leerError(res));
    const habitos = await res.json();

    lista.replaceChildren();
    if (habitos.length === 0) {
      lista.append(crear('li', 'text-sm text-slate-500', 'Aún no hay hábitos'));
      return;
    }
    habitos.forEach((h) => lista.append(crearTarjeta(h)));
  } catch {
    mostrarError('No se pudo conectar con el servidor');
  }
}

// POST /api/habitos/:id/completar
async function completarHabito(id) {
  mostrarError();
  try {
    const res = await fetch(`${API}/${id}/completar`, { method: 'POST' });
    if (!res.ok) return mostrarError(await leerError(res));
    await cargarHabitos();
  } catch {
    mostrarError('No se pudo conectar con el servidor');
  }
}

// Envío del formulario: POST /api/habitos
form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mostrarError();

  const datos = new FormData(form);
  const cuerpo = { nombre: datos.get('nombre').trim() };
  const descripcion = datos.get('descripcion').trim();
  if (descripcion) cuerpo.descripcion = descripcion;

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });
    if (res.status !== 201) return mostrarError(await leerError(res));
    form.reset();
    await cargarHabitos();
  } catch {
    mostrarError('No se pudo conectar con el servidor');
  }
});

// Carga inicial
cargarHabitos();
