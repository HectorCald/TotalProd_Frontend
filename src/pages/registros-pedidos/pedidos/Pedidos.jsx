import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import styles from '../../../pages/home/View.module.css';
import Tabla from '../../../components/common/information/Tabla';
import FetchDataProgressive from '../../../components/mixed/FetchDataProgressive';
import pedidosAcopioService from '../../../services/pedidosAcopioService';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import useFormatNumber from '../../../hooks/useFormatNumber';
import useFechaLiteral from '../../../hooks/useFechaLiteral';
import ViewInfo from './modals/ViewInfo';
import EliminarPedido from './modals/EliminarPedido';
import AnularEntrega from './modals/AnularEntrega';

const LiteralDateCell = ({ dateStr }) => {
  const cleanDateStr = dateStr ? dateStr.slice(0, 10) : '';
  const literal = useFechaLiteral(cleanDateStr, true);
  return <span>{literal || (dateStr ? new Date(dateStr).toLocaleDateString() : '')}</span>;
};

const Pedidos = () => {
  const { isLargeScreen } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();
  const { formatPrice } = useFormatNumber();

  const isAcopio = location.pathname.includes('/pedidos/acopio');
  const getTitulo = () => {
    return isAcopio ? 'Pedidos de Materia Prima' : 'Pedidos de Almacén';
  };

  const currentService = isAcopio ? pedidosAcopioService : pedidosAlmacenService;
  const currentServiceName = isAcopio ? 'pedidosAcopioService' : 'pedidosAlmacenService';

  const [pedidos, setPedidos] = useState([]);
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
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [modalAnularOpen, setModalAnularOpen] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

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
          { label: 'Pendientes', value: 'Pendiente' },
          { label: 'Entregados', value: 'Entregado' },
          { label: 'Completados', value: 'Completado' }
        ]
      },
      {
        id: 'fecha',
        title: 'Fecha',
        type: 'date'
      }
    ];
  }, []);

  // Resetear página cuando cambia la ruta
  useEffect(() => {
    setPage(1);
    setSearch('');
    setTablaFilters({});
    setFiltroEstado(null);
    setFiltroFecha(null);
  }, [location.pathname]);

  // Resetear página y limpiar cuando cambian los filtros o la búsqueda
  useEffect(() => {
    setPedidos([]);
    setIsLoading(true);
    setPage(1);
  }, [debouncedSearch, filtroEstado, filtroFecha, isAcopio]);

  const handleDataLoaded = useCallback((data) => {
    setPedidos(data);
    setError(null);
  }, [setPedidos]);

  const handleDataAccumulated = useCallback((newData) => {
    setPedidos(prev => {
      const existingIds = new Set(prev.map(d => d.id));
      const uniqueNewData = newData.filter(d => !existingIds.has(d.id));
      return [...prev, ...uniqueNewData];
    });
  }, [setPedidos]);

  const handleLoadingStart = useCallback(() => {
    if (page === 1) {
      if (pedidos.length === 0) {
        setIsLoading(true);
      }
    } else {
      setIsLoadingMore(true);
    }
  }, [page, pedidos.length]);

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

  const handlePedidoEliminado = (id) => {
    setPedidos(prev => prev.filter(p => p.id !== id));
  };

  const handlePedidoActualizado = (updatedPedido) => {
    setPedidos(prev => 
      prev.map(p => p.id === updatedPedido.id ? { ...p, ...updatedPedido } : p)
    );
  };

  const tableActions = [
    {
      name: 'Ver Detalles', 
      icon: 'show', 
      onClick: (pedido) => {
        setPedidoSeleccionado(pedido);
        setModalInfoOpen(true);
      }
    },
    {
      name: 'Editar', 
      icon: 'edit', 
      show: (row) => row.estado !== 'Entregado' && row.estado !== 'Completado',
      onClick: (pedido) => {
        // Sin funcionamiento de momento, solicitado así
      }
    },
    {
      name: 'Eliminar', 
      icon: 'trash', 
      show: (row) => row.estado !== 'Completado' && row.estado !== 'Entregado',
      onClick: (pedido) => {
        setPedidoSeleccionado(pedido);
        setModalEliminarOpen(true);
      }
    },
    {
      name: 'Anular Entrega', 
      icon: 'block', 
      show: (row) => row.estado === 'Entregado',
      onClick: (pedido) => {
        setPedidoSeleccionado(pedido);
        setModalAnularOpen(true);
      }
    }
  ];

  const columns = isAcopio ? [
    {
      header: 'Producto',
      accessor: 'producto_nombre',
      style: { fontWeight: 600, color: '#333' },
      width: '25%',
    },
    {
      header: 'Solicitante',
      accessor: 'solicitante_nombre',
      width: '20%'
    },
    {
      header: 'Cantidad',
      accessor: 'cantidad_texto',
      width: '15%'
    },
    {
      header: 'Fecha',
      accessor: 'fecha',
      width: '20%',
      render: (row) => <LiteralDateCell dateStr={row.fecha || row.created_at} />
    },
    {
      header: 'Estado',
      accessor: 'estado_texto',
      hasStatusDot: true,
      statusType: (row) => row.estado === 'Completado' ? 'info' : row.estado === 'Entregado' ? 'warning' : 'error',
      width: '20%'
    }
  ] : [
    {
      header: 'Nº Pedido',
      accessor: 'numero_pedido',
      style: { fontWeight: 600, color: '#333' },
      width: '10%'
    },
    {
      header: 'Sucursal',
      accessor: 'sucursal_nombre',
      width: '15%'
    },
    {
      header: 'Solicitante',
      accessor: 'solicitante_nombre',
      width: '15%'
    },
    {
      header: 'Fecha',
      accessor: 'fecha',
      width: '15%',
      render: (row) => <LiteralDateCell dateStr={row.fecha || row.created_at} />
    },
    {
      header: 'Total',
      accessor: 'total_formateado',
      width: '15%'
    },
    {
      header: 'Observaciones',
      accessor: 'observaciones',
      width: '15%'
    },
    {
      header: 'Estado',
      accessor: 'estado_texto',
      hasStatusDot: true,
      statusType: (row) => row.estado === 'Completado' ? 'info' : row.estado === 'Entregado' ? 'warning' : 'error',
      width: '15%'
    }
  ];

  // Calcular campos derivados (para filtros y visualización en la Tabla)
  const mappedPedidos = useMemo(() => {
    return pedidos.map(pedido => {
      let estadoTexto = pedido.estado || 'Pendiente';
      
      if (isAcopio) {
        return {
          ...pedido,
          producto_nombre: pedido.producto_acopio?.name || 'Producto desconocido',
          solicitante_nombre: pedido.user?.name || pedido.personal?.name || 'Usuario desconocido',
          cantidad_texto: `${pedido.cantidad || 0} ${pedido.tipo_medida || ''}`,
          estado_texto: estadoTexto
        };
      } else {
        const total = (pedido.pedido_almacen_detalle || []).reduce((sum, detalle) => {
            const precio = detalle.precio || 0;
            const cantidad = detalle.cantidad || 0;
            let subtotal = precio * cantidad;
            if (pedido.agrupado && detalle.producto_almacen?.grup) {
                subtotal = Math.round(subtotal);
            }
            return sum + subtotal;
        }, 0);

        return {
          ...pedido,
          numero_pedido: pedido.numero_pedido !== undefined && pedido.numero_pedido !== null ? `${pedido.numero_pedido}` : '0',
          sucursal_nombre: pedido.sucursal?.name || 'Sucursal desconocida',
          solicitante_nombre: pedido.user?.name || pedido.personal?.name || 'Usuario desconocido',
          total_formateado: formatPrice(total),
          observaciones: pedido.observaciones || '--',
          estado_texto: estadoTexto
        };
      }
    });
  }, [pedidos, isAcopio, formatPrice]);

  return (
    <>
      {isLargeScreen && <NavBar />}
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea} onScroll={handleScroll}>
          <div className={styles.header}>
            <h1 className={styles.title}>{getTitulo()}</h1>
          </div>

          <Tabla
            columns={columns}
            data={mappedPedidos}
            onRowClick={(row) => {
              setPedidoSeleccionado(row);
              setModalInfoOpen(true);
            }}
            acciones={tableActions}
            buttonLabel="Nuevo Pedido"
            onButtonClick={() => {
              if (isAcopio) {
                navigate('/materia-prima/pedidos');
              } else {
                navigate('/almacen/pedidos');
              }
            }}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            remote={true}
            emptyMessage={debouncedSearch ? "No se encontraron pedidos" : "No hay registros"}
            emptyDetail={debouncedSearch ? "Intenta con otros términos de búsqueda" : "Aún no hay pedidos registrados"}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar pedidos..."
            filters={dynamicFilters}
            onFiltersChange={handleFiltersChange}
            externalFilters={tablaFilters}
          />
        </div>
      </div>

      <FetchDataProgressive
        service={currentService}
        method="getAll"
        methodParams={isAcopio ? [
          debouncedSearch,
          filtroEstado,
          'fecha_desc',
          null, // responsableId
          filtroFecha ? {
            inicio: filtroFecha.inicio ? new Date(filtroFecha.inicio).toISOString() : null,
            fin: filtroFecha.fin ? new Date(filtroFecha.fin).toISOString() : null,
          } : null // filtroFecha
        ] : [
          debouncedSearch,
          filtroEstado,
          'fecha_desc',
          null, // sucuIdParam
          null, // responsableId
          filtroFecha ? {
            inicio: filtroFecha.inicio ? new Date(filtroFecha.inicio).toISOString() : null,
            fin: filtroFecha.fin ? new Date(filtroFecha.fin).toISOString() : null,
          } : null // filtroFecha
        ]}
        serviceName={currentServiceName}
        isOpen={true}
        page={page}
        limit={30}
        onDataLoaded={handleDataLoaded}
        onDataAccumulated={handleDataAccumulated}
        onLoadingStart={handleLoadingStart}
        onLoadingEnd={handleLoadingEnd}
        onError={handleError}
        onHasMorePagesChange={setHasMorePages}
      />

      <ViewInfo 
        isOpen={modalInfoOpen} 
        setIsOpen={setModalInfoOpen} 
        pedido={pedidoSeleccionado}
        isAcopio={isAcopio}
        onEliminar={() => setModalEliminarOpen(true)}
        onAnular={() => setModalAnularOpen(true)}
      />

      <EliminarPedido 
        isOpen={modalEliminarOpen} 
        setIsOpen={setModalEliminarOpen} 
        pedido={pedidoSeleccionado}
        isAcopio={isAcopio}
        onDeleted={(id) => {
          handlePedidoEliminado(id);
          setModalInfoOpen(false);
        }}
      />

      <AnularEntrega 
        isOpen={modalAnularOpen} 
        setIsOpen={setModalAnularOpen} 
        pedido={pedidoSeleccionado}
        isAcopio={isAcopio}
        onAnulado={(updated) => {
          handlePedidoActualizado(updated);
        }}
      />
    </>
  );
};

export default Pedidos;
