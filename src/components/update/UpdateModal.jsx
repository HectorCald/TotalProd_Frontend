import React from 'react';
import ModalCentro from '../common/modals/ModalCentro';
import ColumnInfo from '../common/outputs/ColumnInfo';
import { UPDATE_INFO } from './constants/updateInfo';

const UpdateModal = ({ isOpen, onClose, version }) => {
    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title={UPDATE_INFO.title}
            hideCancel={true}
            confirmText="¡Entendido!"
            onConfirm={() => {
                onClose();
                window.location.reload();
            }}
            contentStyle={{ paddingBlock: 0 }}
        >

            <ColumnInfo
                items={[
                    { clave: 'Versión', valor: version || UPDATE_INFO.version, icon: 'purchase-tag' },
                    { clave: 'Fecha', valor: UPDATE_INFO.date, icon: 'calendar' }
                ]}
            />


            <p style={{ fontSize: '12px', color: '#555', lineHeight: '1.5', margin: '0 0 15px 0' }}>
                {UPDATE_INFO.description}
            </p>
        </ModalCentro>
    );
};

export default UpdateModal;
