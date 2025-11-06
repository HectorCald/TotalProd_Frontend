import React, { useState, useEffect, useRef, useMemo } from 'react';
import { checkCacheStatus } from '../../utils/cacheUtils';
import { getAvailableMainModules } from '../../constants/modules';
import Version from '../common/Version';
import ModalActualizacion from '../ui/ModalActualizacion';
import Notification from '../common/Notification';
import NoData from '../common/NoData';
import SalesCard from '../ui/SalesCard';
import SalesChart from '../ui/SalesChart';
import './InicioPC.css';

const InicioEmpleadoPC = ({ onViewOpen, employee, sucursalSeleccionada }) => {
  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'info',
    text: ''
  });
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [oldVersion, setOldVersion] = useState(null);
  const [newVersion, setNewVersion] = useState(null);
  const checkingRef = useRef(false);

  // Verificar si el empleado tiene el módulo de Movimientos Almacén
  const hasMovimientosAlmacen = useMemo(() => {
    if (!employee || !employee.modules || !Array.isArray(employee.modules)) {
      return false;
    }

    const availableModules = getAvailableMainModules(employee.modules);
    const movimientosModule = availableModules.find(module => module.key === 'Movimientos');
    
    if (!movimientosModule || !movimientosModule.submodules) {
      return false;
    }

    // Verificar si tiene el submódulo movimientos_almacen (Almacén)
    // El submódulo tiene props: { tipoMovimiento: 'almacen' } y name: 'Almacen'
    return movimientosModule.submodules.some(submodule => {
      // Verificar por nombre o por props
      return (submodule.name === 'Almacen' || 
              submodule.props?.tipoMovimiento === 'almacen' ||
              (submodule.component === 'PanelMovimientos' && submodule.props?.tipoMovimiento === 'almacen'));
    });
  }, [employee]);

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

  // Obtener el ID de la sucursal
  const sucuId = sucursalSeleccionada?.id || 1;

  return (
    <>
      <div className="inicio-pc-container">
        {hasMovimientosAlmacen ? (
          <>
            {/* Cards de Estadísticas lado a lado */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <SalesCard sucuId={sucuId} />
              </div>
              <div style={{ flex: 1 }}>
                <SalesChart sucuId={sucuId} />
              </div>
            </div>
          </>
        ) : (
          /* Mensaje de restricción para empleados */
          <NoData
            icon="lock"
            title="Inicio para empleados"
            detail="Como empleado, no puedes ver los gráficos o atajos de módulos en la pantalla de inicio. Usa el menú lateral para acceder a los módulos."
            transparent={true}
            minHeight="300px"
          />
        )}

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
