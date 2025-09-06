import React, { useEffect, useState } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputNormal from '../../common/InputNormal';
import Boton from '../../common/Boton';
import Notification from '../../common/Notification';

function CodigoPromocional({ isOpen, setIsOpen }) {
    // Estado para habilitar/deshabilitar el botón
    const [disabled, setDisabled] = useState(true);
    const [loading, setLoading] = useState(false);

    // Estado para la notificación
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });
    const mostrarNotificacion = (tipo, texto) => {
        setNotification({
            isVisible: true,
            type: tipo,
            text: texto
        });

        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    // Estado para almacenar el formulario de codigo promocional
    const [formCodigoPromocional, setFormCodigoPromocional] = useState({
        codigoPromocional: '',
    });
    useEffect(() => {
        setFormCodigoPromocional({
            codigoPromocional: '',
        })
    }, [isOpen])


    // Verificar si todos los campos están llenos para habilitar el botón
    useEffect(() => {
        const allFieldsFilled = formCodigoPromocional.codigoPromocional.trim() !== '';
        setDisabled(!allFieldsFilled);
    }, [formCodigoPromocional]);

    // Función para manejar el cambio de los campos del formulario
    const handleInputChange = (field, value) => {
        setFormCodigoPromocional(prev => ({
            ...prev,
            [field]: value,
        }));
    };
    
    const handleGuardar = async () => {
        setFormCodigoPromocional({
            codigoPromocional: '',
        });
        mostrarNotificacion('success', 'Recompensa reclamada correctamente');
    }
    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Codigo Promocional</h1>
                <p className={styles.subTitle}>Ingresa el codigo promocional para reclamar tu recompensa</p>
                <InputNormal
                    id='codigoPromocional'
                    icon='purchase-tag-alt'
                    tipo='text'
                    value={formCodigoPromocional.codigoPromocional}
                    placeholder='Codigo Promocional'
                    onChange={(e) => handleInputChange('codigoPromocional', e.target.value)}
                />
                <Boton
                    className='btn-original'
                    label='Reclamar recompensa'
                    style={{ marginTop: 'auto' }}
                    onClick={() => handleGuardar()}
                    disabled={disabled}
                    loading={loading}
                />
            </div>
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}
export default CodigoPromocional;