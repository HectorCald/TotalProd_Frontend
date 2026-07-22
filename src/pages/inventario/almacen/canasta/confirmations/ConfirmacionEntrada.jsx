import React, { useState, useEffect } from 'react';
import useFormatNumber from '../../../../../hooks/useFormatNumber';
import ModalCentro from '../../../../../components/common/modals/ModalCentro';
import SelectProveedores from '../../../../../components/common/fast/SelectProveedores';
import SelectMetodoPago from '../../../../../components/common/fast/SelectMetodoPago';
import Input from '../../../../../components/common/inputs/Input';
import Checkbox from '../../../../../components/common/inputs/Checkbox';
import movimientosAlmacenService from '../../../../../services/movimientosAlmacenService';
import { useToast } from '../../../../../context/ToastContext';

const ConfirmacionEntrada = ({ isOpen, onClose, totalBase, canasta, precioSeleccionado, vaciarCanasta, modoAgrupacion }) => {
  const { showSuccess, showDanger } = useToast();
  const { formatPrice } = useFormatNumber();
  const [registrarGasto, setRegistrarGasto] = useState(false);
  const [consumirReceta, setConsumirReceta] = useState(false);
  const [concepto, setConcepto] = useState('');
  const [costo, setCosto] = useState('');
  const [proveedor, setProveedor] = useState(null);
  const [metodoPago, setMetodoPago] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setCosto(totalBase ? String(totalBase) : '');
    }
  }, [isOpen, totalBase]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDateStr = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  const getProductPrice = (producto, priceTypeId) => {
    if (!priceTypeId || !producto.price_product) return 0;
    const priceObj = producto.price_product.find(p => p.prices_types?.id === priceTypeId || p.prices_types_id === priceTypeId);
    return priceObj ? Number(priceObj.valor) : 0;
  };

  const showConsumirReceta = canasta && canasta.some(p => p.has_receta || (p.recetas && p.recetas.length > 0));

  const handleConfirm = async () => {
    const newErrors = {};
    if (registrarGasto) {
      if (!costo) newErrors.costo = true;
      if (!metodoPago) newErrors.metodoPago = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const payload = {
        type: 'entrada',
        proveedor_id: proveedor || null,
        metodo_pago: registrarGasto && metodoPago ? metodoPago.toUpperCase() : null,
        concepto: concepto || null,
        restar_ingredientes: consumirReceta,
        precio_id: precioSeleccionado,
        agrupado: modoAgrupacion === 'grupo',
        // Campos para gasto automático en el backend
        registrar_gasto: registrarGasto,
        costo: registrarGasto ? (parseFloat(costo) || 0) : null,
        fecha_gasto: getDateStr(),
        productos: canasta.map(p => {
          const esPorGrupo = modoAgrupacion === 'grupo' && p.grup && Number(p.grup) > 0;
          const precioBase = getProductPrice(p, precioSeleccionado);
          let precioUnitarioFinal = precioBase;
          if (p.precioCustom !== undefined && p.precioCustom !== '') {
             precioUnitarioFinal = esPorGrupo ? (Number(p.precioCustom) / Number(p.grup)) : Number(p.precioCustom);
          }
          return {
            id: p.id,
            cantidad: esPorGrupo ? Number(p.cantidad) * Number(p.grup) : Number(p.cantidad),
            precio: precioUnitarioFinal
          };
        })
      };

      const result = await movimientosAlmacenService.createFast(payload);

      if (!result.success) {
        showDanger(null, result.message || 'Error al registrar la entrada');
        return;
      }

      showSuccess(null, 'Entrada registrada con éxito');
      if (vaciarCanasta) vaciarCanasta();

      // Limpiar campos
      setConcepto('');
      setRegistrarGasto(false);
      setConsumirReceta(false);
      setCosto('');
      setProveedor(null);
      setMetodoPago(null);
      setErrors({});

      onClose();
    } catch (error) {
      showDanger(null, 'Revisa tu conexión a internet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalCentro
      isOpen={isOpen}
      onClose={handleClose}
      title="Confirmar Entrada"
      confirmText="Realizar Entrada"
      onConfirm={handleConfirm}
      loading={isSubmitting}
      disableClose={isSubmitting}
      contentStyle={{ paddingBlock: 0 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: isSubmitting ? 'none' : 'auto', opacity: isSubmitting ? 0.7 : 1 }}>

        <Input
          label="Concepto"
          tipo="text"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Detalle de la entrada..."
        />

        <Checkbox
          id="registrar_pago"
          label="Registrar pago"
          checked={registrarGasto}
          onChange={(checked) => {
            setRegistrarGasto(checked);
            if (!checked) {
              setErrors({});
            }
          }}
        >
          <Input
            label="Costo (Bs.)"
            tipo="number"
            value={costo}
            onChange={(e) => { setCosto(e.target.value); setErrors(prev => ({ ...prev, costo: false })); }}
            placeholder="0"
            required={true}
            error={errors.costo}
          />

          <SelectProveedores
            value={proveedor}
            onChange={(val) => { setProveedor(val); setErrors(prev => ({ ...prev, proveedor: false })); }}
            fetchTrigger={isOpen}
            openDirection="up"
          />

          <SelectMetodoPago
            value={metodoPago}
            onChange={(val) => { setMetodoPago(val); setErrors(prev => ({ ...prev, metodoPago: false })); }}
            required={true}
            error={errors.metodoPago}
            openDirection="up"
          />

          <div style={{
            paddingTop: '15px',
            borderTop: '1px dashed var(--quaternary-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '5px'
          }}>
            <span style={{ fontSize: '14px', color: 'var(--secondary-color)' }}>Gasto a registrar:</span>
            <span style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--secondary-color)' }}>
              Bs. {formatPrice(costo || 0)}
            </span>
          </div>
        </Checkbox>

        {showConsumirReceta && (
          <Checkbox
            id="consumir_receta"
            label="Consumir receta"
            checked={consumirReceta}
            onChange={setConsumirReceta}
          />
        )}
      </div>
    </ModalCentro>
  );
};

export default ConfirmacionEntrada;
