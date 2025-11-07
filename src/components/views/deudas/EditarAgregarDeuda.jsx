import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import InputDate from '../../common/InputDate';
import Clientes from '../clientes/Clientes';
import Notification from '../../common/Notification';
import deudasService from '../../../services/deudasService';
import { useLayout } from '../../../context/LayoutContext';

function EditarAgregarDeuda({ isOpen, setIsOpen, onDeudaCreated, deuda = null, tipo = 'agregar', onDeudaUpdated }) {
  const { isLargeScreen } = useLayout();
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

  // Estado para la notificación
  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'error',
    text: ''
  });
  const mostrarNotificacion = (tipo, texto) => {
    setNotification({
      isVisible: true,
      type: tipo,
      text: texto
    });

    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };


  // Efecto para resetear el formulario y establecer fecha actual
  useEffect(() => {
    if (isOpen) {
      if (tipo === 'editar' && deuda) {
        // Modo edición - cargar datos de la deuda
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
        // Modo agregar - establecer fecha actual por defecto
        const hoy = new Date();
        const fechaHoy = hoy.getFullYear() + '-' + 
          String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
          String(hoy.getDate()).padStart(2, '0'); // Formato YYYY-MM-DD local
        
        // Fecha de vencimiento por defecto: 30 días después
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

  // Función para actualizar los datos del formulario
  const handleChange = (field, value) => {
    setDataDeuda(prev => {
      const newData = { ...prev, [field]: value };
      
      // Mantener saldo pendiente sincronizado con el monto total editable
      if (field === 'monto_total') {
        newData.saldo_pendiente = value;
      }
      
      return newData;
    });
  };

  // Función para manejar cuando se selecciona un cliente
  const handleClienteSeleccionado = (cliente) => {
    setClienteSeleccionadoData(cliente);
    setDataDeuda(prev => ({ ...prev, cliente_id: cliente.id }));
    setIsClientesSeleccionOpen(false);
  };

  // Función para enviar los datos
  const handleSubmit = async () => {
    const soloVencimiento = tipo === 'editar' && deuda?.movimiento_salida_id;
    // Cliente obligatorio solo al crear
    if (!soloVencimiento && tipo !== 'editar' && !dataDeuda.cliente_id) {
      mostrarNotificacion('error', 'El cliente es obligatorio');
      return;
    }
    // Validaciones
    if (!soloVencimiento && !dataDeuda.fecha_deuda) {
      mostrarNotificacion('error', 'La fecha de deuda es obligatoria');
      return;
    }

    if (!dataDeuda.fecha_vencimiento) {
      mostrarNotificacion('error', 'La fecha de vencimiento es obligatoria');
      return;
    }

    if (!soloVencimiento && (!dataDeuda.monto_total || dataDeuda.monto_total <= 0)) {
      mostrarNotificacion('error', 'El monto total es obligatorio y debe ser mayor a 0');
      return;
    }

    if (!dataDeuda.concepto.trim()) {
      mostrarNotificacion('error', 'El concepto es obligatorio');
      return;
    }

    // Validar que la fecha de vencimiento sea posterior a la fecha de deuda
    if (!soloVencimiento && new Date(dataDeuda.fecha_vencimiento) <= new Date(dataDeuda.fecha_deuda)) {
      mostrarNotificacion('error', 'La fecha de vencimiento debe ser posterior a la fecha de deuda');
      return;
    }

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
        // Cerrar modal y notificar
        setIsOpen(false);
        const mensaje = tipo === 'editar' ? 'Deuda actualizada correctamente' : 'Deuda registrada correctamente';
        mostrarNotificacion('success', mensaje);
        
        // Notificar al componente padre
        if (tipo === 'editar' && onDeudaUpdated) {
          onDeudaUpdated(response.data);
        } else if (onDeudaCreated) {
          onDeudaCreated(response.data);
        }
      } else {
        const mensajeError = tipo === 'editar' ? 'Error al actualizar la deuda' : 'Error al crear la deuda';
        mostrarNotificacion('error', response.message || mensajeError);
      }

    } catch (error) {
      console.error('Error al registrar deuda:', error);
      mostrarNotificacion('error', error.message || 'Error de conexión con el servidor');
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
        {/* Campo de fecha de deuda (oculto cuando solo se permite vencimiento/concepto) */}
        {!(tipo === 'editar' && deuda?.movimiento_salida_id) && (
          <>
            <span className={styles.subTitle}>FECHA DE DEUDA</span>
            <InputDate
              mode="date"
              value={dataDeuda.fecha_deuda}
              onChange={(val) => handleChange('fecha_deuda', val)}
              placeholder="Fecha de la deuda"
              icon="calendar"
            />
          </>
        )}

        {/* Campo de fecha de vencimiento */}
        <span className={styles.subTitle}>FECHA DE VENCIMIENTO</span>
        <InputDate
          mode="date"
          value={dataDeuda.fecha_vencimiento}
          onChange={(val) => handleChange('fecha_vencimiento', val)}
          placeholder="Fecha de vencimiento"
          icon="time"
        />

        {/* Campo de monto total (oculto cuando solo se permite vencimiento/concepto) */}
        {!(tipo === 'editar' && deuda?.movimiento_salida_id) && (
          <InputNormal
            tipo="number"
            value={dataDeuda.monto_total}
            placeholder='Monto total (Bs.)'
            onChange={(e) => handleChange('monto_total', e.target.value)}
            icon='dollar'
            step="0.01"
            min="0"
          />
        )}

        {/* Saldo pendiente no editable en modo edición */}

        {/* Campo de concepto */}
        <InputNormal
          tipo="text"
          value={dataDeuda.concepto}
          placeholder='Concepto de la deuda'
          onChange={(e) => handleChange('concepto', e.target.value)}
          icon='file'
        />


        {/* Selector de cliente (oculto cuando solo se permite vencimiento/concepto; obligatorio al crear) */}
        {!(tipo === 'editar' && deuda?.movimiento_salida_id) && (
          <Boton
            className='btn-gray'
            label={clienteSeleccionadoData ? 'Cliente: ' + clienteSeleccionadoData.name : 'Seleccionar Cliente'}
            onClick={() => setIsClientesSeleccionOpen(true)}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          />
        )}


        <Boton
          className='btn-original'
          label={tipo === 'editar' ? 'Actualizar Deuda' : 'Registrar Deuda'}
          style={{ marginTop: 'auto' }}
          onClick={handleSubmit}
          loading={loading}
          disabled={
            (tipo === 'editar' && deuda?.movimiento_salida_id)
              ? (!dataDeuda.fecha_vencimiento || !dataDeuda.concepto)
              : (!dataDeuda.fecha_deuda || !dataDeuda.fecha_vencimiento || !dataDeuda.monto_total || !dataDeuda.concepto || (tipo !== 'editar' && !dataDeuda.cliente_id))
          }
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

      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        text={notification.text}
      />
    </>
  );
}

export default EditarAgregarDeuda;
