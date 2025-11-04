import React, { useState, useEffect, useRef } from 'react';
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
import './Inicio.css';
import PullToRefresh from '../common/PullToRefresh';
import { useUser } from '../../context/UserContext';
import UserService from '../../services/userService';

const Inicio = ({ onViewOpen }) => {
  const { user, setUserFromService } = useUser();
  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'info',
    text: ''
  });
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [oldVersion, setOldVersion] = useState(null);
  const [newVersion, setNewVersion] = useState(null);
  const checkingRef = useRef(false);

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
      if (result.status === 'new') {
        mostrarNotificacion('success', `Nueva versión disponible: v${result.latest}`);
        const storedVersion = localStorage.getItem('cacheVersion');
        // Abrir modal automáticamente después de mostrar la notificación
        setTimeout(() => {
          setOldVersion(storedVersion);
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
    
    // Verificación periódica cada 1 minuto (60000ms)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkAndNotifyCacheVersion(false, false);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleFunctionClick = (func) => {
    if (func.view === 'transferencias') {
      mostrarNotificacion('info', 'Transferencias estará disponible próximamente');
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
          <p className="subTitle">Funciones</p>
          <div className="funciones">
            {FUNCTIONS.slice(0, 4).map((func) => (
              <Coleccion
                key={func.name}
                title={func.name}
                icon={func.icon}
                onClick={() => handleFunctionClick(func)}
              />
            ))}
          </div>
          <p className="subTitle">Atajos</p>
          <div className="atajoAnuncio">
            <AtajoAnuncio 
              title="Almacén General" 
              description="Administra tu almacén de productos terminados, realiza entradas y salidas." 
              image={almacenImage} 
              onClick={() => onViewOpen('almacenMedioGeneral')} 
            />
            <AtajoAnuncio 
              title="Materia Prima" 
              description="Administra tu materia prima, realiza entradas y salidas." 
              image={acopioImage} 
              onClick={() => onViewOpen('almacenMedio')} 
            />
          </div>
          <p className="subTitle">Otros</p>
          <div className="atajoAnuncioOtros">
            <AtajoAnuncio 
              title="Movimientos" 
              description="" 
              image={movimientosImage} 
              onClick={() => onViewOpen('movimientos')} 
            />
            <AtajoAnuncio 
              title="Pedidos" 
              description="" 
              image={pedidosImage} 
              onClick={() => onViewOpen('pedidos')} 
            />
          </div>
          <p className="subTitle">Extras</p>
          <div className="atajoAnuncioOtros">
            <AtajoAnuncio 
              title="Conteos" 
              description="" 
              image={conteosImage} 
              onClick={() => onViewOpen('conteos')} 
            />
            <AtajoAnuncio 
              title="Cotizaciones" 
              description="" 
              image={cotizacionesImage} 
              onClick={() => onViewOpen('cotizaciones')} 
            />
          </div>
        
      </PullToRefresh>

      {/* Contenido para pantallas grandes */}
      <div className="inicio-desktop">
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