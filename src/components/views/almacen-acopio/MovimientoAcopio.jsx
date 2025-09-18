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
import Switch from '../../common/Switch';
import PantallaExito from '../../common/PantallaExito';
import Proveedores from '../proveedores/Proveedores';
import Clientes from '../clientes/Clientes';

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
  
  // Estados para la pantalla de éxito
  const [isExitoOpen, setIsExitoOpen] = useState(false);
  const [movimientoCreado, setMovimientoCreado] = useState(null);
  const [datosParaExito, setDatosParaExito] = useState([]);

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
        quantity: ''
      });
      setErrorMessage('');
      setProveedoresError('');
      setClientesError('');
      // No resetear el switch, mantener el valor del localStorage
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
    setProveedorSeleccionadoData(newProveedor);
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
    setClienteSeleccionadoData(newCliente);
    // Cerrar el modal
    setIsClienteOpen(false);
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
      setErrorMessage('La cantidad es obligatoria y debe ser mayor a 0');
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
        quantity: dataMov.quantity.toString(),
        // Agregar flag para restar materia prima
        restar_materia_prima: tipo === 'entrada' && restarMateriaPrima && tieneReceta
      };

      // Crear el movimiento
      const response = await movimientosAcopioService.create(movimientoData);

      if (response.success) {
        // Guardar datos del movimiento para mostrar en pantalla de éxito
        setMovimientoCreado(response.data);
        
        // Guardar datos del producto para mostrar en la pantalla de éxito
        setDatosParaExito([{
          nombre: producto.name,
          cantidad: `${dataMov.quantity} ${producto.type_measure?.code || 'u'}`,
          medida: ''
        }]);

        // Mostrar pantalla de éxito (NO cerrar el modal todavía)
        setIsExitoOpen(true);
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

        

        {/* Selector de proveedor para entradas */}
        {tipo === 'entrada' && (
          <div className={styles.content} style={{ padding: '5px 15px' }}>
            <Boton
              className='btn-transparent'
              label={proveedorSeleccionadoData ? proveedorSeleccionadoData.name : 'Seleccionar Proveedor (opcional)'}
              onClick={() => setIsProveedoresSeleccionOpen(true)}
              style={{ width: '100%', justifyContent: 'flex-start' }}
            />
          </div>
        )}

        {/* Selector de cliente para salidas */}
        {tipo === 'salida' && (
          <div className={styles.content} style={{ padding: '5px 15px' }}>
            <Boton
              className='btn-transparent'
              label={clienteSeleccionadoData ? clienteSeleccionadoData.name : 'Seleccionar Cliente (opcional)'}
              onClick={() => setIsClientesSeleccionOpen(true)}
              style={{ width: '100%', justifyContent: 'flex-start' }}
            />
          </div>
        )}
        {/* Switch para restar materia prima (solo para entradas y si tiene receta) */}
        {tipo === 'entrada' && tieneReceta && (
          <div>
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
          disabled={!dataMov.quantity || dataMov.quantity <= 0}
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

      {/* Pantalla de éxito */}
      <PantallaExito
        isOpen={isExitoOpen}
        setIsOpen={setIsExitoOpen}
        titulo={`¡${tipo === 'entrada' ? 'Entrada' : 'Salida'} Registrada!`}
        descripcion={`Tu ${tipo === 'entrada' ? 'entrada' : 'salida'} ha sido registrada correctamente.`}
        datosPedido={datosParaExito}
        totalGeneral={null} // No hay total para movimientos individuales
        onDescargarPDF={() => console.log('Descargar PDF')}
        onDescargarExcel={() => console.log('Descargar Excel')}
        onEnviarWhatsapp={() => console.log('Enviar WhatsApp')}
        onCerrar={() => {
          // Limpiar datos de éxito
          setDatosParaExito([]);
          setMovimientoCreado(null);
          // Cerrar la pantalla de éxito Y el modal de movimiento
          setIsExitoOpen(false);
          setIsOpen(false);
          
          // Llamar a onMovimientoCreated cuando se cierre todo
          if (onMovimientoCreated) {
            onMovimientoCreated(movimientoCreado, tieneReceta && restarMateriaPrima);
          }
        }}
      />

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
    </ViewModal>
  );
}

export default MovimientoAcopio;
