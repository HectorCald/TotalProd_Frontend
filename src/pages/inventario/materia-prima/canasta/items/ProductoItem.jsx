import React, { useEffect, useRef, useState } from 'react';
import styles from './ProductoItem.module.css';
import InputSelect from '../../../../../components/common/inputs/InputSelect';

const ProductoItem = ({ producto, actualizarCantidad, eliminarProducto }) => {
  const inputRef = useRef(null);
  const opcionesMedida = [
    { value: 'Kilogramo', label: 'Kilogramo' },
    { value: 'Quintal', label: 'Quintal' },
    { value: 'Litro', label: 'Litro' },
    { value: 'Libras', label: 'Libras' },
    { value: 'Arroba', label: 'Arroba' },
    { value: 'Caja', label: 'Caja' }
  ];
  const [medidaSeleccionada, setMedidaSeleccionada] = useState(opcionesMedida[0].value);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);
  
  const handleDecrement = () => {
    if (producto.cantidad > 1) {
      actualizarCantidad(producto.id, producto.cantidad - 1);
    }
  };

  const handleIncrement = () => {
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
          <p className={styles.stock} style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
             {producto.quantity ?? 0} {producto.type_measure?.code || ''} disponibles
          </p>
        </div>
        <button className={styles.deleteBtn} onClick={() => eliminarProducto(producto.id)}>
          <i className='bx bx-trash'></i>
        </button>
      </div>

      <div className={styles.midRow}>
        <div style={{ width: '140px' }}>
          <InputSelect
            options={opcionesMedida}
            value={medidaSeleccionada}
            onChange={(val) => setMedidaSeleccionada(val)}
            placeholder="Medida..."
            clearable={false}
          />
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
          >
            <i className='bx bx-plus'></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductoItem;
