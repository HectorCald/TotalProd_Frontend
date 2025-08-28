import React, { useEffect, useState } from 'react';
import './styles/App.css';
import Login from './pages/Login';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/Home';
import UserService from './services/userService';
import Loading from './components/common/LoadingSpinner';

function App() {
  const [hasToken, setHasToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setHasToken(!!token);

    const userIdData = localStorage.getItem('userId') || {};
    const fetchUser = async () => {
      try {
        if (userIdData) {
          setLoading(false);
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
        }
      } catch (error) {
        console.error('Error al obtener el usuario:', error);
      }finally{
        setLoading(false);
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
