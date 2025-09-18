import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import View from '../../ui/View';
import HeaderView from '../../common/HeaderView';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Select from '../../common/Select';
import productsAlmacenService from '../../../services/productsAlmacenService';
import categoryAlmacenService from '../../../services/categoryAlmacenService';
import pricesTypesService from '../../../services/pricesTypesService';
import EditarAgregarCategoria from './EditarAgregarCategoria';
import EditarAgregarReceta from './EditarAgregarReceta';
import Switch from '../../common/Switch';
import MensajeError from '../../common/MensajeError';
import CategoriasAlmacen from './CategoriasAlmacen';
import { BoxIcon } from 'boxicons-react';
function Formulario({ isOpen, setIsOpen, data = '', tipo, onProductCreated, onProductUpdated }) {
  
  const [dataMov, setDataMov] = useState({
    name: '',
    description: '',
    stock: '',
    codigo_barras: '',
    category_id: '',
    prices: {} // Objeto para almacenar los precios por tipo
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [pricesTypes, setPricesTypes] = useState([]);
  const [loadingPricesTypes, setLoadingPricesTypes] = useState(false);
  const [isCategoriaOpen, setIsCategoriaOpen] = useState(false);
  const [isRecetaOpen, setIsRecetaOpen] = useState(false);
  const [hasReceta, setHasReceta] = useState(false);
  const [recetaGuardada, setRecetaGuardada] = useState(null);
  const [hasMovements, setHasMovements] = useState(false);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [isCategoriasSeleccionOpen, setIsCategoriasSeleccionOpen] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  // Efecto para cargar los tipos de precios
  useEffect(() => {
    const loadPricesTypes = async () => {
      setLoadingPricesTypes(true);
      try {
        const response = await pricesTypesService.getAll();
        if (response.success) {
          setPricesTypes(response.data);
        } else {
          console.error('Error al cargar tipos de precios:', response.message);
        }
      } catch (error) {
        console.error('Error al cargar tipos de precios:', error);
      } finally {
        setLoadingPricesTypes(false);
      }
    };

    if (isOpen) {
      loadPricesTypes();
    }
  }, [isOpen]);

  // Efecto para cargar las categorías
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await categoryAlmacenService.getAll();
        if (response.success) {
          // Mapear los datos para el Select
          const mappedOptions = response.data.map(cat => ({
            value: cat.id,
            label: cat.name,
            id: cat.id,
            name: cat.name
          }));
          setCategories(mappedOptions);
        } else {
          console.error('Error al cargar categorías:', response.message);
        }
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  // Efecto para cargar los datos del producto
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
        stock: data.stock || '',
        codigo_barras: data.codigo_barras || '',
        category_id: data.category_id || '',
        prices: prices
      });

      // Establecer la categoría seleccionada si existe
      if (data.category_id && data.categoria) {
        setCategoriaSeleccionada(data.categoria);
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
        prices: {}
      });
      setHasReceta(false);
      setRecetaGuardada(null);
      setCategoriaSeleccionada(null);
    }
    setErrorMessage('');
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

  // Función para enviar los datos
  const handleSubmit = async () => {
    if (!dataMov.name.trim()) {
      setErrorMessage('El nombre es obligatorio');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (!dataMov.stock || dataMov.stock.toString().trim() === '') {
      setErrorMessage('El stock es obligatorio');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (isNaN(dataMov.stock) || parseInt(dataMov.stock) < 0) {
      setErrorMessage('El stock debe ser un número válido mayor o igual a 0');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Validar receta solo si está marcado el switch
    if (hasReceta && (!recetaGuardada || !recetaGuardada.productos || recetaGuardada.productos.length === 0)) {
      setErrorMessage('Debe crear una receta con al menos un producto');
      setTimeout(() => setErrorMessage(''), 3000);
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
        prices: dataMov.prices,
        receta: hasReceta ? recetaGuardada : null // Incluir receta solo si está marcado el switch
      };

      console.log('Datos del producto a enviar (incluyendo receta):', productData);

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
        setErrorMessage(response.message || `Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} el producto`);
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error(`Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} producto:`, error);
      setErrorMessage('Error de conexión con el servidor');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar cuando se crea una nueva categoría
  const handleCategoriaCreated = (newCategoria) => {
    // Agregar la nueva categoría a la lista
    setCategories(prev => [...prev, {
      value: newCategoria.id,
      label: newCategoria.name,
      id: newCategoria.id,
      name: newCategoria.name
    }]);
    // Seleccionar automáticamente la nueva categoría
    setDataMov(prev => ({ ...prev, category_id: newCategoria.id }));
    setCategoriaSeleccionada(newCategoria);
    // Cerrar el modal
    setIsCategoriaOpen(false);
  };

  // Función para manejar cuando se selecciona una categoría
  const handleCategoriaSeleccionada = (categoria) => {
    setCategoriaSeleccionada(categoria);
    setDataMov(prev => ({ ...prev, category_id: categoria.id }));
    setIsCategoriasSeleccionOpen(false);
  };

  // Función para manejar cuando se crea una receta
  const handleRecetaCreated = (recetaData) => {
    console.log('Receta creada:', recetaData);
    setRecetaGuardada(recetaData);
    setIsRecetaOpen(false);
  };

  // Función para manejar cuando se actualiza una receta
  const handleRecetaUpdated = (recetaData) => {
    console.log('Receta actualizada:', recetaData);
    setRecetaGuardada(recetaData);
    setIsRecetaOpen(false);
  };

  return (
    <View isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderView
        title={tipo === 'editar' ? 'Editar producto' : 'Nuevo producto'}
        onBack={() => setIsOpen(false)}
      />
      <div className={styles.container}>
        <MensajeError mensaje={errorMessage} />
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
          tipo="text"
          value={dataMov.codigo_barras}
          placeholder='Código de barras'
          onChange={(e) => handleChange('codigo_barras', e.target.value)}
          icon='barcode'
        />

        <div className={styles.content} style={{ padding: '5px 15px' }}>
          <Boton
            className='btn-transparent'
            label={categoriaSeleccionada ? categoriaSeleccionada.name : 'Seleccionar Categoría (opcional)'}
            onClick={() => setIsCategoriasSeleccionOpen(true)}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          />
        </div>

        {/* Sección de Precios */}
        <p className={styles.subTitle}>PRECIOS</p>
        {pricesTypes.map(priceType => (
          <div key={priceType.id} className={styles.priceContainer}>
            <InputNormal
              tipo="number"
              value={dataMov.prices[priceType.id] || ''}
              placeholder={`Precio ${priceType.name}`}
              onChange={(e) => handlePriceChange(priceType.id, e.target.value)}
              icon='dollar'
              step="0.01"
              min="0"
            />
            {priceType.description && (
              <div className={styles.priceDescription}>
                <BoxIcon name='info-circle' className={styles.icon} />
                {priceType.description}
              </div>
            )}
          </div>
        ))}
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
          <div className={styles.content} style={{ padding: '10px 15px' }}>
            <Boton
              className='btn-default'
              label={recetaGuardada ? 'Editar Receta' : 'Crear Receta'}
              style={{ marginTop: 'auto' }}
              onClick={() => setIsRecetaOpen(true)}
            />
            {recetaGuardada && recetaGuardada.productos && recetaGuardada.productos.length > 0 ? (
              <div style={{ fontSize: '12px', color: '#28a745', fontWeight: '500', marginTop: '5px' }}>
                ✓ Receta guardada con {recetaGuardada.productos.length} productos
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#dc3545', fontWeight: '500', marginTop: '5px' }}>
                ⚠ Debe crear una receta con al menos un producto
              </div>
            )}
          </div>
        )}
        
          <Boton
            className='btn-original'
            label={tipo === 'editar' ? 'Guardar cambios' : 'Agregar producto'}
            style={{ marginTop: 'auto' }}
            onClick={handleSubmit}
            loading={loading}
            disabled={!dataMov.name.trim() || !dataMov.stock || dataMov.stock.toString().trim() === '' || (hasReceta && (!recetaGuardada || !recetaGuardada.productos || recetaGuardada.productos.length === 0))}
          />

      </div>

      {/* Modal de nueva categoría */}
      <EditarAgregarCategoria
        isOpen={isCategoriaOpen}
        setIsOpen={setIsCategoriaOpen}
        tipo='agregar'
        onCategoriaCreated={handleCategoriaCreated}
      />

      {/* Modal de receta */}
      <EditarAgregarReceta
        isOpen={isRecetaOpen}
        setIsOpen={setIsRecetaOpen}
        productoAlmacenId={data?.id || null}
        recetaData={recetaGuardada}
        onRecetaCreated={handleRecetaCreated}
        onRecetaUpdated={handleRecetaUpdated}
      />

      {/* Modal de selección de categorías */}
      <CategoriasAlmacen
        isOpen={isCategoriasSeleccionOpen}
        setIsOpen={setIsCategoriasSeleccionOpen}
        modoSeleccion={true}
        onCategoriaSeleccionada={handleCategoriaSeleccionada}
      />
    </View>
  );
}

export default Formulario;