// finanzas.js — Bloque de Finanzas del dashboard (lista, formulario y totales)

const API = '/api/transacciones';

// Formateador de moneda en euros (formato español: 1.234,56 €)
const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

// Referencias a elementos del DOM
const form = document.getElementById('form-transaccion');
const lista = document.getElementById('lista-transacciones');
const errorTx = document.getElementById('error-transaccion');

// Muestra la fecha de hoy en formato largo ("jueves, 27 de noviembre de 2026")
function pintarFechaHoy() {
  const hoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  document.getElementById('fecha-hoy').textContent = hoy;
}

// Crea una fila <li> para una transacción usando DOM (sin innerHTML: evita XSS)
function crearFila(tx) {
  const esIngreso = tx.tipo === 'ingreso';

  const li = document.createElement('li');
  li.className = 'flex items-center gap-4 rounded-2xl bg-white px-4 py-3';

  // Icono con flecha: ↗ verde (ingreso) o ↘ roja (gasto)
  const icono = document.createElement('span');
  icono.className = 'w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ' +
    (esIngreso ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500');
  icono.textContent = esIngreso ? '↗' : '↘';

  // Texto: categoría (o tipo) + descripción y fecha
  const info = document.createElement('div');
  info.className = 'flex-1 min-w-0';
  const titulo = document.createElement('p');
  titulo.className = 'font-semibold truncate';
  titulo.textContent = tx.categoria || (esIngreso ? 'Ingreso' : 'Gasto');
  const detalle = document.createElement('p');
  detalle.className = 'text-xs text-slate-500 truncate';
  detalle.textContent = [tx.descripcion, tx.fecha].filter(Boolean).join(' · ');
  info.append(titulo, detalle);

  // Importe con signo y color
  const importe = document.createElement('span');
  importe.className = 'font-semibold ' + (esIngreso ? 'text-emerald-600' : 'text-rose-500');
  importe.textContent = (esIngreso ? '+' : '−') + euros.format(tx.cantidad);

  li.append(icono, info, importe);
  return li;
}

// Pinta la lista completa (o el estado vacío)
function pintarLista(transacciones) {
  lista.replaceChildren();
  if (transacciones.length === 0) {
    const vacio = document.createElement('li');
    vacio.className = 'text-sm text-slate-400';
    vacio.textContent = 'Aún no hay transacciones';
    lista.append(vacio);
    return;
  }
  transacciones.forEach((tx) => lista.append(crearFila(tx)));
}

// Calcula ingresos, gastos y saldo, y los muestra en las tarjetas de resumen
function pintarTotales(transacciones) {
  let ingresos = 0;
  let gastos = 0;
  for (const tx of transacciones) {
    if (tx.tipo === 'ingreso') ingresos += Number(tx.cantidad);
    else gastos += Number(tx.cantidad);
  }
  document.getElementById('total-ingresos').textContent = euros.format(ingresos);
  document.getElementById('total-gastos').textContent = euros.format(gastos);
  document.getElementById('saldo-total').textContent = euros.format(ingresos - gastos);
}

// Pide las transacciones a la API y refresca la vista
async function cargarTransacciones() {
  try {
    const res = await fetch(API);
    const transacciones = await res.json();
    pintarLista(transacciones);
    pintarTotales(transacciones);
  } catch (err) {
    errorTx.textContent = 'No se pudieron cargar las transacciones';
  }
}

// Envío del formulario: POST a la API con los campos rellenados
form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  errorTx.textContent = '';

  const datos = Object.fromEntries(new FormData(form));
  const cuerpo = { tipo: datos.tipo, cantidad: Number(datos.cantidad) };
  // Solo enviamos los campos opcionales si tienen valor
  for (const campo of ['categoria', 'descripcion', 'fecha']) {
    if (datos[campo].trim() !== '') cuerpo[campo] = datos[campo].trim();
  }

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo)
    });
    if (res.status === 201) {
      form.reset();
      cargarTransacciones();
    } else {
      const { error } = await res.json();
      errorTx.textContent = error || 'Error al guardar la transacción';
    }
  } catch (err) {
    errorTx.textContent = 'No se pudo conectar con el servidor';
  }
});

// Arranque
pintarFechaHoy();
cargarTransacciones();
