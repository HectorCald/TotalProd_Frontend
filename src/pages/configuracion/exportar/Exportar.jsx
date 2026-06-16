import React, { useState, useEffect, useCallback } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import layoutStyles from '../../../pages/home/View.module.css';
import UploadFile from '../../../components/common/widgets/UploadFile';
import InputSelect from '../../../components/common/inputs/InputSelect';
import InputSelectIcon from '../../../components/common/inputs/InputSelectIcon';
import Boton from '../../../components/common/botones/Boton';
import BotonIcon from '../../../components/common/botones/BotonIcon';
import LayoutPercentage from '../../../components/layout/LayoutPercentage';
import TablaEditable from '../../../components/common/information/TablaEditable';
import { useToast } from '../../../context/ToastContext';
import useSessionCache from '../../../hooks/useSessionCache';

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

const FORMAT_OPTIONS = [
  { value: 'excel', label: 'EXCEL', icon: 'file',     color: 'var(--success-color)', bgColor: 'rgba(96, 223, 67, 0.1)' },
  { value: 'csv',   label: 'CSV',   icon: 'list-ul',  color: 'var(--primary-color)', bgColor: 'var(--primary-color-light)' },
  { value: 'pdf',   label: 'PDF',   icon: 'file-pdf', iconType: 'solid', color: 'var(--error-color)', bgColor: 'rgba(255, 76, 76, 0.1)' },
];

