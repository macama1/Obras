// =====================================================================
// REVISIÓN CONTRA ONDAC E ICONSTRUYE
// Lee la planilla "Revisión Radar" y aplica solo las filas marcadas "Sí".
// 1. Pega abajo el enlace de la planilla de revisión.
// 2. En el editor elige aplicarRevision y presiona Ejecutar.
// Es seguro ejecutarla dos veces: lo que ya dice "Aplicado" se salta.
// =====================================================================
const URL_REVISION = ""; // pega aquí el enlace de la planilla "Revisión Radar"

function aplicarRevision() {
  if (!URL_REVISION) throw new Error('Falta pegar el enlace de la planilla de revisión en URL_REVISION.');
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const rev = SpreadsheetApp.openByUrl(URL_REVISION);
    const libro = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO);
    const cache = {};
    const hojaRadar = nombre => {
      if (!cache[nombre]) {
        const h = libro.getSheetByName(nombre);
        if (!h) throw new Error('No existe la hoja ' + nombre);
        const datos = h.getDataRange().getValues();
        cache[nombre] = { hoja: h, datos: datos, enc: datos[0].map(String), celdas: [] };
      }
      return cache[nombre];
    };
    const resumen = [
      'Etapas: ' + aplicarPestana_(rev.getSheetByName('Etapas'), hojaRadar, aplicarEtapa_),
      'Ubicación: ' + aplicarPestana_(rev.getSheetByName('Ubicación'), hojaRadar, aplicarUbicacion_),
    ];
    // Escribe de vuelta solo las celdas que cambiaron (así no se tocan fórmulas de otras columnas).
    Object.keys(cache).forEach(n => {
      const c = cache[n];
      c.celdas.forEach(([i, col]) => c.hoja.getRange(i + 1, col + 1).setValue(c.datos[i][col]));
    });
    resumen.push('Obras nuevas: ' + agregarObrasNuevas_(rev.getSheetByName('Obras nuevas'), hojaRadar));
    SpreadsheetApp.flush();
    Logger.log(resumen.join('\n'));
    return resumen.join('\n');
  } finally {
    lock.releaseLock();
  }
}

// Recorre una pestaña de la revisión y anota el resultado de cada fila marcada "Sí".
function aplicarPestana_(pestana, hojaRadar, aplicar) {
  const datos = pestana.getDataRange().getValues();
  const enc = datos[0].map(String);
  const cRes = enc.indexOf('Resultado');
  let ok = 0, saltadas = 0;
  const resultados = datos.slice(1).map(fila => {
    const yaEstaba = String(fila[cRes]);
    if (String(fila[0]).trim() !== 'Sí' || yaEstaba === 'Aplicado') return [yaEstaba];
    const r = {};
    enc.forEach((e, i) => r[e] = fila[i]);
    let msg;
    try { msg = aplicar(r, hojaRadar); } catch (e) { msg = 'Error: ' + e.message; }
    if (msg === 'Aplicado') ok++; else saltadas++;
    return [msg];
  });
  if (resultados.length) pestana.getRange(2, cRes + 1, resultados.length, 1).setValues(resultados);
  return ok + ' aplicadas, ' + saltadas + ' no aplicadas';
}

// Encuentra la fila del radar: por ID, o por número de fila comprobando que siga siendo la misma obra.
function buscarFilaRevision_(r, hojaRadar) {
  const c = hojaRadar(r['Hoja']);
  const clave = String(r['Clave']).trim();
  const cObra = c.enc.indexOf('Obra / PDV');
  if (!/^fila /.test(clave)) {
    const i = c.datos.findIndex((f, k) => k > 0 && String(f[COL_ID - 1]).trim() === clave);
    if (i > 0) return { c: c, i: i };
  }
  const i = Number(r['Fila']) - 1;
  if (c.datos[i] && normalizarTexto(c.datos[i][cObra]) === normalizarTexto(r['Obra'])) return { c: c, i: i };
  return null;
}

const ORDEN_ETAPAS_ = {
  'no iniciada': 0, 'sin informacion': 0, 'obras preliminares': 1, 'fundaciones': 2,
  'obra gruesa': 3, 'terminaciones': 4, 'terminada': 5
};

