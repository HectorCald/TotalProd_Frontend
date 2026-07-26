import React, { useEffect, useState } from 'react';
import './styles/global.css';
import Login from './pages/auth/Login';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/home/Home';

// Section INVENTARIO - Almacen
import AlmacenGeneral from './pages/inventario/almacen/AlmacenGeneral';

// Section INVENTARIO - Materia Prima
import MateriaPrima from './pages/inventario/materia-prima/MateriaPrima';

// Section REGISTROS Y PEDIDOS - Movimientos
import Movimientos from './pages/registros-pedidos/movimientos/Movimientos';

// Section REGISTROS Y PEDIDOS - Pedidos
import PedidosPage from './pages/registros-pedidos/pedidos/Pedidos';

// Section REGISTROS Y PEDIDOS - Conteos
import Conteos from './pages/registros-pedidos/conteos/Conteos';

// Section REGISTROS Y PEDIDOS - Cotizaciones
import Cotizaciones from './pages/registros-pedidos/cotizaciones/Cotizaciones';

// Section GESTIÓN
import Clientes from './pages/gestion/clientes/Clientes';
import Proveedores from './pages/gestion/proveedores/Proveedores';
import Personal from './pages/gestion/personal/Personal';

// Section FINANZAS
import Pagos from './pages/finanzas/pagos/Pagos';
import Deudas from './pages/finanzas/deudas/Deudas';
import Balance from './pages/finanzas/balance/Balance';

// Section CONFIGURACIÓN
import Precios from './pages/configuracion/precios/Precios';
import Cargos from './pages/configuracion/cargos/Cargos';
import Categorias from './pages/configuracion/categorias/Categorias';
import Sucursales from './pages/configuracion/sucursales/Sucursales';
import Socios from './pages/configuracion/socios/Socios';
import Exportar from './pages/configuracion/exportar/Exportar';

// Section DAMABRAVA
import Verificacion from './pages/custom-pages/damabrava/Verificacion';
import MiProduccion from './pages/custom-pages/damabrava/MiProduccion';
import Reglas from './pages/custom-pages/damabrava/Reglas';
import PagosDamabrava from './pages/custom-pages/damabrava/Pagos';

import { UserProvider, useUser } from './context/UserContext';
import { EmployeeProvider, useEmployee } from './context/EmployeeContext';
import { ModalStackProvider } from './context/ModalStackContext';
import { LayoutProvider, useLayout } from './context/LayoutContext';
import { ToastProvider } from './context/ToastContext';
import sucursalesService from './services/sucursalesService';
import NavBar from './components/essentials/NavBar';
import SideBar from './components/essentials/SideBar';
import viewStyles from './pages/home/View.module.css';
import UpdateModal from './components/update/UpdateModal';
import { UPDATE_INFO } from './components/update/constants/updateInfo';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [tokenType, setTokenType] = useState(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const base64Url = storedToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decoded = JSON.parse(jsonPayload);
        return decoded.type;
      } catch (error) {
        console.error('Error al decodificar token:', error);
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('✅ Service Worker registrado:', registration);
          
          if (registration.waiting) {
            window.dispatchEvent(new Event('sw-updated'));
          }

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  window.dispatchEvent(new Event('sw-updated'));
                }
              });
            }
          });
        })
        .catch(error => {
          console.error('❌ Error registrando Service Worker:', error);
        });
    }

    // Limpiar la caché de sesión cada vez que se recarga la página
    sessionStorage.clear();

    // Establecer tema claro fijo (modo oscuro deshabilitado)
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  // Escuchar cambios en el token de localStorage para redirigir/actualizar sesión
  useEffect(() => {
    const updateTokenState = () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken !== token) {
        setToken(storedToken);
        if (storedToken) {
          try {
            const base64Url = storedToken.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const decoded = JSON.parse(jsonPayload);
            setTokenType(decoded.type);
          } catch (error) {
            console.error('Error al decodificar token:', error);
            setTokenType(null);
          }
        } else {
          setTokenType(null);
        }
      }
    };

    window.addEventListener('storage', updateTokenState);
    window.addEventListener('local-logout', updateTokenState);
    window.addEventListener('local-login', updateTokenState);

    return () => {
      window.removeEventListener('storage', updateTokenState);
      window.removeEventListener('local-logout', updateTokenState);
      window.removeEventListener('local-login', updateTokenState);
    };
  }, [token]);

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

