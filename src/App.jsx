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
import SeleccionarSucursal from './components/views/sucursales/SeleccionarSucursal';


function App() {
  const [token, setToken] = useState(null);
  const [tokenType, setTokenType] = useState(null);

  // Función helper para actualizar token y tokenType desde localStorage
  const updateTokenFromStorage = () => {
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
  };

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
    
    // Cargar token inicial
    updateTokenFromStorage();

    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme') || 'dark';

    // Si el tema es 'system', detectar preferencia del sistema
    let themeToApply = savedTheme;
    if (savedTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeToApply = prefersDark ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', themeToApply);

    // Listener para detectar cambios en el token (cuando se cambia de cuenta)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === null) {
        updateTokenFromStorage();
      }
    };

    // Escuchar cambios en localStorage (funciona entre tabs)
    window.addEventListener('storage', handleStorageChange);
    
    // Escuchar eventos personalizados para cambios en el mismo tab
    window.addEventListener('token-changed', updateTokenFromStorage);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('token-changed', updateTokenFromStorage);
    };
  }, []);

  return (
    <UserProvider>
      <EmployeeProvider>
        <ModalStackProvider>
          <LayoutProvider>
            <AppContent token={token} tokenType={tokenType} />
          </LayoutProvider>
        </ModalStackProvider>
      </EmployeeProvider>
    </UserProvider>
  );
}

function AppContent({ token, tokenType }) {
  const { user, sucursalSeleccionada: userSucursal, seleccionarSucursal: seleccionarSucursalUsuario, loadUserData, setUserFromService } = useUser();
  const { employee, sucursalSeleccionada: employeeSucursal, seleccionarSucursal: seleccionarSucursalEmpleado, loadEmployeeData, setEmployeeFromService } = useEmployee();
  const [showSucursalModal, setShowSucursalModal] = useState(false);
  
  // Determinar si hay una sesión activa
  const hasActiveSession = !!token;
  const isUserSession = tokenType === 'user';
  const isEmployeeSession = tokenType === 'employee';

  // Determinar la sucursal seleccionada según el tipo de sesión
  const sucursalSeleccionada = isEmployeeSession ? employeeSucursal : userSucursal;

  const handleSucursalSeleccionada = (sucursal) => {
    if (isEmployeeSession) {
      seleccionarSucursalEmpleado(sucursal);
    } else {
      seleccionarSucursalUsuario(sucursal);
    }
    setShowSucursalModal(false);
  };

  // Obtener empresaId según el tipo de sesión
  const getEmpresaId = () => {
    if (isEmployeeSession) {
      return employee?.empresa_id || employee?.sucursal?.empresas?.id;
    } else {
      return user?.empresa_id;
    }
  };

  const empresaId = getEmpresaId();

  // Debug: Log cuando cambia el contexto
  useEffect(() => {
    console.log('🔄 App.jsx - Estado actualizado:', {
      isUserSession,
      isEmployeeSession,
      hasUser: !!user,
      hasEmployee: !!employee,
      empresaId,
      sucursalSeleccionada: !!sucursalSeleccionada,
      userEmpresaId: user?.empresa_id,
      employeeEmpresaId: employee?.empresa_id
    });
  }, [isUserSession, isEmployeeSession, user, employee, empresaId, sucursalSeleccionada]);

  // Obtener datos del usuario/empleado solo si no están ya en el contexto (login normal, no desde "Administrar cuentas")
  useEffect(() => {
    const fetchUserData = async () => {
      // Solo hacer fetch si es sesión de usuario, hay token, pero NO hay usuario en el contexto
      if (isUserSession && token && !user) {
        try {
          // Decodificar token para obtener ID
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const decoded = JSON.parse(jsonPayload);
          
          if (decoded && decoded.id && decoded.type === 'user') {
            await loadUserData(decoded.id);
          }
        } catch (error) {
          console.error('❌ Error al obtener datos del usuario:', error);
        }
      }
    };

    fetchUserData();
  }, [isUserSession, token, user, loadUserData]);

  // Obtener datos del empleado solo si no están ya en el contexto (login normal, no desde "Administrar cuentas")
  useEffect(() => {
    const fetchEmployeeData = async () => {
      // Solo hacer fetch si es sesión de empleado, hay token, pero NO hay empleado en el contexto
      if (isEmployeeSession && token && !employee) {
        try {
          // Decodificar token para obtener ID del empleado
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const decoded = JSON.parse(jsonPayload);
          
          if (decoded && decoded.id && decoded.type === 'employee') {
            await loadEmployeeData(decoded.id);
          }
        } catch (error) {
          console.error('❌ Error al obtener datos del empleado:', error);
        }
      }
    };

    fetchEmployeeData();
  }, [isEmployeeSession, token, employee, loadEmployeeData]);

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

        {/* Modal de selección de sucursal - Se renderiza siempre que hay usuario/empleado para auto-seleccionar */}
        {((isUserSession && user) || (isEmployeeSession && employee)) && empresaId && (
          <>
            {console.log('🔄 App.jsx - Renderizando SeleccionarSucursal con empresaId:', empresaId, 'sucursalSeleccionada:', !!sucursalSeleccionada)}
            <SeleccionarSucursal
              isOpen={showSucursalModal}
              setIsOpen={setShowSucursalModal}
              empresaId={empresaId}
              onSucursalSeleccionada={handleSucursalSeleccionada}
              canClose={!!sucursalSeleccionada}
            />
          </>
        )}
      </BrowserRouter>
    </div>
  );
}

export default App;