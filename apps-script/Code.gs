// ========= CONFIGURACIÓN HOJA MAESTRA =========
const ID_HOJA_CONSOLIDADO = "1Am-KA1ziov7xUdpIvaHvpElWLR2aglcmpQTkjNoSyH4"; // Reemplaza con el ID real de tu Google Sheet
const NOMBRE_HOJA_MAESTRA = "Consolidado";
const NOMBRE_HOJA_REGISTRO = "Registro de Visitas";
const NOMBRE_HOJA_CLIENTES = "Clientes";

// --- Columnas Clave ---
const COL_ID = 1; // Columna A
const COL_EMPRESA = 2; // Columna B
const COL_OBRA_PDV = 3; // Columna C
const COL_VENDEDOR = 4; // Columna D
const COL_REGION = 7; // Columna G
const COL_ULTIMA_ACTUALIZACION = 11; // Columna K (Ajusta si cambió)

// Columnas que nunca se pueden sobrescribir desde la app.
const COLUMNAS_PROTEGIDAS = ['ID', 'Orden'];
// Columnas que solo jefatura puede cambiar (un vendedor no puede pasarse obras ni cambiar el historial).
const COLUMNAS_SOLO_JEFATURA = ['Vendedor', 'Historial de ejecutivos'];

// ========= LOGIN (misma cuenta de la intranet, Firebase "intranatstone") =========
// Clave web pública de Firebase (la misma que usa la intranet en el navegador; no es secreta).
const FIREBASE_API_KEY = "AIzaSyA00y8ajl1ccpRwo8dRjmEbAj5rw1bT9DY";
// Hoja con quién es quién: Correo | Vendedor | Rol | Equipo
//   Rol: "vendedor" (solo sus obras), "jefe zonal" (las suyas y las de su Equipo)
//        o "jefatura" (todo). Equipo: nombres de vendedores separados por coma.
const NOMBRE_HOJA_USUARIOS = "Usuarios";
// Transición: con false, una llamada SIN login sigue funcionando como antes (para no cortar
// la app mientras se publica). Con login, los permisos se aplican siempre.
// Cuando todos los vendedores estén en la hoja Usuarios, cámbialo a true y publica una nueva versión.
const EXIGIR_LOGIN = false;

// =============================================

// Compara regiones sin tildes ni mayúsculas y acepta nombre corto/largo
// ("Aysén" == "Aysén del General Carlos Ibáñez del Campo").
function normalizarTexto(texto) {
  return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}
function mismaRegion(a, b) {
  const x = normalizarTexto(a), y = normalizarTexto(b);
  if (!x || !y) return false;
  return x === y || x.startsWith(y + ' ') || y.startsWith(x + ' ');
}

// ========= USUARIOS Y PERMISOS =========

// Verifica con Google que el token de Firebase es válido y devuelve {correo, vendedor, rol}.
// Sin token devuelve null. Un token falso o vencido lanza NO_AUTORIZADO.
function obtenerUsuario_(idToken) {
  if (!idToken) return null;
  const cache = CacheService.getScriptCache();
  const clave = 'tok_' + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(idToken)));
  const enCache = cache.get(clave);
  if (enCache) return JSON.parse(enCache);

  const resp = UrlFetchApp.fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FIREBASE_API_KEY, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ idToken: String(idToken) }),
      muteHttpExceptions: true
    });
  if (resp.getResponseCode() !== 200) {
    throw new Error('NO_AUTORIZADO: tu sesión venció o no es válida. Vuelve a iniciar sesión.');
  }
  const cuenta = (JSON.parse(resp.getContentText()).users || [])[0];
  if (!cuenta || !cuenta.email || cuenta.disabled) {
    throw new Error('NO_AUTORIZADO: cuenta no válida.');
  }
  const usuario = buscarUsuarioPorCorreo_(cuenta.email);
  if (!usuario) {
    throw new Error('NO_AUTORIZADO: tu correo (' + cuenta.email + ') no está habilitado en el radar. Pide a jefatura que te agregue.');
  }
  cache.put(clave, JSON.stringify(usuario), 600); // 10 minutos
  return usuario;
}

