import React, { useState } from 'react';
import ModalCentro from '../../../../../components/common/modals/ModalCentro';
import SelectCliente from '../../../../../components/common/fast/SelectCliente';
import SelectMetodoPago from '../../../../../components/common/fast/SelectMetodoPago';
import Input from '../../../../../components/common/inputs/Input';
import InputSwitch from '../../../../../components/common/inputs/InputSwitch';
import InputFecha from '../../../../../components/common/inputs/InputFecha';

const ConfirmacionCotizacion = ({ isOpen, onClose, totalBase }) => {
  const [cliente, setCliente] = useState(null);
  const [metodoPago, setMetodoPago] = useState(null);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [descuento, setDescuento] = useState('');
  const [aumento, setAumento] = useState('');
  const [concepto, setConcepto] = useState('');
  const [esPorcentaje, setEsPorcentaje] = useState(false);
  const [errors, setErrors] = useState({});

  const descVal = Number(descuento) || 0;
  const aumVal = Number(aumento) || 0;

  let totalFinal = Number(totalBase) || 0;
  if (esPorcentaje) {
    totalFinal = totalFinal - (totalFinal * (descVal / 100)) + (totalFinal * (aumVal / 100));
  } else {
    totalFinal = totalFinal - descVal + aumVal;
  }

  const handleConfirm = () => {
    const newErrors = {};
    if (!metodoPago) newErrors.metodoPago = true;
    if (metodoPago === 'credito' && !cliente) newErrors.cliente = true;
    if (!fechaVencimiento) newErrors.fechaVencimiento = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    console.log('Realizar Cotización');
  };

  if (!isOpen) return null;

  return (
    <ModalCentro
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Cotización"
      confirmText="Generar Cotización"
      onConfirm={handleConfirm}
      width="450px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
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

        <Input 
          label="Concepto"
          tipo="text"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Detalle de la cotización..."
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

export default ConfirmacionCotizacion;
