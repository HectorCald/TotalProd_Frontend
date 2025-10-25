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
  const [error, setError] = useState(null);

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

  // Función para limpiar empleado (logout)
  const clearEmployee = () => {
    setEmployee(null);
    setSucursalSeleccionada(null);
    setError(null);
    
    // Limpiar solo los datos específicos del empleado, no todo el localStorage
    const keysToRemove = ['employee', 'token', 'sucursalSeleccionada', 'employeeData', 'empresa_id'];
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
    setLoading(true);
    setError(null);
    
    try {
      const employeeData = await personalService.getById(employeeId);
      
      if (employeeData && employeeData.success) {
        setEmployee(employeeData.data);
        setError(null);
        
        // Si tiene sucursal_id, cargar la sucursal
        if (employeeData.data.sucursal_id) {
          const sucursalData = await sucursalesService.getById(employeeData.data.sucursal_id);
          if (sucursalData.success) {
            setSucursalSeleccionada(sucursalData.data);
            localStorage.setItem('sucursalSeleccionada', JSON.stringify(sucursalData.data));
          }
        }
        
        setLoading(false);
        return { success: true, data: employeeData.data };
      } else {
        const errorMessage = employeeData?.error || employeeData?.message || 'Error desconocido al obtener empleado';
        console.error('No se pudo obtener el empleado:', errorMessage);
        
        // Si hay error al obtener el empleado, establecer error
        if (employeeData?.status === 400 || employeeData?.status === 500 || !employeeData?.success) {
          console.log('❌ Error al obtener empleado:', errorMessage);
          setError(errorMessage);
          setLoading(false);
          return { success: false, error: errorMessage };
        }
        
        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Error al cargar datos del empleado:', error);
      
      // Si hay error de conexión o cualquier otro error, establecer error
      console.log('❌ Error de conexión al obtener empleado:', error.message);
      setError(error.message);
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Función para actualizar la imagen de empresa
  const updateEmpresaImage = (newImage) => {
    setEmployee(prevEmployee => {
      if (!prevEmployee) return prevEmployee;
      return {
        ...prevEmployee,
        logo_tipo: newImage
      };
    });
  };

  const value = {
    employee,
    sucursalSeleccionada,
    loading,
    error,
    clearEmployee,
    seleccionarSucursal,
    loadEmployeeData,
    updateEmpresaImage
  };

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
};