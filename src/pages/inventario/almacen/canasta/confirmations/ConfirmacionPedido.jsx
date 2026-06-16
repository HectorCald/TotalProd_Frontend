import React, { useState } from 'react';
import ModalCentro from '../../../../../components/common/modals/ModalCentro';
import SelectSucursal from '../../../../../components/common/fast/SelectSucursal';
import Input from '../../../../../components/common/inputs/Input';

const ConfirmacionPedido = ({ isOpen, onClose, totalBase }) => {
  const [sucursal, setSucursal] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [errors, setErrors] = useState({});

  const handleConfirm = () => {
    const newErrors = {};
    if (!sucursal) newErrors.sucursal = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    console.log('Realizar Pedido');
  };

  if (!isOpen) return null;

  return (
    <ModalCentro
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Pedido"
      confirmText="Generar Pedido"
      onConfirm={handleConfirm}
      width="450px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
        <SelectSucursal 
          value={sucursal}
          onChange={(val) => { setSucursal(val); setErrors(prev => ({ ...prev, sucursal: false })); }}
          required={true}
          error={errors.sucursal}
        />
        <Input 
          label="Observaciones del pedido"
          tipo="textarea"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Detalle del pedido..."
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
            Bs. {Number(totalBase).toFixed(2)}
          </span>
        </div>
      </div>
    </ModalCentro>
  );
};

export default ConfirmacionPedido;
