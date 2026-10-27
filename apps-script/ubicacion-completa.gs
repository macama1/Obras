// Menú "✨ Herramientas" > "Generar ubicación completa".
// Busca las columnas por su nombre. Si la hoja ya no tiene "Ubicación Completa", no hace nada
// (antes escribía siempre en la columna Q y, sin esa columna, pisaba el RUT).
function generarUbicacionCompleta() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return;
  const enc = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map(String);
  const cUbi = enc.indexOf('Ubicación Completa'), cReg = enc.indexOf('Región'), cCom = enc.indexOf('Comuna'), cDir = enc.indexOf('Dirección');
  if (cUbi === -1 || cReg === -1 || cCom === -1 || cDir === -1) {
    SpreadsheetApp.getUi().alert('Esta hoja no tiene la columna "Ubicación Completa" (o le falta Región, Comuna o Dirección). No se cambió nada.');
    return;
  }
  const datos = hoja.getRange(2, 1, ultimaFila - 1, hoja.getLastColumn()).getValues();
  const ubicaciones = datos.map(f => {
    const direccion = f[cDir], comuna = f[cCom], region = f[cReg];
    return [(direccion && comuna && region) ? `${direccion} | ${comuna} | ${region} | Chile` : ''];
  });
  hoja.getRange(2, cUbi + 1, ubicaciones.length, 1).setValues(ubicaciones);
}
