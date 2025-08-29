import React, { useEffect, useState } from 'react';
import styles from './CambiarContraseña.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Input from '../../common/Input';
import Boton from '../../common/Boton';
import MensajeError from '../../common/MensajeError';

function CambiarContraseña({ isOpen, setIsOpen, usuario}) {
    const [errorMessage, setErrorMessage] = useState('');
    const [dataUser, setDataUser]= useState('')
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
    const handleInputChange = (field, value) => {
        setFormContraseñas(prev => ({
            ...prev,
            [field]: value,
        }));
    };
    const handleClose = () => {
        setIsOpen(false);
    };
    const handleGuardar = () => {
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
        console.log('Se cambio la contraseña del usuario: '+dataUser.id)
        setIsOpen(false);
        // Limpiar el mensaje de error si todo está bien
        setErrorMessage('');
        // Aquí puedes continuar con la lógica de guardar
    }
    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={handleClose} />
            <div className={styles.container}>
                <h1 className={styles.title}>Cambiar contraseña</h1>
                <MensajeError mensaje={errorMessage} />
                <p className={styles.subTitle}>Ingresa la contraseña actual y la nueva contraseña</p>
                <Input
                    id='contraseñaActual'
                    type='password'
                    value={formContraseñas.contraseñaActual}
                    label={'Contraseña actual'}
                    onChange={(e) => handleInputChange('contraseñaActual', e.target.value)}
                />
                <Input
                    id='nuevaContraseña'
                    type='password'
                    label={'Nueva contraseña'}
                    value={formContraseñas.nuevaContraseña}
                    onChange={(e) => handleInputChange('nuevaContraseña', e.target.value)}
                />
                <Input
                    id='confirmarNuevaContraseña'
                    value={formContraseñas.confirmarNuevaContraseña}
                    type='password'
                    label={'Confirmar nueva contraseña'}
                    onChange={(e) => handleInputChange('confirmarNuevaContraseña', e.target.value)}
                />
                <Boton
                    className='btn-original'
                    label='Guardar'
                    style={{ marginTop: 'auto' }}
                    onClick={() => handleGuardar()}
                />
            </div>
        </View>
    );
}
export default CambiarContraseña;