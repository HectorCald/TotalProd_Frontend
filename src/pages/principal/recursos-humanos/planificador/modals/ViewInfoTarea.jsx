import React, { useState, useEffect } from 'react';
import ModalCentro from '../../../../../components/common/modals/ModalCentro';
import InfoCard from '../../../../../components/common/information/InfoCard';
import ColumnInfo from '../../../../../components/common/outputs/ColumnInfo';
import InputSelect from '../../../../../components/common/inputs/InputSelect';
import Boton from '../../../../../components/common/botones/Boton';
import BotonIcon from '../../../../../components/common/botones/BotonIcon';
import useFechaLiteral from '../../../../../hooks/useFechaLiteral';
import { useToast } from '../../../../../context/ToastContext';
import planificadorService from '../../../../../services/planificadorService';

const ESTADO_OPTIONS = [
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'En Progreso', label: 'En Progreso' },
  { value: 'Completado', label: 'Completado' },
];

const FRECUENCIA_LABELS = {
  unica: 'Un solo día',
  semanal: 'Cada semana (el mismo día)',
  mensual: 'Cada mes (la misma fecha)',
};

const ViewInfoTarea = ({
  isOpen,
  onClose,
  tarea,
  onEdit,
  onEliminarClick,
  onGuardar,
}) => {
  const { showSuccess, showDanger } = useToast();
  const [estado, setEstado] = useState('Pendiente');
  const [loading, setLoading] = useState(false);
  const fechaLiteral = useFechaLiteral(tarea?.fecha);

  useEffect(() => {
    if (isOpen && tarea) {
      setEstado(tarea.estado || 'Pendiente');
    }
  }, [isOpen, tarea]);

  if (!tarea) return null;

  const handleGuardar = async () => {
    if (tarea.estado === estado) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      const response = await planificadorService.updateEstado(tarea.id, estado);
      if (response && response.success) {
        const updated = response.data || { ...tarea, estado };
        if (onGuardar) {
          onGuardar(updated);
        }
        setLoading(false);
        onClose();
        showSuccess(null, 'Estado de la tarea actualizado exitosamente');
      } else {
        setLoading(false);
        showDanger(null, response?.message || 'Error al actualizar el estado');
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

  const getStatusColor = (st) => {
    if (st === 'Completado') return '#16a34a';
    if (st === 'En Progreso') return '#0284c7';
    return '#f59e0b';
  };

  const getStatusDot = (st) => {
    if (st === 'Completado') return 'success';
    if (st === 'En Progreso') return 'info';
    return 'warning';
  };

  return (
    <ModalCentro
      isOpen={isOpen}
      onClose={handleClose}
      title=""
      hideFooter={true}
      width="460px"
      loading={loading}
      disableClose={loading}
    >
      <InfoCard
        title={tarea.titulo}
        subtitle={fechaLiteral || tarea.fecha}
        icon="calendar-check"
        statusDot={getStatusDot(tarea.estado)}
        customBlock={
          <>
            <ColumnInfo
              title="Información de la Tarea"
              noScroll={true}
              items={[
                { clave: 'Responsable:', valor: tarea.responsableNombre || 'Sin asignar' },
                ...(tarea.responsableCargo ? [{ clave: 'Cargo:', valor: tarea.responsableCargo }] : []),
                { clave: 'Frecuencia:', valor: FRECUENCIA_LABELS[tarea.frecuencia] || 'Un solo día' },
              ]}
            />

            {tarea.detalles && (
              <ColumnInfo
                title="Detalles"
                noScroll={true}
                items={[
                  { clave: 'Descripción:', valor: tarea.detalles },
                ]}
              />
            )}

            <div style={{ marginTop: '12px', marginBottom: '20px' }}>
              <InputSelect
                label="Estado Actual"
                value={estado}
                onChange={(val) => setEstado(val)}
                options={ESTADO_OPTIONS}
                clearable={false}
                disabled={loading}
                placeholder=""
                openDirection="up"
              />
            </div>
          </>
        }
        actionButton={
          <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
            <Boton
              label="Guardar"
              className="btn-primary"
              iconName="save"
              onClick={handleGuardar}
              loading={loading}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <BotonIcon
              iconName="edit"
              className="btn-primary"
              tooltip="Editar Tarea"
              onClick={() => {
                if (loading) return;
                if (onEdit) onEdit(tarea);
              }}
              disabled={loading}
            />
            <BotonIcon
              iconName="trash"
              className="btn-error"
              tooltip="Eliminar Tarea"
              tooltipAlign="end"
              onClick={() => {
                if (loading) return;
                if (onEliminarClick) {
                  onEliminarClick(tarea);
                }
              }}
              disabled={loading}
            />
          </div>
        }
      />
    </ModalCentro>
  );
};

export default ViewInfoTarea;
