import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import MenuSide from '../../../components/essentials/MenuSide';
import layoutStyles from '../../../modules/home/View.module.css';
import InputSelect from '../../../components/common/inputs/InputSelect';
import InputSelectMultiple from '../../../components/common/inputs/InputSelectMultiple';
import Boton from '../../../components/common/botones/Boton';
import BotonIcon from '../../../components/common/botones/BotonIcon';
import LayoutPercentage from '../../../components/layout/LayoutPercentage';
import TablaEditable from '../../../components/common/information/TablaEditable';
import Mensaje from '../../../components/common/outputs/Mensaje';
import ConfirmarImportar from './modals/ConfirmarImportar';
import { useToast } from '../../../context/ToastContext';
import useSessionCache from '../../../hooks/useSessionCache';
import useVirtualPagination from '../../../hooks/useVirtualPagination';

import categoryAlmacenService from '../../../services/categoryAlmacenService';
import categoryAcopioService from '../../../services/categoryAcopioService';
import typeMeasureService from '../../../services/typeMeasureService';
import pricesTypesService from '../../../services/pricesTypesService';
import productsAlmacenService from '../../../services/productsAlmacenService';
import productsAcopioService from '../../../services/productsAcopioService';

import {
  TYPE_ID,
  buildColumnsAG,
  COLUMNS_MP,
  emptyRowAG,
  emptyRowMP,
} from './utils/columnsConfig';
import { downloadTemplate, parseExcelFile, buildTablaColumns, exportDataToExcel } from './hooks/useImportExport';

const TIPO_OPTIONS = [
  { value: TYPE_ID.AG, label: 'Almacén General' },
  { value: TYPE_ID.MP, label: 'Materia Prima' },
];

