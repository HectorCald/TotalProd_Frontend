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
  const [loading, setLoading] = useState(true);

  // Cargar empleado desde localStorage al iniciar
  useEffect(() => {
    loadEmployee();
  }, []);

  // Para empleados, NO cargar sucursal desde localStorage
  // La sucursal se obtiene directamente de los datos del empleado

  const loadSucursalForEmployee = async (sucursalId) => {
    try {
      const response = await sucursalesService.getById(sucursalId);
      if (response.success) {
        setSucursalSeleccionada(response.data);
        // NO guardar en localStorage para empleados
        // La sucursal debe obtenerse siempre de los datos del empleado
      }
    } catch (error) {
      console.error('Error al cargar sucursal del empleado:', error);
    }
  };

  const loadEmployee = async () => {
    try {
      const employeeToken = localStorage.getItem('employeeToken');
      const token = localStorage.getItem('token');
      
      // Si no hay token de empleado, no cargar
      if (!employeeToken) {
        setLoading(false);
        return;
      }
      
      // Usar el token de empleado para decodificar
      const tokenToUse = employeeToken;

      // Verificar si el token es válido decodificándolo
      const payload = JSON.parse(atob(tokenToUse.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        // Token expirado
        clearEmployee();
        return;
      }

      // Si el token es válido, usar los datos del payload
      if (payload.type === 'employee') {
        setEmployee({
          id: payload.id,
          codigo: payload.codigo,
          first_name: payload.first_name,
          last_name: payload.last_name,
          empresa_id: payload.empresa_id,
          sucursal_id: payload.sucursal_id,
          is_active: payload.is_active,
          modules: payload.modules || [],
          type: 'employee'
        });
        
        // Si tiene sucursal_id, obtener la sucursal completa y guardarla
        if (payload.sucursal_id) {
          loadSucursalForEmployee(payload.sucursal_id);
        }
      }
    } catch (error) {
      console.error('Error al cargar empleado:', error);
      clearEmployee();
    } finally {
      setLoading(false);
    }
  };

  const clearEmployee = () => {
    setEmployee(null);
    setSucursalSeleccionada(null);
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('token'); // Limpiar también el token normal
    // NO limpiar sucursalSeleccionada del localStorage para empleados
    // Solo limpiar si es un empleado
  };

  const loginEmployee = async (employeeData, token) => {
    try {
      // Guardar token de empleado como 'token' para compatibilidad con servicios
      localStorage.setItem('employeeToken', token);
      localStorage.setItem('token', token); // Guardar también como 'token' para servicios
      
      // Establecer empleado
      setEmployee(employeeData);
      
      // Si tiene sucursal_id, cargar la sucursal inmediatamente
      if (employeeData.sucursal_id) {
        console.log('🔍 Cargando sucursal para empleado:', employeeData.sucursal_id);
        await loadSucursalForEmployee(employeeData.sucursal_id);
        console.log('✅ Sucursal cargada para empleado');
      } else {
        console.log('⚠️ Empleado sin sucursal asignada');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error al iniciar sesión de empleado:', error);
      return { success: false, error: error.message };
    }
  };

  const updateEmployee = async (employeeData) => {
    setEmployee(employeeData);
    
    // Si tiene sucursal_id, buscar y cargar la sucursal automáticamente
    if (employeeData.sucursal_id) {
      console.log('🔍 Cargando sucursal del empleado:', employeeData.sucursal_id);
      await loadSucursalForEmployee(employeeData.sucursal_id);
    }
  };

  const refreshEmployeeData = async () => {
    if (employee && employee.id) {
      try {
        const result = await personalService.getById(employee.id);
        if (result.success) {
          await updateEmployee(result.data);
          return { success: true, data: result.data };
        } else {
          return { success: false, message: result.message };
        }
      } catch (error) {
        console.error('Error al refrescar datos del empleado:', error);
        return { success: false, message: error.message };
      }
    }
    return { success: false, message: 'No hay empleado activo' };
  };

  const logoutEmployee = () => {
    clearEmployee();
    window.location.href = '/login';
  };

  const value = {
    employee,
    sucursalSeleccionada,
    loading,
    loginEmployee,
    logoutEmployee,
    clearEmployee,
    updateEmployee,
    refreshEmployeeData
  };

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
};

export default EmployeeContext;
