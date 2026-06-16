import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const loadingEmployeeRef = useRef(false); // Ref para evitar múltiples llamadas simultáneas

  const normalizePermisos = (permisos = {}) => ({
    crear: !!permisos.crear,
    eliminar: !!permisos.eliminar,
    editar: !!permisos.editar,
    anular: !!permisos.anular,
    reemplazar: !!permisos.reemplazar,
    info: !!permisos.info,
    sucursales: !!permisos.sucursales,
    offline: !!(permisos.offline ?? permisos.can_offline)
  });

  // Cargar datos del empleado y sucursal al inicializar
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      // La sucursal inicial será manejada por App.jsx que auto-seleccionará la sucursal basada en el ID guardado

      // Los datos del empleado se cargarán mediante App.jsx (loadEmployeeData)
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

  const seleccionarSucursal = (sucursal) => {
    setSucursalSeleccionada(sucursal);
    if (sucursal?.id) {
        localStorage.setItem('sucursalIdSeleccionada', sucursal.id);
        const empresaId = sucursal.empresas?.id || sucursal.empresa_id;
        if (empresaId) {
            localStorage.setItem('empresa_id', empresaId);
        }
    } else {
        localStorage.removeItem('sucursalIdSeleccionada');
        localStorage.removeItem('empresa_id');
    }
    localStorage.removeItem('sucursalSeleccionada'); // Limpiar datos pesados si existían

    setEmployee(prevEmployee => {
      if (!prevEmployee) return prevEmployee;

      const updatedEmployee = {
        ...prevEmployee,
        sucursal_id: sucursal?.id || null,
        sucursal: sucursal
          ? {
              id: sucursal.id,
              name: sucursal.name,
              empresas: sucursal.empresas ? {
                id: sucursal.empresas.id,
                name: sucursal.empresas.name,
                logo_tipo: sucursal.empresas.logo_tipo || sucursal.empresas.logo
              } : null
            }
          : null
      };

      return updatedEmployee;
    });
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
        msg.includes('no se pudo conectar') ||
        msg.includes('conexión') ||
        msg.includes('connection') ||
        msg.includes('network') ||
        msg.includes('fetch') ||
        msg.includes('internet') ||
        msg.includes('offline') ||
        msg.includes('verifica tu conexión')
      ) {
        return true;
      }
      
      // Si el mensaje es genérico del servidor pero viene de un catch (error de red)
      // y contiene "Error del servidor" o "Error del servidor al verificar", probablemente es conexión
      if (
        (msg.includes('error del servidor') || msg.includes('error del servidor al verificar')) &&
        error && (error.name === 'TypeError' || error.name === 'NetworkError')
      ) {
        return true;
      }
    }
    
    return false;
  };

  // Función para cargar datos completos del empleado (memoizada para evitar bucles)
  const loadEmployeeData = useCallback(async (employeeId) => {
    // Evitar múltiples llamadas simultáneas
    if (loadingEmployeeRef.current) {
      console.log('⚠️ [EmployeeContext] Ya hay una carga de empleado en progreso, ignorando llamada duplicada');
      return { success: false, error: 'Carga ya en progreso' };
    }
    
    loadingEmployeeRef.current = true;
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
        
        const normalizedEmployeeData = {
          ...employeeData.data,
          permisos: normalizePermisos(employeeData.data.permisos)
        };

        setEmployee(normalizedEmployeeData);
        setError(null);
        
        const hasManualOverride = localStorage.getItem('employeeSucursalOverride') === 'true';
        const storedSucursal = localStorage.getItem('sucursalSeleccionada');
        let parsedStoredSucursal = null;
        if (storedSucursal) {
          try {
            parsedStoredSucursal = JSON.parse(storedSucursal);
          } catch (error) {
            parsedStoredSucursal = null;
          }
        }
        
        // Si tiene sucursal_id, usar la sucursal que ya viene en los datos
        if (employeeData.data.sucursal_id && employeeData.data.sucursal && !hasManualOverride) {
          const sucursalActual = employeeData.data.sucursal;
          setSucursalSeleccionada(sucursalActual);
          if (sucursalActual?.id) {
              localStorage.setItem('sucursalIdSeleccionada', sucursalActual.id);
              const empresaId = sucursalActual.empresas?.id || sucursalActual.empresa_id;
              if (empresaId) {
                  localStorage.setItem('empresa_id', empresaId);
              }
          }
          localStorage.removeItem('sucursalSeleccionada');
          
          // Si la sucursal tiene empresa pero no tiene logo_tipo, cargar la imagen
          if (sucursalActual.empresas && sucursalActual.empresas.id && !sucursalActual.empresas.logo_tipo) {
            try {
              const EmpresaImagenService = (await import('../services/empresaImagenService')).default;
              const imageResponse = await EmpresaImagenService.getImage(sucursalActual.empresas.id);
              
              if (imageResponse.success) {
                const imageUrl = imageResponse.data?.imagen_url || 
                               imageResponse.data?.secure_url || 
                               imageResponse.data?.url ||
                               imageResponse.data?.image_url;
                
                if (imageUrl) {
                  // Actualizar la sucursal con la imagen
                  const updatedSucursal = {
                    ...sucursalActual,
                    empresas: {
                      ...sucursalActual.empresas,
                      logo_tipo: imageUrl
                    }
                  };
                  setSucursalSeleccionada(updatedSucursal);
                  if (updatedSucursal?.id) {
                      localStorage.setItem('sucursalIdSeleccionada', updatedSucursal.id);
                      const empresaId = updatedSucursal.empresas?.id || updatedSucursal.empresa_id;
                      if (empresaId) {
                          localStorage.setItem('empresa_id', empresaId);
                      }
                  }
                  localStorage.removeItem('sucursalSeleccionada');
                }
              }
            } catch (error) {
              console.log('❌ EmployeeContext: No se pudo cargar la imagen de la empresa:', error);
            }
          }
        } else if (hasManualOverride && parsedStoredSucursal) {
          setSucursalSeleccionada(parsedStoredSucursal);
          const overrideEmployee = {
            ...normalizedEmployeeData,
            sucursal_id: parsedStoredSucursal.id || null,
            sucursal: parsedStoredSucursal
          };
          setEmployee(overrideEmployee);
          localStorage.removeItem('employeeSucursalOverride');
        }
        
        setLoading(false);
        loadingEmployeeRef.current = false;
        return { success: true, data: normalizedEmployeeData };
      } else {
        const errorMessage = employeeData?.error || employeeData?.message || 'Error desconocido al obtener empleado';
        console.error('No se pudo obtener el empleado:', errorMessage);
        
        // Detectar si es error de conexión - verificar primero antes de otros errores
        // El servicio ya debería devolver "No se pudo conectar..." pero verificamos por si acaso
        const msg = errorMessage.toLowerCase();
        if (
          msg.includes('no se pudo conectar') ||
          msg.includes('verifica tu conexión') ||
          msg.includes('error de conexión') ||
          msg.includes('connection') ||
          msg.includes('network') ||
          msg.includes('fetch') ||
          msg.includes('internet') ||
          msg.includes('offline') ||
          isConnectionError(null, errorMessage)
        ) {
          const connectionError = 'No se pudo conectar al servidor. Verifica tu conexión a internet e intenta nuevamente.';
          setError(connectionError);
          setLoading(false);
          loadingEmployeeRef.current = false;
          return { success: false, error: connectionError };
        }
        
        // Si hay error al obtener el empleado, establecer error
        if (employeeData?.status === 400 || employeeData?.status === 500 || !employeeData?.success) {
          console.log('❌ Error al obtener empleado:', errorMessage);
          setError(errorMessage);
          setLoading(false);
          loadingEmployeeRef.current = false;
          return { success: false, error: errorMessage };
        }
        
        setError(errorMessage);
        setLoading(false);
        loadingEmployeeRef.current = false;
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Error al cargar datos del empleado:', error);
      
      // Detectar si es error de conexión
      if (isConnectionError(error, error.message)) {
        const connectionError = 'No se pudo conectar al servidor. Verifica tu conexión a internet e intenta nuevamente.';
        console.log('❌ Error de conexión al obtener empleado');
        setError(connectionError);
        setLoading(false);
        loadingEmployeeRef.current = false;
        return { success: false, error: connectionError };
      }
      
      // Si hay error de conexión o cualquier otro error, establecer error
      console.log('❌ Error al obtener empleado:', error.message);
      setError(error.message);
      setLoading(false);
      loadingEmployeeRef.current = false;
      return { success: false, error: error.message };
    }
  }, []); // Sin dependencias ya que solo usa funciones del servicio

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

  // Establecer empleado directamente desde una respuesta de servicio (sin re-fetch)
  const setEmployeeFromService = (newEmployee) => {
    if (!newEmployee) return;
    const normalizedEmployee = {
      ...newEmployee,
      permisos: normalizePermisos(newEmployee.permisos)
    };
    setEmployee(normalizedEmployee);
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
    updateSucursalEmpresaImage,
    setEmployeeFromService
  };

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
};