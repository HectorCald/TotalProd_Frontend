import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import Input from '../../common/inputs/Input';
import pricesTypesService from '../../../services/pricesTypesService';
import { useToast } from '../../../context/ToastContext';
import useHistorialLogger from '../../ui/HistorialLogger';

function EditarAgregarPrecio({ isOpen, setIsOpen, data = '', tipo, onPrecioCreated, onPrecioUpdated }) {
  const { showSuccess, showDanger, showWarning } = useToast();
  const { logAccion } = useHistorialLogger({ modulo: 'Precios' });
  const [dataMov, setDataMov] = useState({
    name: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ name: false });

  // Efecto para cargar los datos del precio
  useEffect(() => {
    setFieldErrors({ name: false });
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
        const registroId = (response.data && response.data.id) || response.id || data?.id || null;
        const comentarioAccion = tipo === 'editar' ? 'Actualización de tipo de precio' : 'Creación de tipo de precio';

        const camposOrden = ['Nombre del tipo de precio', 'Descripción (opcional)'];
        const camposDetalle = {
          'Nombre del tipo de precio': tipo === 'editar'
            ? { antes: data?.name ?? null, despues: precioData.name }
            : { despues: precioData.name },
          'Descripción (opcional)': tipo === 'editar'
            ? { antes: data?.description ?? null, despues: precioData.description ?? null }
            : { despues: precioData.description ?? null }
        };
        const detallesPersonalizados = {
          campos: camposDetalle,
          camposOrden,
          comentario: comentarioAccion
        };

        await logAccion({
          accion: tipo === 'editar' ? 'EDITAR' : 'CREAR',
          lugarAfectado: precioData.name || 'Tipo de precio',
          registroId,
          comentario: comentarioAccion,
          detallesPersonalizados
        });

        if (tipo === 'editar') {
          if (onPrecioUpdated) {
            const precioActualizado = { ...data, ...response.data };
            onPrecioUpdated(precioActualizado);
          }
          showSuccess('Éxito', 'Tipo de precio actualizado correctamente', 5000);
        } else {
          if (onPrecioCreated) onPrecioCreated(response.data);
          showSuccess('Éxito', 'Tipo de precio agregado correctamente', 5000);
        }
        setIsOpen(false);
      } else {
        showDanger('Error', response.message || `Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} el tipo de precio`, 5000);
      }
    } catch (error) {
      console.error(`Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} tipo de precio:`, error);
      showDanger('Error', 'Error de conexión con el servidor', 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <HeaderModal
        title={tipo === 'editar' ? 'Editar Tipo de Precio' : 'Nuevo Tipo de Precio'}
        onClose={() => setIsOpen(false)}
      />
      <div className={styles.modalContent}>
        <hr className={styles.separator} />
        <p className={styles.subTitle}>Información</p>

        <Input
          tipo="text"
          label="Nombre del tipo de precio"
          value={dataMov.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required={true}
          readOnly={loading}
          error={fieldErrors.name}
          onClearError={() => setFieldErrors((prev) => ({ ...prev, name: false }))}
        />

        <Input
          tipo="text"
          label="Descripción (opcional)"
          value={dataMov.description}
          onChange={(e) => handleChange('description', e.target.value)}
          readOnly={loading}
        />
  
        <div className={styles.space}></div>
        <Boton
          className='btn-original'
          label={tipo === 'editar' ? 'Guardar cambios' : 'Agregar tipo de precio'}
          style={{ marginTop: 'auto' }}
          onClick={handleSubmit}
          loading={loading}
          disabled={loading}
        />
      </div>
    </ViewModal>
  );
}

export default EditarAgregarPrecio;
