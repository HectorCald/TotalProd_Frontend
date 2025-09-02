import React, { useEffect, useState } from 'react';
import styles from './CambiarContraseña.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputNormal from '../../common/InputNormal';
import Boton from '../../common/Boton';
import MensajeError from '../../common/MensajeError';
import MensajeExito from '../../common/MensajeExito';
import UserService from '../../../services/userService';

function CambiarContraseña({ isOpen, setIsOpen, usuario}) {
    const [errorMessage, setErrorMessage] = useState('');
    const [mensajeExito, setMensajeExito] = useState('');
    const [dataUser, setDataUser]= useState('')
    const [disabled, setDisabled] = useState(true);
    const [loading, setLoading] = useState(false);
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
        if(usuario){
            setDataUser(usuario)
        }
    }, [isOpen])

    // Verificar si todos los campos están llenos para habilitar el botón
    useEffect(() => {
        const allFieldsFilled = formContraseñas.contraseñaActual.trim() !== '' && 
                               formContraseñas.nuevaContraseña.trim() !== '' && 
                               formContraseñas.confirmarNuevaContraseña.trim() !== '';
        setDisabled(!allFieldsFilled);
    }, [formContraseñas]);
    const handleInputChange = (field, value) => {
        setFormContraseñas(prev => ({
            ...prev,
            [field]: value,
        }));
    };
    const handleClose = () => {
        setIsOpen(false);
    };
    const handleGuardar = async () => {
        if (!formContraseñas.contraseñaActual.trim() ||!formContraseñas.nuevaContraseña.trim() ||!formContraseñas.confirmarNuevaContraseña.trim()) {
            setErrorMessage('Todos los campos son obligatorios');
            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
            return;
        }else if(formContraseñas.nuevaContraseña.length < 8){
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
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (!userInfo || !userInfo.id) {
                setErrorMessage('No se pudo obtener la información del usuario');
                setTimeout(() => {
                    setErrorMessage('')
                }, 3000);
                return;
            }

            // Cambiar la contraseña
            const result = await UserService.changePassword(
                userInfo.id,
                formContraseñas.contraseñaActual,
                formContraseñas.nuevaContraseña
            );

            if (result.success) {
                setMensajeExito('Contraseña cambiada exitosamente');
                setTimeout(() => {
                    setMensajeExito('');
                    // Limpiar el formulario
                    setFormContraseñas({
                        contraseñaActual: '',
                        nuevaContraseña: '',
                        confirmarNuevaContraseña: ''
                    });
                    setIsOpen(false);
                }, 2000);
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
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={handleClose} />
            <div className={styles.container}>
                <h1 className={styles.title}>Cambiar Contraseña</h1>
                <MensajeError mensaje={errorMessage} />
                <MensajeExito mensaje={mensajeExito} />
                <p className={styles.subTitle}>Ingresa la contraseña actual y la nueva contraseña</p>
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
        </View>
    );
}
export default CambiarContraseña;