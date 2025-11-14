import React, { useState, useEffect, useCallback } from 'react';
import styles from '../styles/Home.module.css';
import Nav from '../components/ui/Nav';
import BarraNavegacion from '../components/ui/BarraNavegacion';
import BarraLateral from '../components/ui/BarraLateral';
import { useLayout } from '../context/LayoutContext';
import { useUser } from '../context/UserContext';
import Inicio from '../components/screens/Inicio';
import InicioPC from '../components/screens/InicioPC';
import Explorar from '../components/screens/Explorar';
import ModalOffline from '../components/views/offline/ModalOffline';
import HistorialMovimientosOffline from '../components/views/movimientos/HistorialMovimientosOffline';
import { obtenerLocal, OFFLINE_DB_NAME, MOVIMIENTOS_SALIDA_STORE } from '../utils/indexedDB';
import { OFFLINE_NETWORK_FLAG } from '../utils/offlineNetworkInterceptor';
import LoadingSpinner from '../components/common/LoadingSpinner';
import NoData from '../components/common/NoData';
import { clearDataFetchLogsIfNeeded } from '../components/utils/DataSizeLogger';

// Componentes de vistas modales para uso en Inicio.jsx y vistas
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

const OFFLINE_USER_KEY = 'offline_user_data';

const Home = () => {
  const { isLargeScreen } = useLayout();
  const { user, error, loading, clearUser, setUserFromService } = useUser();
  const [activeView, setActiveView] = useState(null);
  const [activeRoute, setActiveRoute] = useState('/dashboard/default');
  const [isOffline, setIsOffline] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showPasoTipo, setShowPasoTipo] = useState(false);
  const [offlineHydrated, setOfflineHydrated] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineMovimientos, setOfflineMovimientos] = useState([]);
  const [isOfflineMovimientosOpen, setIsOfflineMovimientosOpen] = useState(false);
  const [forceOfflineModal, setForceOfflineModal] = useState(false);

  const isOfflineModeEnabled = useCallback(() => {
    try {
      return localStorage.getItem(OFFLINE_NETWORK_FLAG) === 'true';
    } catch {
      return false;
    }
  }, []);

  // Limpiar logs de dataFetchLogs diariamente
  useEffect(() => {
    clearDataFetchLogsIfNeeded();
  }, []);

  const loadOfflineUser = () => {
    if (user) return false;
    try {
      const cachedUser = localStorage.getItem(OFFLINE_USER_KEY);
      if (!cachedUser) return false;
      const parsedUser = JSON.parse(cachedUser);
      if (parsedUser) {
        setUserFromService(parsedUser);
        setOfflineHydrated(true);
        return true;
      }
    } catch (error) {
      console.error('Error cargando usuario offline:', error);
    }
    return false;
  };

  // Detectar cambios en la conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowOfflineModal(false);
      setOfflineHydrated(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      const offlineModeActive = isOfflineModeEnabled();
      setShowOfflineModal(!offlineModeActive);
      loadOfflineUser();
    };

    // Verificar estado inicial
    if (!navigator.onLine) {
      setIsOffline(true);
      const offlineModeActive = isOfflineModeEnabled();
      setShowOfflineModal(!offlineModeActive);
      loadOfflineUser();
    }

    // Agregar listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOfflineModeEnabled]);

  useEffect(() => {
    if (!error) return;
    if (offlineHydrated) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      loadOfflineUser();
    }
  }, [error]);

  const handleRetryConnection = () => {
    // Verificar conexión nuevamente
    if (navigator.onLine) {
      setIsOffline(false);
      setShowOfflineModal(false);
    } else {
      // Mantener modal abierto si sigue sin conexión
      const offlineModeActive = isOfflineModeEnabled();
      setShowOfflineModal(!offlineModeActive);
    }
  };

  const updateOfflineFlag = useCallback(() => {
    try {
      setIsOfflineMode(localStorage.getItem(OFFLINE_NETWORK_FLAG) === 'true');
    } catch {
      setIsOfflineMode(false);
    }
  }, []);

  useEffect(() => {
    updateOfflineFlag();
    const handler = () => updateOfflineFlag();
    window.addEventListener('offline-mode-changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('offline-mode-changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, [updateOfflineFlag]);

  const refreshOfflineMovimientos = useCallback(async () => {
    const hasInternet = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
    if (isOfflineMode || !hasInternet) {
      setOfflineMovimientos([]);
      setIsOfflineMovimientosOpen(false);
      setForceOfflineModal(false);
      return;
    }
    try {
      const movimientos = await obtenerLocal(MOVIMIENTOS_SALIDA_STORE, OFFLINE_DB_NAME);
      if (Array.isArray(movimientos) && movimientos.length > 0) {
        setOfflineMovimientos(movimientos);
        setIsOfflineMovimientosOpen(true);
        setForceOfflineModal(true);
      } else {
        setOfflineMovimientos([]);
        setIsOfflineMovimientosOpen(false);
        setForceOfflineModal(false);
      }
    } catch (error) {
      console.warn('No se pudieron cargar movimientos offline:', error);
      setOfflineMovimientos([]);
      setIsOfflineMovimientosOpen(false);
      setForceOfflineModal(false);
    }
  }, [isOfflineMode]);

  useEffect(() => {
    refreshOfflineMovimientos();
  }, [refreshOfflineMovimientos]);

  useEffect(() => {
    const handleOnline = () => {
      refreshOfflineMovimientos();
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [refreshOfflineMovimientos]);

  const handleOfflineMovementsUpdate = useCallback((updated) => {
    if (!Array.isArray(updated)) return;
    setOfflineMovimientos(updated);
    if (updated.length === 0) {
      setIsOfflineMovimientosOpen(false);
      setForceOfflineModal(false);
    } else {
      setIsOfflineMovimientosOpen(true);
    }
  }, []);

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

  const handlePasoTipoComplete = () => {
    setShowPasoTipo(false);
  };

  // Función para reintentar carga de usuario
  const handleRetry = () => {
    // Recargar la página completamente
    window.location.reload();
  };

  // Función para volver al login
  const handleGoToLogin = () => {
    // Limpiar context inmediatamente (igual que en Usuario.jsx)
    clearUser();
    
    // Redireccionar inmediatamente sin delay
    window.location.href = '/login';
  };

  // Mostrar loading mientras está cargando
  if (loading) {
    return <LoadingSpinner fullScreen={true} text="Cargando usuario..." icon="user" />;
  }

  // Si hay error, mostrar NoData con error
  if (error && !offlineHydrated) {
    // Determinar el tipo de error y el mensaje apropiado
    let errorTitle = "Error";
    let errorDetail = error;
    let errorIcon = "error-circle";
    
    // Verificar primero si es error de conexión (debe ser la primera verificación)
    const isConnectionError = error.includes('No se pudo conectar') || 
                              error.includes('conexión') || 
                              error.includes('connection') ||
                              error.includes('network') || 
                              error.includes('fetch') ||
                              error.includes('internet') ||
                              error.includes('offline') ||
                              error.includes('Failed to fetch') ||
                              error.includes('NetworkError');
    
    if (isConnectionError) {
      errorTitle = "Error";
      errorDetail = error.includes('No se pudo conectar') 
          ? error 
          : "No se pudo conectar al servidor. Verifica tu conexión a internet e intenta nuevamente.";
      errorIcon = "wifi-off";
    }
    
    return (
      <div className={styles.homePage}>
        <Nav />
        <NoData 
          icon={errorIcon}
          title={errorTitle}
          detail={errorDetail}
          isError={true}
          minHeight="60vh"
          showRetryButton={true}
          showLoginButton={true}
          onRetry={handleRetry}
          onLogin={handleGoToLogin}
        />
      </div>
    );
  }

  // Si no hay usuario después de cargar (sin error), mostrar loading
  if (!user) {
    return <LoadingSpinner fullScreen={true} text="Cargando usuario..." icon="user" />;
  }

  // Mostrar componente de selección de tipo si es necesario
  if (showPasoTipo) {
    return <PasoTipo onComplete={handlePasoTipoComplete} />;
  }

  return (
    <div className={styles.homePage}>
      <Nav />
      
      {/* Layout para pantallas grandes */}
      {isLargeScreen ? (
        <div className={styles.mainLayout}>
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
          <div className={styles.mainContent}>
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
            hasUserData={!!user}
            user={user}
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
      <HistorialMovimientosOffline
        isOpen={isOfflineMovimientosOpen}
        setIsOpen={setIsOfflineMovimientosOpen}
        movimientos={offlineMovimientos}
        titulo="Movimientos Offline"
        descripcion="Todos los movimientos pendientes por sincronizar."
        onClose={refreshOfflineMovimientos}
        disableClose={forceOfflineModal}
        onMovementsUpdate={handleOfflineMovementsUpdate}
        showOnlineWarning={true}
      />
    </div>
  );
};

export default Home;