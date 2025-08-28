import React, { useState, useEffect } from 'react';
import styles from './EditarUsuario.module.css';
import View from '../../ui/View';
import HeaderView from '../../common/HeaderView';
import Input from '../../common/Input';
import Boton from '../../common/Boton';
import UserService from '../../../services/userService';
import LoadingSpinner from '../../common/LoadingSpinner';

const EditarUsuario = ({ isOpen, setIsOpen }) => {
    const [formDataEditarUsuario, setFormDataEditarUsuario] = useState({
        nombre: '',
        celular: '',
        correo: '',
        contrasena: '',
        confirmarContrasena: '',
    });

    // Estado para almacenar los datos originales del usuario
    const [originalUserData, setOriginalUserData] = useState({
        nombre: '',
        celular: '',
        correo: '',
        contrasena: '',
        confirmarContrasena: '',
    });

    const [loading, setLoading] = useState(false);
    const [isChanged, setIsChanged] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            const userId = localStorage.getItem('userId');

            if (userId) {
                setLoading(true);
                try {
                    const result = await UserService.getUserById(userId);

                    if (result.success && result.data) {
                        const user = result.data;

                        const userData = {
                            nombre: user.name || user.nombre || '',
                            celular: user.celular || user.phone || '',
                            correo: user.email || user.correo || '',
                            contrasena: '',
                            confirmarContrasena: '',
                        };

                        // Establecer tanto los datos del formulario como los originales
                        setFormDataEditarUsuario(userData);
                        setOriginalUserData(userData);
                        setIsChanged(false); // Resetear el estado de cambios
                    } else {
                        console.error('Error al obtener usuario:', result.error);
                        alert(`Error al obtener usuario: ${result.error}`);
                    }
                } catch (error) {
                    console.error('Error al obtener usuario:', error);
                    alert('Error de conexión al obtener usuario');
                } finally {
                    setLoading(false);
                }
            } else {
                alert('No se encontró ID de usuario');
            }
        };

        if (isOpen) {
            fetchUserData();
        }
    }, [isOpen]);

    const handleInputChange = (field, value) => {
        setFormDataEditarUsuario(prev => ({
            ...prev,
            [field]: value,
        }));

        // Verificar si hay cambios después de la modificación
        setTimeout(() => {
            checkForChanges();
        }, 0);
    };

    // Función para verificar si hay cambios
    const checkForChanges = () => {
        const hasChanges =
            formDataEditarUsuario.nombre !== originalUserData.nombre ||
            formDataEditarUsuario.celular !== originalUserData.celular ||
            formDataEditarUsuario.correo !== originalUserData.correo ||
            formDataEditarUsuario.contrasena !== '' ||
            formDataEditarUsuario.confirmarContrasena !== '';

        setIsChanged(hasChanges);
    };

    // Verificar cambios cada vez que cambie el formData
    useEffect(() => {
        checkForChanges();
    }, [formDataEditarUsuario]);

    const handleSave = async () => {
        if (!isChanged) return;

        // Obtener userId al inicio de la función
        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert('No se encontró ID de usuario');
            return;
        }

        if (!formDataEditarUsuario.nombre || !formDataEditarUsuario.celular) {
            if (!formDataEditarUsuario.nombre) {
                setFormDataEditarUsuario(prev => ({
                    ...prev,
                    nombreError: 'El nombre es requerido',
                }));
            }
            if (!formDataEditarUsuario.celular) {
                setFormDataEditarUsuario(prev => ({
                    ...prev,
                    celularError: 'El celular es requerido',
                }));
            }
            if (!formDataEditarUsuario.contrasena) {
                setFormDataEditarUsuario(prev => ({
                    ...prev,
                    contrasenaError: 'La contraseña es requerida',
                }));
            }
            if (!formDataEditarUsuario.confirmarContrasena) {
                setFormDataEditarUsuario(prev => ({
                    ...prev,
                    confirmarContrasenaError: 'La contraseña es requerida',
                }));
            }
            setTimeout(() => {
                setFormDataEditarUsuario(prev => ({
                    ...prev,
                    nombreError: '',
                    celularError: '',
                    contrasenaError: '',
                    confirmarContrasenaError: ''
                }));
            }, 3000);
            return;
        }

        if (formDataEditarUsuario.contrasena || formDataEditarUsuario.confirmarContrasena) {
            if (formDataEditarUsuario.contrasena.length < 8) {
                setFormDataEditarUsuario(prev => ({
                    ...prev,
                    contrasenaError: 'La contraseña debe tener al menos 8 caracteres',
                }));
                setTimeout(() => {
                    setFormDataEditarUsuario(prev => ({
                        ...prev,
                        contrasenaError: '',
                    }));
                }, 3000);
                return;
            }
            // Verificar que la contraseña actual sea correcta
            try {
                setLoading(true);
                const result = await UserService.verifyPasswordById(userId, formDataEditarUsuario.contrasena);
                if (!result.success || !result.data.isValid) {
                    setFormDataEditarUsuario(prev => ({
                        ...prev,
                        contrasenaError: 'La contraseña actual es incorrecta',
                    }));
                    setTimeout(() => {
                        setFormDataEditarUsuario(prev => ({
                            ...prev,
                            contrasenaError: ''
                        }));
                    }, 3000);
                    return;
                }
            } catch (error) {
                console.error('Error al verificar contraseña:', error);
                alert('Error de conexión al verificar contraseña');
            } finally {
                setLoading(false);
            }
        }



        try {
            const updateData = {
                nombre: formDataEditarUsuario.nombre,
                celular: formDataEditarUsuario.celular,
                correo: formDataEditarUsuario.correo,
                contrasena: formDataEditarUsuario.confirmarContrasena, // Nueva contraseña
            };
            setLoading(true);
            const result = await UserService.updateUser(userId, updateData);

            if (result.success) {
                alert('Usuario actualizado exitosamente');
                // Limpiar campos de contraseña
                setFormDataEditarUsuario(prev => ({
                    ...prev,
                    contrasena: '',
                    confirmarContrasena: '',
                }));
                // Actualizar datos originales
                setOriginalUserData({
                    ...formDataEditarUsuario,
                    contrasena: '',
                    confirmarContrasena: '',
                });
                setIsChanged(false);
                setIsOpen(false);
            } else {
                alert(`Error al actualizar: ${result.error || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            alert('Error de conexión al actualizar usuario');
        } finally {
            setLoading(false);
            setIsOpen(false);
        }

    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            {loading && <LoadingSpinner />}
            <HeaderView title='Editar Perfil' onBack={() => setIsOpen(false)} />
            <div className={styles.editarUsuario}>
                <Input
                    label='Nombre'
                    value={formDataEditarUsuario.nombre}
                    type='text'
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    error={formDataEditarUsuario.nombreError}
                />
                <Input
                    label='Celular'
                    value={formDataEditarUsuario.celular}
                    type='number'
                    onChange={(e) => handleInputChange('celular', e.target.value)}
                    error={formDataEditarUsuario.celularError}
                />
                <Input
                    label='Contraseña'
                    type='password'
                    value={formDataEditarUsuario.contrasena}
                    onChange={(e) => handleInputChange('contrasena', e.target.value)}
                    error={formDataEditarUsuario.contrasenaError}
                />
                <Input
                    label='Nueva Contraseña'
                    type='password'
                    value={formDataEditarUsuario.confirmarContrasena}
                    onChange={(e) => handleInputChange('confirmarContrasena', e.target.value)}
                    error={formDataEditarUsuario.confirmarContrasenaError}
                />
                <div className={styles.editarUsuarioButtons}>
                    <Boton
                        className='btn-original'
                        label='Guardar'
                        onClick={handleSave}
                        disabled={!isChanged || loading}
                    />
                </div>
            </div>
        </View>
    );
};

export default EditarUsuario;