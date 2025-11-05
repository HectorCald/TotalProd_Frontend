import React, { useState, useEffect, useRef } from 'react';
import { checkCacheStatus } from '../../utils/cacheUtils';
import AtajoAnuncio from '../common/AtajoAnuncio';
import SalesCard from '../ui/SalesCard';
import SalesChart from '../ui/SalesChart';
import Version from '../common/Version';
import ModalActualizacion from '../ui/ModalActualizacion';
import Notification from '../common/Notification';
import almacenImage from '../../assets/almacen.png';
import acopioImage from '../../assets/acopio.png';
import movimientosImage from '../../assets/movimientos.png';
import pedidosImage from '../../assets/pedidos.png';
import './InicioPC.css';

const InicioPC = ({ onViewOpen, sucuId = 1 }) => {
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

  return (
    <>
      <div className="inicio-pc-container">
      {/* Atajos de Acceso Rápido */}
      <div className="atajoAnuncioOtros">
        <AtajoAnuncio 
          title="Almacén General" 
          description="Administra tu almacén de productos terminados" 
          image={almacenImage} 
          onClick={() => onViewOpen('almacenMedioGeneral')} 
        />
        <AtajoAnuncio 
          title="Materia Prima" 
          description="Administra tu materia prima" 
          image={acopioImage} 
          onClick={() => onViewOpen('almacenMedio')} 
        />
      </div>
      <div className="atajoAnuncioOtros" style={{ marginTop: '10px' }}>
        <AtajoAnuncio 
          title="Movimientos" 
          description="Gestiona movimientos de inventario" 
          image={movimientosImage} 
          onClick={() => onViewOpen('movimientos')} 
        />
        <AtajoAnuncio 
          title="Pedidos" 
          description="Administra pedidos y órdenes" 
          image={pedidosImage} 
          onClick={() => onViewOpen('pedidos')} 
        />
      </div>

      {/* Cards de Estadísticas lado a lado */}
      <div style={{ marginTop: '5px', display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <SalesCard sucuId={sucuId} />
        </div>
        <div style={{ flex: 1 }}>
          <SalesChart sucuId={sucuId} />
        </div>
      </div>

      {/* Componente de versión */}
      <Version />
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

export default InicioPC;