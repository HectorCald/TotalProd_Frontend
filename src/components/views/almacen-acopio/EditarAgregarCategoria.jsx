import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import categoryAcopioService from '../../../services/categoryAcopioService';
import MensajeError from '../../common/MensajeError';

function EditarAgregarCategoria({ isOpen, setIsOpen, data = '', tipo, onCategoriaCreated, onCategoriaUpdated }) {
  const [dataMov, setDataMov] = useState({
    name: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Efecto para cargar los datos de la categoría
  useEffect(() => {
    if (data && tipo === 'editar') {
      setDataMov({
        name: data.name || ''
      });
    } else {
      setDataMov({
        name: ''
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
      const categoryData = {
        name: dataMov.name.trim()
      };

      if (tipo === 'editar') {
        response = await categoryAcopioService.update(data.id, categoryData);
      } else {
        response = await categoryAcopioService.create(categoryData);
      }

      if (response.success) {
        if (tipo === 'editar' && onCategoriaUpdated) {
          onCategoriaUpdated(response.data);
        } else if (tipo === 'agregar' && onCategoriaCreated) {
          onCategoriaCreated(response.data);
        }
        setIsOpen(false);
      } else {
        setErrorMessage(response.message || `Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} la categoría`);
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error(`Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} categoría:`, error);
      setErrorMessage('Error de conexión con el servidor');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderModal
        title={tipo === 'editar' ? 'Editar categoría' : 'Nueva categoría'}
        onClose={() => setIsOpen(false)}
      />
      <div className={styles.modalContent}>
        <MensajeError mensaje={errorMessage} />
        <p className={styles.subTitle}>INFORMACIÓN DE LA CATEGORÍA</p>

        <InputNormal
          tipo="text"
          value={dataMov.name}
          placeholder='Nombre de la categoría'
          onChange={(e) => handleChange('name', e.target.value)}
        />

        <Boton
          className='btn-original'
          label={tipo === 'editar' ? 'Guardar cambios' : 'Agregar categoría'}
          style={{ marginTop: 'auto' }}
          onClick={handleSubmit}
          loading={loading}
          disabled={!dataMov.name.trim()}
        />
      </div>
    </ViewModal>
  );
}

export default EditarAgregarCategoria;