function buscarUsuarioPorCorreo_(correo) {
  const hoja = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO).getSheetByName(NOMBRE_HOJA_USUARIOS);
  if (!hoja || hoja.getLastRow() < 2) return null;
  const filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, Math.max(4, hoja.getLastColumn())).getValues();
  const buscado = String(correo).trim().toLowerCase();
  const fila = filas.find(f => String(f[0]).trim().toLowerCase() === buscado);
  if (!fila || !String(fila[1]).trim()) return null;
  const rolTexto = normalizarTexto(fila[2]);
  const rol = rolTexto === 'jefatura' ? 'jefatura'
    : (rolTexto === 'jefe zonal' || rolTexto === 'jefe_zonal' || rolTexto === 'jefezonal') ? 'jefe zonal'
    : 'vendedor';
  const equipo = rol === 'jefe zonal'
    ? String(fila[3] || '').split(/[,;\n]/).map(n => n.trim()).filter(Boolean)
    : [];
  return { correo: buscado, vendedor: String(fila[1]).trim(), rol: rol, equipo: equipo };
}

function esJefatura_(usuario) {
  return !!usuario && usuario.rol === 'jefatura';
}

// Nombres cuyas obras puede ver y editar: el propio y, si es jefe zonal, los de su equipo.
// "Andres Pacheco" y "Andrés Pacheco" cuentan como la misma persona.
function alcance_(usuario) {
  return [usuario.vendedor].concat(usuario.equipo || []).map(normalizarTexto);
}
function estaEnAlcance_(valorVendedor, usuario) {
  return alcance_(usuario).indexOf(normalizarTexto(valorVendedor)) !== -1;
}

// Sin login (solo en transición) o jefatura: todo. Jefe zonal: las suyas y las de su equipo.
// Vendedor: solo las suyas.
function puedeVerFila_(fila, colVendedor, usuario) {
  if (!usuario || esJefatura_(usuario)) return true;
  return estaEnAlcance_(fila[colVendedor], usuario);
}

// Ejecutar UNA vez a mano desde el editor para dar el permiso de conexión externa
// (el script lo necesita para verificar las sesiones con Google).
function autorizarConexion() {
  UrlFetchApp.fetch('https://www.googleapis.com/discovery/v1/apis', { muteHttpExceptions: true });
  Logger.log('Permiso de conexión listo.');
}

