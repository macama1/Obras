// =====================================================================
// ASIGNACIÓN POR CARTERA
// Una obra nueva de un cliente que un vendedor ya atiende en la misma región se le asigna sola
// a ese vendedor y pasa de "No Asignadas" a "Consolidado".
// - El cliente se reconoce por su RUT o por su nombre (sin "S.A.", "Ltda", "Constructora", etc.).
// - Si dos vendedores tienen a ese cliente en la región, se asigna al que tiene más obras de él.
//   Si empatan, no se mueve y queda anotado para que jefatura decida.
// - Todo queda en la hoja "Asignaciones automáticas" (para revisar o deshacer).
// Corre una vez al mes, el día 9 a las 7:00 (después de la carga mensual del día 8),
// y al terminar "Importar Ondac Iconstruye".
// Para empezar: elige prepararAsignacion y presiona Ejecutar (una sola vez).
// =====================================================================
const NOMBRE_HOJA_NO_ASIGNADAS = 'No Asignadas';
const NOMBRE_HOJA_ASIGNACIONES = 'Asignaciones automáticas';
// "Sin Cobertura" también: si un vendedor ya atiende a ese cliente en la región, sí hay cobertura.
const VENDEDORES_PENDIENTES = ['sin asignacion', 'sin asignar', 'asignable', 'sin cobertura', ''];
const VENDEDORES_SIN_CARTERA = ['sin asignacion', 'sin asignar', 'asignable', 'sin cobertura', 'desechada', ''];
const ESTADOS_NO_ASIGNABLES = ['terminada', 'repetida', 'desechada'];

// Muestra en el registro qué haría, sin escribir nada.
function simularAsignacion() {
  Logger.log(asignarPorCarteraSinLock_(true));
}

function prepararAsignacion() {
  hojaAsignaciones_();
  // Reemplaza cualquier activador anterior (antes era diario) por uno mensual: día 9 a las 7:00.
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'asignarPorCartera')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('asignarPorCartera').timeBased().onMonthDay(9).atHour(7).create();
  Logger.log(asignarPorCartera());
}

// Nombre de empresa sin tildes, signos ni palabras genéricas: "Constructora Ebco S.A." -> "ebco".
function nombreCliente_(s) {
  const generico = /\b(s ?a|s ?p ?a|spa|ltda|limitada|ltd|y cia|cia|e i r l|eirl|sociedad|constructora|inmobiliaria|empresa|empresas|de|del|la|y|e|ingenieria|construccion|construcciones|inversiones|chile|s)\b/g;
  return normalizarTexto(s).replace(/[^a-z0-9 ]/g, ' ').replace(generico, ' ').replace(/\s+/g, ' ').trim();
}
function rutCliente_(s) {
  const r = String(s || '').replace(/[^0-9kK]/g, '').toUpperCase();
  return r.length >= 7 ? r : '';
}

function asignarPorCartera() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return asignarPorCarteraSinLock_();
  } finally {
    lock.releaseLock();
  }
}

