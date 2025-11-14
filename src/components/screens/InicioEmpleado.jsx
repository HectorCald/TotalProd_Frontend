import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { checkCacheStatus } from '../../utils/cacheUtils';
import { getAvailableMainModules, getSectionTitle } from '../../constants/modules';
import AtajoAnuncio from '../common/AtajoAnuncio';
import InicioEmpleadoPC from './InicioEmpleadoPC';
import ModalActualizacion from '../ui/ModalActualizacion';
import styles from './Screen.module.css';
import PullToRefresh from '../common/PullToRefresh';
import NoData from '../common/NoData';
import { useEmployee } from '../../context/EmployeeContext';
import personalService from '../../services/personalService';
import Notification from '../common/Notification';
import Text from '../common/Text';
import { OFFLINE_NETWORK_FLAG } from '../../utils/offlineNetworkInterceptor';

const InicioEmpleado = ({ employee, onMainModuleClick, onViewOpen }) => {
  const { setEmployeeFromService, sucursalSeleccionada } = useEmployee();
  const [notification, setNotification] = useState({ isVisible: false, type: 'info', text: '' });
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [oldVersion, setOldVersion] = useState(null);
  const [newVersion, setNewVersion] = useState(null);
  const checkingRef = useRef(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  // Obtener módulos principales disponibles con memoización
  const availableMainModules = useMemo(() => {
    return getAvailableMainModules(employee?.modules || []);
  }, [employee?.modules]);

  const mostrarNotificacion = (tipo, texto) => {
    setNotification({ isVisible: true, type: tipo, text: texto });
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

  return (
    <>
      {/* Contenido original para móvil */}
      <PullToRefresh
        onRefresh={async () => {
          if (!employee || !employee.id) return;
          const response = await personalService.getById(employee.id);
          if (response && response.success && response.data) {
            setEmployeeFromService(response.data);
            await checkAndNotifyCacheVersion(true, true);
          }
        }}
        screenName="Inicio"
        containerStyle={{
          height: '100%',
          minHeight: '100%',
          paddingBottom: '90px',
          gap: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          paddingTop: '10px',
        }}
      >
          {isOfflineMode && (
            <Text type="error" align="left">
              Estás en modo offline. Solo podrás registrar ventas (salidas) si cuentas con ese módulo.
            </Text>
          )}
          {(() => {
            // Agrupar módulos por sección
            const buckets = new Map();
            availableMainModules.forEach((module) => {
              const sectionKey = module.section || 'inventario';
              const sectionTitle = getSectionTitle(sectionKey);
              if (!buckets.has(sectionTitle)) buckets.set(sectionTitle, []);
              buckets.get(sectionTitle).push(module);
            });

            // Orden sugerido de secciones
            const sectionOrder = ['inventario', 'registros', 'gestion', 'finanzas', 'configuracion', 'damabrava'];
            const orderedSections = sectionOrder
              .map(key => getSectionTitle(key))
              .filter(title => buckets.has(title));

            return orderedSections.map((title) => (
              <div key={title} className={styles.section}>
                <p className={styles.subTitle} style={{ marginTop: '0', paddingBottom: '5px' }}>{title}</p>
                {buckets.get(title).map((module, index) => {
                  const hasSingleSubmodule = Array.isArray(module.submodules) && module.submodules.length === 1;
                  const singleSub = hasSingleSubmodule ? module.submodules[0] : null;

                  const shouldShowParen = hasSingleSubmodule && singleSub?.name && singleSub.name !== module.name;
                  const cardTitle = shouldShowParen ? (
                    <>
                      <span>{module.name}</span>{' '}
                      <span style={{ fontWeight: 400, color: 'var(--primary-color)', fontSize: 'calc(1em - 2px)' }}>({singleSub.name})</span>
                    </>
                  ) : module.name;

                  const cardDescription = hasSingleSubmodule ? (singleSub.description || module.description) : module.description;

                  const isAlmacenModule = module.key === 'Almacen';
                  const isModuleDisabled = isOfflineMode && !isAlmacenModule;

                  return (
                    <AtajoAnuncio
                      key={`${title}-${index}`}
                      title={cardTitle}
                      description={cardDescription}
                      image={module.image}
                      onClick={() => onMainModuleClick(module)}
                      disabled={isModuleDisabled}
                    />
                  );
                })}
              </div>
            ));
          })()}
      

        {availableMainModules.length === 0 && (
          <NoData
            icon="category"
            title="No tienes módulos asignados"
            detail="Pide al administrador que te asigne módulos para comenzar"
            transparent={true}
            minHeight="200px"
          />
        )}
      </PullToRefresh>

      {/* Contenido para pantallas grandes */}
      <div className={styles.inicioDesktop}>
        <InicioEmpleadoPC onViewOpen={onViewOpen} employee={employee} sucursalSeleccionada={sucursalSeleccionada} />
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

export default InicioEmpleado;
