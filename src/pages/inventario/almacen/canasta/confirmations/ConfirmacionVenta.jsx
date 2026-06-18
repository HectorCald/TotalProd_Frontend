import React, { useState } from 'react';
import ModalCentro from '../../../../../components/common/modals/ModalCentro';
import SelectCliente from '../../../../../components/common/fast/SelectCliente';
import SelectMetodoPago from '../../../../../components/common/fast/SelectMetodoPago';
import Input from '../../../../../components/common/inputs/Input';
import InputSwitch from '../../../../../components/common/inputs/InputSwitch';
import movimientosAlmacenService from '../../../../../services/movimientosAlmacenService';
import deudasService from '../../../../../services/deudasService';
import useSessionCache from '../../../../../hooks/useSessionCache';
import { useToast } from '../../../../../context/ToastContext';

const ConfirmacionVenta = ({ isOpen, onClose, totalBase, canasta, precioSeleccionado, vaciarCanasta, modoAgrupacion, cotizacionDefaults = null }) => {
  const { showSuccess, showDanger } = useToast();
  const { value: clientes } = useSessionCache({ key: 'clientesListado', defaultValue: [] });

  const [cliente, setCliente] = useState(null);
  const [metodoPago, setMetodoPago] = useState(null);
  const [descuento, setDescuento] = useState('');
  const [aumento, setAumento] = useState('');
  const [concepto, setConcepto] = useState('');
  const [adelanto, setAdelanto] = useState('');
  const [esPorcentaje, setEsPorcentaje] = useState(false);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (isOpen) {
      if (cotizacionDefaults) {
        setCliente(cotizacionDefaults.cliente_id || null);
        setMetodoPago(cotizacionDefaults.metodo_pago?.toLowerCase() || null);
        setDescuento(cotizacionDefaults.descuento ? String(cotizacionDefaults.descuento) : '');
        setAumento(cotizacionDefaults.aumento ? String(cotizacionDefaults.aumento) : '');
        setEsPorcentaje(!!cotizacionDefaults.porcentaje);
      } else {
        setCliente(null);
        setMetodoPago(null);
        setDescuento('');
        setAumento('');
        setEsPorcentaje(false);
      }
      setConcepto('');
      setAdelanto('');
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, cotizacionDefaults]);

  const descVal = Number(descuento) || 0;
  const aumVal = Number(aumento) || 0;

  let totalFinal = Number(totalBase) || 0;
  if (esPorcentaje) {
    totalFinal = totalFinal - (totalFinal * (descVal / 100)) + (totalFinal * (aumVal / 100));
  } else {
    totalFinal = totalFinal - descVal + aumVal;
  }

  const [isSubmitting, setIsSubmitting] = useState(false);

  const getProductPrice = (producto, priceTypeId) => {
    if (!priceTypeId || !producto.price_product) return 0;
    const priceObj = producto.price_product.find(p => p.prices_types?.id === priceTypeId || p.prices_types_id === priceTypeId);
    return priceObj ? Number(priceObj.valor) : 0;
  };

  const getDateStr = (offsetMonths = 0) => {
    const d = new Date();
    if (offsetMonths) d.setMonth(d.getMonth() + offsetMonths);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  const handleConfirm = async () => {
    const newErrors = {};
    if (!metodoPago) newErrors.metodoPago = true;
    if (metodoPago === 'credito' && !cliente) newErrors.cliente = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setIsSubmitting(true);

    try {
      const payload = {
        type: 'salida',
        cliente_id: cliente || null,
        metodo_pago: metodoPago.toUpperCase(),
        descuento: descVal,
        aumento: aumVal,
        porcentaje: esPorcentaje,
        concepto: concepto || null,
        adelanto: metodoPago === 'credito' ? (Number(adelanto) || 0) : 0,
        precio_id: precioSeleccionado,
        agrupado: modoAgrupacion === 'grupo',
        productos: canasta.map(p => ({
          id: p.id,
          cantidad: p.cantidad,
          precio: getProductPrice(p, precioSeleccionado)
        }))
      };

      console.log('Payload de venta frontend:', payload);
      const result = await movimientosAlmacenService.createFast(payload);

      if (!result.success) {
        console.error('Error desde backend:', result);
        showDanger('Error', result.message || 'Error al registrar la venta');
        return;
      }

      // Si es crédito, crear deuda automáticamente
      if (metodoPago === 'credito') {
        const clienteObj = clientes.find(c => String(c.id) === String(cliente));
        const clienteNombre = clienteObj?.name || 'Cliente';

        const deudaPayload = {
          fecha_deuda: getDateStr(0),
          fecha_vencimiento: getDateStr(1),
          monto_total: totalFinal,
          saldo_pendiente: totalFinal,
          concepto: `Venta a ${clienteNombre}`,
          estado: 'pendiente',
          cliente_id: cliente,
          movimiento_salida_id: result.data?.id || null
        };

        const deudaResult = await deudasService.create(deudaPayload);

        if (!deudaResult?.success) {
          showDanger('Error', 'Venta registrada pero no se pudo crear la deuda: ' + (deudaResult?.message || 'Error desconocido'));
          return;
        }

        // Si hay adelanto, registrar pago parcial
        const adelantoNum = Number(adelanto) || 0;
        if (adelantoNum > 0 && deudaResult.data?.id) {
          const pagoResult = await deudasService.createPagoParcial(deudaResult.data.id, {
            monto: adelantoNum,
            fecha: getDateStr(0),
            detalle: 'Adelanto al realizar la venta'
          });

          if (!pagoResult?.success) {
            showDanger('Advertencia', 'Deuda creada pero no se pudo registrar el adelanto: ' + (pagoResult?.message || 'Error desconocido'));
            return;
          }
        }
      }

      showSuccess('Éxito', 'Venta registrada con éxito');
      if (vaciarCanasta) vaciarCanasta();

      // Limpiar campos
      setCliente(null);
      setMetodoPago(null);
      setDescuento('');
      setAumento('');
      setConcepto('');
      setAdelanto('');
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
      title="Confirmar Venta"
      confirmText="Realizar Venta"
      onConfirm={handleConfirm}
      width="450px"
      loading={isSubmitting}
      disableClose={isSubmitting}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px', pointerEvents: isSubmitting ? 'none' : 'auto', opacity: isSubmitting ? 0.7 : 1 }}>
        <SelectCliente 
          value={cliente}
          onChange={(val) => { setCliente(val); setErrors(prev => ({ ...prev, cliente: false })); }}
          required={metodoPago === 'credito'}
          error={errors.cliente}
          fetchTrigger={isOpen}
        />
        <SelectMetodoPago 
          value={metodoPago}
          onChange={(val) => { 
            setMetodoPago(val); 
            setErrors(prev => ({ 
              ...prev, 
              metodoPago: false,
              ...(val !== 'credito' && { cliente: false })
            })); 
          }}
          required={true}
          error={errors.metodoPago}
        />

        {metodoPago === 'credito' && (
          <Input 
            label="Adelanto (Bs.)"
            tipo="number"
            value={adelanto}
            onChange={(e) => setAdelanto(e.target.value)}
            placeholder="0"
          />
        )}
        
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

        <Input 
          label="Concepto"
          tipo="text"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Detalle de la venta..."
        />

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

export default ConfirmacionVenta;