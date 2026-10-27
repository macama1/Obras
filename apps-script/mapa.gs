// =====================================================================
// MAPA DEL RADAR
// - Ubica cada obra en el mapa (columnas Latitud, Longitud y "Ubicación en mapa" de Consolidado).
//   Lo hace solo: al crear una obra, al cambiarle la dirección y cada hora para las que falten.
// - Guarda dónde está cada vendedor mientras usa la app (hoja "Ubicaciones", una fila por vendedor)
//   (las visitas ya no guardan GPS ni distancia a la obra).
//
// Para empezar: en el editor elige prepararMapa y presiona Ejecutar (una sola vez).
// =====================================================================
const NOMBRE_HOJA_UBICACIONES = 'Ubicaciones';
const COLUMNAS_MAPA = ['Latitud', 'Longitud', 'Ubicación en mapa'];
// Valores de "Ubicación en mapa":
const UBIC_DIRECCION = 'Dirección';        // encontrada por la dirección
const UBIC_COMUNA = 'Comuna (aprox.)';     // la dirección no se encontró: centro de la comuna
const UBIC_GPS = 'GPS en obra';            // el vendedor la marcó estando en la obra
const UBIC_NO = 'No encontrada';

// Ejecutar UNA vez: agrega las columnas, crea la hoja Ubicaciones, programa la tarea
// de cada hora y ubica el primer grupo de obras.
function prepararMapa() {
  const libro = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO);
  columnasMapa_(libro.getSheetByName(NOMBRE_HOJA_MAESTRA));
  hojaUbicaciones_();
  prepararRegistroConGps_(libro.getSheetByName(NOMBRE_HOJA_REGISTRO));
  const yaProgramada = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'ubicarObrasPendientes');
  if (!yaProgramada) ScriptApp.newTrigger('ubicarObrasPendientes').timeBased().everyHours(1).create();
  ubicarObrasPendientes();
}

// Se ejecuta cada hora: ubica las obras que aún no tienen coordenadas.
// Busca las direcciones SIN bloquear el radar (los vendedores pueden seguir guardando) y al final
// escribe todo de una vez con un bloqueo de pocos segundos, solo en las obras que no cambiaron entre medio.
// Google limita las búsquedas diarias; si se acaban, sigue en la próxima hora.
function ubicarObrasPendientes() {
  const turno = LockService.getDocumentLock(); // evita dos búsquedas a la vez (no afecta a los guardados)
  if (!turno.tryLock(1000)) return;
  try {
    const inicio = Date.now();
    const hoja = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO).getSheetByName(NOMBRE_HOJA_MAESTRA);
    const c = columnasMapa_(hoja);
    const datos = hoja.getDataRange().getValues();
    const claveDir = f => [f[c.dir], f[c.comuna], f[c.region]].map(normalizarTexto).join('|');
    const cacheComunas = {};
    const resultados = []; // { id, clave, valores }
    let pendientes = 0;
    for (let i = 1; i < datos.length; i++) {
      const f = datos[i];
      const id = String(f[COL_ID - 1]).trim();
      if (!id || f[c.lat] !== '' || f[c.estado] === UBIC_NO) continue;
      if (Date.now() - inicio > 4 * 60 * 1000) { pendientes++; continue; } // límite de 6 min por ejecución
      // Google no acepta muchas búsquedas seguidas: pausa corta entre obras y, si igual reclama,
      // espera y reintenta. Si sigue fallando es la cuota del día.
      let r, intentos = 0, detener = false;
      while (true) {
        try {
          r = geocodificar_(f[c.dir], f[c.comuna], f[c.region], cacheComunas);
          break;
        } catch (e) {
          if (++intentos > 3) { Logger.log('Geocodificación detenida: ' + e); detener = true; break; }
          Utilities.sleep(2000 * intentos);
        }
      }
      if (detener) break;
      Utilities.sleep(300);
      resultados.push({ id: id, clave: claveDir(f), valores: r ? [r.lat, r.lng, r.tipo] : ['', '', UBIC_NO] });
    }
    if (!resultados.length) return;

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    let escritas = 0;
    try {
      const actual = hoja.getDataRange().getValues();
      const filaDe = {};
      for (let i = 1; i < actual.length; i++) filaDe[String(actual[i][COL_ID - 1]).trim()] = i;
      const bloque = actual.slice(1).map(f => [f[c.lat], f[c.lng], f[c.estado]]);
      resultados.forEach(r => {
        const i = filaDe[r.id];
        if (!i || actual[i][c.lat] !== '' || claveDir(actual[i]) !== r.clave) return; // cambió entre medio
        bloque[i - 1] = r.valores;
        escritas++;
      });
      hoja.getRange(2, c.lat + 1, bloque.length, 3).setValues(bloque);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
    Logger.log('Obras ubicadas en esta ejecución: ' + escritas + (pendientes ? '. Quedan ' + pendientes + ' para la próxima hora.' : ''));
  } finally {
    turno.releaseLock();
  }
}

