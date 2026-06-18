import React, { useState } from 'react';
import ModalCentro from '../../../../../components/common/modals/ModalCentro';
import SelectCliente from '../../../../../components/common/fast/SelectCliente';
import SelectMetodoPago from '../../../../../components/common/fast/SelectMetodoPago';
import Input from '../../../../../components/common/inputs/Input';
import InputSwitch from '../../../../../components/common/inputs/InputSwitch';
import InputFecha from '../../../../../components/common/inputs/InputFecha';
import cotizacionesService from '../../../../../services/cotizacionesService';
import { useToast } from '../../../../../context/ToastContext';

const ConfirmacionCotizacion = ({ isOpen, onClose, totalBase, canasta, precioSeleccionado, vaciarCanasta, modoAgrupacion }) => {
  const { showSuccess, showDanger } = useToast();

  const [cliente, setCliente] = useState(null);
  const [metodoPago, setMetodoPago] = useState(null);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [descuento, setDescuento] = useState('');
  const [aumento, setAumento] = useState('');
  const [esPorcentaje, setEsPorcentaje] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const descVal = Number(descuento) || 0;
  const aumVal = Number(aumento) || 0;

  let totalFinal = Number(totalBase) || 0;
  if (esPorcentaje) {
    totalFinal = totalFinal - (totalFinal * (descVal / 100)) + (totalFinal * (aumVal / 100));
  } else {
    totalFinal = totalFinal - descVal + aumVal;
  }

  const getProductPrice = (producto, priceTypeId) => {
    if (!priceTypeId || !producto.price_product) return 0;
    const priceObj = producto.price_product.find(p => p.prices_types?.id === priceTypeId || p.prices_types_id === priceTypeId);
    return priceObj ? Number(priceObj.valor) : 0;
  };

  const handleConfirm = async () => {
    const newErrors = {};
    if (!metodoPago) newErrors.metodoPago = true;
    if (!cliente) newErrors.cliente = true;
    if (!fechaVencimiento) newErrors.fechaVencimiento = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const payload = {
        metodo_pago: metodoPago.toUpperCase(),
        cliente_id: cliente || null,
        precio_id: precioSeleccionado,
        agrupado: modoAgrupacion === 'grupo',
        fecha_vencimiento: fechaVencimiento || null,
        descuento: descVal,
        aumento: aumVal,
        porcentaje: esPorcentaje,
        productos: (canasta || []).map(p => ({
          id: p.id,
          cantidad: p.cantidad,
          precio: getProductPrice(p, precioSeleccionado)
        }))
      };

      const result = await cotizacionesService.createFast(payload);

      if (!result.success) {
        showDanger('Error', result.message || 'Error al registrar la cotización');
        return;
      }

      showSuccess('Éxito', 'Cotización generada con éxito');
      if (vaciarCanasta) vaciarCanasta();

      setCliente(null);
      setMetodoPago(null);
      setFechaVencimiento('');
      setDescuento('');
      setAumento('');
      setEsPorcentaje(false);
      setErrors({});

      onClose();
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
      title="Confirmar Cotización"
      confirmText="Generar Cotización"
      onConfirm={handleConfirm}
      width="450px"
      loading={isSubmitting}
      disableClose={isSubmitting}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', pointerEvents: isSubmitting ? 'none' : 'auto', opacity: isSubmitting ? 0.7 : 1 }}>
        <SelectCliente 
          value={cliente}
          onChange={(val) => { setCliente(val); setErrors(prev => ({ ...prev, cliente: false })); }}
          required={true}
          error={errors.cliente}
          fetchTrigger={isOpen}
        />
        <SelectMetodoPago 
          value={metodoPago}
          onChange={(val) => { 
            setMetodoPago(val); 
            setErrors(prev => ({ 
              ...prev, 
              metodoPago: false
            })); 
          }}
          required={true}
          error={errors.metodoPago}
        />
        <InputFecha 
          label="Fecha de Vencimiento"
          value={fechaVencimiento}
          onChange={(val) => { setFechaVencimiento(val); setErrors(prev => ({ ...prev, fechaVencimiento: false })); }}
          required={true}
          error={errors.fechaVencimiento}
        />
        
        <InputSwitch 
          label="Aplicar como porcentaje"
          checked={esPorcentaje}
          onChange={(checked) => setEsPorcentaje(checked)}
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <Input 
              label={`Descuento ${esPorcentaje ? '(%)' : '(Bs.)'}`}
              tipo="number"
              value={descuento}
              onChange={(e) => setDescuento(e.target.value)}
              placeholder="0"
            />
          </div>
          <div style={{ flex: 1 }}>
            <Input 
              label={`Aumento ${esPorcentaje ? '(%)' : '(Bs.)'}`}
              tipo="number"
              value={aumento}
              onChange={(e) => setAumento(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div style={{ 
          paddingTop: '15px', 
          borderTop: '1px dashed var(--quaternary-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '14px', color: 'var(--secondary-color)' }}>Total Final:</span>
          <span style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
            Bs. {totalFinal.toFixed(2)}
          </span>
        </div>
      </div>
    </ModalCentro>
  );
};

export default ConfirmacionCotizacion;
