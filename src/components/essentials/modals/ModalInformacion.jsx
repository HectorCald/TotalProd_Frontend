import React from 'react';
import ModalCentro from '../../common/modals/ModalCentro';
import ColumnInfo from '../../common/outputs/ColumnInfo';

const ModalInformacion = ({ 
    isOpen, 
    onClose, 
    info,
    title,
    confirmText = 'Entendido',
    onConfirm
}) => {
    if (!isOpen) return null;

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
