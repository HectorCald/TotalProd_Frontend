import React from 'react';
import ModalCentro from '../../common/modals/ModalCentro';
import ColumnInfo from '../../common/outputs/ColumnInfo';
import Boton from '../../common/botones/Boton';
import useFechaLiteral from '../../../hooks/useFechaLiteral';

const formatFrecuencia = (frecuencia) => {
    if (!frecuencia) return 'Única';
    const f = String(frecuencia).toLowerCase();
    if (f === 'unica' || f === 'única') return 'Única';
    if (f === 'semanal') return 'Semanal';
    if (f === 'mensual') return 'Mensual';
    return frecuencia.charAt(0).toUpperCase() + frecuencia.slice(1);
};

const TareaCard = ({
    tarea,
    loadingTaskId,
    onEmpezarTarea,
    onFinalizarTarea
}) => {
    const fechaLiteral = useFechaLiteral(tarea.fecha);
    const isPendiente = tarea.estado === 'Pendiente';
    const isEnProgreso = tarea.estado === 'En Progreso';
    const isLoading = loadingTaskId === tarea.id;

    const items = [
        { clave: 'Detalles', valor: tarea.detalles || 'Sin detalles' }
    ];

    return (
        <div 
            key={tarea.id}
            style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s ease'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--black-color)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                        {tarea.titulo}
                    </h4>
                    <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span>{fechaLiteral || tarea.fecha}</span>
                        <span style={{ fontSize: '9px', opacity: 0.7 }}>•</span>
                        <span>{formatFrecuencia(tarea.frecuencia)}</span>
                    </div>
                </div>
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 9px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        backgroundColor: isPendiente ? '#fef3c7' : '#e0f2fe',
                        color: isPendiente ? '#b45309' : '#0284c7',
                        border: `1px solid ${isPendiente ? '#fde68a' : '#bae6fd'}`
                    }}
                >
                    {tarea.estado || (isPendiente ? 'Pendiente' : 'En Progreso')}
                </span>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <ColumnInfo
                    items={items}
                    hasBorder={false}
                    noScroll={true}
                />
            </div>

            {isPendiente && (
                <Boton
                    label="Empezar"
                    className="btn-primary"
                    onClick={() => onEmpezarTarea && onEmpezarTarea(tarea.id)}
                    loading={isLoading}
                    disabled={loadingTaskId !== null && !isLoading}
                    style={{ width: '100%', marginTop: '2px' }}
                />
            )}
            {isEnProgreso && (
                <Boton
                    label="Finalizar"
                    className="btn-primary"
                    onClick={() => onFinalizarTarea && onFinalizarTarea(tarea.id)}
                    loading={isLoading}
                    disabled={loadingTaskId !== null && !isLoading}
                    style={{ width: '100%', marginTop: '2px' }}
                />
            )}
        </div>
    );
};

const ModalInformacion = ({ 
    isOpen, 
    onClose, 
    info,
    title,
    confirmText = 'Entendido',
    onConfirm,
    tareas,
    onEmpezarTarea,
    onFinalizarTarea,
    loadingTaskId,
    hideFooter
}) => {
    if (!isOpen) return null;

    // Si se le pasan tareas, muestra la lista de tareas del usuario
    if (tareas !== undefined) {
        const modalTitle = title || 'Mis tareas';

        return (
            <ModalCentro
                isOpen={isOpen}
                onClose={onClose}
                title={modalTitle}
                hideFooter={true}
                contentStyle={{ paddingTop: '10px', paddingBottom: '26px' }}
            >
                {tareas.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '13px' }}>
                        No tienes tareas asignadas.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '95vh', overflowY: 'auto', paddingRight: '4px', paddingBottom: '10px' }}>
                        {tareas.map((tarea) => (
                            <TareaCard
                                key={tarea.id}
                                tarea={tarea}
                                loadingTaskId={loadingTaskId}
                                onEmpezarTarea={onEmpezarTarea}
                                onFinalizarTarea={onFinalizarTarea}
                            />
                        ))}
                    </div>
                )}
            </ModalCentro>
        );
    }

    const data = info || {};
    const modalTitle = title || data.titleDetails || 'Detalles de la versión';
    const version = data.version;
    const date = data.date;
    const description = data.descriptionDetails || data.description;
    const cambios = data.cambios || [];
    const nuevasFunciones = data.nuevasFunciones || [];
    const correcciones = data.correcciones || [];

    const headerItems = [];
    if (version) {
        headerItems.push({ clave: 'Versión', valor: version, icon: 'purchase-tag' });
    }
    if (date) {
        headerItems.push({ clave: 'Fecha', valor: date, icon: 'calendar' });
    }

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        } else {
            onClose();
        }
    };

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title={modalTitle}
            hideCancel={true}
            hideFooter={hideFooter}
            confirmText={confirmText}
            onConfirm={handleConfirm}
            contentStyle={{ paddingBlock: 0 }}
        >
            {headerItems.length > 0 && (
                <ColumnInfo items={headerItems} />
            )}

            {description && (
                <p style={{ fontSize: '12px', color: '#555', lineHeight: '1.5', margin: '0 0 15px 0' }}>
                    {description}
                </p>
            )}

            {cambios.length > 0 && (
                <ColumnInfo
                    title="Cambios:"
                    items={cambios}
                    variant="changes"
                />
            )}

            {nuevasFunciones.length > 0 && (
                <ColumnInfo
                    title="Nuevas funciones:"
                    items={nuevasFunciones}
                    variant="changes"
                />
            )}

            {correcciones.length > 0 && (
                <ColumnInfo
                    title="Correcciones:"
                    items={correcciones}
                    variant="changes"
                />
            )}
        </ModalCentro>
    );
};

export default ModalInformacion;
