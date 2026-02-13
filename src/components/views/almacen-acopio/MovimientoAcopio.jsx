import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import Input from '../../common/inputs/Input';
import InputNormal from '../../common/InputNormal';
import Dato from '../../common/Dato';
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import gastosService from '../../../services/gastosService';
import { useToast } from '../../../context/ToastContext';
import Switch from '../../common/Switch';
import SelectorMetodoPago from '../../mixed/SelectorMetodoPago';
import Proveedores from '../proveedores/Proveedores';
import Clientes from '../clientes/Clientes';

function MovimientoAcopio({ isOpen, setIsOpen, producto, tipo, onMovimientoCreated }) {
  const { showSuccess, showDanger, showWarning } = useToast();
  const [dataMov, setDataMov] = useState({
    observations: '',
    proveedor_id: '',
    cliente_id: '',
    quantity: '',
    costo: '',
    metodo_pago: ''
  });

  const [loading, setLoading] = useState(false);
  const [cantidadError, setCantidadError] = useState(false);
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

  // Estado para calcular ingredientes que se van a consumir
  const [ingredientesAConsumir, setIngredientesAConsumir] = useState([]);

  // Estado para controlar qué ingrediente está siendo editado
  const [ingredienteEditando, setIngredienteEditando] = useState(null);

  // Estado para las cantidades personalizadas de ingredientes
  const [cantidadesPersonalizadas, setCantidadesPersonalizadas] = useState({});

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
      setCantidadError(false);
      // Resetear el switch de registrar gasto siempre a false
      setRegistrarGasto(false);
      // No resetear el switch de materia prima, mantener el valor del localStorage
    } else {
      // Limpiar estados de ingredientes cuando se cierra el modal
      setIngredienteEditando(null);
      setCantidadesPersonalizadas({});
      setIngredientesAConsumir([]);
    }
  }, [isOpen]);

  // Función para calcular ingredientes que se van a consumir (definida antes del useEffect que la usa)
  const calcularIngredientesAConsumir = (cantidad, receta) => {
    if (!cantidad || !receta || !receta.recetas_acopio_detalle) {
      return [];
    }
    const cantidadNumerica = parseFloat(cantidad);
    if (isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
      return [];
    }
    return receta.recetas_acopio_detalle.map((detalle, index) => {
      const cantidadCalculada = parseFloat(detalle.cantidad) * cantidadNumerica;
      const cantidadPersonalizada = cantidadesPersonalizadas[index];
      let cantidadFinal = cantidadCalculada;
      if (cantidadPersonalizada !== undefined && ingredienteEditando !== index) {
        cantidadFinal = parseFloat(cantidadPersonalizada) || 0;
      }
      return {
        nombre: detalle.products_acopio?.name || 'Producto desconocido',
        cantidad: parseFloat(cantidadFinal.toFixed(3)),
        cantidadCalculada: parseFloat(cantidadCalculada.toFixed(3)),
        unidad: detalle.products_acopio?.type_measure?.code || '',
        cantidadOriginal: detalle.cantidad,
        productoId: detalle.products_acopio?.id,
        index: index
      };
    });
  };

  // Efecto para calcular ingredientes cuando cambie la cantidad, la receta o las cantidades personalizadas
  useEffect(() => {
    if (tieneReceta && recetaData && dataMov.quantity) {
      const ingredientes = calcularIngredientesAConsumir(dataMov.quantity, recetaData);
      setIngredientesAConsumir(ingredientes);
    } else {
      setIngredientesAConsumir([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- calcularIngredientesAConsumir usa cantidadesPersonalizadas e ingredienteEditando ya listados
  }, [dataMov.quantity, recetaData, tieneReceta, cantidadesPersonalizadas, ingredienteEditando]);

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

  // Función para manejar la edición de ingredientes
  const handleEditarIngrediente = (index) => {
    setIngredienteEditando(index);
  };

  // Función para actualizar cantidad personalizada de ingrediente (solo en el input, no en el Dato)
  const handleCambiarCantidadIngrediente = (index, nuevaCantidad) => {
    setCantidadesPersonalizadas(prev => ({
      ...prev,
      [index]: nuevaCantidad
    }));
  };

  // Función para guardar la cantidad personalizada
  const handleGuardarCantidadIngrediente = (index) => {
    // Cerrar el modo de edición
    setIngredienteEditando(null);
  };

  // Función para cancelar la edición sin guardar cambios
  const handleCancelarEdicion = (index) => {
    // Limpiar cualquier cambio pendiente
    setCantidadesPersonalizadas(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });

    // Cerrar el modo de edición
    setIngredienteEditando(null);
  };

  // Función para enviar los datos
  const handleSubmit = async () => {
    if (!dataMov.quantity || dataMov.quantity <= 0) {
      setCantidadError(true);
      showWarning('Validación', 'La cantidad es obligatoria y debe ser mayor a 0', 5000);
      return;
    }

    // Validaciones específicas para entradas con registro de gasto
    if (tipo === 'entrada' && registrarGasto) {
      if (!dataMov.costo || dataMov.costo <= 0) {
        showWarning('Validación', 'El costo es obligatorio cuando se registra un gasto', 5000);
        return;
      }

      if (!dataMov.metodo_pago || dataMov.metodo_pago.trim() === '') {
        showWarning('Validación', 'El método de pago es obligatorio cuando se registra un gasto', 5000);
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
        restar_ingredientes: tipo === 'entrada' && restarMateriaPrima && tieneReceta,
        // Agregar cantidades personalizadas de ingredientes si existen
        ingredientes_cantidades_personalizadas: tipo === 'entrada' && restarMateriaPrima && tieneReceta && Object.keys(cantidadesPersonalizadas).length > 0 ? cantidadesPersonalizadas : null
      };

      let gastoId = null;

      // Si es entrada con registro de gasto activado, crear gasto simultáneamente
      if (tipo === 'entrada' && registrarGasto) {
        // Obtener fecha local en formato YYYY-MM-DD (no usar toISOString que devuelve UTC)
        const hoy = new Date();
        const año = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        const fechaLocal = `${año}-${mes}-${dia}`;

        const gastoData = {
          fecha_gasto: fechaLocal, // Fecha actual en formato YYYY-MM-DD (zona horaria local)
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
          showDanger('Error', `Error al crear gasto: ${gastoResponse.message}`, 5000);
          return;
        }
      }

      // Crear el movimiento (con o sin gasto_id)
      const response = await movimientosAcopioService.create(movimientoData);

      if (response.success) {
        showSuccess(
          tipo === 'entrada' ? 'Entrada registrada' : 'Salida registrada',
          `${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada correctamente`,
          5000
        );
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

        // Manejar específicamente errores de stock insuficiente de ingredientes
        if (response.ingredientesConStockInsuficiente && response.ingredientesConStockInsuficiente.length > 0) {
          // Crear mensaje detallado para ingredientes con stock insuficiente
          const ingredientesDetalle = response.ingredientesConStockInsuficiente.map(ing =>
            `${ing.nombre}: Stock actual ${ing.stockActual}, requerido ${ing.requerido}`
          ).join('\n');

          showDanger('Error', `Stock insuficiente de ingredientes:\n${ingredientesDetalle}`, 5000);
        } else {
          showDanger('Error', response.message || `Error al registrar ${tipo}`, 5000);
        }
      }
    } catch (error) {
      console.error(`Error al registrar ${tipo}:`, error);
      showDanger('Error', error.message || 'Error de conexión con el servidor', 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ViewModal isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
        <HeaderModal
          title={producto?.name}
          onClose={() => setIsOpen(false)}
        />

        <div className={styles.modalContent}>

          <p className={styles.subTitle}>INFORMACIÓN DEL PRODUCTO</p>
          <div className={styles.content}>
            <Dato
              label="Cantidad Actual"
              value={`${parseFloat(producto?.quantity || 0).toFixed(2)} ${producto?.type_measure?.code || ''}`}
              vertical={false}
            />
            <Dato
              label="Tipo de medida"
              value={producto?.type_measure?.name || 'No especificado'}
              vertical={false}
            />
          </div>

          <p className={styles.subTitle}>INFORMACIÓN DE LA {tipo === 'entrada' ? 'ENTRADA' : 'SALIDA'}</p>
          <Input
            tipo="number"
            label="Cantidad"
            value={dataMov.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            required={true}
            error={cantidadError}
            onClearError={() => setCantidadError(false)}
            step="0.01"
            min="0"
            readOnly={loading}
          />

          <Input
            tipo="text"
            label="Observaciones (opcional)"
            value={dataMov.observations}
            onChange={(e) => handleChange('observations', e.target.value)}
            readOnly={loading}
          />
          <div className={styles.space}></div>

          {/* Switch para registrar gasto solo para entradas */}
          {tipo === 'entrada' && (
            <div className={styles.content} style={{ padding: '10px 15px' }}>
              <Switch
                title="Registrar gasto"
                subtitle="Crear un gasto automáticamente con este movimiento"
                checked={registrarGasto}
                onChange={setRegistrarGasto}
                icon="money"
                readOnly={loading}
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
                readonly={loading}
              />

              <SelectorMetodoPago
                value={dataMov.metodo_pago}
                onChange={(value) => handleChange('metodo_pago', value)}
                readOnly={loading}
              />

              <Boton
                className='btn-gray'
                label={proveedorSeleccionadoData ? 'Proveedor: ' + proveedorSeleccionadoData.name : 'Seleccionar Proveedor (opcional)'}
                onClick={() => setIsProveedoresSeleccionOpen(true)}
                readOnly={loading}
              />

            </>
          )}

          {/* Selector de cliente para salidas */}
          {tipo === 'salida' && (
            <Boton
              className='btn-gray'
              label={clienteSeleccionadoData ? 'Cliente: ' + clienteSeleccionadoData.name : 'Seleccionar Cliente (opcional)'}
              onClick={() => setIsClientesSeleccionOpen(true)}
              readOnly={loading}
            />

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
                readOnly={loading}
              />
            </div>
          )}

          {/* Mostrar ingredientes que se van a consumir */}
          {tipo === 'entrada' && tieneReceta && restarMateriaPrima && ingredientesAConsumir.length > 0 && (
            <>
              <p className={styles.subTitle}>INGREDIENTES A CONSUMIR</p>
              {ingredientesAConsumir.map((ingrediente, index) => (
                <div key={index} className={styles.content}>
                  <Dato
                    label={ingrediente.nombre}
                    value={`${ingrediente.cantidad.toFixed(3)} ${ingrediente.unidad}`}
                    icon={ingredienteEditando === index ? "x" : "edit"}
                    onClick={() => {
                      if (ingredienteEditando === index) {
                        handleCancelarEdicion(index);
                      } else {
                        handleEditarIngrediente(index);
                      }
                    }}
                  />

                  {/* Input para editar cantidad cuando está en modo edición */}
                  {ingredienteEditando === index && (
                    <div style={{ marginTop: '10px', marginBottom: '10px', width: '100%' }}>
                      <InputNormal
                        style={{ width: '100%', marginBottom: '10px' }}
                        tipo="number"
                        value={cantidadesPersonalizadas[index] !== undefined ? cantidadesPersonalizadas[index] : ''}
                        placeholder={`Cantidad real a consumir (${ingrediente.unidad})`}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Solo permitir valores positivos o vacío
                          if (value === '' || parseFloat(value) >= 0) {
                            handleCambiarCantidadIngrediente(index, value);
                          }
                        }}
                        icon="calculator"
                        buttonIcon="check"
                        buttonIconClick={() => handleGuardarCantidadIngrediente(index)}
                        step="0.01"
                        min="0"
                        readonly={loading}
                      />
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
          <div className={styles.buttons}>
            <Boton
              className='btn-original'
              label={`Registrar ${tipo === 'entrada' ? 'Entrada' : 'Salida'}`}
              style={{ marginTop: 'auto' }}
              onClick={handleSubmit}
              loading={loading}
              disabled={loading}
            />
          </div>
        </div>
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
    </>
  );
}

export default MovimientoAcopio;
