import React, { useEffect, useState } from 'react';
import './styles/App.css';
import Login from './pages/Login';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/Home';
import Loading from './components/common/LoadingSpinner';
import { UserProvider, useUser } from './context/UserContext';

function App() {
  const [hasToken, setHasToken] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    setHasToken(!!token);

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

  if (hasToken === null) {
    return <div>Cargando...</div>;
  }

  return (
    <UserProvider>
      <AppContent hasToken={hasToken} />
    </UserProvider>
  );
}

function AppContent({ hasToken }) {
  const { loading } = useUser();

  return (
    <div className="App">
      {loading && <Loading iconName='cog' />}
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={hasToken ? <Navigate to="/" /> : <Login />}
          />
          <Route
            path="/"
            element={hasToken ? <Home /> : <Navigate to="/login" />}
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