// Ejecutar UNA vez a mano desde el editor: crea la hoja Usuarios con los vendedores del radar.
// Después completa la columna Correo (el mismo correo de la intranet) y pon "jefatura" en tu fila.
function crearHojaUsuarios() {
  const libro = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO);
  if (libro.getSheetByName(NOMBRE_HOJA_USUARIOS)) {
    throw new Error('La hoja Usuarios ya existe; no se modificó.');
  }
  const hojaObras = libro.getSheetByName(NOMBRE_HOJA_MAESTRA);
  const datos = hojaObras.getDataRange().getValues();
  const col = datos[0].indexOf('Vendedor');
  const vistos = {};
  datos.slice(1).forEach(f => {
    const nombre = String(f[col] || '').trim();
    const clave = normalizarTexto(nombre);
    if (nombre && !vistos[clave] && clave !== 'sin asignar' && clave !== 'sin asignacion') vistos[clave] = nombre;
  });
  const hoja = libro.insertSheet(NOMBRE_HOJA_USUARIOS);
  const filas = [['Correo', 'Vendedor', 'Rol', 'Equipo']]
    .concat(Object.keys(vistos).sort().map(k => ['', vistos[k], 'vendedor', '']))
    .concat([['', 'Jefatura', 'jefatura', '']]);
  hoja.getRange(1, 1, filas.length, 4).setValues(filas);
  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, 4).setFontWeight('bold');
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    let result = {};

    const usuario = obtenerUsuario_(payload.idToken);
    if (!usuario && EXIGIR_LOGIN) {
      throw new Error('NO_AUTORIZADO: inicia sesión con tu cuenta de la intranet.');
    }

    switch (payload.action) {
      case 'whoami':
        result = usuario
          ? { vendedor: usuario.vendedor, rol: usuario.rol, correo: usuario.correo, equipo: usuario.equipo || [] }
          : { vendedor: '', rol: 'sin-login', correo: '' };
        break;
      case 'getAllData':
        result = getAllData(usuario);
        break;
      case 'getDataByRegion': // se mantiene para versiones antiguas de la app
        result = getDataByRegion(payload.region, usuario);
        break;
      case 'getClientList':
        result = getClientList();
        break;
      case 'editObra':
        result = editObra(payload.id, payload.updates, usuario, payload.ubicacion);
        break;
      case 'reportarUbicacion': // la app avisa dónde está el vendedor (mapa.gs)
        result = reportarUbicacion(payload.ubicacion, usuario);
        break;
      case 'getUbicaciones': // última posición de los vendedores, para jefatura (mapa.gs)
        result = getUbicaciones(usuario);
        break;
      case 'createNewObra':
        result = createNewObra(payload.data, usuario);
        break;
      default:
        throw new Error("Acción no reconocida: " + payload.action);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log(error);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// --- FUNCIÓN doGet ---
function doGet(e) {
  // Separé las etiquetas HTML para que el chat no rompa el bloque de código
  var mensaje = "<h1" + ">La API de Cartera Activa está funcionando.<" + "/h1>";
  mensaje += "<p" + ">Esta URL está diseñada para recibir datos (POST) desde la aplicación de React, no para ser visitada directamente (GET).<" + "/p>";
  return HtmlService.createHtmlOutput(mensaje);
}

// --- FUNCIÓN getClientList ---
function getClientList() {
  const hoja = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO).getSheetByName(NOMBRE_HOJA_CLIENTES);
  if (!hoja) return [];
  
  const lastRow = hoja.getLastRow();
  if (lastRow < 2) return [];
  
  // 1. Obtenemos AmBAS columnas (Empresa y RUT, columnas A y B)
  const data = hoja.getRange(2, 1, lastRow - 1, 2).getValues();
  
  // 2. Convertimos a objetos y filtramos filas sin empresa
  const clients = data.map(row => ({ 
    empresa: row[0], 
    rut: row[1] || '' // Aseguramos que rut sea un string, aunque esté vacío
  })).filter(c => c.empresa);
  
  return clients;
}

// --- FUNCIÓN getAllData ---
// Devuelve todas las obras de una vez. Leer la hoja cuesta lo mismo que antes
// (getDataByRegion también la leía completa) y la app filtra localmente.
function getAllData(usuario) {
  const hoja = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO).getSheetByName(NOMBRE_HOJA_MAESTRA);
  const datos = hoja.getDataRange().getValues();
  const encabezados = datos.shift();
  const colVendedor = encabezados.indexOf('Vendedor');
  return datos
    .filter(fila => fila[COL_ID - 1] !== '' && fila[COL_ID - 1] !== null)
    .filter(fila => puedeVerFila_(fila, colVendedor, usuario))
    .map(fila => filaAObjeto_(encabezados, fila));
}

function filaAObjeto_(encabezados, fila) {
  const objeto = {};
  encabezados.forEach((encabezado, i) => {
    if (encabezado !== '') objeto[encabezado] = fila[i];
  });
  return objeto;
}

// --- FUNCIÓN getDataByRegion ---
function getDataByRegion(region, usuario) {
  const hoja = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO).getSheetByName(NOMBRE_HOJA_MAESTRA);
  const datos = hoja.getDataRange().getValues();
  const encabezados = datos.shift(); // Quita encabezados
  
  const colRegionIndex = encabezados.indexOf("Región");
  if (colRegionIndex === -1) {
    throw new Error("No se encontró la columna 'Región' en la hoja Consolidado.");
  }

  const colVendedor = encabezados.indexOf('Vendedor');
  const datosFiltrados = datos.filter(fila =>
    mismaRegion(fila[colRegionIndex], region) && puedeVerFila_(fila, colVendedor, usuario));

  const datosFormateados = datosFiltrados.map(fila => {
    let objetoFila = {};
    encabezados.forEach((encabezado, i) => {
      objetoFila[encabezado] = fila[i];
    });
    return objetoFila;
  });
  
  return datosFormateados;
}

