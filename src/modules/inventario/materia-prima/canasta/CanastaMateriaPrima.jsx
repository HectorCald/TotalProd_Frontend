import React, { useState } from 'react';
import styles from './CanastaMateriaPrima.module.css';
import Boton from '../../../../components/common/botones/Boton';
import ProductoItem from './items/ProductoItem';
import NoData from '../../../../components/common/widgets/NoData';
import { useToast } from '../../../../context/ToastContext';
import pedidosAcopioService from '../../../../services/pedidosAcopioService';
import { createPortal } from 'react-dom';
import { useLayout } from '../../../../context/LayoutContext';
import modalStyles from '../../../../components/common/modals/ModalLateral.module.css';
import { useEffect } from 'react';

const CanastaMateriaPrima = ({
  canasta,
  actualizarCantidad,
  actualizarMedida,
  eliminarProducto,
  vaciarCanasta,
  modo,
  onClose,
  isOpen = true
}) => {
  const { showSuccess, showDanger } = useToast();
  const { isLargeScreen } = useLayout();
  const [cargando, setCargando] = useState(false);

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

  const confirmarPedido = async () => {
    if (canasta.length === 0) return;
    setCargando(true);

    const pedidoData = {
      productos: canasta.map(p => ({
        id: p.id,
        cantidad: p.cantidad,
        tipo_medida: p.tipo_medida || p.type_measure?.code || 'kg',
      })),
    };

    const result = await pedidosAcopioService.create(pedidoData);

    setCargando(false);

    if (result && result.success !== false) {
      showSuccess(
        null,
        `Se generaron ${canasta.length} pedido${canasta.length !== 1 ? 's' : ''} de materia prima correctamente.`
      );
      vaciarCanasta();
    } else {
      showDanger(
        null,
        result?.message || 'No se pudo generar el pedido. Intenta nuevamente.'
      );
    }
  };

  if (!isOpen) return null;

  const content = (
    <div className={isLargeScreen ? styles.canastaContainer : modalStyles.drawer} onClick={(e) => !isLargeScreen && e.stopPropagation()}>
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
          <h2>CANASTA {modo}</h2>
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
              medida={producto.tipo_medida || producto.type_measure?.code || 'kg'}
              onMedidaChange={(val) => actualizarMedida(producto.id, val)}
            />
          ))
        )}
      </div>
      {canasta.length > 0 && (
        <div className={styles.footer}>
          <Boton
            className="btn-primary"
            label="Confirmar Pedido"
            onClick={confirmarPedido}
            loading={cargando}
          />
        </div>
      )}
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

export default CanastaMateriaPrima;