const Exportar = () => {
  const { isLargeScreen } = useLayout();
  const { showDanger, showSuccess, showWarning } = useToast();

  /* ── Tipo de almacén (compartido entre importar y exportar) ── */
  const [tipoAlmacen, setTipoAlmacen] = useState(TYPE_ID.AG);
  const [selectedFields, setSelectedFields] = useState(['name']);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isLocalEdit, setIsLocalEdit] = useState(false);
  const fileInputRef = useRef(null);

  /* ── Catálogos dinámicos ── */
  const { value: categoriasAG, setValue: setCategoriasAG } = useSessionCache({ key: 'categoriasAlmacenListado', defaultValue: [] });
  const { value: categoriasMP, setValue: setCategoriasMP } = useSessionCache({ key: 'categoriasAcopioListado',   defaultValue: [] });
  const { value: medidas,      setValue: setMedidas      } = useSessionCache({ key: 'ListadoTiposMedida',        defaultValue: [] });
  const { value: preciosTipos, setValue: setPreciosTipos } = useSessionCache({ key: 'ListadoTiposPrecios',       defaultValue: [] });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTable, setIsLoadingTable] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        if (categoriasAG.length === 0) {
          const r = await categoryAlmacenService.getAll();
          if (r.success && r.data) setCategoriasAG(r.data);
        }
        if (categoriasMP.length === 0) {
          const r = await categoryAcopioService.getAll();
          if (r.success && r.data) setCategoriasMP(r.data);
        }
        if (medidas.length === 0) {
          const r = await typeMeasureService.getAll();
          if (r.success && r.data) setMedidas(r.data);
        }
        if (preciosTipos.length === 0) {
          const r = await pricesTypesService.getAll();
          if (r.success && r.data) {
            setPreciosTipos(Array.isArray(r.data) ? r.data : [r.data]);
          }
        }
      } catch (err) {
        console.error('Error cargando catálogos:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Opciones para selects de categoría y medida ── */
  const optsCategoriasAG = categoriasAG.map(c => ({ value: c.id, label: c.name }));
  const optsCategoriasMP = categoriasMP.map(c => ({ value: c.id, label: c.name }));
  const optsMedidas      = medidas.map(m => ({ value: m.id, label: m.name || m.code || String(m.id) }));

  const catalogOptions = {
    categorias_ag: optsCategoriasAG,
    categorias_mp: optsCategoriasMP,
    medidas:       optsMedidas,
  };

  /* ── Columnas según tipo ── */
  const columns = tipoAlmacen === TYPE_ID.AG
    ? buildColumnsAG(preciosTipos)
    : COLUMNS_MP;

  const availableColumns = columns.filter(c => c.key !== 'id');
  const fieldOptions = availableColumns.map(c => ({
    value: c.key,
    label: c.label
  }));

  const tablaColumns = buildTablaColumns(columns, catalogOptions);

  /* ── Filas importadas ── */
  const [importRows, setImportRows] = useState([]);
  const [rowErrors, setRowErrors]   = useState({});
  const { visibleItems: visibleImportRows, hasMore, loadMore } = useVirtualPagination(importRows, 30);

  // Resetear filas al cambiar tipo manualmente
  const handleTipoChange = useCallback((value) => {
    setTipoAlmacen(value);
    setSelectedFields(['name']);
    setImportRows([]);
    setRowErrors({});
  }, []);

  const handleCellChange = useCallback((rowIdx, key, value) => {
    setImportRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, [key]: value } : r));
    setRowErrors(prev => ({
      ...prev,
      [rowIdx]: { ...(prev[rowIdx] || {}), [key]: false },
    }));
  }, []);

  /* ── Descarga de plantilla ── */
  const handleDownloadTemplate = async () => {
    if (!tipoAlmacen) {
      showDanger(null, 'Debe seleccionar un tipo de almacén para descargar la plantilla.');
      return;
    }
    if (selectedFields.length === 0) {
      showDanger(null, 'Debe seleccionar al menos un campo para descargar la plantilla.');
      return;
    }
    const hasCategory = selectedFields.some(f => f === 'category_ids' || f === 'category_id');
    if (hasCategory) {
      showWarning(null, 'Las categorías no se pueden importar. Si desea modificar debe hacerlo localmente.');
      return;
    }
    let currentPreciosTipos = preciosTipos;
    if (tipoAlmacen === TYPE_ID.AG && (!currentPreciosTipos || currentPreciosTipos.length === 0)) {
      try {
        const r = await pricesTypesService.getAll();
        if (r && r.data) {
          currentPreciosTipos = Array.isArray(r.data) ? r.data : [r.data];
          setPreciosTipos(currentPreciosTipos);
        }
      } catch (e) {
        console.error(e);
      }
    }
    const allCols = tipoAlmacen === TYPE_ID.AG ? buildColumnsAG(currentPreciosTipos) : COLUMNS_MP;
    const templateCols = allCols.filter(c => selectedFields.includes(c.key));
    downloadTemplate({ tipo: tipoAlmacen, columns: templateCols });
  };

  /* ── Lectura de Excel importado ── */
  const handleFileSelect = async (file) => {
    if (!file) return;
    try {
      const { detectedType, rows } = await parseExcelFile(file);
      const newTipo = detectedType && (detectedType === TYPE_ID.MP || detectedType === TYPE_ID.AG) ? detectedType : tipoAlmacen;
      if (detectedType && detectedType !== tipoAlmacen) {
        // Sincronizar tipo con el del archivo
        setTipoAlmacen(newTipo);
      }

      let currentPreciosTipos = preciosTipos;
      if (newTipo === TYPE_ID.AG && (!currentPreciosTipos || currentPreciosTipos.length === 0)) {
        try {
          const r = await pricesTypesService.getAll();
          if (r && r.data) {
            currentPreciosTipos = Array.isArray(r.data) ? r.data : [r.data];
            setPreciosTipos(currentPreciosTipos);
          }
        } catch (e) {
          console.error(e);
        }
      }

      const activeColumns = newTipo === TYPE_ID.AG ? buildColumnsAG(currentPreciosTipos) : COLUMNS_MP;
      const optionsMap = {
        categorias_ag: categoriasAG,
        categorias_mp: categoriasMP,
        medidas: medidas
      };

      // Detectar si el archivo contiene productos con ID
      const hasIds = rows.some(r => {
        const rawId = r.id || r.ID || r.Id || r['ID (Oculto)'] || r['id (oculto)'];
        return rawId && String(rawId).trim() !== '';
      });

      const processedRows = rows.map(row => {
        const rawId = row.id || row.ID || row.Id || row['ID (Oculto)'] || row['id (oculto)'];
        const cleanId = rawId && String(rawId).trim() !== '' ? String(rawId).trim() : null;

        const newRow = { ...row };
        if (cleanId) {
          newRow.id = cleanId;
        } else {
          delete newRow.id;
        }

        activeColumns.forEach(col => {
          if (col.key === 'id') return;

          // Buscar el valor en el archivo row si vino
          let fileVal = row[col.key];
          if (fileVal === undefined || fileVal === '') {
            if (row[col.label] !== undefined && row[col.label] !== '') {
              fileVal = row[col.label];
            } else if (col.priceTypeId) {
              const matchKey = Object.keys(row).find(k => {
                const matchParen = k.match(/\(([^)]+)\)/);
                if (matchParen) {
                  const extractedId = matchParen[1].trim().toLowerCase();
                  if (extractedId === String(col.priceTypeId).trim().toLowerCase()) {
                    return true;
                  }
                }

                const cleanK = k.trim().toLowerCase();
                const cleanLabel = (col.label || '').trim().toLowerCase();
                const cleanPriceId = String(col.priceTypeId).trim().toLowerCase();
                return cleanK === cleanLabel ||
                       cleanK === `precio_${cleanLabel}` ||
                       cleanK === `precio ${cleanLabel}` ||
                       cleanK === `precio_${cleanPriceId}` ||
                       cleanK === cleanPriceId;
              });
              if (matchKey && row[matchKey] !== undefined && row[matchKey] !== '') {
                fileVal = row[matchKey];
              }
            }
          }

          if (fileVal !== undefined && fileVal !== '') {
            if (col.type === 'number') {
              const num = parseFloat(String(fileVal).replace(',', '.'));
              newRow[col.key] = isNaN(num) ? 0 : num;
            } else if (col.type === 'select') {
              const opts = optionsMap[col.optionsKey] || [];
              const matched = opts.find(o => 
                String(o.label).toLowerCase() === String(fileVal).trim().toLowerCase() ||
                String(o.value) === String(fileVal).trim()
              );
              newRow[col.key] = matched ? matched.value : fileVal;
            } else if (col.type === 'multiselect') {
              const opts = optionsMap[col.optionsKey] || [];
              if (typeof fileVal === 'string') {
                const names = fileVal.split(',').map(s => s.trim()).filter(Boolean);
                const matchedIds = names.map(name => {
                  const matched = opts.find(o =>
                    String(o.label).toLowerCase() === name.toLowerCase() ||
                    String(o.value) === name
                  );
                  return matched ? matched.value : null;
                }).filter(Boolean);
                newRow[col.key] = matchedIds;
              } else if (Array.isArray(fileVal)) {
                newRow[col.key] = fileVal;
              }
            } else {
              newRow[col.key] = fileVal;
            }
          } else if (newRow[col.key] === undefined) {
            if (col.type === 'number') newRow[col.key] = 0;
            else if (col.type === 'multiselect') newRow[col.key] = [];
            else newRow[col.key] = '';
          }
        });
        return newRow;
      });

      setIsLocalEdit(hasIds);

      // Auto-seleccionar los campos presentes en el archivo cargado (excluyendo categorías)
      if (rows.length > 0) {
        const fileKeys = Object.keys(rows[0]);
        const hasCategoryInFile = activeColumns.some(col =>
          (col.key === 'category_ids' || col.key === 'category_id') &&
          fileKeys.some(k => k.trim().toLowerCase() === col.key.toLowerCase() || k.trim().toLowerCase() === (col.label || '').trim().toLowerCase())
        );

        if (hasCategoryInFile) {
          showWarning(null, 'Las categorías no se pueden importar. Si desea modificar debe hacerlo localmente.');
        }

        const detectedFields = activeColumns
          .filter(col => col.key !== 'id' && col.key !== 'category_ids' && col.key !== 'category_id')
          .filter(col => {
            return fileKeys.some(k => {
              const cleanK = k.trim().toLowerCase();
              if (cleanK === col.key.toLowerCase()) return true;
              if (cleanK === (col.label || '').trim().toLowerCase()) return true;
              if (col.priceTypeId) {
                const matchParen = k.match(/\(([^)]+)\)/);
                if (matchParen && matchParen[1].trim().toLowerCase() === String(col.priceTypeId).trim().toLowerCase()) return true;
                const cleanLabel = (col.label || '').trim().toLowerCase();
                const cleanPriceId = String(col.priceTypeId).trim().toLowerCase();
                return cleanK === `precio_${cleanLabel}` || cleanK === `precio_${cleanPriceId}` || cleanK === cleanPriceId;
              }
              return false;
            });
          })
          .map(col => col.key);

        if (detectedFields.length > 0) {
          setSelectedFields(detectedFields);
        }
      }

      setImportRows(processedRows);
      setRowErrors({});
    } catch (err) {
      showDanger(null, err.message || 'Archivo no válido');
    } finally {
      setIsLoadingTable(false);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
      e.target.value = null;
    }
  };

  /* ── Limpiar datos subidos ── */
  const handleClear = () => {
    setImportRows([]);
    setRowErrors({});
    setIsLocalEdit(false);
  };

  /* ── Validar y abrir modal de confirmación de importación ── */
  const handleOpenConfirmModal = () => {
    if (selectedFields.length === 0) {
      showDanger(null, 'Debe seleccionar al menos un campo para importar.');
      return;
    }

    const hasCategory = selectedFields.some(f => f === 'category_ids' || f === 'category_id');
    if (!isLocalEdit && hasCategory) {
      showWarning(null, 'Las categorías no se pueden importar. Si desea modificar debe hacerlo localmente.');
      return;
    }

    if (importRows.length === 0) {
      showDanger(null, 'Debe cargar un archivo o registros para importar.');
      return;
    }

    const errors = {};
    let hasErrors = false;

    const activeColumns = (tipoAlmacen === TYPE_ID.AG ? buildColumnsAG(preciosTipos) : COLUMNS_MP)
      .filter(col => selectedFields.includes(col.key));

    importRows.forEach((row, idx) => {
      const rowErrs = {};
      activeColumns.forEach((col) => {
        if (col.required && (row[col.key] === '' || row[col.key] === undefined || row[col.key] === null)) {
          rowErrs[col.key] = true;
          hasErrors = true;
        }
      });
      if (Object.keys(rowErrs).length > 0) errors[idx] = rowErrs;
    });

    if (hasErrors) {
      setRowErrors(errors);
      showDanger(null, 'Revisa las celdas marcadas en rojo antes de continuar.');
      return;
    }

    setIsConfirmModalOpen(true);
  };

  /* ── Exportar Datos ── */
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      showDanger(null, 'Debe seleccionar al menos un campo para exportar.');
      return;
    }

    const hasCategory = selectedFields.some(f => f === 'category_ids' || f === 'category_id');
    if (hasCategory) {
      showWarning(null, 'Las categorías no se pueden importar. Si desea modificar debe hacerlo localmente.');
      return;
    }

    if (tipoAlmacen === TYPE_ID.AG) {
      setIsExporting(true);
      try {
        let currentPreciosTipos = preciosTipos;
        if (!currentPreciosTipos || currentPreciosTipos.length === 0) {
          try {
            const r = await pricesTypesService.getAll();
            if (r && r.data) {
              currentPreciosTipos = Array.isArray(r.data) ? r.data : [r.data];
              setPreciosTipos(currentPreciosTipos);
            }
          } catch (e) {
            console.error(e);
          }
        }

        const res = await productsAlmacenService.getAll(1, 10000);
        
        let rawProducts = [];
        if (Array.isArray(res)) {
           rawProducts = res;
        } else if (res && Array.isArray(res.data)) {
           rawProducts = res.data;
        } else if (res && res.data && Array.isArray(res.data.data)) {
           rawProducts = res.data.data;
        }

        if (res && res.success === false) {
          showDanger(null, res.message || 'Error desconocido.');
        } else if (rawProducts.length > 0) {
          const exportRows = rawProducts.map(p => {
             const row = { id: p.id };
             if (selectedFields.includes('name')) row.name = p.name;
             if (selectedFields.includes('description')) row.description = p.description || '';
             if (selectedFields.includes('stock')) row.stock = p.stock || 0;
             if (selectedFields.includes('stock_minimo')) row.stock_minimo = p.stock_minimo || 0;
             if (selectedFields.includes('codigo_barras')) row.codigo_barras = p.codigo_barras || '';
             if (selectedFields.includes('grup')) row.grup = p.grup || '';
             if (selectedFields.includes('category_ids')) {
               if (p.producto_categoria && Array.isArray(p.producto_categoria) && p.producto_categoria.length > 0) {
                 row.category_ids = p.producto_categoria.map(pc => pc.category_almacen?.name || '').filter(Boolean).join(', ');
               } else if (p.category_names && Array.isArray(p.category_names) && p.category_names.length > 0) {
                 row.category_ids = p.category_names.join(', ');
               } else if (p.category_name) {
                 row.category_ids = p.category_name;
               } else {
                 row.category_ids = '';
               }
             }

             const selectedPriceCols = currentPreciosTipos.filter(pt => selectedFields.includes(`precio_${pt.id}`));
             if (selectedPriceCols.length > 0) {
               const priceList = p.price_product || p.prices || [];
               if (Array.isArray(priceList)) {
                 selectedPriceCols.forEach(pt => {
                   const priceObj = priceList.find(pr =>
                     (pr.price_id && String(pr.price_id) === String(pt.id)) ||
                     (pr.prices_types && String(pr.prices_types.id) === String(pt.id)) ||
                     (pr.price_type_id && String(pr.price_type_id) === String(pt.id))
                   );
                   const val = priceObj ? (priceObj.valor !== undefined ? priceObj.valor : priceObj.price) : 0;
                   row[`precio_${pt.id}`] = (val !== null && val !== undefined && val !== '') ? Number(val) : 0;
                 });
               } else if (typeof priceList === 'object') {
                 selectedPriceCols.forEach(pt => {
                   const val = priceList[pt.id];
                   row[`precio_${pt.id}`] = (val !== null && val !== undefined && val !== '') ? Number(val) : 0;
                 });
               } else {
                 selectedPriceCols.forEach(pt => { row[`precio_${pt.id}`] = 0; });
               }
             }
             return row;
          });

          const allCols = buildColumnsAG(currentPreciosTipos);
          const idCol = allCols.find(c => c.key === 'id') || { key: 'id', label: 'ID' };
          const activeColumns = [idCol, ...allCols.filter(c => selectedFields.includes(c.key) && c.key !== 'id')];
          exportDataToExcel({ tipo: tipoAlmacen, columns: activeColumns, rowsData: exportRows });
          showSuccess(null, `Se exportaron ${exportRows.length} productos.`);
        } else {
          showDanger(null, 'No se pudieron obtener los productos.');
        }
      } catch (err) {
         showDanger(null, err.message);
      } finally {
         setIsExporting(false);
      }
    } else if (tipoAlmacen === TYPE_ID.MP) {
      setIsExporting(true);
      try {
        const res = await productsAcopioService.getAll(1, 10000);
        
        let rawProducts = [];
        if (Array.isArray(res)) {
           rawProducts = res;
        } else if (res && Array.isArray(res.data)) {
           rawProducts = res.data;
        } else if (res && res.data && Array.isArray(res.data.data)) {
           rawProducts = res.data.data;
        }

        if (res && res.success === false) {
          showDanger(null, res.message || 'Error desconocido.');
        } else if (rawProducts.length > 0) {
          const exportRows = rawProducts.map(p => {
            const row = { id: p.id };
            if (selectedFields.includes('name')) row.name = p.name;
            if (selectedFields.includes('description')) row.description = p.description || '';
            if (selectedFields.includes('quantity')) row.quantity = p.quantity || 0;
            if (selectedFields.includes('stock_minimo')) row.stock_minimo = p.stock_minimo || 0;
            if (selectedFields.includes('type_measure_id')) {
              row.type_measure_id = p.type_measure_id ? (medidas.find(m => m.value === p.type_measure_id)?.label || p.type_measure_id) : '';
            }
            if (selectedFields.includes('category_id')) {
              row.category_id = p.category_id ? (categoriasMP.find(c => String(c.value) === String(p.category_id))?.label || p.category_id) : '';
            }
            return row;
          });

          const idCol = COLUMNS_MP.find(c => c.key === 'id') || { key: 'id', label: 'ID' };
          const activeColumns = [idCol, ...COLUMNS_MP.filter(c => selectedFields.includes(c.key) && c.key !== 'id')];
          exportDataToExcel({ tipo: tipoAlmacen, columns: activeColumns, rowsData: exportRows });
          showSuccess(null, `Se exportaron ${exportRows.length} insumos de Materia Prima.`);
        } else {
          showDanger(null, 'No se pudieron obtener los productos de MP.');
        }
      } catch (err) {
         showDanger(null, err.message);
      } finally {
         setIsExporting(false);
      }
    }
  };

  /* ── Modificar Localmente (Cargar productos directamente a la tabla) ── */
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);

  const handleLoadForLocalEdit = async () => {
    if (selectedFields.length === 0) {
      showDanger(null, 'Debe seleccionar al menos un campo para cargar.');
      return;
    }

    setIsLoadingLocal(true);
    setIsLoadingTable(true);
    try {
      if (tipoAlmacen === TYPE_ID.AG) {
        let currentPreciosTipos = preciosTipos;
        if (!currentPreciosTipos || currentPreciosTipos.length === 0) {
          try {
            const r = await pricesTypesService.getAll();
            if (r && r.data) {
              currentPreciosTipos = Array.isArray(r.data) ? r.data : [r.data];
              setPreciosTipos(currentPreciosTipos);
            }
          } catch (e) {
            console.error(e);
          }
        }

        const res = await productsAlmacenService.getAll(1, 10000);
        let rawProducts = [];
        if (Array.isArray(res)) {
          rawProducts = res;
        } else if (res && Array.isArray(res.data)) {
          rawProducts = res.data;
        } else if (res && res.data && Array.isArray(res.data.data)) {
          rawProducts = res.data.data;
        }

        if (res && res.success === false) {
          showDanger(null, res.message || 'Error al obtener productos.');
        } else if (rawProducts.length > 0) {
          const loadedRows = rawProducts.map(p => {
            const row = {
              id: p.id,
              name: p.name || '',
              description: p.description || '',
              stock: p.stock || 0,
              stock_minimo: p.stock_minimo || 0,
              codigo_barras: p.codigo_barras || '',
              grup: p.grup || '',
              category_ids: [],
            };

            if (p.producto_categoria && Array.isArray(p.producto_categoria) && p.producto_categoria.length > 0) {
              row.category_ids = p.producto_categoria.map(pc => pc.categoria_id || pc.category_almacen?.id).filter(Boolean);
            } else if (Array.isArray(p.category_ids)) {
              row.category_ids = p.category_ids;
            } else if (p.category_id) {
              row.category_ids = [p.category_id];
            }

            const priceList = p.price_product || p.prices || [];
            if (Array.isArray(priceList)) {
              currentPreciosTipos.forEach(pt => {
                const priceObj = priceList.find(pr =>
                  (pr.price_id && String(pr.price_id) === String(pt.id)) ||
                  (pr.prices_types && String(pr.prices_types.id) === String(pt.id)) ||
                  (pr.price_type_id && String(pr.price_type_id) === String(pt.id))
                );
                const val = priceObj ? (priceObj.valor !== undefined ? priceObj.valor : priceObj.price) : 0;
                row[`precio_${pt.id}`] = (val !== null && val !== undefined && val !== '') ? Number(val) : 0;
              });
            } else if (typeof priceList === 'object') {
              currentPreciosTipos.forEach(pt => {
                const val = priceList[pt.id];
                row[`precio_${pt.id}`] = (val !== null && val !== undefined && val !== '') ? Number(val) : 0;
              });
            } else {
              currentPreciosTipos.forEach(pt => { row[`precio_${pt.id}`] = 0; });
            }

            return row;
          });

          setImportRows(loadedRows);
          setRowErrors({});
          setIsLocalEdit(true);
          showSuccess(null, `Se cargaron ${loadedRows.length} productos para modificar.`);
        } else {
          showDanger(null, 'No se encontraron productos en el almacén.');
        }
      } else if (tipoAlmacen === TYPE_ID.MP) {
        const res = await productsAcopioService.getAll(1, 10000);
        let rawProducts = [];
        if (Array.isArray(res)) {
          rawProducts = res;
        } else if (res && Array.isArray(res.data)) {
          rawProducts = res.data;
        } else if (res && res.data && Array.isArray(res.data.data)) {
          rawProducts = res.data.data;
        }

        if (res && res.success === false) {
          showDanger(null, res.message || 'Error al obtener insumos de MP.');
        } else if (rawProducts.length > 0) {
          const loadedRows = rawProducts.map(p => ({
            id: p.id,
            name: p.name || '',
            description: p.description || '',
            quantity: p.quantity || 0,
            stock_minimo: p.stock_minimo || 0,
            type_measure_id: p.type_measure_id || '',
            category_id: p.category_id || '',
          }));

          setImportRows(loadedRows);
          setRowErrors({});
          setIsLocalEdit(true);
          showSuccess(null, `Se cargaron ${loadedRows.length} insumos para modificar.`);
        } else {
          showDanger(null, 'No se encontraron insumos de Materia Prima.');
        }
      }
    } catch (err) {
      showDanger(null, err.message || 'Error al cargar productos.');
    } finally {
      setIsLoadingLocal(false);
      setIsLoadingTable(false);
    }
  };

  return (
    <>
      <NavBar />
      <div className={layoutStyles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={layoutStyles.contentArea}>
          <h1 className={layoutStyles.title}>Importar &amp; Exportar</h1>



          <div style={{
            display: 'flex',
            flexDirection: isLargeScreen ? 'row' : 'column',
            gap: '20px',
            width: '100%',
            height: isLargeScreen ? 'calc(100% - 60px)' : 'auto',
            minHeight: 0,
            flexShrink: 0
          }}>

            {/* ── Columna izquierda: TABLA EDITABLE ── */}
            <div style={{
              flex: isLargeScreen ? '65' : 'none',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              minWidth: 0,
              overflow: 'hidden',
              height: isLargeScreen ? '100%' : 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Barra de acciones de la tabla */}
              <div style={{ display: 'flex', flexDirection: isLargeScreen ? 'row' : 'column', justifyContent: isLargeScreen ? 'space-between' : 'flex-start', alignItems: isLargeScreen ? 'center' : 'flex-start', marginBottom: '12px', gap: 12, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', margin: 0, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    Vista Previa y Mapeo
                  </h3>
                  {importRows.length > 0 && (
                    <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {visibleImportRows.length < importRows.length
                        ? `${visibleImportRows.length} de ${importRows.length} Filas`
                        : `${importRows.length} ${importRows.length === 1 ? 'Fila' : 'Filas'}`}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, width: isLargeScreen ? 'auto' : '100%', justifyContent: isLargeScreen ? 'flex-end' : 'space-between' }}>
                  <Boton
                    className="btn-cancel"
                    label="Plantilla"
                    iconName="download"
                    onClick={handleDownloadTemplate}
                    style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap', width: 'fit-content' }}
                  />
                  <BotonIcon
                    className="btn-cancel"
                    iconName="trash"
                    onClick={handleClear}
                    style={{ padding: '6px' }}
                  />
                </div>
              </div>

              {/* Tabla editable */}
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                {selectedFields.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--tertiary-color, #94a3b8)', fontStyle: 'italic', fontSize: '13px' }}>
                    Seleccione al menos un campo para visualizar y editar datos.
                  </div>
                ) : (
                  <TablaEditable
                    columns={tablaColumns.filter(col => col.accessor !== 'id' && selectedFields.includes(col.accessor))}
                    rows={visibleImportRows}
                    onCellChange={handleCellChange}
                    rowErrors={rowErrors}
                    isLoading={isLoadingTable}
                    readOnly={isConfirmModalOpen}
                    onLoadMore={hasMore ? loadMore : undefined}
                  />
                )}
              </div>
            </div>

            {/* ── Columna derecha: ACCIONES Y EXPORTAR ── */}
            <div style={{
              flex: isLargeScreen ? '35' : 'none',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              minWidth: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              alignSelf: isLargeScreen ? 'flex-start' : 'auto'
            }}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
              />

              <Boton
                className="btn-primary"
                label="Seleccionar archivo"
                iconName="upload"
                onClick={() => fileInputRef.current?.click()}
              />

              <InputSelect
                label="Tipo de Almacén"
                value={tipoAlmacen}
                onChange={handleTipoChange}
                options={TIPO_OPTIONS}
                placeholder="Seleccionar tipo"
              />

              <InputSelectMultiple
                label="Campos"
                value={selectedFields}
                onChange={(val) => setSelectedFields(val || [])}
                options={fieldOptions}
                placeholder="Seleccionar campos..."
              />

              <Mensaje
                type="warning"
                title="Campos a procesar"
                message="Solo se exportarán, importarán y mostrarán los campos seleccionados. Los campos no seleccionados no se verán afectados ni modificados."
              />

              <Boton
                className="btn-primary"
                label="Exportar"
                iconName="export"
                loading={isExporting}
                onClick={handleExport}
                disabled={selectedFields.length === 0}
              />

              <Boton
                className="btn-primary"
                label={importRows.some(r => !!r.id) ? 'Actualizar' : 'Importar'}
                iconName={importRows.some(r => !!r.id) ? 'sync' : 'import'}
                onClick={handleOpenConfirmModal}
                disabled={selectedFields.length === 0 || importRows.length === 0}
              />

              <Boton
                className="btn-cancel"
                label="Modificar Localmente"
                iconName="edit"
                loading={isLoadingLocal}
                onClick={handleLoadForLocalEdit}
                disabled={selectedFields.length === 0}
              />
            </div>
          </div>


        </div>
      </div>
      {!isLargeScreen && <MenuSide />}

      <ConfirmarImportar
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        importRows={importRows}
        selectedFields={selectedFields}
        tipoAlmacen={tipoAlmacen}
        preciosTipos={preciosTipos}
        setPreciosTipos={setPreciosTipos}
        onSuccess={() => setImportRows([])}
      />
    </>
  );
};

export default Exportar;