function asignarPorCarteraSinLock_(simular) {
  const libro = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO);
  const con = libro.getSheetByName(NOMBRE_HOJA_MAESTRA);
  const na = libro.getSheetByName(NOMBRE_HOJA_NO_ASIGNADAS);
  const dc = con.getDataRange().getValues(), hc = dc[0].map(String);
  const dn = na.getDataRange().getValues(), hn = dn[0].map(String);
  const C = n => hc.indexOf(n), N = n => hn.indexOf(n);

  // 1. Cartera actual: (RUT o nombre del cliente) + región -> { vendedor: cantidad de obras }
  const cartera = {};
  const sumar = (clave, v) => { if (!clave) return; (cartera[clave] = cartera[clave] || {})[v] = (cartera[clave][v] || 0) + 1; };
  dc.slice(1).forEach(f => {
    const v = String(f[C('Vendedor')]).trim();
    if (!String(f[COL_ID - 1]).trim() || VENDEDORES_SIN_CARTERA.indexOf(normalizarTexto(v)) !== -1) return;
    const reg = normalizarTexto(f[C('Región')]);
    const rut = rutCliente_(f[C('Rut Empresa')]), nom = nombreCliente_(f[C('Empresa')]);
    if (rut) sumar('r:' + rut + '|' + reg, v);
    if (nom) sumar('n:' + nom + '|' + reg, v);
  });

  // 2. Obras pendientes de No Asignadas que son de un cliente con cartera en su región.
  const aMover = [], registro = [];
  let empates = 0, repetidas = 0;
  const filasCon = dc.slice(); // para detectar repetidas también entre las que se van moviendo
  dn.forEach((f, i) => {
    if (i === 0 || !String(f[N('Obra / PDV')]).trim()) return;
    if (VENDEDORES_PENDIENTES.indexOf(normalizarTexto(f[N('Vendedor')])) === -1) return;
    if (ESTADOS_NO_ASIGNABLES.indexOf(normalizarTexto(f[N('Estado de Obra')])) !== -1) return;
    const reg = normalizarTexto(f[N('Región')]);
    const rut = rutCliente_(f[N('Rut Empresa')]), nom = nombreCliente_(f[N('Empresa')]);
    let dueños = rut && cartera['r:' + rut + '|' + reg], via = 'RUT';
    if (!dueños && nom) { dueños = cartera['n:' + nom + '|' + reg]; via = 'nombre'; }
    if (!dueños) return;
    const ranking = Object.keys(dueños).map(v => [v, dueños[v]]).sort((a, b) => b[1] - a[1]);
    const base = [new Date(), f[N('Empresa')], f[N('Obra / PDV')], f[N('Comuna')], f[N('Región')]];
    if (ranking.length > 1 && ranking[0][1] === ranking[1][1]) {
      empates++;
      registro.push(base.concat(['', 'Empate, decide jefatura: ' + ranking.map(r => r[0] + ' (' + r[1] + ')').join(', ')]));
      return;
    }
    // Objeto con los datos de la fila, por nombre de columna.
    const datos = {};
    hn.forEach((h, j) => { if (h) datos[h] = f[j]; });
    datos['Vendedor'] = ranking[0][0];
    const rep = buscarObraRepetida_(filasCon, hc, datos);
    if (rep) {
      repetidas++;
      registro.push(base.concat([rep[COL_ID - 1], 'No se movió: ya está en Consolidado (' + rep[C('Vendedor')] + ')']));
      return;
    }
    const motivo = 'Cliente de ' + ranking[0][0] + ' en la región (por ' + via + ', ' + ranking[0][1] + ' obra' + (ranking[0][1] === 1 ? '' : 's') +
      (ranking.length > 1 ? '; también ' + ranking.slice(1).map(r => r[0] + ' ' + r[1]).join(', ') : '') + ')';
    aMover.push({ filaNa: i + 1, datos: datos, base: base, motivo: motivo });
    filasCon.push(hc.map(h => datos[h] === undefined ? '' : datos[h]));
  });

  if (simular) {
    const porVendedor = {};
    aMover.forEach(x => { porVendedor[x.datos['Vendedor']] = (porVendedor[x.datos['Vendedor']] || 0) + 1; });
    return 'SIMULACIÓN (no se escribió nada). Se moverían: ' + aMover.length + ' ' + JSON.stringify(porVendedor) +
      '. Empates: ' + empates + '. Ya estaban: ' + repetidas + '.\n' +
      aMover.slice(0, 15).map(x => x.datos['Empresa'] + ' | ' + x.datos['Obra / PDV'] + ' | ' + x.datos['Comuna'] + ' → ' + x.datos['Vendedor']).join('\n') +
      '\n' + registro.slice(0, 10).map(r => r.join(' | ')).join('\n');
  }

  // 3. Pasar a Consolidado (por nombre de columna) con código nuevo.
  if (aMover.length) {
    let max = 0;
    dc.slice(1).forEach(f => { const m = String(f[COL_ID - 1]).match(/\d+$/); if (m) max = Math.max(max, parseInt(m[0], 10)); });
    let ultima = dc.length - 1;
    while (ultima > 0 && !String(dc[ultima][COL_ID - 1]).trim()) ultima--;
    const filas = aMover.map(x => {
      const id = prefijoCanal_(x.datos['Canal']) + (++max);
      x.id = id;
      if (!String(x.datos['Historial de ejecutivos'] || '').trim()) x.datos['Historial de ejecutivos'] = x.datos['Vendedor'];
      return hc.map(h => h === 'ID' ? id : h === 'Orden' || !h ? '' : (x.datos[h] === undefined ? '' : x.datos[h]));
    });
    // Solo las columnas con nombre, desde la A hasta la última con nombre: no pisa columnas sueltas.
    let ancho = hc.length;
    while (ancho > 0 && !hc[ancho - 1]) ancho--;
    con.getRange(ultima + 2, 1, filas.length, ancho).setValues(filas.map(f => f.slice(0, ancho)));
    // Sacarlas de No Asignadas (de abajo hacia arriba para no correr las filas).
    aMover.map(x => x.filaNa).sort((a, b) => b - a).forEach(n => na.deleteRow(n));
    aMover.forEach(x => registro.push(x.base.concat([x.id, x.motivo + ' → ' + x.datos['Vendedor']])));
    // Que el vendedor vea en su historial cuándo le llegó.
    const visitas = libro.getSheetByName(NOMBRE_HOJA_REGISTRO);
    if (visitas) {
      const filasReg = aMover.map(x => [x.id, x.datos['Empresa'], x.datos['Obra / PDV'], x.datos['Vendedor'], new Date(), 'Asignada por cartera', x.datos['Estado de Obra'] || '']);
      visitas.getRange(visitas.getLastRow() + 1, 1, filasReg.length, 7).setValues(filasReg);
    }
  }

  if (registro.length) {
    // Empates y repetidas no se vuelven a anotar cada día si ya están en el registro.
    const hoja = hojaAsignaciones_();
    const previas = hoja.getLastRow() > 1 ? hoja.getRange(2, 2, hoja.getLastRow() - 1, 6).getValues() : [];
    const clave = r => [r[0], r[1], r[3], String(r[5]).split(':')[0]].map(normalizarTexto).join('|');
    const vistas = new Set(previas.map(clave));
    const nuevas = registro.filter(r => !vistas.has(clave(r.slice(1))));
    if (nuevas.length) hoja.getRange(hoja.getLastRow() + 1, 1, nuevas.length, 7).setValues(nuevas);
  }
  SpreadsheetApp.flush();
  return 'Asignadas y movidas a Consolidado: ' + aMover.length + '. Empates para revisar: ' + empates + '. Ya estaban en Consolidado: ' + repetidas + '.';
}

