import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import pricesTypesService from '../../../services/pricesTypesService';
import Notification from '../../common/Notification';

function EditarAgregarPrecio({ isOpen, setIsOpen, data = '', tipo, onPrecioCreated, onPrecioUpdated }) {
  const [dataMov, setDataMov] = useState({
    name: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);

  // Estado para la notificación
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
  }, [isOpen, data, tipo]);

  // Función para actualizar los datos del formulario
  const handleChange = (field, value) => {
    setDataMov({ ...dataMov, [field]: value });
  };

  // Función para enviar los datos
  const handleSubmit = async () => {
    if (!dataMov.name.trim()) {
      mostrarNotificacion('error', 'El nombre es obligatorio');
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
        mostrarNotificacion('error', response.message || `Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} el tipo de precio`);
      }
    } catch (error) {
      console.error(`Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} tipo de precio:`, error);
      mostrarNotificacion('error', 'Error de conexión con el servidor');
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

      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        text={notification.text}
      />
    </ViewModal>
  );
}

export default EditarAgregarPrecio;
