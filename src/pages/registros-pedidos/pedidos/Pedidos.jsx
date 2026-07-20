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
import pedidosAcopioService from '../../../services/pedidosAcopioService';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import useFormatNumber from '../../../hooks/useFormatNumber';
import useFechaLiteral from '../../../hooks/useFechaLiteral';
import ViewInfo from './modals/ViewInfo';
import ViewInfoAcopio from './modals/ViewInfoAcopio';
import EliminarPedido from './modals/EliminarPedido';
import AnularEntrega from './modals/AnularEntrega';
import ProductosMovimiento from '../movimientos/modals/ProductosMovimiento';

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
  const [, setError] = useState(null);

  // Paginación y filtros
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState(null);
  const [filtroResponsable, setFiltroResponsable] = useState(null);
  
  // Modals state
  const [modalInfoOpen, setModalInfoOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [modalAnularOpen, setModalAnularOpen] = useState(false);
  const [modalProductosOpen, setModalProductosOpen] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

  const [debouncedSearch] = useDebounce(search, 500);
  const [tablaFilters, setTablaFilters] = useState({});

  const handleFiltersChange = (filters) => {
    setTablaFilters(filters);

    const estado = filters.estado && filters.estado.length > 0 ? filters.estado[0] : null;
    setFiltroEstado(estado);

    const responsable_id = filters.responsable_id && filters.responsable_id.length > 0 ? filters.responsable_id[0] : null;
    setFiltroResponsable(responsable_id);

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
        id: 'responsable_id',
        title: 'Solicitante',
        singleSelect: true,
        fetchOptions: async () => {
          const res = await currentService.getSolicitantesUnicos();
          if (res && res.success && res.data) {
            return res.data.map(item => ({ label: item.name, value: String(item.id) }));
          }
          return [];
        }
      },
      {
        id: 'fecha',
        title: 'Fecha',
        type: 'date'
      }
    ];
  }, [currentService]);

  // Resetear página cuando cambia la ruta
  useEffect(() => {
    setPage(1);
    setSearch('');
    setTablaFilters({});
    setFiltroEstado(null);
    setFiltroFecha(null);
    setFiltroResponsable(null);
  }, [location.pathname]);

  // Resetear página y limpiar cuando cambian los filtros o la búsqueda
  useEffect(() => {
    setPedidos([]);
    setIsLoading(true);
    setPage(1);
  }, [debouncedSearch, filtroEstado, filtroFecha, filtroResponsable, isAcopio]);

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
    setPedidoSeleccionado(prev => prev && prev.id === updatedPedido.id ? { ...prev, ...updatedPedido } : prev);
  };

  const tableActions = [
    {
      name: 'Productos',
      icon: 'box',
      show: () => true,
      onClick: (pedido) => {
        setPedidoSeleccionado(pedido);
        setModalProductosOpen(true);
      }
    },
    {
      name: 'Editar', 
      icon: 'edit', 
      show: (row) => !row.destino && row.estado !== 'Entregado' && row.estado !== 'Completado',
      onClick: (pedido) => {
        const editarData = {
          id: pedido.id,
          prices_types_id: pedido.precio_id || pedido.precio?.id,
          modalidad: pedido.agrupado ? 'grupos' : 'unidades',
          observaciones: pedido.observaciones === '--' ? '' : (pedido.observaciones || ''),
          sucursal_destino_id: pedido.sucursal_destino_id || pedido.sucursal_destino?.id,
          productos_lista: (pedido.pedido_almacen_detalle || []).map(p => ({
            id: p.producto_almacen_id || p.producto_almacen?.id || p.id,
            cantidad: parseFloat(p.cantidad) || 1
          }))
        };
        sessionStorage.setItem('pedidoParaEditar', JSON.stringify(editarData));
        navigate('/almacen/pedidos/editar');
      }
    },
    {
      name: 'Eliminar', 
      icon: 'trash', 
      show: (row) => !row.destino && row.estado !== 'Completado' && row.estado !== 'Entregado',
      onClick: (pedido) => {
        setPedidoSeleccionado(pedido);
        setModalEliminarOpen(true);
      }
    },
  ];

  const columns = isAcopio ? [
    {
      header: 'Producto',
      accessor: 'producto_nombre',
      style: { fontWeight: 600, color: '#333' },
      width: '25%',
      isMobileMain: true,
      mobileIcon: () => 'file',
      mobileIconType: () => 'default'
    },
    {
      header: 'Solicitante',
      accessor: 'solicitante_nombre',
      width: '20%'
    },
    {
      header: 'Cantidad',
      accessor: 'cantidad_texto',
      width: '15%',
      isMobileSubtitle: true,
      mobileRender: (row) => (
        <>
          {row.cantidad_texto} • <LiteralDateCell dateStr={row.fecha || row.created_at} />
        </>
      )
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
      width: '20%',
      isMobileStatus: true
    }
  ] : [
    {
      header: 'Nº',
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
      width: '15%',
      isMobileMain: true,
      mobileIcon: () => 'file',
      mobileIconType: () => 'default'
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
      width: '15%',
      isMobileSubtitle: true,
      mobileRender: (row) => (
        <>
          Nº {row.numero_pedido || '--'} • Bs. {row.total_formateado} • <LiteralDateCell dateStr={row.fecha || row.created_at} />
        </>
      )
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
      width: '15%',
      isMobileStatus: true
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
      <NavBar />
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
          filtroResponsable, // responsableId
          filtroFecha ? {
            inicio: filtroFecha.inicio ? new Date(filtroFecha.inicio).toISOString() : null,
            fin: filtroFecha.fin ? new Date(filtroFecha.fin).toISOString() : null,
          } : null // filtroFecha
        ] : [
          debouncedSearch,
          filtroEstado,
          'fecha_desc',
          null, // sucuIdParam
          filtroResponsable, // responsableId
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

      {isAcopio ? (
        <ViewInfoAcopio 
          isOpen={modalInfoOpen} 
          setIsOpen={setModalInfoOpen} 
          pedido={pedidoSeleccionado}
          onEliminar={(id) => handlePedidoEliminado(id)}
          onAnular={() => setModalAnularOpen(true)}
          onEdit={(updated) => handlePedidoActualizado(updated)}
        />
      ) : (
        <ViewInfo 
          isOpen={modalInfoOpen} 
          setIsOpen={setModalInfoOpen} 
          pedido={pedidoSeleccionado}
          onEliminar={(id) => handlePedidoEliminado(id)}
          onAnular={() => setModalAnularOpen(true)}
          onIngresar={(updated) => handlePedidoActualizado(updated)}
        />
      )}

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

      <ProductosMovimiento
        isOpen={modalProductosOpen}
        onClose={() => setModalProductosOpen(false)}
        pedido={pedidoSeleccionado}
      />
      
      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Pedidos;
