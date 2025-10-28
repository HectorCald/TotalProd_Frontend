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
        // Validar si el empleado está activo
        if (!employeeData.data.is_active) {
          const errorMessage = 'Su cuenta está inactiva. Contacte al administrador para reactivar su acceso.';
          setError(errorMessage);
          setLoading(false);
          return { success: false, error: errorMessage };
        }
        
        setEmployee(employeeData.data);
        setError(null);
        
        // Si tiene sucursal_id, cargar la sucursal
        if (employeeData.data.sucursal_id) {
          const sucursalData = await sucursalesService.getById(employeeData.data.sucursal_id);
          if (sucursalData.success) {
            setSucursalSeleccionada(sucursalData.data);
            localStorage.setItem('sucursalSeleccionada', JSON.stringify(sucursalData.data));
            
            // Si la sucursal tiene empresa pero no tiene logo_tipo, cargar la imagen
            if (sucursalData.data.empresas && sucursalData.data.empresas.id && !sucursalData.data.empresas.logo_tipo) {
              try {
                console.log('🔄 EmployeeContext: Cargando imagen de empresa para empleado');
                const EmpresaImagenService = (await import('../services/empresaImagenService')).default;
                const imageResponse = await EmpresaImagenService.getImage(sucursalData.data.empresas.id);
                
                if (imageResponse.success) {
                  const imageUrl = imageResponse.data?.imagen_url || 
                                 imageResponse.data?.secure_url || 
                                 imageResponse.data?.url ||
                                 imageResponse.data?.image_url;
                  
                  if (imageUrl) {
                    console.log('✅ EmployeeContext: Imagen cargada y guardada en contexto');
                    // Actualizar la sucursal con la imagen
                    const updatedSucursal = {
                      ...sucursalData.data,
                      empresas: {
                        ...sucursalData.data.empresas,
                        logo_tipo: imageUrl
                      }
                    };
                    setSucursalSeleccionada(updatedSucursal);
                    localStorage.setItem('sucursalSeleccionada', JSON.stringify(updatedSucursal));
                  }
                }
              } catch (error) {
                console.log('❌ EmployeeContext: No se pudo cargar la imagen de la empresa:', error);
              }
            }
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

  // Función para actualizar la imagen de empresa en la sucursal
  const updateSucursalEmpresaImage = (newImage) => {
    setSucursalSeleccionada(prevSucursal => {
      if (!prevSucursal) return prevSucursal;
      return {
        ...prevSucursal,
        empresas: {
          ...prevSucursal.empresas,
          logo_tipo: newImage
        }
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
    updateEmpresaImage,
    updateSucursalEmpresaImage
  };

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
};