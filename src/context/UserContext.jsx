import React, { createContext, useContext, useState, useEffect } from 'react';
import UserService from '../services/userService';
import { OFFLINE_NETWORK_FLAG } from '../utils/offlineNetworkInterceptor';

const UserContext = createContext();

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser debe ser usado dentro de UserProvider');
    }
    return context;
};

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cargar sucursal seleccionada al inicializar
    useEffect(() => {
        const sucursalGuardada = localStorage.getItem('sucursalSeleccionada');
        if (sucursalGuardada) {
            try {
                setSucursalSeleccionada(JSON.parse(sucursalGuardada));
            } catch (error) {
                console.error('Error al cargar sucursal seleccionada:', error);
                localStorage.removeItem('sucursalSeleccionada');
            }
        }
    }, []);

    // Función para limpiar usuario (logout)
    const clearUser = () => {
        setUser(null);
        setSucursalSeleccionada(null);
        setError(null);
        
        // Limpiar solo los datos específicos del usuario, no todo el localStorage
        const keysToRemove = ['user', 'token', 'sucursalSeleccionada', 'userData'];
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
    };

    // Función para seleccionar sucursal
    const seleccionarSucursal = (sucursal) => {
        setSucursalSeleccionada(sucursal);
        localStorage.setItem('sucursalSeleccionada', JSON.stringify(sucursal));
    };

    // Función helper para detectar errores de conexión
    const isConnectionError = (error, errorMessage) => {
        // Verificar si es un error de conexión
        if (error) {
            const errorMsg = error.message || error.toString() || '';
            const errorName = error.name || '';
            
            // Errores típicos de conexión
            if (
                errorMsg.includes('Failed to fetch') ||
                errorMsg.includes('NetworkError') ||
                errorMsg.includes('Network request failed') ||
                errorMsg.includes('ERR_INTERNET_DISCONNECTED') ||
                errorMsg.includes('ERR_NETWORK_CHANGED') ||
                errorMsg.includes('ERR_CONNECTION_REFUSED') ||
                errorMsg.includes('ERR_CONNECTION_RESET') ||
                errorMsg.includes('ERR_CONNECTION_TIMED_OUT') ||
                errorName === 'TypeError' ||
                errorName === 'NetworkError'
            ) {
                return true;
            }
        }
        
        // Verificar mensajes de error que indican conexión
        if (errorMessage) {
            const msg = errorMessage.toLowerCase();
            if (
                msg.includes('conexión') ||
                msg.includes('connection') ||
                msg.includes('network') ||
                msg.includes('fetch') ||
                msg.includes('internet') ||
                msg.includes('offline')
            ) {
                return true;
            }
        }
        
        return false;
    };

    // Función para cargar datos completos del usuario
    const getOfflineUserData = () => {
        try {
            const cached = localStorage.getItem('offline_user_data');
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.warn('No se pudo leer usuario offline:', error);
            return null;
        }
    };

    const shouldUseOffline = () => {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
        try {
            return localStorage.getItem(OFFLINE_NETWORK_FLAG) === 'true';
        } catch {
            return false;
        }
    };

    const loadUserData = async (userId) => {
        setLoading(true);
        setError(null);

        if (shouldUseOffline()) {
            const offlineUser = getOfflineUserData();
            if (offlineUser) {
                setUser(offlineUser);
                setLoading(false);
                return { success: true, data: offlineUser, offline: true };
            }
        }
        
        try {
            const userData = await UserService.getCurrentUser(userId);
            if (userData.success) {
                setUser(userData.data.user);
                setError(null);
                setLoading(false);
                return { success: true, data: userData.data.user };
            } else {
                const errorMessage = userData?.error || userData?.message || 'Error desconocido al obtener usuario';
                console.error('No se pudo obtener el usuario:', errorMessage);
                
                // Detectar si es error de conexión
                if (isConnectionError(null, errorMessage)) {
                    const connectionError = 'No se pudo conectar al servidor. Verifica tu conexión a internet e intenta nuevamente.';
                    setError(connectionError);
                    setLoading(false);
                    return { success: false, error: connectionError };
                }
                
                // Si hay error al obtener el usuario, establecer error
                if (userData?.status === 400 || userData?.status === 500 || !userData?.success) {
                    console.log('❌ Error al obtener usuario:', errorMessage);
                    setError(errorMessage);
                    setLoading(false);
                    return { success: false, error: errorMessage };
                }
                
                setError(errorMessage);
                setLoading(false);
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
            
            // Detectar si es error de conexión
            if (isConnectionError(error, error.message)) {
                const connectionError = 'No se pudo conectar al servidor. Verifica tu conexión a internet e intenta nuevamente.';
                console.log('❌ Error de conexión al obtener usuario');
                setError(connectionError);
                setLoading(false);
                return { success: false, error: connectionError };
            }
            
            // Si hay error de conexión o cualquier otro error, establecer error
            console.log('❌ Error al obtener usuario:', error.message);
            setError(error.message);
            setLoading(false);
            return { success: false, error: error.message };
        }
    };

    // Función para actualizar la imagen de empresa
    const updateEmpresaImage = (newImage) => {
        setUser(prevUser => {
            if (!prevUser) return prevUser;
            return {
                ...prevUser,
                logo_tipo: newImage
            };
        });
    };

    // Establecer usuario directamente desde una respuesta de servicio (sin re-fetch)
    const setUserFromService = (newUser) => {
        if (!newUser) return;
        setUser(newUser);
    };

    const value = {
        user,
        sucursalSeleccionada,
        loading,
        error,
        clearUser,
        seleccionarSucursal,
        loadUserData,
        updateEmpresaImage,
        setUserFromService
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};
