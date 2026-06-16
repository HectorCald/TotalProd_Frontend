import React, { useEffect, useState } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/old/HeaderView';
import View from '../../ui/View';
import InputNormal from '../../common/old/InputNormal';
import Boton from '../../common/botones/Boton';
import MensajeError from '../../common/old/MensajeError';
import UserService from '../../../services/userService';
import { useUser } from '../../../context/UserContext';
import Notification from '../../common/old/Notification';

function CambiarContraseña({ isOpen, setIsOpen }) {
    // Estado para almacenar el mensaje de error y éxito
    const [errorMessage, setErrorMessage] = useState('');

    // Estado para almacenar el usuario
    const { user: usuario } = useUser();

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

    // Estado para almacenar el formulario de contraseñas
    const [formContraseñas, setFormContraseñas] = useState({
        contraseñaActual: '',
        nuevaContraseña: '',
        confirmarNuevaContraseña: ''
    });
    useEffect(() => {
        setFormContraseñas({
            contraseñaActual: '',
            nuevaContraseña: '',
            confirmarNuevaContraseña: ''
        })
    }, [isOpen])


    // Verificar si todos los campos están llenos para habilitar el botón
    useEffect(() => {
        const allFieldsFilled = formContraseñas.contraseñaActual.trim() !== '' &&
            formContraseñas.nuevaContraseña.trim() !== '' &&
            formContraseñas.confirmarNuevaContraseña.trim() !== '';
        setDisabled(!allFieldsFilled);
    }, [formContraseñas]);

    // Función para manejar el cambio de los campos del formulario
    const handleInputChange = (field, value) => {
        setFormContraseñas(prev => ({
            ...prev,
            [field]: value,
        }));
    };
    
    const handleGuardar = async () => {
        if (!formContraseñas.contraseñaActual.trim() || !formContraseñas.nuevaContraseña.trim() || !formContraseñas.confirmarNuevaContraseña.trim()) {
            setErrorMessage('Todos los campos son obligatorios');
            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
            return;
        } else if (formContraseñas.nuevaContraseña.length < 8) {
            setErrorMessage('La nueva contraseña debe tener al menos 8 caracteres');
            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
            return;
        }
        else if (formContraseñas.nuevaContraseña !== formContraseñas.confirmarNuevaContraseña) {
            setErrorMessage('Las contraseñas nuevas no coinciden');
            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
            return;
        }

        try {
            setLoading(true);

            // Obtener el ID del usuario del localStorage
            if (!usuario || !usuario.id) {
                setErrorMessage('No se pudo obtener la información del usuario');
                setTimeout(() => {
                    setErrorMessage('')
                }, 3000);
                return;
            }

            // Cambiar la contraseña
            const result = await UserService.changePassword(
                usuario.id,
                formContraseñas.contraseñaActual,
                formContraseñas.nuevaContraseña
            );

            if (result.success) {
                mostrarNotificacion('success', 'Contraseña cambiada exitosamente');
                setFormContraseñas({
                    contraseñaActual: '',
                    nuevaContraseña: '',
                    confirmarNuevaContraseña: ''
                });
            } else {
                setErrorMessage(result.message || 'Error al cambiar la contraseña');
                setTimeout(() => {
                    setErrorMessage('')
                }, 3000);
            }
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            setErrorMessage('Error al cambiar la contraseña');
            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
        } finally {
            setLoading(false);
        }
    }
    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}isMainView={true}>
            <HeaderView onBack={() => setIsOpen(false)} title='Cambiar Contraseña' />
            <div className={styles.container}>
                <MensajeError mensaje={errorMessage} />
                <p className={styles.subTitle}>INGRESA LA ACTUAL Y LA NUEVA CONTRASEÑA</p>
                <InputNormal
                    id='contraseñaActual'
                    icon='lock'
                    tipo='password'
                    value={formContraseñas.contraseñaActual}
                    placeholder='Contraseña Actual'
                    onChange={(e) => handleInputChange('contraseñaActual', e.target.value)}
                />
                <InputNormal
                    id='nuevaContraseña'
                    icon='lock'
                    tipo='password'
                    placeholder='Nueva Contraseña'
                    value={formContraseñas.nuevaContraseña}
                    onChange={(e) => handleInputChange('nuevaContraseña', e.target.value)}
                />
                <InputNormal
                    id='confirmarNuevaContraseña'
                    value={formContraseñas.confirmarNuevaContraseña}
                    icon='lock'
                    tipo='password'
                    placeholder='Confirmar Nueva Contraseña'
                    onChange={(e) => handleInputChange('confirmarNuevaContraseña', e.target.value)}
                />
                <Boton
                    className='btn-original'
                    label='Guardar'
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
export default CambiarContraseña;