const Exportar = () => {
  const { isLargeScreen } = useLayout();
  const { showDanger, showSuccess } = useToast();

  /* ── Tipo de almacén (compartido entre importar y exportar) ── */
  const [tipoAlmacen, setTipoAlmacen] = useState(TYPE_ID.AG);
  const [isImporting, setIsImporting] = useState(false);

  /* ── Datos del panel derecho (exportar) ── */
  const [format, setFormat]           = useState('excel');

  /* ── Catálogos dinámicos ── */
  const { value: categoriasAG, setValue: setCategoriasAG } = useSessionCache({ key: 'categoriasAlmacenListado', defaultValue: [] });
  const { value: categoriasMP, setValue: setCategoriasMP } = useSessionCache({ key: 'categoriasAcopioListado',   defaultValue: [] });
  const { value: medidas,      setValue: setMedidas      } = useSessionCache({ key: 'ListadoTiposMedida',        defaultValue: [] });
  const { value: preciosTipos, setValue: setPreciosTipos } = useSessionCache({ key: 'ListadoTiposPrecios',       defaultValue: [] });

  const [isLoading, setIsLoading] = useState(true);

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

  const tablaColumns = buildTablaColumns(columns, catalogOptions);

  /* ── Filas importadas ── */
  const [importRows, setImportRows] = useState([]);
  const [rowErrors, setRowErrors]   = useState({});

  // Resetear filas al cambiar tipo
  useEffect(() => { setImportRows([]); setRowErrors({}); }, [tipoAlmacen]);

  const handleCellChange = useCallback((rowIdx, key, value) => {
    setImportRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, [key]: value } : r));
    setRowErrors(prev => ({
      ...prev,
      [rowIdx]: { ...(prev[rowIdx] || {}), [key]: false },
    }));
  }, []);

  /* ── Descarga de plantilla ── */
  const handleDownloadTemplate = () => {
    if (!tipoAlmacen) {
      showDanger('Tipo no seleccionado', 'Debe seleccionar un tipo de almacén para descargar la plantilla.');
      return;
    }
    downloadTemplate({ tipo: tipoAlmacen, columns });
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

      const activeColumns = newTipo === TYPE_ID.AG ? buildColumnsAG(preciosTipos) : COLUMNS_MP;
      const optionsMap = {
        categorias_ag: categoriasAG,
        categorias_mp: categoriasMP,
        medidas: medidas
      };

      const processedRows = rows.map(row => {
        const newRow = { ...row };
        activeColumns.forEach(col => {
          if (col.type === 'number') {
            if (newRow[col.key] === '' || newRow[col.key] === undefined) {
              newRow[col.key] = 0;
            }
          } else if (col.type === 'select') {
            const opts = optionsMap[col.optionsKey] || [];
            const val = newRow[col.key];
            if (val) {
              const matched = opts.find(o => 
                String(o.label).toLowerCase() === String(val).trim().toLowerCase() ||
                String(o.value) === String(val).trim()
              );
              if (matched) {
                newRow[col.key] = matched.value;
              }
            }
          } else if (col.type === 'multiselect') {
            const opts = optionsMap[col.optionsKey] || [];
            const val = newRow[col.key];
            if (val && typeof val === 'string') {
              // Separar por comas y buscar cada una
              const names = val.split(',').map(s => s.trim()).filter(Boolean);
              const matchedIds = names.map(name => {
                const matched = opts.find(o =>
                  String(o.label).toLowerCase() === name.toLowerCase() ||
                  String(o.value) === name
                );
                return matched ? matched.value : null;
              }).filter(Boolean);
              newRow[col.key] = matchedIds;
            } else if (!Array.isArray(val)) {
              newRow[col.key] = [];
            }
          }
        });
        return newRow;
      });

      setImportRows(processedRows);
      setRowErrors({});
    } catch (err) {
      showDanger('Error al leer el archivo', err.message || 'Archivo no válido');
    }
  };

  /* ── Limpiar datos subidos ── */
  const handleClear = () => {
    setImportRows([]);
    setRowErrors({});
  };

  /* ── Validar y confirmar importación ── */
  const handleConfirmImport = async () => {
    if (importRows.length === 0) {
      showDanger('No hay datos', 'Debe cargar un archivo con información para importar.');
      return;
    }

    const errors = {};
    let hasErrors = false;

    importRows.forEach((row, idx) => {
      const rowErrs = {};
      columns.forEach((col) => {
        if (col.required && (row[col.key] === '' || row[col.key] === undefined || row[col.key] === null)) {
          rowErrs[col.key] = true;
          hasErrors = true;
        }
      });
      if (Object.keys(rowErrs).length > 0) errors[idx] = rowErrs;
    });

    if (hasErrors) {
      setRowErrors(errors);
      showDanger('Campos requeridos vacíos', 'Revisa las celdas marcadas en rojo antes de continuar.');
      return;
    }

    if (tipoAlmacen === TYPE_ID.AG) {
      const dataToSubmit = importRows.map(row => {
        const prices = {};
        preciosTipos.forEach(pt => {
           const val = row[`precio_${pt.id}`];
           if (val !== undefined && val !== '') {
             prices[pt.id] = parseFloat(String(val).replace(',', '.'));
           }
        });

        return {
          id: row.id || null,
          name: row.name,
          description: row.description || null,
          stock: parseInt(row.stock || 0),
          stock_minimo: parseInt(row.stock_minimo || 0),
          codigo_barras: row.codigo_barras || null,
          grup: row.grup ? parseInt(row.grup) : null,
          category_ids: Array.isArray(row.category_ids) ? row.category_ids : (row.category_ids ? [row.category_ids] : []),
          prices,
          receta: null
        };
      });

      setIsImporting(true);
      try {
        const res = await productsAlmacenService.bulkCreate(dataToSubmit);
        if (res.success) {
          showSuccess('Importación exitosa', res.message);
          setImportRows([]); // Limpiamos la tabla
        } else {
          showDanger('Importación con errores', res.message);
        }
      } catch (err) {
        showDanger('Error en importación', err.message);
      } finally {
        setIsImporting(false);
      }
    } else if (tipoAlmacen === TYPE_ID.MP) {
      const dataToSubmit = importRows.map(row => {
        return {
          id: row.id || null,
          name: row.name,
          description: row.description || null,
          quantity: parseFloat(row.quantity || 0),
          stock_minimo: parseInt(row.stock_minimo || 0),
          type_measure_id: row.type_measure_id || null,
          category_id: row.category_id || null
        };
      });

      setIsImporting(true);
      try {
        const res = await productsAcopioService.bulkCreate(dataToSubmit);
        if (res.success) {
          showSuccess('Importación exitosa', res.message);
          setImportRows([]);
        } else {
          showDanger('Importación con errores', res.message);
        }
      } catch (err) {
        showDanger('Error en importación', err.message);
      } finally {
        setIsImporting(false);
      }
    }
  };



  /* ── Exportar Datos ── */
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (format !== 'excel') {
      showDanger('No soportado', 'Por el momento solo se soporta exportación en formato EXCEL.');
      return;
    }

    if (tipoAlmacen === TYPE_ID.AG) {
      setIsExporting(true);
      try {
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
          showDanger('Error al exportar', res.message || 'Error desconocido.');
        } else if (rawProducts.length > 0) {
          const exportRows = rawProducts.map(p => {
             const row = {
               id: p.id,
               name: p.name,
               description: p.description || '',
               stock: p.stock || 0,
               stock_minimo: p.stock_minimo || 0,
               codigo_barras: p.codigo_barras || '',
               grup: p.grup || '',
               category_ids: '',
             };
             // Mapear categorías múltiples
             if (p.producto_categoria && Array.isArray(p.producto_categoria) && p.producto_categoria.length > 0) {
               row.category_ids = p.producto_categoria.map(pc => pc.category_almacen?.name || '').filter(Boolean).join(', ');
             } else if (p.category_names && Array.isArray(p.category_names) && p.category_names.length > 0) {
               row.category_ids = p.category_names.join(', ');
             } else if (p.category_name) {
               row.category_ids = p.category_name;
             }
             // Mapear los precios que existan en el array de precios del producto
             if (p.prices && Array.isArray(p.prices)) {
               preciosTipos.forEach(pt => {
                 const priceObj = p.prices.find(pr => pr.price_type_id === pt.id);
                 row[`precio_${pt.id}`] = priceObj ? priceObj.price : 0;
               });
             } else {
               preciosTipos.forEach(pt => { row[`precio_${pt.id}`] = 0; });
             }
             return row;
          });

          exportDataToExcel({ tipo: tipoAlmacen, columns, rowsData: exportRows });
          showSuccess('Exportación completada', `Se exportaron ${exportRows.length} productos.`);
        } else {
          showDanger('Error al exportar', 'No se pudieron obtener los productos.');
        }
      } catch (err) {
         showDanger('Error al exportar', err.message);
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
          showDanger('Error al exportar', res.message || 'Error desconocido.');
        } else if (rawProducts.length > 0) {
          const exportRows = rawProducts.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            quantity: p.quantity || 0,
            stock_minimo: p.stock_minimo || 0,
            type_measure_id: p.type_measure_id ? (medidas.find(m => m.value === p.type_measure_id)?.label || p.type_measure_id) : '',
            category_id: p.category_id ? (categoriasMP.find(c => String(c.value) === String(p.category_id))?.label || p.category_id) : '',
          }));

          exportDataToExcel({ tipo: tipoAlmacen, columns, rowsData: exportRows });
          showSuccess('Exportación completada', `Se exportaron ${exportRows.length} insumos de Materia Prima.`);
        } else {
          showDanger('Error al exportar', 'No se pudieron obtener los productos de MP.');
        }
      } catch (err) {
         showDanger('Error al exportar', err.message);
      } finally {
         setIsExporting(false);
      }
    }
  };

  return (
    <>
      {isLargeScreen && <NavBar />}
      <div className={layoutStyles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={layoutStyles.contentArea}>
          <h1 className={layoutStyles.title}>Importar &amp; Exportar</h1>



          <LayoutPercentage percentages={[65, 35]} gap="20px">

            {/* ── Columna izquierda: IMPORTAR ── */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minWidth: 0, overflow: 'hidden', height: '100%' }}>
              <UploadFile
                onFileSelect={handleFileSelect}
                acceptedTypes=".xlsx, .xls"
                maxMb={3}
                style={{ height: '100%', minHeight: '160px' }}
              />

            </div>

            {/* ── Columna derecha: EXPORTAR ── */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <InputSelect
                label="Tipo de Almacén"
                value={tipoAlmacen}
                onChange={setTipoAlmacen}
                options={TIPO_OPTIONS}
                placeholder="Seleccionar tipo"
              />

              <InputSelectIcon
                label="Seleccionar Formato"
                value={format}
                onChange={setFormat}
                options={FORMAT_OPTIONS}
              />

              <Boton
                className="btn-blue"
                label="Exportar"
                iconName="export"
                loading={isExporting}
                onClick={handleExport}
              />
            </div>
          </LayoutPercentage>

          {/* ── Fila inferior: Tabla (100%) ── */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginTop: '20px', minWidth: 0, overflow: 'hidden' }}>
            {/* Barra de acciones de la tabla */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: 0, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Vista Previa y Mapeo
                </h3>
                {importRows.length > 0 && (
                  <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    {importRows.length} {importRows.length === 1 ? 'Fila' : 'Filas'}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Boton
                  className="btn-default"
                  label="Plantilla"
                  iconName="download"
                  onClick={handleDownloadTemplate}
                  style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap', width: 'fit-content' }}
                />
                <BotonIcon
                  className="btn-default"
                  iconName="trash"
                  onClick={handleClear}
                  style={{ padding: '6px' }}
                />
                <Boton
                  className="btn-blue"
                  label="Importar"
                  iconName="import"
                  onClick={handleConfirmImport}
                  loading={isImporting}
                  style={{ padding: '6px 14px', fontSize: '12px', whiteSpace: 'nowrap', width: 'fit-content' }}
                />
              </div>
            </div>

            {/* Tabla editable */}
            <TablaEditable
              columns={tablaColumns.filter(col => col.accessor !== 'id')}
              rows={importRows}
              onCellChange={handleCellChange}
              rowErrors={rowErrors}
              isLoading={isLoading}
              readOnly={isImporting}
            />
          </div>


        </div>
      </div>
    </>
  );
};

export default Exportar;