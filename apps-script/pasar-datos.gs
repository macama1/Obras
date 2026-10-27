// Menú "✨ Herramientas" > "Mover Datos a Consolidado".
// Pasa a Consolidado las filas de "No Asignadas" que ya tienen vendedor.
// Arreglo: antes copiaba la fila por posición y, como las dos hojas no tienen las mismas columnas
// (No Asignadas tiene "Observaciones de Compra" y "M²"), las filas llegaban corridas
// (la dirección en RUT, el RUT en Acciones...). Ahora copia por nombre de columna.
// También compara el AID con la columna AID de Consolidado (antes miraba Monto Presupuesto).
function moverNoAsignadasAConsolidado() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const baseSheet = ss.getSheetByName('No Asignadas');
  const consolidadoSheet = ss.getSheetByName('Consolidado');
  const ui = SpreadsheetApp.getUi();

  if (!baseSheet || !consolidadoSheet) {
    ui.alert('Error: Asegúrate de que existan las hojas "No Asignadas" y "Consolidado".');
    return;
  }

  const encCon = consolidadoSheet.getRange(1, 1, 1, consolidadoSheet.getLastColumn()).getValues()[0].map(String);
  const encBase = baseSheet.getRange(1, 1, 1, baseSheet.getLastColumn()).getValues()[0].map(String);
  const cCon = n => encCon.indexOf(n), cBase = n => encBase.indexOf(n);

  // --- Cargar datos existentes en Consolidado ---
  const lastRowCon = consolidadoSheet.getLastRow();
  const dataCon = (lastRowCon > 1)
    ? consolidadoSheet.getRange(2, 1, lastRowCon - 1, consolidadoSheet.getLastColumn()).getValues()
    : [];

  const existingAIDs = new Set();
  const existingDirecciones = new Set();
  dataCon.forEach(row => {
    const direccion = row[cCon('Dirección')];
    const aid = row[cCon('AID')];
    if (aid) existingAIDs.add(String(aid));
    if (direccion) existingDirecciones.add(direccion);
  });

  // --- Buscar el ID más alto para continuar la numeración ---
  let maxNumero = 0;
  dataCon.forEach(r => {
    const m = String(r[0]).match(/\d+$/);
    if (m) maxNumero = Math.max(maxNumero, parseInt(m[0], 10));
  });
  let nextID = maxNumero;

  // Última fila con código en Consolidado (las filas vacías de más abajo no cuentan).
  let ultimaCon = dataCon.length;
  while (ultimaCon > 0 && !String(dataCon[ultimaCon - 1][0]).trim()) ultimaCon--;

  // --- Cargar datos de No Asignadas ---
  const lastRowBase = baseSheet.getLastRow();
  if (lastRowBase < 2) {
    ui.alert('La hoja "No Asignadas" no tiene datos.');
    return;
  }
  const dataBase = baseSheet.getRange(2, 1, lastRowBase - 1, baseSheet.getLastColumn()).getValues();

  const rowsToMove = [];
  const rowsToKeep = [];
  dataBase.forEach(row => {
    const vendedor = row[cBase('Vendedor')];
    const estado = row[cBase('Estado de Obra')];
    const estadoX = row[23];             // Columna X (se mantiene la regla original)
    const direccion = row[cBase('Dirección')];
    const aid = row[cBase('AID')];

    const esDuplicado = (aid && existingAIDs.has(String(aid))) ||
                        (direccion && existingDirecciones.has(direccion));

    const cumpleCondicion =
      vendedor &&
      vendedor !== 'Sin Asignación' &&
      vendedor !== 'Asignable' &&
      vendedor !== 'Sin Cobertura' &&
      estado !== 'Terminada' &&
      estado !== 'Repetida' &&
      estadoX !== 'Desechada/Terminada' &&
      !esDuplicado;

    if (cumpleCondicion) rowsToMove.push(row);
    else rowsToKeep.push(row);
  });

  if (rowsToMove.length > 0) {
    // Convertir cada fila a las columnas de Consolidado, con código nuevo.
    let ancho = encCon.length;
    while (ancho > 0 && !encCon[ancho - 1]) ancho--;
    const filas = rowsToMove.map(row => {
      const f = filaParaConsolidado_(row, encBase, encCon).slice(0, ancho);
      nextID++;
      f[0] = 'c' + nextID;
      const orden = cCon('Orden');
      if (orden !== -1 && orden < ancho) f[orden] = '';
      return f;
    });
    consolidadoSheet.getRange(ultimaCon + 2, 1, filas.length, ancho).setValues(filas);

    // Limpiar "No Asignadas" y reescribir las que quedan.
    baseSheet.getRange(2, 1, lastRowBase - 1, baseSheet.getLastColumn()).clearContent();
    SpreadsheetApp.flush();
    Utilities.sleep(500);
    if (rowsToKeep.length > 0) {
      baseSheet.getRange(2, 1, rowsToKeep.length, rowsToKeep[0].length).setValues(rowsToKeep);
    }

    ui.alert(`${rowsToMove.length} fila(s) movidas correctamente a "Consolidado".`);
  } else {
    ui.alert('No hay filas que cumplan las condiciones para ser movidas.');
  }
}
