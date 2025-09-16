import React, { useEffect, useState } from 'react';
import './styles/App.css';
import Login from './pages/Login';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/Home';
import HomeEmpleado from './pages/HomeEmpleado';
import Loading from './components/common/LoadingSpinner';
import { UserProvider, useUser } from './context/UserContext';
import { EmployeeProvider, useEmployee } from './context/EmployeeContext';
import SeleccionarSucursal from './components/views/sucursales/SeleccionarSucursal';
import personalService from './services/personalService';

function App() {
  const [hasToken, setHasToken] = useState(null);
  const [hasEmployeeToken, setHasEmployeeToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const employeeToken = localStorage.getItem('employeeToken');
    setHasToken(!!token);
    setHasEmployeeToken(!!employeeToken);

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

  // Si aún está cargando, mostrar loading
  if (hasToken === null && hasEmployeeToken === null) {
    return <div>Cargando...</div>;
  }

  return (
    <UserProvider>
      <EmployeeProvider>
        <AppContent hasToken={hasToken} hasEmployeeToken={hasEmployeeToken} />
      </EmployeeProvider>
    </UserProvider>
  );
}

function AppContent({ hasToken, hasEmployeeToken }) {
  const { user, sucursalSeleccionada: userSucursal, loading, seleccionarSucursal } = useUser();
  const { employee, sucursalSeleccionada: employeeSucursal, loading: employeeLoading, updateEmployee } = useEmployee();
  const [showSucursalModal, setShowSucursalModal] = useState(false);
  const [employeeDataFetched, setEmployeeDataFetched] = useState(false);
  
  // Determinar la sucursal seleccionada según el tipo de sesión
  const sucursalSeleccionada = hasEmployeeToken ? employeeSucursal : userSucursal;

  // Mostrar modal de sucursal si el usuario está cargado pero no hay sucursal seleccionada
  // Solo para usuarios normales, no para empleados
  useEffect(() => {
    if (hasToken && user && !loading && !sucursalSeleccionada && !hasEmployeeToken) {
      setShowSucursalModal(true);
    }
  }, [hasToken, user, loading, sucursalSeleccionada, hasEmployeeToken]);

  const handleSucursalSeleccionada = (sucursal) => {
    seleccionarSucursal(sucursal);
    setShowSucursalModal(false);
  };

  // Determinar si hay una sesión activa (usuario o empleado)
  const hasActiveSession = (hasToken && user) || (hasEmployeeToken && employee);
  const isUserSession = hasToken && user;
  const isEmployeeSession = hasEmployeeToken && employee;

  // Obtener datos completos del empleado desde la base de datos solo una vez al cargar
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (hasEmployeeToken && employee && employee.id) {
        try {
          console.log('🔍 Obteniendo datos completos del empleado desde BD...');
          const result = await personalService.getById(employee.id);
          if (result.success) {
            console.log('✅ Datos del empleado obtenidos:', result.data);
            await updateEmployee(result.data);
          } else {
            console.error('❌ Error al obtener datos del empleado:', result.message);
          }
        } catch (error) {
          console.error('❌ Error al obtener datos del empleado:', error);
        }
      }
    };

    fetchEmployeeData();
  }, [hasEmployeeToken, employee?.id]); // Solo cuando cambie el token o el ID del empleado

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
              (loading || employeeLoading) ? (
                <Loading iconName='cog' />
              ) : !hasActiveSession ? (
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
        {isUserSession && (
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
