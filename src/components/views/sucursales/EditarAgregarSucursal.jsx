import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Switch from '../../common/Switch';
import MultiSelect from '../../common/MultiSelect';
import NoData from '../../common/NoData';
import sucursalesService from '../../../services/sucursalesService';
import pricesTypesService from '../../../services/pricesTypesService';
import Notification from '../../common/Notification';

function EditarAgregarSucursal({ isOpen, setIsOpen, data = '', tipo, onSucursalCreated, onSucursalUpdated }) {
  const [dataMov, setDataMov] = useState({
    name: ''
  });

  const [loading, setLoading] = useState(false);
  const [almacenSeparado, setAlmacenSeparado] = useState(true);
  const [precios, setPrecios] = useState([]);
  const [preciosSeleccionados, setPreciosSeleccionados] = useState([]);
  const [loadingPrecios, setLoadingPrecios] = useState(false);

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

  // Función para cargar precios disponibles
  const loadPrecios = async () => {
    try {
      setLoadingPrecios(true);
      const response = await pricesTypesService.getAll();
      if (response.success) {
        setPrecios(response.data || []);
      }
    } catch (error) {
      console.error('Error al cargar precios:', error);
      mostrarNotificacion('error', 'Error al cargar los tipos de precios');
    } finally {
      setLoadingPrecios(false);
    }
  };

  // Función para cargar precios asignados a la sucursal
  const loadPreciosSucursal = async (sucursalId) => {
    try {
      const response = await sucursalesService.getPreciosBySucursalId(sucursalId);
      if (response.success && response.data && Array.isArray(response.data)) {
        // Extraer solo los IDs de los precios asignados
        const preciosIds = response.data.map(precio => precio.id || precio).filter(Boolean);
        setPreciosSeleccionados(preciosIds);
      } else {
        setPreciosSeleccionados([]);
      }
    } catch (error) {
      console.error('Error al cargar precios de la sucursal:', error);
      setPreciosSeleccionados([]);
    }
  };

  // Efecto para cargar precios disponibles cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadPrecios();
    }
  }, [isOpen]);

  // Efecto para cargar los datos de la sucursal y precios asignados cuando se está editando
  useEffect(() => {
    if (data && tipo === 'editar') {
      setDataMov({
        name: data.name || ''
      });
      setAlmacenSeparado(!data.almacen_sucursal_id);
      
      // Cargar precios asignados a la sucursal después de que los precios disponibles estén listos
      if (data.id && precios.length > 0) {
        loadPreciosSucursal(data.id);
      } else if (data.id) {
        // Si los precios aún no están cargados, esperar un poco y luego cargar
        const timer = setTimeout(() => {
          if (precios.length > 0) {
            loadPreciosSucursal(data.id);
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      setDataMov({
        name: ''
      });
      setAlmacenSeparado(true);
      setPreciosSeleccionados([]);
    }
  }, [isOpen, data, tipo, precios]);

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
        almacenSeparado: almacenSeparado,
        precios: preciosSeleccionados
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
            disabled={tipo === 'editar' && data?.total_pedidos > 0 && !data?.almacen_sucursal_id}
          />
        </div>

        <p className={styles.subTitle}>PRECIOS DISPONIBLES</p>
        {loadingPrecios ? (
          <NoData
            icon="loader-alt"
            title="Cargando precios..."
            detail="Obteniendo tipos de precios disponibles"
            transparent={true}
            minHeight="150px"
          />
        ) : precios.length > 0 ? (
          <div className={styles.content}>
            <MultiSelect
              title="Tipos de precios"
              options={precios.map(precio => ({
                name: precio.name,
                value: precio.id
              }))}
              selectedValues={preciosSeleccionados}
              onChange={setPreciosSeleccionados}
            />
          </div>
        ) : (
          <NoData
            icon="grid-alt"
            title="Sin tipos de precios"
            detail="No hay tipos de precios disponibles para asignar"
            transparent={false}
            minHeight="150px"
          />
        )}

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
