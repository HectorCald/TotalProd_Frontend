import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Mensaje from '../../../../components/common/outputs/Mensaje';
import { useToast } from '../../../../context/ToastContext';
import productsAlmacenService from '../../../../services/productsAlmacenService';
import productsAcopioService from '../../../../services/productsAcopioService';
import pricesTypesService from '../../../../services/pricesTypesService';
import { TYPE_ID } from '../utils/columnsConfig';

const ConfirmarImportar = ({
  isOpen,
  onClose,
  importRows = [],
  selectedFields = [],
  tipoAlmacen = TYPE_ID.AG,
  preciosTipos = [],
  setPreciosTipos,
  onSuccess
}) => {
  const { showSuccess, showDanger } = useToast();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!importRows || importRows.length === 0) {
      showDanger(null, 'No hay datos para procesar');
      return;
    }

    setLoading(true);
    try {
      if (tipoAlmacen === TYPE_ID.AG) {
        let currentPreciosTipos = preciosTipos;
        if (!currentPreciosTipos || currentPreciosTipos.length === 0) {
          try {
            const r = await pricesTypesService.getAll();
            if (r && r.data) {
              currentPreciosTipos = Array.isArray(r.data) ? r.data : [r.data];
              if (setPreciosTipos) setPreciosTipos(currentPreciosTipos);
            }
          } catch (e) {
            console.error(e);
          }
        }

        const dataToSubmit = importRows.map(row => {
          const item = {};
          if (row.id) item.id = row.id;

          if (selectedFields.includes('name')) item.name = row.name;
          if (selectedFields.includes('description')) item.description = row.description || null;
          if (selectedFields.includes('stock')) item.stock = parseInt(row.stock || 0, 10);
          if (selectedFields.includes('stock_minimo')) item.stock_minimo = parseInt(row.stock_minimo || 0, 10);
          if (selectedFields.includes('codigo_barras')) item.codigo_barras = row.codigo_barras || null;
          if (selectedFields.includes('grup')) item.grup = row.grup ? parseInt(row.grup, 10) : null;
          if (selectedFields.includes('category_ids')) {
            item.category_ids = Array.isArray(row.category_ids) ? row.category_ids : (row.category_ids ? [row.category_ids] : []);
          }

          const selectedPriceCols = (currentPreciosTipos || []).filter(pt => selectedFields.includes(`precio_${pt.id}`));
          if (selectedPriceCols.length > 0) {
            const prices = {};
            selectedPriceCols.forEach(pt => {
              const val = row[`precio_${pt.id}`];
              if (val !== undefined && val !== null && val !== '') {
                prices[pt.id] = parseFloat(String(val).replace(',', '.')) || 0;
              } else {
                prices[pt.id] = 0;
              }
            });
            item.prices = prices;
          }

          return item;
        });

        const res = await productsAlmacenService.bulkCreate(dataToSubmit);
        if (res.success) {
          showSuccess(null, res.message);
          if (onSuccess) onSuccess();
          onClose();
        } else {
          showDanger(null, res.message);
        }
      } else if (tipoAlmacen === TYPE_ID.MP) {
        const dataToSubmit = importRows.map(row => {
          const item = {};
          if (row.id) item.id = row.id;

          if (selectedFields.includes('name')) item.name = row.name;
          if (selectedFields.includes('description')) item.description = row.description || null;
          if (selectedFields.includes('quantity')) item.quantity = parseFloat(row.quantity || 0);
          if (selectedFields.includes('stock_minimo')) item.stock_minimo = parseInt(row.stock_minimo || 0, 10);
          if (selectedFields.includes('type_measure_id')) item.type_measure_id = row.type_measure_id || null;
          if (selectedFields.includes('category_id')) item.category_id = row.category_id || null;

          return item;
        });

        const res = await productsAcopioService.bulkCreate(dataToSubmit);
        if (res.success) {
          showSuccess(null, res.message);
          if (onSuccess) onSuccess();
          onClose();
        } else {
          showDanger(null, res.message);
        }
      }
    } catch (err) {
      showDanger(null, err.message || 'Error durante la operación');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const count = importRows.length;
  const countNuevos = importRows.filter(r => !r.id).length;
  const countActualizados = importRows.filter(r => !!r.id).length;
  const isUpdating = countActualizados > 0 && countNuevos === 0;
  const isMixed = countActualizados > 0 && countNuevos > 0;
  const hasId = countActualizados > 0;

  const modalTitle = isUpdating
    ? 'Confirmar actualización'
    : (isMixed ? 'Confirmar actualización e importación' : 'Confirmar importación');

  const modalMensaje = isUpdating
    ? `¿Estás seguro de que deseas actualizar ${count} ${count === 1 ? 'producto existente' : 'productos existentes'} en ${tipoAlmacen === TYPE_ID.AG ? 'Almacén General' : 'Materia Prima'}?`
    : (isMixed
        ? `¿Estás seguro de que deseas actualizar ${countActualizados} y registrar ${countNuevos} productos en ${tipoAlmacen === TYPE_ID.AG ? 'Almacén General' : 'Materia Prima'}?`
        : `¿Estás seguro de que deseas importar ${count} ${count === 1 ? 'nuevo producto' : 'nuevos productos'} a ${tipoAlmacen === TYPE_ID.AG ? 'Almacén General' : 'Materia Prima'}?`);

  const modalDetalle = isUpdating
    ? `Se modificarán los datos de ${countActualizados} ${countActualizados === 1 ? 'producto' : 'productos'} directamente en la base de datos para los ${selectedFields.length} campos seleccionados. Los campos no seleccionados mantendrán sus valores actuales.`
    : (isMixed
        ? `Se procesarán ${countActualizados} actualizaciones y ${countNuevos} creaciones solo para los ${selectedFields.length} campos seleccionados. Los demás campos permanecerán intactos.`
        : `Se crearán ${count} registros en el sistema utilizando únicamente los ${selectedFields.length} campos seleccionados.`);

  const confirmText = hasId ? 'Actualizar' : 'Importar';

  return (
    <ModalCentro
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      mensaje={modalMensaje}
      detalle={modalDetalle}
      confirmText={confirmText}
      confirmColorClass="btn-primary"
      onConfirm={handleConfirm}
      loading={loading}
      disableClose={loading}
      contentStyle={{ paddingBlock: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      <Mensaje
        type="warning"
        title="Modificación irreversible"
        message={
          hasId
            ? "Los campos seleccionados se modificarán y sobrescribirán de forma permanente en la base de datos. Esta operación no tiene retroceso y los cambios no podrán deshacerse."
            : "Los datos se registrarán en la base de datos según los campos seleccionados. Verifica la información antes de continuar."
        }
      />
    </ModalCentro>
  );
};

export default ConfirmarImportar;
