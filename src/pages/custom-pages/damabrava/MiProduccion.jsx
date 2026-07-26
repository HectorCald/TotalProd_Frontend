import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import MenuSide from '../../../components/essentials/MenuSide';
import styles from '../../../pages/home/View.module.css';
import Tabla from '../../../components/common/information/Tabla';
import FetchDataProgressive from '../../../components/mixed/FetchDataProgressive';
import registrosProduccionDamabravaService from '../../../services/registrosProduccionDamabravaService';
import useFechaLiteral from '../../../hooks/useFechaLiteral';
import ViewInfo from './modals/ViewInfo';
import Formulario from './modals/Formulario';

const LiteralDateCell = ({ dateStr }) => {
  const literal = useFechaLiteral(dateStr, true, true);
  return <span>{literal || (dateStr ? new Date(dateStr).toLocaleDateString() : '')}</span>;
};

const MiProduccion = () => {
  const { isLargeScreen } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();

  const currentService = registrosProduccionDamabravaService;
  const currentServiceName = 'registrosProduccionDamabravaService';

  const [registros, setRegistros] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Paginación y filtros
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState(null);

  // Modals state
  const [modalInfoOpen, setModalInfoOpen] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
  const [modalFormularioOpen, setModalFormularioOpen] = useState(false);

  const [debouncedSearch] = useDebounce(search, 500);
  const [tablaFilters, setTablaFilters] = useState({});

  const handleFiltersChange = (filters) => {
    setTablaFilters(filters);

    const estado = filters.estado && filters.estado.length > 0 ? filters.estado[0] : null;
    setFiltroEstado(estado);

    const range = filters.fecha || null;
    setFiltroFecha(range);
  };

  const dynamicFilters = useMemo(() => {
    return [
      {
        id: 'estado',
        title: 'Estado',
        singleSelect: true,
        options: [
          { label: 'Pendientes', value: 'pendiente' },
          { label: 'Verificados', value: 'verificado' },
          { label: 'Ingresados', value: 'Ingresado' }
        ]
      },
      {
        id: 'fecha',
        title: 'Fecha',
        type: 'date'
      }
    ];
  }, []);

  useEffect(() => {
    setPage(1);
    setSearch('');
    setTablaFilters({});
    setFiltroEstado(null);
    setFiltroFecha(null);
  }, [location.pathname]);

  useEffect(() => {
    setRegistros([]);
    setIsLoading(true);
    setPage(1);
  }, [debouncedSearch, filtroEstado, filtroFecha]);

  const handleDataLoaded = useCallback((data) => {
    setRegistros(data);
    setError(null);
  }, []);

  const handleDataAccumulated = useCallback((newData) => {
    setRegistros(prev => {
      const existingIds = new Set(prev.map(d => d.id));
      const uniqueNewData = newData.filter(d => !existingIds.has(d.id));
      return [...prev, ...uniqueNewData];
    });
  }, []);

  const handleLoadingStart = useCallback(() => {
    if (page === 1) {
      if (registros.length === 0) {
        setIsLoading(true);
      }
    } else {
      setIsLoadingMore(true);
    }
  }, [page, registros.length]);

  const handleLoadingEnd = useCallback(() => {
    setIsLoading(false);
    setIsLoadingMore(false);
  }, []);

  const handleError = useCallback((err) => {
    setError(err);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMorePages && !isLoading && !isLoadingMore) {
      setPage(prev => prev + 1);
    }
  }, [hasMorePages, isLoading, isLoadingMore]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      handleLoadMore();
    }
  };

  const tableActions = [];

  const columns = [
    {
      header: 'Producto',
      accessor: 'producto_nombre',
      style: { fontWeight: 600, color: '#333' },
      width: '30%',
      render: (row) => row.producto_almacen?.name || 'Sin producto'
    },
    {
      header: 'Lote',
      accessor: 'lote',
      width: '15%',
      render: (row) => row.lote || '0'
    },
    {
      header: 'Proceso',
      accessor: 'proceso_texto',
      width: '15%',
      render: (row) => row.proceso === 'cernido' ? 'Cernido' : row.proceso === 'seleccionado' ? 'Seleccionado' : row.proceso === 'ninguno' ? 'Ninguno' : (row.proceso || '--')
    },
    {
      header: 'Cantidad',
      accessor: 'cantidad_texto',
      width: '15%',
      render: (row) => row.estado === 'verificado' || row.estado === 'Ingresado' ? `${row.cantidad_verificada || '0'} ud` : `${row.terminados || '0'} ud`
    },
    {
      header: 'Fecha',
      accessor: 'fecha',
      width: '10%',
      render: (row) => <LiteralDateCell dateStr={row.fecha} />
    },
    {
      header: 'Estado',
      accessor: 'estado_texto',
      hasStatusDot: true,
      statusType: (row) => row.estado === 'pendiente' ? 'error' : row.estado === 'verificado' ? 'success' : 'info',
      width: '15%'
    }
  ];

  const mappedRegistros = useMemo(() => {
    return registros.map(r => ({
      ...r,
      estado_texto: r.estado === 'pendiente' ? 'Pendiente' : r.estado === 'verificado' ? 'Verificado' : r.estado === 'Ingresado' ? 'Ingresado' : (r.estado || 'Desconocido')
    }));
  }, [registros]);

  return (
    <>
      <NavBar />
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea} onScroll={handleScroll}>
          <h1 className={styles.title}>Mi Producción</h1>
          <Tabla
            data={mappedRegistros}
            columns={columns}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            acciones={tableActions}
            buttonLabel="Nuevo registro"
            onButtonClick={() => setModalFormularioOpen(true)}
            searchKeys={['producto_almacen.name']}
            sortKey={'producto_almacen.name'}
            onLoadMore={handleLoadMore}
            onRowClick={(registro) => {
              setRegistroSeleccionado(registro);
              setModalInfoOpen(true);
            }}
            remote={true}
            searchValue={search}
            onSearchChange={setSearch}
            externalFilters={tablaFilters}
            onFiltersChange={handleFiltersChange}
            filters={dynamicFilters}
          />
        </div>
      </div>
      
      <FetchDataProgressive
        service={currentService}
        serviceName={currentServiceName}
        method="getByUser"
        methodParams={[
          filtroEstado,
          'fecha_desc',
          debouncedSearch,
          filtroFecha?.inicio || filtroFecha?.fin
            ? (() => {
                const inicioDate = filtroFecha.inicio ? new Date(filtroFecha.inicio) : null;
                const finDate = filtroFecha.fin ? new Date(filtroFecha.fin) : null;
                if (inicioDate) inicioDate.setHours(0, 0, 0, 0);
                if (finDate) finDate.setHours(23, 59, 59, 999);
                return {
                    inicio: inicioDate ? inicioDate.toISOString() : null,
                    fin: finDate ? finDate.toISOString() : null,
                };
            })()
            : null
        ]}
        isOpen={true}
        page={page}
        limit={30}
        onDataLoaded={handleDataLoaded}
        onDataAccumulated={handleDataAccumulated}
        onHasMorePagesChange={setHasMorePages}
        onLoadingStart={handleLoadingStart}
        onLoadingEnd={handleLoadingEnd}
        onError={handleError}
      />

      <ViewInfo
        isOpen={modalInfoOpen}
        onClose={() => setModalInfoOpen(false)}
        registro={registroSeleccionado}
        isMiProduccion={true}
        onEliminar={(id) => {
          setRegistros(prev => prev.filter(r => r.id !== id));
        }}
        onVerificar={(registroActualizado) => {
          setRegistroSeleccionado(registroActualizado);
          setRegistros(prev => prev.map(r => r.id === registroActualizado.id ? registroActualizado : r));
        }}
        onAnular={(registroActualizado) => {
          setRegistroSeleccionado(registroActualizado);
          setRegistros(prev => prev.map(r => r.id === registroActualizado.id ? registroActualizado : r));
        }}
        onIngresar={(registroActualizado) => {
          setRegistroSeleccionado(registroActualizado);
          setRegistros(prev => prev.map(r => r.id === registroActualizado.id ? registroActualizado : r));
        }}
      />

      <Formulario
        isOpen={modalFormularioOpen}
        onClose={() => setModalFormularioOpen(false)}
        onGuardar={(nuevoRegistro) => {
          setRegistros(prev => [{ ...nuevoRegistro, estado: nuevoRegistro.estado || 'pendiente' }, ...prev]);
        }}
      />
      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default MiProduccion;
