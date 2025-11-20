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
import Text from '../../common/Text';
import useHistorialLogger from '../../ui/HistorialLogger';
import { formatMovimientoLog, prepareLogPayload } from '../../../utils/logFormatters';
import { formatFechaLiteral, formatHoraSinSegundos } from '../../../utils/dateUtils';
import permissionsService from '../../../services/permissionsService';
import { formatCurrency } from '../../../utils/numberUtils';

const obtenerNumeroOrdenFormateado = (numeroOrden) => {
    if (numeroOrden === null || numeroOrden === undefined) {
        return '--';
    }
    if (typeof numeroOrden === 'string' && numeroOrden.trim() === '') {
        return '--';
    }
    const numero = Number(numeroOrden);
    if (Number.isNaN(numero) || numero === 0) {
        return '--';
    }
    return String(numeroOrden);
};

function VerMovimiento({ isOpen, setIsOpen, movimiento, onMovimientoAnulado, onMovimientoEliminado, onMovimientoActualizado, onMovimientoEditado }) {
    const { isLargeScreen } = useLayout();
    const [loading, setLoading] = useState(false);
    const [loadingEditar, setLoadingEditar] = useState(false);
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isAlmacenOpen, setIsAlmacenOpen] = useState(false);
    const [modoAlmacen, setModoAlmacen] = useState('repetir'); // 'repetir' para repetir movimiento

    // Estado local para el movimiento actual
    const [movimientoActual, setMovimientoActual] = useState(movimiento);

    const { logAccion } = useHistorialLogger({
        modulo: 'Movimientos'
    });

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
    const rowsMemo = useMemo(() => {
        // Usar productos originales si el movimiento está anulado y los productos actuales están vacíos
        const productosParaMostrar = movimientoActual?.estado === 'anulado' && 
            (!movimientoActual?.productos || movimientoActual.productos.length === 0 || 
             movimientoActual.productos.some(p => !p.producto?.name || p.precio_unitario === 0))
            ? movimiento?.productos || []
            : movimientoActual?.productos || [];

        return productosParaMostrar
            .sort((a, b) => (a?.producto?.name || '').localeCompare(b?.producto?.name || '', 'es', { sensitivity: 'base' }))
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
                    precioTexto = formatCurrency(precioUnitario * grup);
                } else {
                    cantidadTexto = `${cantidad} ud`;
                    precioTexto = formatCurrency(precioUnitario);
                }

                return [
                    productoMovimiento.producto?.name || 'Sin nombre',
                    cantidadTexto,
                    precioTexto,
                    formatCurrency(productoMovimiento.subtotal)
                ];
            });
    }, [movimientoActual?.productos, movimientoActual?.agrupado, movimientoActual?.estado, movimiento?.productos]);

    const obtenerProductosFuente = () => {
        const productosAct = movimientoActual?.productos || [];
        const productosOriginales = movimiento?.productos || [];
        const productosActInvalidos =
            movimientoActual?.estado === 'anulado' &&
            (!productosAct.length || productosAct.some(p => !p?.producto?.id || p.precio_unitario === 0));
        return productosActInvalidos ? productosOriginales : productosAct;
    };

    // Handle para anular movimiento
    const handleAnular = async () => {
        setLoading(true);
        try {
            const movimientoAntesRaw = movimientoActual ? JSON.parse(JSON.stringify(movimientoActual)) : null;
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

                // Preservar los datos originales que podrían perderse al anular
                const movimientoConDatosPreservados = {
                    ...movimientoActualizado,
                    // Preservar datos importantes que podrían perderse
                    fecha: movimientoActualizado.fecha || movimientoActual.fecha,
                    precio: movimientoActualizado.precio || movimientoActual.precio,
                    precio_id: movimientoActualizado.precio_id || movimientoActual.precio_id,
                    agrupado: movimientoActualizado.agrupado !== undefined ? movimientoActualizado.agrupado : movimientoActual.agrupado,
                    metodo_pago: movimientoActualizado.metodo_pago || movimientoActual.metodo_pago,
                    observaciones: movimientoActualizado.observaciones || movimientoActual.observaciones,
                    // Preservar información del responsable
                    user: movimientoActualizado.user || movimientoActual.user,
                    user_id: movimientoActualizado.user_id || movimientoActual.user_id,
                    personal: movimientoActualizado.personal || movimientoActual.personal,
                    personal_id: movimientoActualizado.personal_id || movimientoActual.personal_id,
                    // Preservar información del cliente/proveedor
                    cliente: movimientoActualizado.cliente || movimientoActual.cliente,
                    cliente_id: movimientoActualizado.cliente_id || movimientoActual.cliente_id,
                    proveedor: movimientoActualizado.proveedor || movimientoActual.proveedor,
                    proveedor_id: movimientoActualizado.proveedor_id || movimientoActual.proveedor_id,
                    // Preservar productos con toda su información
                    productos: (() => {
                        // Si hay productos actualizados, preservar su información completa
                        if (movimientoActualizado.productos && movimientoActualizado.productos.length > 0) {
                            return movimientoActualizado.productos.map((productoActualizado) => {
                                // Buscar el producto original por ID
                                const productoOriginal = movimientoActual.productos?.find(
                                    p => p.producto?.id === productoActualizado.producto?.id
                                );
                                
                                return {
                                    ...productoActualizado,
                                    // Preservar información completa del producto
                                    producto: productoActualizado.producto || productoOriginal?.producto,
                                    precio_unitario: productoActualizado.precio_unitario || productoOriginal?.precio_unitario,
                                    cantidad: productoActualizado.cantidad || productoOriginal?.cantidad,
                                    subtotal: productoActualizado.subtotal || productoOriginal?.subtotal
                                };
                            });
                        }
                        // Si no hay productos actualizados, usar los originales
                        return movimientoActual.productos || [];
                    })()
                };

                // Actualizar el estado local del movimiento
                setMovimientoActual(movimientoConDatosPreservados);

                const logAntes = formatMovimientoLog(movimientoAntesRaw);
                const logDespues = formatMovimientoLog(movimientoConDatosPreservados);
                const { datosAntes, datosDespues, campos } = prepareLogPayload({
                    accion: 'EDITAR',
                    datosAntes: logAntes,
                    datosDespues: logDespues
                });
                await logAccion({
                    accion: 'EDITAR',
                    lugarAfectado: `Movimiento #${logDespues?.numero ?? logAntes?.numero ?? movimientoConDatosPreservados?.id ?? movimientoAntesRaw?.id ?? ''}`,
                    registroId: movimientoConDatosPreservados?.id || movimientoAntesRaw?.id || null,
                    datosAntes,
                    datosDespues,
                    comentario: 'Anulación de movimiento',
                    campos
                });

                // Notificar al componente padre del cambio
                if (onMovimientoActualizado) {
                    onMovimientoActualizado(movimientoConDatosPreservados);
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
            const movimientoAntesRaw = movimientoActual ? JSON.parse(JSON.stringify(movimientoActual)) : null;
            const response = await movimientosAlmacenService.eliminar(movimientoActual.id);

            if (response.success) {
                setIsEliminarOpen(false);
                setIsOpen(false);

                const logDatosAntes = formatMovimientoLog(movimientoAntesRaw);
                const { datosAntes, campos } = prepareLogPayload({
                    accion: 'ELIMINAR',
                    datosAntes: logDatosAntes,
                    datosDespues: null
                });
                await logAccion({
                    accion: 'ELIMINAR',
                    lugarAfectado: `Movimiento #${logDatosAntes?.numero ?? movimientoActual?.id ?? ''}`,
                    registroId: movimientoAntesRaw?.id || movimientoActual?.id || null,
                    datosAntes,
                    comentario: 'Eliminación de movimiento',
                    campos
                });

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
        localStorage.removeItem('movimientoIdRepitiendo');
        localStorage.removeItem('movimientoIdEditando');
        localStorage.removeItem('precioIdRepitiendo');
        localStorage.removeItem('precioIdEditando');
        localStorage.removeItem('movimientoAgrupadoRepitiendo');
        localStorage.removeItem('movimientoAgrupadoEditando');
        localStorage.removeItem('clienteIdRepitiendo');
        localStorage.removeItem('clienteNameRepitiendo');
        localStorage.removeItem('metodoPagoRepitiendo');
        localStorage.removeItem('productosMovimientoRepitiendo');
        localStorage.removeItem('productosMovimientoEditando');
        localStorage.removeItem('descuentoMovimientoRepitiendo');
        localStorage.removeItem('aumentoMovimientoRepitiendo');
        localStorage.removeItem('conceptoMovimientoRepitiendo');
        localStorage.removeItem('descuentoMovimientoEditando');
        localStorage.removeItem('aumentoMovimientoEditando');
        localStorage.removeItem('fechaMovimientoEditando');
        localStorage.removeItem('movimientoIdEditando');
        localStorage.removeItem('productosEdicion');
        localStorage.removeItem('numeroOrdenEditando');

        // Guardar datos del movimiento para repetir (como nueva salida)
        localStorage.setItem('precioIdRepitiendo', movimientoActual.precio_id || '');
        localStorage.setItem('movimientoAgrupadoRepitiendo', movimientoActual.agrupado ? 'agrupado' : 'no_agrupado');
        localStorage.setItem('metodoPagoRepitiendo', movimientoActual.metodo_pago || '');

        // Calcular el subtotal para convertir montos a porcentajes
        const productosFuente = obtenerProductosFuente();
        const subtotalMovimiento = productosFuente.reduce((sum, producto) => {
            return sum + (parseFloat(producto.subtotal) || 0);
        }, 0);

        // Convertir montos de descuento y aumento a porcentajes
        const descuentoMonto = parseFloat(movimientoActual?.descuento ?? movimiento?.descuento ?? 0);
        const aumentoMonto = parseFloat(movimientoActual?.aumento ?? movimiento?.aumento ?? 0);
        
        if (!isNaN(descuentoMonto) && descuentoMonto > 0 && subtotalMovimiento > 0) {
            // Calcular porcentaje desde el monto y el subtotal
            const descuentoPorcentaje = (descuentoMonto / subtotalMovimiento) * 100;
            localStorage.setItem('descuentoMovimientoRepitiendo', descuentoPorcentaje.toFixed(2));
        } else {
            localStorage.removeItem('descuentoMovimientoRepitiendo');
        }

        if (!isNaN(aumentoMonto) && aumentoMonto > 0 && subtotalMovimiento > 0) {
            // Calcular porcentaje desde el monto y el subtotal
            const aumentoPorcentaje = (aumentoMonto / subtotalMovimiento) * 100;
            localStorage.setItem('aumentoMovimientoRepitiendo', aumentoPorcentaje.toFixed(2));
        } else {
            localStorage.removeItem('aumentoMovimientoRepitiendo');
        }

        // Guardar concepto si existe
        const conceptoMovimiento = movimientoActual?.concepto ?? movimiento?.concepto ?? '';
        if (conceptoMovimiento && conceptoMovimiento.trim() !== '') {
            localStorage.setItem('conceptoMovimientoRepitiendo', conceptoMovimiento.trim());
        } else {
            localStorage.removeItem('conceptoMovimientoRepitiendo');
        }

        // Guardar información del cliente si existe
        if (movimientoActual.cliente?.id) {
            localStorage.setItem('clienteIdRepitiendo', movimientoActual.cliente.id);
            localStorage.setItem('clienteNameRepitiendo', movimientoActual.cliente.name || '');
        } else {
            localStorage.removeItem('clienteIdRepitiendo');
            localStorage.removeItem('clienteNameRepitiendo');
        }

        // Guardar productos del movimiento para cargar automáticamente (robusto post-anulación)
        const productosMovimiento = (productosFuente || [])
            .map((productoMovimiento) => {
                const prodId = productoMovimiento?.producto?.id ?? productoMovimiento?.producto_id;
                if (!prodId) return null;

                let cantidadParaGuardar = Number(productoMovimiento?.cantidad) || 0;

                // Si el movimiento es agrupado, convertir la cantidad a grupos
                if (movimientoActual?.agrupado && productoMovimiento?.producto?.grup) {
                    const grup = Number(productoMovimiento.producto.grup) || 0;
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
        localStorage.setItem('productosMovimientoRepitiendo', JSON.stringify(productosMovimiento));

        // Abrir AlmacenGeneral en modo salida normal
        setModoAlmacen('salida');
        setIsAlmacenOpen(true);
    };

    const handleEditarMovimiento = async () => {
        setLoadingEditar(true);
        try {
            // Validar permisos de edición primero
            const permisoResponse = await permissionsService.canUpdate();
            
            if (!permisoResponse.success || !permisoResponse.data?.allowed) {
                mostrarNotificacion('error', 'No tienes permisos para editar movimientos');
                setLoadingEditar(false);
                return;
            }

            // Si tiene permisos, continuar con la edición normal
            handleRepetirMovimiento();
            if (movimientoActual?.fecha) {
                try {
                    const fechaMovimiento = new Date(movimientoActual.fecha);
                    if (!isNaN(fechaMovimiento.getTime())) {
                        localStorage.setItem('fechaMovimientoEditando', fechaMovimiento.toISOString());
                    } else {
                        localStorage.removeItem('fechaMovimientoEditando');
                    }
                } catch (error) {
                    localStorage.removeItem('fechaMovimientoEditando');
                }
            } else {
                localStorage.removeItem('fechaMovimientoEditando');
            }
            if (movimientoActual?.id) {
                localStorage.setItem('movimientoIdEditando', movimientoActual.id);
            } else {
                localStorage.removeItem('movimientoIdEditando');
            }
            if (movimientoActual?.numero_orden !== undefined && movimientoActual?.numero_orden !== null) {
                localStorage.setItem('numeroOrdenEditando', String(movimientoActual.numero_orden));
            } else {
                localStorage.removeItem('numeroOrdenEditando');
            }

            const productosMovimientoRepetidos = localStorage.getItem('productosMovimientoRepitiendo');
            if (productosMovimientoRepetidos) {
                localStorage.setItem('productosMovimientoEditando', productosMovimientoRepetidos);
            }


            const productosFuente = obtenerProductosFuente();
            if (productosFuente && productosFuente.length > 0) {
                const productosEdicion = productosFuente
                    .map((productoMovimiento) => {
                        const productoBase = productoMovimiento?.producto;
                        if (!productoBase?.id) return null;
                        const cantidadOriginal = Number(productoMovimiento?.cantidad) || 0;
                        return {
                            ...productoBase,
                            cantidad: cantidadOriginal
                        };
                    })
                    .filter(Boolean);

                if (productosEdicion.length > 0) {
                    localStorage.setItem('productosEdicion', JSON.stringify(productosEdicion));
                } else {
                    localStorage.removeItem('productosEdicion');
                }
            } else {
                localStorage.removeItem('productosEdicion');
            }
        } catch (error) {
            console.error('Error validando permisos de edición:', error);
            mostrarNotificacion('error', 'Error al verificar permisos de edición');
        } finally {
            setLoadingEditar(false);
        }
    };

    const handleMovimientoEditadoFinalizado = (nuevoMovimientoId, movimientoAnteriorId) => {
        setIsAlmacenOpen(false);
        setIsOpen(false);
        if (onMovimientoEditado) {
            onMovimientoEditado(nuevoMovimientoId, movimientoAnteriorId);
        }
    };


    if (!movimientoActual) return null;

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
                <p className={styles.subTitle}>INFORMACIÓN DEL RESPONSABLE</p>
                <ItemView
                    title={movimientoActual?.user?.name || movimientoActual?.personal?.name || 'Usuario desconocido'}
                    description="Responsable del movimiento"
                    transparent={false}
                />
                <p className={styles.subTitle}>INFORMACIÓN DEL MOVIMIENTO</p>
                {(movimientoActual?.proveedor_id || movimientoActual?.cliente_id) && (
                    <ItemView
                        title={movimientoActual?.type === 'entrada' ? movimientoActual?.proveedor?.name || 'Sin proveedor' : movimientoActual?.cliente?.name || 'Sin cliente'}
                        description={movimientoActual?.type === 'entrada' ? 'Proveedor' : 'Cliente'}
                        flot2={movimientoActual?.type === 'entrada'
                            ? `${movimientoActual?.proveedor?.total_orders || 0} órdenes`
                            : (() => {
                                const numeroOrden = obtenerNumeroOrdenFormateado(movimientoActual?.numero_orden);
                                return numeroOrden === '--' ? '' : `Orden Nº ${numeroOrden}`;
                            })()
                        }
                        transparent={false}
                    />
                )}
                <div className={styles.content}>
                    <Dato
                        label="Tipo de movimiento"
                        value={movimientoActual?.type === 'entrada' ? 'Entrada' : 'Salida'}
                        vertical={false}
                    />
                    <Dato
                        label="Fecha"
                        value={formatFechaLiteral(movimientoActual?.fecha)}
                        vertical={false}
                    />
                    <Dato
                        label="Hora"
                        value={formatHoraSinSegundos(movimientoActual?.fecha)}
                        vertical={false}
                    />
                    <Dato
                        label="Tipo de precio"
                        value={movimientoActual?.precio?.name || 'Sin tipo de precio'}
                        vertical={false}
                    />
                    <Dato
                        label="Modalidad"
                        value={movimientoActual?.agrupado ? 'Agrupado' : 'Unidades'}
                        vertical={false}
                    />
                    <Dato
                        label="Estado"
                        value={movimientoActual.estado === 'anulado' ? 'Anulado' : 'Finalizado'}
                        vertical={false}
                        especial={movimientoActual.estado === 'anulado' ? 'red' : 'blue'}
                    />
                    {movimientoActual?.metodo_pago && (
                        <Dato
                            label="Método de pago"
                            value={movimientoActual.metodo_pago}
                            vertical={false}
                        />
                    )}

                    {/* Descuento y Aumento si existen */}
                    {(() => {
                        const descuentoMonto = parseFloat(movimientoActual?.descuento) || 0;
                        const aumentoMonto = parseFloat(movimientoActual?.aumento) || 0;
                        const esPorcentaje = movimientoActual?.porcentaje === true;
                        
                        // Calcular el subtotal para obtener el porcentaje (si es necesario)
                        const subtotal = movimientoActual?.productos?.reduce((sum, producto) => {
                            return sum + (parseFloat(producto.subtotal) || 0);
                        }, 0) || 0;
                        
                        // Determinar cómo mostrar el descuento y aumento
                        let descuentoTexto = '';
                        let aumentoTexto = '';
                        
                        if (descuentoMonto > 0) {
                            if (esPorcentaje) {
                                const descuentoPorcentaje = subtotal > 0 ? ((descuentoMonto / subtotal) * 100) : 0;
                                descuentoTexto = `${descuentoPorcentaje.toFixed(2)}% (${formatCurrency(descuentoMonto)})`;
                            } else {
                                descuentoTexto = formatCurrency(descuentoMonto);
                            }
                        }
                        
                        if (aumentoMonto > 0) {
                            if (esPorcentaje) {
                                const aumentoPorcentaje = subtotal > 0 ? ((aumentoMonto / subtotal) * 100) : 0;
                                aumentoTexto = `${aumentoPorcentaje.toFixed(2)}% (${formatCurrency(aumentoMonto)})`;
                            } else {
                                aumentoTexto = formatCurrency(aumentoMonto);
                            }
                        }
                        
                        // Compatibilidad hacia atrás: si porcentaje es null, asumir que era porcentaje (comportamiento anterior)
                        if (descuentoMonto > 0 && movimientoActual?.porcentaje === null) {
                            const descuentoPorcentaje = subtotal > 0 ? ((descuentoMonto / subtotal) * 100) : 0;
                            descuentoTexto = `${descuentoPorcentaje.toFixed(2)}% (${formatCurrency(descuentoMonto)})`;
                        }
                        
                        if (aumentoMonto > 0 && movimientoActual?.porcentaje === null) {
                            const aumentoPorcentaje = subtotal > 0 ? ((aumentoMonto / subtotal) * 100) : 0;
                            aumentoTexto = `${aumentoPorcentaje.toFixed(2)}% (${formatCurrency(aumentoMonto)})`;
                        }
                        
                        return (
                            <>
                                {descuentoMonto > 0 && descuentoTexto && (
                                    <Dato
                                        label="Descuento"
                                        value={descuentoTexto}
                                        vertical={false}
                                        especial='red'
                                    />
                                )}
                                {aumentoMonto > 0 && aumentoTexto && (
                                    <Dato
                                        label="Aumento"
                                        value={aumentoTexto}
                                        vertical={false}
                                        especial='green'
                                    />
                                )}
                            </>
                        );
                    })()}

                    {/* Total calculado para movimientos */}
                    {movimientoActual?.productos && movimientoActual.productos.length > 0 && (
                        <Dato
                            label="Total del Movimiento"
                            value={formatCurrency((() => {
                                const subtotal = movimientoActual.productos.reduce((sum, producto) => sum + (parseFloat(producto.subtotal) || 0), 0);
                                const descuentoMonto = parseFloat(movimientoActual.descuento) || 0;
                                const aumentoMonto = parseFloat(movimientoActual.aumento) || 0;
                                return subtotal - descuentoMonto + aumentoMonto;
                            })())}
                            vertical={false}
                            especial='green'
                        />
                    )}
                    {/* Concepto del movimiento si existe */}
                    {movimientoActual?.concepto && (
                        <Dato
                            label="Concepto"
                            value={movimientoActual.concepto}
                            vertical={false}
                        />
                    )}
                </div>


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
                    <>
                        <p className={styles.subTitle}>OBSERVACIONES</p>
                        <div className={styles.content}>
                            <Dato
                                label="Observaciones"
                                value={movimientoActual.observaciones}
                                vertical={true}
                            />
                        </div>
                    </>
                )}

                <div className={styles.buttons}>
                    {movimientoActual?.estado === 'anulado' ? (
                        <>
                            {movimientoActual?.type === 'salida' && (
                                <Boton
                                    className='btn-default'
                                    label='Repetir Movimiento'
                                    style={{ marginTop: 'auto' }}
                                    onClick={handleRepetirMovimiento}
                                />
                            )}
                            <Boton
                                className='btn-red'
                                label='Eliminar Movimiento'
                                style={{ marginTop: 'auto' }}
                                onClick={() => setIsEliminarOpen(true)}
                            />
                        </>
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
                            {movimientoActual?.type === 'salida' && (
                                <Boton
                                    className='btn-gray'
                                    label='Editar Movimiento'
                                    style={{ marginTop: 'auto' }}
                                    onClick={handleEditarMovimiento}
                                    loading={loadingEditar}
                                    disabled={loadingEditar}
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
                        {(() => {
                            // Usar productos originales si el movimiento está anulado y los productos actuales están vacíos
                            const productosParaMostrar = movimientoActual?.estado === 'anulado' && 
                                (!movimientoActual?.productos || movimientoActual.productos.length === 0 || 
                                 movimientoActual.productos.some(p => !p.producto?.name || p.precio_unitario === 0))
                                ? movimiento?.productos || []
                                : movimientoActual?.productos || [];

                            return productosParaMostrar && productosParaMostrar.length > 0 && (
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
                            );
                        })()}
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
                        ¿Estás seguro que deseas anular este movimiento? Esta acción no se puede deshacer.
                    </p>
                    {movimientoActual?.type === 'entrada' && (
                        <div style={{ marginTop: '10px', marginBottom: '10px', width: '100%' }}>
                            <Text type="error" align="left">
                                Si este movimiento restó materia prima según la receta, se le devolverá el total de la materia prima de la receta del producto.
                            </Text>
                        </div>
                    )}
                    {movimientoActual?.produccion_damabrava_id && movimientoActual?.type === 'entrada' && (
                        <div style={{ marginBottom: '10px', width: '100%' }}>
                            <Text type="warning" align="left">
                                Este movimiento es un ingreso de producción Damabrava. Al anular, si el registro de producción está en estado "Completado" se pondrá a estado "Verificado".
                            </Text>
                        </div>
                    )}
                    {movimientoActual?.type === 'salida' && (
                        <div style={{ marginBottom: '10px', width: '100%' }}>
                            <Text type="info" align="left">
                                Al anular este movimiento se regresarán todos los productos a tu stock del producto.
                                {movimientoActual?.cliente_id && ' Se quitará el número de pedido o de orden del cliente.'}
                            </Text>
                        </div>
                    )}
                    {movimientoActual?.metodo_pago?.toLowerCase() === 'credito' && (
                        <div style={{ width: '100%' }}>
                            <Text type="warning" align="left">
                                Al anular este movimiento se eliminará la deuda del apartado de deudas por que este movimiento tiene metodo de pago a credito.
                            </Text>
                        </div>
                    )}
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
                            segundosDisabled={5}
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
                setIsOpen={(isOpen) => {
                    setIsAlmacenOpen(isOpen);
                    // Limpiar productos del movimiento cuando se cierra AlmacenGeneral
                    if (!isOpen) {
                    localStorage.removeItem('productosMovimientoRepitiendo');
                    localStorage.removeItem('productosMovimientoEditando');
                    localStorage.removeItem('descuentoMovimientoRepitiendo');
                    localStorage.removeItem('aumentoMovimientoRepitiendo');
                    localStorage.removeItem('conceptoMovimientoRepitiendo');
                    localStorage.removeItem('descuentoMovimientoEditando');
                    localStorage.removeItem('aumentoMovimientoEditando');
                    localStorage.removeItem('fechaMovimientoEditando');
                    localStorage.removeItem('movimientoIdEditando');
                    localStorage.removeItem('productosEdicion');
                localStorage.removeItem('numeroOrdenEditando');
                    }
                }}
                tipo="salida"
                isRepitiendoMovimiento={modoAlmacen === 'salida'}
                onMovimientoEditado={handleMovimientoEditadoFinalizado}
            />
        </View>
    );
}
export default VerMovimiento;
