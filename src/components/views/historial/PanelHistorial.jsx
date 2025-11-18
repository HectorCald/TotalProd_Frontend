import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import Filtros from '../../common/Filtros';
import Notification from '../../common/Notification';
import historialService from '../../../services/historialService';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import LoadingSpinner from '../../common/LoadingSpinner';
import NoData from '../../common/NoData';
import PullToRefresh from '../../common/PullToRefresh';
import RefreshIndicator from '../../common/RefreshIndicator';
import VerHistorial from './VerHistorial';
import FiltroTipoHistorial from '../../mixed/FiltroTipoHistorial';
import FiltroResponsable from '../../mixed/FiltroResponsable';
import FetchDataProgressive from '../../mixed/FetchDataProgressive';

const PAGE_LIMIT = 30;

const formatDateTime = (value) => {
  if (!value) return '--';
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return String(value);
  }
};

function PanelHistorial({ isOpen, setIsOpen }) {
  const { isLargeScreen } = useLayout();

  const [records, setRecords] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState(null);
  const [filtroResponsable, setFiltroResponsable] = useState(null);
  const [isOpenFiltroTipo, setIsOpenFiltroTipo] = useState(false);
  const [isOpenFiltroResponsable, setIsOpenFiltroResponsable] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchNormalized, setSearchNormalized] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [debouncedSearch] = useDebounce(searchNormalized, 400);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Estados para RefreshIndicator
  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeRequests, setActiveRequests] = useState(0);

  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'success',
    text: ''
  });

  const showNotification = (type, text) => {
    setNotification({
      isVisible: true,
      type,
      text
    });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  const computeHasMore = (pagination = {}, pageValue = 1) => {
    const total = pagination.total ?? 0;
    const limit = pagination.limit ?? PAGE_LIMIT;
    const offset = pagination.offset ?? (pageValue - 1) * limit;
    return offset + limit < total;
  };

  // Callbacks para FetchDataProgressive
  const handleDataLoaded = useCallback((data) => {
    setRecords(data);
  }, []);

  const handleDataAccumulated = useCallback((data) => {
    setRecords(prev => {
      const existingIds = new Set(prev.map(item => item.id));
      const merged = [...prev];
      data.forEach(item => {
        if (!existingIds.has(item.id)) {
          merged.push(item);
        }
      });
      return merged;
    });
  }, []);

  const handleLoadingStart = useCallback(() => {
    if (currentPage === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    setActiveRequests(prev => {
      const newCount = prev + 1;
      if (newCount > 0) {
        setShowRefreshIndicator(true);
        setIsRefreshing(true);
      }
      return newCount;
    });
  }, [currentPage]);

  const handleLoadingEnd = useCallback(() => {
    setIsLoading(false);
    setIsLoadingMore(false);
    
    setActiveRequests(prev => {
      const newCount = Math.max(0, prev - 1);
      if (newCount === 0) {
        setTimeout(() => {
          setIsRefreshing(false);
          setTimeout(() => {
            setShowRefreshIndicator(false);
          }, 500);
        }, 300);
      }
      return newCount;
    });
  }, []);

  const handleError = useCallback((err) => {
    setError(err);
    showNotification('error', err.message || 'Error al obtener el historial');
  }, [showNotification]);

  const handleHasMorePagesChange = useCallback((hasMore) => {
    setHasMorePages(hasMore);
  }, []);

  // Wrapper para el servicio
  const historialServiceWrapper = useMemo(() => ({
    getAll: async (page, limit) => {
      const params = {
        page,
        limit
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      if (filtroTipo) {
        params.accion = filtroTipo;
      }

      if (filtroResponsable) {
        if (filtroResponsable.tipo === 'personal') {
          params.personal_id = filtroResponsable.id;
        } else if (filtroResponsable.tipo === 'user') {
          params.user_id = filtroResponsable.id;
        }
      }

      return await historialService.getAll(params);
    }
  }), [debouncedSearch, filtroTipo, filtroResponsable]);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setRecords([]);
    } else {
      setShowRefreshIndicator(false);
      setIsRefreshing(false);
    }
  }, [isOpen, debouncedSearch, filtroTipo, filtroResponsable]);

  const handleScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !isLoading && !isLoadingMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleRefresh = async () => {
    setCurrentPage(1);
    setRecords([]);
    // FetchDataProgressive se encargará de recargar automáticamente
  };

  const openRecord = (record) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
  };

  const tableHeaders = [
    { key: 'modulo', label: 'Módulo', icon: 'grid-alt' },
    { key: 'accion', label: 'Acción', icon: 'bolt' },
    { key: 'responsable', label: 'Responsable', icon: 'user' },
    { key: 'lugar_afectado', label: 'Lugar afectado', icon: 'map-pin' },
    { key: 'comentario', label: 'Comentario', icon: 'comment' },
    { key: 'fecha', label: 'Fecha', icon: 'time' }
  ];

  const tableData = records.map(entry => ({
    id: entry.id,
    modulo: entry.modulo || '--',
    accion: (entry.accion || '').toUpperCase(),
    responsable: entry.user?.name || entry.personal?.name || 'Sin responsable',
    lugar_afectado: entry.lugar_afectado || '--',
    comentario: entry.detalles?.comentario || (typeof entry.detalles === 'string' ? entry.detalles : '--'),
    fecha: formatDateTime(entry.fecha)
  }));

  const getCellBadge = (item, headerKey) => {
    if (headerKey === 'accion') {
      const accion = item.accion;
      const badgeConfig = {
        'CREAR': {
          text: 'Crear',
          className: 'warning'
        },
        'EDITAR': {
          text: 'Editar',
          className: 'info'
        },
        'ELIMINAR': {
          text: 'Eliminar',
          className: 'error'
        }
      };

      return badgeConfig[accion] || {
        text: accion,
        className: 'default'
      };
    }

    return null;
  };

  const getTipoNombre = () => {
    if (!filtroTipo) return 'Todas las acciones';
    const labelMap = {
      CREAR: 'Crear',
      EDITAR: 'Editar',
      ELIMINAR: 'Eliminar'
    };
    return labelMap[filtroTipo] || 'Todas las acciones';
  };

  const getResponsableNombre = () => {
    if (!filtroResponsable) return 'Todos los responsables';
    return filtroResponsable.name || 'Responsable seleccionado';
  };

  const opcionesFiltros = [
    {
      label: getTipoNombre(),
      active: !!filtroTipo,
      onClick: () => setIsOpenFiltroTipo(true)
    },
    {
      label: getResponsableNombre(),
      active: !!filtroResponsable,
      onClick: () => setIsOpenFiltroResponsable(true)
    }
  ];

  const handleTipoSeleccionado = (tipo) => {
    setFiltroTipo(tipo);
    setCurrentPage(1);
  };

  const handleResponsableSeleccionado = (responsable) => {
    setFiltroResponsable(responsable);
    setCurrentPage(1);
  };

  return (
    <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
      <HeaderView
        onBack={() => setIsOpen(false)}
        showSearch={true}
        searchPlaceholder="Buscar por módulo o lugar afectado..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchNormalizedChange={setSearchNormalized}
        onSearchClear={() => {
          setSearchQuery('');
          setSearchNormalized('');
        }}
        searchExpanded={isSearchExpanded}
        onSearchToggle={setIsSearchExpanded}
        title="Historial"
      />

      <div className={styles.container}>
        {isLoading && currentPage === 1 ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className={styles.titleContainer}>
              <RefreshIndicator
                isVisible={showRefreshIndicator}
                isLoading={isRefreshing}
              />
            </div>
            <Filtros options={opcionesFiltros} />
            {isLargeScreen ? (
              <div
                className={styles.content}
                onScroll={handleScroll}
                style={{
                  maxHeight: 'calc(100% - 80px)'
                }}
              >
                {records.length > 0 ? (
                  <Table
                    headers={tableHeaders}
                    data={tableData}
                    onScroll={handleScroll}
                    onRowClick={(row) => {
                      const record = records.find(item => item.id === row.id);
                      if (record) {
                        openRecord(record);
                      }
                    }}
                    getCellBadge={getCellBadge}
                    columnWidths={{
                      modulo: '18%',
                      accion: '12%',
                      responsable: '20%',
                      lugar_afectado: '25%',
                      comentario: '25%',
                      fecha: '20%'
                    }}
                  />
                ) : (
                  <NoData
                    icon="history"
                    title={searchQuery ? 'Sin resultados' : 'Sin registros'}
                    detail={searchQuery ? 'No se encontraron resultados con el criterio de búsqueda' : 'Aún no hay registros en el historial'}
                    transparent={true}
                    minHeight="200px"
                  />
                )}
                {isLoadingMore && <LoadingSpinner />}
              </div>
            ) : (
              <PullToRefresh
                onRefresh={handleRefresh}
                screenName="Historial"
                containerStyle={{
                  maxHeight: 'calc(100% - 80px)',
                  minHeight: 'calc(100% - 80px)'
                }}
                onScroll={handleScroll}
              >
                {records.length > 0 ? (
                  records.map((entry, index) => {
                    const accion = (entry.accion || '').toUpperCase();
                    const iconConfig = (() => {
                      switch (accion) {
                        case 'CREAR':
                          return { icon: 'plus-circle', color: 'naranja' };
                        case 'EDITAR':
                          return { icon: 'edit', color: 'azul' };
                        case 'ELIMINAR':
                          return { icon: 'trash', color: 'rojo' };
                        default:
                          return { icon: 'history', color: 'gris' };
                      }
                    })();

                    const flotConfig = (() => {
                      switch (accion) {
                        case 'CREAR':
                          return { key: 'flot2', value: 'Crear' };
                        case 'EDITAR':
                          return { key: 'flot5', value: 'Editar' };
                        case 'ELIMINAR':
                          return { key: 'flot3', value: 'Eliminar' };
                        default:
                          return { key: 'flot6', value: accion || 'Historial' };
                      }
                    })();

                    const responsable =
                      entry.user?.name ||
                      entry.personal?.name ||
                      '';

                    return (
                      <ItemView
                        key={entry.id || index}
                        title={entry.modulo || 'Módulo'}
                        description={`${formatDateTime(entry.fecha)}${entry.lugar_afectado ? ` • ${entry.lugar_afectado}` : ''}`}
                        description2={responsable ? `Responsable: ${responsable}` : 'Sin responsable asignado'}
                        icon={iconConfig.icon}
                        colorIcon={iconConfig.color}
                        onClick={() => openRecord(entry)}
                        arrow={false}
                        {...{ [flotConfig.key]: flotConfig.value }}
                      />
                    );
                  })
                ) : (
                  <NoData
                    icon="history"
                    title={searchQuery ? 'Sin resultados' : 'Sin registros'}
                    detail={searchQuery ? 'No se encontraron resultados con el criterio de búsqueda' : 'Aún no hay registros en el historial'}
                    transparent={true}
                    minHeight="200px"
                  />
                )}
                {isLoadingMore && <LoadingSpinner />}
              </PullToRefresh>
            )}
          </>
        )}
      </div>

      <VerHistorial
        isOpen={isDetailOpen}
        setIsOpen={setIsDetailOpen}
        registro={selectedRecord}
      />

      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        text={notification.text}
      />

      <FiltroTipoHistorial
        isOpen={isOpenFiltroTipo}
        setIsOpen={setIsOpenFiltroTipo}
        onTipoSeleccionado={handleTipoSeleccionado}
      />

      <FiltroResponsable
        isOpen={isOpenFiltroResponsable}
        setIsOpen={setIsOpenFiltroResponsable}
        onResponsableSeleccionado={handleResponsableSeleccionado}
        responsableSeleccionado={filtroResponsable}
      />

      {/* Carga de datos progresiva - solo cuando está abierto */}
      {isOpen && (
        <FetchDataProgressive
          service={historialServiceWrapper}
          method="getAll"
          methodParams={[]}
          serviceName="historialService"
          isOpen={isOpen && (currentPage === 1 || (currentPage > 1 && hasMorePages))}
          page={currentPage}
          limit={PAGE_LIMIT}
          onDataLoaded={handleDataLoaded}
          onDataAccumulated={handleDataAccumulated}
          onLoadingStart={handleLoadingStart}
          onLoadingEnd={handleLoadingEnd}
          onError={handleError}
          onHasMorePagesChange={handleHasMorePagesChange}
        />
      )}
    </View>
  );
}

export default PanelHistorial;

