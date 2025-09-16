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
    const [loading, setLoading] = useState(true);

    // Cargar usuario al inicializar
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Decodificar token para obtener ID
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    const decoded = JSON.parse(jsonPayload);
                    
                    if (decoded && decoded.id) {
                        const userData = await UserService.getCurrentUser(decoded.id);
                        if (userData.success) {
                            setUser(userData.data.user);
                        }
                    }
                } catch (error) {
                    console.error('Error al cargar usuario:', error);
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []);

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

    // Función para actualizar usuario
    const updateUser = async () => {
        if (user?.id) {
            try {
                const userData = await UserService.getCurrentUser(user.id);
                if (userData.success) {
                    setUser(userData.data.user);
                }
            } catch (error) {
                console.error('Error al actualizar usuario:', error);
            }
        }
    };

    // Función para limpiar usuario (logout)
    const clearUser = () => {
        setUser(null);
        setSucursalSeleccionada(null);
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('sucursalSeleccionada');
    };

    // Función para seleccionar sucursal
    const seleccionarSucursal = (sucursal) => {
        setSucursalSeleccionada(sucursal);
        localStorage.setItem('sucursalSeleccionada', JSON.stringify(sucursal));
    };

    const value = {
        user,
        sucursalSeleccionada,
        loading,
        updateUser,
        clearUser,
        seleccionarSucursal
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};
