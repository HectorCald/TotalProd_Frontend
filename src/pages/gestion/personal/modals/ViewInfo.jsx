import React from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import InfoCard from '../../../../components/common/information/InfoCard';

const ViewInfo = ({ isOpen, onClose, personal, onEdit, onResetPassword }) => {
    if (!personal) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title=""
            confirmText="Editar"
            onConfirm={() => {
                onClose();
                if (onEdit) onEdit(personal);
            }}
            hideFooter={true}
            width="450px"
        >
            <div style={{ margin: '-10px -24px -24px -24px' }}>
                <InfoCard
                    title={`${personal.first_name || ''} ${personal.last_name || ''}`.trim() || 'Sin nombre'}
                    subtitle={personal.codigo || 'Sin correo'}
                    tags={[
                        personal.cargo ? {
                            text: personal.cargo,
                            icon: 'card'
                        } : null,
                        {
                            text: personal.sucursal?.name || 'Sin sucursal',
                            icon: 'building'
                        },
                        {
                            text: personal.is_active ? 'Activo' : 'Inactivo',
                            color: personal.is_active ? 'success' : 'error',
                            hasDot: true
                        }
                    ].filter(Boolean)}
                    stats={[
                        {
                            label: 'Crear',
                            value: personal.permisos?.crear ? 'Sí' : 'No',
                            icon: 'plus'
                        },
                        {
                            label: 'Editar',
                            value: personal.permisos?.editar ? 'Sí' : 'No',
                            icon: 'edit'
                        },
                        {
                            label: 'Eliminar',
                            value: personal.permisos?.eliminar ? 'Sí' : 'No',
                            icon: 'trash'
                        },
                        {
                            label: 'Anular',
                            value: personal.permisos?.anular ? 'Sí' : 'No',
                            icon: 'block'
                        },
                        {
                            label: 'Reemplazar',
                            value: personal.permisos?.reemplazar ? 'Sí' : 'No',
                            icon: 'sync'
                        }
                    ]}
                    actionButton={
                        <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                            <Boton
                                label="Resetear Contraseña"
                                iconName="key"
                                className="btn-primary"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    onClose();
                                    if (onResetPassword) onResetPassword(personal);
                                }}
                            />
                            <BotonIcon
                                iconName="edit"
                                className="btn-primary"
                                onClick={() => {
                                    onClose();
                                    if (onEdit) onEdit(personal);
                                }}
                            />
                        </div>
                    }
                />
            </div>
        </ModalCentro>
    );
};

export default ViewInfo;