import React, { useEffect, useMemo, useState } from 'react';
import styles from '../../../../../styles/view.module.css';
import View from '../../../../ui/View';
import HeaderView from '../../../../common/HeaderView';
import Dato from '../../../../common/Dato';
import Boton from '../../../../common/Boton';
import ViewModal from '../../../../ui/ViewModal';
import HeaderModal from '../../../../common/HeaderModal';
import ModalTable from '../../../../common/ModalTable';
import pagosDamabravaService from '../../../../../services/pagosDamabravaService';
import { seleccionarReglaParaProducto, calcularPagoProcesos } from '../../../../../utils/reglasPagoHelper';
import ItemView from '../../../../common/ItemView';
import { formatFechaLiteral, formatHoraSinSegundos } from '../../../../../utils/dateUtils';
import { useLayout } from '../../../../../context/LayoutContext';
import NoData from '../../../../common/NoData';

const formatNumber = (value, decimals = 2) => {
    const num = Number(value || 0);
    return num.toLocaleString('es-BO', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

const VerPago = ({
    isOpen,
    setIsOpen,
    pago,
    onPagoActualizado,
    onPagoEliminado,
    mostrarNotificacion,
    reglas = []
}) => {
    const { isLargeScreen } = useLayout();
    const [detallePago, setDetallePago] = useState(pago || null);
    const [isRegistrosModalOpen, setIsRegistrosModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [accionesLoading, setAccionesLoading] = useState(false);
    const [registrosLoading, setRegistrosLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setDetallePago(pago || null);
        } else {
            setIsRegistrosModalOpen(false);
            setIsDeleteModalOpen(false);
        }
    }, [isOpen, pago]);

    const estadoActual = detallePago?.estado || 'pendiente';
    const responsableNombre = detallePago?.responsable?.name || 'Sin responsable';
    const periodoTexto = detallePago
        ? `${formatFechaLiteral(detallePago.fecha_inicio)} - ${formatFechaLiteral(detallePago.fecha_fin)}`
        : '--';
    const fechaCreacion = formatFechaLiteral(detallePago?.fecha);
    const horaCreacion = formatHoraSinSegundos(detallePago?.fecha);
    const registrosAsociados = Array.isArray(detallePago?.registros) ? detallePago.registros.length : 0;
    const registradoPorNombre =
        detallePago?.registrado_por?.name ||
        detallePago?.personal?.name ||
        detallePago?.user?.name ||
        'Sin información';
    const extras = Number(detallePago?.extras) || 0;
    const descuento = Number(detallePago?.descuento) || 0;
    const aumento = Number(detallePago?.aumento) || 0;
    const totalProduccion = Number(detallePago?.total) || 0;
    const totalConAjustes = totalProduccion + extras + aumento - descuento;

    const registrosCalculados = useMemo(() => {
        if (!detallePago?.registros || !Array.isArray(detallePago.registros)) {
            return [];
        }

        return detallePago.registros.map((registro) => {
            const productoDetalle = registro.producto_almacen || null;
            const regla = seleccionarReglaParaProducto(reglas, registro, productoDetalle);
            const usarCantidadVerificada = ['verificado', 'Ingresado'].includes(registro?.estado);
            const cantidadBase = usarCantidadVerificada
                ? Number(registro?.cantidad_verificada) || 0
                : Number(registro?.terminados) || 0;

            const resultado = calcularPagoProcesos({
                regla,
                terminados: cantidadBase,
                productoDetalle,
                proceso: registro?.proceso
            });

            return {
                id: registro.id,
                producto: productoDetalle?.name || 'Sin producto',
                terminados: Number(registro?.terminados) || 0,
                verificados: Number(registro?.cantidad_verificada) || 0,
                cantidadLabel: usarCantidadVerificada ? 'Verificados' : 'Terminados',
                cantidadValor: cantidadBase,
                ...resultado
            };
        });
    }, [detallePago?.registros, reglas]);

    const filasModal = useMemo(() => {
        return registrosCalculados.map((fila) => ([
            fila.producto,
            formatNumber(fila.terminados, 2),
            formatNumber(fila.verificados, 2),
            formatNumber(fila.cernido, 2),
            formatNumber(fila.sellado, 2),
            formatNumber(fila.envasado, 2),
            formatNumber(fila.etiquetado, 2),
            formatNumber(fila.total, 2)
        ]));
    }, [registrosCalculados]);

    const handleVerRegistros = async () => {
        if (!detallePago?.id) {
            if (mostrarNotificacion) {
                mostrarNotificacion('warning', 'No se pudo identificar el pago seleccionado.');
            }
            return;
        }

        console.log('[VerPago] Solicitando registros asociados para pago:', detallePago.id);
        setRegistrosLoading(true);

        try {
            const response = await pagosDamabravaService.getRegistros(detallePago.id);
            if (!response.success) {
                throw new Error(response.message || 'Error al obtener los registros asociados.');
            }

            const registros = Array.isArray(response.data) ? response.data : [];

            console.log('[VerPago] Registros asociados recibidos:', registros);
            setDetallePago((prev) => (prev ? { ...prev, registros } : { registros }));
            setIsRegistrosModalOpen(true);
        } catch (error) {
            console.error('Error obteniendo registros asociados del pago:', error);
            if (mostrarNotificacion) {
                mostrarNotificacion('error', error.message || 'No se pudieron obtener los registros asociados.');
            }
        } finally {
            setRegistrosLoading(false);
        }
    };

    const handleActualizarEstado = async (nuevoEstado) => {
        if (!detallePago?.id) return;
        setAccionesLoading(true);
        try {
            const response = await pagosDamabravaService.updateEstado(detallePago.id, nuevoEstado);
            if (!response.success) {
                throw new Error(response.message || 'Error al actualizar el estado.');
            }
            const estadoActualizado = response.data?.estado || nuevoEstado;
            setDetallePago((prev) => {
                if (!prev) return prev;
                const actualizado = { ...prev, estado: estadoActualizado };
                if (onPagoActualizado) {
                    onPagoActualizado(actualizado);
                }
                return actualizado;
            });
            if (mostrarNotificacion) {
                mostrarNotificacion('success', estadoActualizado === 'pagado' ? 'Pago marcado como pagado.' : 'Pago marcado como pendiente.');
            }
        } catch (error) {
            console.error('Error actualizando estado del pago:', error);
            if (mostrarNotificacion) {
                mostrarNotificacion('error', error.message || 'Error al actualizar el estado.');
            }
        } finally {
            setAccionesLoading(false);
        }
    };

    const handleEliminarPago = async () => {
        if (!detallePago?.id) return;
        setAccionesLoading(true);
        try {
            const response = await pagosDamabravaService.delete(detallePago.id);
            if (!response.success) {
                throw new Error(response.message || 'Error al eliminar el pago.');
            }
            const mensaje = response.message || 'Pago eliminado correctamente.';
            if (onPagoEliminado) {
                onPagoEliminado(detallePago.id, mensaje);
            } else if (mostrarNotificacion) {
                mostrarNotificacion('success', mensaje);
            }
            setIsOpen(false);
        } catch (error) {
            console.error('Error eliminando pago:', error);
            if (mostrarNotificacion) {
                mostrarNotificacion('error', error.message || 'Error al eliminar el pago.');
            }
        } finally {
            setAccionesLoading(false);
            setIsDeleteModalOpen(false);
        }
    };

    const totales = detallePago || {};

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView
                onBack={() => setIsOpen(false)}
                title="Pago Producción"
            />
            <div className={styles.container}>
                {!detallePago ? (
                    <p className={styles.subTitle}>Selecciona un pago para ver los detalles.</p>
                ) : (
                    <>
                        <p className={styles.subTitle}>RESPONSABLE DEL PAGO</p>
                        <ItemView
                            title={detallePago?.user?.name || detallePago?.personal?.name || 'Usuario desconocido'}
                            description="registrado por"
                            transparent={false}
                        />
                        <p className={styles.subTitle}>INFORMACIÓN DEL PAGO</p>
                        <ItemView
                            title={responsableNombre}
                            description="Beneficiario del pago"
                            transparent={false}
                            flot3={detallePago?.estado === 'pendiente' ? 'Pendiente' : ''}
                            flot1={detallePago?.estado === 'pagado' ? 'Pagado' : ''}
                        />
                        <div className={styles.content}>
                            <Dato label="Periodo" value={periodoTexto === '-- - --' ? '--' : periodoTexto} vertical={false}/>
                            <Dato label="Fecha" value={fechaCreacion} vertical={false}/>
                            <Dato label="Hora" value={horaCreacion} vertical={false}/>
                        </div>

                        <p className={styles.subTitle}>TOTALES</p>
                        <div className={styles.content}>
                            <Dato label="Cernido" value={`Bs. ${formatNumber(totales.cernido, 2)}`} vertical={false}/>
                            <Dato label="Sellado" value={`Bs. ${formatNumber(totales.sellado, 2)}`} vertical={false}/>
                            <Dato label="Envasado" value={`Bs. ${formatNumber(totales.envasado, 2)}`} vertical={false}/>
                            <Dato label="Etiquetado" value={`Bs. ${formatNumber(totales.etiquetado, 2)}`} vertical={false}/>
                        </div>
                        <p className={styles.subTitle}>AJUSTES</p>
                        <div className={styles.content}>
                            <Dato label="Extras" value={`Bs. ${formatNumber(extras, 2)}`} vertical={false}/>
                            <Dato label="Aumento" value={`Bs. ${formatNumber(aumento, 2)}`} vertical={false}/>
                            <Dato label="Descuento" value={`- Bs. ${formatNumber(descuento, 2)}`} vertical={false}/>
                        </div>
                        <p className={styles.subTitle}>TOTALES</p>
                        <div className={styles.content}>
                            <Dato label="Total producción" value={`Bs. ${formatNumber(totalProduccion, 2)}`} vertical={false}/>
                            <Dato label="Total con ajustes" value={`Bs. ${formatNumber(totalConAjustes, 2)}`} especial="green" vertical={false}/>
                        </div>

                        <Boton
                            className='btn-gray'
                            label='Registros de Producción'
                            onClick={handleVerRegistros}
                            loading={registrosLoading}
                        />

                        <div className={styles.buttons}>
                            {estadoActual !== 'pagado' ? (
                                <Boton
                                    className='btn-default'
                                    label='Marcar como pagado'
                                    onClick={() => handleActualizarEstado('pagado')}
                                    loading={accionesLoading}
                                />
                            ) : (
                                <Boton
                                    className='btn-orange'
                                    label='Anular pagado'
                                    onClick={() => handleActualizarEstado('pendiente')}
                                    loading={accionesLoading}
                                />
                            )}
                            {estadoActual !== 'pagado' && (
                                <Boton
                                    className='btn-red'
                                    label='Eliminar pago'
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    loading={accionesLoading}
                                />
                            )}
                        </div>
                    </>
                )}
            </div>

            <ViewModal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen}>
                <HeaderModal
                    title="Eliminar pago"
                    onClose={() => setIsDeleteModalOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Confirmas que deseas eliminar este pago? Esta acción removerá también los registros asociados.
                    </p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={accionesLoading}
                        />
                        <Boton
                            className='btn-red'
                            label='Eliminar pago'
                            onClick={handleEliminarPago}
                            loading={accionesLoading}
                        />
                    </div>
                </div>
            </ViewModal>

            {isLargeScreen ? (
                <ModalTable
                    isOpen={isRegistrosModalOpen}
                    onClose={() => setIsRegistrosModalOpen(false)}
                    title="Registros asociados"
                    headers={[
                        'Producto',
                        'Terminados',
                        'Verificados',
                        'Cernido',
                        'Sellado',
                        'Envasado',
                        'Etiquetado',
                        'Subtotal'
                    ]}
                    rows={
                        registrosLoading && filasModal.length === 0
                            ? [['Cargando...', '', '', '', '', '', '', '']]
                            : filasModal
                    }
                />
            ) : (
                <ViewModal isOpen={isRegistrosModalOpen} setIsOpen={setIsRegistrosModalOpen}>
                    <HeaderModal
                        title="Registros asociados"
                        onClose={() => setIsRegistrosModalOpen(false)}
                    />
                    <div className={styles.modalContent}>
                        {registrosLoading ? (
                            <p className={styles.subTitle}>Cargando registros...</p>
                        ) : registrosCalculados.length > 0 ? (
                            registrosCalculados.map((registro) => (
                                <ItemView
                                    key={registro.id}
                                    title={registro.producto}
                                    description={`${registro.cantidadLabel || 'Cantidad'}: ${formatNumber(registro.cantidadValor, 2)}`}
                                    description2={`Cern: ${formatNumber(registro.cernido, 2)} - Sell: ${formatNumber(registro.sellado, 2)} - Evs: ${formatNumber(registro.envasado, 2)} - Etq: ${formatNumber(registro.etiquetado, 2)}`}
                                    flot1={`Sub: ${formatNumber(registro.total, 2)}`}
                                    icon='receipt'
                                />
                            ))
                        ) : (
                            <NoData
                                icon="receipt"
                                title="Sin registros"
                                detail="No hay registros asociados para mostrar."
                                transparent={false}
                                minHeight="200px"
                            />
                        )}
                    </div>
                </ViewModal>
            )}
        </View>
    );
};

export default VerPago;
