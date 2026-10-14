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

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    let result = {};

    switch (payload.action) {
      case 'getDataByRegion':
        result = getDataByRegion(payload.region);
        break;
      case 'getClientList':
        result = getClientList();
        break;
      case 'editObra':
        result = editObra(payload.id, payload.updates);
        break;
      case 'createNewObra':
        result = createNewObra(payload.data);
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

// --- FUNCIÓN getDataByRegion ---
function getDataByRegion(region) {
  const hoja = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO).getSheetByName(NOMBRE_HOJA_MAESTRA);
  const datos = hoja.getDataRange().getValues();
  const encabezados = datos.shift(); // Quita encabezados
  
  const colRegionIndex = encabezados.indexOf("Región");
  if (colRegionIndex === -1) {
    throw new Error("No se encontró la columna 'Región' en la hoja Consolidado.");
  }

  const datosFiltrados = datos.filter(fila => mismaRegion(fila[colRegionIndex], region));

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
function editObra(id, updates) {
  if (!id) throw new Error("No se proporcionó un ID para editar.");

  // Evita que dos vendedores guardando a la vez se pisen la fila o el registro.
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return editObraSinLock_(id, updates || {});
  } finally {
    lock.releaseLock();
  }
}

function editObraSinLock_(id, updates) {
  const hoja = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO).getSheetByName(NOMBRE_HOJA_MAESTRA);
  const datos = hoja.getDataRange().getValues();
  const encabezados = datos[0];
  
  const filaIndex = datos.slice(1).findIndex(fila => String(fila[COL_ID - 1]) === String(id));

  if (filaIndex === -1) throw new Error(`ID ${id} no encontrado.`);
  
  const filaNumeroReal = filaIndex + 2; 

  // Actualizar la hoja "Consolidado"
  for (const key in updates) {
    if (COLUMNAS_PROTEGIDAS.indexOf(key) !== -1) continue;
    const colIndex = encabezados.indexOf(key);
    if (colIndex !== -1) {
      hoja.getRange(filaNumeroReal, colIndex + 1).setValue(updates[key]);
    }
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
    
    hojaRegistro.appendRow([
      id,
      filaActualizada[colEmpresaIndex],
      filaActualizada[colObraPdvIndex],
      filaActualizada[colVendedorIndex],
      fechaActual,
      comentarios,
      estado // Añadido al registro
    ]);
  } catch(e) {
    Logger.log("No se pudo escribir en el registro de visitas. " + e.toString());
  }

  return { message: "Actualización exitosa" };
}

// --- FUNCIÓN createNewObra ---
function createNewObra(data) {
  // Sin lock, dos altas simultáneas leen el mismo máximo y generan el mismo ID.
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return createNewObraSinLock_(data || {});
  } finally {
    lock.releaseLock();
  }
}

function createNewObraSinLock_(data) {
  const obligatorios = ['Empresa', 'Obra / PDV', 'Vendedor', 'Canal', 'Comuna'];
  const faltantes = obligatorios.filter(c => !String(data[c] || '').trim());
  if (faltantes.length) throw new Error('Faltan campos obligatorios: ' + faltantes.join(', '));

  const hoja = SpreadsheetApp.openById(ID_HOJA_CONSOLIDADO).getSheetByName(NOMBRE_HOJA_MAESTRA);
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