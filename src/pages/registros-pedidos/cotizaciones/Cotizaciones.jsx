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
import cotizacionesService from '../../../services/cotizacionesService';
import ViewInfoCotizacion from './modals/ViewInfoCotizacion';
import useFechaLiteral from '../../../hooks/useFechaLiteral';
import useFormatNumber from '../../../hooks/useFormatNumber';
import useFormatNumberPrice from '../../../hooks/useFormatNumberPrice';

const LiteralDateCell = ({ dateStr }) => {
  const literal = useFechaLiteral(dateStr);
  return <span>{literal || (dateStr ? new Date(dateStr).toLocaleDateString() : '')}</span>;
};

const Cotizaciones = () => {
  const { isLargeScreen } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();

  const [cotizaciones, setCotizaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const { formatPrice } = useFormatNumber();
  const { calculateSubtotal } = useFormatNumberPrice();

  // Paginación y filtros
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [search, setSearch] = useState('');
  const [estadoId, setEstadoId] = useState(null);
  const [sortOrder, setSortOrder] = useState('fecha_desc');
  const [clienteId, setClienteId] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState(null);

  // Modals state
  const [modalInfoOpen, setModalInfoOpen] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);

  const [debouncedSearch] = useDebounce(search, 500);
  const [tablaFilters, setTablaFilters] = useState({});

  const handleFiltersChange = (filters) => {
    setTablaFilters(filters);
    const order = (filters.sort_order && filters.sort_order[0] === 'asc') ? 'fecha_asc' : 'fecha_desc';
    setSortOrder(order);

    const estados = filters.estado && filters.estado.length > 0 ? filters.estado[0] : null;
    setEstadoId(estados);

    const clientVal = filters.cliente_id && filters.cliente_id.length > 0 ? filters.cliente_id.join(',') : null;
    setClienteId(clientVal);

    const range = filters.fecha || null;
    setFiltroFecha(range);
  };

  const dynamicFilters = useMemo(() => [
    'sort_order',
    {
      id: 'estado',
      title: 'Estado',
      singleSelect: true,
      options: [
        { label: 'Pendiente', value: 'pendiente' },
        { label: 'Aprobada', value: 'aprobada' },
        { label: 'Completado', value: 'completado' },
        { label: 'Anulado', value: 'anulado' }
      ]
    },
    'cliente_id',
    'fecha'
  ], []);

  useEffect(() => {
    setPage(1);
    setSearch('');
    setTablaFilters({});
    setEstadoId(null);
    setClienteId(null);
    setFiltroFecha(null);
    setSortOrder('fecha_desc');
  }, [location.pathname]);

  useEffect(() => {
    setCotizaciones([]);
    setIsLoading(true);
    setPage(1);
  }, [debouncedSearch, estadoId, sortOrder, clienteId, filtroFecha]);

  const handleCotizacionesLoaded = useCallback((data) => {
    setCotizaciones(data);
    setError(null);
  }, []);

  const handleDataAccumulated = useCallback((newData) => {
    setCotizaciones(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const uniqueNewData = newData.filter(p => !existingIds.has(p.id));
      return [...prev, ...uniqueNewData];
    });
  }, []);

  const handleLoadingStart = useCallback(() => {
    if (page === 1) {
      if (cotizaciones.length === 0) {
        setIsLoading(true);
      }
    } else {
      setIsLoadingMore(true);
    }
  }, [page, cotizaciones.length]);

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

  const columns = [
    {
      header: 'Nº',
      accessor: 'numero_cotizacion',
      style: { fontWeight: 600, color: '#333' },
      width: '5%'
    },
    {
      header: 'Detalle',
      accessor: 'detalle',
      width: '25%',
      isMobileMain: true,
      mobileIcon: () => 'file',
      mobileIconType: () => 'default',
      render: (row) => {
          if (row.cliente?.name) {
              return row.cliente.name;
          } else if (row.productos && row.productos.length > 0) {
              return row.productos.length === 1
                  ? row.productos[0]?.producto?.name || 'Sin producto'
                  : `${row.productos.length} productos`;
          }
          return 'Sin productos';
      }
    },
    {
      header: 'Total',
      accessor: 'total',
      width: '15%',
      render: (row) => {
        let subtotalCalculado = (row.productos || []).reduce((sum, p) => sum + calculateSubtotal(p.cantidad, p.precio_unitario || p.precio, p.producto?.grup, row?.agrupado, true), 0);
        
        let subtotalNum = Math.round(subtotalCalculado * 10) / 10;
        let descValNum = parseFloat(row.descuento) || 0;
        let aumValNum = parseFloat(row.aumento) || 0;
        let esPorcentaje = row.porcentaje;

        let descCalculadoNum = esPorcentaje ? subtotalNum * (descValNum / 100) : descValNum;
        let aumCalculadoNum = esPorcentaje ? subtotalNum * (aumValNum / 100) : aumValNum;

        let totalFinalRaw = subtotalNum - descCalculadoNum + aumCalculadoNum;
        let totalFinalNum = Math.round(totalFinalRaw * 10) / 10;

        return formatPrice(totalFinalNum);
      },
      isMobileSubtitle: true,
      mobileRender: (row) => {
        let subtotalCalculado = (row.productos || []).reduce((sum, p) => sum + calculateSubtotal(p.cantidad, p.precio_unitario || p.precio, p.producto?.grup, row?.agrupado, true), 0);

        let subtotalNum = Math.round(subtotalCalculado * 10) / 10;
        let descValNum = parseFloat(row.descuento) || 0;
        let aumValNum = parseFloat(row.aumento) || 0;
        let esPorcentaje = row.porcentaje;
        let descCalculadoNum = esPorcentaje ? subtotalNum * (descValNum / 100) : descValNum;
        let aumCalculadoNum = esPorcentaje ? subtotalNum * (aumValNum / 100) : aumValNum;

        let totalFinalRaw = subtotalNum - descCalculadoNum + aumCalculadoNum;
        let totalFinalNum = Math.round(totalFinalRaw * 10) / 10;

        return (
          <>
            Nº {row.numero_cotizacion || '--'} • {formatPrice(totalFinalNum)} • <LiteralDateCell dateStr={row.fecha} />
          </>
        );
      }
    },
    {
      header: 'Fecha',
      accessor: 'fecha',
      width: '20%',
      render: (row) => <LiteralDateCell dateStr={row.fecha} />
    },
    {
      header: 'Método de pago',
      accessor: 'metodo_pago',
      width: '20%',
      render: (row) => {
          if (!row.metodo_pago) return '--';
          const metodo = row.metodo_pago.toLowerCase();
          return metodo.charAt(0).toUpperCase() + metodo.slice(1);
      }
    },
    {
      header: 'Estado',
      accessor: 'estado',
      width: '20%',
      render: (row) => {
        const estado = row.estado || 'pendiente';
        let color = 'gray';
        if (estado === 'pendiente') color = 'var(--warning-color)';
        if (estado === 'aprobada') color = 'var(--success-color)';
        if (estado === 'rechazada') color = 'var(--error-color)';
        return (
          <span style={{ color: color, fontWeight: 600 }}>
            {estado.charAt(0).toUpperCase() + estado.slice(1)}
          </span>
        );
      },
      hasStatusDot: true,
      statusType: (row) => row.estado === 'aprobada' ? 'success' : row.estado === 'rechazada' ? 'error' : 'warning',
      isMobileStatus: true
    }
  ];

  return (
    <>
      <NavBar />
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea} onScroll={handleScroll}>
          <h1 className={styles.title}>Cotizaciones</h1>
          <Tabla
            data={cotizaciones}
            columns={columns}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            buttonLabel="Nueva Cotización"
            onButtonClick={() => {
              navigate('/almacen/cotizar');
            }}
            searchKeys={['numero_cotizacion']}
            sortKey="fecha"
            onLoadMore={handleLoadMore}
            onRowClick={(cotizacion) => {
              setCotizacionSeleccionada(cotizacion);
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
        service={cotizacionesService}
        serviceName="cotizacionesService"
        method="getAll"
        methodParams={[
          estadoId, 
          sortOrder, 
          clienteId, 
          debouncedSearch, 
          filtroFecha
        ]}
        isOpen={true}
        page={page}
        limit={30}
        onDataLoaded={handleCotizacionesLoaded}
        onDataAccumulated={handleDataAccumulated}
        onHasMorePagesChange={setHasMorePages}
        onLoadingStart={handleLoadingStart}
        onLoadingEnd={handleLoadingEnd}
        onError={handleError}
      />

      <ViewInfoCotizacion
        isOpen={modalInfoOpen}
        onClose={() => setModalInfoOpen(false)}
        cotizacion={cotizacionSeleccionada}
        onUpdate={(id, nuevoEstado) => {
          setCotizaciones(prev => prev.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
          setCotizacionSeleccionada(prev => prev && prev.id === id ? { ...prev, estado: nuevoEstado } : prev);
        }}
        onEliminar={(idEliminado) => {
          setCotizaciones(prev => prev.filter(c => c.id !== idEliminado));
          setModalInfoOpen(false);
        }}
      />
      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Cotizaciones;