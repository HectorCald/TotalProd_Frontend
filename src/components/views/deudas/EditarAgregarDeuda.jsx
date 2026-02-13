import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import Input from '../../common/inputs/Input';
import InputFecha from '../../common/inputs/InputFecha';
import InputCall from '../../common/inputs/InputCall';
import Clientes from '../clientes/Clientes';
import deudasService from '../../../services/deudasService';
import { useLayout } from '../../../context/LayoutContext';
import { useToast } from '../../../context/ToastContext';
import useHistorialLogger from '../../ui/HistorialLogger';

const fieldKeys = ['fecha_deuda', 'fecha_vencimiento', 'monto_total', 'concepto'];
const initialFieldErrors = Object.fromEntries(fieldKeys.map(k => [k, false]));

function EditarAgregarDeuda({ isOpen, setIsOpen, onDeudaCreated, deuda = null, tipo = 'agregar', onDeudaUpdated }) {
  const { isLargeScreen } = useLayout();
  const { showSuccess, showDanger, showWarning } = useToast();
  const { logAccion } = useHistorialLogger({ modulo: 'Deudas' });
  const [dataDeuda, setDataDeuda] = useState({
    fecha_deuda: '',
    fecha_vencimiento: '',
    monto_total: '',
    saldo_pendiente: '',
    concepto: '',
    estado: 'pendiente',
    cliente_id: ''
  });

  const [loading, setLoading] = useState(false);
  const [isClientesSeleccionOpen, setIsClientesSeleccionOpen] = useState(false);
  const [clienteSeleccionadoData, setClienteSeleccionadoData] = useState(null);
  const [fieldErrors, setFieldErrors] = useState(initialFieldErrors);

  // Efecto para resetear el formulario y establecer fecha actual
  useEffect(() => {
    setFieldErrors(initialFieldErrors);
    if (isOpen) {
      if (tipo === 'editar' && deuda) {
        setDataDeuda({
          fecha_deuda: deuda.fecha_deuda,
          fecha_vencimiento: deuda.fecha_vencimiento,
          monto_total: deuda.monto_total?.toString() || '',
          saldo_pendiente: deuda.saldo_pendiente?.toString() || '',
          concepto: deuda.concepto || '',
          estado: deuda.estado || 'pendiente',
          cliente_id: deuda.cliente_id || ''
        });
        setClienteSeleccionadoData(deuda.cliente || null);
      } else {
        const hoy = new Date();
        const fechaHoy = hoy.getFullYear() + '-' +
          String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
          String(hoy.getDate()).padStart(2, '0');
        const fechaVencimiento = new Date(hoy);
        fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
        const fechaVencimientoStr = fechaVencimiento.getFullYear() + '-' +
          String(fechaVencimiento.getMonth() + 1).padStart(2, '0') + '-' +
          String(fechaVencimiento.getDate()).padStart(2, '0');
        setDataDeuda({
          fecha_deuda: fechaHoy,
          fecha_vencimiento: fechaVencimientoStr,
          monto_total: '',
          saldo_pendiente: '',
          concepto: '',
          estado: 'pendiente',
          cliente_id: ''
        });
        setClienteSeleccionadoData(null);
      }
    }
  }, [isOpen, deuda, tipo]);

  const handleChange = (field, value) => {
    setDataDeuda(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'monto_total') newData.saldo_pendiente = value;
      return newData;
    });
    if (fieldKeys.includes(field)) setFieldErrors(prev => ({ ...prev, [field]: false }));
  };

  // Función para manejar cuando se selecciona un cliente
  const handleClienteSeleccionado = (cliente) => {
    setClienteSeleccionadoData(cliente);
    setDataDeuda(prev => ({ ...prev, cliente_id: cliente.id }));
    setIsClientesSeleccionOpen(false);
  };

  const handleSubmit = async () => {
    const soloVencimiento = tipo === 'editar' && deuda?.movimiento_salida_id;

    if (!soloVencimiento && !dataDeuda.fecha_deuda) {
      setFieldErrors(prev => ({ ...prev, fecha_deuda: true }));
      showWarning('Validación', 'La fecha de deuda es obligatoria', 5000);
      return;
    }
    if (!dataDeuda.fecha_vencimiento) {
      setFieldErrors(prev => ({ ...prev, fecha_vencimiento: true }));
      showWarning('Validación', 'La fecha de vencimiento es obligatoria', 5000);
      return;
    }
    const montoNum = parseFloat(String(dataDeuda.monto_total).replace(',', '.'));
    if (!soloVencimiento && (dataDeuda.monto_total === '' || dataDeuda.monto_total == null || isNaN(montoNum) || montoNum <= 0)) {
      setFieldErrors(prev => ({ ...prev, monto_total: true }));
      showWarning('Validación', 'El monto total es obligatorio y debe ser mayor a 0', 5000);
      return;
    }
    if (!dataDeuda.concepto.trim()) {
      setFieldErrors(prev => ({ ...prev, concepto: true }));
      showWarning('Validación', 'El concepto es obligatorio', 5000);
      return;
    }
    if (!soloVencimiento && new Date(dataDeuda.fecha_vencimiento) <= new Date(dataDeuda.fecha_deuda)) {
      setFieldErrors(prev => ({ ...prev, fecha_vencimiento: true, fecha_deuda: true }));
      showWarning('Validación', 'La fecha de vencimiento debe ser posterior a la fecha de deuda', 5000);
      return;
    }

    setFieldErrors(initialFieldErrors);
    setLoading(true);
    try {
      // En edición: si tiene movimiento, solo permitir fecha_vencimiento y concepto
      const deudaData = tipo === 'editar' ? (
        soloVencimiento ? {
          fecha_vencimiento: dataDeuda.fecha_vencimiento,
          concepto: dataDeuda.concepto.trim()
        } : {
          fecha_deuda: dataDeuda.fecha_deuda,
          fecha_vencimiento: dataDeuda.fecha_vencimiento,
          monto_total: parseFloat(dataDeuda.monto_total),
          saldo_pendiente: dataDeuda.saldo_pendiente !== '' ? parseFloat(dataDeuda.saldo_pendiente) : parseFloat(dataDeuda.monto_total),
          concepto: dataDeuda.concepto.trim(),
          estado: dataDeuda.estado,
          cliente_id: dataDeuda.cliente_id || null
        }
      ) : {
        fecha_deuda: dataDeuda.fecha_deuda,
        fecha_vencimiento: dataDeuda.fecha_vencimiento,
        monto_total: parseFloat(dataDeuda.monto_total),
        saldo_pendiente: dataDeuda.saldo_pendiente ? parseFloat(dataDeuda.saldo_pendiente) : parseFloat(dataDeuda.monto_total),
        concepto: dataDeuda.concepto.trim(),
        estado: dataDeuda.estado,
        cliente_id: dataDeuda.cliente_id || null
      };

      // Crear o actualizar la deuda
      let response;
      if (tipo === 'editar' && deuda?.id) {
        response = await deudasService.update(deuda.id, deudaData);
      } else {
        response = await deudasService.create(deudaData);
      }
      
      if (response.success) {
        const registroId = (response.data && response.data.id) || response.id || deuda?.id || null;
        const comentarioAccion = tipo === 'editar'
          ? 'Actualización de deuda'
          : 'Creación de deuda';

        // Detalles en orden del formulario. Keys en español.
        const clienteNombreAntes = tipo === 'editar' ? (deuda?.cliente?.name ?? null) : null;
        const clienteNombreDespues = clienteSeleccionadoData?.name ?? null;
        const montoDespues = dataDeuda.monto_total !== '' && dataDeuda.monto_total != null
          ? parseFloat(String(dataDeuda.monto_total).replace(',', '.'))
          : null;

        const camposOrden = [
          'Fecha de deuda',
          'Fecha de vencimiento',
          'Monto total (Bs.)',
          'Concepto',
          'Cliente'
        ];
        const camposDetalle = {
          'Fecha de deuda': tipo === 'editar'
            ? { antes: deuda?.fecha_deuda ?? null, despues: dataDeuda.fecha_deuda ?? null }
            : { despues: dataDeuda.fecha_deuda ?? null },
          'Fecha de vencimiento': tipo === 'editar'
            ? { antes: deuda?.fecha_vencimiento ?? null, despues: dataDeuda.fecha_vencimiento }
            : { despues: dataDeuda.fecha_vencimiento },
          'Monto total (Bs.)': tipo === 'editar'
            ? { antes: deuda?.monto_total ?? null, despues: montoDespues }
            : { despues: montoDespues },
          'Concepto': tipo === 'editar'
            ? { antes: deuda?.concepto ?? null, despues: dataDeuda.concepto }
            : { despues: dataDeuda.concepto },
          'Cliente': tipo === 'editar'
            ? { antes: clienteNombreAntes, despues: clienteNombreDespues }
            : { despues: clienteNombreDespues }
        };

        const detallesPersonalizados = {
          campos: camposDetalle,
          camposOrden,
          comentario: comentarioAccion
        };

        await logAccion({
          accion: tipo === 'editar' ? 'EDITAR' : 'CREAR',
          lugarAfectado: dataDeuda.concepto || 'Deuda',
          registroId,
          comentario: comentarioAccion,
          detallesPersonalizados
        });

        setIsOpen(false);
        const mensaje = tipo === 'editar' ? 'Deuda actualizada correctamente' : 'Deuda registrada correctamente';
        showSuccess('Éxito', mensaje);
        
        if (tipo === 'editar' && onDeudaUpdated) {
          onDeudaUpdated(response.data);
        } else if (onDeudaCreated) {
          onDeudaCreated(response.data);
        }
      } else {
        const mensajeError = tipo === 'editar' ? 'Error al actualizar la deuda' : 'Error al crear la deuda';
        showDanger('Error', response.message || mensajeError);
      }

    } catch (error) {
      console.error('Error al registrar deuda:', error);
      showDanger('Error', error.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderModal
        title={tipo === 'editar' ? 'Editar Deuda' : 'Nueva Deuda'}
        onClose={() => setIsOpen(false)}
      />
      <div className={styles.modalContent} style={!isLargeScreen ? { minHeight: '60vh' } : undefined}>
        <hr className={styles.separator} />

        {!(tipo === 'editar' && deuda?.movimiento_salida_id) && (
          <InputFecha
            label="Fecha de deuda"
            value={dataDeuda.fecha_deuda}
            onChange={(val) => handleChange('fecha_deuda', val)}
            required={true}
            readOnly={loading}
            error={fieldErrors.fecha_deuda}
            onClearError={() => setFieldErrors(prev => ({ ...prev, fecha_deuda: false }))}
          />
        )}

        <InputFecha
          label="Fecha de vencimiento"
          value={dataDeuda.fecha_vencimiento}
          onChange={(val) => handleChange('fecha_vencimiento', val)}
          required={true}
          readOnly={loading}
          error={fieldErrors.fecha_vencimiento}
          onClearError={() => setFieldErrors(prev => ({ ...prev, fecha_vencimiento: false }))}
        />

        {!(tipo === 'editar' && deuda?.movimiento_salida_id) && (
          <Input
            tipo="number"
            label="Monto total (Bs.)"
            value={dataDeuda.monto_total}
            onChange={(e) => handleChange('monto_total', e.target.value)}
            step="0.01"
            min="0"
            required={true}
            readOnly={loading}
            error={fieldErrors.monto_total}
            onClearError={() => setFieldErrors(prev => ({ ...prev, monto_total: false }))}
          />
        )}

        <Input
          tipo="text"
          label="Concepto"
          value={dataDeuda.concepto}
          onChange={(e) => handleChange('concepto', e.target.value)}
          required={true}
          readOnly={loading}
          error={fieldErrors.concepto}
          onClearError={() => setFieldErrors(prev => ({ ...prev, concepto: false }))}
        />

        {!(tipo === 'editar' && deuda?.movimiento_salida_id) && (
          <InputCall
            label="Cliente"
            value={clienteSeleccionadoData?.name ?? ''}
            placeholder="Seleccionar"
            onClick={() => setIsClientesSeleccionOpen(true)}
            onClear={() => {
              setClienteSeleccionadoData(null);
              setDataDeuda(prev => ({ ...prev, cliente_id: '' }));
            }}
            readOnly={loading}
          />
        )}
        <div className={styles.space}></div>
        <Boton
          className='btn-original'
          label={tipo === 'editar' ? 'Actualizar Deuda' : 'Registrar Deuda'}
          style={{ marginTop: 'auto' }}
          onClick={handleSubmit}
          loading={loading}
          disabled={loading}
        />
      </div>
      {/* Modal de selección de clientes */}
    <Clientes
        isOpen={isClientesSeleccionOpen}
        setIsOpen={setIsClientesSeleccionOpen}
        modoSeleccion={true}
        onClienteSeleccionado={handleClienteSeleccionado}
      />
    </ViewModal>
    </>
  );
}

export default EditarAgregarDeuda;
