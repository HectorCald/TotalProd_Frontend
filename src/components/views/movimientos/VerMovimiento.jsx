import React, { useState, useEffect, useMemo } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Dato from '../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../common/Boton';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import deudasService from '../../../services/deudasService';
import ItemView from '../../common/ItemView';
import Notification from '../../common/Notification';
import DescargaMovimientoBuilder from './DescargaMovimientoBuilder';
import { useLayout } from '../../../context/LayoutContext';
import ModalTable from '../../common/ModalTable';
import AlmacenGeneral from '../almacen-general/AlmacenGeneral';

function VerMovimiento({ isOpen, setIsOpen, movimiento, onMovimientoAnulado, onMovimientoEliminado, onMovimientoActualizado }) {
    const { isLargeScreen } = useLayout();
    const [loading, setLoading] = useState(false);
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isAlmacenOpen, setIsAlmacenOpen] = useState(false);
    const [modoAlmacen, setModoAlmacen] = useState('editar'); // 'editar' para editar movimiento
    
    // Estado local para el movimiento actual
    const [movimientoActual, setMovimientoActual] = useState(movimiento);

    // Actualizar el estado local cuando cambie el prop movimiento
    useEffect(() => {
        setMovimientoActual(movimiento);
    }, [movimiento]);

    // Estados para notificaciones
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });
    const mostrarNotificacion = (tipo, texto) => {
        setNotification({
            isVisible: true,
            type: tipo,
            text: texto
        });

        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    // Filas preparadas para ModalTable (para PC)
    const rowsMemo = useMemo(() => (movimientoActual?.productos || [])
        .map((productoMovimiento) => {
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
                precioTexto = `${(precioUnitario * grup).toFixed(2)} BOB`;
            } else {
                cantidadTexto = `${cantidad} ud`;
                precioTexto = `${precioUnitario.toFixed(2)} BOB`;
            }
            
            return [
                productoMovimiento.producto?.name || 'Sin nombre',
                cantidadTexto,
                precioTexto,
                `${(parseFloat(productoMovimiento.subtotal) || 0).toFixed(2)} BOB`
            ];
        }), [movimientoActual?.productos, movimientoActual?.agrupado]);


    // Handle para anular movimiento
    const handleAnular = async () => {
        setLoading(true);
        try {
            // 1) Si el movimiento tiene deuda_id, limpiar primero el deuda_id del movimiento
            if (movimientoActual?.deuda_id) {
                const updateResponse = await movimientosAlmacenService.update(movimientoActual.id, { deuda_id: null });
                if (!updateResponse.success) {
                    mostrarNotificacion('error', `Error al limpiar deuda_id del movimiento: ${updateResponse.message}`);
                    setLoading(false);
                    return;
                }
            }

            // 2) Si el movimiento tiene gasto_id, limpiar y eliminar gasto antes de anular
            if (movimientoActual?.gasto_id) {
                // Limpiar gasto_id en el movimiento
                const limpiarResp = await movimientosAlmacenService.update(movimientoActual.id, { gasto_id: null });
                if (!limpiarResp.success) {
                    mostrarNotificacion('error', `Error al limpiar gasto_id del movimiento: ${limpiarResp.message}`);
                    setLoading(false);
                    return;
                }
                // Eliminar el gasto
                try {
                    const gastoResp = await (await import('../../../services/gastosService')).default.delete(movimientoActual.gasto_id);
                    if (!gastoResp.success) {
                        mostrarNotificacion('error', `Error al eliminar gasto asociado: ${gastoResp.message}`);
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error('Error eliminando gasto asociado:', e);
                    mostrarNotificacion('error', 'Error al eliminar el gasto asociado');
                    setLoading(false);
                    return;
                }
            }

            // 3) Anular el movimiento normalmente
            const response = await movimientosAlmacenService.anular(movimientoActual.id);

            if (response.success) {
                // 4) Si había una deuda, eliminarla después de anular el movimiento
                if (movimientoActual?.deuda_id) {
                    const deudaResponse = await deudasService.delete(movimientoActual.deuda_id);
                    if (!deudaResponse.success) {
                        console.warn('Error al eliminar la deuda después de anular:', deudaResponse.message);
                        // No mostrar error al usuario ya que el movimiento ya se anuló correctamente
                    }
                }

                // Usar la respuesta del servidor que incluye el movimiento actualizado
                const movimientoActualizado = response.data;
                
                // Actualizar el estado local del movimiento
                setMovimientoActual(movimientoActualizado);

                // Notificar al componente padre del cambio
                if (onMovimientoActualizado) {
                    onMovimientoActualizado(movimientoActualizado);
                }

                // También llamar al callback original para mantener compatibilidad
                if (onMovimientoAnulado) {
                    onMovimientoAnulado(movimientoActual.id);
                }

                setIsAnularOpen(false);
                // NO cerrar VerMovimiento, solo actualizar el estado
                mostrarNotificacion('success', 'Movimiento anulado correctamente');
            } else {
                const msg = response.message || 'Error al anular el movimiento';
                mostrarNotificacion('error', msg);
            }
        } catch (error) {
            console.error('Error anulando movimiento:', error);
            mostrarNotificacion('error', 'Error al anular el movimiento');
        } finally {
            setLoading(false);
        }
    };

    // Handle para eliminar movimiento
    const handleEliminar = async () => {
        setLoading(true);
        try {
            const response = await movimientosAlmacenService.eliminar(movimientoActual.id);

            if (response.success) {
                setIsEliminarOpen(false);
                setIsOpen(false);

                if (onMovimientoEliminado) {
                    onMovimientoEliminado(movimientoActual.id);
                }
            } else {
                mostrarNotificacion('error', response.message || 'Error al eliminar el movimiento');
            }
        } catch (error) {
            console.error('Error eliminando movimiento:', error);
            mostrarNotificacion('error', 'Error al eliminar el movimiento');
        } finally {
            setLoading(false);
        }
    };

    // Handle para repetir movimiento
    const handleRepetirMovimiento = () => {
        if (!movimientoActual) {
            mostrarNotificacion('error', 'No hay movimiento para repetir');
            return;
        }

        // Limpiar completamente la canasta de salidas en localStorage
        localStorage.removeItem('canastaSalidas');
        localStorage.removeItem('movimientoIdEditando');
        localStorage.removeItem('precioIdEditando');
        localStorage.removeItem('movimientoAgrupadoEditando');
        localStorage.removeItem('clienteIdEditando');
        localStorage.removeItem('clienteNameEditando');
        localStorage.removeItem('metodoPagoEditando');
        localStorage.removeItem('productosMovimientoEditando');

        // Guardar datos del movimiento para repetir (como nueva salida)
        localStorage.setItem('precioIdEditando', movimientoActual.precio_id || '');
        localStorage.setItem('movimientoAgrupadoEditando', movimientoActual.agrupado ? 'agrupado' : 'no_agrupado');
        localStorage.setItem('metodoPagoEditando', movimientoActual.metodo_pago || '');
        
        // Guardar información del cliente si existe
        if (movimientoActual.cliente?.id) {
            localStorage.setItem('clienteIdEditando', movimientoActual.cliente.id);
            localStorage.setItem('clienteNameEditando', movimientoActual.cliente.name || '');
        } else {
            localStorage.removeItem('clienteIdEditando');
            localStorage.removeItem('clienteNameEditando');
        }
        
        // Guardar productos del movimiento para cargar automáticamente
        const productosMovimiento = movimientoActual.productos?.map(productoMovimiento => {
            let cantidadParaGuardar = productoMovimiento.cantidad;
            
            // Si el movimiento es agrupado, convertir la cantidad a grupos
            if (movimientoActual.agrupado && productoMovimiento.producto?.grup) {
                cantidadParaGuardar = Math.round(productoMovimiento.cantidad / productoMovimiento.producto.grup);
            }
            
            return {
                id: productoMovimiento.producto.id,
                cantidad: cantidadParaGuardar
            };
        }) || [];
        localStorage.setItem('productosMovimientoEditando', JSON.stringify(productosMovimiento));

        // Abrir AlmacenGeneral en modo salida normal
        setModoAlmacen('salida');
        setIsAlmacenOpen(true);
    };



    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    Detalles
                    <div className={styles.iconButton}>
                        <button className={styles.iconButton} onClick={() => setIsDescargaOpen(true)}>
                            <BoxIcon
                                name='download'
                                className={styles.iconDownload}
                            />
                        </button>
                    </div>
                </h1>
                <p className={styles.subTitle}>INFORMACIÓN DEL MOVIMIENTO</p>
                <ItemView
                    title={movimientoActual?.user?.name || movimientoActual?.personal?.name || 'Usuario desconocido'}
                    description="Responsable del movimiento"
                    transparent={false}
                />
                <ItemView
                    title={movimientoActual?.type === 'entrada' ? 'Entrada' : 'Salida'}
                    description={`Fecha y hora: ${new Date(movimientoActual?.fecha).toLocaleString()}`}
                    description2={`Tipo de precio: ${movimientoActual?.precio?.name || 'Precio desconocido'}`}
                    transparent={false}
                    circulo={false}
                    flot6={movimientoActual?.estado === 'anulado' ? 'Anulado' : 'Finalizado'}
                />
                <div className={styles.content}>
                    <Dato
                        label="Modalidad"
                        value={movimientoActual?.agrupado ? 'Agrupado' : 'Unidades'}
                        vertical={false}
                    />
                </div>
                {(movimientoActual?.proveedor_id || movimientoActual?.cliente_id) && (
                    <ItemView
                        title={movimientoActual?.type === 'entrada' ? movimientoActual?.proveedor?.name || 'Sin proveedor' : movimientoActual?.cliente?.name || 'Sin cliente'}
                        description={movimientoActual?.type === 'entrada' ? 'Proveedor' : 'Cliente'}
                        flot2={movimientoActual?.type === 'entrada' ? `${movimientoActual?.proveedor?.total_orders || 0} órdenes` : `Orden Nº ${movimientoActual?.numero_orden || 0}`}
                        transparent={false}
                    />
                )}

                {/* Botón para ver productos - solo para movimientos con múltiples productos */}
                {movimientoActual?.productos && movimientoActual.productos.length > 0 && (
                    <Boton
                        className='btn-gray'
                        label={`Productos (${movimientoActual.productos.length})`}
                        onClick={() => setIsProductosOpen(true)}
                    />
                )}
                {/* Información de producción si es un movimiento de Damabrava 
                {movimiento?.produccion_damabrava_id && (
                    <div className={styles.content}>
                        <Dato
                            label="Origen"
                            value="Ingreso desde Producción Damabrava"
                            vertical={false}
                            especial="blue"
                        />
                    </div>
                )}
                    */}

                {/* Observaciones del movimiento */}
                {movimientoActual?.observaciones && (
                    <div className={styles.content}>
                        <Dato
                            label="Observaciones"
                            value={movimientoActual.observaciones}
                            vertical={true}
                        />
                    </div>
                )}
                {movimientoActual?.metodo_pago && (
                    <Dato
                        label="Método de pago"
                        value={movimientoActual.metodo_pago}
                        vertical={false}
                    />
                )}


                {/* Total calculado para movimientos */}
                {movimientoActual?.productos && movimientoActual.productos.length > 0 && (
                    <Dato
                        label="Total del Movimiento"
                        value={`Bs. ${(movimientoActual.productos.reduce((sum, producto) => sum + (parseFloat(producto.subtotal) || 0), 0)).toFixed(2)}`}
                        vertical={false}
                        especial='green'
                    />
                )}
                <div className={styles.buttons}>
                    {movimientoActual?.estado === 'anulado' ? (
                        <Boton
                            className='btn-red'
                            label='Eliminar Movimiento'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsEliminarOpen(true)}
                        />
                    ) : (
                        <>
                            {movimientoActual?.type === 'salida' && (
                                <Boton
                                    className='btn-default'
                                    label='Repetir Movimiento'
                                    style={{ marginTop: 'auto' }}
                                    onClick={handleRepetirMovimiento}
                                />
                            )}
                            {!movimientoActual?.tiene_pedido_relacionado && (
                                <Boton
                                    className='btn-red'
                                    label='Anular Movimiento'
                                    style={{ marginTop: 'auto' }}
                                    onClick={() => setIsAnularOpen(true)}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>



            {/* Modal de productos */}
            {isLargeScreen ? (
                <ModalTable
                    isOpen={isProductosOpen}
                    title="Productos del Movimiento"
                    headers={['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']}
                    rows={rowsMemo}
                    onClose={() => setIsProductosOpen(false)}
                />
            ) : (
                <ViewModal isOpen={isProductosOpen} setIsOpen={setIsProductosOpen}>
                    <HeaderModal
                        title="Productos del Movimiento"
                        onClose={() => setIsProductosOpen(false)}
                    />
                    <div className={styles.modalContent}>
                        {movimientoActual?.productos && movimientoActual.productos.length > 0 && (
                            <>
                                <p className={styles.subTitle}>PRODUCTOS INCLUIDOS</p>

                                {movimientoActual.productos.map((productoMovimiento, index) => {
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
                                        precioTexto = `${(precioUnitario * grup).toFixed(2)} BOB`;
                                    } else {
                                        cantidadTexto = `${cantidad} ud`;
                                        precioTexto = `${precioUnitario.toFixed(2)} BOB`;
                                    }
                                    
                                    return (
                                        <ItemView
                                            key={`${productoMovimiento.producto?.id || 'producto'}-${index}`}
                                            title={productoMovimiento.producto?.name || 'Sin nombre'}
                                            description={`${cantidadTexto} - ${precioTexto}`}
                                            flot2={`${(parseFloat(productoMovimiento.subtotal) || 0).toFixed(2)} BOB`}
                                        />
                                    );
                                })}

                                {/* Total al final de la lista */}
                                <ItemView
                                    title={'TOTAL'}
                                    description={''}
                                    flot2={`${(movimientoActual.productos.reduce((sum, producto) => sum + (parseFloat(producto.subtotal) || 0), 0)).toFixed(2)} BOB`}
                                />

                            </>
                        )}
                    </div>
                </ViewModal>
            )}

            {/* Modal de descarga */}
            <DescargaMovimientoBuilder
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                movimientoId={movimientoActual?.id}
                movimientoData={movimientoActual}
                tipo="almacen"
            />

            {/* Modal de anular movimiento */}
            <ViewModal isOpen={isAnularOpen} setIsOpen={setIsAnularOpen}>
                <HeaderModal
                    title="Anular Movimiento"
                    onClose={() => setIsAnularOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas anular este movimiento? Esta acción no se puede deshacer y si en el movimiento se consumio materia prima se devolvera el peso correspondiente.
                        {movimiento?.restar_ingredientes && (
                            <><br /><br />
                                <strong>Nota:</strong> Este movimiento consumió ingredientes. Al anularlo, se devolverá el peso de los ingredientes consumidos al stock de acopio.
                            </>
                        )}
                        {movimiento?.produccion_damabrava_id && (
                            <><br /><br />
                                <strong>Nota:</strong> Este movimiento proviene de producción de Damabrava. Al anularlo, se restará la cantidad del registro de producción y se actualizará su estado si es necesario.
                            </>
                        )}
                    </p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsAnularOpen(false)}
                        />
                        <Boton
                            className='btn-red'
                            label='Sí, anular'
                            style={{ marginTop: 'auto' }}
                            onClick={handleAnular}
                            loading={loading}
                        />

                    </div>
                </div>
            </ViewModal>

            {/* Modal de eliminar movimiento */}
            <ViewModal isOpen={isEliminarOpen} setIsOpen={setIsEliminarOpen}>
                <HeaderModal
                    title="Eliminar Movimiento"
                    onClose={() => setIsEliminarOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas eliminar permanentemente este movimiento? Esta acción no se puede deshacer.
                    </p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsEliminarOpen(false)}
                        />
                        <Boton
                            className='btn-red'
                            label='Sí, eliminar'
                            style={{ marginTop: 'auto' }}
                            onClick={handleEliminar}
                            loading={loading}
                        />

                    </div>
                </div>
            </ViewModal>

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Modal de AlmacenGeneral para editar movimiento */}
            <AlmacenGeneral
                isOpen={isAlmacenOpen}
                setIsOpen={setIsAlmacenOpen}
                tipo="salida"
            />
        </View>
    );
}
export default VerMovimiento;
