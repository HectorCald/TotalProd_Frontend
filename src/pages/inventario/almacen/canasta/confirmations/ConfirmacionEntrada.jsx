import React, { useState, useEffect } from 'react';
import ModalCentro from '../../../../../components/common/modals/ModalCentro';
import SelectProveedores from '../../../../../components/common/fast/SelectProveedores';
import SelectMetodoPago from '../../../../../components/common/fast/SelectMetodoPago';
import Input from '../../../../../components/common/inputs/Input';
import InputSwitch from '../../../../../components/common/inputs/InputSwitch';
import movimientosAlmacenService from '../../../../../services/movimientosAlmacenService';
import { useToast } from '../../../../../context/ToastContext';

const ConfirmacionEntrada = ({ isOpen, onClose, totalBase, canasta, precioSeleccionado, vaciarCanasta, modoAgrupacion }) => {
  const { showSuccess, showDanger } = useToast();
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

  const getProductPrice = (producto, priceTypeId) => {
    if (!priceTypeId || !producto.price_product) return 0;
    const priceObj = producto.price_product.find(p => p.prices_types?.id === priceTypeId || p.prices_types_id === priceTypeId);
    return priceObj ? Number(priceObj.valor) : 0;
  };

  const handleConfirm = async () => {
    const newErrors = {};
    if (registrarGasto) {
      if (!costo) newErrors.costo = true;
      if (!proveedor) newErrors.proveedor = true;
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
        proveedor_id: registrarGasto ? proveedor : null,
        metodo_pago: registrarGasto && metodoPago ? metodoPago.toUpperCase() : null,
        concepto: concepto || null,
        restar_ingredientes: consumirReceta,
        precio_id: precioSeleccionado,
        agrupado: modoAgrupacion === 'grupo',
        productos: canasta.map(p => ({
          id: p.id,
          cantidad: p.cantidad,
          precio: getProductPrice(p, precioSeleccionado)
        }))
      };

      const result = await movimientosAlmacenService.createFast(payload);
      if (result.success) {
        showSuccess('Éxito', 'Entrada registrada con éxito');
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
      } else {
        showDanger('Error', result.message || 'Error al registrar la entrada');
      }
    } catch (error) {
      showDanger('Error', 'Error de conexión');
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
      confirmText="Generar Entrada"
      onConfirm={handleConfirm}
      width="450px"
      loading={isSubmitting}
      disableClose={isSubmitting}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', pointerEvents: isSubmitting ? 'none' : 'auto', opacity: isSubmitting ? 0.7 : 1 }}>

        <Input
          label="Concepto"
          tipo="text"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Detalle de la entrada..."
        />

        <InputSwitch
          label="Registrar pago"
          checked={registrarGasto}
          onChange={(checked) => {
            setRegistrarGasto(checked);
            if (!checked) {
              setErrors({});
            }
          }}
        />

        <InputSwitch
          label="Consumir receta"
          checked={consumirReceta}
          onChange={setConsumirReceta}
        />

        {registrarGasto && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}>
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
              required={true}
              error={errors.proveedor}
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
          </div>
        )}

        {registrarGasto && (
          <div style={{
            paddingTop: '15px',
            borderTop: '1px dashed var(--quaternary-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '14px', color: 'var(--secondary-color)' }}>Gasto a registrar:</span>
            <span style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              Bs. {Number(costo || 0).toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </ModalCentro>
  );
};

export default ConfirmacionEntrada;
