import React, { useState } from 'react';
import ModalCentro from '../../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../../context/ToastContext';
import planificadorService from '../../../../../services/planificadorService';

const EliminarTarea = ({ isOpen, onClose, tareaSeleccionada, onEliminar }) => {
  const { showSuccess, showDanger } = useToast();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!tareaSeleccionada?.id) {
      showDanger(null, 'ID de la tarea no válido');
      return;
    }

    setLoading(true);
    try {
      const response = await planificadorService.delete(tareaSeleccionada.id);

      if (response && response.success) {
        if (onEliminar) onEliminar(tareaSeleccionada.id);
        setLoading(false);
        onClose(true);
        showSuccess(null, response.message || 'Tarea eliminada exitosamente');
      } else {
        setLoading(false);
        showDanger(null, response?.message || 'Error al eliminar la tarea');
      }
    } catch (error) {
      setLoading(false);
      showDanger(null, 'Revisa tu conexión a internet');
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose(false);
  };

  if (!tareaSeleccionada && isOpen) return null;

  return (
    <ModalCentro
      isOpen={isOpen}
      onClose={handleClose}
      title="Eliminar tarea"
      mensaje={`¿Estás seguro de que deseas eliminar la tarea "${tareaSeleccionada?.titulo}"?`}
      detalle="Esta acción es irreversible y no podrás recuperar la información de esta tarea una vez eliminada"
      confirmText="Eliminar"
      confirmColorClass="btn-error"
      onConfirm={handleConfirm}
      loading={loading}
      disableClose={loading}
      contentStyle={{ paddingBlock: 0 }}
    />
  );
};

export default EliminarTarea;
