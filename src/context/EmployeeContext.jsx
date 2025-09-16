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

  // Función para limpiar empleado (logout)
  const clearEmployee = () => {
    setEmployee(null);
    setSucursalSeleccionada(null);
    localStorage.clear();
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
        return { success: false, error: employeeData.error };
      }
    } catch (error) {
      console.error('Error al cargar datos del empleado:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    employee,
    sucursalSeleccionada,
    loading,
    clearEmployee,
    seleccionarSucursal,
    loadEmployeeData
  };

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
};