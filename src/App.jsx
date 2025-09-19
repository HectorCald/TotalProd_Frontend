import React, { useEffect, useState } from 'react';
import './styles/App.css';
import Login from './pages/Login';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/Home';
import HomeEmpleado from './pages/HomeEmpleado';
import Loading from './components/common/LoadingSpinner';
import { UserProvider, useUser } from './context/UserContext';
import { EmployeeProvider, useEmployee } from './context/EmployeeContext';
import { ModalStackProvider } from './context/ModalStackContext';
import SeleccionarSucursal from './components/views/sucursales/SeleccionarSucursal';


function App() {
  const [token, setToken] = useState(null);
  const [tokenType, setTokenType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    setLoading(false);
  }, []);

  return (
    <UserProvider>
      <EmployeeProvider>
        <ModalStackProvider>
          <AppContent token={token} tokenType={tokenType} />
        </ModalStackProvider>
      </EmployeeProvider>
    </UserProvider>
  );
}

function AppContent({ token, tokenType }) {
  const { user, sucursalSeleccionada: userSucursal, loading, seleccionarSucursal, loadUserData } = useUser();
  const { employee, sucursalSeleccionada: employeeSucursal, loading: employeeLoading, loadEmployeeData } = useEmployee();
  const [showSucursalModal, setShowSucursalModal] = useState(false);
  const [userDataFetched, setUserDataFetched] = useState(false);
  const [employeeDataFetched, setEmployeeDataFetched] = useState(false);
  
  // Determinar si hay una sesión activa
  const hasActiveSession = !!token;
  const isUserSession = tokenType === 'user';
  const isEmployeeSession = tokenType === 'employee';

  // Determinar la sucursal seleccionada según el tipo de sesión
  const sucursalSeleccionada = isEmployeeSession ? employeeSucursal : userSucursal;

  // Mostrar modal de sucursal si el usuario está cargado pero no hay sucursal seleccionada
  // Solo para usuarios normales, no para empleados
  useEffect(() => {
    if (isUserSession && user && !sucursalSeleccionada) {
      setShowSucursalModal(true);
    }
  }, [isUserSession, user, sucursalSeleccionada]);

  const handleSucursalSeleccionada = (sucursal) => {
    seleccionarSucursal(sucursal);
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

        {/* Modal de selección de sucursal - solo para usuarios normales */}
        {isUserSession && user && (
          <SeleccionarSucursal
            isOpen={showSucursalModal}
            setIsOpen={setShowSucursalModal}
            empresaId={user.empresa_id}
            onSucursalSeleccionada={handleSucursalSeleccionada}
            canClose={!!sucursalSeleccionada}
          />
        )}
      </BrowserRouter>
    </div>
  );
}

export default App;