// --- FUNCIÓN editObra ---
function editObra(id, updates, usuario, ubicacion) {
  if (!id) throw new Error("No se proporcionó un ID para editar.");

  // Evita que dos vendedores guardando a la vez se pisen la fila o el registro.
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return editObraSinLock_(id, updates || {}, usuario, ubicacion);
  } finally {
    lock.releaseLock();
  }
}

function editObraSinLock_(id, updates, usuario, ubicacion) {
  const hoja = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO).getSheetByName(NOMBRE_HOJA_MAESTRA);
  const datos = hoja.getDataRange().getValues();
  const encabezados = datos[0];
  
  const filaIndex = datos.slice(1).findIndex(fila => String(fila[COL_ID - 1]) === String(id));

  // Para un vendedor, una obra ajena responde igual que una inexistente: no revela que existe.
  const colVendedorFila = encabezados.indexOf('Vendedor');
  if (filaIndex === -1 || !puedeVerFila_(datos[filaIndex + 1], colVendedorFila, usuario)) {
    throw new Error(`La obra ${id} no está en tu cartera.`);
  }
  
  const filaNumeroReal = filaIndex + 2; 

  // Actualizar la hoja "Consolidado"
  for (const key in updates) {
    if (COLUMNAS_PROTEGIDAS.indexOf(key) !== -1) continue;
    if (usuario && !esJefatura_(usuario) && COLUMNAS_SOLO_JEFATURA.indexOf(key) !== -1) continue;
    const colIndex = encabezados.indexOf(key);
    if (colIndex !== -1) {
      hoja.getRange(filaNumeroReal, colIndex + 1).setValue(updates[key]);
    }
  }
  
  // Si cambió la dirección y no viene una ubicación GPS, se vuelve a ubicar la obra en el mapa.
  const cambioDireccion = ['Dirección', 'Comuna', 'Región'].some(k => k in updates);
  if (cambioDireccion && !('Latitud' in updates)) {
    try { ubicarFilaEnMapa_(hoja, filaNumeroReal); } catch (e) { Logger.log('No se pudo ubicar en el mapa: ' + e); }
  }

  const fechaActual = new Date();
  const colUltimaActualizacion = encabezados.indexOf('Última Actualización');
   if (colUltimaActualizacion !== -1) {
    hoja.getRange(filaNumeroReal, colUltimaActualizacion + 1).setValue(fechaActual);
  }

  // Registrar la visita (MODIFICADO PARA INCLUIR ESTADO Y PRÓXIMOS PASOS)
  try {
    const hojaRegistro = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO).getSheetByName(NOMBRE_HOJA_REGISTRO);
    const filaActualizada = hoja.getRange(filaNumeroReal, 1, 1, encabezados.length).getValues()[0];
    
    const colEmpresaIndex = encabezados.indexOf('Empresa');
    const colObraPdvIndex = encabezados.indexOf('Obra / PDV');
    const colVendedorIndex = encabezados.indexOf('Vendedor');
    
    // CORREGIDO: Ahora busca la columna 'Próximos Pasos' en lugar de 'Comentarios Última Visita'
    const colComentariosIndex = encabezados.indexOf('Próximos Pasos'); 
    // CORREGIDO: Ahora busca la columna 'Estado de Obra' en lugar de 'Estado'
    const colEstadoIndex = encabezados.indexOf('Estado de Obra'); 

    // CORREGIDO: Captura la actualización enviada desde React o el dato que ya existía
    const comentarios = updates['Próximos Pasos'] || (colComentariosIndex !== -1 ? filaActualizada[colComentariosIndex] : '');
    const estado = updates['Estado de Obra'] || (colEstadoIndex !== -1 ? filaActualizada[colEstadoIndex] : '');
    
    // Dónde estaba el vendedor al registrar la visita y a qué distancia de la obra (mapa.gs).
    const gps = ubicacionValida_(ubicacion);
    const latObra = Number(filaActualizada[encabezados.indexOf('Latitud')]);
    const lngObra = Number(filaActualizada[encabezados.indexOf('Longitud')]);
    const distancia = gps && latObra && lngObra ? Math.round(distanciaMetros_(gps.lat, gps.lng, latObra, lngObra)) : '';
    prepararRegistroConGps_(hojaRegistro);
    hojaRegistro.appendRow([
      id,
      filaActualizada[colEmpresaIndex],
      filaActualizada[colObraPdvIndex],
      usuario ? usuario.vendedor : filaActualizada[colVendedorIndex], // quién registró la visita
      fechaActual,
      comentarios,
      estado, // Añadido al registro
      gps ? gps.lat : '',
      gps ? gps.lng : '',
      gps ? gps.precision : '',
      distancia
    ]);
    if (gps && usuario) guardarUbicacion_(usuario, gps, 'Visita', filaActualizada[colObraPdvIndex]);
  } catch(e) {
    Logger.log("No se pudo escribir en el registro de visitas. " + e.toString());
  }

  // Devuelve la fila ya guardada para que la app la actualice sin recargar todo.
  const filaFinal = hoja.getRange(filaNumeroReal, 1, 1, encabezados.length).getValues()[0];
  return { message: "Actualización exitosa", row: filaAObjeto_(encabezados, filaFinal) };
}

