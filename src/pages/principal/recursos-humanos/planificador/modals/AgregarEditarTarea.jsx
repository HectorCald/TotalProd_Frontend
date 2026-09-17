import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../../components/common/modals/ModalLateral';
import Input from '../../../../../components/common/inputs/Input';
import InputFecha from '../../../../../components/common/inputs/InputFecha';
import InputSelect from '../../../../../components/common/inputs/InputSelect';
import InputSelectBox from '../../../../../components/common/inputs/InputSelectBox';
import { useToast } from '../../../../../context/ToastContext';
import planificadorService from '../../../../../services/planificadorService';

const FRECUENCIA_OPTIONS = [
  { value: 'unica', label: 'Un solo día' },
  { value: 'semanal', label: 'Cada semana (el mismo día)' },
  { value: 'mensual', label: 'Cada mes (la misma fecha)' },
];

const AgregarEditarTarea = ({
  isOpen,
  onClose,
  tareaSeleccionada,
  preselectedDate,
  personalOptions = [],
  onGuardar,
}) => {
  const { showWarning, showSuccess, showDanger } = useToast();

  const [loading, setLoading] = useState(false);

  const [fecha, setFecha] = useState('');
  const [frecuencia, setFrecuencia] = useState('unica');
  const [responsableId, setResponsableId] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [detalles, setDetalles] = useState('');

  const [fieldErrors, setFieldErrors] = useState({
    fecha: false,
    titulo: false,
    responsableId: false,
  });

  useEffect(() => {
    if (isOpen) {
      if (tareaSeleccionada) {
        setFecha(tareaSeleccionada.fecha || '');
        setFrecuencia(tareaSeleccionada.frecuencia || 'unica');
        setResponsableId(tareaSeleccionada.responsableId || tareaSeleccionada.responsable_id || null);
        setTitulo(tareaSeleccionada.titulo || '');
        setDetalles(tareaSeleccionada.detalles || '');
      } else {
        setFecha(preselectedDate || '');
        setFrecuencia('unica');
        setResponsableId(null);
        setTitulo('');
        setDetalles('');
      }
      setFieldErrors({ fecha: false, titulo: false, responsableId: false });
    }
  }, [isOpen, tareaSeleccionada, preselectedDate]);

  const handleConfirm = async () => {
    const errors = {
      fecha: !fecha,
      titulo: !titulo.trim(),
      responsableId: !responsableId,
    };

    if (errors.fecha || errors.titulo || errors.responsableId) {
      setFieldErrors(errors);
      showWarning(null, 'Por favor completa los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fecha,
        frecuencia,
        responsable_id: responsableId,
        titulo: titulo.trim(),
        detalles: detalles.trim(),
        estado: tareaSeleccionada ? (tareaSeleccionada.estado || 'Pendiente') : 'Pendiente',
      };

      let response;
      if (tareaSeleccionada) {
        response = await planificadorService.update(tareaSeleccionada.id, payload);
      } else {
        response = await planificadorService.create(payload);
      }

      if (response && response.success) {
        const matchedPerson = personalOptions.find((p) => String(p.value) === String(responsableId));
        const responsableNombre = matchedPerson?.raw?.nombre_completo || matchedPerson?.label || 'Personal';
        const responsableCargo = matchedPerson?.raw?.cargo || '';

        const savedData = response.data || {
          ...payload,
          id: response.id || tareaSeleccionada?.id,
        };

        if (!savedData.responsableNombre) savedData.responsableNombre = responsableNombre;
        if (!savedData.responsableCargo) savedData.responsableCargo = responsableCargo;
        if (!savedData.responsableId) savedData.responsableId = responsableId;
        if (!savedData.id && response.id) savedData.id = response.id;
        if (!savedData.id && tareaSeleccionada?.id) savedData.id = tareaSeleccionada.id;

        if (onGuardar) {
          onGuardar(savedData);
        }
        setLoading(false);
        onClose();
        showSuccess(null, tareaSeleccionada ? 'Tarea actualizada exitosamente' : 'Tarea creada exitosamente');
      } else {
        setLoading(false);
        showDanger(null, response?.message || 'Error al guardar la tarea');
      }
    } catch (error) {
      setLoading(false);
      showDanger(null, 'Revisa tu conexión a internet');
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <ModalLateral
      isOpen={isOpen}
      onClose={handleClose}
      title={tareaSeleccionada ? 'Editar Tarea' : 'Nueva Tarea'}
      confirmText={tareaSeleccionada ? 'Actualizar' : 'Guardar'}
      onConfirm={handleConfirm}
      loading={loading}
      disableClose={loading}
      overlayStyle={{ zIndex: 10010 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px' }}>
        {/* Fecha de la tarea */}
        <InputFecha
          label="Fecha de la Tarea"
          value={fecha}
          onChange={(newDate) => {
            setFecha(newDate);
            setFieldErrors((prev) => ({ ...prev, fecha: false }));
          }}
          required={true}
          readOnly={loading}
          error={fieldErrors.fecha ? 'La fecha es obligatoria' : null}
          placeholder=""
        />

        {/* Frecuencia de la tarea */}
        <InputSelect
          label="Frecuencia"
          value={frecuencia}
          onChange={(val) => setFrecuencia(val)}
          options={FRECUENCIA_OPTIONS}
          clearable={false}
          disabled={loading}
          placeholder=""
        />

        {/* Responsable */}
        <InputSelectBox
          label="Responsable"
          value={responsableId}
          options={personalOptions}
          onChange={(val) => {
            setResponsableId(val);
            setFieldErrors((prev) => ({ ...prev, responsableId: false }));
          }}
          required={true}
          disabled={loading}
          error={fieldErrors.responsableId ? 'Debes asignar un responsable' : null}
          openDirection="down"
          placeholder=""
        />

        {/* Título de la tarea */}
        <Input
          label="Título de la Tarea"
          value={titulo}
          onChange={(e) => {
            setTitulo(e.target.value);
            setFieldErrors((prev) => ({ ...prev, titulo: false }));
          }}
          required={true}
          readOnly={loading}
          error={fieldErrors.titulo ? 'El título es obligatorio' : null}
          placeholder=""
        />

        {/* Detalles de la tarea */}
        <Input
          tipo="textarea"
          label="Detalles de la Tarea"
          value={detalles}
          onChange={(e) => setDetalles(e.target.value)}
          readOnly={loading}
          placeholder=""
        />
      </div>
    </ModalLateral>
  );
};

export default AgregarEditarTarea;
