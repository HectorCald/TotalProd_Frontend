import React, { useState, useEffect } from 'react';
import '../styles/Home.css';
import Nav from '../components/ui/Nav';
import BarraNavegacion from '../components/ui/BarraNavegacion';
import BarraLateral from '../components/ui/BarraLateral';
import { useLayout } from '../context/LayoutContext';
import { useUser } from '../context/UserContext';
import Inicio from '../components/screens/Inicio';
import InicioPC from '../components/screens/InicioPC';
import Explorar from '../components/screens/Explorar';
import ModalOffline from '../components/views/offline/ModalOffline';
import LoadingSpinner from '../components/common/LoadingSpinner';

import AlmacenMedio from '../components/views/almacen-acopio/AlmacenMedio';
import AlmacenMedioGeneral from '../components/views/almacen-general/AlmacenMedioGeneral';
import ConteosMedio from '../components/views/conteos/ConteosMedio';
import MovimientosMedio from '../components/views/movimientos/MovimientosMedio';
import PedidosMedio from '../components/views/pedidos/PedidosMedio';
import PanelCotizaciones from '../components/views/cotizaciones/PanelCotizaciones';
import Personal from '../components/views/personal/Personal';
import Clientes from '../components/views/clientes/Clientes';
import Proveedores from '../components/views/proveedores/Proveedores';
import MiProduccion from '../components/views/damabrava/produccion/MiProduccion';
import PasoTipo from '../components/views/pasos/PasoTipo';

