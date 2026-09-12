import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import MenuSide from '../../../components/essentials/MenuSide';
import styles from '../../../pages/home/View.module.css';
import Tabla from '../../../components/common/information/Tabla';
import FetchDataProgressive from '../../../components/mixed/FetchDataProgressive';
import gastosService from '../../../services/gastosService';
import useFormatNumber from '../../../hooks/useFormatNumber';
import useFechaLiteral from '../../../hooks/useFechaLiteral';
import AgregarEditarPago from './modals/AgregarEditarPago';
import EliminarPago from './modals/EliminarPago';
import ViewInfo from './modals/ViewInfo';


const LiteralDateCell = ({ dateStr }) => {
  const safeDateStr = dateStr && typeof dateStr === 'string' ? dateStr.substring(0, 10) : dateStr;
  const literal = useFechaLiteral(safeDateStr);
  return <span>{literal || (safeDateStr ? new Date(safeDateStr + 'T00:00:00').toLocaleDateString() : '')}</span>;
};

const Pagos = () => {
  const { isLargeScreen } = useLayout();
  const { formatPrice } = useFormatNumber();

  const [pagos, setPagos] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Paginación y filtros
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('fecha_desc');
  const [filtroMetodoPago, setFiltroMetodoPago] = useState(null);
  const [proveedorId, setProveedorId] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState(null);
  
  // Modals state
  const [modalAgregarEditarOpen, setModalAgregarEditarOpen] = useState(false);
  const [pagoEditando, setPagoEditando] = useState(null);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [pagoEliminar, setPagoEliminar] = useState(null);
  const [modalInfoOpen, setModalInfoOpen] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [returnToViewOnDeleteClose, setReturnToViewOnDeleteClose] = useState(false);

  const [debouncedSearch] = useDebounce(search, 500);
  const [tablaFilters, setTablaFilters] = useState({});

  const handleFiltersChange = (filters) => {
    setTablaFilters(filters);
    
    const order = (filters.sort_order && filters.sort_order[0] === 'asc') ? 'fecha_asc' : 'fecha_desc';
    setSortOrder(order);

    const metodos = filters.metodo_pago && filters.metodo_pago.length > 0 ? filters.metodo_pago[0] : null;
    setFiltroMetodoPago(metodos);

    const provVal = filters.proveedor_id && filters.proveedor_id.length > 0 ? filters.proveedor_id.join(',') : null;
    setProveedorId(provVal);

    const range = filters.fecha || null;
    setFiltroFecha(range);
  };

  const dynamicFilters = useMemo(() => ['sort_order', 'metodo_pago', 'proveedor_id', 'fecha'], []);

  // Resetear página y limpiar pagos cuando cambian los filtros o la búsqueda
  useEffect(() => {
    setPagos([]);
    setIsLoading(true);
    setPage(1);
  }, [debouncedSearch, filtroMetodoPago, sortOrder, proveedorId, filtroFecha, setPagos]);

  const handlePagosLoaded = useCallback((data) => {
    setPagos(data);
    setError(null);
  }, [setPagos]);

  const handleDataAccumulated = useCallback((newData) => {
    setPagos(prev => {
      // Evitar duplicados
      const existingIds = new Set(prev.map(d => d.id));
      const uniqueNewData = newData.filter(d => !existingIds.has(d.id));
      return [...prev, ...uniqueNewData];
    });
  }, [setPagos]);

  const handleLoadingStart = useCallback(() => {
    if (page === 1) {
      if (pagos.length === 0) {
        setIsLoading(true);
      }
    } else {
      setIsLoadingMore(true);
    }
  }, [page, pagos.length]);

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
      header: 'Concepto',
      accessor: 'concepto',
      style: { fontWeight: 600, color: '#333' },
      width: '30%'
    },
    {
      header: 'Fecha',
      accessor: 'fecha_gasto',
      width: '15%',
      render: (row) => <LiteralDateCell dateStr={row.fecha_gasto} />
    },
    {
      header: 'Proveedor',
      accessor: 'proveedor',
      width: '25%',
      render: (row) => row.proveedor?.name || '--'
    },
    {
      header: 'Método de Pago',
      accessor: 'metodo_pago',
      width: '15%',
      render: (row) => row.metodo_pago ? row.metodo_pago.charAt(0).toUpperCase() + row.metodo_pago.slice(1) : '--'
    },
    {
      header: 'Monto',
      accessor: 'valor',
      width: '15%',
      render: (row) => `Bs. ${formatPrice(row.valor)}`
    }
  ];

  return (
    <>
      <NavBar />
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea} onScroll={handleScroll}>
          <h1 className={styles.title}>Pagos</h1>
          <Tabla
            data={pagos}
            columns={columns}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            buttonLabel="Nuevo Pago"
            onButtonClick={() => {
              setPagoEditando(null);
              setModalAgregarEditarOpen(true);
            }}
            searchKeys={['concepto']}
            sortKey="concepto"
            onLoadMore={handleLoadMore}
            onRowClick={(pago) => {
              setPagoSeleccionado(pago);
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
        service={gastosService}
        serviceName="gastosService"
        method="getAll"
        methodParams={[
            debouncedSearch,
            filtroMetodoPago,
            proveedorId,
            sortOrder,
            null, // sucuIdParam
            filtroFecha
        ]}
        isOpen={true}
        page={page}
        limit={30}
        onDataLoaded={handlePagosLoaded}
        onDataAccumulated={handleDataAccumulated}
        onHasMorePagesChange={setHasMorePages}
        onLoadingStart={handleLoadingStart}
        onLoadingEnd={handleLoadingEnd}
        onError={handleError}
      />

      <AgregarEditarPago
        isOpen={modalAgregarEditarOpen}
        onClose={() => setModalAgregarEditarOpen(false)}
        pagoSeleccionado={pagoEditando}
        onGuardar={(nuevoPago) => {
          setPagos(prev => {
            if (pagoEditando) {
              return prev.map(p => p.id === nuevoPago.id ? { ...p, ...nuevoPago } : p);
            }
            return [nuevoPago, ...prev];
          });
          if (pagoSeleccionado && pagoSeleccionado.id === nuevoPago.id) {
            setPagoSeleccionado(prev => ({ ...prev, ...nuevoPago }));
          }
        }}
      />

      <EliminarPago
        isOpen={modalEliminarOpen}
        onClose={(wasDeleted) => {
          setModalEliminarOpen(false);
          if (returnToViewOnDeleteClose && wasDeleted !== true) {
            setModalInfoOpen(true);
          }
          setReturnToViewOnDeleteClose(false);
        }}
        pagoSeleccionado={pagoEliminar}
        onEliminar={(idEliminado) => {
          if (Array.isArray(idEliminado)) {
            setPagos(prev => prev.filter(p => !idEliminado.includes(p.id)));
          } else {
            setPagos(prev => prev.filter(p => p.id !== idEliminado));
          }
          setReturnToViewOnDeleteClose(false);
          setModalInfoOpen(false);
        }}
      />

      <ViewInfo
        isOpen={modalInfoOpen}
        onClose={() => setModalInfoOpen(false)}
        pago={pagoSeleccionado}
        onEdit={(pago) => {
          setPagoEditando(pago);
          setModalAgregarEditarOpen(true);
        }}
        onEliminar={(idEliminado) => {
          if (Array.isArray(idEliminado)) {
            setPagos(prev => prev.filter(p => !idEliminado.includes(p.id)));
          } else {
            setPagos(prev => prev.filter(p => p.id !== idEliminado));
          }
          setReturnToViewOnDeleteClose(false);
          setModalInfoOpen(false);
        }}
      />

      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Pagos;