import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import Filtros from '../../common/Filtros';
import { useToast } from '../../../context/ToastContext';
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
  const { showDanger } = useToast();

  const [records, setRecords] = useState([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState(null);
  const [filtroResponsable, setFiltroResponsable] = useState(null);
  const [isOpenFiltroTipo, setIsOpenFiltroTipo] = useState(false);
  const [isOpenFiltroResponsable, setIsOpenFiltroResponsable] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Estados para RefreshIndicator
  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeRequests, setActiveRequests] = useState(0);

  const computeHasMore = (pagination = {}, pageValue = 1) => {
    const total = pagination.total ?? 0;
    const limit = pagination.limit ?? PAGE_LIMIT;
    const offset = pagination.offset ?? (pageValue - 1) * limit;
    return offset + limit < total;
  };

  // Callbacks para FetchDataProgressive
  const handleDataLoaded = useCallback((data) => {
    setRecords(data.length > 0 ? data : []);
    setRecordsLoaded(true);
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
      if (records.length === 0 && !recordsLoaded) {
        setIsLoading(true);
      }
    } else if (currentPage > 1) {
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
  }, [currentPage, records.length, recordsLoaded]);

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
    showDanger('Error', err.message || 'Error al obtener el historial');
  }, [showDanger]);

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
  }), [filtroTipo, filtroResponsable]);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setRecords([]);
      setRecordsLoaded(false);
    } else {
      setShowRefreshIndicator(false);
      setIsRefreshing(false);
    }
  }, [isOpen, filtroTipo, filtroResponsable]);

  const handleScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !isLoading && !isLoadingMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleRefresh = async () => {
    setCurrentPage(1);
    setRecords([]);
    setRecordsLoaded(false);
    setRefreshKey((k) => k + 1);
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
          className: 'success'
        },
        'EDITAR': {
          text: 'Editar',
          className: 'info'
        },
        'ANULAR': {
          text: 'Anular',
          className: 'warning'
        },
        'REMPLAZO': {
          text: 'Reemplazo',
          className: 'remplazo'
        },
        'ENTREGAR': {
          text: 'Entregar',
          className: 'entregar'
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
      ANULAR: 'Anular',
      ENTREGAR: 'Entregar',
      REMPLAZO: 'Reemplazo',
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
    setRecords([]);
    setRecordsLoaded(false);
  };

  const handleResponsableSeleccionado = (responsable) => {
    setFiltroResponsable(responsable);
    setCurrentPage(1);
    setRecords([]);
    setRecordsLoaded(false);
  };

  return (
    <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
      <HeaderView
        onBack={() => setIsOpen(false)}
        showSearch={false}
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
                    title="Sin registros"
                    detail="Aún no hay registros en el historial"
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
                        case 'ANULAR':
                          return { icon: 'block', color: 'naranja' };
                        case 'ENTREGAR':
                          return { icon: 'package', color: 'cyan' };
                        case 'REMPLAZO':
                          return { icon: 'transfer-alt', color: 'morado' };
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
                        case 'ANULAR':
                          return { key: 'flot4', value: 'Anular' };
                        case 'ENTREGAR':
                          return { key: 'flot8', value: 'Entregar' };
                        case 'REMPLAZO':
                          return { key: 'flot7', value: 'Reemplazo' };
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
                    title="Sin registros"
                    detail="Aún no hay registros en el historial"
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
          methodParams={[filtroTipo, filtroResponsable?.id ?? filtroResponsable?.tipo ?? null, refreshKey]}
          serviceName="historialService"
          isOpen={isOpen && ((!recordsLoaded && currentPage === 1) || (currentPage > 1 && hasMorePages))}
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