// --- FUNCIÓN createNewObra ---
function createNewObra(data, usuario) {
  // Sin lock, dos altas simultáneas leen el mismo máximo y generan el mismo ID.
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return createNewObraSinLock_(data || {}, usuario);
  } finally {
    lock.releaseLock();
  }
}

// Busca una obra ya registrada: mismo RUT (o misma empresa si no hay RUT) y
// mismo nombre de obra, o misma dirección en la misma comuna.
function buscarObraRepetida_(datos, encabezados, data) {
  const c = nombre => encabezados.indexOf(nombre);
  const rutDe = v => String(v || '').replace(/[^0-9kK]/g, '').toUpperCase();
  const rut = rutDe(data['Rut Empresa']);
  const empresa = normalizarTexto(data['Empresa']);
  const obra = normalizarTexto(data['Obra / PDV']);
  const dir = normalizarTexto(data['Dirección']);
  const comuna = normalizarTexto(data['Comuna']);
  return datos.slice(1).find(f => {
    const mismoDueno = rut.length >= 7
      ? rutDe(f[c('Rut Empresa')]) === rut
      : normalizarTexto(f[c('Empresa')]) === empresa;
    if (!mismoDueno) return false;
    const mismaObra = obra && normalizarTexto(f[c('Obra / PDV')]) === obra;
    const mismaDir = dir && normalizarTexto(f[c('Dirección')]) === dir && normalizarTexto(f[c('Comuna')]) === comuna;
    return mismaObra || mismaDir;
  }) || null;
}

