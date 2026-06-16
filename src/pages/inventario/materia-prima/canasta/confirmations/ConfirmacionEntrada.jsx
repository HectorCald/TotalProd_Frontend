import React, { useState, useEffect } from 'react';
import ModalCentro from '../../../../../components/common/modals/ModalCentro';
import SelectProveedores from '../../../../../components/common/fast/SelectProveedores';
import SelectMetodoPago from '../../../../../components/common/fast/SelectMetodoPago';
import Input from '../../../../../components/common/inputs/Input';
import InputSwitch from '../../../../../components/common/inputs/InputSwitch';
import InfoDisplay from '../../../../../components/common/outputs/InfoDisplay';

const ConfirmacionEntrada = ({ isOpen, onClose, producto }) => {
  const [cantidad, setCantidad] = useState('');
  const [registrarPago, setRegistrarPago] = useState(false);
  const [consumirReceta, setConsumirReceta] = useState(false);

  const tieneReceta = producto?.recetas_acopio?.length > 0 && producto.recetas_acopio[0].recetas_acopio_detalle?.length > 0;
  const [cantidadesReceta, setCantidadesReceta] = useState({});
  const [observaciones, setObservaciones] = useState('');
  const [costo, setCosto] = useState('');
  const [proveedor, setProveedor] = useState(null);
  const [metodoPago, setMetodoPago] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setCantidad('');
      setObservaciones('');
      setRegistrarPago(false);
      setConsumirReceta(false);
      setCosto('');
      setProveedor(null);
      setMetodoPago(null);
      setErrors({});
      setCantidadesReceta({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && tieneReceta) {
      const multiplier = Number(cantidad) || 0;
      const calculatedCantidades = {};
      producto.recetas_acopio[0].recetas_acopio_detalle.forEach(d => {
        // Multiplicar la cantidad base por la cantidad a ingresar
        calculatedCantidades[d.id] = d.cantidad * multiplier;
      });
      setCantidadesReceta(calculatedCantidades);
    }
  }, [isOpen, cantidad, tieneReceta, producto]);

  const handleConfirm = () => {
    const newErrors = {};
    if (!cantidad || Number(cantidad) <= 0) newErrors.cantidad = true;

    if (registrarPago) {
      if (!costo) newErrors.costo = true;
      if (!proveedor) newErrors.proveedor = true;
      if (!metodoPago) newErrors.metodoPago = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    console.log('Realizar Entrada directa', { producto, cantidad, observaciones, registrarPago, costo, proveedor, metodoPago, consumirReceta, cantidadesReceta });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalCentro
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Entrada"
      confirmText="Generar Entrada"
      onConfirm={handleConfirm}
      width="450px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
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
             <div style={{ marginBottom: '10px' }}>
               <InfoDisplay 
                 label="Producto Seleccionado"
                 value={producto.name}
                 subValue={`Stock: ${qty} ${producto.type_measure?.code || ''}`}
                 subValueColor={color}
                 icon="bx-box"
               />
             </div>
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
          placeholder="Observaciones de la entrada..."
        />

        {tieneReceta && (
          <InputSwitch 
            label="Consumir receta"
            checked={consumirReceta}
            onChange={(checked) => setConsumirReceta(checked)}
          />
        )}

        {consumirReceta && tieneReceta && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '10px', borderLeft: '2px solid var(--primary-color-light)', marginTop: '-5px', marginBottom: '5px' }}>
            {producto.recetas_acopio[0].recetas_acopio_detalle.map((d) => (
              <Input 
                key={d.id}
                label={`Consumo de ${d.products_acopio?.name || 'Ingrediente'} (${d.products_acopio?.type_measure?.code || ''})`}
                tipo="number"
                value={cantidadesReceta[d.id] || ''}
                onChange={(e) => setCantidadesReceta(prev => ({ ...prev, [d.id]: e.target.value }))}
              />
            ))}
          </div>
        )}

        <InputSwitch 
          label="Registrar pago"
          checked={registrarPago}
          onChange={(checked) => {
            setRegistrarPago(checked);
            if (!checked) {
              setErrors(prev => {
                 const copy = { ...prev };
                 delete copy.costo;
                 delete copy.proveedor;
                 delete copy.metodoPago;
                 return copy;
              });
            }
          }}
        />

        {registrarPago && (
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

        {registrarPago && (
          <div style={{ 
            paddingTop: '15px', 
            borderTop: '1px dashed var(--quaternary-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '14px', color: 'var(--secondary-color)' }}>Pago a registrar:</span>
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
