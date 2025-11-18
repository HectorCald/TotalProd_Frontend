import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import InputDate from '../../common/InputDate';
import Proveedores from '../proveedores/Proveedores';
import Notification from '../../common/Notification';
import SelectorMetodoPago from '../../mixed/SelectorMetodoPago';
import gastosService from '../../../services/gastosService';

function EditarAgregarGasto({ isOpen, setIsOpen, onGastoCreated, gasto = null, tipo = 'agregar', onGastoUpdated }) {
  // Función para obtener la fecha actual en formato YYYY-MM-DD
  const obtenerFechaActual = () => {
    const hoy = new Date();
    return hoy.getFullYear() + '-' + 
      String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
      String(hoy.getDate()).padStart(2, '0');
  };

  const [dataGasto, setDataGasto] = useState({
    fecha: obtenerFechaActual(),
    valor: '',
    concepto: '',
    proveedor_id: '',
    metodo_pago: ''
  });

  const [loading, setLoading] = useState(false);
  const [isProveedoresSeleccionOpen, setIsProveedoresSeleccionOpen] = useState(false);
  const [proveedorSeleccionadoData, setProveedorSeleccionadoData] = useState(null);

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
      if (tipo === 'editar' && gasto) {
        // Modo edición - cargar datos del gasto
        setDataGasto({
          fecha: gasto.fecha_gasto || obtenerFechaActual(),
          valor: gasto.valor?.toString() || '',
          concepto: gasto.concepto || '',
          proveedor_id: gasto.proveedor_id || '',
          metodo_pago: gasto.metodo_pago || ''
        });
        setProveedorSeleccionadoData(gasto.proveedor || null);
      } else {
        // Modo agregar - establecer fecha actual por defecto
        setDataGasto({
          fecha: obtenerFechaActual(),
          valor: '',
          concepto: '',
          proveedor_id: '',
          metodo_pago: ''
        });
        setProveedorSeleccionadoData(null);
      }
    }
  }, [isOpen, gasto, tipo]);

  // Función para actualizar los datos del formulario
  const handleChange = (field, value) => {
    setDataGasto({ ...dataGasto, [field]: value });
  };

  // Función para manejar cuando se selecciona un proveedor
  const handleProveedorSeleccionado = (proveedor) => {
    setProveedorSeleccionadoData(proveedor);
    setDataGasto(prev => ({ ...prev, proveedor_id: proveedor.id }));
    setIsProveedoresSeleccionOpen(false);
  };

  // Función para enviar los datos
  const handleSubmit = async () => {
    // Validaciones
    if (!dataGasto.fecha) {
      mostrarNotificacion('error', 'La fecha es obligatoria');
      return;
    }

    if (!dataGasto.valor || dataGasto.valor <= 0) {
      mostrarNotificacion('error', 'El valor es obligatorio y debe ser mayor a 0');
      return;
    }

    if (!dataGasto.concepto.trim()) {
      mostrarNotificacion('error', 'El concepto es obligatorio');
      return;
    }

    if (!dataGasto.metodo_pago) {
      mostrarNotificacion('error', 'El método de pago es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const gastoData = {
        fecha_gasto: dataGasto.fecha,
        valor: parseFloat(dataGasto.valor),
        concepto: dataGasto.concepto.trim(),
        proveedor_id: dataGasto.proveedor_id || null,
        metodo_pago: dataGasto.metodo_pago
      };

      // Crear o actualizar el gasto
      let response;
      if (tipo === 'editar' && gasto?.id) {
        response = await gastosService.update(gasto.id, gastoData);
      } else {
        response = await gastosService.create(gastoData);
      }
      
      if (response.success) {
        // Cerrar modal y notificar
        setIsOpen(false);
        const mensaje = tipo === 'editar' ? 'Gasto actualizado correctamente' : 'Gasto registrado correctamente';
        mostrarNotificacion('success', mensaje);
        
        // Notificar al componente padre
        if (tipo === 'editar' && onGastoUpdated) {
          onGastoUpdated(response.data);
        } else if (onGastoCreated) {
          onGastoCreated(response.data);
        }
      } else {
        const mensajeError = tipo === 'editar' ? 'Error al actualizar el gasto' : 'Error al crear el gasto';
        mostrarNotificacion('error', response.message || mensajeError);
      }

    } catch (error) {
      console.error('Error al registrar gasto:', error);
      mostrarNotificacion('error', error.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderModal
        title={tipo === 'editar' ? 'Editar Gasto' : 'Nuevo Gasto'}
        onClose={() => setIsOpen(false)}
      />
      <div className={styles.modalContent}>
        <p className={styles.subTitle}>INFORMACIÓN DEL GASTO</p>

        {/* Campo de fecha */}
        <InputDate
          mode="date"
          value={dataGasto.fecha}
          onChange={(val) => handleChange('fecha', val)}
          placeholder="Fecha del gasto"
          icon="calendar"
        />

        {/* Campo de valor */}
        <InputNormal
          tipo="number"
          value={dataGasto.valor}
          placeholder='Valor del gasto (Bs.)'
          onChange={(e) => handleChange('valor', e.target.value)}
          icon='money'
          step="0.01"
          min="0"
        />

        {/* Campo de concepto */}
        <InputNormal
          tipo="text"
          value={dataGasto.concepto}
          placeholder='Concepto del gasto'
          onChange={(e) => handleChange('concepto', e.target.value)}
          icon='file'
        />

        {/* Selector de método de pago */}
        <SelectorMetodoPago
          value={dataGasto.metodo_pago}
          onChange={handleChange.bind(null, 'metodo_pago')}
        />

        {/* Selector de proveedor */}
          <Boton
            className='btn-gray'
            label={proveedorSeleccionadoData ? 'Proveedor: ' + proveedorSeleccionadoData.name : 'Seleccionar Proveedor (opcional)'}
            onClick={() => setIsProveedoresSeleccionOpen(true)}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          />


        <Boton
          className='btn-original'
          label={tipo === 'editar' ? 'Actualizar Gasto' : 'Registrar Gasto'}
          style={{ marginTop: 'auto' }}
          onClick={handleSubmit}
          loading={loading}
          disabled={!dataGasto.fecha || !dataGasto.valor || !dataGasto.concepto || !dataGasto.metodo_pago}
        />
      </div>
      {/* Modal de selección de proveedores */}
    <Proveedores
        isOpen={isProveedoresSeleccionOpen}
        setIsOpen={setIsProveedoresSeleccionOpen}
        modoSeleccion={true}
        onProveedorSeleccionado={handleProveedorSeleccionado}
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

export default EditarAgregarGasto;
