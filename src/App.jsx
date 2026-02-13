import React, { useEffect, useState } from 'react';
import './styles/App.css';
import Login from './pages/Login';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/Home';
import HomeEmpleado from './pages/HomeEmpleado';
import { UserProvider, useUser } from './context/UserContext';
import { EmployeeProvider, useEmployee } from './context/EmployeeContext';
import { ModalStackProvider } from './context/ModalStackContext';
import { LayoutProvider } from './context/LayoutContext';
import { ToastProvider } from './context/ToastContext';
import SeleccionarSucursal from './components/views/sucursales/SeleccionarSucursal';
import LoadingSpinner from './components/common/LoadingSpinner';
import sucursalesService from './services/sucursalesService';
import ModalPermisoUbicacion from './components/views/offline/ModalPermisoUbicacion';


function App() {
  const [token, setToken] = useState(null);
  const [tokenType, setTokenType] = useState(null);

  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('✅ Service Worker registrado:', registration);
        })
        .catch(error => {
          console.error('❌ Error registrando Service Worker:', error);
        });
    }
    
    // Limpiar datos residuales de pedidos al iniciar la aplicación
        localStorage.removeItem('pedidoIdEditando');
        localStorage.removeItem('pedidoIdEntregando');
        localStorage.removeItem('precioIdEditando');
        localStorage.removeItem('precioIdEntregando');
    
    const storedToken = localStorage.getItem('token');
    
    if (storedToken) {
      try {
        // Decodificar token para obtener el tipo
        const base64Url = storedToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decoded = JSON.parse(jsonPayload);
        
        setToken(storedToken);
        setTokenType(decoded.type);
      } catch (error) {
        console.error('Error al decodificar token:', error);
        setToken(null);
        setTokenType(null);
      }
    } else {
      setToken(null);
      setTokenType(null);
    }

    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme') || 'dark';

    // Si el tema es 'system', detectar preferencia del sistema
    let themeToApply = savedTheme;
    if (savedTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeToApply = prefersDark ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', themeToApply);
  }, []);

  return (
    <UserProvider>
      <EmployeeProvider>
        <ModalStackProvider>
          <LayoutProvider>
            <ToastProvider>
              <AppContent token={token} tokenType={tokenType} />
            </ToastProvider>
          </LayoutProvider>
        </ModalStackProvider>
      </EmployeeProvider>
    </UserProvider>
  );
}

