import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Select from '../../common/Select';
import Proveedores from '../proveedores/Proveedores';
import MensajeError from '../../common/MensajeError';
import gastosService from '../../../services/gastosService';

function EditarAgregarGasto({ isOpen, setIsOpen, onGastoCreated, gasto = null, tipo = 'agregar', onGastoUpdated }) {
  const [dataGasto, setDataGasto] = useState({
    fecha: '',
    valor: '',
    concepto: '',
    proveedor_id: '',
    metodo_pago: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProveedoresSeleccionOpen, setIsProveedoresSeleccionOpen] = useState(false);
  const [proveedorSeleccionadoData, setProveedorSeleccionadoData] = useState(null);

  // Función para mostrar notificaciones
  const mostrarNotificacion = (tipo, texto) => {
    console.log(`${tipo.toUpperCase()}: ${texto}`);
  };

  // Opciones de métodos de pago
  const metodosPago = [
    { value: 'qr', label: 'QR', icon: 'qr' },
    { value: 'transferencia', label: 'Transferencia', icon: 'transfer' },
    { value: 'tarjeta', label: 'Tarjeta', icon: 'credit-card' },
    { value: 'efectivo', label: 'Efectivo', icon: 'money' }
  ];

  // Efecto para resetear el formulario y establecer fecha actual
  useEffect(() => {
    if (isOpen) {
      if (tipo === 'editar' && gasto) {
        // Modo edición - cargar datos del gasto
        setDataGasto({
          fecha: gasto.fecha_gasto,
          valor: gasto.valor?.toString() || '',
          concepto: gasto.concepto || '',
          proveedor_id: gasto.proveedor_id || '',
          metodo_pago: gasto.metodo_pago || ''
        });
        setProveedorSeleccionadoData(gasto.proveedor || null);
      } else {
        // Modo agregar - establecer fecha actual por defecto
        const hoy = new Date();
        const fechaHoy = hoy.getFullYear() + '-' + 
          String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
          String(hoy.getDate()).padStart(2, '0'); // Formato YYYY-MM-DD local
        
        setDataGasto({
          fecha: fechaHoy,
          valor: '',
          concepto: '',
          proveedor_id: '',
          metodo_pago: ''
        });
        setProveedorSeleccionadoData(null);
      }
      setErrorMessage('');
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
      setErrorMessage('La fecha es obligatoria');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (!dataGasto.valor || dataGasto.valor <= 0) {
      setErrorMessage('El valor es obligatorio y debe ser mayor a 0');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (!dataGasto.concepto.trim()) {
      setErrorMessage('El concepto es obligatorio');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (!dataGasto.metodo_pago) {
      setErrorMessage('El método de pago es obligatorio');
      setTimeout(() => setErrorMessage(''), 3000);
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
        setErrorMessage(response.message || mensajeError);
        setTimeout(() => setErrorMessage(''), 5000);
      }

    } catch (error) {
      console.error('Error al registrar gasto:', error);
      setErrorMessage(error.message || 'Error de conexión con el servidor');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderModal
        title={tipo === 'editar' ? 'Editar Gasto' : 'Nuevo Gasto'}
        onClose={() => setIsOpen(false)}
      />
      <div className={styles.modalContent}>
        <MensajeError mensaje={errorMessage} />

        <p className={styles.subTitle}>INFORMACIÓN DEL GASTO</p>

        {/* Campo de fecha */}
        <InputNormal
          tipo="date"
          value={dataGasto.fecha}
          placeholder='Fecha del gasto'
          onChange={(e) => handleChange('fecha', e.target.value)}
          icon='calendar'
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
        <div className={styles.content} style={{ padding: '5px 15px' }}>
          <Select
            value={dataGasto.metodo_pago}
            onChange={handleChange.bind(null, 'metodo_pago')}
            options={metodosPago}
            placeholder='Método de pago'
            icon='credit-card'
          />
        </div>

        {/* Selector de proveedor */}
        <div className={styles.content} style={{ padding: '5px 15px' }}>
          <Boton
            className='btn-transparent'
            label={proveedorSeleccionadoData ? proveedorSeleccionadoData.name : 'Seleccionar Proveedor (opcional)'}
            onClick={() => setIsProveedoresSeleccionOpen(true)}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          />
        </div>


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
  );
}

export default EditarAgregarGasto;
