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
import productsAlmacenService from '../../../services/productsAlmacenService';
import ViewInfo from './modals/ViewInfo';
import AgregarEditarProducto from './modals/AgregarEditarProducto';
import BotonFlotante from '../../../components/common/botones/BotonFlotante';
import CanastaAlmacen from './canasta/CanastaAlmacen';
import { useCanasta } from './hooks/useCanasta';
import { useToast } from '../../../context/ToastContext';
import ViewInfoMovimiento from '../../../pages/registros-pedidos/movimientos/modals/ViewInfo';
import useSound from 'use-sound';
import { cashSound } from '../../../assets/sounds/cashBase64';


const AlmacenGeneral = () => {
  const { isLargeScreen } = useLayout();
  const location = useLocation();

  const path = location.pathname;
  const isCanastaMode = path.includes('/almacen/salidas') || path.includes('/almacen/entradas') || path.includes('/almacen/pedidos') || path.includes('/almacen/cotizar');
  const modoCanastaStr = path.includes('/almacen/salidas/copia') ? 'COPIA_VENTA' : path.includes('/almacen/cotizar/copia') ? 'COPIA_COTIZACION' : path.includes('/almacen/salidas/pedido') ? 'ENTREGA_PEDIDO' : path.includes('/almacen/salidas/cotizacion') ? 'VENTA_COTIZACION' : path.includes('/almacen/salidas') ? 'VENTA' : path.includes('/almacen/entradas') ? 'ENTRADA' : path.includes('/almacen/pedidos') ? 'PEDIDO' : 'COTIZACIÓN';
  const esVentaCanasta = modoCanastaStr === 'VENTA' || modoCanastaStr === 'VENTA_COTIZACION' || modoCanastaStr === 'ENTREGA_PEDIDO' || modoCanastaStr === 'COPIA_VENTA';
  const { canasta, agregarProducto, eliminarProducto, actualizarCantidad, actualizarPrecio, vaciarCanasta, modoAgrupacion, setModoAgrupacion } = useCanasta();

  const [isViewInfoMovimientoOpen, setIsViewInfoMovimientoOpen] = useState(false);
  const [ventaResultData, setVentaResultData] = useState(null);

  // Precio seleccionado elevado desde CanastaAlmacen para poder persistirlo
  const [precioCanasta, setPrecioCanasta] = useState(null);

  const [playCashRegister] = useSound(cashSound, { volume: 1.0 });

  const handleVentaSuccess = (ventaData) => {
    try {
      playCashRegister();
    } catch (e) {
      console.log('Error al reproducir sonido', e);
    }
    // Limpiar persistencia al confirmar venta
    if (canastaStorageKey) localStorage.removeItem(canastaStorageKey);
    setVentaResultData(ventaData);
    setIsViewInfoMovimientoOpen(true);
  };

  // Clave de localStorage según el modo canasta activo
  const canastaStorageKey = (
    modoCanastaStr === 'VENTA' ? 'ventaEnProgreso' :
    (modoCanastaStr === 'PEDIDO' && !path.includes('/almacen/pedidos/editar')) ? 'pedidoEnProgreso' :
    (modoCanastaStr === 'COTIZACIÓN' || modoCanastaStr === 'COTIZACION') ? 'cotizacionEnProgreso' :
    null
  );

  // Wrapper de vaciarCanasta que también limpia localStorage en modos persistibles
  const handleVaciarCanasta = useCallback(() => {
    vaciarCanasta();
    if (canastaStorageKey) {
      localStorage.removeItem(canastaStorageKey);
    }
  }, [vaciarCanasta, canastaStorageKey]);

  // Wrapper de eliminarProducto que limpia localStorage si era el último item
  const handleEliminarProducto = useCallback((id) => {
    eliminarProducto(id);
    if (canastaStorageKey) {
      const restantes = canasta.filter(p => p.id !== id);
      if (restantes.length === 0) {
        localStorage.removeItem(canastaStorageKey);
      }
    }
  }, [eliminarProducto, canasta, canastaStorageKey]);
  const { showDanger } = useToast();
  const navigate = useNavigate();

  // Leer variables de sesión/storage para precargar datos y manejar redirecciones de seguridad
  const preloadedData = useMemo(() => {
    if (modoCanastaStr === 'COPIA_VENTA') {
      const rawData = sessionStorage.getItem('movimientoParaCopiar');
      return rawData ? JSON.parse(rawData) : null;
    }

    if (modoCanastaStr === 'COPIA_COTIZACION') {
      const rawData = sessionStorage.getItem('cotizacionParaCopiar');
      return rawData ? JSON.parse(rawData) : null;
    }
    if (modoCanastaStr === 'VENTA_COTIZACION') {
      const rawData = sessionStorage.getItem('cotizacionParaVenta');
      return rawData ? JSON.parse(rawData) : null;
    }
    if (modoCanastaStr === 'ENTREGA_PEDIDO') {
      const rawData = sessionStorage.getItem('pedidoParaEntregar');
      return rawData ? JSON.parse(rawData) : null;
    }
    if (modoCanastaStr === 'PEDIDO' && path.includes('/almacen/pedidos/editar')) {
      const rawData = sessionStorage.getItem('pedidoParaEditar');
      return rawData ? JSON.parse(rawData) : null;
    }
    if (modoCanastaStr === 'VENTA') {
      const rawData = localStorage.getItem('ventaEnProgreso');
      return rawData ? JSON.parse(rawData) : null;
    }
    if (modoCanastaStr === 'PEDIDO') {
      const rawData = localStorage.getItem('pedidoEnProgreso');
      return rawData ? JSON.parse(rawData) : null;
    }
    if (modoCanastaStr === 'COTIZACIÓN' || modoCanastaStr === 'COTIZACION') {
      const rawData = localStorage.getItem('cotizacionEnProgreso');
      return rawData ? JSON.parse(rawData) : null;
    }
    return null;
  }, [modoCanastaStr, path]);

  // Sincronizar canasta con localStorage en modos persistibles (VENTA, PEDIDO nuevo, COTIZACIÓN)
  useEffect(() => {
    if (!canastaStorageKey) return;
    if (canasta.length === 0) {
      localStorage.removeItem(canastaStorageKey);
      return;
    }
    const data = {
      productos_lista: canasta.map(p => ({ id: p.id, cantidad: p.cantidad, ...(p.precioCustom !== undefined && p.precioCustom !== '' ? { precioCustom: p.precioCustom } : {}) }))
    };
    localStorage.setItem(canastaStorageKey, JSON.stringify(data));
  }, [canasta, canastaStorageKey]);

  useEffect(() => {
    if ((modoCanastaStr === 'VENTA_COTIZACION' || modoCanastaStr === 'ENTREGA_PEDIDO') && !preloadedData) {
      navigate('/almacen/salidas');
    }
    if (modoCanastaStr === 'PEDIDO' && path.includes('/almacen/pedidos/editar') && !preloadedData) {
      navigate('/almacen/pedidos');
    }
  }, [modoCanastaStr, preloadedData, navigate, path]);

  // Determinar título basado en la ruta
  const getTitulo = () => {
    const path = location.pathname;
    if (path.includes('/almacen/salidas/pedido')) return 'Entrega de Pedido';
    if (path.includes('/almacen/salidas/cotizacion')) return 'Venta desde Cotización';
    if (path.includes('/almacen/salidas')) return 'Salida o Venta';
    if (path.includes('/almacen/entradas')) return 'Entrada';
    if (path.includes('/almacen/pedidos/editar')) return 'Editar Pedido';
    if (path.includes('/almacen/pedidos')) return 'Nuevo Pedido';
    if (path.includes('/almacen/gestionar')) return 'Inventario';
    if (path.includes('/almacen/conteo')) return 'Conteo';
    if (path.includes('/almacen/cotizar')) return 'Cotizar';
    return 'Almacén General';
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
  const [modalInfoOpen, setModalInfoOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
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

  const columns = [
    {
      header: 'Producto',
      accessor: 'name',
      isMain: true,
      width: '30%',
      isMobileMain: true,
      hasDot: isCanastaMode ? (row) => canasta.some(p => p.id === row.id) : null,
      dotColor: 'var(--primary-color)',
      dotTitle: 'En canasta'
    },
    {
      header: 'Stock',
      accessor: 'displayStock',
      width: '15%',
      hasStatus: true,
      isMobileStatus: true,
      statusType: (row) => {
        const stock = Number(row.displayStock ?? row.stock ?? 0);
        const minimo = Number(row.stock_minimo_ajustado ?? row.stock_minimo ?? 0);
        if (minimo > 0) {
          if (stock <= minimo) return 'error';
          if (stock <= minimo * 1.5) return 'warning';
        } else {
          if (stock <= 0) return 'error';
          if (stock <= 5) return 'warning';
        }
        return 'info';
      },
      mobileRender: (row) => `${Number(row.displayStock ?? row.stock ?? 0)}`
    },
    ...(!isCanastaMode ? [{
      header: 'Grupo',
      accessor: (row) => {
        const units = Number(row.remainingUnits ?? row.stock ?? 0);
        const grup = Number(row.grup ?? 0);
        return grup > 0 ? Math.floor(units / grup) : '--';
      },
      width: '10%'
    }] : []),
    ...(isCanastaMode ? [{
      header: 'Precio',
      accessor: 'precio',
      hiddenOnDesktop: true,
      isMobileStatus2: true,
      statusType: () => 'secondary',
      mobileRender: (row) => {
        const pId = localStorage.getItem('canasta_precio_seleccionado') || precioCanasta;
        if (!pId || !row.price_product) return 'Bs. 0.00';
        const priceObj = row.price_product.find(p => String(p.prices_types?.id) === String(pId) || String(p.prices_types_id) === String(pId));
        const val = priceObj ? Number(priceObj.valor) : 0;
        return `Bs. ${val.toFixed(2)}`;
      }
    }] : []),
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
      badgeColor: 'var(--primary-color)',
      isMobileSubtitle: true,
      mobileRender: (row) => {
        const cats = Array.isArray(row.category_names) ? row.category_names : (typeof row.category_names === 'string' && row.category_names ? row.category_names.split(', ') : []);
        const firstCat = cats.length > 0 ? cats[0] : 'Sin categoría';
        const min = row.stock_minimo ?? 0;
        return `${firstCat} • Mín: ${min}`;
      }
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
            data={productos.map(p => {
              const inCanasta = canasta.find(c => c.id === p.id);
              const qty = inCanasta ? inCanasta.cantidad : 0;
              const rawStock = Number(p.stock || 0);
              const isGroupMode = isCanastaMode && modoAgrupacion === 'grupo' && p.grup && p.grup > 0;
              const qtyInUnits = isGroupMode ? qty * p.grup : qty;
              const remainingUnits = esVentaCanasta ? rawStock - qtyInUnits : rawStock;
              const displayStock = isGroupMode ? Math.floor(remainingUnits / p.grup) : remainingUnits;
              const originalMinimo = Number(p.stock_minimo || 0);
              const stock_minimo_ajustado = isGroupMode ? Math.floor(originalMinimo / p.grup) : originalMinimo;
              return { ...p, displayStock, remainingUnits, stock_minimo_ajustado };
            })}
            columns={columns}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            buttonLabel={isCanastaMode ? null : "Nuevo Producto"}
            onButtonClick={isCanastaMode ? undefined : () => {
              setProductoEditando(null);
              setModalAgregarEditarOpen(true);
            }}
            mobileQuantityControl={isCanastaMode ? (row) => {
              const inCanasta = canasta.find(p => p.id === row.id);
              const qty = inCanasta ? inCanasta.cantidad : 0;
              const rawStock = Number(row.stock || 0);
              const esPorGrupo = modoAgrupacion === 'grupo' && row.grup && row.grup > 0;
              const baseStockValue = esPorGrupo ? Math.floor(rawStock / Number(row.grup)) : rawStock;
              const esVenta = modoCanastaStr === 'VENTA' || modoCanastaStr === 'VENTA_COTIZACION' || modoCanastaStr === 'ENTREGA_PEDIDO' || modoCanastaStr === 'COPIA_VENTA';

              return {
                quantity: qty,
                max: esVenta ? baseStockValue : undefined,
                onMaxExceeded: () => showDanger(null, 'Stock insuficiente'),
                onQuantityChange: (val) => {
                  if (qty === 0 && val > 0) {
                    if (modoCanastaStr === 'PEDIDO' && canasta.length > 0) {
                      const empresaIdCanasta = canasta[0].empresa_id;
                      if (empresaIdCanasta && String(row.empresa_id) !== String(empresaIdCanasta)) {
                        showDanger(null, 'No puedes pedir a diferentes empresas a la vez.');
                        return;
                      }
                    }
                    agregarProducto(row, modoCanastaStr);
                    setTimeout(() => actualizarCantidad(row.id, val), 0);
                  } else if (val === 0 && qty > 0) {
                    eliminarProducto(row.id);
                  } else if (qty > 0) {
                    actualizarCantidad(row.id, val);
                  }
                }
              };
            } : null}
            searchKeys={['name', 'codigo_barras']}
            sortKey="name"
            onLoadMore={handleLoadMore}
            onRowClick={(producto) => {
              if (isCanastaMode) {
                if (modoCanastaStr === 'PEDIDO' && canasta.length > 0) {
                  const empresaIdCanasta = canasta[0].empresa_id;
                  if (empresaIdCanasta && String(producto.empresa_id) !== String(empresaIdCanasta)) {
                    showDanger(null, 'No puedes pedir a diferentes empresas a la vez.');
                    return;
                  }
                }

                const inCanasta = canasta.find(p => p.id === producto.id);
                const qty = inCanasta ? inCanasta.cantidad : 0;
                const rawStock = Number(producto.stock || 0);
                const esPorGrupo = modoAgrupacion === 'grupo' && producto.grup && producto.grup > 0;
                const baseStockValue = esPorGrupo ? Math.floor(rawStock / Number(producto.grup)) : rawStock;

                if (esVentaCanasta && qty >= baseStockValue) {
                  showDanger(null, 'Stock insuficiente');
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
            isOpen={isLargeScreen || isCanastaMobileOpen}
            canasta={canasta}
            agregarProducto={agregarProducto}
            actualizarCantidad={actualizarCantidad}
            eliminarProducto={handleEliminarProducto}
            vaciarCanasta={handleVaciarCanasta}
            actualizarPrecio={actualizarPrecio}
            modo={modoCanastaStr}
            modoAgrupacion={modoAgrupacion}
            setModoAgrupacion={setModoAgrupacion}
            preloadedData={preloadedData}
            onVentaSuccess={handleVentaSuccess}
            onPrecioChange={canastaStorageKey ? setPrecioCanasta : undefined}
            onClose={() => setIsCanastaMobileOpen(false)}
          />
        )}
      </div>
      <FetchDataProgressive
        service={productsAlmacenService}
        serviceName="productsAlmacenService"
        method="getAll"
        methodParams={[debouncedSearch, categoriaId, sortOrder, false, !path.includes('/almacen/entradas')]} // [search, categoryId, sortOrder, ocultarStockCero, includeSocios]
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

      <ViewInfo
        isOpen={modalInfoOpen}
        onClose={() => setModalInfoOpen(false)}
        producto={productoSeleccionado}
        readOnly={productoSeleccionado && String(productoSeleccionado.empresa_id) !== String(localStorage.getItem('empresa_id'))}
        onGuardar={(nuevoProducto) => {
          setProductos(prev => prev.map(p => p.id === nuevoProducto.id ? { ...p, ...nuevoProducto } : p));
          if (productoSeleccionado && productoSeleccionado.id === nuevoProducto.id) {
            setProductoSeleccionado(prev => ({ ...prev, ...nuevoProducto }));
          }
        }}
        onEliminar={(idEliminado) => {
          setProductos(prev => prev.filter(p => p.id !== idEliminado));
        }}
      />

      <ViewInfoMovimiento
        isOpen={isViewInfoMovimientoOpen}
        onClose={() => setIsViewInfoMovimientoOpen(false)}
        movimiento={ventaResultData}
      />
      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default AlmacenGeneral;