function createNewObraSinLock_(data, usuario) {
  // Jefatura asigna a cualquiera; un jefe zonal a sí mismo o a su equipo; un vendedor, solo a sí mismo.
  if (usuario && !esJefatura_(usuario) && !estaEnAlcance_(data['Vendedor'], usuario)) {
    data['Vendedor'] = usuario.vendedor;
  }

  const obligatorios = ['Empresa', 'Obra / PDV', 'Vendedor', 'Canal', 'Región', 'Comuna'];
  const faltantes = obligatorios.filter(c => !String(data[c] || '').trim());
  if (faltantes.length) throw new Error('Faltan campos obligatorios: ' + faltantes.join(', '));

  const hoja = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO).getSheetByName(NOMBRE_HOJA_MAESTRA);

  const todo = hoja.getDataRange().getValues();
  const repetida = buscarObraRepetida_(todo, todo[0], data);
  if (repetida) {
    const idRep = repetida[COL_ID - 1];
    const duenoRep = repetida[todo[0].indexOf('Vendedor')];
    if (!usuario || esJefatura_(usuario)) {
      throw new Error(`Esa obra ya existe: ${idRep} (${duenoRep}).`);
    }
    if (estaEnAlcance_(duenoRep, usuario)) {
      throw new Error(`Esa obra ya está registrada: ${idRep} (${duenoRep}).`);
    }
    throw new Error(`Esa obra ya está registrada con otro vendedor (${idRep}). Si te corresponde, pide a jefatura que te la asigne.`);
  }

  const todosLosIds = hoja.getRange(2, COL_ID, Math.max(hoja.getLastRow() - 1, 1), 1).getValues().flat();
  
  let maxNumero = 0;
  todosLosIds.forEach(id => {
    if (typeof id === 'string' && id.length > 1) {
      const match = id.match(/\d+$/);
      if (match) {
        const numero = parseInt(match[0], 10);
        if (!isNaN(numero) && numero > maxNumero) {
          maxNumero = numero;
        }
      }
    }
  });
  
  const nuevoNumero = maxNumero + 1;
  const canal = data['Canal'] || '';
  let prefijo = 'X'; 

  const canalNormalizado = canal.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  if (canalNormalizado.includes('constructora')) { prefijo = 'c'; }
  else if (canalNormalizado.includes('ferreteria')) { prefijo = 'f'; }
  else if (canalNormalizado.includes('distribuidor')) { prefijo = 'd'; }
  else if (canalNormalizado.includes('especialista')) { prefijo = 'e'; }
  else if (canalNormalizado.includes('instalador')) { prefijo = 'i'; }
  else if (canalNormalizado.includes('e-commerce')) { prefijo = 'w'; }
  else if (canalNormalizado.includes('industrial')) { prefijo = 'n'; }
  
  const nuevoId = prefijo + nuevoNumero;
  
  const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  const nuevaFila = encabezados.map(encabezado => {
    if (encabezado === 'ID') return nuevoId;
    if (encabezado === 'Última Actualización') return new Date();
    return data[encabezado] || '';
  });
  
  hoja.appendRow(nuevaFila);
  SpreadsheetApp.flush();

  // Ubicar la obra nueva en el mapa (si el vendedor no mandó su GPS desde la obra).
  if (!data['Latitud']) {
    try {
      const filaNueva = hoja.getLastRow();
      ubicarFilaEnMapa_(hoja, filaNueva);
      const ubicada = hoja.getRange(filaNueva, 1, 1, encabezados.length).getValues()[0];
      ['Latitud', 'Longitud', 'Ubicación en mapa'].forEach(k => {
        const i = encabezados.indexOf(k);
        if (i !== -1) nuevaFila[i] = ubicada[i];
      });
    } catch (e) { Logger.log('No se pudo ubicar en el mapa: ' + e); }
  }

  const nuevaFilaObjeto = {};
  encabezados.forEach((encabezado, i) => {
    nuevaFilaObjeto[encabezado] = nuevaFila[i];
  });
  
  // --- NUEVO: REGISTRAR LA CREACIÓN EN EL HISTORIAL ---
  try {
    const hojaRegistro = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO).getSheetByName(NOMBRE_HOJA_REGISTRO);
    hojaRegistro.appendRow([
      nuevoId,
      nuevaFilaObjeto['Empresa'] || '',
      nuevaFilaObjeto['Obra / PDV'] || '',
      nuevaFilaObjeto['Vendedor'] || '',
      new Date(),
      // CORREGIDO: Ahora registra 'Próximos Pasos'
      nuevaFilaObjeto['Próximos Pasos'] || 'Creación de registro',
      // CORREGIDO: Ahora registra 'Estado de Obra'
      nuevaFilaObjeto['Estado de Obra'] || '' 
    ]);
  } catch(e) {
    Logger.log("No se pudo escribir en el registro de visitas al crear. " + e.toString());
  }
  // ----------------------------------------------------

  return nuevaFilaObjeto;
}
