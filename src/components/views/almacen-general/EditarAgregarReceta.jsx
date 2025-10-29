import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Select from '../../common/Select';
import productsAcopioService from '../../../services/productsAcopioService';
import MensajeError from '../../common/MensajeError';
import { BoxIcon } from 'boxicons-react';
import NoData from '../../common/NoData';

function EditarAgregarReceta({ isOpen, setIsOpen, productoAlmacenId, recetaData = null, onRecetaCreated, onRecetaUpdated }) {
  const [dataReceta, setDataReceta] = useState({
    descripcion: '',
    productos: [] // Array de {producto_acopio_id, cantidad}
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [productosAcopio, setProductosAcopio] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);

  // Efecto para cargar los productos de acopio
  useEffect(() => {
    const loadProductosAcopio = async () => {
      setLoadingProductos(true);
      try {
        const response = await productsAcopioService.getAll();
        if (response.success) {
          // Mapear los datos para el Select
          const mappedOptions = response.data.map(producto => ({
            value: producto.id,
            label: `${producto.name} (${producto.type_measure?.name || ''})`,
            id: producto.id,
            name: producto.name,
            quantity: producto.quantity,
            type_measure: producto.type_measure
          }));
          setProductosAcopio(mappedOptions);
        } else {
          console.error('Error al cargar productos de acopio:', response.message);
        }
      } catch (error) {
        console.error('Error al cargar productos de acopio:', error);
      } finally {
        setLoadingProductos(false);
      }
    };

    if (isOpen) {
      loadProductosAcopio();
    }
  }, [isOpen]);

  // Efecto para cargar datos de receta existente DESPUÉS de que se carguen los productos
  useEffect(() => {
    if (isOpen && recetaData && productosAcopio.length > 0) {
      // Solo cargar la receta cuando los productos estén disponibles
      // Validar que los productos de la receta existan en las opciones disponibles
      const productosValidos = recetaData.productos.filter(producto => {
        if (!producto.producto_acopio_id) {
          return false;
        }
        const existe = productosAcopio.some(option => option.value === producto.producto_acopio_id);
        return existe;
      });

      setDataReceta({
        descripcion: recetaData.descripcion || '',
        productos: productosValidos
      });
      setErrorMessage('');
    } else if (isOpen && !recetaData) {
      // Limpiar datos para nueva receta
      setDataReceta({
        descripcion: '',
        productos: []
      });
      setErrorMessage('');
    }
  }, [isOpen, recetaData, productosAcopio]);


  // Función para agregar un nuevo producto a la receta
  const agregarProducto = () => {
    // Calcular el límite de productos disponibles (excluyendo el producto actual)
    const productosDisponibles = productosAcopio.filter(option => option.value !== productoAlmacenId);
    const limiteMaximo = productosDisponibles.length;

    // Solo permitir agregar si no hemos alcanzado el límite de productos disponibles
    if (dataReceta.productos.length >= limiteMaximo) {
      setErrorMessage(`Solo se pueden agregar hasta ${limiteMaximo} productos (uno de cada tipo disponible)`);
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Solo permitir agregar si hay productos disponibles (no duplicados)
    const opcionesDisponibles = getOpcionesDisponibles(-1);
    if (opcionesDisponibles.length === 0) {
      setErrorMessage('No hay más productos disponibles para agregar');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setDataReceta(prev => ({
      ...prev,
      productos: [{ producto_acopio_id: '', cantidad: '' }, ...prev.productos]
    }));
  };

  // Función para eliminar un producto de la receta
  const eliminarProducto = (index) => {
    setDataReceta(prev => ({
      ...prev,
      productos: prev.productos.filter((_, i) => i !== index)
    }));
  };

  // Función para actualizar un producto específico
  const actualizarProducto = (index, field, value) => {
    setDataReceta(prev => ({
      ...prev,
      productos: prev.productos.map((producto, i) =>
        i === index ? { ...producto, [field]: value } : producto
      )
    }));
  };

  // Función para obtener las opciones disponibles para un select (excluyendo productos ya seleccionados y el producto actual)
  const getOpcionesDisponibles = (currentIndex) => {
    const productosSeleccionados = dataReceta.productos
      .map((p, index) => index !== currentIndex ? p.producto_acopio_id : null)
      .filter(id => id && id !== '');

    return productosAcopio.filter(option =>
      !productosSeleccionados.includes(option.value) &&
      option.value !== productoAlmacenId // Excluir el producto que se está editando
    );
  };

  // Función para actualizar la descripción
  const handleDescripcionChange = (value) => {
    setDataReceta(prev => ({ ...prev, descripcion: value }));
  };

  // Función para enviar la receta
  const handleSubmit = async () => {
    // Validar que haya al menos un producto
    if (dataReceta.productos.length === 0) {
      setErrorMessage('Debe agregar al menos un producto a la receta');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Validar que todos los productos tengan datos completos
    const productosIncompletos = dataReceta.productos.some(p =>
      !p.producto_acopio_id || !p.cantidad || p.cantidad <= 0
    );

    if (productosIncompletos) {
      setErrorMessage('Todos los productos deben tener un producto seleccionado y una cantidad válida');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Validar que no haya productos duplicados
    const productosIds = dataReceta.productos.map(p => p.producto_acopio_id);
    const productosUnicos = [...new Set(productosIds)];
    if (productosIds.length !== productosUnicos.length) {
      setErrorMessage('No se pueden agregar productos duplicados');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);

    // Crear los datos de la receta
    const nuevaRecetaData = {
      producto_almacen_id: productoAlmacenId,
      descripcion: dataReceta.descripcion,
      productos: dataReceta.productos.map(p => ({
        producto_acopio_id: p.producto_acopio_id,
        cantidad: parseFloat(p.cantidad)
      }))
    };

    // Ejecutar directamente sin delay
    // Si hay recetaData inicial (prop), es una actualización, si no, es una creación
    if (recetaData && onRecetaUpdated) {
      onRecetaUpdated(nuevaRecetaData);
    } else if (onRecetaCreated) {
      onRecetaCreated(nuevaRecetaData);
    }
    setIsOpen(false);
    setLoading(false);
  };

  return (
    <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderModal
        title={recetaData ? "Editar Receta" : "Crear Receta"}
        onClose={() => setIsOpen(false)}
      />
      <div className={styles.modalContent} style={{ minHeight: '60vh' }}>
        <MensajeError mensaje={errorMessage} />
        <p className={styles.subTitle}>INFORMACIÓN DE LA RECETA</p>

        <InputNormal
          tipo="text"
          value={dataReceta.descripcion}
          placeholder='Descripción de la receta'
          onChange={(e) => handleDescripcionChange(e.target.value)}
          icon='text'
        />

        {loadingProductos ? (
          <NoData
            icon="loader-alt"
            title="Cargando productos..."
            detail="Obteniendo productos de materia prima disponibles para la receta"
            transparent={true}
            minHeight="150px"
          />
        ) : (
          <>
            <Boton
              className='btn-default'
              label='+ Agregar Producto'
              onClick={agregarProducto}
              style={{ minWidth: '120px' }}
              disabled={
                dataReceta.productos.length >= (productosAcopio.filter(option => option.value !== productoAlmacenId).length) ||
                getOpcionesDisponibles(-1).length === 0
              }
            />
            {(dataReceta.productos.length >= (productosAcopio.filter(option => option.value !== productoAlmacenId).length) || getOpcionesDisponibles(-1).length === 0) && dataReceta.productos.length > 0 && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                {dataReceta.productos.length >= (productosAcopio.filter(option => option.value !== productoAlmacenId).length)
                  ? `Límite alcanzado: ${productosAcopio.filter(option => option.value !== productoAlmacenId).length} productos máximo`
                  : 'Todos los productos disponibles ya están en la receta'
                }
              </div>
            )}
          </>
        )}


        {dataReceta.productos.map((producto, index) => (
          <div key={index} className={styles.recetaProductoCard} style={{ padding: '10px 10px' }}>
            <div className={styles.recetaProductoHeader}>
              <Select
                value={producto.producto_acopio_id}
                onChange={(value) => actualizarProducto(index, 'producto_acopio_id', value)}
                options={getOpcionesDisponibles(index)}
                placeholder='Seleccionar producto'
                disabled={loadingProductos}
                icon='box'
              />

              <button
                className={styles.btnEliminar}
                onClick={() => eliminarProducto(index)}
              >
                <BoxIcon name='trash' className={styles.btnEliminarIcon} />
              </button>
            </div>


              <InputNormal
                tipo="number"
                value={producto.cantidad}
                placeholder='Cantidad'
                icon='calculator'
                onChange={(e) => actualizarProducto(index, 'cantidad', e.target.value)}
                step="0.01"
                min="0.01"
              />
    
          </div>
        ))}

        {dataReceta.productos.length === 0 && (
          <NoData
            icon="no-entry"
            title="Sin productos"
            detail="No hay productos agregados a la receta. Presiona 'Agregar Producto' para comenzar a configurar los ingredientes necesarios"
            transparent={false}
            minHeight="150px"
          />
        )}


        <Boton
          className='btn-original'
          label='Guardar Receta'
          style={{ marginTop: 'auto' }}
          onClick={handleSubmit}
          loading={loading}
          disabled={
            dataReceta.productos.length === 0 ||
            loadingProductos ||
            dataReceta.productos.some(p => !p.producto_acopio_id || !p.cantidad || p.cantidad <= 0)
          }
        />
      </div>
    </ViewModal>

  );
}

export default EditarAgregarReceta;
