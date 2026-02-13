import React from 'react';
import { useLayout } from '../../../../context/LayoutContext';
import ModalTable from '../../../common/ModalTable';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import ItemView from '../../../common/ItemView';
import { formatCurrency } from '../../../../utils/numberUtils';
import styles from '../../../../styles/view.module.css';

function ModalProductos({ isOpen, setIsOpen, cotizacionActual, rowsMemo }) {
    const { isLargeScreen } = useLayout();

    if (isLargeScreen) {
        return (
            <ModalTable
                isOpen={isOpen}
                title="Productos de la Cotización"
                headers={['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']}
                rows={rowsMemo}
                onClose={() => setIsOpen(false)}
            />
        );
    }

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Productos de la Cotización"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                {cotizacionActual?.productos && cotizacionActual.productos.length > 0 && (
                    <>
                        <p className={styles.subTitle}>PRODUCTOS INCLUIDOS</p>

                        {cotizacionActual.productos
                            .sort((a, b) => (a.producto?.name || '').localeCompare(b.producto?.name || '', 'es', { sensitivity: 'base' }))
                            .map((productoCotizacion, index) => {
                                const cantidad = parseFloat(productoCotizacion.cantidad) || 0;
                                const grup = parseFloat(productoCotizacion.producto?.grup) || 0;
                                const esAgrupado = cotizacionActual?.agrupado && grup > 0;
                                const precioUnitario = parseFloat(productoCotizacion.precio_unitario) || 0;

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
                                        key={`${productoCotizacion.producto?.id || 'producto'}-${index}`}
                                        title={productoCotizacion.producto?.name || 'Sin nombre'}
                                        description={`Precio Unitario: ${precioTexto} • Subtotal: ${formatCurrency(productoCotizacion.subtotal)}`}
                                        flot2={cantidadTexto}
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
