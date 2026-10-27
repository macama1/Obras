// Menú "✨ Herramientas" > "Importar Ondac Iconstruye".
// Copia de "Traspasadas" a "No Asignadas" las obras que no están, por NOMBRE de columna
// (las dos hojas no tienen las mismas columnas), y después asigna solas las de clientes con cartera.
function copiarYLimpiarTraspasar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetOrigen = ss.getSheetByName("Traspasadas");
  const sheetDestino = ss.getSheetByName("No Asignadas");

  if (!sheetOrigen || !sheetDestino) {
    SpreadsheetApp.getUi().alert("Error: No se encontró la hoja 'Traspasadas' o 'No Asignadas'.");
    return;
  }

  const encOrigen = sheetOrigen.getRange(1, 1, 1, sheetOrigen.getLastColumn()).getValues()[0].map(String);
  const encDestino = sheetDestino.getRange(1, 1, 1, sheetDestino.getLastColumn()).getValues()[0].map(String);
  const datosOrigen = sheetOrigen.getLastRow() > 1
    ? sheetOrigen.getRange(2, 1, sheetOrigen.getLastRow() - 1, sheetOrigen.getLastColumn()).getValues() : [];
  const datosDestino = sheetDestino.getLastRow() > 1
    ? sheetDestino.getRange(2, 1, sheetDestino.getLastRow() - 1, sheetDestino.getLastColumn()).getValues() : [];

  // Valores ya existentes en No Asignadas (para evitar duplicados): obra, dirección y AID.
  const col = (enc, n) => enc.indexOf(n);
  const setDe = n => new Set(datosDestino.map(r => r[col(encDestino, n)]).filter(v => v !== "" && v !== undefined));
  const setObra = setDe('Obra / PDV'), setDir = setDe('Dirección'), setAid = setDe('AID');

  const filasParaAgregar = [];
  datosOrigen.forEach(fila => {
    const obra = fila[col(encOrigen, 'Obra / PDV')], dir = fila[col(encOrigen, 'Dirección')], aid = fila[col(encOrigen, 'AID')];
    if (!obra && !dir) return;
    const existe = (obra && setObra.has(obra)) || (dir && setDir.has(dir)) || (aid && setAid.has(aid));
    if (existe) return;
    const nueva = filaParaConsolidado_(fila, encOrigen, encDestino);
    // "Comentarios Última Visita" de Traspasadas va a "Próximos Pasos".
    const cCom = col(encOrigen, 'Comentarios Última Visita'), cProx = col(encDestino, 'Próximos Pasos');
    if (cCom !== -1 && cProx !== -1 && !nueva[cProx]) nueva[cProx] = fila[cCom];
    filasParaAgregar.push(nueva);
  });

  if (filasParaAgregar.length > 0) {
    sheetDestino
      .getRange(sheetDestino.getLastRow() + 1, 1, filasParaAgregar.length, encDestino.length)
      .setValues(filasParaAgregar);
  }

  // Asignar solas las obras de clientes que ya tienen vendedor en la región (asignacion.gs).
  let resultadoAsignacion = '';
  try { resultadoAsignacion = asignarPorCartera(); } catch (e) { resultadoAsignacion = 'No se pudo asignar por cartera: ' + e.message; }

  // -----------------------------------------
  // 🔥 BORRAR LA HOJA "Traspasar" DEL OTRO ARCHIVO
  // -----------------------------------------
  const ID_EXTERNO = "1c-U4u_jNz3dHZXQC06S2Q_PE0HiSCfMueGbIcWeSidw";
  const ssExterno = SpreadsheetApp.openById(ID_EXTERNO);
  const sheetTraspasar = ssExterno.getSheetByName("Traspasar");

  if (!sheetTraspasar) {
    SpreadsheetApp.getUi().alert("⚠ No se encontró la hoja 'Traspasar' en el archivo externo.\n\n" + resultadoAsignacion);
    return;
  }
  if (sheetTraspasar.getLastRow() > 1) {
    sheetTraspasar.getRange(2, 1, sheetTraspasar.getLastRow() - 1, sheetTraspasar.getLastColumn()).clearContent();
  }

  SpreadsheetApp.getUi().alert(
    "Proceso terminado.\n" +
    "Filas copiadas: " + filasParaAgregar.length +
    "\nContenido de 'Traspasar' eliminado." +
    "\n\n" + resultadoAsignacion
  );
}
