import React, { useState } from 'react';
import styles from './CambiarContraseña.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputNormal from '../../common/InputNormal';
import Boton from '../../common/Boton';


function CambiarContraseña({ isOpen, setIsOpen}) {
    const [formContraseñas, setFormContraseñas] = useState({
        contraseñaActual: '',
        nuevaContraseña: '',
        confirmarNuevaContraseña: ''
    });
    const handleInputChange = (field, value) => {
        setFormContraseñas(prev => ({
            ...prev,
            [field]: value,
        }));
    };
    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={handleClose} />
            <div className={styles.container}>
                <h1 className={styles.title}>Cambiar contraseña</h1>
                <p className={styles.subTitle}>Ingresa la contraseña actual y la nueva contraseña</p>
                <InputNormal
                    id='contraseñaActual'
                    tipo={'password'}
                    value={formContraseñas.contraseñaActual}
                    placeholder={'Contraseña actual'}
                    onChange={(e) => handleInputChange('contraseñaActual', e.target.value)}
                />
                <InputNormal
                    id='nuevaContraseña'
                    tipo={'password'}
                    placeholder={'Nueva contraseña'}
                    value={formContraseñas.nuevaContraseña}
                    onChange={(e) => handleInputChange('nuevaContraseña', e.target.value)}
                />
                <InputNormal
                    id='confirmarNuevaContraseña'
                    value={formContraseñas.confirmarNuevaContraseña}
                    tipo={'password'}
                    placeholder={'Confirmar nueva contraseña'}
                    onChange={(e) => handleInputChange('confirmarNuevaContraseña', e.target.value)}
                />
                <Boton
                    className='btn-original'
                    label='Guardar'
                    style={{ marginTop: 'auto' }}
                />
            </div>
        </View>
    );
}
export default CambiarContraseña;