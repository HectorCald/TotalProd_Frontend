import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import Input from '../../common/inputs/Input';
import Switch from '../../common/Switch';
import MultiSelect from '../../common/MultiSelect';
import NoData from '../../common/NoData';
import sucursalesService from '../../../services/sucursalesService';
import pricesTypesService from '../../../services/pricesTypesService';
import { useToast } from '../../../context/ToastContext';
import Text from '../../common/Text';
import useHistorialLogger from '../../ui/HistorialLogger';

function EditarAgregarSucursal({ isOpen, setIsOpen, data = '', tipo, onSucursalCreated, onSucursalUpdated }) {
  const { showSuccess, showDanger, showWarning } = useToast();
  const { logAccion } = useHistorialLogger({ modulo: 'Sucursales' });
  const [dataMov, setDataMov] = useState({
    name: ''
  });

  const [loading, setLoading] = useState(false);
  const [almacenSeparado, setAlmacenSeparado] = useState(true);
  const [precios, setPrecios] = useState([]);
  const [preciosSeleccionados, setPreciosSeleccionados] = useState([]);
  const [loadingPrecios, setLoadingPrecios] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ name: false });

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
      showDanger('Error', 'Error al cargar los tipos de precios', 5000);
    } finally {
      setLoadingPrecios(false);
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
    setFieldErrors({ name: false });
    if (data && tipo === 'editar') {
      setDataMov({
        name: data.name || ''
      });
      setAlmacenSeparado(!data.almacen_sucursal_id);

      // Usar los precios que ya vienen en data en lugar de hacer una petición
      if (data.precios && Array.isArray(data.precios)) {
        const preciosIds = data.precios.map(precio => precio.id || precio).filter(Boolean);
        setPreciosSeleccionados(preciosIds);
      } else {
        setPreciosSeleccionados([]);
      }
    } else {
      setDataMov({
        name: ''
      });
      setAlmacenSeparado(true);
      setPreciosSeleccionados([]);
      setFieldErrors({ name: false });
    }
  }, [isOpen, data, tipo]);

  // Función para actualizar los datos del formulario
  const handleChange = (field, value) => {
    setDataMov({ ...dataMov, [field]: value });
    if (field === 'name') setFieldErrors((prev) => ({ ...prev, name: false }));
  };

  // Función para enviar los datos
  const handleSubmit = async () => {
    if (!dataMov.name.trim()) {
      setFieldErrors((prev) => ({ ...prev, name: true }));
      showWarning('Validación', 'El nombre es obligatorio', 5000);
      return;
    }

    setFieldErrors({ name: false });
    setLoading(true);
    try {
      let response;
      const sucursalData = {
        name: dataMov.name.trim(),
        almacenSeparado: almacenSeparado,
        precios: preciosSeleccionados
      };

      if (tipo === 'editar') {
        response = await sucursalesService.update(data.id, sucursalData);
      } else {
        response = await sucursalesService.create(sucursalData);
      }

      if (response.success) {
        const registroId = (response.data && response.data.id) || response.id || data?.id || null;
        const nombresPrecios = precios
          .filter(p => preciosSeleccionados.includes(p.id))
          .map(p => p.name)
          .filter(Boolean);
        const almacenLabel = almacenSeparado ? 'Sí' : 'No';
        const almacenAntes = data?.almacen_sucursal_id ? 'No' : 'Sí';
        const preciosAntes = (data?.precios && Array.isArray(data.precios))
          ? data.precios.map(p => p.name || p).filter(Boolean)
          : [];
        const preciosDespues = nombresPrecios;

        const camposOrden = ['Nombre de la sucursal', 'Almacén separado', 'Tipos de precios'];
        const camposDetalle = tipo === 'editar'
          ? {
              'Nombre de la sucursal': { antes: data?.name ?? null, despues: sucursalData.name },
              'Almacén separado': { antes: almacenAntes, despues: almacenLabel },
              'Tipos de precios': { antes: preciosAntes.length ? preciosAntes : null, despues: preciosDespues.length ? preciosDespues : null }
            }
          : {
              'Nombre de la sucursal': { despues: sucursalData.name },
              'Almacén separado': { despues: almacenLabel },
              'Tipos de precios': { despues: preciosDespues.length ? preciosDespues : null }
            };
        const detallesPersonalizados = {
          campos: camposDetalle,
          camposOrden,
          comentario: tipo === 'editar' ? 'Actualización de sucursal' : 'Creación de sucursal'
        };
        await logAccion({
          accion: tipo === 'editar' ? 'EDITAR' : 'CREAR',
          lugarAfectado: sucursalData.name || 'Sucursal',
          registroId,
          comentario: tipo === 'editar' ? 'Actualización de sucursal' : 'Creación de sucursal',
          detallesPersonalizados
        });

        if (tipo === 'editar' && onSucursalUpdated) {
          onSucursalUpdated(response.data);
        } else if (tipo === 'agregar' && onSucursalCreated) {
          onSucursalCreated(response.data);
        }
        showSuccess('Éxito', tipo === 'editar' ? 'Sucursal actualizada correctamente' : 'Sucursal agregada correctamente', 5000);
        setIsOpen(false);
      } else if (response.code === 'MODULE_NOT_INCLUDED') {
        showDanger('Error', `Tu plan actual (${response.currentPlan}) no incluye acceso al módulo "${response.requiredModule}". Actualiza tu plan para acceder a esta función.`, 5000);
      } else if (response.code === 'NO_PLAN') {
        showDanger('Error', 'Necesitas un plan activo para acceder a esta función. Actualiza tu plan desde el perfil.', 5000);
      } else {
        showDanger('Error', response.message || `Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} la sucursal`, 5000);
      }
    } catch (error) {
      console.error(`Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} sucursal:`, error);
      showDanger('Error', 'Error de conexión con el servidor', 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderModal
        title={tipo === 'editar' ? 'Editar Sucursal' : 'Nueva Sucursal'}
        onClose={() => setIsOpen(false)}
      />
      <div className={styles.modalContent}>
        <hr className={styles.separator} />
        <p className={styles.subTitle}>Información</p>

        <Input
          tipo="text"
          label="Nombre de la sucursal"
          value={dataMov.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required={true}
          readOnly={loading}
          error={fieldErrors.name}
          onClearError={() => setFieldErrors((prev) => ({ ...prev, name: false }))}
        />

        <p className={styles.subTitle}>Almacén</p>
        <div className={styles.content} style={{ padding: '10px 15px', marginBottom: '15px' }}>
          <Switch
            title="Almacén separado"
            subtitle="La sucursal tendrá su propio almacén y stock"
            checked={almacenSeparado}
            onChange={setAlmacenSeparado}
            icon="store"
            disabled={tipo === 'editar' && data?.total_pedidos > 0 && !data?.almacen_sucursal_id}
            readOnly={loading}
          />
        </div>
        {data?.total_pedidos > 0 && !data?.almacen_sucursal_id && (
          <Text type="warning" align="left">
            No es posible separar el almacén si hay pedidos o movimientos en la sucursal
          </Text>
        )}

        <p className={styles.subTitle}>Precios disponibles</p>
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
        <div className={styles.space}></div>

        <Boton
          className='btn-original'
          label={tipo === 'editar' ? 'Guardar cambios' : 'Agregar sucursal'}
          style={{ marginTop: 'auto' }}
          onClick={handleSubmit}
          loading={loading}
          disabled={loading}
        />
      </div>
    </ViewModal>
  );
}

export default EditarAgregarSucursal;