// Ubica una fila (al crear una obra o cambiarle la dirección).
function ubicarFilaEnMapa_(hoja, numeroFila) {
  const c = columnasMapa_(hoja);
  const f = hoja.getRange(numeroFila, 1, 1, hoja.getLastColumn()).getValues()[0];
  const r = geocodificar_(f[c.dir], f[c.comuna], f[c.region], {});
  hoja.getRange(numeroFila, c.lat + 1, 1, 3).setValues([r ? [r.lat, r.lng, r.tipo] : ['', '', UBIC_NO]]);
}

// Busca la obra por su dirección; si no aparece, usa el centro de la comuna.
// Solo acepta resultados en Chile y en la misma comuna, para no confundir calles de igual nombre.
function geocodificar_(direccion, comuna, region, cacheComunas) {
  const geo = Maps.newGeocoder().setRegion('cl').setLanguage('es');
  const dir = String(direccion || '').trim();
  const com = String(comuna || '').trim();
  const reg = String(region || '').trim();
  if (!com) return null;

  const tieneNumero = /\d/.test(dir);
  const dirUtil = dir && !/^(s\/?n|sin direcci|no aplica|-)$/i.test(dir);
  if (dirUtil) {
    const r = geo.geocode([dir, com, reg, 'Chile'].filter(String).join(', '));
    const res = (r.status === 'OK' && r.results) ? r.results[0] : null;
    if (res && enChile_(res) && mismaComuna_(res, com)) {
      const amplio = res.types.some(t => ['locality', 'administrative_area_level_3', 'administrative_area_level_2', 'political'].indexOf(t) !== -1)
        && res.types.indexOf('street_address') === -1 && res.types.indexOf('route') === -1 && res.types.indexOf('premise') === -1;
      if (!amplio) {
        const p = res.geometry.location;
        return { lat: redondear_(p.lat), lng: redondear_(p.lng), tipo: tieneNumero || res.types.indexOf('premise') !== -1 ? UBIC_DIRECCION : UBIC_COMUNA };
      }
    }
  }
  // Centro de la comuna (se guarda en memoria para no repetir la búsqueda).
  const clave = normalizarTexto(com + '|' + reg);
  if (!(clave in cacheComunas)) {
    const r = geo.geocode([com, reg, 'Chile'].filter(String).join(', '));
    const res = (r.status === 'OK' && r.results) ? r.results[0] : null;
    cacheComunas[clave] = res && enChile_(res)
      ? { lat: redondear_(res.geometry.location.lat), lng: redondear_(res.geometry.location.lng), tipo: UBIC_COMUNA }
      : null;
  }
  return cacheComunas[clave];
}

function enChile_(res) {
  return res.address_components.some(c => c.types.indexOf('country') !== -1 && c.short_name === 'CL');
}
function mismaComuna_(res, comuna) {
  const buscada = normalizarTexto(comuna);
  return res.address_components.some(c => normalizarTexto(c.long_name) === buscada || normalizarTexto(c.short_name) === buscada);
}
const redondear_ = n => Math.round(n * 1e6) / 1e6;

// Devuelve los índices (base 0) de las columnas que usa el mapa; crea las que falten al final.
function columnasMapa_(hoja) {
  let enc = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map(String);
  const faltan = COLUMNAS_MAPA.filter(n => enc.indexOf(n) === -1);
  if (faltan.length) {
    const desde = hoja.getLastColumn() + 1;
    if (hoja.getMaxColumns() < desde + faltan.length - 1) hoja.insertColumnsAfter(hoja.getMaxColumns(), faltan.length);
    hoja.getRange(1, desde, 1, faltan.length).setValues([faltan]);
    enc = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map(String);
  }
  return {
    lat: enc.indexOf('Latitud'), lng: enc.indexOf('Longitud'), estado: enc.indexOf('Ubicación en mapa'),
    dir: enc.indexOf('Dirección'), comuna: enc.indexOf('Comuna'), region: enc.indexOf('Región'),
  };
}

