import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Select from '../../common/Select';
import productsAcopioService from '../../../services/productsAcopioService';
import EditarAgregarReceta from '../almacen-general/EditarAgregarReceta';
import Switch from '../../common/Switch';
import MensajeError from '../../common/MensajeError';
import Notification from '../../common/Notification';
import CategoriasAcopio from './CategoriasAcopio';

function EditarAgregar({ isOpen, setIsOpen, data = '', tipo, onProductCreated, onProductUpdated, typeMeasures = [] }) {

  const [dataMov, setDataMov] = useState({
    name: '',
    description: '',
    quantity: '',
    type_measure_id: '',
    category_id: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
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



  // Efecto para cargar los datos del producto
  useEffect(() => {
    if (data && tipo === 'editar') {
      // Cargar receta si existe
      let recetaData = null;
      if (data.recetas_acopio && data.recetas_acopio.length > 0) {
        const receta = data.recetas_acopio[0];
        recetaData = {
          descripcion: receta.description || '',
          productos: receta.recetas_acopio_detalle ? receta.recetas_acopio_detalle.map(detalle => ({
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
        quantity: data.quantity !== undefined && data.quantity !== null ? data.quantity : '',
        type_measure_id: data.type_measure_id || '',
        category_id: data.category_id || ''
      });

      // Establecer la categoría seleccionada si existe
      if (data.category_id && data.category) {
        setCategoriaSeleccionada(data.category);
      } else {
        setCategoriaSeleccionada(null);
      }

      setRecetaGuardada(recetaData);
    } else {
      setDataMov({
        name: '',
        description: '',
        quantity: '',
        type_measure_id: '',
        category_id: ''
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
          const response = await productsAcopioService.hasMovements(data.id);
          if (response.success) {
            setHasMovements(response.data.hasMovements);
          }
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

  // Función para manejar el switch de receta
  const handleRecetaSwitch = (checked) => {
    setHasReceta(checked);
    if (!checked) {
      setRecetaGuardada(null);
    }
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
      setErrorMessage('El nombre es obligatorio');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (dataMov.quantity === '' || dataMov.quantity === null || dataMov.quantity === undefined) {
      setErrorMessage('La cantidad es obligatoria');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (!dataMov.type_measure_id) {
      setErrorMessage('Debe seleccionar un tipo de medida');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
      let response;
      const productData = {
        name: dataMov.name,
        description: dataMov.description,
        quantity: parseFloat(dataMov.quantity) || 0,
        type_measure_id: dataMov.type_measure_id,
        category_id: dataMov.category_id,
        receta: hasReceta ? recetaGuardada : null // Incluir receta solo si está marcado el switch
      };

      if (tipo === 'editar') {
        response = await productsAcopioService.update(data.id, productData);
      } else {
        response = await productsAcopioService.create(productData);
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


  // Función para manejar cuando se selecciona una categoría
  const handleCategoriaSeleccionada = (categoria) => {
    setCategoriaSeleccionada(categoria);
    setDataMov(prev => ({ ...prev, category_id: categoria.id }));
    setIsCategoriasSeleccionOpen(false);
  };

  return (
    <>
      <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
        <HeaderModal
          title={tipo === 'editar' ? 'Editar producto' : 'Nuevo producto'}
          onClose={() => setIsOpen(false)}
        />
        <div className={styles.modalContent}>
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
            value={dataMov.quantity}
            placeholder='Cantidad'
            onChange={(e) => handleChange('quantity', e.target.value)}
            icon='calculator'
          />
          <div className={styles.content} style={{ padding: '10px 15px' }}>
            <Select
              value={dataMov.type_measure_id}
              onChange={(value) => handleChange('type_measure_id', value)}
              options={typeMeasures?.map((item, index) => ({
                value: item.id || item.value || `unique_${index}`,
                label: item.name || item.label || item.code || 'Sin nombre'
              })).filter((item, index, self) => 
                // Eliminar duplicados basándose en el value
                index === self.findIndex(t => t.value === item.value)
              ) || []}
              placeholder={hasMovements ? 'Tipo de medida (no editable - tiene movimientos)' : 'Tipo de medida'}
              disabled={tipo === 'editar' && hasMovements}
              icon='ruler'
            />
            {tipo === 'editar' && hasMovements && (
              <div style={{
                color: '#dc3545',
                fontSize: '12px',
                textAlign: 'center',
                marginTop: '5px'
              }}>
                No se puede cambiar la unidad de medida porque el producto tiene movimientos registrados
              </div>
            )}
          </div>

          <Boton
            className='btn-gray'
            label={categoriaSeleccionada ? 'Categoría: ' + categoriaSeleccionada.name : 'Seleccionar Categoría (opcional)'}
            onClick={() => setIsCategoriasSeleccionOpen(true)}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          />


          {/* Switch para receta */}
          <div className={styles.content} style={{ padding: '10px 15px' }}>
            <Switch
              title="¿Tiene receta?"
              subtitle="Marca si esta materia prima se produce apartir de otra materia prima"
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
            disabled={!dataMov.name.trim() || dataMov.quantity === '' || dataMov.quantity === null || dataMov.quantity === undefined || !dataMov.type_measure_id || (hasReceta && (!recetaGuardada || !recetaGuardada.productos || recetaGuardada.productos.length === 0))}
          />
        </div>
        <Notification
          isVisible={notification.isVisible}
          type={notification.type}
          text={notification.text}
        />
        {/* Modal de selección de categorías */}
      <CategoriasAcopio
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
        tipoProducto="acopio"
      />
    </>
  );
}

export default EditarAgregar;