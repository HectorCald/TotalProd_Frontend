import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Select from '../../common/Select';
import Dato from '../../common/Dato';
import proveedorService from '../../../services/proveedorService';
import clientService from '../../../services/clientService';
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import MensajeError from '../../common/MensajeError';
import EditarAgregar from '../proveedores/EditarAgregar';
import EditarAgregarCliente from '../clientes/EditarAgregar';

function MovimientoAcopio({ isOpen, setIsOpen, producto, tipo, onMovimientoCreated }) {
  const [dataMov, setDataMov] = useState({
    observations: '',
    proveedor_id: '',
    cliente_id: '',
    quantity: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [proveedoresError, setProveedoresError] = useState('');
  const [clientesError, setClientesError] = useState('');
  const [isProveedorOpen, setIsProveedorOpen] = useState(false);
  const [isClienteOpen, setIsClienteOpen] = useState(false);

  // Efecto para cargar los proveedores (solo para entradas)
  useEffect(() => {
    const loadProveedores = async () => {
      if (tipo !== 'entrada') return;
      
      setLoadingProveedores(true);
      setProveedoresError('');
      setProveedores([]); // Limpiar proveedores al inicio
      try {
        const response = await proveedorService.getAll();
        if (response.success) {
          // Mapear los datos para el Select
          const mappedOptions = response.data.map(prov => ({
            value: prov.id,
            label: prov.name,
            id: prov.id,
            name: prov.name
          }));
          setProveedores(mappedOptions);
        } else {
          setProveedoresError(response.message || 'Error al cargar proveedores');
        }
      } catch (error) {
        setProveedoresError('Error al cargar proveedores');
      } finally {
        setLoadingProveedores(false);
      }
    };

    if (isOpen && tipo === 'entrada') {
      loadProveedores();
    }
  }, [isOpen, tipo]);

  // Efecto para cargar los clientes (solo para salidas)
  useEffect(() => {
    const loadClientes = async () => {
      if (tipo !== 'salida') return;
      
      setLoadingClientes(true);
      setClientesError('');
      setClientes([]); // Limpiar clientes al inicio
      try {
        const response = await clientService.getAll();
        if (response.success) {
          // Mapear los datos para el Select
          const mappedOptions = response.data.map(cliente => ({
            value: cliente.id,
            label: cliente.name,
            id: cliente.id,
            name: cliente.name
          }));
          setClientes(mappedOptions);
        } else {
          setClientesError(response.message || 'Error al cargar clientes');
        }
      } catch (error) {
        setClientesError('Error al cargar clientes');
      } finally {
        setLoadingClientes(false);
      }
    };

    if (isOpen && tipo === 'salida') {
      loadClientes();
    }
  }, [isOpen, tipo]);

  // Efecto para resetear el formulario
  useEffect(() => {
    if (isOpen) {
      setDataMov({
        observations: '',
        proveedor_id: '',
        cliente_id: '',
        quantity: ''
      });
      setErrorMessage('');
      setProveedoresError('');
      setClientesError('');
    }
  }, [isOpen]);

  // Función para actualizar los datos del formulario
  const handleChange = (field, value) => {
    setDataMov({ ...dataMov, [field]: value });
  };

  // Función para manejar cuando se crea un nuevo proveedor
  const handleProveedorCreated = (newProveedor) => {
    // Agregar el nuevo proveedor a la lista
    setProveedores(prev => [...prev, {
      value: newProveedor.id,
      label: newProveedor.name,
      id: newProveedor.id,
      name: newProveedor.name
    }]);
    // Seleccionar automáticamente el nuevo proveedor
    setDataMov(prev => ({ ...prev, proveedor_id: newProveedor.id }));
    // Cerrar el modal
    setIsProveedorOpen(false);
  };

  // Función para manejar cuando se crea un nuevo cliente
  const handleClienteCreated = (newCliente) => {
    // Agregar el nuevo cliente a la lista
    setClientes(prev => [...prev, {
      value: newCliente.id,
      label: newCliente.name,
      id: newCliente.id,
      name: newCliente.name
    }]);
    // Seleccionar automáticamente el nuevo cliente
    setDataMov(prev => ({ ...prev, cliente_id: newCliente.id }));
    // Cerrar el modal
    setIsClienteOpen(false);
  };

  // Función para enviar los datos
  const handleSubmit = async () => {
    if (!dataMov.quantity.trim()) {
      setErrorMessage('La cantidad es obligatoria');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
      const movimientoData = {
        product_id: producto.id,
        type: tipo, // 'entrada' o 'salida'
        observations: dataMov.observations.trim() || null,
        proveedor_id: tipo === 'entrada' ? (dataMov.proveedor_id || null) : null,
        cliente_id: tipo === 'salida' ? (dataMov.cliente_id || null) : null,
        quantity: dataMov.quantity.trim()
      };


      // Crear el movimiento
      const response = await movimientosAcopioService.create(movimientoData);

      if (response.success) {
        if (onMovimientoCreated) {
          onMovimientoCreated(response.data);
        }
        setIsOpen(false);
      } else {
        setErrorMessage(response.message || `Error al registrar ${tipo}`);
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error(`Error al registrar ${tipo}:`, error);
      setErrorMessage('Error de conexión con el servidor');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderModal
        title={`${tipo === 'entrada' ? 'Entrada' : 'Salida'} - ${producto?.name}`}
        onClose={() => setIsOpen(false)}
      />
      <div className={styles.modalContent}>
        <MensajeError mensaje={errorMessage} />
        
        <p className={styles.subTitle}>INFORMACIÓN DEL PRODUCTO</p>
        <div className={styles.content}>
          <Dato
            label="Cantidad"
            value={`${producto?.quantity || 0} ${producto?.type_measure?.code || ''}`}
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
        />

        <InputNormal
          tipo="text"
          value={dataMov.observations}
          placeholder='Observaciones (opcional)'
          onChange={(e) => handleChange('observations', e.target.value)}
        />

        {/* Select de proveedor para entradas */}
        {tipo === 'entrada' && (
          <div className={styles.content} style={{ padding: '10px 15px' }}>
            <Select
              value={dataMov.proveedor_id}
              onChange={(value) => handleChange('proveedor_id', value)}
              options={proveedores}
              placeholder='Proveedor (opcional)'
              disabled={loadingProveedores || !!proveedoresError}
            />

            {!proveedoresError && (
              <Boton
                className='btn-default'
                label='Nuevo Proveedor'
                onClick={() => setIsProveedorOpen(true)}
                style={{ minWidth: '80px' }}
              />
            )}
            {proveedoresError && (
              <div style={{ 
                color: '#dc3545',
                fontSize: '13px',
                textAlign: 'center',
                marginTop: '10px'
              }}>
                {proveedoresError}
              </div>
            )}
          </div>
        )}

        {/* Select de cliente para salidas */}
        {tipo === 'salida' && (
          <div className={styles.content} style={{ padding: '10px 15px' }}>
            <Select
              value={dataMov.cliente_id}
              onChange={(value) => handleChange('cliente_id', value)}
              options={clientes}
              placeholder='Cliente (opcional)'
              disabled={loadingClientes || !!clientesError}
            />

            {!clientesError && (
              <Boton
                className='btn-default'
                label='Nuevo Cliente'
                onClick={() => setIsClienteOpen(true)}
                style={{ minWidth: '80px' }}
              />
            )}
            {clientesError && (
              <div style={{ 
                color: '#dc3545',
                fontSize: '13px',
                textAlign: 'center',
                marginTop: '10px'
              }}>
                {clientesError}
              </div>
            )}
          </div>
        )}

        <Boton
          className='btn-original'
          label={`Registrar ${tipo === 'entrada' ? 'entrada' : 'salida'}`}
          style={{ marginTop: 'auto' }}
          onClick={handleSubmit}
          loading={loading}
          disabled={!dataMov.quantity.trim()}
        />
      </div>

      {/* Modal de nuevo proveedor */}
      <EditarAgregar
        isOpen={isProveedorOpen}
        setIsOpen={setIsProveedorOpen}
        tipo='agregar'
        onProveedorCreated={handleProveedorCreated}
      />

      {/* Modal de nuevo cliente */}
      <EditarAgregarCliente
        isOpen={isClienteOpen}
        setIsOpen={setIsClienteOpen}
        tipo='agregar'
        onClienteCreated={handleClienteCreated}
      />
    </ViewModal>
  );
}

export default MovimientoAcopio;
