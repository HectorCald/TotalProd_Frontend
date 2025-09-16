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
                        // Si es un token de empleado, no cargar usuario normal
                        if (decoded.type === 'employee') {
                            console.log('Token de empleado detectado, no cargar usuario normal');
                            setLoading(false);
                            return;
                        }
                        
                        const userData = await UserService.getCurrentUser(decoded.id);
                        if (userData.success) {
                            setUser(userData.data.user);
                        } else {
                            // Si no se pudo obtener el usuario, limpiar todo y redirigir
                            console.error('No se pudo obtener el usuario:', userData.error);
                            clearUserAndRedirect();
                        }
                    } else {
                        // Token inválido, limpiar todo y redirigir
                        console.error('Token inválido');
                        clearUserAndRedirect();
                    }
                } catch (error) {
                    console.error('Error al cargar usuario:', error);
                    clearUserAndRedirect();
                }
            }
            setLoading(false);
        };

        // Función para limpiar usuario y redirigir
        const clearUserAndRedirect = () => {
            setUser(null);
            setSucursalSeleccionada(null);
            localStorage.clear(); // Limpiar todo el localStorage
            // No redirigir aquí, dejar que App.jsx maneje la navegación
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
        localStorage.clear(); // Limpiar todo el localStorage
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
