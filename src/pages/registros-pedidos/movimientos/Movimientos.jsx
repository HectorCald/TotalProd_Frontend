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
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import useFormatNumber from '../../../hooks/useFormatNumber';
import useFechaLiteral from '../../../hooks/useFechaLiteral';
import ViewInfo from './modals/ViewInfo';
import ViewInfoAcopio from './modals/ViewInfoAcopio';
import EliminarMovimiento from './modals/EliminarMovimiento';
import AnularMovimiento from './modals/AnularMovimiento';
import { LEGACY_PERCENTAGE_CUTOFF_DATE } from '../../../constants/movimientosConstants';

const LiteralDateCell = ({ dateStr }) => {
  const cleanDateStr = dateStr ? dateStr.slice(0, 10) : '';
  const literal = useFechaLiteral(cleanDateStr, true);
  return <span>{literal || (dateStr ? new Date(dateStr).toLocaleDateString() : '')}</span>;
};

const Movimientos = () => {
  const { isLargeScreen } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();
  const { formatPrice } = useFormatNumber();

  const isAcopio = location.pathname.includes('/movimientos/acopio');
  const getTitulo = () => {
    return isAcopio ? 'Movimientos Materia Prima' : 'Movimientos Almacén';
  };

  const currentService = isAcopio ? movimientosAcopioService : movimientosAlmacenService;
  const currentServiceName = isAcopio ? 'movimientosAcopioService' : 'movimientosAlmacenService';

  const [movimientos, setMovimientos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [, setError] = useState(null);

  // Paginación y filtros
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [filtroCliente, setFiltroCliente] = useState(null);
  const [filtroProveedor, setFiltroProveedor] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState(null);

  // Modals state
  const [modalInfoOpen, setModalInfoOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [modalAnularOpen, setModalAnularOpen] = useState(false);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);

  const [debouncedSearch] = useDebounce(search, 500);
  const [tablaFilters, setTablaFilters] = useState({});

  const handleFiltersChange = (filters) => {
    setTablaFilters(filters);

    const tipo = filters.tipo && filters.tipo.length > 0 ? filters.tipo[0] : null;
    setFiltroTipo(tipo);

    const estado = filters.estado && filters.estado.length > 0 ? filters.estado[0] : null;
    setFiltroEstado(estado);

    const clienteId = filters.cliente_id && filters.cliente_id.length > 0 ? filters.cliente_id.join(',') : null;
    setFiltroCliente(clienteId);

    const proveedorId = filters.proveedor_id && filters.proveedor_id.length > 0 ? filters.proveedor_id.join(',') : null;
    setFiltroProveedor(proveedorId);

    const range = filters.fecha || null;
    setFiltroFecha(range);
  };

  const dynamicFilters = useMemo(() => {
    const commonFilters = [
      {
        id: 'tipo',
        title: 'Tipo de Movimiento',
        singleSelect: true,
        options: [
          { label: 'Entradas', value: 'entrada' },
          { label: 'Salidas', value: 'salida' },
          { label: 'Transferencias', value: 'transferencia' }
        ]
      },
      {
        id: 'estado',
        title: 'Estado',
        singleSelect: true,
        options: [
          { label: 'Finalizados', value: 'finalizado' },
          { label: 'Anulados', value: 'anulado' }
        ]
      },
      {
        id: 'fecha',
        title: 'Fecha',
        type: 'date'
      }
    ];

    if (!isAcopio) {
      commonFilters.push({
        id: 'cliente_id',
        title: 'Clientes'
      });
    } else {
      commonFilters.push({
        id: 'proveedor_id',
        title: 'Proveedores'
      });
    }

    return commonFilters;
  }, [isAcopio]);

  // Resetear página cuando cambia la ruta
  useEffect(() => {
    setPage(1);
    setSearch('');
    setTablaFilters({});
    setFiltroTipo(null);
    setFiltroEstado(null);
    setFiltroCliente(null);
    setFiltroFecha(null);
  }, [location.pathname]);

  // Resetear página y limpiar cuando cambian los filtros o la búsqueda
  useEffect(() => {
    setMovimientos([]);
    setIsLoading(true);
    setPage(1);
  }, [debouncedSearch, filtroTipo, filtroEstado, filtroCliente, filtroProveedor, filtroFecha, isAcopio]);

  const handleDataLoaded = useCallback((data) => {
    setMovimientos(data);
    setError(null);
  }, [setMovimientos]);

  const handleDataAccumulated = useCallback((newData) => {
    setMovimientos(prev => {
      const existingIds = new Set(prev.map(d => d.id));
      const uniqueNewData = newData.filter(d => !existingIds.has(d.id));
      return [...prev, ...uniqueNewData];
    });
  }, [setMovimientos]);

  const handleLoadingStart = useCallback(() => {
    if (page === 1) {
      if (movimientos.length === 0) {
        setIsLoading(true);
      }
    } else {
      setIsLoadingMore(true);
    }
  }, [page, movimientos.length]);

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

  const handleMovimientoEliminado = (id) => {
    setMovimientos(prev => prev.filter(m => m.id !== id));
  };

  const handleMovimientoAnulado = (updatedMovimiento) => {
    setMovimientos(prev => {
      // Filtrar los movimientos que sean consumos de receta generados por este movimiento anulado
      const filtrados = prev.filter(m => !(m.movimiento_entrada_id && m.movimiento_entrada_id === updatedMovimiento.id));
      // Actualizar el estado del movimiento principal a 'anulado'
      return filtrados.map(m => m.id === updatedMovimiento.id ? { ...m, ...updatedMovimiento, estado: 'anulado' } : m);
    });
    setMovimientoSeleccionado(prev => prev && prev.id === updatedMovimiento.id ? { ...prev, ...updatedMovimiento, estado: 'anulado' } : prev);
  };

  const tableActions = [
    {
      name: 'Editar', 
      icon: 'edit', 
      show: (row) => (!row.estado || row.estado.toLowerCase() !== 'anulado') && !(isAcopio && row.movimiento_entrada_id),
      onClick: (movimiento) => {
        // Sin funcionamiento de momento
      }
    },
    {
      name: 'Eliminar', 
      icon: 'trash', 
      show: (row) => (row.estado && row.estado.toLowerCase() === 'anulado') && !(isAcopio && row.movimiento_entrada_id),
      onClick: (movimiento) => {
        setMovimientoSeleccionado(movimiento);
        setModalEliminarOpen(true);
      }
    },
    {
      name: 'Anular', 
      icon: 'block', 
      show: (row) => (!row.estado || row.estado.toLowerCase() !== 'anulado') && !(isAcopio && row.movimiento_entrada_id),
      onClick: (movimiento) => {
        setMovimientoSeleccionado(movimiento);
        setModalAnularOpen(true);
      }
    }
  ];

  const getProductName = (movimiento) => {
    if (isAcopio) {
      return movimiento.product?.name || 'Sin producto';
    } else {
      if (movimiento.type === 'transferencia') {
        if (movimiento.concepto && movimiento.concepto.trim() !== '') {
          return movimiento.concepto;
        } else {
          const origen = movimiento.sucursal_origen?.name || movimiento.sucursal?.name || 'Origen';
          const destino = movimiento.sucursal_destino?.name || 'Destino';
          return `${origen} > ${destino}`;
        }
      } else if (movimiento.concepto && movimiento.concepto.trim() !== '') {
        return movimiento.concepto;
      } else {
        const clienteNombre = movimiento.type === 'entrada'
          ? (movimiento.proveedor?.name || null)
          : (movimiento.cliente?.name || null);

        if (clienteNombre) {
          return clienteNombre;
        } else if (movimiento.productos && movimiento.productos.length === 1) {
          return movimiento.productos[0]?.producto?.name || (movimiento.type === 'entrada' ? 'Entrada rapida' : 'Venta rapida');
        } else {
          return movimiento.type === 'entrada' ? 'Entrada rapida' : 'Venta rapida';
        }
      }
    }
  };

  const getClientProviderName = (movimiento) => {
    if (isAcopio) {
      return movimiento.proveedor?.name || '--';
    } else {
      return movimiento.cliente?.name || '--';
    }
  };

  const columns = isAcopio ? [
    {
      header: 'Producto',
      accessor: 'product',
      style: { fontWeight: 600, color: '#333' },
      width: '25%',
      render: (row) => getProductName(row),
      isMobileMain: true,
      mobileIcon: (row) => row.type === 'entrada' ? 'plus' : (row.type === 'transferencia' ? 'transfer' : 'minus'),
      mobileIconType: (row) => row.type === 'entrada' ? 'default' : (row.type === 'transferencia' ? 'info' : 'error')
    },
    {
      header: 'Tipo',
      accessor: 'tipo_texto',
      hasStatus: true,
      statusType: (row) => row.type === 'entrada' ? 'success' : row.type === 'transferencia' ? 'info' : 'error',
      width: '15%'
    },
    {
      header: 'Cantidad',
      accessor: 'quantity',
      width: '15%',
      render: (row) => `${formatPrice(Number(row.quantity || 0))} ${row.product?.type_measure?.code || ''}`,
      isMobileSubtitle: true,
      mobileRender: (row) => (
        <>
          {formatPrice(Number(row.quantity || 0))} {row.product?.type_measure?.code || ''} • <LiteralDateCell dateStr={row.date} />
        </>
      )
    },
    {
      header: 'Fecha',
      accessor: 'date',
      width: '15%',
      render: (row) => <LiteralDateCell dateStr={row.date} />
    },
    {
      header: 'Observaciones',
      accessor: 'observations',
      width: '18%',
      render: (row) => (
        <div 
          style={{ 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            maxWidth: '150px' 
          }} 
          title={row.observations}
        >
          {row.observations || '--'}
        </div>
      )
    },
    {
      header: 'Estado',
      accessor: 'estado_texto',
      hasStatusDot: true,
      statusType: (row) => row.estado === 'anulado' ? 'error' : 'info',
      width: '12%',
      isMobileStatus: true
    }
  ] : [
    {
      header: 'Nº',
      accessor: 'numero_orden',
      width: '5%',
      render: (row) => row.numero_orden || '--'
    },
    {
      header: 'Detalle',
      accessor: 'detalle',
      style: { fontWeight: 600, color: '#333' },
      width: '20%',
      render: (row) => getProductName(row),
      isMobileMain: true,
      mobileIcon: (row) => row.type === 'entrada' ? 'plus' : (row.type === 'transferencia' ? 'transfer' : 'minus'),
      mobileIconType: (row) => row.type === 'entrada' ? 'default' : (row.type === 'transferencia' ? 'info' : 'error')
    },
    {
      header: 'Tipo',
      accessor: 'tipo_texto',
      hasStatus: true,
      statusType: (row) => row.type === 'entrada' ? 'success' : row.type === 'transferencia' ? 'info' : 'error',
      width: '15%'
    },
    {
      header: 'Fecha',
      accessor: 'fecha',
      width: '10%',
      render: (row) => <LiteralDateCell dateStr={row.fecha} />
    },
    {
      header: 'Cliente',
      accessor: 'cliente_proveedor',
      width: '20%',
      render: (row) => getClientProviderName(row)
    },
    {
      header: 'Estado',
      accessor: 'estado_texto',
      hasStatusDot: true,
      statusType: (row) => row.estado === 'anulado' ? 'error' : 'info',
      width: '12%',
      isMobileStatus: true
    },
    {
      header: 'Total',
      accessor: 'total',
      width: '13%',
      render: (row) => {
        let subtotal = row.subtotal !== undefined ? row.subtotal : (row.productos || []).reduce((sum, p) => sum + (parseFloat(p.subtotal) || 0), 0);
        subtotal = Math.round(subtotal * 10) / 10;
        const descuento = parseFloat(row.descuento) || 0;
        const aumento = parseFloat(row.aumento) || 0;
        const esPorcentaje = row.porcentaje;
        
        const dateStr = row.fecha ? (row.fecha.split('T')[0] || row.fecha.substring(0, 10)) : '';
        const isLegacyPercentage = esPorcentaje && dateStr && dateStr <= LEGACY_PERCENTAGE_CUTOFF_DATE;
        
        const descCalculado = esPorcentaje 
            ? (isLegacyPercentage ? descuento : Math.round((subtotal * descuento / 100) * 10) / 10) 
            : descuento;
        const aumCalculado = esPorcentaje 
            ? (isLegacyPercentage ? aumento : Math.round((subtotal * aumento / 100) * 10) / 10) 
            : aumento;
        let totalFinal = subtotal - descCalculado + aumCalculado;
        
        totalFinal = Math.round(totalFinal * 10) / 10;
        return `Bs. ${formatPrice(totalFinal)}`;
      },
      isMobileSubtitle: true,
      mobileRender: (row) => {
        let subtotal = row.subtotal !== undefined ? row.subtotal : (row.productos || []).reduce((sum, p) => sum + (parseFloat(p.subtotal) || 0), 0);
        subtotal = Math.round(subtotal * 10) / 10;
        const descuento = parseFloat(row.descuento) || 0;
        const aumento = parseFloat(row.aumento) || 0;
        const esPorcentaje = row.porcentaje;
        const dateStr = row.fecha ? (row.fecha.split('T')[0] || row.fecha.substring(0, 10)) : '';
        const isLegacyPercentage = esPorcentaje && dateStr && dateStr <= LEGACY_PERCENTAGE_CUTOFF_DATE;
        const descCalculado = esPorcentaje ? (isLegacyPercentage ? descuento : Math.round((subtotal * descuento / 100) * 10) / 10) : descuento;
        const aumCalculado = esPorcentaje ? (isLegacyPercentage ? aumento : Math.round((subtotal * aumento / 100) * 10) / 10) : aumento;
        let totalFinal = subtotal - descCalculado + aumCalculado;
        totalFinal = Math.round(totalFinal * 10) / 10;
        return (
          <>
            Bs. {formatPrice(totalFinal)} • <LiteralDateCell dateStr={row.fecha || dateStr} />
          </>
        );
      }
    }
  ];

  const mappedMovimientos = useMemo(() => {
    return movimientos.map(m => ({
      ...m,
      tipo_texto: m.type === 'entrada' ? 'Entrada' : m.type === 'transferencia' ? 'Transferencia' : 'Salida',
      estado_texto: m.estado === 'anulado' ? 'Anulado' : 'Finalizado'
    }));
  }, [movimientos]);

  return (
    <>
      <NavBar />
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea} onScroll={handleScroll}>
          <h1 className={styles.title}>{getTitulo()}</h1>
          <Tabla
            data={mappedMovimientos}
            columns={columns}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            acciones={tableActions}
            buttonLabel="Nuevo Movimiento"
            onButtonClick={() => {
              if (isAcopio) {
                navigate('/materia-prima/salidas');
              } else {
                navigate('/almacen/salidas');
              }
            }}
            searchKeys={isAcopio ? ['product.name'] : ['concepto']}
            sortKey={isAcopio ? 'product.name' : 'concepto'}
            onLoadMore={handleLoadMore}
            onRowClick={(movimiento) => {
              setMovimientoSeleccionado(movimiento);
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
        method="getAll"
        methodParams={[
          filtroTipo,
          filtroEstado,
          null, // ordenamiento
          isAcopio ? null : filtroCliente,
          null, // sucuIdParam
          debouncedSearch,
          filtroFecha,
          isAcopio ? filtroProveedor : null
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

      {isAcopio ? (
        <ViewInfoAcopio
          isOpen={modalInfoOpen}
          onClose={() => setModalInfoOpen(false)}
          movimiento={movimientoSeleccionado}
          onEliminar={handleMovimientoEliminado}
          onAnular={handleMovimientoAnulado}
        />
      ) : (
        <ViewInfo
          isOpen={modalInfoOpen}
          onClose={() => setModalInfoOpen(false)}
          movimiento={movimientoSeleccionado}
          onEliminar={handleMovimientoEliminado}
          onAnular={handleMovimientoAnulado}
        />
      )}

      <EliminarMovimiento
        isOpen={modalEliminarOpen}
        onClose={() => setModalEliminarOpen(false)}
        movimientoSeleccionado={movimientoSeleccionado}
        onEliminar={handleMovimientoEliminado}
      />

      <AnularMovimiento
        isOpen={modalAnularOpen}
        onClose={() => setModalAnularOpen(false)}
        movimientoSeleccionado={movimientoSeleccionado}
        onAnular={handleMovimientoAnulado}
      />
      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Movimientos;
