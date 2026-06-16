import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/old/HeaderModal';
import Boton from '../../../common/botones/Boton';
import { useToast } from '../../../../context/ToastContext';
import useHistorialLogger from '../../../ui/HistorialLogger';
import productsAlmacenService from '../../../../services/productsAlmacenService';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import pedidosAcopioService from '../../../../services/pedidosAcopioService';
import { extractRecetaFromAlmacen } from '../../../../utils/logFormatters';
import styles from '../../../../styles/view.module.css';

function ModalEliminar({
    isOpen,
    setIsOpen,
    productoActual,
    preciosTipos = [],
    setIsOpenVerProducto,
    onProductDeleted
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const { logAccion } = useHistorialLogger({
        modulo: 'Almacén General'
    });

    const handleEliminar = async () => {
        if (!productoActual?.id) {
            showDanger('Error', 'ID del producto no válido');
            return;
        }

        setLoading(true);
        try {
            const movimientosResponse = await movimientosAlmacenService.hasMovements(productoActual.id);
            const tieneMovimientos = movimientosResponse.success && movimientosResponse.hasMovements;

            const pedidosResponse = await pedidosAcopioService.verificarProductoEnPedidos(productoActual.id);
            const tienePedidos = pedidosResponse.success && pedidosResponse.data && pedidosResponse.data.tienePedidos;

            if (tieneMovimientos) {
                showDanger('No se puede eliminar', 'El producto tiene movimientos registrados', 5000);
                setLoading(false);
                return;
            }

            if (tienePedidos) {
                showDanger('No se puede eliminar', 'El producto está incluido en pedidos', 5000);
                setLoading(false);
                return;
            }

            const response = await productsAlmacenService.delete(productoActual.id);

            if (response.success) {
                // Detalles en orden del formulario. Keys en español. Precios como "Precio [nombre]".
                const categoriaNombre = productoActual?.category_almacen?.name ?? productoActual?.category_name ?? null;

                const camposDetalle = {};
                const camposOrden = [
                    'Nombre del Producto',
                    'Descripción',
                    'Stock',
                    'Stock mínimo',
                    'Código de barras',
                    'Grupo',
                    'Categoría'
                ];

                camposDetalle['Nombre del Producto'] = { antes: productoActual?.name ?? null };
                camposDetalle['Descripción'] = { antes: productoActual?.description ?? null };
                camposDetalle['Stock'] = { antes: productoActual?.stock ?? null };
                camposDetalle['Stock mínimo'] = { antes: productoActual?.stock_minimo ?? null };
                camposDetalle['Código de barras'] = { antes: productoActual?.codigo_barras ?? null };
                camposDetalle['Grupo'] = { antes: productoActual?.grup ?? null };
                camposDetalle['Categoría'] = { antes: categoriaNombre };

                preciosTipos.forEach((pt) => {
                    const labelPrecio = `Precio ${pt.name}`;
                    camposOrden.push(labelPrecio);
                    const val = productoActual?.price_product
                        ? (productoActual.price_product.find(p => String(p.prices_types?.id) === String(pt.id))?.valor ?? null)
                        : null;
                    camposDetalle[labelPrecio] = { antes: val };
                });

                camposOrden.push('Receta');
                const receta = extractRecetaFromAlmacen(productoActual);
                camposDetalle['Receta'] = { antes: receta };

                const detallesPersonalizados = {
                    campos: camposDetalle,
                    camposOrden,
                    comentario: 'Eliminación de producto de almacén'
                };

                await logAccion({
                    accion: 'ELIMINAR',
                    lugarAfectado: productoActual?.name || 'Producto de almacén',
                    registroId: productoActual?.id || null,
                    comentario: 'Eliminación de producto de almacén',
                    detallesPersonalizados
                });
                if (onProductDeleted) onProductDeleted(productoActual.id);
                setIsOpen(false);
                if (setIsOpenVerProducto) setIsOpenVerProducto(false);
                showSuccess('Producto eliminado', `El producto "${productoActual.name}" ha sido eliminado correctamente`, 5000);
            } else {
                showDanger('Error', response.message || 'No se puede eliminar el producto', 5000);
            }
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            showDanger('Error', error.message || 'Error al eliminar el producto', 5000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Eliminar"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Eliminar el producto "{productoActual?.name}"? Esta acción es irreversible y puede afectar registros relacionados.
                </p>
                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Cancelar'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsOpen(false)}
                        iconName='x'
                        hideTextOnMobile={true}
                    />
                    <Boton
                        className='btn-red'
                        label='Sí, eliminar'
                        style={{ marginTop: 'auto' }}
                        onClick={handleEliminar}
                        loading={loading}
                        segundosDisabled={5}
                        iconName='trash'
                        hideTextOnMobile={true}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalEliminar;
