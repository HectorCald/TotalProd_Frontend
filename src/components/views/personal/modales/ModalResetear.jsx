import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import { useToast } from '../../../../context/ToastContext';
import personalService from '../../../../services/personalService';
import styles from '../../../../styles/view.module.css';

function ModalResetear({ 
    isOpen, 
    setIsOpen, 
    personal
}) {
    const { showDanger, showSuccess } = useToast();
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!personal?.id) {
            showDanger('Error', 'ID del personal no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await personalService.resetPassword(personal.id);

            if (response.success) {
                setIsOpen(false);
                showSuccess('Éxito', 'Contraseña reseteada correctamente. El empleado deberá establecer una nueva contraseña.');
            } else {
                showDanger('Error', response.message || 'Error al resetear la contraseña');
            }
        } catch (error) {
            console.error('Error al resetear contraseña:', error);
            showDanger('Error', 'Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Resetear Contraseña"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Resetear la contraseña del personal {personal?.first_name} {personal?.last_name}? Se borrará la contraseña actual y el empleado podrá establecer una nueva ingresando con su código.
                </p>
                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Cancelar'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsOpen(false)}
                    />
                    <Boton
                        className='btn-orange'
                        label='Sí, restablecer'
                        style={{ marginTop: 'auto' }}
                        onClick={handleResetPassword}
                        loading={loading}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalResetear;