function AppContent({ token, tokenType }) {
  const { isLargeScreen } = useLayout();
  const { user, sucursalSeleccionada: userSucursal, seleccionarSucursal: seleccionarSucursalUsuario, loadUserData, setEmpresa } = useUser();
  const { employee, sucursalSeleccionada: employeeSucursal, seleccionarSucursal: seleccionarSucursalEmpleado, loadEmployeeData, loading: employeeLoading } = useEmployee();
  const [showSucursalModal, setShowSucursalModal] = useState(false);
  const [userDataFetched, setUserDataFetched] = useState(false);
  const [employeeDataFetched, setEmployeeDataFetched] = useState(false);
  const [loadingSucursal, setLoadingSucursal] = useState(false);
  const [sucursalAutoSeleccionada, setSucursalAutoSeleccionada] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Determinar si hay una sesión activa
  const hasActiveSession = !!token;
  const isUserSession = tokenType === 'user';
  const isEmployeeSession = tokenType === 'employee';

  // Determinar la sucursal seleccionada según el tipo de sesión
  const sucursalSeleccionada = isEmployeeSession ? employeeSucursal : userSucursal;

  const [currentSwVersion, setCurrentSwVersion] = useState(UPDATE_INFO.version);

  // Detectar nueva versión consultando los nombres de caché
  useEffect(() => {
    if (hasActiveSession) {
      const checkCacheVersion = async () => {
        try {
          const cacheNames = await caches.keys();
          const appCaches = cacheNames.filter(name => name.startsWith('totalprod-cache-v'));
          if (appCaches.length > 0) {
            const savedVersion = localStorage.getItem('sw_version');
            let latestVersion = savedVersion;
            let foundNew = false;
            let needsHardReset = false;

            const extractV = (str) => {
              const m = str?.match(/v(\d+\.\d+\.\d+)/);
              return m ? m[1] : null;
            };

            const isOlder = (vStr, ref) => {
              const v = extractV(vStr);
              if (!v) return false;
              const p1 = v.split('.').map(Number);
              const p2 = ref.split('.').map(Number);
              for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
                if ((p1[i] || 0) < (p2[i] || 0)) return true;
                if ((p1[i] || 0) > (p2[i] || 0)) return false;
              }
              return false;
            };

            const MIN_REQUIRED_VERSION = '3.1.3';

            if (savedVersion && isOlder(savedVersion, MIN_REQUIRED_VERSION)) {
               needsHardReset = true;
            }

            for (const cache of appCaches) {
              if (isOlder(cache, MIN_REQUIRED_VERSION)) {
                 needsHardReset = true;
              }
              const versionMatch = cache.match(/totalprod-cache-(v.*)/);
              if (versionMatch && versionMatch[1]) {
                const swVersion = versionMatch[1];
                if (savedVersion && savedVersion !== swVersion) {
                  latestVersion = swVersion;
                  foundNew = true;
                } else if (!savedVersion) {
                  latestVersion = swVersion;
                }
              }
            }

            if (needsHardReset) {
               localStorage.clear();
               sessionStorage.clear();
               
               await Promise.all(cacheNames.map(name => caches.delete(name)));
               
               if ('serviceWorker' in navigator) {
                 const registrations = await navigator.serviceWorker.getRegistrations();
                 for (let registration of registrations) {
                   await registration.unregister();
                 }
               }
               
               window.location.href = '/login';
               return;
            }

            if (foundNew) {
              setCurrentSwVersion(latestVersion);
              setShowUpdateModal(true);
            } else if (!savedVersion && latestVersion) {
              setCurrentSwVersion(latestVersion);
              setShowUpdateModal(true);
              if (window.location.pathname.startsWith('/home')) {
                localStorage.setItem('sw_version', latestVersion);
              }
            }

            if (latestVersion) {
              window.__current_sw_version = latestVersion;
            }
          }
        } catch (error) {
          console.error("Error comprobando la versión de caché:", error);
        }
      };

      // Revisar al montar
      checkCacheVersion();
      
      // Revisar 1 segundo después por si el SW tardó en actualizarse
      const timeoutId = setTimeout(() => {
        checkCacheVersion();
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(reg => reg.update());
        }
      }, 1000);
      
      // Y también revisar periódicamente (ej. cada 30 segundos en background)
      const intervalId = setInterval(() => {
        checkCacheVersion();
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(reg => reg.update());
        }
      }, 30000);
      
      // Y si el SW reporta una actualización inmediatamente
      window.addEventListener('sw-updated', checkCacheVersion);
      
      return () => {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
        window.removeEventListener('sw-updated', checkCacheVersion);
      };
    }
  }, [hasActiveSession]);

  const handleCloseUpdateModal = () => {
    if (window.__current_sw_version) {
      localStorage.setItem('sw_version', window.__current_sw_version);
    } else {
      localStorage.setItem('sw_version', 'totalprod-cache-v3.0.6'); // fallback
    }
    setShowUpdateModal(false);
  };

  // Resetear estado de auto-selección cuando cambia el usuario/empleado
  useEffect(() => {
    setSucursalAutoSeleccionada(false);
  }, [user?.id, employee?.id]);

  // Resetear el estado de fetch cuando se cierra sesión
  useEffect(() => {
    if (!hasActiveSession) {
      setUserDataFetched(false);
      setEmployeeDataFetched(false);
    }
  }, [hasActiveSession]);


  const autoSeleccionarSucursal = async (empresaId, isEmployee, canAdministrarSucursales, sucursalesPrecargadas = null, empresaObj = null) => {
    if (!empresaId || !canAdministrarSucursales) return false;

    try {
      setLoadingSucursal(true);
      let sucursalesData = [];

      if (sucursalesPrecargadas && sucursalesPrecargadas.length > 0) {
        sucursalesData = sucursalesPrecargadas;
      } else {
        const isDamabrava = empresaId === '259a05d2-2417-47b0-8bbd-50cd5723aae1';
        const response = await sucursalesService.getByEmpresaId(empresaId, isDamabrava);
        if (response.success && response.data) {
          sucursalesData = response.data;
        }
      }

      if (sucursalesData.length > 0) {
        // Obtener datos de empresa
        const empresaData = empresaObj || sucursalesData[0]?.empresas || null;
        if (empresaData && setEmpresa) {
          setEmpresa(empresaData);
        }

        const codigoEmpresa = empresaData?.codigo || '';
        const esDamabrava = empresaId === '259a05d2-2417-47b0-8bbd-50cd5723aae1' || codigoEmpresa === 'damabrava';

        // Filtrar sucursales según si es Damabrava o no
        const sucursalesFiltradas = sucursalesData.filter(sucursal => {
          const esCasaMatrizAsociada = sucursal.name && sucursal.name.startsWith('Casa Matriz (') && sucursal.name.endsWith(')');
          if (esDamabrava) return true;
          return !esCasaMatrizAsociada;
        });

        // Almacenar en session cache para uso instantáneo global sin re-fetch
        sessionStorage.setItem('ListadoSucursales', JSON.stringify(sucursalesFiltradas));

        // Auto-seleccionar la sucursal previamente guardada o la primera disponible
        if (sucursalesFiltradas.length > 0) {
          const savedSucursalId = localStorage.getItem('sucursalIdSeleccionada');
          let sucursalASeleccionar = sucursalesFiltradas[0]; // Por defecto la primera

          if (savedSucursalId) {
            const found = sucursalesFiltradas.find(s => s.id === savedSucursalId);
            if (found) {
              sucursalASeleccionar = found;
            }
          }

          if (isEmployee) {
            seleccionarSucursalEmpleado(sucursalASeleccionar);
          } else {
            seleccionarSucursalUsuario(sucursalASeleccionar);
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
        const sucursalesPrecargadas = user.empresa?.sucursales || null;
        const autoSeleccionada = await autoSeleccionarSucursal(user.empresa_id, false, true, sucursalesPrecargadas, user.empresa);
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
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
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
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
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

  // Determinar si falta cargar contexto esencial (usuario o sucursal)
  const isContextLoading = hasActiveSession && (!user && !employee || !sucursalSeleccionada && !showSucursalModal);

  // Mostrar loading mientras se carga la sucursal o el contexto de usuario
  if (isContextLoading) {
    return (
      <div className="App">
        <NavBar />
        <div className={viewStyles.dashboardContainer}>
          {isLargeScreen && <SideBar />}
          <div className={viewStyles.contentArea}>
            <div style={{ padding: '20px' }}>
              <div style={{ width: '200px', height: '40px', backgroundColor: '#e0e0e0', borderRadius: '8px', marginBottom: '20px', animation: 'pulse 1.5s infinite' }}></div>
              <div style={{ width: '100%', height: '400px', backgroundColor: '#e0e0e0', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
            </div>
          </div>
        </div>
        {!isLargeScreen && (
            <div style={{ 
              position: 'fixed', bottom: '15px', left: '50%', transform: 'translateX(-50%)',
              width: '90%', maxWidth: '450px', height: '60px', backgroundColor: '#e0e0e0',
              borderRadius: '10px', animation: 'pulse 1.5s infinite', zIndex: 1000
            }}></div>
        )}
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        <Route
          path="/login"
          element={
            hasActiveSession ? (
              <Navigate to="/home" replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/"
          element={<Navigate to="/home" replace />}
        />
        <Route
          path="/home"
          element={
            !hasActiveSession ? (
              <Navigate to="/login" replace />
            ) : (
              <Home />
            )
          }
        />
        {/* Section INVENTARIO - Almacen */}
        <Route
          path="/almacen"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <AlmacenGeneral />}
        />
        <Route
          path="/almacen/salidas"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <AlmacenGeneral />}
        />
        <Route
          path="/almacen/salidas/cotizacion"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <AlmacenGeneral />}
        />
        <Route
          path="/almacen/salidas/copia"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <AlmacenGeneral />}
        />
        <Route
          path="/almacen/salidas/pedido"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <AlmacenGeneral />}
        />
        <Route
          path="/almacen/entradas"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <AlmacenGeneral />}
        />
        <Route
          path="/almacen/pedidos"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <AlmacenGeneral />}
        />

        <Route
          path="/almacen/pedidos/editar"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <AlmacenGeneral />}
        />
        <Route
          path="/almacen/gestionar"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <AlmacenGeneral />}
        />
        <Route
          path="/almacen/cotizar"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <AlmacenGeneral />}
        />
        <Route
          path="/almacen/cotizar/copia"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <AlmacenGeneral />}
        />

        {/* Section INVENTARIO - Materia Prima */}
        <Route
          path="/materia-prima"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <MateriaPrima />}
        />
        <Route
          path="/materia-prima/entradas"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <MateriaPrima />}
        />
        <Route
          path="/materia-prima/salidas"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <MateriaPrima />}
        />
        <Route
          path="/materia-prima/pedidos"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <MateriaPrima />}
        />

        <Route
          path="/materia-prima/gestionar"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <MateriaPrima />}
        />

        {/* Section REGISTROS Y PEDIDOS - Movimientos */}
        <Route
          path="/movimientos/almacen"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Movimientos />}
        />
        <Route
          path="/movimientos/acopio"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Movimientos />}
        />


        {/* Section REGISTROS Y PEDIDOS - Pedidos */}
        <Route
          path="/pedidos/almacen"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <PedidosPage />}
        />
        <Route
          path="/pedidos/acopio"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <PedidosPage />}
        />

        {/* Section REGISTROS Y PEDIDOS - Conteos */}
        <Route
          path="/conteos"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Conteos />}
        />

        {/* Section REGISTROS Y PEDIDOS - Cotizaciones */}
        <Route
          path="/cotizaciones"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Cotizaciones />}
        />

        {/* Section GESTIÓN */}
        <Route
          path="/clientes"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Clientes />}
        />
        <Route
          path="/proveedores"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Proveedores />}
        />
        <Route
          path="/personal"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Personal />}
        />

        {/* Section FINANZAS */}
        <Route
          path="/pagos"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Pagos />}
        />
        <Route
          path="/deudas"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Deudas />}
        />
        <Route
          path="/balance"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Balance />}
        />

        {/* Section CONFIGURACIÓN */}
        <Route
          path="/precios"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Precios />}
        />
        <Route
          path="/cargos"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Cargos />}
        />
        <Route
          path="/categorias"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Categorias />}
        />
        <Route
          path="/sucursales"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Sucursales />}
        />
        <Route
          path="/socios"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Socios />}
        />
        <Route
          path="/exportar"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Exportar />}
        />

        {/* Section DAMABRAVA */}
        <Route
          path="/damabrava/verificacion"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Verificacion />}
        />
        <Route
          path="/damabrava/mi_produccion"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <MiProduccion />}
        />
        <Route
          path="/damabrava/reglas"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Reglas />}
        />
        <Route
          path="/damabrava/pagos"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <PagosDamabrava />}
        />
      </Routes>
      <UpdateModal isOpen={showUpdateModal} onClose={handleCloseUpdateModal} version={currentSwVersion} />
    </div>
  );
}

export default App;