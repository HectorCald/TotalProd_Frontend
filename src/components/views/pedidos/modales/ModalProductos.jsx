import React from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import ItemView from '../../../common/ItemView';
import ModalTable from '../../../common/ModalTable';
import { formatCurrency } from '../../../../utils/numberUtils';
import styles from '../../../../styles/view.module.css';

function ModalProductos({ 
    isOpen, 
    setIsOpen, 
    pedidoActual,
    detalles,
    rowsMemo,
    isLargeScreen
}) {
    return (
        <>
            {isLargeScreen ? (
                <ModalTable
                    isOpen={isOpen}
                    title="Productos del Pedido"
                    headers={['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']}
                    rows={rowsMemo}
                    onClose={() => setIsOpen(false)}
                />
            ) : (
                <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
                    <HeaderModal
                        title="Productos del Pedido"
                        onClose={() => setIsOpen(false)}
                    />
                    <div className={styles.modalContent}>
                        {detalles && detalles.length > 0 && (
                            <>
                                <p className={styles.subTitle}>PRODUCTOS INCLUIDOS</p>
                                {detalles
                                    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
                                    .map((producto, index) => {
                                        const detalle = pedidoActual.pedido_almacen_detalle.find(d => d.producto_almacen?.name === producto.nombre);
                                        const productoDetalle = detalle?.producto_almacen || {};
                                        const cantidad = parseFloat(detalle?.cantidad) || 0;
                                        const grup = parseFloat(productoDetalle.grup) || 0;
                                        const esAgrupado = pedidoActual?.agrupado && grup > 0;
                                        const precio = parseFloat(detalle?.precio) || 0;

                                        let cantidadTexto;
                                        let precioTexto;

                                        if (esAgrupado) {
                                            const grupos = Math.floor(cantidad / grup);
                                            const unidades = cantidad % grup;
                                            cantidadTexto = unidades > 0 ? `${grupos} grup ${unidades} ud` : `${grupos} grup`;
                                            // Precio unitario multiplicado por la cantidad de agrupación (redondeado)
                                            const precioUnitarioAgrupado = Math.round(precio * grup);
                                            precioTexto = formatCurrency(precioUnitarioAgrupado);
                                        } else {
                                            cantidadTexto = `${cantidad} ud`;
                                            precioTexto = formatCurrency(precio);
                                        }

                                        return (
                                            <ItemView
                                                key={producto.id || index}
                                                title={producto.nombre}
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
            )}
        </>
    );
}

export default ModalProductos;