// ---------- Ubicación de los vendedores ----------

// Acepta solo coordenadas razonables (Chile continental e insular) y precisión menor a 5 km.
function ubicacionValida_(u) {
  if (!u) return null;
  const lat = Number(u.lat), lng = Number(u.lng), precision = Math.round(Number(u.precision) || 0);
  if (!isFinite(lat) || !isFinite(lng) || lat > -17 || lat < -56.5 || lng > -66 || lng < -110) return null;
  if (precision > 5000) return null;
  return { lat: redondear_(lat), lng: redondear_(lng), precision: precision };
}

// La app lo llama mientras el vendedor la usa (como máximo cada pocos minutos).
function reportarUbicacion(ubicacion, usuario) {
  if (!usuario) throw new Error('NO_AUTORIZADO: inicia sesión para compartir tu ubicación.');
  const u = ubicacionValida_(ubicacion);
  if (!u) return { guardada: false };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    guardarUbicacion_(usuario, u, 'App', '');
  } finally {
    lock.releaseLock();
  }
  return { guardada: true };
}

// Una fila por persona con su última posición conocida. Quien la llama ya tiene el lock.
function guardarUbicacion_(usuario, u, origen, obra) {
  const hoja = hojaUbicaciones_();
  const fila = [usuario.correo, usuario.vendedor, u.lat, u.lng, u.precision, new Date(), origen, obra || ''];
  const correos = hoja.getLastRow() > 1 ? hoja.getRange(2, 1, hoja.getLastRow() - 1, 1).getValues().flat().map(c => String(c).toLowerCase()) : [];
  const i = correos.indexOf(String(usuario.correo).toLowerCase());
  if (i === -1) hoja.appendRow(fila);
  else hoja.getRange(i + 2, 1, 1, fila.length).setValues([fila]);
}

// Jefatura ve a todos; un jefe zonal, a su equipo; un vendedor, solo a sí mismo.
function getUbicaciones(usuario) {
  // Siempre con login, aunque EXIGIR_LOGIN siga en false: la ubicación de las personas no es pública.
  if (!usuario) throw new Error('NO_AUTORIZADO: inicia sesión para ver el mapa de vendedores.');
  const hoja = hojaUbicaciones_();
  if (hoja.getLastRow() < 2) return [];
  return hoja.getRange(2, 1, hoja.getLastRow() - 1, 8).getValues()
    .filter(f => f[0] && (esJefatura_(usuario) || estaEnAlcance_(f[1], usuario)))
    .map(f => ({
      vendedor: f[1], lat: f[2], lng: f[3], precision: f[4],
      fecha: f[5] instanceof Date ? f[5].toISOString() : String(f[5]),
      origen: f[6], obra: f[7],
    }));
}

function hojaUbicaciones_() {
  const libro = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO);
  let hoja = libro.getSheetByName(NOMBRE_HOJA_UBICACIONES);
  if (!hoja) {
    hoja = libro.insertSheet(NOMBRE_HOJA_UBICACIONES);
    hoja.getRange(1, 1, 1, 8).setValues([['Correo', 'Vendedor', 'Latitud', 'Longitud', 'Precisión (m)', 'Fecha', 'Origen', 'Obra']])
      .setFontWeight('bold');
    hoja.setFrozenRows(1);
  }
  return hoja;
}

// Agrega a "Registro de Visitas" las columnas de ubicación, si aún no están.
function prepararRegistroConGps_(hojaRegistro) {
  if (!hojaRegistro) return;
  const titulos = ['Latitud', 'Longitud', 'Precisión (m)', 'Distancia a la obra (m)'];
  const actuales = hojaRegistro.getRange(1, 8, 1, 4).getValues()[0];
  if (String(actuales[0]) === titulos[0]) return;
  if (hojaRegistro.getMaxColumns() < 11) hojaRegistro.insertColumnsAfter(hojaRegistro.getMaxColumns(), 11 - hojaRegistro.getMaxColumns());
  hojaRegistro.getRange(1, 8, 1, 4).setValues([titulos]).setFontWeight('bold');
}

// Distancia en metros entre dos puntos (fórmula del haversine).
function distanciaMetros_(lat1, lng1, lat2, lng2) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
