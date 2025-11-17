import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import InputNormal from '../../common/InputNormal';
import Boton from '../../common/Boton';
import MensajeError from '../../common/MensajeError';
import ItemView from '../../common/ItemView';
import UserService from '../../../services/userService';
import { useUser } from '../../../context/UserContext';

// Clave para localStorage
const SAVED_USERS_KEY = 'savedUsers';

// Función para obtener usuarios guardados
const getSavedUsers = () => {
    try {
        const saved = localStorage.getItem(SAVED_USERS_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Error al leer usuarios guardados:', error);
        return [];
    }
};

// Función para guardar usuario
const saveUser = (userData) => {
    try {
        const saved = getSavedUsers();
        const userInfo = {
            email: userData.email,
            nombre: `${userData.firstName} ${userData.lastName}`,
            empresa: userData.empresa?.name || 'Sin empresa',
            id: userData.id
        };

        // Verificar si ya existe (por email)
        const existingIndex = saved.findIndex(usr => usr.email === userInfo.email);

        if (existingIndex >= 0) {
            // Actualizar el existente
            saved[existingIndex] = userInfo;
        } else {
            // Agregar nuevo
            saved.push(userInfo);
        }

        // Limitar a los últimos 10 usuarios
        const limited = saved.slice(-10);
        localStorage.setItem(SAVED_USERS_KEY, JSON.stringify(limited));
    } catch (error) {
        console.error('Error al guardar usuario:', error);
    }
};

function LoginEmpresaCuentas({ isOpen, setIsOpen, onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [savedUsers, setSavedUsers] = useState([]);

    const { loadUserData, clearUser, setUserFromService } = useUser();

    // Cargar usuarios guardados al abrir el modal
    useEffect(() => {
        if (isOpen) {
            const saved = getSavedUsers();
            setSavedUsers(saved);
        }
    }, [isOpen]);

    // Función para seleccionar usuario guardado
    const handleSelectSavedUser = async (user) => {
        setLoading(true);
        try {
            // Si tenemos el ID del usuario, generar token directamente sin pedir contraseña
            if (user.id) {
                const response = await UserService.generateUserTokenFromAdmin(user.id);

                if (response.success) {
                    // Verificar que el token se haya guardado correctamente
                    const savedToken = localStorage.getItem('token');
                    if (!savedToken) {
                        console.error('Error: El token no se guardó correctamente');
                        setErrorMessage('Error al guardar la sesión');
                        setTimeout(() => setErrorMessage(''), 3000);
                        return;
                    }

                    // Limpiar datos de empleado ANTES de cargar datos del usuario
                    // Pero NO eliminar el token porque ya es el token del usuario
                    localStorage.removeItem('employeeData');
                    localStorage.removeItem('empresa_id');
                    localStorage.removeItem('sucursalSeleccionada');

                    // Guardar datos del usuario en localStorage para que el contexto los pueda cargar
                    if (response.data.user) {
                        localStorage.setItem('user', JSON.stringify(response.data.user));
                    }

                    // Establecer datos del usuario directamente en el contexto (sin hacer otra petición)
                    if (response.data.user) {
                        setUserFromService(response.data.user);
                        // Marcar que los datos ya están cargados para evitar petición en App.jsx
                        localStorage.setItem('userDataFetched', 'true');
                        
                        // Esperar un momento para asegurar que el estado se actualice antes de redirigir
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }

                    setIsOpen(false);
                    
                    if (onLoginSuccess) {
                        onLoginSuccess(response.data);
                    }
                    return;
                } else {
                    setErrorMessage(response.message || response.error || 'Error al iniciar sesión');
                    setTimeout(() => setErrorMessage(''), 3000);
                }
            } else {
                // Si no tenemos ID, usar el flujo normal con email y contraseña
                setEmail(user.email);
                // Continuar con el flujo normal de login
            }
        } catch (error) {
            console.error('Error al seleccionar usuario:', error);
            setErrorMessage('Error de conexión con el servidor');
            setTimeout(() => setErrorMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Función para login de empresa
    const handleEmpresaLogin = async () => {
        if (!email.trim()) {
            setErrorMessage('El correo electrónico es obligatorio');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        if (!password.trim()) {
            setErrorMessage('La contraseña es obligatoria');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        // Validar formato de email básico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setErrorMessage('El correo electrónico no es válido');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        setLoading(true);
        try {
            const response = await UserService.login({
                email: email.trim(),
                password: password
            });

            if (response.success) {
                // Limpiar datos de empleado antes de cambiar
                localStorage.removeItem('employeeData');
                localStorage.removeItem('empresa_id');
                localStorage.removeItem('employeeDataFetched');

                // Obtener información completa del usuario para establecer en el contexto
                if (response.data && response.data.user && response.data.user.id) {
                        try {
                            const userInfoResponse = await UserService.getCurrentUser(response.data.user.id);
                            if (userInfoResponse.success && userInfoResponse.data && userInfoResponse.data.user) {
                                // Guardar usuario en localStorage para acceso rápido
                                saveUser(userInfoResponse.data.user);
                                // Establecer datos del usuario directamente en el contexto (sin hacer otra petición)
                                setUserFromService(userInfoResponse.data.user);
                                // Marcar que los datos ya están cargados para evitar petición en App.jsx
                                localStorage.setItem('userDataFetched', 'true');
                                
                                // Esperar un momento para asegurar que el estado se actualice antes de redirigir
                                await new Promise(resolve => setTimeout(resolve, 100));
                            } else {
                                // Si no se puede obtener la info completa, usar la básica
                                saveUser(response.data.user);
                                setUserFromService(response.data.user);
                                localStorage.setItem('userDataFetched', 'true');
                                
                                // Esperar un momento para asegurar que el estado se actualice antes de redirigir
                                await new Promise(resolve => setTimeout(resolve, 100));
                            }
                        } catch (error) {
                            console.error('Error al obtener información completa del usuario:', error);
                            // Usar la información básica que tenemos
                            saveUser(response.data.user);
                            setUserFromService(response.data.user);
                            localStorage.setItem('userDataFetched', 'true');
                            
                            // Esperar un momento para asegurar que el estado se actualice antes de redirigir
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                }

                setIsOpen(false);
                
                if (onLoginSuccess) {
                    onLoginSuccess(response.data);
                }
            } else {
                setErrorMessage(response.message || response.error || 'Credenciales incorrectas');
                setTimeout(() => setErrorMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error en login de empresa:', error);
            setErrorMessage('Error de conexión con el servidor');
            setTimeout(() => setErrorMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Función para resetear el modal
    const handleClose = () => {
        setEmail('');
        setPassword('');
        setErrorMessage('');
        setIsOpen(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!loading) {
                handleEmpresaLogin();
            }
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={handleClose}>
            <HeaderModal
                title="Otra Empresa"
                onClose={handleClose}
            />
            <div className={styles.modalContent}>
                <MensajeError mensaje={errorMessage} />

                {savedUsers.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                        <p className={styles.subTitle} style={{ marginBottom: '10px' }}>EMPRESAS RECIENTES</p>
                        {savedUsers.map((user, index) => (
                            <ItemView
                                key={`${user.email}-${index}`}
                                title={user.nombre}
                                description={user.empresa}
                                icon="building"
                                colorIcon="gris"
                                onClick={() => handleSelectSavedUser(user)}
                                arrow={true}
                            />
                        ))}
                    </div>
                )}

                <p className={styles.subTitle}>INICIAR SESIÓN</p>

                <InputNormal
                    tipo="email"
                    icon="envelope"
                    value={email}
                    placeholder="Correo electrónico"
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                />
                <InputNormal
                    tipo="password"
                    icon="lock"
                    value={password}
                    placeholder="Contraseña"
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                />
                <div className={styles.buttons}>
                    <Boton
                        className="btn-original"
                        label="Iniciar Sesión"
                        onClick={handleEmpresaLogin}
                        loading={loading}
                        disabled={!email.trim() || !password.trim()}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default LoginEmpresaCuentas;