function AppContent({ token, tokenType }) {
  const { user, sucursalSeleccionada: userSucursal, seleccionarSucursal: seleccionarSucursalUsuario, loadUserData } = useUser();
  const { employee, sucursalSeleccionada: employeeSucursal, seleccionarSucursal: seleccionarSucursalEmpleado, loadEmployeeData, loading: employeeLoading } = useEmployee();
  const [showSucursalModal, setShowSucursalModal] = useState(false);
  const [userDataFetched, setUserDataFetched] = useState(false);
  const [employeeDataFetched, setEmployeeDataFetched] = useState(false);
  const [loadingSucursal, setLoadingSucursal] = useState(false);
  const [sucursalAutoSeleccionada, setSucursalAutoSeleccionada] = useState(false);
  const [showPermisoUbicacion, setShowPermisoUbicacion] = useState(false);
  const [permisoVerificado, setPermisoVerificado] = useState(false);
  
  // Determinar si hay una sesión activa
  const hasActiveSession = !!token;
  const isUserSession = tokenType === 'user';
  const isEmployeeSession = tokenType === 'employee';

  // Determinar la sucursal seleccionada según el tipo de sesión
  const sucursalSeleccionada = isEmployeeSession ? employeeSucursal : userSucursal;

  // Resetear estado de auto-selección cuando cambia el usuario/empleado
  useEffect(() => {
    setSucursalAutoSeleccionada(false);
  }, [user?.id, employee?.id]);

  // Verificar permiso de geolocalización - Solo después de cargar usuario/empleado
  useEffect(() => {
    // Solo verificar si hay una sesión activa Y el usuario/empleado ya fue cargado
    if (!hasActiveSession) {
      return;
    }

    // Esperar a que el usuario o empleado esté cargado completamente
    // Para usuarios: verificar que userDataFetched sea true
    // Para empleados: verificar que no esté cargando Y que employee exista
    if (isUserSession && (!user || !userDataFetched)) {
      return;
    }
    if (isEmployeeSession && (employeeLoading || !employee || !employeeDataFetched)) {
      return;
    }

    // No mostrar modal de permiso si hay una actualización pendiente
    // Verificar si hay un modal de actualización visible en el DOM
    // El modal de actualización tiene prioridad y debe estar por encima
    const checkUpdateModalOpen = () => {
      try {
        // Verificar si hay un modal de actualización abierto en el DOM
        // Los modales de actualización se renderizan en los componentes de Inicio
        // Verificamos si hay un elemento con el modal de actualización visible
        const updateModals = document.querySelectorAll('[class*="modalWrapper"]');
        // Si hay múltiples modales, el de actualización debería tener mayor z-index
        // Por ahora, simplemente retornamos false ya que el z-index se maneja en el CSS
        return false;
      } catch {
        return false;
      }
    };

    // Si hay actualización pendiente, no mostrar el modal de permiso
    if (checkUpdateModalOpen()) {
      return;
    }

    let permissionStatus = null;
    let intervalId = null;

    // Función para verificar permiso directamente (fallback)
    const verificarPermisoDirecto = () => {
      if (!navigator.geolocation) {
        // Geolocalización no disponible
        setShowPermisoUbicacion(true);
        setPermisoVerificado(false);
        return;
      }

      // Intentar obtener ubicación para verificar el permiso
      navigator.geolocation.getCurrentPosition(
        () => {
          // Permiso concedido
          setShowPermisoUbicacion(false);
          setPermisoVerificado(true);
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        },
        (error) => {
          // Error al obtener ubicación
          if (error.code === error.PERMISSION_DENIED) {
            setShowPermisoUbicacion(true);
            setPermisoVerificado(false);
          } else {
            // Otro tipo de error, no mostrar modal (podría ser timeout, etc.)
            setPermisoVerificado(true);
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 3000,
          maximumAge: 0
        }
      );
    };

    const verificarPermisoUbicacion = async () => {
      try {
        // Verificar si el navegador soporta la API de Permissions
        if ('permissions' in navigator) {
          try {
            permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
            
            const verificarEstado = () => {
              if (permissionStatus.state === 'denied' || permissionStatus.state === 'prompt') {
                setShowPermisoUbicacion(true);
                setPermisoVerificado(false);
              } else if (permissionStatus.state === 'granted') {
                setShowPermisoUbicacion(false);
                setPermisoVerificado(true);
                if (intervalId) {
                  clearInterval(intervalId);
                  intervalId = null;
                }
              }
            };

            // Verificar estado inicial
            verificarEstado();

            // Escuchar cambios en el permiso
            permissionStatus.onchange = () => {
              verificarEstado();
            };
          } catch (error) {
            // Si la API de permissions no está disponible o falla, intentar obtener ubicación directamente
            console.warn('No se pudo verificar permiso con Permissions API:', error);
            verificarPermisoDirecto();
          }
        } else {
          // Si no hay soporte para Permissions API, intentar obtener ubicación directamente
          verificarPermisoDirecto();
        }
      } catch (error) {
        console.error('Error al verificar permiso de ubicación:', error);
        // En caso de error, intentar verificación directa
        verificarPermisoDirecto();
      }
    };

    verificarPermisoUbicacion();

    // Verificar periódicamente si el permiso cambió (solo si el modal está abierto)
    intervalId = setInterval(() => {
      if (permissionStatus) {
        // Si tenemos permissionStatus, verificar su estado
        if (permissionStatus.state === 'granted') {
          setShowPermisoUbicacion(false);
          setPermisoVerificado(true);
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } else {
        // Si no tenemos permissionStatus, intentar verificación directa
        verificarPermisoDirecto();
      }
    }, 2000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [hasActiveSession, isUserSession, isEmployeeSession, user, employee, userDataFetched, employeeDataFetched, employeeLoading]);

  // Función para auto-seleccionar la primera sucursal disponible
  const autoSeleccionarSucursal = async (empresaId, isEmployee, canAdministrarSucursales) => {
    if (!empresaId || !canAdministrarSucursales) return false;
    
    try {
      setLoadingSucursal(true);
      const response = await sucursalesService.getByEmpresaId(empresaId);
      
      if (response.success && response.data && response.data.length > 0) {
        // Obtener nombre de empresa para determinar si es Damabrava
        const nombreEmpresa = response.data[0]?.empresas?.name || '';
        const esDamabrava = nombreEmpresa === 'Damabrava';
        
        // Filtrar sucursales según las reglas (igual que en SeleccionarSucursal)
        const sucursalesFiltradas = response.data.filter(sucursal => {
          const esCasaMatrizAsociada = sucursal.name && sucursal.name.startsWith('Casa Matriz (') && sucursal.name.endsWith(')');
          
          if (esDamabrava) {
            return true;
          }
          
          return !esCasaMatrizAsociada;
        });

        // Auto-seleccionar la primera sucursal disponible
        if (sucursalesFiltradas.length > 0) {
          const sucursal = sucursalesFiltradas[0];
          if (isEmployee) {
            seleccionarSucursalEmpleado(sucursal);
          } else {
            seleccionarSucursalUsuario(sucursal);
          }
          setSucursalAutoSeleccionada(true);
          setLoadingSucursal(false);
          return true;
        }
      }
      setLoadingSucursal(false);
      return false;
    } catch (error) {
      console.error('Error al auto-seleccionar sucursal:', error);
      setLoadingSucursal(false);
      return false;
    }
  };

  // Auto-seleccionar sucursal después de cargar usuario/empleado
  useEffect(() => {
    const autoSeleccionar = async () => {
      if (isUserSession && user && !sucursalSeleccionada && !sucursalAutoSeleccionada && user.empresa_id) {
        const autoSeleccionada = await autoSeleccionarSucursal(user.empresa_id, false, true);
        if (!autoSeleccionada) {
          // Si no se pudo auto-seleccionar, mostrar modal solo en este caso
          setShowSucursalModal(true);
        }
      } else if (isEmployeeSession && employee && !sucursalSeleccionada && !sucursalAutoSeleccionada) {
        const canAdministrarSucursales = employee?.permisos?.sucursales === true;
        const empresaId = employee?.empresa_id || employee?.sucursal?.empresas?.id;
        if (canAdministrarSucursales && empresaId) {
          const autoSeleccionada = await autoSeleccionarSucursal(empresaId, true, canAdministrarSucursales);
          if (!autoSeleccionada) {
            // Si no se pudo auto-seleccionar, mostrar modal solo en este caso
            setShowSucursalModal(true);
          }
        }
      }
    };

    autoSeleccionar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserSession, isEmployeeSession, user, employee, sucursalSeleccionada, sucursalAutoSeleccionada]);

  const handleSucursalSeleccionada = (sucursal) => {
    if (isEmployeeSession) {
      seleccionarSucursalEmpleado(sucursal);
    } else {
      seleccionarSucursalUsuario(sucursal);
    }
    setSucursalAutoSeleccionada(true);
    setShowSucursalModal(false);
  };

  // Obtener datos completos del usuario desde la base de datos solo una vez al cargar
  useEffect(() => {
    const fetchUserData = async () => {
      if (isUserSession && !userDataFetched) {
        try {
          if (token) {
            // Decodificar token para obtener ID
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const decoded = JSON.parse(jsonPayload);
            
            if (decoded && decoded.id && decoded.type === 'user') {
              await loadUserData(decoded.id);
              setUserDataFetched(true);
            }
          }
        } catch (error) {
          console.error('❌ Error al obtener datos del usuario:', error);
        }
      }
    };

    fetchUserData();
  }, [isUserSession, userDataFetched, loadUserData, token]);

  // Obtener datos completos del empleado desde la base de datos solo una vez al cargar
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (isEmployeeSession && !employeeDataFetched) {
        try {
          if (token) {
            // Decodificar token para obtener ID del empleado
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const decoded = JSON.parse(jsonPayload);
            
            if (decoded && decoded.id && decoded.type === 'employee') {
              await loadEmployeeData(decoded.id);
              setEmployeeDataFetched(true);
            }
          }
        } catch (error) {
          console.error('❌ Error al obtener datos del empleado:', error);
        }
      }
    };

    fetchEmployeeData();
  }, [isEmployeeSession, employeeDataFetched, loadEmployeeData, token]);

  // Mostrar loading mientras se carga la sucursal
  if (loadingSucursal) {
    return <LoadingSpinner fullScreen={true} text="Cargando sucursal..." icon="building" />;
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              hasActiveSession ? (
                <Navigate to="/" replace />
              ) : (
                <Login />
              )
            }
          />
          <Route
            path="/"
            element={
              !hasActiveSession ? (
                <Navigate to="/login" replace />
              ) : isEmployeeSession ? (
                <HomeEmpleado />
              ) : (
                <Home />
              )
            }
          />
        </Routes>

        {/* Modal de selección de sucursal - Solo mostrar si no se pudo auto-seleccionar */}
        {showSucursalModal && ((isUserSession && user) || (isEmployeeSession && employee?.permisos?.sucursales)) && (
          <SeleccionarSucursal
            isOpen={showSucursalModal}
            setIsOpen={setShowSucursalModal}
            empresaId={isEmployeeSession ? (employee?.empresa_id || employee?.sucursal?.empresas?.id) : user.empresa_id}
            onSucursalSeleccionada={handleSucursalSeleccionada}
            canClose={!!sucursalSeleccionada}
          />
        )}

        {/* Modal de permiso de ubicación - Obligatorio, no se puede cerrar */}
        {hasActiveSession && showPermisoUbicacion && (
          <ModalPermisoUbicacion
            isOpen={showPermisoUbicacion}
            setIsOpen={(value) => {
              // Solo permitir cerrar si el valor es false (permiso concedido)
              if (value === false) {
                setShowPermisoUbicacion(false);
                setPermisoVerificado(true);
              }
            }}
          />
        )}
      </BrowserRouter>
    </div>
  );
}

export default App;