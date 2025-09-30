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
import ItemView from '../../common/ItemView';
import Notification from '../../common/Notification';
import ModalDescarga from '../../ui/ModalDescarga';

function VerMovimientoAcopio({ isOpen, setIsOpen, movimiento, onMovimientoAnulado, onMovimientoEliminado }) {
    const [loading, setLoading] = useState(false);
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

    // Función para cargar estado de destacado desde localStorage para movimientos de acopio
    useEffect(() => {
        if (movimiento?.id) {
            const movimientosDestacados = JSON.parse(localStorage.getItem('MovimientosDestacados') || '[]');
            const esDestacado = movimientosDestacados.some(m =>
                m.id === movimiento.id && m.tipo === 'acopio'
            );
            setIsDestacado(esDestacado);
        }
    }, [movimiento?.id]);
    const handleDestacar = () => {
        if (!movimiento?.id) return;

        let movimientosDestacados = JSON.parse(localStorage.getItem('MovimientosDestacados') || '[]');

        if (isDestacado) {
            // Quitar de destacados
            movimientosDestacados = movimientosDestacados.filter(m =>
                !(m.id === movimiento.id && m.tipo === 'acopio')
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
                tipo: 'acopio'
            });
            setIsDestacado(true);
        }

        localStorage.setItem('MovimientosDestacados', JSON.stringify(movimientosDestacados));
    };



    // Función para preparar datos de descarga
    const prepararDatosDescarga = () => {
        if (!movimiento) return { informacionSuperior: {}, tablaHeaders: [], tablaValores: [] };

        // Obtener nombre de la sucursal (ya viene del backend)
        const nombreSucursal = movimiento?.sucursal?.name || 'Sucursal no encontrada';

        // Información superior
        const informacionSuperior = {
            'Responsable': movimiento?.user?.name || movimiento?.personal?.name || 'Usuario desconocido',
            'Tipo': movimiento?.type === 'entrada' ? 'Entrada' : 'Salida',
            'Fecha': new Date(movimiento?.date).toLocaleString(),
            'Estado': movimiento?.estado === 'anulado' ? 'Anulado' : 'Finalizado',
            'Sucursal': nombreSucursal
        };

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
    };


    // Handle para anular movimiento
    const handleAnular = async () => {
        setLoading(true);
        try {
            const response = await movimientosAcopioService.anular(movimiento.id);

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
            const response = await movimientosAcopioService.eliminar(movimiento.id);

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
                    description={`Fecha y hora: ${new Date(movimiento?.date).toLocaleString()}`}
                    transparent={false}
                    circulo={false}
                    flot6={movimiento?.estado === 'anulado' ? 'Anulado' : 'Finalizado'}
                />
                <ItemView
                    title={movimiento?.type === 'entrada' ? movimiento?.proveedor?.name || 'Sin proveedor' : movimiento?.cliente?.name || 'Sin cliente'}
                    description={movimiento?.type === 'entrada' ? 'Proveedor' : 'Cliente'}
                    transparent={false}
                />
                <p className={styles.subTitle}>PRODUCTO</p>
                <ItemView
                    title={movimiento?.product?.name || 'Sin producto'}
                    description={`${movimiento?.quantity || '0'} ${movimiento?.product?.type_measure?.code || ''}`}
                    transparent={false}
                    icon='package'
                />

                {/* Mostrar costo solo para movimientos de entrada */}
                {movimiento?.type === 'entrada' && (
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

            {/* Modal de descarga */}
            <ModalDescarga
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                titulo="Descargar Movimiento"
                subtitulo="Selecciona el formato que prefieras para descargar este movimiento."
                nombreArchivo={`Nota_${movimiento?.type === 'entrada' ? 'Entrada' : 'Salida'}_${new Date(movimiento?.date).toLocaleDateString().replace(/\//g, '-')}`}
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

export default VerMovimientoAcopio;
