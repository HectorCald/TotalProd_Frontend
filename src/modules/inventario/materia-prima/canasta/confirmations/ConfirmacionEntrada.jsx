import React, { useState, useEffect } from 'react';
import ModalCentro from '../../../../../components/common/modals/ModalCentro';
import SelectProveedores from '../../../../../components/common/fast/SelectProveedores';
import SelectMetodoPago from '../../../../../components/common/fast/SelectMetodoPago';
import Input from '../../../../../components/common/inputs/Input';
import Checkbox from '../../../../../components/common/inputs/Checkbox';
import InfoDisplay from '../../../../../components/common/outputs/InfoDisplay';
import movimientosAcopioService from '../../../../../services/movimientosAcopioService';
import { useToast } from '../../../../../context/ToastContext';

const ConfirmacionEntrada = ({ isOpen, onClose, producto, onSuccess, pedidoId, hideGastosRecetas, defaultCantidad }) => {
  const { showSuccess, showDanger } = useToast();
  const [cantidad, setCantidad] = useState('');
  const [registrarGasto, setRegistrarGasto] = useState(false);
  const [consumirReceta, setConsumirReceta] = useState(false);

  const tieneReceta = producto?.recetas_acopio?.length > 0 && producto.recetas_acopio[0].recetas_acopio_detalle?.length > 0;
  const [cantidadesReceta, setCantidadesReceta] = useState({});
  const [observaciones, setObservaciones] = useState('');
  const [costo, setCosto] = useState('');
  const [proveedor, setProveedor] = useState(null);
  const [metodoPago, setMetodoPago] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCantidad('');
      setObservaciones('');
      setRegistrarGasto(false);
      setConsumirReceta(false);
      setCosto('');
      setProveedor(null);
      setMetodoPago(null);
      setErrors({});
      setCantidadesReceta({});
    } else if (defaultCantidad) {
      setCantidad(defaultCantidad.toString());
    }
  }, [isOpen, defaultCantidad]);

  // Recalcular cantidades de receta automáticamente cuando cambia la cantidad principal
  useEffect(() => {
    if (isOpen && tieneReceta) {
      const multiplier = Number(cantidad) || 0;
      const calculatedCantidades = {};
      producto.recetas_acopio[0].recetas_acopio_detalle.forEach(d => {
        calculatedCantidades[d.id] = d.cantidad * multiplier;
      });
      setCantidadesReceta(calculatedCantidades);
    }
  }, [isOpen, cantidad, tieneReceta, producto]);



  const handleConfirm = async () => {
    const newErrors = {};
    if (!cantidad || Number(cantidad) <= 0) newErrors.cantidad = true;

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
      // Las cantidades a consumir son exactamente las que se ven en los campos de ingredientes
      let ingredientesCantidadesPersonalizadas = null;
      if (!hideGastosRecetas && consumirReceta && tieneReceta) {
        ingredientesCantidadesPersonalizadas = producto.recetas_acopio[0].recetas_acopio_detalle.map(d =>
          parseFloat(cantidadesReceta[d.id]) || 0
        );
      }

      const payload = {
        product_id: producto.id,
        type: 'entrada',
        quantity: Number(cantidad),
        observations: observaciones || null,
        restar_materia_prima: hideGastosRecetas ? false : consumirReceta,
        ingredientes_cantidades_personalizadas: ingredientesCantidadesPersonalizadas,
        // Datos del pago (si aplica)
        registrar_gasto: hideGastosRecetas ? false : registrarGasto,
        costo: (!hideGastosRecetas && registrarGasto) ? parseFloat(costo) : null,
        metodo_pago: (!hideGastosRecetas && registrarGasto) ? metodoPago : null,
        proveedor_id: (!hideGastosRecetas && registrarGasto) ? proveedor : null,
        pedido_id: pedidoId || null
      };

      const result = await movimientosAcopioService.create(payload);

      if (!result.success) {
        showDanger(null, result.message || 'Error al registrar la entrada');
        return;
      }

      showSuccess(null, 'Entrada registrada con éxito');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess(result.data);
        setIsSubmitting(false);
      }, 300);
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
      confirmText="Generar Entrada"
      onConfirm={handleConfirm}
      loading={isSubmitting}
      disableClose={isSubmitting}
      contentStyle={{ paddingBlock: 0 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: isSubmitting ? 'none' : 'auto', opacity: isSubmitting ? 0.7 : 1 }}>
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
          placeholder="Observaciones de la entrada..."
        />

        {!hideGastosRecetas && (
          <>
            <Checkbox
              id="registrar_pago_mp"
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
                  Bs. {Number(costo || 0).toFixed(2)}
                </span>
              </div>
            </Checkbox>

            {tieneReceta && (
              <Checkbox
                id="consumir_receta_mp"
                label="Consumir receta"
                checked={consumirReceta}
                onChange={setConsumirReceta}
              >
                {producto.recetas_acopio[0].recetas_acopio_detalle.map((d) => (
                  <Input 
                    key={d.id}
                    label={`Consumo de ${d.products_acopio?.name || 'Ingrediente'} (${d.products_acopio?.type_measure?.code || ''})`}
                    tipo="number"
                    value={cantidadesReceta[d.id] ?? ''}
                    onChange={(e) => setCantidadesReceta(prev => ({ ...prev, [d.id]: e.target.value }))}
                  />
                ))}
              </Checkbox>
            )}
          </>
        )}
      </div>
    </ModalCentro>
  );
};

export default ConfirmacionEntrada;
