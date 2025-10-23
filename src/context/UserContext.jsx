import React, { createContext, useContext, useState, useEffect } from 'react';
import UserService from '../services/userService';

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
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [offlineData, setOfflineData] = useState(null);

    // Cargar datos al inicializar
    useEffect(() => {
        // Cargar sucursal seleccionada
        const sucursalGuardada = localStorage.getItem('sucursalSeleccionada');
        if (sucursalGuardada) {
            try {
                setSucursalSeleccionada(JSON.parse(sucursalGuardada));
            } catch (error) {
                console.error('Error al cargar sucursal seleccionada:', error);
                localStorage.removeItem('sucursalSeleccionada');
            }
        }

        // Cargar modo offline
        const offlineMode = localStorage.getItem('offlineMode');
        if (offlineMode !== null) {
            const isOffline = JSON.parse(offlineMode);
            setIsOfflineMode(isOffline);
            
            // SOLO bloquear internet si está en modo offline
            if (isOffline) {
                console.log('🚫 MODO OFFLINE ACTIVADO - BLOQUEANDO INTERNET');
                
                window.fetch = function() {
                    console.log('🚫 FETCH BLOQUEADO - MODO OFFLINE');
                    return Promise.reject(new Error('Modo offline activado'));
                };
                
                window.XMLHttpRequest = function() {
                    console.log('🚫 XMLHttpRequest BLOQUEADO - MODO OFFLINE');
                    throw new Error('Modo offline activado');
                };
                
                window.WebSocket = function() {
                    console.log('🚫 WebSocket BLOQUEADO - MODO OFFLINE');
                    throw new Error('Modo offline activado');
                };
                
                Object.defineProperty(navigator, 'onLine', {
                    get: () => false,
                    configurable: true
                });
            }
        }

        // Cargar datos offline si existen
        const offlineDataSaved = localStorage.getItem('offlineData');
        if (offlineDataSaved) {
            try {
                const offlineData = JSON.parse(offlineDataSaved);
                setOfflineData(offlineData);
                
                // Si hay datos offline, usar esos datos como usuario actual
                if (offlineData.user) {
                    setUser(offlineData.user);
                    console.log('👤 USUARIO CARGADO DESDE MODO OFFLINE:', offlineData.user);
                }
                
                if (offlineData.sucursal) {
                    setSucursalSeleccionada(offlineData.sucursal);
                    console.log('🏢 SUCURSAL CARGADA DESDE MODO OFFLINE:', offlineData.sucursal);
                }
            } catch (error) {
                console.error('Error al cargar datos offline:', error);
                localStorage.removeItem('offlineData');
            }
        }
    }, []);

    // Función para activar modo offline
    const activateOfflineMode = (userData) => {
        setIsOfflineMode(true);
        setOfflineData(userData);
        localStorage.setItem('offlineMode', JSON.stringify(true));
        localStorage.setItem('offlineData', JSON.stringify(userData));
        
        // Bloquear internet
        window.fetch = function() {
            console.log('🚫 FETCH BLOQUEADO - MODO OFFLINE');
            return Promise.reject(new Error('Modo offline activado'));
        };
        
        window.XMLHttpRequest = function() {
            console.log('🚫 XMLHttpRequest BLOQUEADO - MODO OFFLINE');
            throw new Error('Modo offline activado');
        };
        
        window.WebSocket = function() {
            console.log('🚫 WebSocket BLOQUEADO - MODO OFFLINE');
            throw new Error('Modo offline activado');
        };
        
        Object.defineProperty(navigator, 'onLine', {
            get: () => false,
            configurable: true
        });
    };

    // Función para desactivar modo offline
    const deactivateOfflineMode = () => {
        setIsOfflineMode(false);
        setOfflineData(null);
        localStorage.removeItem('offlineMode');
        localStorage.removeItem('offlineData');
        
        // Recargar página para restaurar internet
        window.location.reload();
    };

    // Función para limpiar usuario (logout)
    const clearUser = () => {
        setUser(null);
        setSucursalSeleccionada(null);
        setIsOfflineMode(false);
        setOfflineData(null);
        
        // Limpiar solo los datos específicos del usuario, no todo el localStorage
        const keysToRemove = ['user', 'token', 'sucursalSeleccionada', 'userData', 'offlineMode', 'offlineData'];
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
    };

    // Función para seleccionar sucursal
    const seleccionarSucursal = (sucursal) => {
        setSucursalSeleccionada(sucursal);
        localStorage.setItem('sucursalSeleccionada', JSON.stringify(sucursal));
    };

    // Función para cargar datos completos del usuario
    const loadUserData = async (userId) => {
        try {
            const userData = await UserService.getCurrentUser(userId);
            if (userData.success) {
                setUser(userData.data.user);
                return { success: true, data: userData.data.user };
            } else {
                console.error('No se pudo obtener el usuario:', userData.error);
                return { success: false, error: userData.error };
            }
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
            return { success: false, error: error.message };
        }
    };

    const value = {
        user,
        sucursalSeleccionada,
        loading,
        isOfflineMode,
        offlineData,
        clearUser,
        seleccionarSucursal,
        loadUserData,
        activateOfflineMode,
        deactivateOfflineMode
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};
