import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import styles from '../../../pages/home/View.module.css';
import Tabla from '../../../components/common/information/Tabla';
import FetchDataProgressive from '../../../components/mixed/FetchDataProgressive';
import deudasService from '../../../services/deudasService';
import useFormatNumber from '../../../hooks/useFormatNumber';
import useFechaLiteral from '../../../hooks/useFechaLiteral';
import AgregarEditarDeuda from './modals/AgregarEditarDeuda';
import EliminarDeuda from './modals/EliminarDeuda';
import ViewInfo from './modals/ViewInfo';

const LiteralDateCell = ({ dateStr }) => {
  const literal = useFechaLiteral(dateStr, true);
  return <span>{literal || (dateStr ? new Date(dateStr).toLocaleDateString() : '')}</span>;
};

const Deudas = () => {
  const { isLargeScreen } = useLayout();
  const location = useLocation();
  const { formatPrice } = useFormatNumber();

  const [deudas, setDeudas] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Paginación y filtros
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('fecha_desc');
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [clienteId, setClienteId] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState(null);
  // Modals state
  const [modalAgregarEditarOpen, setModalAgregarEditarOpen] = useState(false);
  const [deudaEditando, setDeudaEditando] = useState(null);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [deudaEliminar, setDeudaEliminar] = useState(null);
  const [modalInfoOpen, setModalInfoOpen] = useState(false);
  const [deudaSeleccionada, setDeudaSeleccionada] = useState(null);

  const [debouncedSearch] = useDebounce(search, 500);
  const [tablaFilters, setTablaFilters] = useState({});

  const handleFiltersChange = (filters) => {
    setTablaFilters(filters);
    
    // El ordenamiento en panel de deudas usa fecha_desc o fecha_asc
    const order = (filters.sort_order && filters.sort_order[0] === 'asc') ? 'fecha_asc' : 'fecha_desc';
    setSortOrder(order);

    const estados = filters.estado && filters.estado.length > 0 ? filters.estado[0] : null;
    setFiltroEstado(estados);

    const clientVal = filters.cliente_id && filters.cliente_id.length > 0 ? filters.cliente_id.join(',') : null;
    setClienteId(clientVal);

    const range = filters.fecha || null;
    setFiltroFecha(range);
  };

  const dynamicFilters = useMemo(() => [
    {
      id: 'sort_order',
      title: 'Ordenamiento',
      singleSelect: true,
      options: [
        { label: 'Más recientes primero', value: 'desc' },
        { label: 'Más antiguos primero', value: 'asc' }
      ]
    },
    {
      id: 'estado',
      title: 'Estado de Deuda',
      singleSelect: true,
      options: [
        { label: 'Pendiente', value: 'pendiente' },
        { label: 'Pagada', value: 'pagada' },
        { label: 'Vencida', value: 'vencida' }
      ]
    },
    {
      id: 'cliente_id',
      title: 'Clientes'
    },
    {
      id: 'fecha',
      title: 'Fecha',
      type: 'date'
    }
  ], []);

  // Resetear página cuando cambia la ruta
  useEffect(() => {
    setPage(1);
  }, [location.pathname]);

  // Resetear página y limpiar deudas cuando cambian los filtros o la búsqueda
  useEffect(() => {
    setDeudas([]);
    setIsLoading(true);
    setPage(1);
  }, [debouncedSearch, filtroEstado, sortOrder, clienteId, filtroFecha]);

  const handleDeudasLoaded = useCallback((data) => {
    setDeudas(data);
    setError(null);
  }, [setDeudas]);

  const handleDataAccumulated = useCallback((newData) => {
    setDeudas(prev => {
      // Evitar duplicados
      const existingIds = new Set(prev.map(d => d.id));
      const uniqueNewData = newData.filter(d => !existingIds.has(d.id));
      return [...prev, ...uniqueNewData];
    });
  }, [setDeudas]);

  const handleLoadingStart = useCallback(() => {
    if (page === 1) {
      if (deudas.length === 0) {
        setIsLoading(true);
      }
    } else {
      setIsLoadingMore(true);
    }
  }, [page, deudas.length]);

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

  const tableActions = [
    {
      name: 'Detalles', icon: 'show', onClick: (deuda) => {
        setDeudaSeleccionada(deuda);
        setModalInfoOpen(true);
      }
    },
    {
      name: 'Editar', icon: 'edit', onClick: (deuda) => {
        setDeudaEditando(deuda);
        setModalAgregarEditarOpen(true);
      }
    },
    {
      name: 'Eliminar', icon: 'trash', onClick: (deuda) => {
        setDeudaEliminar(deuda);
        setModalEliminarOpen(true);
      }
    }
  ];

  const columns = [
    {
      header: 'Concepto',
      accessor: 'concepto',
      style: { fontWeight: 600, color: '#333' },
      width: '25%'
    },
    {
      header: 'Fecha',
      accessor: 'fecha_deuda',
      width: '15%',
      render: (row) => <LiteralDateCell dateStr={row.fecha_deuda} />
    },
    {
      header: 'Vencimiento',
      accessor: 'fecha_vencimiento',
      width: '15%',
      render: (row) => <LiteralDateCell dateStr={row.fecha_vencimiento} />
    },
    {
      header: 'Cliente',
      accessor: 'cliente',
      width: '15%',
      render: (row) => row.cliente?.name || '--'
    },
    {
      header: 'Estado',
      accessor: 'estado_texto',
      hasStatusDot: true,
      statusType: (row) => {
        if (row.estado === 'pendiente') return 'warning';
        if (row.estado === 'pagada') return 'success';
        if (row.estado === 'vencida') return 'error';
        return 'info';
      },
      width: '10%'
    },
    {
      header: 'Monto',
      accessor: 'monto_total',
      width: '10%',
      render: (row) => `Bs. ${formatPrice(row.monto_total)}`
    },
    {
      header: 'Saldo',
      accessor: 'saldo_pendiente',
      width: '10%',
      render: (row) => `Bs. ${formatPrice(row.saldo_pendiente)}`
    }
  ];

  const mappedDeudas = useMemo(() => {
    return deudas.map(d => ({
      ...d,
      estado_texto: d.estado ? d.estado.charAt(0).toUpperCase() + d.estado.slice(1) : ''
    }));
  }, [deudas]);

  return (
    <>
      {isLargeScreen && <NavBar />}
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea} onScroll={handleScroll}>
          <h1 className={styles.title}>Deudas</h1>
          <Tabla
            data={mappedDeudas}
            columns={columns}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            acciones={tableActions}
            buttonLabel="Nueva Deuda"
            onButtonClick={() => {
              setDeudaEditando(null);
              setModalAgregarEditarOpen(true);
            }}
            searchKeys={['concepto']}
            sortKey="concepto"
            onLoadMore={handleLoadMore}
            onRowClick={(deuda) => {
              setDeudaSeleccionada(deuda);
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
        service={deudasService}
        serviceName="deudasService"
        method="getAll"
        methodParams={[
            debouncedSearch,
            filtroEstado,
            clienteId,
            sortOrder,
            null, // sucuIdParam
            filtroFecha
        ]}
        isOpen={true}
        page={page}
        limit={30}
        onDataLoaded={handleDeudasLoaded}
        onDataAccumulated={handleDataAccumulated}
        onHasMorePagesChange={setHasMorePages}
        onLoadingStart={handleLoadingStart}
        onLoadingEnd={handleLoadingEnd}
        onError={handleError}
      />

      <AgregarEditarDeuda
        isOpen={modalAgregarEditarOpen}
        onClose={() => setModalAgregarEditarOpen(false)}
        deudaSeleccionada={deudaEditando}
        onGuardar={(nuevaDeuda) => {
          setDeudas(prev => {
            if (deudaEditando) {
              return prev.map(d => d.id === nuevaDeuda.id ? { ...d, ...nuevaDeuda } : d);
            }
            return [nuevaDeuda, ...prev];
          });
        }}
      />

      <EliminarDeuda
        isOpen={modalEliminarOpen}
        onClose={() => setModalEliminarOpen(false)}
        deudaSeleccionada={deudaEliminar}
        onEliminar={(idEliminado) => {
          setDeudas(prev => prev.filter(d => d.id !== idEliminado));
        }}
      />

      <ViewInfo
        isOpen={modalInfoOpen}
        onClose={() => setModalInfoOpen(false)}
        deuda={deudaSeleccionada}
        onEdit={(deuda) => {
          setDeudaEditando(deuda);
          setModalAgregarEditarOpen(true);
        }}
        onDeudaActualizada={(deudaActualizada) => {
          setDeudaSeleccionada(prev => ({ ...prev, ...deudaActualizada }));
          setDeudas(prev => prev.map(d => d.id === deudaActualizada.id ? { ...d, ...deudaActualizada } : d));
        }}
      />
    </>
  );
};

export default Deudas;