function aplicarEtapa_(r, hojaRadar) {
  const pos = buscarFilaRevision_(r, hojaRadar);
  if (!pos) return 'No se encontró la obra (¿se movió o se borró?)';
  const c = pos.c, fila = c.datos[pos.i];
  const cEstado = c.enc.indexOf('Estado de Obra');
  const actual = String(fila[cEstado]).trim();
  if (normalizarTexto(actual) !== normalizarTexto(r['Etapa actual'])) {
    const a = ORDEN_ETAPAS_[normalizarTexto(actual)], n = ORDEN_ETAPAS_[normalizarTexto(r['Etapa nueva'])];
    if (a !== undefined && n !== undefined && a >= n) return 'Ya estaba en ' + actual;
  }
  fila[cEstado] = r['Etapa nueva'];
  c.celdas.push([pos.i, cEstado]);
  return 'Aplicado';
}

function aplicarUbicacion_(r, hojaRadar) {
  const pos = buscarFilaRevision_(r, hojaRadar);
  if (!pos) return 'No se encontró la obra (¿se movió o se borró?)';
  const c = pos.c, fila = c.datos[pos.i];
  const campo = String(r['Campo']);
  const col = c.enc.indexOf(campo);
  if (col < 0) return 'La hoja no tiene la columna ' + campo;
  if (normalizarTexto(fila[col]) !== normalizarTexto(r['Valor actual'])) return 'El valor cambió desde la revisión: ' + fila[col];
  fila[col] = r['Valor propuesto'] === undefined ? '' : r['Valor propuesto'];
  c.celdas.push([pos.i, col]);
  const cUbi = c.enc.indexOf('Ubicación Completa');
  if (cUbi >= 0 && (campo === 'Comuna' || campo === 'Región')) {
    const v = n => String(fila[c.enc.indexOf(n)] || '').trim();
    fila[cUbi] = [v('Dirección'), v('Comuna'), v('Región'), 'Chile'].filter(String).join(' | ');
    c.celdas.push([pos.i, cUbi]);
  }
  return 'Aplicado';
}

// Agrega al final de su hoja destino las obras nuevas marcadas "Sí". Se salta las que ya tienen su AID en el radar.
function agregarObrasNuevas_(pestana, hojaRadar) {
  const datos = pestana.getDataRange().getValues();
  const enc = datos[0].map(String);
  const cRes = enc.indexOf('Resultado');
  const aidsRadar = {};
  ['Consolidado', 'No Asignadas'].forEach(n => {
    const c = hojaRadar(n), cA = c.enc.indexOf('AID');
    c.datos.slice(1).forEach(f => { const a = String(f[cA]).trim(); if (a) aidsRadar[a] = true; });
  });
  const porHoja = {};
  let ok = 0, saltadas = 0;
  const resultados = datos.slice(1).map(fila => {
    const yaEstaba = String(fila[cRes]);
    if (String(fila[0]).trim() !== 'Sí' || yaEstaba === 'Aplicado') return [yaEstaba];
    const r = {};
    enc.forEach((e, i) => r[e] = fila[i]);
    const aid = String(r['AID'] || '').trim();
    if (aid && aidsRadar[aid]) { saltadas++; return ['Ya estaba en el radar (AID ' + aid + ')']; }
    if (aid) aidsRadar[aid] = true;
    const destino = r['Hoja destino'] || 'No Asignadas';
    const c = hojaRadar(destino);
    r['Ubicación Completa'] = [r['Dirección'], r['Comuna'], r['Región'], 'Chile']
      .map(x => String(x || '').trim()).filter(String).join(' | ');
    (porHoja[destino] = porHoja[destino] || []).push(r);
    ok++;
    return ['Aplicado'];
  });
  // Solo se escriben las columnas que traen dato (de la primera a la última), para no pisar
  // ID, Orden ni fórmulas. Se escribe bajo la última fila que tiene Obra / PDV.
  Object.keys(porHoja).forEach(n => {
    const c = hojaRadar(n), filas = porHoja[n];
    const cols = c.enc.map((e, i) => (e && e !== 'ID' && e !== 'Orden' && filas.some(r => r[e] !== undefined && r[e] !== '')) ? i : -1).filter(i => i >= 0);
    const desde = Math.min.apply(null, cols), hasta = Math.max.apply(null, cols);
    const cObra = c.enc.indexOf('Obra / PDV');
    let ultima = c.datos.length - 1;
    while (ultima > 0 && !String(c.datos[ultima][cObra]).trim()) ultima--;
    const valores = filas.map(r => c.enc.slice(desde, hasta + 1).map(e => (r[e] === undefined ? '' : r[e])));
    c.hoja.getRange(ultima + 2, desde + 1, valores.length, hasta - desde + 1).setValues(valores);
  });
  if (resultados.length) pestana.getRange(2, cRes + 1, resultados.length, 1).setValues(resultados);
  return ok + ' agregadas, ' + saltadas + ' ya estaban';
}
