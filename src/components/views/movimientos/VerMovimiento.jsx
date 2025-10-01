import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Dato from '../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import Boton from '../../common/Boton';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import deudasService from '../../../services/deudasService';
import ItemView from '../../common/ItemView';
import Notification from '../../common/Notification';
import ModalDescarga from '../../ui/ModalDescarga';

function VerMovimiento({ isOpen, setIsOpen, movimiento, onMovimientoAnulado, onMovimientoEliminado }) {
    const [loading, setLoading] = useState(false);
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isDestacado, setIsDestacado] = useState(false);

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

    // Función para manejar el destacado
    const handleDestacar = () => {
        if (!movimiento?.id) return;

        let movimientosDestacados = JSON.parse(localStorage.getItem('MovimientosDestacados') || '[]');

        if (isDestacado) {
            // Quitar de destacados
            movimientosDestacados = movimientosDestacados.filter(m =>
                !(m.id === movimiento.id && m.tipo === 'almacen')
            );
            setIsDestacado(false);
        } else {
            // Verificar si ya hay 10 movimientos destacados
            if (movimientosDestacados.length >= 10) {
                mostrarNotificacion('error', 'Solo puedes destacar máximo 10 movimientos');
                return;
            }

            // Agregar a destacados
            movimientosDestacados.push({
                id: movimiento.id,
                tipo: 'almacen'
            });
            setIsDestacado(true);
        }

        localStorage.setItem('MovimientosDestacados', JSON.stringify(movimientosDestacados));
    };
    useEffect(() => {
        if (movimiento?.id) {
            const movimientosDestacados = JSON.parse(localStorage.getItem('MovimientosDestacados') || '[]');
            const esDestacado = movimientosDestacados.some(m =>
                m.id === movimiento.id && m.tipo === 'almacen'
            );
            setIsDestacado(esDestacado);
        }
    }, [movimiento?.id]);



    // Función para preparar datos de descarga
    const prepararDatosDescarga = () => {
        if (!movimiento) return { informacionSuperior: {}, tablaHeaders: [], tablaValores: [] };

        // Obtener nombre de la sucursal (ya viene del backend)
        const nombreSucursal = movimiento?.sucursal?.name || 'Sucursal no encontrada';

        // Información superior
        const informacionSuperior = {
            'Responsable': movimiento?.user?.name || movimiento?.personal?.name || 'Usuario desconocido',
            'Tipo': movimiento?.type === 'entrada' ? 'Entrada' : 'Salida',
            'Fecha': new Date(movimiento?.fecha).toLocaleString(),
            'Estado': movimiento?.estado === 'anulado' ? 'Anulado' : 'Finalizado',
            'Sucursal': nombreSucursal
        };

        if (movimiento?.precio?.name) {
            informacionSuperior['Tipo de Precio'] = movimiento.precio.name;
        }
        if (movimiento?.metodo_pago) {
            informacionSuperior['Método de Pago'] = movimiento.metodo_pago;
        }
        if (movimiento?.productos && movimiento.productos.length > 0) {
            const total = movimiento.productos.reduce((sum, producto) => sum + (parseFloat(producto.subtotal) || 0), 0);
            informacionSuperior['Total'] = `Bs. ${total.toFixed(2)}`;
        }
        if (movimiento?.observaciones) {
            informacionSuperior['Observaciones'] = movimiento.observaciones;
        }

        // Tabla para almacén (múltiples productos)
        const tablaHeaders = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
        const tablaValores = (movimiento?.productos || []).map(producto => [
            producto?.producto?.name || 'Sin producto',
            producto?.cantidad || '0',
            `Bs. ${(parseFloat(producto?.precio_unitario) || 0).toFixed(2)}`,
            `Bs. ${(parseFloat(producto?.subtotal) || 0).toFixed(2)}`
        ]);

        return { informacionSuperior, tablaHeaders, tablaValores };
    };

    // Handle para anular movimiento
    const handleAnular = async () => {
        setLoading(true);
        try {
            // 1) Si el movimiento tiene deuda_id, limpiar primero el deuda_id del movimiento
            if (movimiento?.deuda_id) {
                const updateResponse = await movimientosAlmacenService.update(movimiento.id, { deuda_id: null });
                if (!updateResponse.success) {
                    mostrarNotificacion('error', `Error al limpiar deuda_id del movimiento: ${updateResponse.message}`);
                    setLoading(false);
                    return;
                }
            }

            // 2) Anular el movimiento normalmente
            const response = await movimientosAlmacenService.anular(movimiento.id);

            if (response.success) {
                // 3) Si había una deuda, eliminarla después de anular el movimiento
                if (movimiento?.deuda_id) {
                    const deudaResponse = await deudasService.delete(movimiento.deuda_id);
                    if (!deudaResponse.success) {
                        console.warn('Error al eliminar la deuda después de anular:', deudaResponse.message);
                        // No mostrar error al usuario ya que el movimiento ya se anuló correctamente
                    }
                }

                setIsAnularOpen(false);
                setIsOpen(false);

                if (onMovimientoAnulado) {
                    onMovimientoAnulado(movimiento.id);
                }
                mostrarNotificacion('success', 'Movimiento anulado correctamente');
            } else {
                mostrarNotificacion('error', response.message || 'Error al anular el movimiento');
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
            const response = await movimientosAlmacenService.eliminar(movimiento.id);

            if (response.success) {
                setIsEliminarOpen(false);
                setIsOpen(false);

                if (onMovimientoEliminado) {
                    onMovimientoEliminado(movimiento.id);
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


    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    Detalles
                    <div className={styles.iconButton}>
                        <button
                            className={styles.iconButton}
                            onClick={handleDestacar}
                            title={isDestacado ? 'Quitar de destacados' : 'Destacar movimiento'}
                        >
                            {isDestacado ? (
                                <FaStar
                                    className={styles.iconStar}
                                    style={{ color: '#FFD700' }}
                                />
                            ) : (
                                <FaRegStar
                                    className={styles.iconStar}
                                    style={{ color: '#666' }}
                                />
                            )}
                        </button>
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
                    title={movimiento?.user?.name || movimiento?.personal?.name || 'Usuario desconocido'}
                    description="Responsable del movimiento"
                    transparent={false}
                />
                <ItemView
                    title={movimiento?.type === 'entrada' ? 'Entrada' : 'Salida'}
                    description={`Fecha y hora: ${new Date(movimiento?.fecha).toLocaleString()}`}
                    description2={`Tipo de precio: ${movimiento?.precio?.name || 'Precio desconocido'}`}
                    transparent={false}
                    circulo={false}
                    flot6={movimiento?.estado === 'anulado' ? 'Anulado' : 'Finalizado'}
                />
                <ItemView
                    title={movimiento?.type === 'entrada' ? movimiento?.proveedor?.name || 'Sin proveedor' : movimiento?.cliente?.name || 'Sin cliente'}
                    description={movimiento?.type === 'entrada' ? 'Proveedor' : 'Cliente'}
                    transparent={false}
                />
                {/* Botón para ver productos - solo para movimientos con múltiples productos */}
                {movimiento?.productos && movimiento.productos.length > 0 && (
                    <Boton
                        className='btn-gray'
                        label={`Productos (${movimiento.productos.length})`}
                        onClick={() => setIsProductosOpen(true)}
                    />
                )}
                {/* Observaciones del movimiento */}
                {movimiento?.observaciones && (
                    <div className={styles.content}>
                        <Dato
                            label="Observaciones"
                            value={movimiento.observaciones}
                            vertical={true}
                        />
                    </div>
                )}
                {movimiento?.metodo_pago && (
                    <Dato
                        label="Método de pago"
                        value={movimiento.metodo_pago}
                        vertical={false}
                    />
                )}
                

                {/* Total calculado para movimientos */}
                {movimiento?.productos && movimiento.productos.length > 0 && (
                    <Dato
                        label="Total del Movimiento"
                        value={`Bs. ${(movimiento.productos.reduce((sum, producto) => sum + (parseFloat(producto.subtotal) || 0), 0)).toFixed(2)}`}
                        vertical={false}
                        especial='green'
                    />
                )}
                <div className={styles.buttons}>
                    {movimiento?.estado === 'anulado' ? (
                        <Boton
                            className='btn-red'
                            label='Eliminar Movimiento'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsEliminarOpen(true)}
                        />
                    ) : !movimiento?.tiene_pedido_relacionado ? (
                        <Boton
                            className='btn-red'
                            label='Anular Movimiento'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsAnularOpen(true)}
                        />
                    ) : null}
                </div>
            </div>



            {/* Modal de productos */}
            <ViewModal isOpen={isProductosOpen} setIsOpen={setIsProductosOpen}>
                <HeaderModal
                    title="Productos del Movimiento"
                    onClose={() => setIsProductosOpen(false)}
                />
                <div className={styles.modalContent}>
                    {movimiento?.productos && movimiento.productos.length > 0 && (
                        <>
                            <p className={styles.subTitle}>PRODUCTOS INCLUIDOS</p>

                            {movimiento.productos.map((productoMovimiento, index) => (
                                <ItemView
                                    title={productoMovimiento.producto?.name || 'Sin nombre'}
                                    description={`${productoMovimiento.cantidad || 0} ud - ${productoMovimiento.precio_unitario || 0} BOB`}
                                    flot2={productoMovimiento.subtotal + ' BOB' || 0}
                                />
                            ))}

                        </>
                    )}
                </div>
            </ViewModal>

            {/* Modal de descarga */}
            <ModalDescarga
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                titulo="Descargar Movimiento"
                subtitulo="Selecciona el formato que prefieras para descargar este movimiento."
                nombreArchivo={`Nota_${movimiento?.type === 'entrada' ? 'Entrada' : 'Salida'}_${new Date(movimiento?.fecha).toLocaleDateString().replace(/\//g, '-')}`}
                {...prepararDatosDescarga()}
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
        </View>
    );
}
export default VerMovimiento;
