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
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import ItemView from '../../common/ItemView';
import Notification from '../../common/Notification';
import ModalDescarga from '../../ui/ModalDescarga';

function VerMovimiento({ isOpen, setIsOpen, movimiento, tipoMovimiento, onMovimientoAnulado, onMovimientoEliminado }) {
    const [loading, setLoading] = useState(false);
    const [movimientos, setMovimientos] = useState([]);
    const [loadingMovimientosList, setLoadingMovimientosList] = useState(false);
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isDestacado, setIsDestacado] = useState(false);


    // Cargar estado de destacado desde localStorage
    useEffect(() => {
        if (movimiento?.id) {
            const movimientosDestacados = JSON.parse(localStorage.getItem('MovimientosDestacados') || '[]');
            const esDestacado = movimientosDestacados.some(m =>
                m.id === movimiento.id && m.tipo === tipoMovimiento
            );
            setIsDestacado(esDestacado);
        }
    }, [movimiento?.id, tipoMovimiento]);

    // Función para preparar datos de descarga
    // eslint-disable-next-line no-unused-vars
    const prepararDatosDescarga = () => {
        if (!movimiento) return { informacionSuperior: {}, tablaHeaders: [], tablaValores: [] };

        // Obtener nombre de la sucursal (ya viene del backend)
        const nombreSucursal = movimiento?.sucursal?.name || 'Sucursal no encontrada';

        // Información superior
        const informacionSuperior = {
            'Responsable': movimiento?.user?.name || movimiento?.personal?.name || 'Usuario desconocido',
            'Tipo': movimiento?.type === 'entrada' ? 'Entrada' : 'Salida',
            'Fecha': new Date(tipoMovimiento === 'acopio' ? movimiento?.date : movimiento?.fecha).toLocaleString(),
            'Estado': movimiento?.estado === 'anulado' ? 'Anulado' : 'Finalizado',
            'Sucursal': nombreSucursal
        };

        // Para movimientos de acopio
        if (tipoMovimiento === 'acopio') {
            if (movimiento?.type === 'entrada' && movimiento?.proveedor?.name) {
                informacionSuperior['Proveedor'] = movimiento.proveedor.name;
            }
            if (movimiento?.type === 'salida' && movimiento?.cliente?.name) {
                informacionSuperior['Cliente'] = movimiento.cliente.name;
            }
            if (movimiento?.metodo_pago) {
                informacionSuperior['Método de Pago'] = movimiento.metodo_pago;
            }
            if (movimiento?.costo) {
                informacionSuperior['Costo'] = `Bs. ${parseFloat(movimiento.costo).toFixed(2)}`;
            }
            if (movimiento?.restar_ingredientes !== undefined) {
                informacionSuperior['Restar Ingredientes'] = movimiento.restar_ingredientes ? 'Sí' : 'No';
            }
            if (movimiento?.observaciones) {
                informacionSuperior['Observaciones'] = movimiento.observaciones;
            }

            // Tabla para acopio (un solo producto)
            const tablaHeaders = ['Producto', 'Cantidad', 'Unidad de Medida'];
            const tablaValores = [[
                movimiento?.product?.name || 'Sin producto',
                movimiento?.quantity || '0',
                movimiento?.product?.type_measure?.code || ''
            ]];

            return { informacionSuperior, tablaHeaders, tablaValores };
        }

        // Para movimientos de almacén
        if (tipoMovimiento === 'almacen') {
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
        }

        return { informacionSuperior: {}, tablaHeaders: [], tablaValores: [] };
    };

    // Función para manejar el destacado
    const handleDestacar = () => {
        if (!movimiento?.id) return;

        let movimientosDestacados = JSON.parse(localStorage.getItem('MovimientosDestacados') || '[]');

        if (isDestacado) {
            // Quitar de destacados
            movimientosDestacados = movimientosDestacados.filter(m =>
                !(m.id === movimiento.id && m.tipo === tipoMovimiento)
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
                tipo: tipoMovimiento
            });
            setIsDestacado(true);
        }

        localStorage.setItem('MovimientosDestacados', JSON.stringify(movimientosDestacados));
    };

    // Cargar los movimientos relacionados
    useEffect(() => {
        const loadMovimientos = async () => {
            if (movimiento?.id && isOpen) {
                setLoadingMovimientosList(true);
                try {
                    let response;
                    if (tipoMovimiento === 'acopio' && movimiento.product_id) {
                        response = await movimientosAcopioService.getByProduct(movimiento.product_id);
                    } else {
                        // Para almacén general, no cargamos movimientos relacionados por ahora
                        setMovimientos([]);
                        setLoadingMovimientosList(false);
                        return;
                    }

                    if (response.success) {
                        // Limitar a los últimos 10 movimientos
                        const limitedMovements = (response.data || []).slice(0, 10);
                        setMovimientos(limitedMovements);
                    } else {
                        setMovimientos([]);
                    }
                } catch (error) {
                    console.error('Error cargando movimientos:', error);
                    setMovimientos([]);
                } finally {
                    setLoadingMovimientosList(false);
                }
            }
        };

        loadMovimientos();
    }, [movimiento?.id, isOpen, tipoMovimiento]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Handle para anular movimiento
    const handleAnular = async () => {
        setLoading(true);
        try {
            let response;
            if (tipoMovimiento === 'acopio') {
                response = await movimientosAcopioService.anular(movimiento.id);
            } else {
                response = await movimientosAlmacenService.anular(movimiento.id);
            }

            if (response.success) {
                setIsAnularOpen(false);
                setIsOpen(false);

                if (onMovimientoAnulado) {
                    onMovimientoAnulado(movimiento.id);
                }
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
            let response;
            if (tipoMovimiento === 'acopio') {
                response = await movimientosAcopioService.eliminar(movimiento.id);
            } else {
                response = await movimientosAlmacenService.eliminar(movimiento.id);
            }

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
                <p className={styles.subTitle}>INFORMACIÓN DEL RESPONSABLE</p>
                <ItemView
                    title={movimiento?.user?.name || movimiento?.personal?.name || 'Usuario desconocido'}
                    description="Responsable del movimiento"
                    transparent={false}
                />
                <p className={styles.subTitle}>INFORMACIÓN DEL MOVIMIENTO</p>
                <ItemView
                    title={movimiento?.type === 'entrada' ? 'Entrada' : 'Salida'}
                    description={`Fecha y hora: ${new Date(tipoMovimiento === 'acopio' ? movimiento?.date : movimiento?.fecha).toLocaleString()}`}
                    description2={tipoMovimiento === 'acopio' ? '' : `Tipo de precio: ${movimiento?.precio?.name || 'Precio desconocido'}`}
                    transparent={false}
                    circulo={false}
                    flot6={movimiento?.estado === 'anulado' ? 'Anulado' : 'Finalizado'}

                />
                <ItemView
                    title={movimiento?.type === 'entrada' ? movimiento?.proveedor?.name || 'Sin proveedor' : movimiento?.cliente?.name || 'Sin cliente'}
                    description={movimiento?.type === 'entrada' ? 'Proveedor' : 'Cliente'}
                    transparent={false}
                />
                {tipoMovimiento === 'acopio' && <p className={styles.subTitle}>PRODUCTO</p>}
                {tipoMovimiento === 'acopio' && (
                    <ItemView
                        title={movimiento?.product?.name || 'Sin producto'}
                        description={`${movimiento?.quantity || '0'} ${movimiento?.product?.type_measure?.code || ''}`}
                        transparent={false}
                        icon='package'
                    />
                )}

                {/* Mostrar costo solo para movimientos de acopio */}
                {tipoMovimiento === 'acopio' && movimiento?.type === 'entrada' && (
                    <div className={styles.content}>
                        <Dato
                            label="Costo"
                            value={`Bs. ${(movimiento?.costo || 0).toFixed(2)}`}
                            vertical={false}
                        />
                    </div>
                )}

                {/* Mostrar restar_ingredientes para movimientos de entrada */}
                {movimiento?.type === 'entrada' && (
                    <div className={styles.content}>
                        <Dato
                            label="Restar Ingredientes"
                            value={movimiento?.restar_ingredientes ? 'Sí' : 'No'}
                            vertical={false}
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
                {tipoMovimiento === 'almacen' && <p className={styles.subTitle}>DETALLES DE PRODUCTOS Y SUBTOTAL</p>}
                {/* Botón para ver productos - solo para movimientos de almacén con múltiples productos */}
                {tipoMovimiento === 'almacen' && movimiento?.productos && movimiento.productos.length > 0 && (

                    <Boton
                        className='btn-gray'
                        label={`Productos (${movimiento.productos.length})`}
                        onClick={() => setIsProductosOpen(true)}
                    />

                )}

                {/* Total calculado para movimientos de almacén */}
                {tipoMovimiento === 'almacen' && movimiento?.productos && movimiento.productos.length > 0 && (
                    <div className={styles.content}>
                        <Dato
                            label="Total del Movimiento"
                            value={`Bs. ${(movimiento.productos.reduce((sum, producto) => sum + (parseFloat(producto.subtotal) || 0), 0)).toFixed(2)}`}
                            vertical={false}
                            especial='green'
                        />
                    </div>
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
                nombreArchivo={`Nota_${movimiento?.type === 'entrada' ? 'Entrada' : 'Salida'}_${new Date(tipoMovimiento === 'acopio' ? movimiento?.date : movimiento?.fecha).toLocaleDateString().replace(/\//g, '-')}`}
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
