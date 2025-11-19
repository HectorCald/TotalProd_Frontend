import React, { useState, useEffect, useMemo } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Dato from '../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../common/Boton';
import transferenciasAlmacenService from '../../../services/transferenciasAlmacenService';
import ItemView from '../../common/ItemView';
import Notification from '../../common/Notification';
import { useLayout } from '../../../context/LayoutContext';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';
import ModalTable from '../../common/ModalTable';
import DescargaTransferenciaBuilder from './DescargaTransferenciaBuilder';
import AlmacenGeneralII from '../almacen-general-auxiliar-II/AlmacenGeneral-II';
import { formatFechaLiteral, formatHoraSinSegundos } from '../../../utils/dateUtils';
import { formatCurrency } from '../../../utils/numberUtils';
import Text from '../../common/Text';

const calcularPrecioAgrupado = (precioUnitario, grup) => {
    const precio = Number(precioUnitario) * (Number(grup) || 1);
    if (!Number.isFinite(precio)) return 0;
    return Math.round(precio);
};


function VerTransferencia({ isOpen, setIsOpen, transferencia, onTransferenciaAnulada, onTransferenciaEliminada, onTransferenciaActualizada }) {
    const { isLargeScreen } = useLayout();
    const { user } = useUser();
    const { employee } = useEmployee();
    const [loading, setLoading] = useState(false);
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isAlmacenOpen, setIsAlmacenOpen] = useState(false);

    const normalizeText = (value) =>
        (value || '')
            .toString()
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

    // Estado local para la transferencia actual
    const [transferenciaActual, setTransferenciaActual] = useState(transferencia);

    // Actualizar el estado local cuando cambie el prop transferencia o cuando se cierre el modal
    useEffect(() => {
        if (!isOpen) {
            // Limpiar el estado cuando se cierra el modal
            setTransferenciaActual(null);
            return;
        }
        
        if (transferencia) {
            setTransferenciaActual(transferencia);
        } else {
            setTransferenciaActual(null);
        }
    }, [transferencia, isOpen]);

    // NO hacer llamadas al backend - todos los datos vienen completos desde PanelMovimientos.jsx

    // Determinar si es sucursal origen o destino comparando con la sucursal actual
    // El servicio ya obtiene sucu_id internamente, aquí solo comparamos los IDs
    const esSucursalOrigen = useMemo(() => {
        if (!transferenciaActual?.sucu_origen_id) return false;
        const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
        if (!sucursalSeleccionada) return false;
        try {
            const parsed = JSON.parse(sucursalSeleccionada);
            return String(transferenciaActual.sucu_origen_id) === String(parsed.id);
        } catch {
            return false;
        }
    }, [transferenciaActual?.sucu_origen_id]);

    const esSucursalDestino = useMemo(() => {
        if (!transferenciaActual?.sucu_destino_id) return false;
        const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
        if (!sucursalSeleccionada) return false;
        try {
            const parsed = JSON.parse(sucursalSeleccionada);
            return String(transferenciaActual.sucu_destino_id) === String(parsed.id);
        } catch {
            return false;
        }
    }, [transferenciaActual?.sucu_destino_id]);

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
    const rowsMemo = useMemo(() => (transferenciaActual?.productos || [])
        .sort((a, b) => (a?.producto?.name || '').localeCompare(b?.producto?.name || '', 'es', { sensitivity: 'base' }))
        .map((productoTransferencia) => {
            const cantidad = parseFloat(productoTransferencia.cantidad) || 0;
            const grup = parseFloat(productoTransferencia.producto?.grup) || 0;
            const esAgrupado = transferenciaActual?.agrupado && grup > 0;
            const precioUnitario = parseFloat(productoTransferencia.precio_unitario) || 0;

            let cantidadTexto;
            let precioTexto;

            if (esAgrupado) {
                const grupos = Math.floor(cantidad / grup);
                const unidades = cantidad % grup;
                cantidadTexto = unidades > 0 ? `${grupos} grup ${unidades} ud` : `${grupos} grup`;
                // Precio unitario multiplicado por la cantidad de agrupación y redondeado
                const precioAgrupado = calcularPrecioAgrupado(precioUnitario, grup);
                precioTexto = formatCurrency(precioAgrupado);
            } else {
                cantidadTexto = `${cantidad} ud`;
                precioTexto = formatCurrency(precioUnitario);
            }

            const subtotal = parseFloat(productoTransferencia.subtotal) || 0;

            return [
                productoTransferencia.producto?.name || 'Sin nombre',
                cantidadTexto,
                precioTexto,
                formatCurrency(subtotal)
            ];
        }), [transferenciaActual?.productos, transferenciaActual?.agrupado]);


    // Handle para repetir transferencia
    const handleRepetirTransferencia = () => {
        if (!transferenciaActual) {
            mostrarNotificacion('error', 'No hay transferencia para repetir');
            return;
        }

        // Limpiar completamente la canasta de transferencias en localStorage
        localStorage.removeItem('canastaTransferencias');
        localStorage.removeItem('precioIdTransferenciaRepitiendo');
        localStorage.removeItem('transferenciaAgrupadoRepitiendo');
        localStorage.removeItem('conceptoTransferenciaRepitiendo');
        localStorage.removeItem('productosTransferenciaRepitiendo');

        // Guardar datos de la transferencia para repetir
        localStorage.setItem('precioIdTransferenciaRepitiendo', transferenciaActual.precio_id || '');
        localStorage.setItem('transferenciaAgrupadoRepitiendo', transferenciaActual.agrupado ? 'agrupado' : 'no_agrupado');
        
        // Guardar concepto si existe
        const conceptoTransferencia = transferenciaActual?.concepto || '';
        if (conceptoTransferencia && conceptoTransferencia.trim() !== '') {
            localStorage.setItem('conceptoTransferenciaRepitiendo', conceptoTransferencia.trim());
        } else {
            localStorage.removeItem('conceptoTransferenciaRepitiendo');
        }

        // Guardar cliente si existe
        if (transferenciaActual?.cliente?.id && transferenciaActual?.cliente?.name) {
            localStorage.setItem('clienteIdTransferenciaRepitiendo', transferenciaActual.cliente.id);
            localStorage.setItem('clienteNameTransferenciaRepitiendo', transferenciaActual.cliente.name);
        } else {
            localStorage.removeItem('clienteIdTransferenciaRepitiendo');
            localStorage.removeItem('clienteNameTransferenciaRepitiendo');
        }

        // NO guardar sucursal destino - el usuario la seleccionará manualmente
        localStorage.removeItem('sucursalDestinoTransferenciaRepitiendo');

        // Guardar productos de la transferencia para cargar automáticamente
        const productosTransferencia = (transferenciaActual?.productos || [])
            .map((productoTransferencia) => {
                const prodId = productoTransferencia?.producto?.id ?? productoTransferencia?.producto_id;
                if (!prodId) return null;

                let cantidadParaGuardar = Number(productoTransferencia?.cantidad) || 0;

                // Si la transferencia es agrupada, convertir la cantidad a grupos
                if (transferenciaActual?.agrupado && productoTransferencia?.producto?.grup) {
                    const grup = Number(productoTransferencia.producto.grup) || 0;
                    if (grup > 0) {
                        cantidadParaGuardar = Math.round(cantidadParaGuardar / grup);
                    }
                }

                return {
                    id: prodId,
                    cantidad: cantidadParaGuardar
                };
            })
            .filter(Boolean);
        localStorage.setItem('productosTransferenciaRepitiendo', JSON.stringify(productosTransferencia));

        // Abrir AlmacenGeneralII en modo transferir
        setIsAlmacenOpen(true);
    };

    // Handle para anular transferencia
    const handleAnular = async () => {
        setLoading(true);
        try {
            const response = await transferenciasAlmacenService.anular(transferenciaActual.id);

            if (response.success && response.data) {
                // Usar los datos actualizados del backend
                const transferenciaActualizada = response.data;
                
                // Formatear los datos del usuario/personal si vienen del backend
                if (transferenciaActualizada.user && typeof transferenciaActualizada.user === 'object') {
                    transferenciaActualizada.user = {
                        id: transferenciaActualizada.user.id,
                        name: `${transferenciaActualizada.user.first_name || ''} ${transferenciaActualizada.user.last_name || ''}`.trim()
                    };
                }
                
                if (transferenciaActualizada.personal && typeof transferenciaActualizada.personal === 'object') {
                    transferenciaActualizada.personal = {
                        id: transferenciaActualizada.personal.id,
                        name: `${transferenciaActualizada.personal.first_name || ''} ${transferenciaActualizada.personal.last_name || ''}`.trim()
                    };
                }
                
                setTransferenciaActual(transferenciaActualizada);

                setIsAnularOpen(false);
                // NO cerrar VerTransferencia, solo actualizar el estado
                mostrarNotificacion('success', 'Transferencia anulada correctamente');

                // Notificar al componente padre del cambio
                if (onTransferenciaActualizada) {
                    onTransferenciaActualizada(transferenciaActualizada);
                }

                // También llamar al callback original para mantener compatibilidad
                if (onTransferenciaAnulada) {
                    onTransferenciaAnulada(transferenciaActual.id);
                }
            } else {
                mostrarNotificacion('error', response.message || 'Error al anular la transferencia');
            }
        } catch (error) {
            console.error('Error anulando transferencia:', error);
            mostrarNotificacion('error', 'Error al anular la transferencia');
        } finally {
            setLoading(false);
        }
    };

    // Handle para eliminar transferencia
    const handleEliminar = async () => {
        setLoading(true);
        try {
            const response = await transferenciasAlmacenService.eliminar(transferenciaActual.id);

            if (response.success) {
                setIsEliminarOpen(false);
                setIsOpen(false);

                if (onTransferenciaEliminada) {
                    onTransferenciaEliminada(transferenciaActual.id);
                }
            } else {
                mostrarNotificacion('error', response.message || 'Error al eliminar la transferencia');
            }
        } catch (error) {
            console.error('Error eliminando transferencia:', error);
            mostrarNotificacion('error', 'Error al eliminar la transferencia');
        } finally {
            setLoading(false);
        }
    };




    const totalTransferencia = (transferenciaActual?.productos || []).reduce((sum, producto) => sum + (parseFloat(producto.subtotal) || 0), 0);
    
    // Obtener el estado actual (del estado local o del prop)
    // Normalizar el estado para comparación (trim y case-insensitive)
    const estadoActualRaw = transferenciaActual?.estado ? String(transferenciaActual.estado).trim() : null;
    const estadoActual = estadoActualRaw ? estadoActualRaw.toLowerCase() : null;
    
    // Solo puede eliminar si es sucursal origen y está anulada
    const puedeEliminar = esSucursalOrigen && estadoActual === 'anulado';
    
    // Solo puede anular si es sucursal destino y no está anulada
    // (si está Finalizado o Transferido, puede anular)
    const puedeAnular = esSucursalDestino && estadoActual !== 'anulado';
    
    // Determinar el label y color del estado
    // Solo hay dos estados visibles para el usuario: Finalizado y Anulado
    let estadoLabel = 'Finalizado';
    let estadoColor = 'blue';
    
    // Comparación case-insensitive del estado
    if (estadoActual === 'anulado') {
        estadoLabel = 'Anulado';
        estadoColor = 'red';
    } else {
        // Cualquier otro estado (Finalizado, Transferido, etc.) se muestra como "Finalizado"
        estadoLabel = 'Finalizado';
        estadoColor = 'blue';
    }

    // No renderizar si no hay transferencia válida
    if (!transferenciaActual || !transferenciaActual.id) return null;

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    Detalles de Transferencia
                    <div className={styles.iconButton}>
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
                    title={transferenciaActual?.user?.name || transferenciaActual?.personal?.name || 'Usuario desconocido'}
                    description="Responsable de la transferencia"
                    transparent={false}
                />
                
                <p className={styles.subTitle}>INFORMACIÓN DE LA TRANSFERENCIA</p>
                {transferenciaActual?.cliente_id && (
                    <ItemView
                        title={transferenciaActual?.cliente?.name || 'Sin cliente'}
                        description="Cliente"
                        transparent={false}
                    />
                )}
                <div className={styles.content}>
                    <Dato
                        label="Sucursal Origen"
                        value={transferenciaActual?.sucursal_origen?.name || 'Sin origen'}
                        vertical={false}
                    />
                    <Dato
                        label="Sucursal Destino"
                        value={transferenciaActual?.sucursal_destino?.name || 'Sin destino'}
                        vertical={false}
                    />
                    <Dato
                        label="Fecha"
                        value={formatFechaLiteral(transferenciaActual?.fecha)}
                        vertical={false}
                    />
                    <Dato
                        label="Hora"
                        value={formatHoraSinSegundos(transferenciaActual?.fecha)}
                        vertical={false}
                    />
                    <Dato
                        label="Tipo de precio"
                        value={transferenciaActual?.precio?.name || 'Precio desconocido'}
                        vertical={false}
                    />
                    <Dato
                        label="Modalidad"
                        value={transferenciaActual?.agrupado ? 'Agrupado' : 'Unidades'}
                        vertical={false}
                    />
                    <Dato
                        label="Estado"
                        value={estadoLabel}
                        vertical={false}
                        especial={estadoColor}
                    />
                    {transferenciaActual?.concepto && (
                        <Dato
                            label="Concepto"
                            value={transferenciaActual.concepto}
                            vertical={false}
                        />
                    )}

                    {/* Total calculado para transferencias */}
                    {transferenciaActual?.productos && transferenciaActual.productos.length > 0 && (
                        <Dato
                            label="Total de la Transferencia"
                            value={formatCurrency(totalTransferencia)}
                            vertical={false}
                            especial='green'
                        />
                    )}
                </div>


                {/* Botón para ver productos - solo para transferencias con múltiples productos */}
                {transferenciaActual?.productos && transferenciaActual.productos.length > 0 && (
                    <Boton
                        className='btn-gray'
                        label={`Productos (${transferenciaActual.productos.length})`}
                        onClick={() => setIsProductosOpen(true)}
                    />
                )}

                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Repetir Transferencia'
                        style={{ marginTop: 'auto' }}
                        onClick={handleRepetirTransferencia}
                    />
                    {puedeAnular && (
                        <Boton
                            className='btn-red'
                            label='Anular Transferencia'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsAnularOpen(true)}
                        />
                    )}
                    {puedeEliminar && (
                        <Boton
                            className='btn-red'
                            label='Eliminar Transferencia'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsEliminarOpen(true)}
                        />
                    )}
                </div>
            </div>



            {/* Modal de productos */}
            {isLargeScreen ? (
                <ModalTable
                    isOpen={isProductosOpen}
                    title="Productos de la Transferencia"
                    headers={['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']}
                    rows={rowsMemo}
                    onClose={() => setIsProductosOpen(false)}
                />
            ) : (
                <ViewModal isOpen={isProductosOpen} setIsOpen={setIsProductosOpen}>
                    <HeaderModal
                        title="Productos de la Transferencia"
                        onClose={() => setIsProductosOpen(false)}
                    />
                    <div className={styles.modalContent}>
                        {transferenciaActual?.productos && transferenciaActual.productos.length > 0 && (
                            <>
                                <p className={styles.subTitle}>PRODUCTOS INCLUIDOS</p>

                                {transferenciaActual.productos
                                    .sort((a, b) => (a.producto?.name || '').localeCompare(b.producto?.name || '', 'es', { sensitivity: 'base' }))
                                    .map((productoTransferencia, index) => {
                                        const cantidad = parseFloat(productoTransferencia.cantidad) || 0;
                                        const grup = parseFloat(productoTransferencia.producto?.grup) || 0;
                                        const esAgrupado = transferenciaActual?.agrupado && grup > 0;
                                        const precioUnitario = parseFloat(productoTransferencia.precio_unitario) || 0;

                                        let cantidadTexto;
                                        let precioTexto;

                                        if (esAgrupado) {
                                            const grupos = Math.floor(cantidad / grup);
                                            const unidades = cantidad % grup;
                                            cantidadTexto = unidades > 0 ? `${grupos} grup ${unidades} ud` : `${grupos} grup`;
                                            // Precio unitario multiplicado por la cantidad de agrupación y redondeado
                                            const precioAgrupado = calcularPrecioAgrupado(precioUnitario, grup);
                                            precioTexto = formatCurrency(precioAgrupado);
                                        } else {
                                            cantidadTexto = `${cantidad} ud`;
                                            precioTexto = formatCurrency(precioUnitario);
                                        }

                                        return (
                                            <ItemView
                                                key={`${productoTransferencia.producto?.id || 'producto'}-${index}`}
                                                title={productoTransferencia.producto?.name || 'Sin nombre'}
                                                description={`Precio Unitario: ${precioTexto}`}
                                                flot2={cantidadTexto}
                                                circulo={false}
                                            />
                                        );
                                    })}
                            </>
                        )}
                    </div>
                </ViewModal>
            )}

            {/* Modal de anular transferencia */}
            <ViewModal isOpen={isAnularOpen} setIsOpen={setIsAnularOpen}>
                <HeaderModal
                    title="Anular Transferencia"
                    onClose={() => setIsAnularOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas anular esta transferencia? Esta acción no se puede deshacer.
                    </p>
                    <div style={{ marginTop: '10px', marginBottom: '10px', width: '100%' }}>
                        <Text type="error" align="left">
                            Al anular esta transferencia se devolverán las cantidades de los productos a la sucursal de origen y se restarán de la sucursal de destino.
                        </Text>
                    </div>
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
                            segundosDisabled={5}
                        />
                    </div>
                </div>
            </ViewModal>

            {/* Modal de eliminar transferencia */}
            <ViewModal isOpen={isEliminarOpen} setIsOpen={setIsEliminarOpen}>
                <HeaderModal
                    title="Eliminar Transferencia"
                    onClose={() => setIsEliminarOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas eliminar permanentemente esta transferencia? Esta acción no se puede deshacer.
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
                            segundosDisabled={5}
                        />

                    </div>
                </div>
            </ViewModal>

            {/* Modal de descarga */}
            <DescargaTransferenciaBuilder
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                transferenciaId={transferenciaActual?.id}
                transferenciaData={transferenciaActual}
            />

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Modal de AlmacenGeneralII para repetir transferencia */}
            <AlmacenGeneralII
                isOpen={isAlmacenOpen}
                setIsOpen={(isOpen) => {
                    setIsAlmacenOpen(isOpen);
                    // Limpiar productos de la transferencia cuando se cierra AlmacenGeneralII
                    if (!isOpen) {
                        localStorage.removeItem('productosTransferenciaRepitiendo');
                        localStorage.removeItem('precioIdTransferenciaRepitiendo');
                        localStorage.removeItem('transferenciaAgrupadoRepitiendo');
                        localStorage.removeItem('conceptoTransferenciaRepitiendo');
                        localStorage.removeItem('sucursalDestinoTransferenciaRepitiendo');
                        localStorage.removeItem('clienteIdTransferenciaRepitiendo');
                        localStorage.removeItem('clienteNameTransferenciaRepitiendo');
                    }
                }}
                tipo="transferir"
                isRepitiendoTransferencia={true}
            />
        </View>
    );
}
export default VerTransferencia;
