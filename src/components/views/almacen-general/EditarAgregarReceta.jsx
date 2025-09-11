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
    setDataReceta(prev => ({
      ...prev,
      productos: [...prev.productos, { producto_acopio_id: '', cantidad: '' }]
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
      setErrorMessage('Todos los productos deben tener una cantidad válida');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);
    
    // Crear los datos de la receta
    const recetaData = {
      producto_almacen_id: productoAlmacenId,
      descripcion: dataReceta.descripcion,
      productos: dataReceta.productos.map(p => ({
        producto_acopio_id: p.producto_acopio_id,
        cantidad: parseFloat(p.cantidad)
      }))
    };

    console.log('Datos de la receta guardados en estado:', recetaData);

    // Simular un pequeño delay para mostrar el loading
    setTimeout(() => {
      if (recetaData && onRecetaUpdated) {
        // Si hay recetaData, es una actualización
        onRecetaUpdated(recetaData);
      } else if (onRecetaCreated) {
        // Si no hay recetaData, es una creación
        onRecetaCreated(recetaData);
      }
      setIsOpen(false);
      setLoading(false);
    }, 500);
  };

  return (
    <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderModal
        title={recetaData ? "Editar Receta" : "Crear Receta"}
        onClose={() => setIsOpen(false)}
      />
      <div className={styles.modalContent}>
        <MensajeError mensaje={errorMessage} />
        <p className={styles.subTitle}>INFORMACIÓN DE LA RECETA</p>

        <InputNormal
          tipo="text"
          value={dataReceta.descripcion}
          placeholder='Descripción de la receta'
          onChange={(e) => handleDescripcionChange(e.target.value)}
          icon='text'
        />



        <p className={styles.subTitle}>PRODUCTOS DE LA RECETA</p>
        
        {loadingProductos ? (
          <div className={styles.noData}>
            <p>Cargando productos...</p>
          </div>
        ) : (
          <Boton
            className='btn-default'
            label='+ Agregar Producto'
            onClick={agregarProducto}
            style={{ minWidth: '120px' }}
          />
        )}


        {dataReceta.productos.map((producto, index) => (
            <div key={index} className={styles.recetaProductoCard}>
              <div className={styles.recetaProductoHeader}>
              <Select
                    value={producto.producto_acopio_id}
                    onChange={(value) => actualizarProducto(index, 'producto_acopio_id', value)}
                    options={productosAcopio}
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

            <div className={styles.recetaProductoContent}>
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
          </div>
        ))}

        {dataReceta.productos.length === 0 && (
          <div className={styles.noData}>
            <p>No hay productos agregados. Presiona "Agregar Producto" para comenzar.</p>
          </div>
        )}


        <Boton
          className='btn-original'
          label='Guardar Receta'
          style={{ marginTop: 'auto' }}
          onClick={handleSubmit}
          loading={loading}
          disabled={dataReceta.productos.length === 0 || loadingProductos}
        />
      </div>
    </ViewModal>
  );
}

export default EditarAgregarReceta;
