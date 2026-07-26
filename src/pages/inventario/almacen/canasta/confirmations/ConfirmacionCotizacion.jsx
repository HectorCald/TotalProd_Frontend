import React, { useState } from 'react';
import useFormatNumber from '../../../../../hooks/useFormatNumber';
import ModalCentro from '../../../../../components/common/modals/ModalCentro';
import SelectCliente from '../../../../../components/common/fast/SelectCliente';
import SelectMetodoPago from '../../../../../components/common/fast/SelectMetodoPago';
import Input from '../../../../../components/common/inputs/Input';
import Checkbox from '../../../../../components/common/inputs/Checkbox';
import InputFecha from '../../../../../components/common/inputs/InputFecha';
import cotizacionesService from '../../../../../services/cotizacionesService';
import { useToast } from '../../../../../context/ToastContext';

const ConfirmacionCotizacion = ({ isOpen, onClose, totalBase, canasta, precioSeleccionado, vaciarCanasta, modoAgrupacion, cotizacionDefaults }) => {
  const { showSuccess, showDanger } = useToast();
  const { formatPrice } = useFormatNumber();

  const [cliente, setCliente] = useState(null);
  const [metodoPago, setMetodoPago] = useState(null);

  const getOneMonthLater = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  };

  const getTodayStr = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  const [fechaRegistro, setFechaRegistro] = useState(getTodayStr());
  const [fechaVencimiento, setFechaVencimiento] = useState(getOneMonthLater());
  const [descuento, setDescuento] = useState('');
  const [aumento, setAumento] = useState('');
  const [esPorcentaje, setEsPorcentaje] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (cotizacionDefaults) {
        setCliente(cotizacionDefaults.cliente_id ? String(cotizacionDefaults.cliente_id) : null);
        setMetodoPago(cotizacionDefaults.metodo_pago || null);
        setDescuento(cotizacionDefaults.descuento || '');
        setAumento(cotizacionDefaults.aumento || '');
        setEsPorcentaje(!!cotizacionDefaults.porcentaje);
        if (cotizacionDefaults.fecha) {
          setFechaRegistro(cotizacionDefaults.fecha.substring(0, 10));
        }
      } else {
        setFechaRegistro(getTodayStr());
      }
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

  const getProductPrice = (producto, priceTypeId) => {
    if (!priceTypeId || !producto.price_product) return 0;
    const priceObj = producto.price_product.find(p => p.prices_types?.id === priceTypeId || p.prices_types_id === priceTypeId);
    return priceObj ? Number(priceObj.valor) : 0;
  };

  const handleConfirm = async () => {
    const newErrors = {};
    if (!fechaRegistro) newErrors.fechaRegistro = true;
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
        fecha: fechaRegistro,
        fecha_vencimiento: fechaVencimiento || null,
        descuento: descVal,
        aumento: aumVal,
        porcentaje: esPorcentaje,
        productos: (canasta || []).map(p => {
          const esPorGrupo = modoAgrupacion === 'grupo' && p.grup && Number(p.grup) > 0;
          const precioBase = getProductPrice(p, precioSeleccionado);
          
          const precioGrupo = esPorGrupo ? precioBase * Number(p.grup) : precioBase;
          const precioMostrado = precioGrupo; // Ya no redondeamos aquí para que guarde el unitario intacto
          const precioCanasta = (p.precioCustom !== undefined && p.precioCustom !== '') ? Number(p.precioCustom) : precioMostrado;
          
          const precioUnitarioFinal = esPorGrupo ? (precioCanasta / Number(p.grup)) : precioCanasta;

          return {
            id: p.id,
            cantidad: esPorGrupo ? Number(p.cantidad) * Number(p.grup) : Number(p.cantidad),
            precio: precioUnitarioFinal
          };
        })
      };

      const result = await cotizacionesService.createFast(payload);

      if (!result.success) {
        showDanger(null, result.message || 'Error al registrar la cotización');
        return;
      }

      showSuccess(null, 'Cotización generada con éxito');
      if (vaciarCanasta) vaciarCanasta();

      setCliente(null);
      setMetodoPago(null);
      setFechaRegistro(getTodayStr());
      setFechaVencimiento(getOneMonthLater());
      setDescuento('');
      setAumento('');
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
      title="Confirmar Cotización"
      confirmText="Generar Cotización"
      onConfirm={handleConfirm}
      loading={isSubmitting}
      disableClose={isSubmitting}
      contentStyle={{ paddingBlock: 0 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: isSubmitting ? 'none' : 'auto', opacity: isSubmitting ? 0.7 : 1 }}>
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

export default ConfirmacionCotizacion;
