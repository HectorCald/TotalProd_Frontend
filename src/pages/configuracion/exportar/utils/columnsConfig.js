/**
 * Configuración de columnas para importar/exportar.
 * "select" usa options cargadas dinámicamente.
 * "number" usa Input tipo number.
 * "text"   usa Input tipo text.
 *
 * Los campos excluidos del Excel:
 *   - AG: receta, id
 *   - MP: receta, id
 */

export const TYPE_ID = {
  AG: 'AG',
  MP: 'MP',
};

// Columnas base de Almacén General (sin precios dinámicos)
export const COLUMNS_AG_BASE = [
  { key: 'id',            label: 'ID (Oculto)',     type: 'text',   required: false, readOnly: true },
  { key: 'name',          label: 'Nombre',          type: 'text',   required: true  },
  { key: 'description',   label: 'Descripción',     type: 'text',   required: false },
  { key: 'stock',         label: 'Stock',           type: 'number', required: true  },
  { key: 'stock_minimo',  label: 'Stock Mínimo',    type: 'number', required: false },
  { key: 'codigo_barras', label: 'Código de Barras',type: 'text',   required: false },
  { key: 'grup',          label: 'Grupo',           type: 'number', required: false },
  { key: 'category_ids',  label: 'Categorías',      type: 'multiselect', required: false, optionsKey: 'categorias_ag' },
];

// Columnas de Materia Prima
export const COLUMNS_MP = [
  { key: 'id',                label: 'ID (Oculto)',  type: 'text',   required: false, readOnly: true },
  { key: 'name',              label: 'Nombre',       type: 'text',   required: true  },
  { key: 'description',       label: 'Descripción',  type: 'text',   required: false },
  { key: 'quantity',          label: 'Cantidad',     type: 'number', required: true  },
  { key: 'stock_minimo',      label: 'Stock Mínimo', type: 'number', required: false },
  { key: 'type_measure_id',   label: 'Unidad',       type: 'select', required: true,  optionsKey: 'medidas'       },
  { key: 'category_id',       label: 'Categoría',    type: 'select', required: false, optionsKey: 'categorias_mp' },
];

/**
 * Construye las columnas finales para AG incluyendo los precios dinámicos.
 * @param {Array} preciosTipos - [{id, name}]
 * @returns {Array} columnas completas
 */
export function buildColumnsAG(preciosTipos = []) {
  const priceColumns = preciosTipos.map((pt) => ({
    key:      `precio_${pt.id}`,
    label:    pt.name,
    type:     'number',
    required: true,
    priceTypeId: pt.id,
  }));
  return [...COLUMNS_AG_BASE, ...priceColumns];
}

/**
 * Construye un objeto de fila vacía para AG.
 */
export function emptyRowAG(preciosTipos = []) {
  const row = {
    id: '', name: '', description: '', stock: '', stock_minimo: '',
    codigo_barras: '', grup: '', category_ids: [],
  };
  preciosTipos.forEach((pt) => { row[`precio_${pt.id}`] = ''; });
  return row;
}

/**
 * Construye un objeto de fila vacía para MP.
 */
export function emptyRowMP() {
  return {
    id: '', name: '', description: '', quantity: '',
    stock_minimo: '', type_measure_id: '', category_id: '',
  };
}
