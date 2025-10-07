import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Switch from '../../common/Switch';
import sucursalesService from '../../../services/sucursalesService';
import Notification from '../../common/Notification';

function EditarAgregarSucursal({ isOpen, setIsOpen, data = '', tipo, onSucursalCreated, onSucursalUpdated }) {
  const [dataMov, setDataMov] = useState({
    name: ''
  });

  const [loading, setLoading] = useState(false);
  const [almacenSeparado, setAlmacenSeparado] = useState(true);

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

  // Efecto para cargar los datos de la sucursal
  useEffect(() => {
    if (data && tipo === 'editar') {
      setDataMov({
        name: data.name || ''
      });
      // Si la sucursal comparte almacén (tiene almacen_sucursal_id), el switch debe estar desactivado
      setAlmacenSeparado(!data.almacen_sucursal_id);
    } else {
      setDataMov({
        name: ''
      });
      setAlmacenSeparado(true);
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
      const sucursalData = {
        name: dataMov.name.trim(),
        // Solo informativo para el service; no se envía al backend directamente
        almacenSeparado: almacenSeparado
      };

      if (tipo === 'editar') {
        response = await sucursalesService.update(data.id, sucursalData);
      } else {
        response = await sucursalesService.create(sucursalData);
      }

      if (response.success) {
        if (tipo === 'editar' && onSucursalUpdated) {
          onSucursalUpdated(response.data);
        } else if (tipo === 'agregar' && onSucursalCreated) {
          onSucursalCreated(response.data);
        }
        setIsOpen(false);
      } else if (response.code === 'MODULE_NOT_INCLUDED') {
        mostrarNotificacion('error', `Tu plan actual (${response.currentPlan}) no incluye acceso al módulo "${response.requiredModule}". Actualiza tu plan para acceder a esta función.`);
      } else if (response.code === 'NO_PLAN') {
        mostrarNotificacion('error', 'Necesitas un plan activo para acceder a esta función. Actualiza tu plan desde el perfil.');
      } else {
        mostrarNotificacion('error', response.message || `Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} la sucursal`);
      }
    } catch (error) {
      console.error(`Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} sucursal:`, error);
      mostrarNotificacion('error', 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderModal
        title={tipo === 'editar' ? 'Editar sucursal' : 'Nueva sucursal'}
        onClose={() => setIsOpen(false)}
      />
      <div className={styles.modalContent}>
        <p className={styles.subTitle}>INFORMACIÓN DE LA SUCURSAL</p>

        <InputNormal
          tipo="text"
          value={dataMov.name}
          placeholder='Nombre de la sucursal'
          onChange={(e) => handleChange('name', e.target.value)}
          icon='building'
        />

        <div className={styles.content}>
          <Switch
            title="Almacén separado"
            subtitle="La sucursal tendrá su propio almacén y stock"
            checked={almacenSeparado}
            onChange={setAlmacenSeparado}
            icon="store"
          />
        </div>

        <Boton
          className='btn-original'
          label={tipo === 'editar' ? 'Guardar cambios' : 'Agregar sucursal'}
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

export default EditarAgregarSucursal;