// Misma regla de códigos que al crear desde la app: c constructora, f ferretería, d distribuidor, etc.
function prefijoCanal_(canal) {
  const c = normalizarTexto(canal);
  if (c.indexOf('constructora') !== -1) return 'c';
  if (c.indexOf('ferreteria') !== -1) return 'f';
  if (c.indexOf('distribuidor') !== -1) return 'd';
  if (c.indexOf('especialista') !== -1) return 'e';
  if (c.indexOf('instalador') !== -1) return 'i';
  if (c.indexOf('e-commerce') !== -1) return 'w';
  if (c.indexOf('industrial') !== -1) return 'n';
  return 'c'; // las obras importadas de Ondac e iConstruye vienen sin canal: son de constructoras
}

function hojaAsignaciones_() {
  const libro = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO);
  let hoja = libro.getSheetByName(NOMBRE_HOJA_ASIGNACIONES);
  if (!hoja) {
    hoja = libro.insertSheet(NOMBRE_HOJA_ASIGNACIONES);
    hoja.getRange(1, 1, 1, 7).setValues([['Fecha', 'Empresa', 'Obra / PDV', 'Comuna', 'Región', 'ID en Consolidado', 'Resultado']]).setFontWeight('bold');
    hoja.setFrozenRows(1);
  }
  return hoja;
}

// Copia una fila de "No Asignadas" a las columnas de "Consolidado" por nombre de columna
// (las dos hojas no tienen las mismas columnas). La usa "Mover Datos a Consolidado".
function filaParaConsolidado_(filaNa, encNa, encCon) {
  const datos = {};
  encNa.forEach((h, j) => { if (h) datos[String(h)] = filaNa[j]; });
  return encCon.map(h => (h && datos[String(h)] !== undefined) ? datos[String(h)] : '');
}
