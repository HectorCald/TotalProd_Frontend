import React, { useState, useEffect, useRef } from 'react';
import { checkCacheStatus } from '../../utils/cacheUtils';
import { BoxIcon } from 'boxicons-react';
import Version from '../common/Version';
import ModalActualizacion from '../ui/ModalActualizacion';
import Notification from '../common/Notification';
import './InicioPC.css';

const InicioEmpleadoPC = ({ onViewOpen }) => {
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
    
    // Verificación periódica cada 1 minuto (60000ms)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkAndNotifyCacheVersion(false, false);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="inicio-pc-container">
      {/* Mensaje de restricción para empleados */}
      <div className="noData">
        <BoxIcon
          name="lock"
          className="noDataIcon"
        />
        <p className="noDataTitle">Inicio para empleados</p>
        <p className="noDataDescription">
          Como empleado, no puedes ver los graficos o atajos de módulos en la pantalla de inicio usa el menú lateral para acceder a los módulos.
        </p>
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

export default InicioEmpleadoPC;
