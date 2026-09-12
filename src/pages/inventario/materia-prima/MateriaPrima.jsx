import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import MenuSide from '../../../components/essentials/MenuSide';
import styles from '../../../pages/home/View.module.css';
import Tabla from '../../../components/common/information/Tabla';
import FetchDataProgressive from '../../../components/mixed/FetchDataProgressive';
import productsAcopioService from '../../../services/productsAcopioService';
import AgregarEditarProducto from './modals/AgregarEditarProducto';
import EliminarProducto from './modals/EliminarProducto';
import ViewInfo from './modals/ViewInfo';
import CanastaMateriaPrima from './canasta/CanastaMateriaPrima';
import ConfirmacionSalida from './canasta/confirmations/ConfirmacionSalida';
import ConfirmacionEntrada from './canasta/confirmations/ConfirmacionEntrada';
import { useCanasta } from './hooks/useCanasta';
import { useToast } from '../../../context/ToastContext';
import useFormatNumber from '../../../hooks/useFormatNumber';
import BotonFlotante from '../../../components/common/botones/BotonFlotante';

const MateriaPrima = () => {
  const { showDanger } = useToast();
  const { formatPrice } = useFormatNumber();
  const { isLargeScreen } = useLayout();
  const location = useLocation();

  const path = location.pathname;
  const isCanastaMode = path.includes('/materia-prima/pedidos');
  const isHideActionsMode = path.includes('/materia-prima/entradas') || path.includes('/materia-prima/salidas') || isCanastaMode;
  const modoCanastaStr = path.includes('/materia-prima/pedidos/copia') ? 'COPIA_PEDIDO' : 'NUEVO PEDIDO';
  const { canasta, setCanasta, agregarProducto, eliminarProducto, actualizarCantidad, actualizarMedida, vaciarCanasta } = useCanasta();

  // Load copied data
  useEffect(() => {
    if (path.includes('/materia-prima/pedidos/copia')) {
      const rawData = sessionStorage.getItem('pedidoAcopioParaCopiar');
      if (rawData) {
        setCanasta(JSON.parse(rawData));
        sessionStorage.removeItem('pedidoAcopioParaCopiar'); // clean up after loading
      }
    }
  }, [path, setCanasta]);

  // Determinar título basado en la ruta
  const getTitulo = () => {
    const path = location.pathname;
    if (path.includes('/materia-prima/entradas')) return 'Entrada';
    if (path.includes('/materia-prima/salidas')) return 'Salida';
    if (path.includes('/materia-prima/pedidos')) return 'Nuevo Pedido';
    if (path.includes('/materia-prima/gestionar')) return 'Gestionar';
    if (path.includes('/materia-prima/pesaje')) return 'Pesaje';
    return 'Materia Prima';
  };

  const [productos, setProductos] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [, setError] = useState(null);

  // Paginación y filtros
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState(null);
  const [sortOrder, setSortOrder] = useState('name_asc');

  // Modals state
  const [modalAgregarEditarOpen, setModalAgregarEditarOpen] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [productoEliminar, setProductoEliminar] = useState(null);
  const [modalInfoOpen, setModalInfoOpen] = useState(false);
  const [modalSalidaOpen, setModalSalidaOpen] = useState(false);
  const [modalEntradaOpen, setModalEntradaOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [returnToViewOnDeleteClose, setReturnToViewOnDeleteClose] = useState(false);
  const [isCanastaMobileOpen, setIsCanastaMobileOpen] = useState(false);

    const [debouncedSearch] = useDebounce(search, 500);
  const [tablaFilters, setTablaFilters] = useState({});

  const handleFiltersChange = (filters) => {
    setTablaFilters(filters);
    let order = 'name_asc';
    if (filters.sort_order && filters.sort_order.length > 0) {
      order = filters.sort_order[0];
    }
    setSortOrder(order);

    const catIdsStr = (filters.category_id && filters.category_id.length > 0) ? filters.category_id.join(',') : null;
    setCategoriaId(catIdsStr);
  };

  const dynamicFilters = useMemo(() => [
    {
      id: 'sort_order',
      title: 'Ordenamiento',
      singleSelect: true,
      options: [
        { label: 'A - Z', value: 'name_asc' },
        { label: 'Z - A', value: 'name_desc' },
        { label: 'Mayor stock', value: 'stock_desc' },
        { label: 'Menor stock', value: 'stock_asc' }
      ]
    },
    {
      id: 'category_id',
      title: 'Categorías'
    }
  ], []);

  // Resetear página cuando cambia la ruta
  useEffect(() => {
    setPage(1);
  }, [location.pathname]);

  // Resetear página y limpiar productos cuando cambian los filtros o la búsqueda
  useEffect(() => {
    setProductos([]);
    setIsLoading(true);
    setPage(1);
  }, [debouncedSearch, categoriaId, sortOrder]);

  const handleProductosLoaded = useCallback((data) => {
    setProductos(data);
    setError(null);
  }, [setProductos]);

  const handleDataAccumulated = useCallback((newData) => {
    setProductos(prev => {
      // Evitar duplicados
      const existingIds = new Set(prev.map(p => p.id));
      const uniqueNewData = newData.filter(p => !existingIds.has(p.id));
      return [...prev, ...uniqueNewData];
    });
  }, [setProductos]);

  const handleLoadingStart = useCallback(() => {
    if (page === 1) {
      if (productos.length === 0) {
        setIsLoading(true);
      }
    } else {
      setIsLoadingMore(true);
    }
  }, [page, productos.length]);

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
      name: 'Detalles', icon: 'show', onClick: (producto) => {
        setProductoSeleccionado(producto);
        setModalInfoOpen(true);
      }
    },
    {
      name: 'Editar', icon: 'edit', onClick: (producto) => {
        setProductoEditando(producto);
        setModalAgregarEditarOpen(true);
      }
    },
    {
      name: 'Eliminar', icon: 'trash', onClick: (producto) => {
        setProductoEliminar(producto);
        setModalEliminarOpen(true);
      }
    }
  ];

  const columns = [
    {
      header: 'Producto',
      accessor: 'name',
      style: { fontWeight: 600, color: '#333' },
      width: '30%',
      isMobileMain: true,
      render: (row) => {
        const inCanasta = canasta.some(p => p.id === row.id);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isCanastaMode && inCanasta && (
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-color)',
                flexShrink: 0
              }} title="En canasta" />
            )}
            <span>{row.name}</span>
          </div>
        );
      }
    },
    {
      header: 'Descripción',
      accessor: 'description',
      width: '25%',
      render: (row) => row.description || '--'
    },
    {
      header: 'Cantidad',
      accessor: 'quantity',
      width: '15%',
      isMobileStatus: true,
      statusType: (row) => {
        const qty = Number(row.quantity ?? 0);
        const minimo = Number(row.stock_minimo ?? 0);
        if (minimo > 0) {
          if (qty <= minimo) return 'error';
          if (qty <= minimo * 1.5) return 'warning';
        } else {
          if (qty <= 0) return 'error';
          if (qty <= 5) return 'warning';
        }
        return 'info';
      },
      mobileRender: (row) => {
        const qty = Number(row.quantity ?? 0);
        return `${formatPrice(qty)} ${row.type_measure?.code || ''}`.trim();
      },
      render: (row) => {
        const qty = Number(row.quantity ?? 0);
        const minimo = Number(row.stock_minimo ?? 0);
        let color;
        if (minimo > 0) {
          if (qty <= minimo) {
            color = 'var(--error-color)';
          } else if (qty <= minimo * 1.5) {
            color = 'var(--warning-color)';
          } else {
            color = 'var(--info-color)';
          }
        } else {
          if (qty <= 0) {
            color = 'var(--error-color)';
          } else if (qty <= 5) {
            color = 'var(--warning-color)';
          } else {
            color = 'var(--info-color)';
          }
        }
        return (
          <span style={{
            color,
            fontWeight: 600,
            padding: '2px 10px',
            display: 'inline-block',
            fontSize: '12px',
          }}>
            {formatPrice(qty)} {row.type_measure?.code || ''}
          </span>
        );
      }
    },
    {
      header: 'Categoría',
      accessor: 'category_name',
      width: '20%',
      isMobileSubtitle: true,
      render: (row) => row.category?.name || 'Sin categoría'
    }
  ];

  return (
    <>
      <NavBar />
      <div className={styles.dashboardContainer} style={{ display: 'flex', flexDirection: 'row', width: '100%', overflow: 'hidden' }}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea} onScroll={handleScroll} style={{ flex: 1, transition: 'flex 0.3s' }}>
          <h1 className={styles.title}>{getTitulo()}</h1>
          <Tabla
            data={productos}
            columns={columns}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            acciones={isHideActionsMode ? [] : tableActions}
            buttonLabel={isHideActionsMode ? null : "Nuevo Producto"}
            onButtonClick={isHideActionsMode ? undefined : () => {
              setProductoEditando(null);
              setModalAgregarEditarOpen(true);
            }}
            searchKeys={['name', 'description']}
            sortKey="name"
            onLoadMore={handleLoadMore}
            onRowClick={(producto) => {
              if (isCanastaMode) {
                agregarProducto(producto);
              } else if (path.includes('/materia-prima/salidas')) {
                const qty = producto.quantity !== undefined && producto.quantity !== null ? producto.quantity : 0;
                const rawStock = 0; // Ajustar según lógica de stock real
                if (modoCanastaStr === 'SALIDA' && qty <= rawStock) {
                  showDanger('Stock insuficiente', 'El producto no tiene stock suficiente para realizar una salida');
                  return;
                }
                setProductoSeleccionado(producto);
                setModalSalidaOpen(true);
              } else if (path.includes('/materia-prima/entradas')) {
                setProductoSeleccionado(producto);
                setModalEntradaOpen(true);
              } else {
                setProductoSeleccionado(producto);
                setModalInfoOpen(true);
              }
            }}
            remote={true}
            searchValue={search}
            onSearchChange={setSearch}
            externalFilters={tablaFilters}
            onFiltersChange={handleFiltersChange}
            filters={dynamicFilters}
          />
        </div>
        {isCanastaMode && (
          <CanastaMateriaPrima 
            isOpen={isLargeScreen || isCanastaMobileOpen}
            onClose={() => setIsCanastaMobileOpen(false)}
            canasta={canasta} 
            actualizarCantidad={actualizarCantidad} 
            actualizarMedida={actualizarMedida}
            eliminarProducto={eliminarProducto} 
            vaciarCanasta={vaciarCanasta}
            modo={modoCanastaStr} 
          />
        )}
      </div>
      <FetchDataProgressive
        service={productsAcopioService}
        serviceName="productsAcopioService"
        method="getAll"
        methodParams={[debouncedSearch, categoriaId, sortOrder]} 
        isOpen={true}
        page={page}
        limit={30}
        onDataLoaded={handleProductosLoaded}
        onDataAccumulated={handleDataAccumulated}
        onHasMorePagesChange={setHasMorePages}
        onLoadingStart={handleLoadingStart}
        onLoadingEnd={handleLoadingEnd}
        onError={handleError}
      />

      <AgregarEditarProducto
        isOpen={modalAgregarEditarOpen}
        onClose={() => setModalAgregarEditarOpen(false)}
        productoSeleccionado={productoEditando}
        onGuardar={(nuevoProducto) => {
          setProductos(prev => {
            if (productoEditando) {
              return prev.map(p => p.id === nuevoProducto.id ? { ...p, ...nuevoProducto } : p);
            }
            return [nuevoProducto, ...prev];
          });
          if (productoSeleccionado && productoSeleccionado.id === nuevoProducto.id) {
            setProductoSeleccionado(prev => ({ ...prev, ...nuevoProducto }));
          }
        }}
      />

      <EliminarProducto
        isOpen={modalEliminarOpen}
        onClose={(wasDeleted) => {
          setModalEliminarOpen(false);
          if (returnToViewOnDeleteClose && wasDeleted !== true) {
            setModalInfoOpen(true);
          }
          setReturnToViewOnDeleteClose(false);
        }}
        productoSeleccionado={productoEliminar}
        onEliminar={(idEliminado) => {
          setProductos(prev => prev.filter(p => p.id !== idEliminado));
          setReturnToViewOnDeleteClose(false);
          setModalInfoOpen(false);
        }}
      />

      <ViewInfo
        isOpen={modalInfoOpen}
        onClose={() => setModalInfoOpen(false)}
        producto={productoSeleccionado}
        onEdit={(producto) => {
          setProductoEditando(producto);
          setModalAgregarEditarOpen(true);
        }}
        onDelete={(producto) => {
          setReturnToViewOnDeleteClose(true);
          setModalInfoOpen(false);
          setProductoEliminar(producto);
          setModalEliminarOpen(true);
        }}
      />

      <ConfirmacionSalida
        isOpen={modalSalidaOpen}
        onClose={() => setModalSalidaOpen(false)}
        producto={productoSeleccionado}
      />
      
      <ConfirmacionEntrada
        isOpen={modalEntradaOpen}
        onClose={() => setModalEntradaOpen(false)}
        producto={productoSeleccionado}
      />

      {/* Botón flotante para la canasta en móvil */}
      {!isLargeScreen && isCanastaMode && (
        <BotonFlotante
          iconName="cart"
          onClick={() => setIsCanastaMobileOpen(true)}
          ariaLabel="Ver Canasta"
          style={{ bottom: '100px' }}
          badgeCount={canasta.length}
        />
      )}

      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default MateriaPrima;