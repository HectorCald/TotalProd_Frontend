import React from 'react';
import styles from './CanastaMateriaPrima.module.css';
import Boton from '../../../../components/common/botones/Boton';
import ProductoItem from './items/ProductoItem';
import NoData from '../../../../components/common/widgets/NoData';

const CanastaMateriaPrima = ({
  canasta,
  actualizarCantidad,
  eliminarProducto,
  vaciarCanasta,
  modo
}) => {
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
      <div className={styles.content}>
        {canasta.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
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
            />
          ))
        )}
      </div>
      {canasta.length > 0 && (
        <div className={styles.footer}>
          <Boton
            className="btn-original"
            label="Confirmar Pedido"
            onClick={() => {
              console.log(`Verificando ${modo} de materia prima`);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CanastaMateriaPrima;
