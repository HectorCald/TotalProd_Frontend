import React, { createContext, useContext, useState, useEffect } from 'react';
import personalService from '../services/personalService';
import sucursalesService from '../services/sucursalesService';

const EmployeeContext = createContext();

export const useEmployee = () => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployee debe ser usado dentro de EmployeeProvider');
  }
  return context;
};

export const EmployeeProvider = ({ children }) => {
  const [employee, setEmployee] = useState(null);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineData, setOfflineData] = useState(null);

  // Cargar datos del empleado y sucursal al inicializar
  useEffect(() => {
    const cargarDatosIniciales = async () => {
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
          
          // Si hay datos offline, usar esos datos como empleado actual
          if (offlineData.user) {
            setEmployee(offlineData.user);
            console.log('👤 EMPLEADO CARGADO DESDE MODO OFFLINE:', offlineData.user);
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

      // Cargar datos del empleado si existen
      const employeeData = localStorage.getItem('employeeData');
      if (employeeData) {
        try {
          const parsedEmployeeData = JSON.parse(employeeData);
          setEmployee(parsedEmployeeData);
          
          // Si el empleado tiene sucursal_id, cargar la sucursal
          if (parsedEmployeeData.personal && parsedEmployeeData.personal.sucursal_id) {
            const sucursalData = await sucursalesService.getById(parsedEmployeeData.personal.sucursal_id);
            if (sucursalData.success) {
              setSucursalSeleccionada(sucursalData.data);
              localStorage.setItem('sucursalSeleccionada', JSON.stringify(sucursalData.data));
            }
          }
        } catch (error) {
          console.error('Error al cargar datos del empleado:', error);
          localStorage.removeItem('employeeData');
        }
      }
    };

    cargarDatosIniciales();
  }, []);

  // Función para activar modo offline
  const activateOfflineMode = (employeeData) => {
    setIsOfflineMode(true);
    setOfflineData(employeeData);
    localStorage.setItem('offlineMode', JSON.stringify(true));
    localStorage.setItem('offlineData', JSON.stringify(employeeData));
    
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

  // Función para limpiar empleado (logout)
  const clearEmployee = () => {
    setEmployee(null);
    setSucursalSeleccionada(null);
    setIsOfflineMode(false);
    setOfflineData(null);
    
    // Limpiar solo los datos específicos del empleado, no todo el localStorage
    const keysToRemove = ['employee', 'token', 'sucursalSeleccionada', 'employeeData', 'empresa_id', 'offlineMode', 'offlineData'];
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  };

  // Función para seleccionar sucursal
  const seleccionarSucursal = (sucursal) => {
    setSucursalSeleccionada(sucursal);
    localStorage.setItem('sucursalSeleccionada', JSON.stringify(sucursal));
  };


  // Función para cargar datos completos del empleado
  const loadEmployeeData = async (employeeId) => {
    try {
      const employeeData = await personalService.getById(employeeId);
      if (employeeData.success) {
        setEmployee(employeeData.data);
        
        // Si tiene sucursal_id, cargar la sucursal
        if (employeeData.data.sucursal_id) {
          const sucursalData = await sucursalesService.getById(employeeData.data.sucursal_id);
          if (sucursalData.success) {
            setSucursalSeleccionada(sucursalData.data);
            localStorage.setItem('sucursalSeleccionada', JSON.stringify(sucursalData.data));
          }
        }
        
        return { success: true, data: employeeData.data };
      } else {
        console.error('No se pudo obtener el empleado:', employeeData.error);
        
        // Si hay error al obtener el empleado, limpiar localStorage y redirigir
        if (employeeData.status === 400 || employeeData.status === 500 || !employeeData.success) {
          console.log('❌ Error al obtener empleado, limpiando sesión y redirigiendo...');
          clearEmployee();
          window.location.href = '/login';
          return { success: false, error: employeeData.error };
        }
        
        return { success: false, error: employeeData.error };
      }
    } catch (error) {
      console.error('Error al cargar datos del empleado:', error);
      
      // Si hay error de conexión o cualquier otro error, limpiar y redirigir
      console.log('❌ Error de conexión al obtener empleado, limpiando sesión y redirigiendo...');
      clearEmployee();
      window.location.href = '/login';
      return { success: false, error: error.message };
    }
  };

  const value = {
    employee,
    sucursalSeleccionada,
    loading,
    isOfflineMode,
    offlineData,
    clearEmployee,
    seleccionarSucursal,
    loadEmployeeData,
    activateOfflineMode,
    deactivateOfflineMode
  };

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
};