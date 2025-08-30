import React, { useEffect, useState } from 'react';
import './styles/App.css';
import Login from './pages/Login';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/Home';
import Loading from './components/common/LoadingSpinner';

function App() {
  const [hasToken, setHasToken] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setHasToken(!!token);

    if (token) {
      setHasToken(true);
    }
  }, []);

  if (hasToken === null) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="App">
      {hasToken === null && <Loading />}
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
