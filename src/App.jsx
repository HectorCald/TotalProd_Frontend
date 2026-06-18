import React, { useEffect, useState } from 'react';
import './styles/global.css';
import Login from './pages/auth/Login';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from './pages/home/Dashboard';

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

import { UserProvider, useUser } from './context/UserContext';
import { EmployeeProvider, useEmployee } from './context/EmployeeContext';
import { ModalStackProvider } from './context/ModalStackContext';
import { LayoutProvider } from './context/LayoutContext';
import { ToastProvider } from './context/ToastContext';
import sucursalesService from './services/sucursalesService';
import NavBar from './components/essentials/NavBar';
import SideBar from './components/essentials/SideBar';
import viewStyles from './pages/home/View.module.css';


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

    const interval = setInterval(updateTokenState, 500);

    return () => {
      window.removeEventListener('storage', updateTokenState);
      window.removeEventListener('local-logout', updateTokenState);
      window.removeEventListener('local-login', updateTokenState);
      clearInterval(interval);
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
  const { user, sucursalSeleccionada: userSucursal, seleccionarSucursal: seleccionarSucursalUsuario, loadUserData, setEmpresa } = useUser();
  const { employee, sucursalSeleccionada: employeeSucursal, seleccionarSucursal: seleccionarSucursalEmpleado, loadEmployeeData, loading: employeeLoading } = useEmployee();
  const [showSucursalModal, setShowSucursalModal] = useState(false);
  const [userDataFetched, setUserDataFetched] = useState(false);
  const [employeeDataFetched, setEmployeeDataFetched] = useState(false);
  const [loadingSucursal, setLoadingSucursal] = useState(false);
  const [sucursalAutoSeleccionada, setSucursalAutoSeleccionada] = useState(false);

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

  // Resetear el estado de fetch cuando se cierra sesión
  useEffect(() => {
    if (!hasActiveSession) {
      setUserDataFetched(false);
      setEmployeeDataFetched(false);
    }
  }, [hasActiveSession]);


  const autoSeleccionarSucursal = async (empresaId, isEmployee, canAdministrarSucursales, sucursalesPrecargadas = null) => {
    if (!empresaId || !canAdministrarSucursales) return false;

    try {
      setLoadingSucursal(true);
      let sucursalesData = [];

      if (sucursalesPrecargadas && sucursalesPrecargadas.length > 0) {
        sucursalesData = sucursalesPrecargadas;
      } else {
        const response = await sucursalesService.getByEmpresaId(empresaId);
        if (response.success && response.data) {
          sucursalesData = response.data;
        }
      }

      if (sucursalesData.length > 0) {
        // Almacenar en session cache para uso instantáneo global sin re-fetch
        sessionStorage.setItem('ListadoSucursales', JSON.stringify(sucursalesData));

        // Obtener nombre de empresa para determinar si es Damabrava
        const empresaData = sucursalesData[0]?.empresas || null;
        if (empresaData && setEmpresa) {
          setEmpresa(empresaData);
        }

        const nombreEmpresa = empresaData?.name || '';
        const esDamabrava = nombreEmpresa === 'Damabrava';

        // Filtrar sucursales según las reglas (igual que en SeleccionarSucursal)
        const sucursalesFiltradas = sucursalesData.filter(sucursal => {
          const esCasaMatrizAsociada = sucursal.name && sucursal.name.startsWith('Casa Matriz (') && sucursal.name.endsWith(')');

          if (esDamabrava) {
            return true;
          }

          return !esCasaMatrizAsociada;
        });

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
        const autoSeleccionada = await autoSeleccionarSucursal(user.empresa_id, false, true, sucursalesPrecargadas);
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
          <SideBar />
          <div className={viewStyles.contentArea}>
            <div style={{ padding: '20px' }}>
              <div style={{ width: '200px', height: '40px', backgroundColor: '#e0e0e0', borderRadius: '8px', marginBottom: '20px', animation: 'pulse 1.5s infinite' }}></div>
              <div style={{ width: '100%', height: '400px', backgroundColor: '#e0e0e0', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
            </div>
          </div>
        </div>
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
              <Navigate to="/dashboard" replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route
          path="/dashboard"
          element={
            !hasActiveSession ? (
              <Navigate to="/login" replace />
            ) : (
              <Dashboard />
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
          path="/almacen/entradas"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <AlmacenGeneral />}
        />
        <Route
          path="/almacen/pedidos"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <AlmacenGeneral />}
        />
        <Route
          path="/almacen/gestionar"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <AlmacenGeneral />}
        />
        <Route
          path="/almacen/conteo"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <AlmacenGeneral />}
        />
        <Route
          path="/almacen/cotizar"
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
        <Route
          path="/materia-prima/pesaje"
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
          path="/conteos/almacen"
          element={!hasActiveSession ? <Navigate to="/login" replace /> : <Conteos />}
        />
        <Route
          path="/conteos/acopio"
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
      </Routes>
    </div>
  );
}

export default App;