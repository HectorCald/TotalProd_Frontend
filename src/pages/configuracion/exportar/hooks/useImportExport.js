import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { TYPE_ID, buildColumnsAG, COLUMNS_MP } from '../utils/columnsConfig';

/**
 * Descarga una plantilla Excel basada en el tipo y las columnas.
 * La celda A1 contiene el identificador de tipo (AG o MP).
 */
export function downloadTemplate({ tipo, columns }) {
  // Excluir columnas de precios (se gestionan desde la API, no en el Excel) y excluir ID oculto
  const templateColumns = columns.filter((c) => !c.priceTypeId && c.key !== 'id');
  const headers = templateColumns.map((c) => c.key);
  const typeRow = [tipo, ...Array(headers.length - 1).fill('')];
  const headerRow = headers;

  const ws = XLSX.utils.aoa_to_sheet([typeRow, headerRow]);

  // Estilos básicos de ancho
  ws['!cols'] = headers.map(() => ({ wch: 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');

  const filename = `plantilla_${tipo === TYPE_ID.AG ? 'almacen_general' : 'materia_prima'}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Exporta un listado de productos a un Excel con las columnas mapeadas.
 */
export function exportDataToExcel({ tipo, columns, rowsData }) {
  // Las columnas configuradas, en el mismo orden
  const headers = columns.map((c) => c.key);
  const typeRow = [tipo, ...Array(headers.length - 1).fill('')];
  const headerRow = headers;

  // Mapeamos los datos para que coincidan con las llaves
  const dataRows = rowsData.map(rowObj => {
    return headers.map(key => rowObj[key] !== undefined ? rowObj[key] : '');
  });

  const ws = XLSX.utils.aoa_to_sheet([typeRow, headerRow, ...dataRows]);

  // Estilos básicos de ancho
  ws['!cols'] = headers.map(() => ({ wch: 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');

  const filename = `exportacion_${tipo === TYPE_ID.AG ? 'almacen_general' : 'materia_prima'}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Lee un archivo Excel y retorna { detectedType, rows }.
 * La celda A1 indica el tipo (AG o MP).
 * La fila 2 tiene los headers.
 * Las filas 3+ son datos.
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (!aoa || aoa.length < 2) {
          return resolve({ detectedType: null, rows: [] });
        }

        const detectedType = String(aoa[0][0] || '').toUpperCase().trim();
        if (detectedType !== TYPE_ID.AG && detectedType !== TYPE_ID.MP) {
          return reject(new Error('El archivo seleccionado no cumple con el formato requerido.'));
        }

        const headers = aoa[1].map((h) => String(h).trim());

        const rows = aoa.slice(2).map((rawRow) => {
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = rawRow[i] !== undefined ? String(rawRow[i]) : '';
          });
          return obj;
        }).filter((row) => Object.values(row).some((v) => v !== ''));

        resolve({ detectedType, rows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Construye las columnas de Tabla compatibles con renderCell editable.
 */
export function buildTablaColumns(columns, options) {
  return columns.map((col) => ({
    header: col.label,
    accessor: col.key,
    colConfig: col,
    options: col.optionsKey ? (options[col.optionsKey] || []) : [],
  }));
}
