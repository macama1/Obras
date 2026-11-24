// =====================================================================
// PASO DIARIO A DESECHO
// Todos los días a las 6:00 saca de "Carteras" y "Asignables" las obras que:
//   - tienen Estado de Obra "Terminada" o "Repetida", o
//   - tienen Vendedor "No Asignable" (también "Desechada" y "Sin Asignación", los nombres antiguos).
// Las copia al final de "Desecho" por nombre de columna, con el "Motivo de salida"
// (Terminada, Repetida o No Asignable), comprueba que quedaron escritas y recién ahí las borra
// de su hoja. Si el vendedor decía "Desechada", queda "No Asignable" y en
// "Acciones Última Reunion" se anota que se desechó.
// Para empezar: elige prepararDesecho y presiona Ejecutar (una sola vez).
// Para ver qué haría sin mover nada: elige simularDesecho y presiona Ejecutar.
// =====================================================================
const HORA_DESECHO = 6;
const VENDEDORES_A_DESECHO = ['no asignable', 'desechada', 'sin asignacion'];

// Crea (o reemplaza) el activador diario y hace una primera pasada.
function prepararDesecho() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'moverADesecho')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('moverADesecho').timeBased().everyDays(1).atHour(HORA_DESECHO).create();
  Logger.log(moverADesecho());
}

// Muestra en el registro qué movería, sin escribir nada.
function simularDesecho() {
  Logger.log(moverADesechoSinLock_(true));
}

function moverADesecho() {
  // El mismo candado que usa la app al guardar: no se mueve una fila mientras un vendedor la edita.
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return moverADesechoSinLock_(false);
  } finally {
    lock.releaseLock();
  }
}

function motivoSalida_(estado, vendedor) {
  const e = normalizarTexto(estado);
  if (e === 'terminada') return 'Terminada';
  if (e === 'repetida') return 'Repetida';
  if (VENDEDORES_A_DESECHO.indexOf(normalizarTexto(vendedor)) !== -1) return 'No Asignable';
  return '';
}

function moverADesechoSinLock_(simular) {
  const libro = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO);
  const des = hojaDesecho_(libro);
  const dd = filasCompletas_(des);
  const hd = dd[0].map(String);
  if (hd.indexOf('Motivo de salida') === -1) throw new Error('Desecho no tiene la columna "Motivo de salida".');
  // Solo las columnas con nombre, desde la A hasta la última con nombre.
  let anchoDes = hd.length;
  while (anchoDes > 0 && !hd[anchoDes - 1]) anchoDes--;

  const fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MM-yyyy');
  const origenes = [
    { nombre: 'Carteras', hoja: hojaCarteras_(libro) },
    { nombre: 'Asignables', hoja: hojaAsignables_(libro) }
  ];
  const nuevas = [];
  const resumen = [];

  origenes.forEach(o => {
    const datos = filasCompletas_(o.hoja);
    const h = datos[0].map(String);
    const c = n => h.indexOf(n);
    o.filas = [];
    const cuenta = {};
    datos.forEach((f, i) => {
      if (i === 0) return;
      if (!String(f[c('ID')] || '').trim() && !String(f[c('Obra / PDV')] || '').trim()) return;
      const vendedor = String(f[c('Vendedor')] || '').trim();
      const motivo = motivoSalida_(f[c('Estado de Obra')], vendedor);
      if (!motivo) return;
      const obj = {};
      h.forEach((nombre, j) => { if (nombre) obj[nombre] = f[j]; });
      const v = normalizarTexto(vendedor);
      if (v === 'desechada' || v === 'sin asignacion') obj['Vendedor'] = 'No Asignable';
      if (v === 'desechada') {
        const previa = String(obj['Acciones Última Reunion'] || '').trim();
        obj['Acciones Última Reunion'] = (previa ? previa + ' | ' : '') + 'Desechada (' + fecha + ')';
      }
      obj['Motivo de salida'] = motivo;
      nuevas.push(hd.slice(0, anchoDes).map(n => (n && obj[n] !== undefined) ? obj[n] : ''));
      o.filas.push(i + 1);
      cuenta[motivo] = (cuenta[motivo] || 0) + 1;
    });
    resumen.push(o.nombre + ': ' + o.filas.length + ' ' + JSON.stringify(cuenta));
  });

  if (simular || !nuevas.length) {
    return (simular ? 'SIMULACIÓN (no se escribió nada). ' : '') + 'A Desecho: ' + resumen.join('; ') + '.' +
      (simular ? '\n' + nuevas.slice(0, 15).map(r => r[hd.indexOf('ID')] + ' | ' + r[hd.indexOf('Obra / PDV')] + ' → ' + r[hd.indexOf('Motivo de salida')]).join('\n') : '');
  }

  // 1. Escribir al final de Desecho y comprobar que quedaron.
  const desde = dd.length + 1;
  const faltan = desde + nuevas.length - 1 - des.getMaxRows();
  if (faltan > 0) des.insertRowsAfter(des.getMaxRows(), faltan + 50);
  des.getRange(desde, 1, nuevas.length, anchoDes).setValues(nuevas);
  SpreadsheetApp.flush();
  const cObra = hd.indexOf('Obra / PDV');
  const escritas = des.getRange(desde, cObra + 1, nuevas.length, 1).getValues();
  const ok = escritas.every((x, k) => String(x[0]) === String(nuevas[k][cObra]));
  if (!ok) throw new Error('No se pudo comprobar la copia en Desecho; no se borró nada de Carteras ni Asignables.');

  // 2. Borrar de su hoja, de abajo hacia arriba y por bloques seguidos.
  origenes.forEach(o => {
    const filas = o.filas.slice().sort((a, b) => b - a);
    let k = 0;
    while (k < filas.length) {
      let fin = filas[k], ini = fin;
      while (k + 1 < filas.length && filas[k + 1] === ini - 1) { k++; ini--; }
      o.hoja.deleteRows(ini, fin - ini + 1);
      k++;
    }
  });
  SpreadsheetApp.flush();
  return 'Movidas a Desecho: ' + resumen.join('; ') + '.';
}
