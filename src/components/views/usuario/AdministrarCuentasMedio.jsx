import React from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemView from '../../common/ItemView';

function AdministrarCuentasMedio({ isOpen, setIsOpen, onSelectEmpleado, onSelectEmpresa }) {
    const handleSelectEmpleado = () => {
        setIsOpen(false);
        if (onSelectEmpleado) {
            onSelectEmpleado();
        }
    };

    const handleSelectEmpresa = () => {
        setIsOpen(false);
        if (onSelectEmpresa) {
            onSelectEmpresa();
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Administrar Cuentas"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <ItemView
                    title='Cuenta de empleado'
                    description='Iniciar sesión con una cuenta de empleado'
                    icon='user'
                    arrow={true}
                    onClick={handleSelectEmpleado}
                />
                <ItemView
                    title='Otra empresa'
                    description='Iniciar sesión con otra cuenta de empresa'
                    icon='building'
                    arrow={true}
                    onClick={handleSelectEmpresa}
                />
            </div>
        </ViewModal>
    );
}

export default AdministrarCuentasMedio;

