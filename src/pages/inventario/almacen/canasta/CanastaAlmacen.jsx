import React, { useState, useEffect } from 'react';
import styles from './CanastaAlmacen.module.css';
import Boton from '../../../../components/common/botones/Boton';
import ProductoItem from './items/ProductoItem';
import InputSelect from '../../../../components/common/inputs/InputSelect';
import pricesTypesService from '../../../../services/pricesTypesService';
import NoData from '../../../../components/common/widgets/NoData';
import ConfirmacionVenta from './confirmations/ConfirmacionVenta';
import ConfirmacionCotizacion from './confirmations/ConfirmacionCotizacion';
import ConfirmacionPedido from './confirmations/ConfirmacionPedido';
import ConfirmacionEntrada from './confirmations/ConfirmacionEntrada';

const CanastaAlmacen = ({
  canasta,
  actualizarCantidad,
  eliminarProducto,
  vaciarCanasta,
  modo,
  modoAgrupacion,
  setModoAgrupacion
}) => {
  const [preciosTipos, setPreciosTipos] = useState([]);
  const [precioSeleccionado, setPrecioSeleccionado] = useState(null);
  const [modalVentaOpen, setModalVentaOpen] = useState(false);
  const [modalCotizacionOpen, setModalCotizacionOpen] = useState(false);
  const [modalPedidoOpen, setModalPedidoOpen] = useState(false);
  const [modalEntradaOpen, setModalEntradaOpen] = useState(false);

  const opcionesAgrupacion = [
    { value: 'unidad', label: 'Por Unidad' },
    { value: 'grupo', label: 'Por Grupo' }
  ];

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
          if (tiposFiltrados.length > 0) {
            setPrecioSeleccionado(tiposFiltrados[0].value);
          }
        }
      } catch (error) {
        console.error("Error al obtener tipos de precios:", error);
      }
    };
    fetchPreciosTipos();
  }, []);

  const getProductPrice = (producto, priceTypeId) => {
    if (!priceTypeId || !producto.price_product) return 0;
    const priceObj = producto.price_product.find(p => p.prices_types?.id === priceTypeId || p.prices_types_id === priceTypeId);
    return priceObj ? Number(priceObj.valor) : 0;
  };

  const esVenta = modo === 'VENTA';

  const totalCanasta = canasta.reduce((acc, producto) => {
    const esPorGrupo = modoAgrupacion === 'grupo' && producto.grup && producto.grup > 0;
    const precioBase = getProductPrice(producto, precioSeleccionado);
    const precioCrudo = esPorGrupo ? precioBase * Number(producto.grup) : precioBase;
    const precio = (esVenta && esPorGrupo) ? Math.round(precioCrudo) : precioCrudo;
    return acc + (precio * producto.cantidad);
  }, 0);

  const totalRedondeado = Math.round(totalCanasta * 10) / 10;

  return (
    <div className={styles.canastaContainer}>
      <div className={styles.header}>
        <h2>CANASTA {modo}</h2>
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
      <div style={{ padding: '15px 20px', display: 'flex', flexDirection: 'row', gap: '10px' }}>
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
        {canasta.length === 0 ? (
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
              eliminarProducto={eliminarProducto}
              precioUnitario={getProductPrice(producto, precioSeleccionado)}
              modoAgrupacion={modoAgrupacion}
              modo={modo}
            />
          ))
        )}
      </div>
      {canasta.length > 0 && (
        <div className={styles.footer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 'bold', fontSize: '16px', color: 'var(--secondary-color)' }}>
            <span>Total:</span>
            <span>Bs. {totalRedondeado.toFixed(2)}</span>
          </div>
          <Boton
            className="btn-original"
            label={`Verificar ${modo}`}
            onClick={() => {
              if (modo === 'VENTA') setModalVentaOpen(true);
              else if (modo === 'COTIZACIÓN' || modo === 'COTIZACION') setModalCotizacionOpen(true);
              else if (modo === 'PEDIDO' || modo === 'NUEVO PEDIDO' || modo === 'NUEVO_PEDIDO') setModalPedidoOpen(true);
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
      />
      <ConfirmacionCotizacion 
        isOpen={modalCotizacionOpen}
        onClose={() => setModalCotizacionOpen(false)}
        totalBase={totalRedondeado}
      />
      <ConfirmacionPedido 
        isOpen={modalPedidoOpen}
        onClose={() => setModalPedidoOpen(false)}
        totalBase={totalRedondeado}
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
};

export default CanastaAlmacen;
