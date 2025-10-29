import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import productsAlmacenService from '../../../services/productsAlmacenService';
import EditarAgregarReceta from './EditarAgregarReceta';
import Switch from '../../common/Switch';
import Notification from '../../common/Notification';
import CategoriasAlmacen from './CategoriasAlmacen';
import NoData from '../../common/NoData';
import Text from '../../common/Text';

function EditarAgregar({ isOpen, setIsOpen, data = '', tipo, onProductCreated, onProductUpdated, preciosTipos = [], loadingPrecios = false }) {

  const [dataMov, setDataMov] = useState({
    name: '',
    description: '',
    stock: '',
    codigo_barras: '',
    category_id: '',
    grup: '',
    stock_minimo: '',
    prices: {} // Objeto para almacenar los precios por tipo
  });

  const [loading, setLoading] = useState(false);
  const [isRecetaOpen, setIsRecetaOpen] = useState(false);
  const [hasReceta, setHasReceta] = useState(false);
  const [recetaGuardada, setRecetaGuardada] = useState(null);
  const [hasMovements, setHasMovements] = useState(false);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [isCategoriasSeleccionOpen, setIsCategoriasSeleccionOpen] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  // Estado para notificaciones
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


  // Efecto para cargar los datos del producto en editar
  useEffect(() => {
    if (data && tipo === 'editar') {
      // Convertir price_product a prices
      const prices = {};
      if (data.price_product && Array.isArray(data.price_product)) {
        data.price_product.forEach(price => {
          if (price.prices_types && price.prices_types.id) {
            prices[price.prices_types.id] = price.valor || '';
          }
        });
      }

      // Cargar receta si existe
      let recetaData = null;
      if (data.recetas && data.recetas.length > 0) {
        const receta = data.recetas[0];
        recetaData = {
          descripcion: receta.descripcion || '',
          productos: receta.recetas_detalle ? receta.recetas_detalle.map(detalle => ({
            producto_acopio_id: detalle.products_acopio?.id || detalle.producto_acopio_id,
            cantidad: detalle.cantidad
          })) : []
        };
        setHasReceta(true);
      } else {
        setHasReceta(false);
      }

      setDataMov({
        name: data.name || '',
        description: data.description || '',
        stock: data.stock !== undefined && data.stock !== null ? data.stock : '',
        codigo_barras: data.codigo_barras || '',
        category_id: data.category_id || '',
        grup: data.grup || '',
        stock_minimo: data.stock_minimo !== undefined && data.stock_minimo !== null ? data.stock_minimo : '',
        prices: prices
      });

      // Establecer la categoría seleccionada si existe
      if (data.category_id) {
        if (data.category_almacen) {
          // Si tenemos el objeto completo de la categoría
          setCategoriaSeleccionada(data.category_almacen);
        } else if (data.category_name) {
          // Si solo tenemos el nombre, crear un objeto temporal
          setCategoriaSeleccionada({
            id: data.category_id,
            name: data.category_name
          });
        } else {
          setCategoriaSeleccionada(null);
        }
      } else {
        setCategoriaSeleccionada(null);
      }

      // Cargar receta guardada
      setRecetaGuardada(recetaData);
    } else {
      setDataMov({
        name: '',
        description: '',
        stock: '',
        codigo_barras: '',
        category_id: '',
        grup: '',
        stock_minimo: '',
        prices: {}
      });
      setHasReceta(false);
      setRecetaGuardada(null);
      setCategoriaSeleccionada(null);
    }
    setNotification({
      isVisible: false,
      type: 'error',
      text: ''
    });
  }, [isOpen, data, tipo]);



  // Efecto para verificar movimientos cuando se está editando
  useEffect(() => {
    const checkMovements = async () => {
      if (data?.id && tipo === 'editar' && isOpen) {
        setLoadingMovements(true);
        try {
          // Por ahora no verificamos movimientos para productos de almacén
          // En el futuro se puede implementar si es necesario
          setHasMovements(false);
        } catch (error) {
          console.error('Error verificando movimientos:', error);
        } finally {
          setLoadingMovements(false);
        }
      } else {
        setHasMovements(false);
      }
    };

    checkMovements();
  }, [data?.id, tipo, isOpen]);
  // Función para actualizar los datos del formulario
  const handleChange = (field, value) => {
    setDataMov({ ...dataMov, [field]: value });
  };



  // Función para actualizar los precios
  const handlePriceChange = (priceTypeId, value) => {
    setDataMov(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [priceTypeId]: value
      }
    }));
  };
  // Función para manejar el switch de receta
  const handleRecetaSwitch = (checked) => {
    setHasReceta(checked);
    if (!checked) {
      setRecetaGuardada(null);
    }
  };
  // Función para manejar cuando se selecciona una categoría
  const handleCategoriaSeleccionada = (categoria) => {
    setCategoriaSeleccionada(categoria);
    setDataMov(prev => ({ ...prev, category_id: categoria.id }));
    setIsCategoriasSeleccionOpen(false);
  };



  // Función para manejar cuando se crea una receta
  const handleRecetaCreated = (recetaData) => {
    setRecetaGuardada(recetaData);
    setIsRecetaOpen(false);
  };
  // Función para manejar cuando se actualiza una receta
  const handleRecetaUpdated = (recetaData) => {
    setRecetaGuardada(recetaData);
    setIsRecetaOpen(false);
  };


  // Función para enviar los datos
  const handleSubmit = async () => {
    if (!dataMov.name.trim()) {
      mostrarNotificacion('error', 'El nombre es obligatorio');
      return;
    }

    if (dataMov.stock === '' || dataMov.stock === null || dataMov.stock === undefined) {
      mostrarNotificacion('error', 'El stock es obligatorio');
      return;
    }

    if (isNaN(dataMov.stock) || parseInt(dataMov.stock) < 0) {
      mostrarNotificacion('error', 'El stock debe ser un número válido mayor o igual a 0');
      return;
    }

    // Validar receta solo si está marcado el switch
    if (hasReceta && (!recetaGuardada || !recetaGuardada.productos || recetaGuardada.productos.length === 0)) {
      mostrarNotificacion('error', 'Debe crear una receta con al menos un producto');
      return;
    }

    setLoading(true);
    try {
      let response;
      const productData = {
        name: dataMov.name,
        description: dataMov.description,
        stock: parseInt(dataMov.stock),
        codigo_barras: dataMov.codigo_barras,
        category_id: dataMov.category_id,
        grup: dataMov.grup ? parseInt(dataMov.grup) : null,
        stock_minimo: dataMov.stock_minimo ? parseFloat(dataMov.stock_minimo) : 0,
        prices: dataMov.prices,
        receta: hasReceta ? recetaGuardada : null // Incluir receta solo si está marcado el switch
      };

      if (tipo === 'editar') {
        response = await productsAlmacenService.update(data.id, productData);
      } else {
        response = await productsAlmacenService.create(productData);
      }

      if (response.success) {
        if (tipo === 'editar' && onProductUpdated) {
          onProductUpdated(response.data);
        } else if (tipo === 'agregar' && onProductCreated) {
          onProductCreated(response.data);
        }
        setIsOpen(false);
      } else {
        mostrarNotificacion('error', response.message || `Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} el producto`);
      }
    } catch (error) {
      console.error(`Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} producto:`, error);
      // Mostrar el mensaje de error del servidor (incluyendo permisos) con notificación
      mostrarNotificacion('error', error.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ViewModal isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
        <HeaderModal
          title={tipo === 'editar' ? 'Editar producto' : 'Nuevo producto'}
          onClose={() => setIsOpen(false)}
        />
        <div className={styles.modalContent}>
          <p className={styles.subTitle}>INFORMACIÓN DEL PRODUCTO</p>
            <InputNormal
              tipo="text"
              value={dataMov.name}
              placeholder='Nombre del Producto'
              onChange={(e) => handleChange('name', e.target.value)}
              icon='box'
            />

            <InputNormal
              tipo="text"
              value={dataMov.description}
              placeholder='Descripción'
              onChange={(e) => handleChange('description', e.target.value)}
              icon='text'
            />

            <InputNormal
              tipo="number"
              value={dataMov.stock}
              placeholder='Stock'
              onChange={(e) => handleChange('stock', e.target.value)}
              icon='calculator'
            />

            <InputNormal
              tipo="number"
              value={dataMov.stock_minimo}
              placeholder='Stock mínimo (opcional)'
              onChange={(e) => handleChange('stock_minimo', e.target.value)}
              icon='error'
              step="0.01"
              min="0"
            />

            <InputNormal
              tipo="text"
              value={dataMov.codigo_barras}
              placeholder='Código de barras'
              onChange={(e) => handleChange('codigo_barras', e.target.value)}
              icon='barcode'
            />

            <InputNormal
              tipo="number"
              value={dataMov.grup}
              placeholder='Grupo (ej: 12 para docena)'
              onChange={(e) => handleChange('grup', e.target.value)}
              icon='package'
              step="1"
              min="1"
            />


          <Boton
            className='btn-gray'
            label={categoriaSeleccionada ? 'Categoría: ' + categoriaSeleccionada.name : 'Seleccionar Categoría (opcional)'}
            onClick={() => setIsCategoriasSeleccionOpen(true)}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          />

          {/* Sección de Precios */}
          <p className={styles.subTitle}>PRECIOS</p>
          {loadingPrecios ? (
            <NoData
              icon="loader-alt"
              title="Cargando precios..."
              detail="Obteniendo tipos de precios disponibles para configurar"
              transparent={true}
              minHeight="150px"
            />
          ) : (
            (() => {
              const rows = [];
              for (let i = 0; i < preciosTipos.length; i += 2) {
                rows.push(preciosTipos.slice(i, i + 2));
              }
              return rows.map((row, rowIndex) => (
                <div className={styles.horizontal} key={`row-${rowIndex}`}>
                  {row.map((priceType) => (
                    <InputNormal
                      key={priceType.id}
                      tipo="number"
                      value={dataMov.prices[priceType.id] || ''}
                      placeholder={priceType.name}
                      onChange={(e) => handlePriceChange(priceType.id, e.target.value)}
                      icon='dollar'
                      step="0.01"
                      min="0"
                    />
                  ))}
                </div>
              ));
            })()
          )}
          {/* Switch para receta */}
          <div className={styles.content} style={{ padding: '10px 15px' }}>
            <Switch
              title="¿Tiene receta?"
              subtitle="Marca si este producto se produce a partir de materias primas de acopio"
              checked={hasReceta}
              onChange={handleRecetaSwitch}
              icon="receipt"
            />
          </div>

          {/* Botón de receta (solo si está marcado el switch) */}
          {hasReceta && (
            <>
              <Boton
                className='btn-gray'
                label={recetaGuardada ? 'Editar Receta' : 'Crear Receta'}
                style={{ marginTop: 'auto' }}
                onClick={() => setIsRecetaOpen(true)}
              />
              {recetaGuardada && recetaGuardada.productos && recetaGuardada.productos.length > 0 ? (
                <Text type="success" align="left">
                  Receta guardada con {recetaGuardada.productos.length} productos
                </Text>
              ) : (
                <Text type="error" align="left">
                  Debe crear una receta con al menos un producto
                </Text>
              )}
          </>
          )}

          <Boton
            className='btn-original'
            label={tipo === 'editar' ? 'Guardar cambios' : 'Agregar producto'}
            style={{ marginTop: 'auto' }}
            onClick={handleSubmit}
            loading={loading}
            disabled={!dataMov.name.trim() || dataMov.stock === '' || dataMov.stock === null || dataMov.stock === undefined || (hasReceta && (!recetaGuardada || !recetaGuardada.productos || recetaGuardada.productos.length === 0))}
          />

        </div>

        <Notification
          isVisible={notification.isVisible}
          type={notification.type}
          text={notification.text}
        />
        {/* Modal de selección de categorías */}
        <CategoriasAlmacen
          isOpen={isCategoriasSeleccionOpen}
          setIsOpen={setIsCategoriasSeleccionOpen}
          modoSeleccion={true}
          onCategoriaSeleccionada={handleCategoriaSeleccionada}
        />
      </ViewModal>



      {/* Modal de receta */}
      <EditarAgregarReceta
        isOpen={isRecetaOpen}
        setIsOpen={setIsRecetaOpen}
        productoAlmacenId={data?.id || null}
        recetaData={recetaGuardada}
        onRecetaCreated={handleRecetaCreated}
        onRecetaUpdated={handleRecetaUpdated}
      />
    </>
  );
}

export default EditarAgregar;