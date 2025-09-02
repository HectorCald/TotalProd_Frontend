import React, { useEffect, useState } from 'react';
import './styles/App.css';
import Login from './pages/Login';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/Home';
import Loading from './components/common/LoadingSpinner';

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

    // Si hay token, obtener información del usuario
    if (token) {
      // Decodificar token para obtener ID
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decoded = JSON.parse(jsonPayload);
        
        if (decoded && decoded.id) {
                     // Obtener información del usuario
           fetch(`https://total-prod-backend.vercel.app/api/users/${decoded.id}`)
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                localStorage.setItem('userInfo', JSON.stringify(data.data.user));
              }
            })
            .catch(error => console.error('Error al obtener usuario:', error))
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error al decodificar token:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  if (hasToken === null) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="App">
      {loading && <Loading />}
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
