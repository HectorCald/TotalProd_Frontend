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
import EliminarCotizacion from './modals/EliminarCotizacion';
import ViewInfoCotizacion from './modals/ViewInfoCotizacion';
import ProductosMovimiento from '../movimientos/modals/ProductosMovimiento';
import { formatCurrency } from '../../../utils/numberUtils';
import useFechaLiteral from '../../../hooks/useFechaLiteral';
import useFormatNumber from '../../../hooks/useFormatNumber';
import useFormatNumberPrice from '../../../hooks/useFormatNumberPrice';

const LiteralDateCell = ({ dateStr }) => {
  const literal = useFechaLiteral(dateStr, true, true);
  return <span>{literal || (dateStr ? new Date(dateStr).toLocaleDateString() : '')}</span>;
};

const redondearADecima = (valor) => {
    if (!Number.isFinite(valor)) return 0;
    const multiplicado = valor * 10;
    const decimal = multiplicado % 1;
    const redondeado = decimal >= 0.5 ? Math.ceil(multiplicado) : Math.floor(multiplicado);
    return redondeado / 10;
};

const Cotizaciones = () => {
  const { isLargeScreen } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();

  const [cotizaciones, setCotizaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [, setError] = useState(null);

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
  const [, setCotizacionEditando] = useState(null);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [cotizacionEliminar, setCotizacionEliminar] = useState(null);
  const [modalInfoOpen, setModalInfoOpen] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [modalProductosOpen, setModalProductosOpen] = useState(false);

  const [debouncedSearch] = useDebounce(search, 500);
  const [tablaFilters, setTablaFilters] = useState({});

  const handleFiltersChange = (filters) => {
    setTablaFilters(filters);
    const order = (filters.sort_order && filters.sort_order[0] === 'asc') ? 'fecha_asc' : 'fecha_desc';
    setSortOrder(order);

    const estados = filters.estado || [];
    setEstadoId(estados.length > 0 ? estados[0] : null);

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
        { label: 'Más recientes', value: 'desc' },
        { label: 'Más antiguos', value: 'asc' }
      ]
    },
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

  const tableActions = [
    {
      name: 'Copiar', icon: 'copy',
      show: (row) => true,
      onClick: (cotizacion) => {
        const ventaData = {
            prices_types_id: cotizacion.prices_types_id || cotizacion.precio?.id,
            modalidad: cotizacion.agrupado ? 'grupos' : 'unidades',
            productos_lista: (cotizacion.productos || []).map(p => {
                const grup = parseFloat(p.producto?.grup) || 0;
                const cantidadUD = parseFloat(p.cantidad) || 1;
                const esPorGrupo = cotizacion.agrupado && grup > 0;
                return {
                    id: p.producto?.id || p.producto_almacen_id || p.products_id || p.id,
                    cantidad: esPorGrupo ? Math.floor(cantidadUD / grup) : cantidadUD
                };
            }),
            cliente_id: cotizacion.clients_id || cotizacion.cliente?.id,
            descuento: parseFloat(cotizacion.descuento) || 0,
            aumento: parseFloat(cotizacion.aumento) || 0,
            porcentaje: !!cotizacion.porcentaje,
            metodo_pago: cotizacion.metodo_pago,
            fecha: cotizacion.fecha || cotizacion.created_at || new Date().toISOString()
        };
        localStorage.removeItem('cotizacionEnProgreso');
        sessionStorage.setItem('cotizacionParaCopiar', JSON.stringify(ventaData));
        navigate('/almacen/cotizar/copia');
      }
    },
    {
      name: 'Eliminar', icon: 'trash',
      show: (row) => row.estado === 'pendiente',
      onClick: (cotizacion) => {
        setCotizacionEliminar(cotizacion);
        setModalEliminarOpen(true);
      }
    }
  ];

  const columns = [
    {
      header: 'Nº',
      accessor: 'numero_cotizacion',
      style: { fontWeight: 600, color: '#333' },
      width: '10%'
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
      width: '15%',
      render: (row) => new Date(row.fecha).toLocaleDateString()
    },
    {
      header: 'Estado',
      accessor: 'estado',
      width: '15%',
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
            acciones={tableActions}
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
          filtroFecha ? {
            inicio: filtroFecha.inicio ? new Date(filtroFecha.inicio).toISOString() : null,
            fin: filtroFecha.fin ? new Date(filtroFecha.fin).toISOString() : null,
          } : null
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

      <EliminarCotizacion
        isOpen={modalEliminarOpen}
        onClose={() => setModalEliminarOpen(false)}
        cotizacionSeleccionada={cotizacionEliminar}
        onEliminar={(idEliminado) => {
          setCotizaciones(prev => prev.filter(c => c.id !== idEliminado));
        }}
      />

      <ViewInfoCotizacion
        isOpen={modalInfoOpen}
        onClose={() => setModalInfoOpen(false)}
        cotizacion={cotizacionSeleccionada}
        onEdit={(cotizacion) => {
          setCotizacionEditando(cotizacion);
          // Todavía no debe hacer nada
        }}
        onUpdate={(id, nuevoEstado) => {
          setCotizaciones(prev => prev.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
          setCotizacionSeleccionada(prev => prev && prev.id === id ? { ...prev, estado: nuevoEstado } : prev);
        }}
        onEliminar={(idEliminado) => {
          setCotizaciones(prev => prev.filter(c => c.id !== idEliminado));
          setModalInfoOpen(false);
        }}
      />

      <ProductosMovimiento
        isOpen={modalProductosOpen}
        onClose={() => setModalProductosOpen(false)}
        cotizacion={cotizacionSeleccionada}
      />
      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Cotizaciones;
