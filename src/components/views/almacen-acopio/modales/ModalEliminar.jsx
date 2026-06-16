import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/old/HeaderModal';
import Boton from '../../../common/botones/Boton';
import useHistorialLogger from '../../../ui/HistorialLogger';
import productsAcopioService from '../../../../services/productsAcopioService';
import movimientosAcopioService from '../../../../services/movimientosAcopioService';
import pedidosAcopioService from '../../../../services/pedidosAcopioService';
import { extractRecetaFromAcopio } from '../../../../utils/logFormatters';
import styles from '../../../../styles/view.module.css';

function ModalEliminar({
    isOpen,
    setIsOpen,
    productoActual,
    typeMeasures = [],
    setIsOpenVerProducto,
    onProductDeleted,
    onSuccess,
    onError
}) {
    const [loading, setLoading] = useState(false);

    const { logAccion } = useHistorialLogger({
        modulo: 'Almacén Acopio'
    });

    const handleEliminar = async () => {
        if (!productoActual?.id) {
            if (onError) onError('No se puede eliminar: producto no válido');
            return;
        }

        setLoading(true);
        try {
            const movimientosResponse = await movimientosAcopioService.getByProduct(productoActual.id);
            const tieneMovimientos = movimientosResponse.success && movimientosResponse.data && movimientosResponse.data.length > 0;

            const pedidosResponse = await pedidosAcopioService.verificarProductoEnPedidos(productoActual.id);
            const tienePedidos = pedidosResponse.success && pedidosResponse.data && pedidosResponse.data.tienePedidos;

            if (tieneMovimientos) {
                if (onError) onError('No se puede eliminar el producto porque tiene movimientos registrados');
                setLoading(false);
                return;
            }

            if (tienePedidos) {
                if (onError) onError('No se puede eliminar el producto porque está incluido en pedidos');
                setLoading(false);
                return;
            }

            const response = await productsAcopioService.delete(productoActual.id);
            if (response.success) {
                // Detalles en orden del formulario. Keys en español.
                const categoriaNombre = productoActual?.category?.name ?? productoActual?.category_name ?? null;
                const getTipoMedidaNombre = () => {
                    const id = productoActual?.type_measure_id ?? productoActual?.type_measure?.id;
                    if (!id) return productoActual?.type_measure?.name ?? productoActual?.type_measure?.code ?? null;
                    const tm = typeMeasures.find(t => String(t.id) === String(id));
                    return tm?.name ?? tm?.code ?? productoActual?.type_measure?.name ?? null;
                };

                const camposDetalle = {};
                const camposOrden = [
                    'Nombre del Producto',
                    'Descripción',
                    'Cantidad',
                    'Stock mínimo (opcional)',
                    'Tipo de medida',
                    'Categoría',
                    'Receta'
                ];

                camposDetalle['Nombre del Producto'] = { antes: productoActual?.name ?? null };
                camposDetalle['Descripción'] = { antes: productoActual?.description ?? null };
                camposDetalle['Cantidad'] = { antes: productoActual?.quantity ?? null };
                camposDetalle['Stock mínimo (opcional)'] = { antes: productoActual?.stock_minimo ?? null };
                camposDetalle['Tipo de medida'] = { antes: getTipoMedidaNombre() };
                camposDetalle['Categoría'] = { antes: categoriaNombre };

                const receta = extractRecetaFromAcopio(productoActual);
                camposDetalle['Receta'] = { antes: receta };

                const detallesPersonalizados = {
                    campos: camposDetalle,
                    camposOrden,
                    comentario: 'Eliminación de producto de materia prima'
                };

                await logAccion({
                    accion: 'ELIMINAR',
                    lugarAfectado: productoActual?.name || 'Producto de acopio',
                    registroId: productoActual?.id || null,
                    comentario: 'Eliminación de producto de materia prima',
                    detallesPersonalizados
                });
                if (onProductDeleted) onProductDeleted(productoActual.id);
                setIsOpen(false);
                if (setIsOpenVerProducto) setIsOpenVerProducto(false);
                if (onSuccess) onSuccess('Producto eliminado correctamente');
            } else {
                if (onError) onError(response.message || 'No se puede eliminar el producto');
            }
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            if (onError) onError(error.message || 'Error al eliminar el producto');
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
                    ¿Eliminar el producto "{productoActual?.name || 'Sin nombre'}"? Esta acción es irreversible y puede afectar registros relacionados.
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
