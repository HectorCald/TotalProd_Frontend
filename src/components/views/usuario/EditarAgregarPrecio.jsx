import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import pricesTypesService from '../../../services/pricesTypesService';
import MensajeError from '../../common/MensajeError';

function EditarAgregarPrecio({ isOpen, setIsOpen, data = '', tipo, onPrecioCreated, onPrecioUpdated }) {
  const [dataMov, setDataMov] = useState({
    name: '',
    description: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Efecto para cargar los datos del precio
  useEffect(() => {
    if (data && tipo === 'editar') {
      setDataMov({
        name: data.name || '',
        description: data.description || ''
      });
    } else {
      setDataMov({
        name: '',
        description: ''
      });
    }
    setErrorMessage('');
  }, [isOpen, data, tipo]);

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

    setLoading(true);
    try {
      let response;
      const precioData = {
        name: dataMov.name.trim(),
        description: dataMov.description.trim() || null
      };

      if (tipo === 'editar') {
        response = await pricesTypesService.update(data.id, precioData);
      } else {
        response = await pricesTypesService.create(precioData);
      }

      if (response.success) {
        if (tipo === 'editar' && onPrecioUpdated) {
          onPrecioUpdated(response.data);
        } else if (tipo === 'agregar' && onPrecioCreated) {
          onPrecioCreated(response.data);
        }
        setIsOpen(false);
      } else {
        setErrorMessage(response.message || `Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} el tipo de precio`);
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error(`Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} tipo de precio:`, error);
      setErrorMessage('Error de conexión con el servidor');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderModal
        title={tipo === 'editar' ? 'Editar tipo de precio' : 'Nuevo tipo de precio'}
        onClose={() => setIsOpen(false)}
      />
      <div className={styles.modalContent}>
        <MensajeError mensaje={errorMessage} />
        <p className={styles.subTitle}>INFORMACIÓN DEL TIPO DE PRECIO</p>

        <InputNormal
          tipo="text"
          value={dataMov.name}
          placeholder='Nombre del tipo de precio'
          onChange={(e) => handleChange('name', e.target.value)}
          icon='dollar'
        />

        <InputNormal
          tipo="text"
          value={dataMov.description}
          placeholder='Descripción (opcional)'
          onChange={(e) => handleChange('description', e.target.value)}
          icon='comment'
        />

        <Boton
          className='btn-original'
          label={tipo === 'editar' ? 'Guardar cambios' : 'Agregar tipo de precio'}
          style={{ marginTop: 'auto' }}
          onClick={handleSubmit}
          loading={loading}
          disabled={!dataMov.name.trim()}
        />
      </div>
    </ViewModal>
  );
}

export default EditarAgregarPrecio;
