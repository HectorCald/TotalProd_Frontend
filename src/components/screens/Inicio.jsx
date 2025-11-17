import React, { useState, useEffect, useRef, useCallback } from 'react';
import { checkCacheStatus } from '../../utils/cacheUtils';
import Coleccion from '../common/Coleccion';
import { FUNCTIONS } from '../../constants/functions';
import AtajoAnuncio from '../common/AtajoAnuncio';
import Notification from '../common/Notification';
import InicioPC from './InicioPC';
import ModalActualizacion from '../ui/ModalActualizacion';
import almacenImage from '../../assets/almacen.png';
import acopioImage from '../../assets/acopio.png';
import movimientosImage from '../../assets/movimientos.png';
import pedidosImage from '../../assets/pedidos.png';
import conteosImage from '../../assets/conteos.png';
import cotizacionesImage from '../../assets/cotizaciones.png';  
import styles from './Screen.module.css';
import PullToRefresh from '../common/PullToRefresh';
import { useUser } from '../../context/UserContext';
import UserService from '../../services/userService';
import { isSoloVentas } from '../../utils/empresaHelper';
import { OFFLINE_NETWORK_FLAG } from '../../utils/offlineNetworkInterceptor';

const Inicio = ({ onViewOpen }) => {
  const { user, setUserFromService } = useUser();
  const soloVentas = isSoloVentas(user);
  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'info',
    text: ''
  });
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [oldVersion, setOldVersion] = useState(null);
  const [newVersion, setNewVersion] = useState(null);
  const checkingRef = useRef(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const mostrarNotificacion = (tipo, texto) => {
    setNotification({
      isVisible: true,
      type: tipo,
      text: texto
    });

    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  const checkAndNotifyCacheVersion = async (force = false, notifyNoChange = false) => {
    if (checkingRef.current && !force) return;
    checkingRef.current = true;
    try {
      const result = await checkCacheStatus();
      if (result.status === 'no_version') {
        // Primera vez: guardar versión automáticamente sin mostrar modal
        if (result.latest) {
          localStorage.setItem('cacheVersion', result.latest);
        }
      } else if (result.status === 'new') {
        // Hay versión antigua y nueva: mostrar modal
        mostrarNotificacion('success', `Nueva versión disponible: v${result.latest}`);
        setTimeout(() => {
          setOldVersion(result.stored);
          setNewVersion(result.latest);
          setShowUpdateModal(true);
        }, 500);
      } else if (result.status === 'same') {
        if (notifyNoChange) mostrarNotificacion('info', `Versión actual v${result.latest}`);
      } else if (result.status === 'error') {
        mostrarNotificacion('error', 'Error al obtener versión');
      }
    } catch (err) {
      mostrarNotificacion('error', 'Error al obtener versión');
    } finally {
      checkingRef.current = false;
    }
  };

  useEffect(() => {
    // Verificación inicial al montar el componente
    checkAndNotifyCacheVersion(false, false);
    
    // Verificación periódica cada 30 segundos (30000ms)
    const interval = setInterval(() => {
      checkAndNotifyCacheVersion(false, false);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

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

  const handleFunctionClick = (func) => {
    if (func.view === 'transferencias') {
      onViewOpen('almacenGeneralAuxiliarII', { tipo: 'transferir' });
    } else {
      onViewOpen(func.view);
    }
  };

  return (
    <>

      {/* Contenido original para móvil */}
      <PullToRefresh
        onRefresh={async () => {
          if (!user || !user.id) return;
          const response = await UserService.getCurrentUser(user.id);
          if (response && response.success && response.data && response.data.user) {
            setUserFromService(response.data.user);
            await checkAndNotifyCacheVersion(true, true);
          }
        }}
        screenName="Inicio"
        containerStyle={{
          height: '100%',
          minHeight: '100%',
        }}
      >
          <p className={styles.subTitle} style={{ marginTop: '0' }}>FUNCIONES</p>
          <div className={styles.funciones}>
            {FUNCTIONS.slice(0, 4).map((func) => (
              <Coleccion
                key={func.name}
                title={func.name}
                icon={func.icon}
                onClick={() => handleFunctionClick(func)}
                disabled={isOfflineMode}
              />
            ))}
          </div>
          <p className={styles.subTitle}>ATAJOS</p>
          <div className={styles.atajoAnuncio}>
            <AtajoAnuncio 
              title="Almacén General" 
              description="Administra tu almacén de productos terminados, realiza entradas y salidas." 
              image={almacenImage} 
              onClick={() => onViewOpen('almacenMedioGeneral')}
            />
            {!soloVentas && (
              <AtajoAnuncio 
                title="Materia Prima" 
                description="Administra tu materia prima, realiza entradas y salidas." 
                image={acopioImage} 
                onClick={() => onViewOpen('almacenMedio')} 
                disabled={isOfflineMode}
              />
            )}
          </div>
          <p className={styles.subTitle}>OTROS</p>
          <div className={styles.atajoAnuncioOtros}>
            <AtajoAnuncio 
              title="Movimientos" 
              description="" 
              image={movimientosImage} 
              onClick={() => onViewOpen('movimientos')}
              disabled={isOfflineMode}
            />
            <AtajoAnuncio 
              title="Pedidos" 
              description="" 
              image={pedidosImage} 
              onClick={() => onViewOpen('pedidos')}
              disabled={isOfflineMode}
            />
          </div>
          <p className={styles.subTitle}>EXTRAS</p>
          <div className={styles.atajoAnuncioOtros}>
            <AtajoAnuncio 
              title="Conteos" 
              description="" 
              image={conteosImage} 
              onClick={() => onViewOpen('conteos')}
              disabled={isOfflineMode}
            />
            <AtajoAnuncio 
              title="Cotizaciones" 
              description="" 
              image={cotizacionesImage} 
              onClick={() => onViewOpen('cotizaciones')}
              disabled={isOfflineMode}
            />
          </div>
        
      </PullToRefresh>

      {/* Contenido para pantallas grandes */}
      <div className={styles.inicioDesktop}>
        <InicioPC onViewOpen={onViewOpen} />
      </div>

      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        text={notification.text}
      />

      {/* Modal de actualización */}
      <ModalActualizacion
        isOpen={showUpdateModal}
        setIsOpen={setShowUpdateModal}
        versionAnterior={oldVersion}
        versionNueva={newVersion}
      />
    </>
  );
};

export default Inicio;