import React, { useEffect, useState } from 'react';
import './styles/App.css';
import Login from './pages/Login';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/Home';
import UserService from './services/userService';

function App() {
  const [hasToken, setHasToken] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setHasToken(!!token);

    const userIdData = JSON.parse(localStorage.getItem('userId')) || {};
    const fetchUser = async () => {
      try {
        if (userIdData.id) {
          const result = await UserService.getUserById(userIdData.id);
          if (result.success) {
            // Guardar el objeto completo
            localStorage.setItem('userInfo', JSON.stringify(result.data));

          }
        }
        else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('userInfo');
          navigator.reload();
        }
      } catch (error) {
        console.error('Error al obtener el usuario:', error);
      }
    };

    if (token) {
      fetchUser();
    }
  }, []);

  if (hasToken === null) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="App">
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
