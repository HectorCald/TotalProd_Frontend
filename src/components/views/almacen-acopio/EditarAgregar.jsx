import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Select from '../../common/Select';
import productsAcopioService from '../../../services/productsAcopioService';
import typeMeasureService from '../../../services/typeMeasureService';
import categoryAcopioService from '../../../services/categoryAcopioService';
import EditarAgregarCategoria from './EditarAgregarCategoria';
import MensajeError from '../../common/MensajeError';

function Formulario({ isOpen, setIsOpen, data = '', tipo, onProductCreated, onProductUpdated }) {
  const [dataMov, setDataMov] = useState({
    name: '',
    description: '',
    quantity: '',
    type_measure_id: '',
    category_id: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typeMeasures, setTypeMeasures] = useState([]);
  const [loadingTypeMeasures, setLoadingTypeMeasures] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isCategoriaOpen, setIsCategoriaOpen] = useState(false);
  const [hasMovements, setHasMovements] = useState(false);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Efecto para cargar los tipos de medida
  useEffect(() => {
    const loadTypeMeasures = async () => {
      setLoadingTypeMeasures(true);
      try {
        const response = await typeMeasureService.getAll();
        if (response.success) {
          // Mapear los datos para el Select
          const mappedOptions = response.data.map(tm => ({
            value: tm.id,
            label: `${tm.name} (${tm.code})`,
            id: tm.id,
            name: tm.name,
            code: tm.code
          }));
          setTypeMeasures(mappedOptions);
        } else {
          console.error('Error al cargar tipos de medida:', response.message);
        }
      } catch (error) {
        console.error('Error al cargar tipos de medida:', error);
      } finally {
        setLoadingTypeMeasures(false);
      }
    };

    if (isOpen) {
      loadTypeMeasures();
    }
  }, [isOpen]);

  // Efecto para cargar las categorías
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await categoryAcopioService.getAll();
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
      setDataMov({
        name: data.name || '',
        description: data.description || '',
        quantity: data.quantity || '',
        type_measure_id: data.type_measure_id || '',
        category_id: data.category_id || ''
      });
    } else {
      setDataMov({
        name: '',
        description: '',
        quantity: '',
        type_measure_id: '',
        category_id: ''
      });
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

  // Función para enviar los datos
  const handleSubmit = async () => {
    if (!dataMov.name.trim()) {
      setErrorMessage('El nombre es obligatorio');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (!dataMov.quantity.trim()) {
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
        quantity: dataMov.quantity,
        type_measure_id: dataMov.type_measure_id,
        category_id: dataMov.category_id
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
    // Cerrar el modal
    setIsCategoriaOpen(false);
  };

  return (
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
            options={typeMeasures}
            placeholder={hasMovements ? 'Tipo de medida (no editable - tiene movimientos)' : 'Tipo de medida'}
            disabled={loadingTypeMeasures || (tipo === 'editar' && hasMovements)}
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

        <div className={styles.content} style={{ padding: '10px 15px' }}>
          <Select
            value={dataMov.category_id}
            onChange={(value) => handleChange('category_id', value)}
            options={categories}
            placeholder='Categoría'
            disabled={loadingCategories}
            icon='category'
          />

          <Boton
            className='btn-default'
            label='Nueva Categoría'
            onClick={() => setIsCategoriaOpen(true)}
            style={{ minWidth: '80px' }}
          />

        </div>

        <Boton
          className='btn-original'
          label={tipo === 'editar' ? 'Guardar cambios' : 'Agregar producto'}
          style={{ marginTop: 'auto' }}
          onClick={handleSubmit}
          loading={loading}
          disabled={!dataMov.name.trim() || !dataMov.quantity.trim() || !dataMov.type_measure_id}
        />
      </div>

      {/* Modal de nueva categoría */}
      <EditarAgregarCategoria
        isOpen={isCategoriaOpen}
        setIsOpen={setIsCategoriaOpen}
        tipo='agregar'
        onCategoriaCreated={handleCategoriaCreated}
      />
    </ViewModal>
  );
}

export default Formulario;