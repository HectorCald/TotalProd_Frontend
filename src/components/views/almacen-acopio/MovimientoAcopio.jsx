import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Dato from '../../common/Dato';
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import gastosService from '../../../services/gastosService';
import Notification from '../../common/Notification';
import Switch from '../../common/Switch';
import SelectorMetodoPago from '../../mixed/SelectorMetodoPago';
import Proveedores from '../proveedores/Proveedores';
import Clientes from '../clientes/Clientes';

function MovimientoAcopio({ isOpen, setIsOpen, producto, tipo, onMovimientoCreated }) {
  const [dataMov, setDataMov] = useState({
    observations: '',
    proveedor_id: '',
    cliente_id: '',
    quantity: '',
    costo: '',
    metodo_pago: ''
  });

  const [loading, setLoading] = useState(false);
  
  // Estados para la notificación
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
  const [isProveedoresSeleccionOpen, setIsProveedoresSeleccionOpen] = useState(false);
  const [isClientesSeleccionOpen, setIsClientesSeleccionOpen] = useState(false);
  const [proveedorSeleccionadoData, setProveedorSeleccionadoData] = useState(null);
  const [clienteSeleccionadoData, setClienteSeleccionadoData] = useState(null);

  // Estados para el Switch de materia prima
  const [restarMateriaPrima, setRestarMateriaPrima] = useState(() => {
    const saved = localStorage.getItem('restarMateriaPrima');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [tieneReceta, setTieneReceta] = useState(false);
  const [recetaData, setRecetaData] = useState(null);

  // Estado para el Switch de registrar gasto
  const [registrarGasto, setRegistrarGasto] = useState(false);



  // Efecto para verificar si el producto tiene receta
  useEffect(() => {
    if (isOpen && producto) {
      const tieneReceta = producto.recetas_acopio && producto.recetas_acopio.length > 0;
      setTieneReceta(tieneReceta);
      setRecetaData(tieneReceta ? producto.recetas_acopio[0] : null);
    }
  }, [isOpen, producto]);

  // Efecto para resetear el formulario
  useEffect(() => {
    if (isOpen) {
      setDataMov({
        observations: '',
        proveedor_id: '',
        cliente_id: '',
        quantity: '',
        costo: '',
        metodo_pago: ''
      });
      // Resetear el switch de registrar gasto siempre a false
      setRegistrarGasto(false);
      // No resetear el switch de materia prima, mantener el valor del localStorage
    }
  }, [isOpen]);

  // Función para actualizar los datos del formulario
  const handleChange = (field, value) => {
    setDataMov({ ...dataMov, [field]: value });
  };


  // Función para manejar cuando se selecciona un proveedor
  const handleProveedorSeleccionado = (proveedor) => {
    setProveedorSeleccionadoData(proveedor);
    setDataMov(prev => ({ ...prev, proveedor_id: proveedor.id }));
    setIsProveedoresSeleccionOpen(false);
  };

  // Función para manejar cuando se selecciona un cliente
  const handleClienteSeleccionado = (cliente) => {
    setClienteSeleccionadoData(cliente);
    setDataMov(prev => ({ ...prev, cliente_id: cliente.id }));
    setIsClientesSeleccionOpen(false);
  };

  // Función para enviar los datos
  const handleSubmit = async () => {
    if (!dataMov.quantity || dataMov.quantity <= 0) {
      mostrarNotificacion('error', 'La cantidad es obligatoria y debe ser mayor a 0');
      return;
    }

    // Validaciones específicas para entradas con registro de gasto
    if (tipo === 'entrada' && registrarGasto) {
      if (!dataMov.costo || dataMov.costo <= 0) {
        mostrarNotificacion('error', 'El costo es obligatorio cuando se registra un gasto');
        return;
      }

      if (!dataMov.metodo_pago || dataMov.metodo_pago.trim() === '') {
        mostrarNotificacion('error', 'El método de pago es obligatorio cuando se registra un gasto');
        return;
      }
    }


    setLoading(true);
    try {
      const movimientoData = {
        product_id: producto.id,
        type: tipo, // 'entrada' o 'salida'
        observations: dataMov.observations.trim() || null,
        proveedor_id: tipo === 'entrada' ? (dataMov.proveedor_id || null) : null,
        cliente_id: tipo === 'salida' ? (dataMov.cliente_id || null) : null,
        quantity: dataMov.quantity.toString(),
        costo: tipo === 'entrada' ? (dataMov.costo ? parseFloat(dataMov.costo) : null) : null,
        metodo_pago: tipo === 'entrada' ? (dataMov.metodo_pago || null) : null,
        // Agregar flag para restar materia prima
        restar_materia_prima: tipo === 'entrada' && restarMateriaPrima && tieneReceta,
        // Agregar campo restar_ingredientes
        restar_ingredientes: tipo === 'entrada' && restarMateriaPrima && tieneReceta
      };

      let gastoId = null;

      // Si es entrada con registro de gasto activado, crear gasto simultáneamente
      if (tipo === 'entrada' && registrarGasto) {
        const gastoData = {
          fecha_gasto: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
          valor: parseFloat(dataMov.costo),
          concepto: `${producto.name} - ${dataMov.quantity} ${producto?.type_measure?.code || ''}`,
          metodo_pago: dataMov.metodo_pago,
          proveedor_id: dataMov.proveedor_id || null
        };

        const gastoResponse = await gastosService.create(gastoData);

        if (gastoResponse.success) {
          gastoId = gastoResponse.data.id;
          movimientoData.gasto_id = gastoId;
          console.log('Gasto creado simultáneamente:', gastoResponse.data);
        } else {
          mostrarNotificacion('error', `Error al crear gasto: ${gastoResponse.message}`);
          return;
        }
      }

      // Crear el movimiento (con o sin gasto_id)
      const response = await movimientosAcopioService.create(movimientoData);

      if (response.success) {
        // Cerrar el modal y notificar al componente padre
        setIsOpen(false);
        if (onMovimientoCreated) {
          onMovimientoCreated(response.data, tieneReceta && restarMateriaPrima);
        }
      } else {
        // Si hay error y se creó un gasto, intentar eliminarlo
        if (gastoId) {
          try {
            await gastosService.delete(gastoId);
            console.log('Gasto eliminado debido a error en movimiento');
          } catch (deleteError) {
            console.error('Error al eliminar gasto:', deleteError);
          }
        }

        mostrarNotificacion('error', response.message || `Error al registrar ${tipo}`);
      }
    } catch (error) {
      console.error(`Error al registrar ${tipo}:`, error);
      mostrarNotificacion('error', error.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <ViewModal isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
      <HeaderModal
        title={`${tipo === 'entrada' ? 'Entrada' : 'Salida'} - ${producto?.name}`}
        onClose={() => setIsOpen(false)}
      />
      
        <div className={styles.modalContent}>

          <p className={styles.subTitle}>INFORMACIÓN DEL PRODUCTO</p>
          <div className={styles.content}>
            <Dato
              label="Cantidad"
              value={`${parseFloat(producto?.quantity || 0).toFixed(2)} ${producto?.type_measure?.code || ''}`}
            />
            <Dato
              label="Tipo de medida"
              value={producto?.type_measure?.name || 'No especificado'}
            />
          </div>

          <p className={styles.subTitle}>INFORMACIÓN DEL MOVIMIENTO</p>

          <InputNormal
            tipo="number"
            value={dataMov.quantity}
            placeholder='Cantidad (obligatorio)'
            onChange={(e) => handleChange('quantity', e.target.value)}
            icon='calculator'
          />

          <InputNormal
            tipo="text"
            value={dataMov.observations}
            placeholder='Observaciones (opcional)'
            onChange={(e) => handleChange('observations', e.target.value)}
            icon='comment'
          />

          {/* Switch para registrar gasto solo para entradas */}
          {tipo === 'entrada' && (
            <div className={styles.content} style={{ padding: '10px 15px' }}>
              <Switch
                title="Registrar gasto"
                subtitle="Crear un gasto automáticamente con este movimiento"
                checked={registrarGasto}
                onChange={setRegistrarGasto}
                icon="money"
              />
            </div>
          )}

          {/* Campos de gasto */}
          {tipo === 'entrada' && registrarGasto && (
            <>
              <InputNormal
                tipo="number"
                value={dataMov.costo}
                placeholder='Costo (obligatorio)'
                onChange={(e) => handleChange('costo', e.target.value)}
                icon='money'
                step="0.01"
                min="0"
              />

              <SelectorMetodoPago
                value={dataMov.metodo_pago}
                onChange={(value) => handleChange('metodo_pago', value)}
              />

              <Boton
                className='btn-gray'
                label={proveedorSeleccionadoData ? 'Proveedor: '+proveedorSeleccionadoData.name : 'Seleccionar Proveedor (opcional)'}
                onClick={() => setIsProveedoresSeleccionOpen(true)}
              />

            </>
          )}

          {/* Selector de cliente para salidas */}
          {tipo === 'salida' && (
            <div className={styles.content} style={{ padding: '5px 15px' }}>
              <Boton
                className='btn-gray'
                label={clienteSeleccionadoData ? 'Cliente: '+clienteSeleccionadoData.name : 'Seleccionar Cliente (opcional)'}
                onClick={() => setIsClientesSeleccionOpen(true)}
              />
            </div>
          )}
          {/* Switch para restar materia prima (solo para entradas y si tiene receta) */}
          {tipo === 'entrada' && tieneReceta && (
            <div className={styles.content} style={{ padding: '10px 15px' }}>
              <Switch
                title="Restar materia prima"
                subtitle="Restar automáticamente los ingredientes de la receta del stock"
                checked={restarMateriaPrima}
                onChange={(value) => {
                  setRestarMateriaPrima(value);
                  localStorage.setItem('restarMateriaPrima', JSON.stringify(value));
                }}
                icon="minus-circle"
              />
            </div>
          )}

          <Boton
            className='btn-original'
            label={`Registrar ${tipo === 'entrada' ? 'entrada' : 'salida'}`}
            style={{ marginTop: 'auto' }}
            onClick={handleSubmit}
            loading={loading}
            disabled={
              !dataMov.quantity ||
              dataMov.quantity <= 0 ||
              (tipo === 'entrada' && registrarGasto && (!dataMov.costo || dataMov.costo <= 0 || !dataMov.metodo_pago || dataMov.metodo_pago.trim() === ''))
            }
          />
        </div>

        </ViewModal>
      {/* Modal de selección de proveedores */}
      <Proveedores
        isOpen={isProveedoresSeleccionOpen}
        setIsOpen={setIsProveedoresSeleccionOpen}
        modoSeleccion={true}
        onProveedorSeleccionado={handleProveedorSeleccionado}
      />

      {/* Modal de selección de clientes */}
      <Clientes
        isOpen={isClientesSeleccionOpen}
        setIsOpen={setIsClientesSeleccionOpen}
        modoSeleccion={true}
        onClienteSeleccionado={handleClienteSeleccionado}
      />

      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        text={notification.text}
      />
    </>
  );
}

export default MovimientoAcopio;
