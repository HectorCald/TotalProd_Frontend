import React, { useState } from 'react';
import useFormatNumber from '../../../../../hooks/useFormatNumber';
import { useNavigate } from 'react-router-dom';
import ModalCentro from '../../../../../components/common/modals/ModalCentro';
import SelectSucursal from '../../../../../components/common/fast/SelectSucursal';
import Input from '../../../../../components/common/inputs/Input';
import InputFecha from '../../../../../components/common/inputs/InputFecha';
import pedidosAlmacenService from '../../../../../services/pedidosAlmacenService';
import { getSucuId } from '../../../../../config/apiClient';
import { useToast } from '../../../../../context/ToastContext';

const ConfirmacionPedido = ({ isOpen, onClose, totalBase, canasta, precioSeleccionado, modoAgrupacion, vaciarCanasta, pedidoDefaults }) => {
  const { showDanger, showSuccess } = useToast();
  const { formatPrice } = useFormatNumber();
  const navigate = useNavigate();
  const [sucursal, setSucursal] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [fechaRegistro, setFechaRegistro] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (pedidoDefaults) {
        setObservaciones(pedidoDefaults.observaciones || '');
        setSucursal(pedidoDefaults.sucursal_destino_id ? String(pedidoDefaults.sucursal_destino_id) : null);
      }
      
      if (pedidoDefaults?.fecha) {
        let fStr = pedidoDefaults.fecha;
        if (fStr.includes('T') || fStr.includes('Z')) {
          const d = new Date(fStr);
          fStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        } else {
          fStr = fStr.substring(0, 10);
        }
        setFechaRegistro(fStr);
      } else {
        const d = new Date();
        setFechaRegistro(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
      }
    }
  }, [isOpen, pedidoDefaults]);

  const isEditing = !!(pedidoDefaults && pedidoDefaults.id);

  const handleConfirm = async () => {
    const newErrors = {};
    if (!fechaRegistro) newErrors.fechaRegistro = true;
    if (!sucursal) newErrors.sucursal = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Validar que la sucursal destino no sea la misma que la actual
    const sucuActual = getSucuId();
    if (sucursal === sucuActual) {
      showDanger(null, 'No puedes pedir a la misma sucursal en la que te encuentras.');
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const agrupado = modoAgrupacion === 'grupo';

      const getProductPrice = (producto, priceTypeId) => {
        if (!priceTypeId || !producto.price_product) return 0;
        const priceObj = producto.price_product.find(p => p.prices_types?.id === priceTypeId || p.prices_types_id === priceTypeId);
        return priceObj ? Number(priceObj.valor) : 0;
      };

      const productos = (canasta || []).map(p => {
        const esPorGrupo = modoAgrupacion === 'grupo' && p.grup && Number(p.grup) > 0;
        const precioBase = getProductPrice(p, precioSeleccionado);
        
        // El pedido no redondea por defecto en ProductoItem (esVenta = false), pero aplicaremos la lógica cruda
        const precioGrupo = esPorGrupo ? precioBase * Number(p.grup) : precioBase;
        const precioMostrado = precioGrupo; // En pedidos no redondeamos
        const precioCanasta = (p.precioCustom !== undefined && p.precioCustom !== '') ? Number(p.precioCustom) : precioMostrado;
        
        const precioUnitarioFinal = esPorGrupo ? (precioCanasta / Number(p.grup)) : precioCanasta;

        return {
          id: p.id,
          cantidad: esPorGrupo ? Number(p.cantidad) * Number(p.grup) : Number(p.cantidad),
          precio: precioUnitarioFinal
        };
      });

      let result;
      if (isEditing) {
        result = await pedidosAlmacenService.updateFast(pedidoDefaults.id, {
          sucursal_destino_id: sucursal,
          observaciones: observaciones.trim() || null,
          precio_id: precioSeleccionado,
          agrupado,
          fecha: fechaRegistro,
          productos
        });
      } else {
        result = await pedidosAlmacenService.createFast({
          sucursal_destino_id: sucursal,
          observaciones: observaciones.trim() || null,
          precio_id: precioSeleccionado,
          agrupado,
          fecha: fechaRegistro,
          productos
        });
      }

      if (result.success) {
        showSuccess(null, isEditing ? 'Pedido modificado exitosamente.' : 'Pedido generado exitosamente.');
        if (vaciarCanasta) vaciarCanasta();
        if (isEditing) {
          sessionStorage.removeItem('pedidoParaEditar');
          navigate('/pedidos/almacen');
        }
        onClose();
      } else {
        showDanger(null, result.message || 'Error al procesar el pedido.');
      }
    } catch (err) {
      showDanger(null, 'Revisa tu conexión a internet');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalCentro
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? "Confirmar Edición" : "Confirmar Pedido"}
      confirmText={isEditing ? "Confirmar Edición" : "Generar Pedido"}
      onConfirm={handleConfirm}
      loading={loading}
      disableClose={loading}
      contentStyle={{ paddingBlock: 0 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.7 : 1 }}>
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
        <SelectSucursal 
          value={sucursal}
          onChange={(val) => { setSucursal(val); setErrors(prev => ({ ...prev, sucursal: false })); }}
          required={true}
          error={errors.sucursal}
          includeSocios={true}
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
          <span style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--secondary-color)' }}>
            Bs. {formatPrice(totalBase)}
          </span>
        </div>
      </div>
    </ModalCentro>
  );
};

export default ConfirmacionPedido;