const Home = () => {
  const { isLargeScreen } = useLayout();
  const { user } = useUser();
  const [activeView, setActiveView] = useState(null);
  const [activeRoute, setActiveRoute] = useState('/dashboard/default');
  const [isOffline, setIsOffline] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showPasoTipo, setShowPasoTipo] = useState(false);

  // Detectar cambios en la conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowOfflineModal(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowOfflineModal(true);
    };

    // Verificar estado inicial
    if (!navigator.onLine) {
      setIsOffline(true);
      setShowOfflineModal(true);
    }

    // Agregar listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetryConnection = () => {
    // Verificar conexión nuevamente
    if (navigator.onLine) {
      setIsOffline(false);
      setShowOfflineModal(false);
    } else {
      // Mantener modal abierto si sigue sin conexión
      setShowOfflineModal(true);
    }
  };

  const handleViewOpen = (viewName) => {
    console.log('handleViewOpen llamado con:', viewName);
    setActiveView(viewName);
    // Limpiar la ruta activa cuando se abre una vista desde InicioPC
    setActiveRoute(null);
  };

  const handleViewClose = () => {
    setActiveView(null);
  };

  const handleScreenChange = (screenId) => {
    console.log('Cambiando pantalla a:', screenId);
    // Mapear screenId a route
    const routeMap = {
      'inicio': '/dashboard/default',
      'explorar': '/dashboard/explorar',
      'configuracion': '/dashboard/configuracion'
    };
    const route = routeMap[screenId] || '/dashboard/default';
    setActiveRoute(route);
  };

  const handleMenuClick = (menuItem) => {
    if (menuItem.route) {
      setActiveRoute(menuItem.route);
      console.log('Navegando a:', menuItem.route);
      // Aquí puedes agregar la lógica de navegación real
    }
  };

  const handleViewOpenFromMenu = (viewName, props = {}) => {
    console.log('Abriendo vista:', viewName, 'con props:', props);
    setActiveView(viewName);
  };

  const handleNavigateFromMenu = (route) => {
    console.log('Navegando a:', route);
    setActiveRoute(route);
    // Aquí puedes agregar la lógica de navegación real
  };

  // Función para renderizar las pantallas (igual que en BarraNavegacion)
  const renderScreen = () => {
    const currentScreen = activeRoute === '/dashboard/default' ? 'inicio' : 
                         activeRoute === '/dashboard/explorar' ? 'explorar' : 'inicio';
    switch (currentScreen) {
      case 'inicio':
        return isLargeScreen ? <InicioPC onViewOpen={handleViewOpen} /> : <Inicio onViewOpen={handleViewOpen} />;
      case 'explorar':
        return <Explorar />;
      default:
        return isLargeScreen ? <InicioPC onViewOpen={handleViewOpen} /> : <Inicio onViewOpen={handleViewOpen} />;
    }
  };



  // Verificar si necesita mostrar el paso de selección de tipo
  useEffect(() => {
    if (user && user.empresa && user.empresa.tipo === null) {
      setShowPasoTipo(true);
    } else {
      setShowPasoTipo(false);
    }
  }, [user]);

  // Si no hay usuario pero hay token, significa que el usuario fue eliminado
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user && token) {
      // Esperar un poco para evitar que se ejecute durante la carga inicial
      const timer = setTimeout(() => {
        if (!user) {
          // Borrar token y redirigir al login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('sucursalSeleccionada');
          localStorage.removeItem('userData');
          window.location.href = '/login';
        }
      }, 2000); // Esperar 2 segundos para dar tiempo a que cargue el usuario

      return () => clearTimeout(timer);
    }
  }, [user]);

  const handlePasoTipoComplete = () => {
    setShowPasoTipo(false);
  };

  // Mostrar loading hasta obtener la información del usuario
  if (!user) {
    return <LoadingSpinner fullScreen={true} text="Cargando usuario..." icon="user" />;
  }

  // Mostrar componente de selección de tipo si es necesario
  if (showPasoTipo) {
    return <PasoTipo onComplete={handlePasoTipoComplete} />;
  }

  return (
    <div className="home-page">
      <Nav />
      
      {/* Layout para pantallas grandes */}
      {isLargeScreen ? (
        <div className="main-layout">
          <BarraLateral 
            onMenuClick={handleMenuClick}
            activeRoute={activeRoute}
            onViewOpen={handleViewOpenFromMenu}
            onNavigate={handleNavigateFromMenu}
            onScreenChange={handleScreenChange}
            activeScreen={activeRoute === '/dashboard/default' ? 'inicio' : 
                         activeRoute === '/dashboard/explorar' ? 'explorar' : 'inicio'}
            onViewClose={handleViewClose}
          />
          <div className="main-content">
            {renderScreen()}
          </div>
          
          {/* Vistas modales para pantallas grandes */}
          <AlmacenMedio
            isOpen={activeView === 'almacenMedio'}
            setIsOpen={() => handleViewClose()}
          />
          <AlmacenMedioGeneral
            isOpen={activeView === 'almacenMedioGeneral'}
            setIsOpen={() => handleViewClose()}
          />
          <MovimientosMedio
            isOpen={activeView === 'movimientos'}
            setIsOpen={() => handleViewClose()}
          />
          <PedidosMedio
            isOpen={activeView === 'pedidos'}
            setIsOpen={() => handleViewClose()}
          />
          <ConteosMedio
            isOpen={activeView === 'conteos'}
            setIsOpen={() => handleViewClose()}
          />
          <PanelCotizaciones
            isOpen={activeView === 'cotizaciones'}
            setIsOpen={() => handleViewClose()}
          />
          <Personal
            isOpen={activeView === 'personal'}
            setIsOpen={() => handleViewClose()}
          />
          <Clientes
            isOpen={activeView === 'clientes'}
            setIsOpen={() => handleViewClose()}
          />
          <Proveedores
            isOpen={activeView === 'proveedores'}
            setIsOpen={() => handleViewClose()}
          />
          <MiProduccion
            isOpen={activeView === 'miProduccion'}
            setIsOpen={() => handleViewClose()}
          />
        </div>
      ) : (
        <>
          {/* BarraNavegacion para pantallas pequeñas */}
          <BarraNavegacion 
            activeScreen={activeRoute === '/dashboard/default' ? 'inicio' : 
                         activeRoute === '/dashboard/explorar' ? 'explorar' : 
                         activeRoute === '/dashboard/configuracion' ? 'configuracion' : 'inicio'} 
            onScreenChange={handleScreenChange}
            onViewOpen={handleViewOpen}
            isEmployee={false}
          />

          {/* Vistas modales - Solo para pantallas pequeñas */}
          <Personal
            isOpen={activeView === 'personal'}
            setIsOpen={() => handleViewClose()}
          />
          <Clientes
            isOpen={activeView === 'clientes'}
            setIsOpen={() => handleViewClose()}
          />
          <Proveedores
            isOpen={activeView === 'proveedores'}
            setIsOpen={() => handleViewClose()}
          />
          <AlmacenMedio
            isOpen={activeView === 'almacenMedio'}
            setIsOpen={() => handleViewClose()}
          />
          <AlmacenMedioGeneral
            isOpen={activeView === 'almacenMedioGeneral'}
            setIsOpen={() => handleViewClose()}
          />
          <MovimientosMedio
            isOpen={activeView === 'movimientos'}
            setIsOpen={() => handleViewClose()}
          />
          <PedidosMedio
            isOpen={activeView === 'pedidos'}
            setIsOpen={() => handleViewClose()}
          />
          <ConteosMedio
            isOpen={activeView === 'conteos'}
            setIsOpen={() => handleViewClose()}
          />
          <PanelCotizaciones
            isOpen={activeView === 'cotizaciones'}
            setIsOpen={() => handleViewClose()}
          />
          <MiProduccion
            isOpen={activeView === 'miProduccion'}
            setIsOpen={() => handleViewClose()}
          />
        </>
      )}

      {/* Modal de conexión offline */}
      <ModalOffline
        isOpen={showOfflineModal}
        setIsOpen={setShowOfflineModal}
        onRetry={handleRetryConnection}
      />
    </div>
  );
};

export default Home;