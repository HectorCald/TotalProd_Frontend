import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import styles from './CanastaAlmacen.module.css';
import Boton from '../../../../components/common/botones/Boton';
import ProductoItem from './items/ProductoItem';
import InputSelect from '../../../../components/common/inputs/InputSelect';
import pricesTypesService from '../../../../services/pricesTypesService';
import productsAlmacenService from '../../../../services/productsAlmacenService';
import NoData from '../../../../components/common/widgets/NoData';
import ConfirmacionVenta from './confirmations/ConfirmacionVenta';
import ConfirmacionCotizacion from './confirmations/ConfirmacionCotizacion';
import ConfirmacionPedido from './confirmations/ConfirmacionPedido';
import ConfirmacionEntrada from './confirmations/ConfirmacionEntrada';
import FetchData from '../../../../components/mixed/FetchData';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useLayout } from '../../../../context/LayoutContext';
import { useModalStack } from '../../../../context/ModalStackContext';
import modalStyles from '../../../../components/common/modals/ModalLateral.module.css';
import useFormatNumber from '../../../../hooks/useFormatNumber';

const CanastaAlmacen = ({
  canasta,
  agregarProducto,
  actualizarCantidad,
  eliminarProducto,
  vaciarCanasta,
  actualizarPrecio,
  modo,
  modoAgrupacion,
  setModoAgrupacion,
  preloadedData = null,
  onVentaSuccess,
  onPrecioChange,
  onClose,
  isOpen = true
}) => {
  const { isLargeScreen } = useLayout();
  const { formatPrice } = useFormatNumber();
  const [preciosTipos, setPreciosTipos] = useState([]);
  const [precioSeleccionado, setPrecioSeleccionado] = useState(null);
  const [modalVentaOpen, setModalVentaOpen] = useState(false);
  const [modalCotizacionOpen, setModalCotizacionOpen] = useState(false);
  const [modalPedidoOpen, setModalPedidoOpen] = useState(false);
  const [modalEntradaOpen, setModalEntradaOpen] = useState(false);
  
  const [loadingCotizacion, setLoadingCotizacion] = useState(false);

  const { registerModal, unregisterModal } = useModalStack();
  const modalIdRef = useRef(null);

  useEffect(() => {
    const isMobileModalOpen = !isLargeScreen && isOpen;
    if (isMobileModalOpen && !modalIdRef.current) {
      const modalId = `canasta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      modalIdRef.current = modalId;
      registerModal(modalId, onClose);
    } else if (!isMobileModalOpen && modalIdRef.current) {
      unregisterModal(modalIdRef.current);
      modalIdRef.current = null;
    }
  }, [isOpen, isLargeScreen, registerModal, unregisterModal, onClose]);

  const opcionesAgrupacion = [
    { value: 'unidad', label: 'Por Unidad' },
    { value: 'grupo', label: 'Por Grupo' }
  ];

  // Limpiar canasta al cambiar de modo
  useEffect(() => {
    vaciarCanasta();
  }, [modo, vaciarCanasta]);

  useEffect(() => {
    if (!isLargeScreen && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isLargeScreen, isOpen]);

  const productIdsToFetch = useMemo(() => {
    if (!preloadedData || !preloadedData.productos_lista) return [];
    return preloadedData.productos_lista.map(p => p.id);
  }, [preloadedData]);

  // Guard: solo ejecutar la carga inicial UNA vez, evitar re-cargas al cerrar/abrir el drawer
  const preloadDoneRef = useRef(false);

  const handleProductsLoaded = useCallback((productsFetched) => {
    if (!preloadedData || !productsFetched) return;
    if (preloadDoneRef.current) return; // ya se cargó, ignorar re-ejecuciones
    preloadDoneRef.current = true;
    
    if (preloadedData.modalidad === 'grupos') {
      setModoAgrupacion('grupo');
    } else {
      setModoAgrupacion('unidad');
    }

    vaciarCanasta(); // Vaciamos para no mezclar
    
    // Añadir cada producto respetando el stock límite real
    preloadedData.productos_lista.forEach(item => {
      const productoObj = productsFetched.find(pf => pf.id === item.id);
      if (productoObj) {
        const rawStock = Number(productoObj.stock || 0);
        const esPorGrupo = preloadedData.modalidad === 'grupos' && productoObj.grup && productoObj.grup > 0;
        const maxDisponible = esPorGrupo ? Math.floor(rawStock / Number(productoObj.grup)) : rawStock;
        
        const esLimitado = modo === 'VENTA_COTIZACION' || modo === 'ENTREGA_PEDIDO';
        const cantidadFinal = esLimitado ? Math.min(item.cantidad, maxDisponible) : item.cantidad;

        if (cantidadFinal > 0) {
          agregarProducto(productoObj, modo);
          actualizarCantidad(productoObj.id, cantidadFinal);
          if (item.precioCustom !== undefined && item.precioCustom !== '') {
            actualizarPrecio(productoObj.id, item.precioCustom);
          }
        }
      }
    });
  }, [preloadedData, setModoAgrupacion, vaciarCanasta, agregarProducto, actualizarCantidad, actualizarPrecio, modo]);

  useEffect(() => {
    const fetchPreciosTipos = async () => {
      try {
        const response = await pricesTypesService.getAll();
        if (response.success && response.data) {
          const preciosData = Array.isArray(response.data) ? response.data : [response.data];
          const tiposFiltrados = preciosData.map(precio => ({
            value: precio.id,
            label: precio.name
          }));
          setPreciosTipos(tiposFiltrados);

          let priceToSet = null;

          if (preloadedData && preloadedData.prices_types_id) {
            // Verificar que el precio pre-cargado exista en la lista
            const priceExists = tiposFiltrados.some(t => String(t.value) === String(preloadedData.prices_types_id));
            if (priceExists) {
              priceToSet = preloadedData.prices_types_id;
            }
          }

          if (!priceToSet) {
            const savedPriceId = localStorage.getItem('precioTipoSeleccionado');
            if (savedPriceId) {
              const priceExists = tiposFiltrados.some(t => String(t.value) === String(savedPriceId));
              if (priceExists) {
                priceToSet = savedPriceId;
              }
            }
          }

          if (!priceToSet && tiposFiltrados.length > 0) {
            priceToSet = tiposFiltrados[0].value;
          }

          if (priceToSet) {
            setPrecioSeleccionado(priceToSet);
          }
        }
      } catch (error) {
        console.error("Error al obtener tipos de precios:", error);
      }
    };
    fetchPreciosTipos();
  }, []);

  // Notificar al padre cuando cambia el precio (para persistencia en localStorage)
  useEffect(() => {
    if (precioSeleccionado) {
      localStorage.setItem('precioTipoSeleccionado', precioSeleccionado);
    }
    if (onPrecioChange) {
      onPrecioChange(precioSeleccionado);
    }
  }, [precioSeleccionado, onPrecioChange]);

  const getProductPrice = (producto, priceTypeId) => {
    if (!priceTypeId || !producto.price_product) return 0;
    const priceObj = producto.price_product.find(p => p.prices_types?.id === priceTypeId || p.prices_types_id === priceTypeId);
    return priceObj ? Number(priceObj.valor) : 0;
  };

  const esVenta = modo === 'VENTA' || modo === 'VENTA_COTIZACION' || modo === 'ENTREGA_PEDIDO';

  const totalCanasta = canasta.reduce((acc, producto) => {
    const esPorGrupo = modoAgrupacion === 'grupo' && producto.grup && producto.grup > 0;
    const precioBase = getProductPrice(producto, precioSeleccionado);
    const precioCrudo = esPorGrupo ? precioBase * Number(producto.grup) : precioBase;
    const precioDefecto = (esVenta && esPorGrupo) ? Math.round(precioCrudo) : precioCrudo;
    const precio = producto.precioCustom !== undefined && producto.precioCustom !== '' ? Number(producto.precioCustom) : precioDefecto;
    return acc + (precio * producto.cantidad);
  }, 0);

  const totalRedondeado = Math.round(totalCanasta * 10) / 10;

  const displayModo = (modo === 'VENTA_COTIZACION' || modo === 'ENTREGA_PEDIDO') ? 'VENTA' : modo;

  const preloader = preloadedData && productIdsToFetch.length > 0 ? (
    <FetchData
      service={productsAlmacenService}
      serviceName="productsAlmacenService"
      method="getByIdsFast"
      methodParams={[productIdsToFetch]}
      isOpen={true}
      onDataLoaded={handleProductsLoaded}
      onLoadingStart={() => setLoadingCotizacion(true)}
      onLoadingEnd={() => setLoadingCotizacion(false)}
    />
  ) : null;

  if (!isOpen) return preloader;

  const content = (
    <div className={isLargeScreen ? styles.canastaContainer : modalStyles.drawer} onClick={(e) => !isLargeScreen && e.stopPropagation()}>
      {preloader}
      
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {!isLargeScreen && onClose && (
            <button 
              onClick={onClose} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0', marginRight: '10px' }}
            >
              <i className='bx bx-left-arrow-alt' style={{ fontSize: '24px', color: 'var(--text-color-light, #666)' }}></i>
            </button>
          )}
          <h2>CANASTA {displayModo}</h2>
        </div>
        <button 
          onClick={vaciarCanasta} 
          disabled={canasta.length === 0}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '20px', 
            cursor: canasta.length === 0 ? 'default' : 'pointer', 
            color: canasta.length === 0 ? 'var(--tertiary-color)' : 'var(--error-color)',
            marginLeft: '10px' 
          }}
        >
          <i className='bx bx-trash'></i>
        </button>
      </div>
      <div style={{ padding: '15px 20px',paddingBottom:'5px', display: 'flex', flexDirection: 'row', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <InputSelect
            options={preciosTipos}
            value={precioSeleccionado}
            onChange={(val) => setPrecioSeleccionado(val)}
            placeholder="Precio..."
            clearable={false}
          />
        </div>
        <div style={{ flex: 1 }}>
          <InputSelect
            options={opcionesAgrupacion}
            value={modoAgrupacion}
            onChange={(val) => setModoAgrupacion(val)}
            placeholder="Agrupación..."
            clearable={false}
          />
        </div>
      </div>
      <div className={styles.content}>
        {loadingCotizacion ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', }}>
            <NoData
              icon="loader-alt"
              title="Cargando Productos"
              detail="Obteniendo productos y validando stock..."
              transparent={true}
            />
          </div>
        ) : canasta.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', }}>
            <NoData
              icon="cart"
              title="Canasta vacía"
              detail="No hay productos seleccionados"
              transparent={true}
            />
          </div>
        ) : (
          canasta.map(producto => (
            <ProductoItem
              key={producto.id}
              producto={producto}
              actualizarCantidad={actualizarCantidad}
              actualizarPrecio={actualizarPrecio}
              eliminarProducto={eliminarProducto}
              precioUnitario={getProductPrice(producto, precioSeleccionado)}
              modoAgrupacion={modoAgrupacion}
              modo={modo}
              isLargeScreen={isLargeScreen}
            />
          ))
        )}
      </div>
      {canasta.length > 0 && (
        <div className={styles.footer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 'bold', fontSize: '16px', color: 'var(--secondary-color)' }}>
            <span>Total:</span>
            <span>Bs. {formatPrice(totalRedondeado)}</span>
          </div>
          <Boton
            className="btn-primary"
            label={`Verificar ${displayModo}`}
            onClick={() => {
              if (modo === 'VENTA' || modo === 'VENTA_COTIZACION' || modo === 'ENTREGA_PEDIDO') setModalVentaOpen(true);
              else if (modo === 'COTIZACIÓN' || modo === 'COTIZACION') setModalCotizacionOpen(true);
              else if (modo === 'PEDIDO' || modo === 'NUEVO PEDIDO' || modo === 'NUEVO_PEDIDO' || modo === 'EDITAR_PEDIDO') setModalPedidoOpen(true);
              else if (modo === 'ENTRADA') setModalEntradaOpen(true);
            }}
          />
        </div>
      )}

      <ConfirmacionVenta 
        isOpen={modalVentaOpen}
        onClose={() => setModalVentaOpen(false)}
        totalBase={totalRedondeado}
        canasta={canasta}
        precioSeleccionado={precioSeleccionado}
        vaciarCanasta={vaciarCanasta}
        modoAgrupacion={modoAgrupacion}
        cotizacionDefaults={preloadedData}
        onSuccess={onVentaSuccess}
      />
      <ConfirmacionCotizacion 
        isOpen={modalCotizacionOpen}
        onClose={() => setModalCotizacionOpen(false)}
        totalBase={totalRedondeado}
        canasta={canasta}
        precioSeleccionado={precioSeleccionado}
        vaciarCanasta={vaciarCanasta}
        modoAgrupacion={modoAgrupacion}
      />
      <ConfirmacionPedido 
        isOpen={modalPedidoOpen}
        onClose={() => setModalPedidoOpen(false)}
        totalBase={totalRedondeado}
        canasta={canasta}
        precioSeleccionado={precioSeleccionado}
        modoAgrupacion={modoAgrupacion}
        vaciarCanasta={vaciarCanasta}
        pedidoDefaults={preloadedData}
      />
      <ConfirmacionEntrada 
        isOpen={modalEntradaOpen}
        onClose={() => setModalEntradaOpen(false)}
        totalBase={totalRedondeado}
        canasta={canasta}
        precioSeleccionado={precioSeleccionado}
        vaciarCanasta={vaciarCanasta}
        modoAgrupacion={modoAgrupacion}
      />
    </div>
  );

  if (!isLargeScreen) {
    return createPortal(
      <div className={modalStyles.overlay} onClick={onClose}>
        {content}
      </div>,
      document.body
    );
  }

  return content;
};

export default CanastaAlmacen;
