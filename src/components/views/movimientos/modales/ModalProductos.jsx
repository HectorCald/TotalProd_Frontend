import React from 'react';
import { useLayout } from '../../../../context/LayoutContext';
import ModalTable from '../../../common/old/ModalTable';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/old/HeaderModal';
import ItemView from '../../../common/old/ItemView';
import { formatCurrency } from '../../../../utils/numberUtils';
import styles from '../../../../styles/view.module.css';

function ModalProductos({ isOpen, setIsOpen, productos, movimientoActual, movimiento, rowsMemo }) {
    const { isLargeScreen } = useLayout();

    // Usar productos originales si el movimiento está anulado y los productos actuales están vacíos
    const productosParaMostrar = movimientoActual?.estado === 'anulado' &&
        (!movimientoActual?.productos || movimientoActual.productos.length === 0 ||
            movimientoActual.productos.some(p => !p.producto?.name || p.precio_unitario === 0))
        ? movimiento?.productos || []
        : movimientoActual?.productos || [];

    if (isLargeScreen) {
        return (
            <ModalTable
                isOpen={isOpen}
                title="Productos del Movimiento"
                headers={['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']}
                rows={rowsMemo}
                onClose={() => setIsOpen(false)}
            />
        );
    }

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Productos del Movimiento"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                {productosParaMostrar && productosParaMostrar.length > 0 && (
                    <>
                        <p className={styles.subTitle}>PRODUCTOS INCLUIDOS</p>

                        {productosParaMostrar
                            .sort((a, b) => (a.producto?.name || '').localeCompare(b.producto?.name || '', 'es', { sensitivity: 'base' }))
                            .map((productoMovimiento, index) => {
                                const cantidad = parseFloat(productoMovimiento.cantidad) || 0;
                                const grup = parseFloat(productoMovimiento.producto?.grup) || 0;
                                const esAgrupado = movimientoActual?.agrupado && grup > 0;
                                const precioUnitario = parseFloat(productoMovimiento.precio_unitario) || 0;

                                let cantidadTexto;
                                let precioTexto;

                                if (esAgrupado) {
                                    const grupos = Math.floor(cantidad / grup);
                                    const unidades = cantidad % grup;
                                    cantidadTexto = unidades > 0 ? `${grupos} grup ${unidades} ud` : `${grupos} grup`;
                                    // Precio unitario multiplicado por la cantidad de agrupación
                                    precioTexto = formatCurrency(precioUnitario * grup);
                                } else {
                                    cantidadTexto = `${cantidad} ud`;
                                    precioTexto = formatCurrency(precioUnitario);
                                }

                                return (
                                    <ItemView
                                        key={`${productoMovimiento.producto?.id || 'producto'}-${index}`}
                                        title={productoMovimiento.producto?.name || 'Sin nombre'}
                                        description={`Precio Unitario: ${precioTexto}`}
                                        flot2={cantidadTexto}
                                        icon='package'
                                        circulo={false}
                                    />
                                );
                            })}
                    </>
                )}
            </div>
        </ViewModal>
    );
}

export default ModalProductos;
