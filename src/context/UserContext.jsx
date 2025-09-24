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
        clearUser,
        seleccionarSucursal,
        loadUserData
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};
