import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { useLayout } from '../../../context/LayoutContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import styles from '../../../pages/home/View.module.css';
import Tabla from '../../../components/common/information/Tabla';
import FetchDataProgressive from '../../../components/mixed/FetchDataProgressive';
import productsAlmacenService from '../../../services/productsAlmacenService';
import AgregarEditarProducto from './modals/AgregarEditarProducto';
import EliminarProducto from './modals/EliminarProducto';
import ViewInfo from './modals/ViewInfo';
import CanastaAlmacen from './canasta/CanastaAlmacen';
import { useCanasta } from './hooks/useCanasta';
import { useToast } from '../../../context/ToastContext';

const AlmacenGeneral = () => {
  const { isLargeScreen } = useLayout();
  const location = useLocation();

  const path = location.pathname;
  const isCanastaMode = path.includes('/almacen/salidas') || path.includes('/almacen/entradas') || path.includes('/almacen/pedidos') || path.includes('/almacen/cotizar');
  const modoCanastaStr = path.includes('/almacen/salidas/cotizacion') ? 'VENTA_COTIZACION' : path.includes('/almacen/salidas') ? 'VENTA' : path.includes('/almacen/entradas') ? 'ENTRADA' : path.includes('/almacen/pedidos') ? 'PEDIDO' : 'COTIZACIÓN';
  const { canasta, agregarProducto, eliminarProducto, actualizarCantidad, vaciarCanasta, modoAgrupacion, setModoAgrupacion } = useCanasta();
  const { showDanger } = useToast();
  const navigate = useNavigate();

  // Leer variables de sesión para precargar datos y manejar redirecciones de seguridad
  const preloadedData = useMemo(() => {
    if (modoCanastaStr === 'VENTA_COTIZACION') {
      const rawData = sessionStorage.getItem('cotizacionParaVenta');
      return rawData ? JSON.parse(rawData) : null;
    }
    return null;
  }, [modoCanastaStr]);

  useEffect(() => {
    if (modoCanastaStr === 'VENTA_COTIZACION' && !preloadedData) {
      navigate('/almacen/salidas');
    }
  }, [modoCanastaStr, preloadedData, navigate]);

  // Determinar título basado en la ruta
  const getTitulo = () => {
    const path = location.pathname;
    if (path.includes('/almacen/salidas/cotizacion')) return 'Venta desde Cotización';
    if (path.includes('/almacen/salidas')) return 'Salida o Venta';
    if (path.includes('/almacen/entradas')) return 'Entrada';
    if (path.includes('/almacen/pedidos')) return 'Nuevo Pedido';
    if (path.includes('/almacen/gestionar')) return 'Gestionar';
    if (path.includes('/almacen/conteo')) return 'Conteo';
    if (path.includes('/almacen/cotizar')) return 'Cotizar';
    return 'Almacén General';
  };

  const [productos, setProductos] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

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
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const [debouncedSearch] = useDebounce(search, 500);
  const [tablaFilters, setTablaFilters] = useState({});

  const handleFiltersChange = (filters) => {
    setTablaFilters(filters);
    const order = (filters.sort_order && filters.sort_order[0] === 'desc') ? 'name_desc' : 'name_asc';
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
        { label: 'A - Z', value: 'asc' },
        { label: 'Z - A', value: 'desc' }
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
      header: 'Stock',
      accessor: 'displayStock',
      width: '15%',
      isBadge: true,
      badgeColor: (row) => {
        const stock = Number(row.displayStock ?? row.stock ?? 0);
        const minimo = Number(row.stock_minimo ?? 0);
        if (minimo > 0) {
          if (stock <= minimo) return 'var(--error-color)';
          if (stock <= minimo * 1.5) return 'var(--warning-color)';
          return 'var(--info-color)';
        } else {
          if (stock <= 0) return 'var(--error-color)';
          if (stock <= 5) return 'var(--warning-color)';
          return 'var(--info-color)';
        }
      }
    },
    {
      header: 'Grupo',
      accessor: 'grupo',
      width: '10%',
      render: (row) => {
        const stock = Number(row.displayStock ?? row.stock ?? 0);
        const grup = Number(row.grup ?? 0);
        return grup > 0 ? Math.floor(stock / grup) : '--';
      }
    },
    {
      header: 'Minimo',
      accessor: 'stock_minimo',
      width: '15%'
    },
    {
      header: 'Codigo',
      accessor: 'codigo_barras',
      width: '15%'
    },
    {
      header: 'Categorías',
      accessor: 'category_names',
      width: '20%',
      isBadgeArray: true,
      badgeColor: 'var(--primary-color)'
    }
  ];


  return (
    <>
      {isLargeScreen && <NavBar />}
      <div className={styles.dashboardContainer} style={{ display: 'flex', flexDirection: 'row', width: '100%', overflow: 'hidden' }}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea} onScroll={handleScroll} style={{ flex: 1, transition: 'flex 0.3s' }}>
          <h1 className={styles.title}>{getTitulo()}</h1>
          <Tabla 
            data={productos.map(p => {
              const inCanasta = canasta.find(c => c.id === p.id);
              const qty = inCanasta ? inCanasta.cantidad : 0;
              const qtyUnits = (modoAgrupacion === 'grupo' && p.grup && p.grup > 0) ? (qty * p.grup) : qty;
              const displayStock = (modoCanastaStr === 'VENTA' || modoCanastaStr === 'VENTA_COTIZACION') ? Number(p.stock || 0) - qtyUnits : Number(p.stock || 0);
              return { ...p, displayStock };
            })}
            columns={columns}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            acciones={isCanastaMode ? [] : tableActions}
            buttonLabel={isCanastaMode ? null : "Nuevo Producto"}
            onButtonClick={isCanastaMode ? undefined : () => {
              setProductoEditando(null);
              setModalAgregarEditarOpen(true);
            }}
            searchKeys={['name', 'codigo_barras']}
            sortKey="name"
            onLoadMore={handleLoadMore}
            onRowClick={(producto) => {
              if (isCanastaMode) {
                const inCanasta = canasta.find(p => p.id === producto.id);
                const qty = inCanasta ? inCanasta.cantidad : 0;
                const rawStock = Number(producto.stock || 0);
                const esPorGrupo = modoAgrupacion === 'grupo' && producto.grup && producto.grup > 0;
                const baseStockValue = esPorGrupo ? Math.floor(rawStock / Number(producto.grup)) : rawStock;

                if ((modoCanastaStr === 'VENTA' || modoCanastaStr === 'VENTA_COTIZACION') && qty >= baseStockValue) {
                  showDanger('Stock insuficiente', 'El producto no tiene stock suficiente');
                  return;
                }
                agregarProducto(producto, modoCanastaStr);
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
          <CanastaAlmacen 
            canasta={canasta} 
            agregarProducto={agregarProducto}
            actualizarCantidad={actualizarCantidad} 
            eliminarProducto={eliminarProducto} 
            vaciarCanasta={vaciarCanasta}
            modo={modoCanastaStr} 
            modoAgrupacion={modoAgrupacion}
            setModoAgrupacion={setModoAgrupacion}
            preloadedData={preloadedData}
          />
        )}
      </div>
      <FetchDataProgressive
        service={productsAlmacenService}
        serviceName="productsAlmacenService"
        method="getAll"
        methodParams={[debouncedSearch, categoriaId, sortOrder, false]} // [search, categoryId, sortOrder, ocultarStockCero]
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
        }}
      />

      <EliminarProducto
        isOpen={modalEliminarOpen}
        onClose={() => setModalEliminarOpen(false)}
        productoSeleccionado={productoEliminar}
        onEliminar={(idEliminado) => {
          setProductos(prev => prev.filter(p => p.id !== idEliminado));
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
      />
    </>
  );
};

export default AlmacenGeneral;