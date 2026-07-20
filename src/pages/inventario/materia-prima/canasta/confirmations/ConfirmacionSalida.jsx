import React, { useState, useEffect } from 'react';
import ModalCentro from '../../../../../components/common/modals/ModalCentro';
import Input from '../../../../../components/common/inputs/Input';
import SelectCliente from '../../../../../components/common/fast/SelectCliente';
import InfoDisplay from '../../../../../components/common/outputs/InfoDisplay';
import movimientosAcopioService from '../../../../../services/movimientosAcopioService';
import { useToast } from '../../../../../context/ToastContext';

const ConfirmacionSalida = ({ isOpen, onClose, producto, onSuccess }) => {
  const { showSuccess, showDanger } = useToast();
  const [cantidad, setCantidad] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [cliente, setCliente] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCantidad('');
      setObservaciones('');
      setCliente(null);
      setErrors({});
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    const newErrors = {};
    if (!cantidad || Number(cantidad) <= 0) newErrors.cantidad = true;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setIsSubmitting(true);

    try {
      const payload = {
        product_id: producto.id,
        type: 'salida',
        quantity: Number(cantidad),
        observations: observaciones || null,
        cliente_id: cliente || null
      };

      const result = await movimientosAcopioService.create(payload);

      if (!result.success) {
        showDanger(null, result.message || 'Error al registrar la salida');
        return;
      }

      showSuccess(null, 'Salida registrada con éxito');
      if (onSuccess) onSuccess();
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
      title="Confirmar Salida"
      confirmText="Generar Salida"
      onConfirm={handleConfirm}
      loading={isSubmitting}
      disableClose={isSubmitting}
      contentStyle={{ paddingBlock: 0 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', pointerEvents: isSubmitting ? 'none' : 'auto', opacity: isSubmitting ? 0.7 : 1 }}>
        {producto && (() => {
          let color;
          const qty = Number(producto.quantity ?? 0);
          const min = Number(producto.stock_minimo ?? 0);
          if (min > 0) {
            if (qty <= min) color = 'var(--error-color)';
            else if (qty <= min * 1.5) color = 'var(--warning-color)';
            else color = 'var(--info-color)';
          } else {
            if (qty <= 0) color = 'var(--error-color)';
            else if (qty <= 5) color = 'var(--warning-color)';
            else color = 'var(--info-color)';
          }

          return (
        
               <InfoDisplay 
                 label="Producto Seleccionado"
                 value={producto.name}
                 subValue={`Stock: ${qty} ${producto.type_measure?.code || ''}`}
                 subValueColor={color}
                 icon="bx-box"
                 noSubValueBackground={true}
               />
          
          );
        })()}
        
        <Input 
          label="Cantidad"
          tipo="number"
          value={cantidad}
          onChange={(e) => { setCantidad(e.target.value); setErrors(prev => ({ ...prev, cantidad: false })); }}
          placeholder="0"
          required={true}
          error={errors.cantidad}
        />

        <Input 
          label="Observaciones"
          tipo="textarea"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Observaciones de la salida..."
        />

        <SelectCliente 
          value={cliente}
          onChange={(val) => setCliente(val)}
          fetchTrigger={isOpen}
          openDirection="up"
        />
      </div>
    </ModalCentro>
  );
};

export default ConfirmacionSalida;
