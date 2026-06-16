import React, { useEffect, useRef } from 'react';
import styles from './ProductoItem.module.css';

const ProductoItem = ({ producto, actualizarCantidad, eliminarProducto, precioUnitario, modoAgrupacion, modo }) => {
  const esPorGrupo = modoAgrupacion === 'grupo' && producto.grup && producto.grup > 0;
  const rawStock = Number(producto.stock || 0);
  const baseStockValue = esPorGrupo ? Math.floor(rawStock / Number(producto.grup)) : rawStock;
  
  const esVenta = modo === 'VENTA';
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);
  
  useEffect(() => {
    if (esVenta && producto.cantidad > baseStockValue) {
      actualizarCantidad(producto.id, baseStockValue > 0 ? baseStockValue : 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoAgrupacion, esVenta, baseStockValue, producto.id]);

  const stockVisual = esVenta ? baseStockValue - producto.cantidad : baseStockValue;
  
  const qtyUnits = esPorGrupo ? (producto.cantidad * Number(producto.grup)) : producto.cantidad;
  const remainingUnits = esVenta ? (rawStock - qtyUnits) : rawStock;

  const getStockColor = () => {
    const stock = remainingUnits;
    const minimo = Number(producto.stock_minimo ?? 0);
    if (minimo > 0) {
      if (stock <= minimo) return 'var(--error-color)';
      if (stock <= minimo * 1.5) return 'var(--warning-color)';
      return 'var(--info-color)';
    } else {
      if (stock <= 0) return 'var(--error-color)';
      if (stock <= 5) return 'var(--warning-color)';
      return 'var(--info-color)';
    }
  };
  
  const precioBase = Number(precioUnitario || 0);
  const precioCrudo = esPorGrupo ? precioBase * Number(producto.grup) : precioBase;
  const precio = (esVenta && esPorGrupo) ? Math.round(precioCrudo) : precioCrudo;
  const subtotal = precio * producto.cantidad;
  
  const handleDecrement = () => {
    if (producto.cantidad > 1) {
      actualizarCantidad(producto.id, producto.cantidad - 1);
    }
  };

  const handleIncrement = () => {
    if (esVenta && stockVisual <= 0) return;
    actualizarCantidad(producto.id, producto.cantidad + 1);
  };

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <div className={styles.imageContainer}>
          {producto.imagen ? (
            <img src={producto.imagen} alt={producto.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
          ) : (
            <i className={`bx bx-box ${styles.imageIcon}`}></i>
          )}
        </div>
        <div className={styles.titleArea}>
          <h3 className={styles.productName}>{producto.name}</h3>
          <p className={styles.stock} style={{ color: getStockColor(), fontWeight: 600 }}>
            {stockVisual} {esPorGrupo ? 'grs.' : 'uds.'} disponibles
          </p>
        </div>
        <button className={styles.deleteBtn} onClick={() => eliminarProducto(producto.id)}>
          <i className='bx bx-trash'></i>
        </button>
      </div>

      <div className={styles.midRow}>
        <div>
          <span className={styles.priceLabel}>Precio (Bs.) </span>
          <span className={styles.priceValue}>{Number.isInteger(precio) ? precio : precio.toFixed(2)}</span>
        </div>
        <div className={styles.quantitySelector}>
          <button className={styles.qtyBtn} onClick={handleDecrement} disabled={producto.cantidad <= 1}>
            <i className='bx bx-minus'></i>
          </button>
          <input
            ref={inputRef}
            type="number"
            className={styles.qtyInput}
            value={producto.cantidad === 0 ? '' : producto.cantidad}
            onChange={(e) => {
              let val = parseInt(e.target.value, 10);
              if (isNaN(val)) {
                actualizarCantidad(producto.id, 0);
                return;
              }
              if (val < 1) val = 1;
              if (esVenta && val > baseStockValue) val = baseStockValue > 0 ? baseStockValue : 1;
              actualizarCantidad(producto.id, val);
            }}
            onBlur={(e) => {
              let val = parseInt(e.target.value, 10);
              if (isNaN(val) || val < 1) actualizarCantidad(producto.id, 1);
            }}
          />
          <button 
            className={styles.qtyBtn} 
            onClick={handleIncrement}
            disabled={esVenta && stockVisual <= 0}
          >
            <i className='bx bx-plus'></i>
          </button>
        </div>
      </div>

      <div className={styles.bottomRow}>
        <span className={styles.subtotalLabel}>Subtotal:</span>
        <span className={styles.subtotalValue}>
          Bs. {Number.isInteger(subtotal) ? subtotal : subtotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default ProductoItem;
