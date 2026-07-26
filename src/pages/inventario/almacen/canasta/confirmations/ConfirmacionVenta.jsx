import React, { useState } from 'react';
import useFormatNumber from '../../../../../hooks/useFormatNumber';
import ModalCentro from '../../../../../components/common/modals/ModalCentro';
import SelectCliente from '../../../../../components/common/fast/SelectCliente';
import SelectMetodoPago from '../../../../../components/common/fast/SelectMetodoPago';
import Input from '../../../../../components/common/inputs/Input';
import Checkbox from '../../../../../components/common/inputs/Checkbox';
import InputFecha from '../../../../../components/common/inputs/InputFecha';
import movimientosAlmacenService from '../../../../../services/movimientosAlmacenService';
import pedidosAlmacenService from '../../../../../services/pedidosAlmacenService';
import { useToast } from '../../../../../context/ToastContext';

const ConfirmacionVenta = ({ isOpen, onClose, totalBase, canasta, precioSeleccionado, vaciarCanasta, modoAgrupacion, cotizacionDefaults = null, onSuccess }) => {
  const { showSuccess, showDanger } = useToast();
  const { formatPrice } = useFormatNumber();

  const [cliente, setCliente] = useState(null);
  const [metodoPago, setMetodoPago] = useState(null);
  const [descuento, setDescuento] = useState('');
  const [aumento, setAumento] = useState('');
  const [concepto, setConcepto] = useState('');
  const [adelanto, setAdelanto] = useState('');
  const [esPorcentaje, setEsPorcentaje] = useState(false);
  const [fechaRegistro, setFechaRegistro] = useState('');
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (isOpen) {
      if (cotizacionDefaults) {
        setCliente(cotizacionDefaults.cliente_id || null);
        setMetodoPago(cotizacionDefaults.metodo_pago?.toLowerCase() || null);
        setDescuento(cotizacionDefaults.descuento ? String(cotizacionDefaults.descuento) : '');
        setAumento(cotizacionDefaults.aumento ? String(cotizacionDefaults.aumento) : '');
        setEsPorcentaje(!!cotizacionDefaults.porcentaje);

        if (cotizacionDefaults.fecha) {
          setFechaRegistro(cotizacionDefaults.fecha.substring(0, 10));
        } else {
          const d = new Date();
          setFechaRegistro(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
        }
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

      const d = new Date();
      const defaultFecha = cotizacionDefaults?.fecha ? cotizacionDefaults.fecha.split('T')[0] : '';
      setFechaRegistro(defaultFecha || (d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')));
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


  const handleConfirm = async () => {
    const newErrors = {};
    if (!fechaRegistro) newErrors.fechaRegistro = true;
    if (!metodoPago) newErrors.metodoPago = true;
    if (metodoPago === 'credito' && !cliente) newErrors.cliente = true;

    if (metodoPago === 'credito') {
      const adelantoNum = Number(adelanto) || 0;
      if (adelantoNum > totalFinal) {
        newErrors.adelanto = { message: 'El adelanto no puede ser mayor al total final.', type: 'error' };
      } else if (adelantoNum > 0 && adelantoNum === totalFinal) {
        newErrors.adelanto = { message: 'Si adelanta el total, por favor seleccione otro metodo de pago.', type: 'warning' };
      }
    }

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
        total_final: totalFinal,
        precio_id: precioSeleccionado,
        agrupado: modoAgrupacion === 'grupo',
        fecha: fechaRegistro,
        productos: canasta.map(p => {
          const esPorGrupo = modoAgrupacion === 'grupo' && p.grup && Number(p.grup) > 0;
          const cantidadEnUnidades = esPorGrupo
            ? Number(p.cantidad) * Number(p.grup)
            : Number(p.cantidad);

          const precioBase = getProductPrice(p, precioSeleccionado);
          
          const precioGrupo = esPorGrupo ? precioBase * Number(p.grup) : precioBase;
          const precioMostrado = precioGrupo; // Ya no redondeamos aquí para que guarde el unitario intacto
          const precioCanasta = (p.precioCustom !== undefined && p.precioCustom !== '') ? Number(p.precioCustom) : precioMostrado;
          
          const precioUnitarioFinal = esPorGrupo ? (precioCanasta / Number(p.grup)) : precioCanasta;

          return {
            id: p.id,
            cantidad: cantidadEnUnidades,
            precio: precioUnitarioFinal
          };
        })
      };

      console.log('Payload de venta frontend:', payload);
      const result = await movimientosAlmacenService.createFast(payload);

      if (!result.success) {
        console.error('Error desde backend:', result);
        showDanger(null, result.message || 'Error al registrar la venta');
        return;
      }

      // Si es una entrega de pedido, actualizar el estado del pedido
      if (window.location.pathname.includes('/almacen/salidas/pedido')) {
        const rawPedido = sessionStorage.getItem('pedidoParaEntregar');
        if (rawPedido) {
          const pedidoData = JSON.parse(rawPedido);
          if (pedidoData.pedido_id && result.data?.id) {
            await pedidosAlmacenService.updateEstado(pedidoData.pedido_id, 'Entregado', result.data.id);
          }
        }
      }

      showSuccess(null, 'Venta registrada con éxito');
      if (vaciarCanasta) vaciarCanasta();
      if (onSuccess) onSuccess(result.data);

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
      title="Confirmar Venta"
      confirmText="Realizar Venta"
      onConfirm={handleConfirm}
      loading={isSubmitting}
      disableClose={isSubmitting}
      contentStyle={{ paddingBlock: 0 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: isSubmitting ? 'none' : 'auto', opacity: isSubmitting ? 0.7 : 1 }}>
        <InputFecha
          label="Fecha de registro"
          value={fechaRegistro}
          onChange={(val) => {
            setFechaRegistro(val);
            setErrors(prev => ({ ...prev, fechaRegistro: false }));
          }}
          required={true}
          error={errors.fechaRegistro}
          onClearError={() => setErrors(prev => ({ ...prev, fechaRegistro: false }))}
        />
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
            onChange={(e) => {
              setAdelanto(e.target.value);
              setErrors((prev) => ({ ...prev, adelanto: null }));
            }}
            placeholder="0"
            error={errors.adelanto ? errors.adelanto.message : false}
            errorType={errors.adelanto ? errors.adelanto.type : 'error'}
          />
        )}

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
        <Checkbox
          id="aplicar_porcentaje"
          label="Aplicar como porcentaje"
          checked={esPorcentaje}
          onChange={(checked) => setEsPorcentaje(checked)}
        />
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
          <span style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--secondary-color)' }}>
            Bs. {formatPrice(totalFinal)}
          </span>
        </div>
      </div>
    </ModalCentro>
  );
};

export default ConfirmacionVenta;