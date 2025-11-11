import React, { useEffect, useMemo, useState } from 'react';
import ViewModal from '../../../../ui/ViewModal';
import HeaderModal from '../../../../common/HeaderModal';
import Boton from '../../../../common/Boton';
import Dato from '../../../../common/Dato';
import Notification from '../../../../common/Notification';
import ModalTable from '../../../../common/ModalTable';
import InputNormal from '../../../../common/InputNormal';
import Select from '../../../../common/Select';
import ItemView from '../../../../common/ItemView';
import NoData from '../../../../common/NoData';
import personalService from '../../../../../services/personalService';
import registrosProduccionDamabravaService from '../../../../../services/registrosProduccionDamabravaService';
import pagosDamabravaService from '../../../../../services/pagosDamabravaService';
import FiltroFecha, { formatDateRangeForDisplay } from '../../../../mixed/FiltroFecha';
import { seleccionarReglaParaProducto, calcularPagoProcesos } from '../../../../../utils/reglasPagoHelper';
import styles from '../../../../../styles/view.module.css';
import { useLayout } from '../../../../../context/LayoutContext';

const initialTotals = {
    registros: 0,
    cernido: 0,
    sellado: 0,
    envasado: 0,
    etiquetado: 0,
    total: 0
};

const formatNumber = (value, decimals = 2) => {
    const num = Number(value || 0);
    return num.toLocaleString('es-BO', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

const RegistroPago = ({ isOpen, setIsOpen, registros = [], reglas = [], onPagoRegistrado }) => {
    const { isLargeScreen } = useLayout();
    const [isFechaModalOpen, setIsFechaModalOpen] = useState(false);
    const [selectedRange, setSelectedRange] = useState({ inicio: null, fin: null });
    const [detalles, setDetalles] = useState([]);
    const [totales, setTotales] = useState(initialTotals);
    const [isTablaOpen, setIsTablaOpen] = useState(false);
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });
    const [responsablesOptions, setResponsablesOptions] = useState([
        { value: '', label: 'Todos los responsables' }
    ]);
    const [responsablesLoaded, setResponsablesLoaded] = useState(false);
    const [loadingResponsables, setLoadingResponsables] = useState(false);
    const [responsableSeleccionado, setResponsableSeleccionado] = useState('');
    const [isBuscarLoading, setIsBuscarLoading] = useState(false);
    const [isRegistrarLoading, setIsRegistrarLoading] = useState(false);
    const [error, setError] = useState(null);
    const [extras, setExtras] = useState('0');
    const [descuento, setDescuento] = useState('0');
    const [aumento, setAumento] = useState('0');

    const mostrarNotificacion = (type, text) => {
        setNotification({
            isVisible: true,
            type,
            text
        });
        setTimeout(() => {
            setNotification((prev) => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    useEffect(() => {
        if (!isOpen) {
            setIsFechaModalOpen(false);
            setSelectedRange({ inicio: null, fin: null });
            setDetalles([]);
            setTotales(initialTotals);
            setIsTablaOpen(false);
            setResponsableSeleccionado('');
            setError(null);
            setIsRegistrarLoading(false);
            setExtras('0');
            setDescuento('0');
            setAumento('0');
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        if (!responsablesLoaded) {
            const cargarResponsables = async () => {
                try {
                    setLoadingResponsables(true);
                    const response = await personalService.getAll();
                    if (response.success && Array.isArray(response.data)) {
                        const options = response.data
                            .map((personal) => ({
                                value: personal.id,
                                label: `${personal.first_name || ''} ${personal.last_name || ''}`.trim() || 'Sin nombre'
                            }))
                            .sort((a, b) => a.label.localeCompare(b.label, 'es'));
                        setResponsablesOptions([
                            { value: '', label: 'Todos los responsables' },
                            ...options
                        ]);
                    }
                    setResponsablesLoaded(true);
                } catch (error) {
                    console.error('Error cargando responsables:', error);
                } finally {
                    setLoadingResponsables(false);
                }
            };

            cargarResponsables();
        }
    }, [isOpen, responsablesLoaded]);

    const handleApplyRange = (inicio, fin) => {
        setSelectedRange({ inicio, fin });
        setIsFechaModalOpen(false);
    };

    const handleClearRange = () => {
        setSelectedRange({ inicio: null, fin: null });
        setIsFechaModalOpen(false);
    };

    const handleMontoChange = (setter) => (event) => {
        const { value } = event.target;
        if (value === '' || value === '-') {
            setter('');
            return;
        }
        const numeric = Number(value);
        if (Number.isNaN(numeric)) {
            return;
        }
        if (numeric < 0) {
            setter('0');
            return;
        }
        setter(value);
    };

    const handleExtrasChange = handleMontoChange(setExtras);
    const handleDescuentoChange = handleMontoChange(setDescuento);
    const handleAumentoChange = handleMontoChange(setAumento);

    const handleBuscar = async () => {
        if (!selectedRange.inicio && !selectedRange.fin) {
            mostrarNotificacion('warning', 'Selecciona al menos un rango de fechas.');
            return;
        }

        setIsBuscarLoading(true);
        setError(null);

        try {
            const responsablePayload = responsableSeleccionado
                ? { id: responsableSeleccionado, tipo: 'personal' }
                : null;

            const response = await registrosProduccionDamabravaService.getAll(
                1,
                100,
                null,
                'fecha_desc',
                '',
                responsablePayload,
                {
                    inicio: selectedRange.inicio,
                    fin: selectedRange.fin
                }
            );

            if (!response.success) {
                throw new Error(response.message || 'No se pudieron obtener los registros');
            }

            const datos = response.data || [];

            if (datos.length === 0) {
                setDetalles([]);
                setTotales(initialTotals);
                setExtras('0');
                setDescuento('0');
                setAumento('0');
                mostrarNotificacion('warning', 'No hay registros para los filtros seleccionados.');
                return;
            }

            const acumulado = { ...initialTotals };
            const filas = [];
            let registrosSinRegla = 0;

            datos.forEach((registro) => {
                const productoDetalle = registro?.producto_almacen || null;
                if (!productoDetalle) {
                    return;
                }

                const regla = seleccionarReglaParaProducto(reglas, registro, productoDetalle);
                if (!regla) {
                    registrosSinRegla += 1;
                    return;
                }

                const usarCantidadVerificada = ['verificado', 'Ingresado'].includes(registro?.estado);
                const cantidadValor = usarCantidadVerificada
                    ? Number(registro?.cantidad_verificada) || 0
                    : Number(registro?.terminados) || 0;
                const cantidadLabel = usarCantidadVerificada ? 'Verificados' : 'Terminados';

                if (cantidadValor <= 0) {
                    return;
                }

                const resultado = calcularPagoProcesos({
                    regla,
                    terminados: cantidadValor,
                    productoDetalle,
                    proceso: registro?.proceso
                });

                acumulado.registros += 1;
                acumulado.cernido += resultado.cernido;
                acumulado.sellado += resultado.sellado;
                acumulado.envasado += resultado.envasado;
                acumulado.etiquetado += resultado.etiquetado;
                acumulado.total += resultado.total;

                filas.push({
                    id: registro.id,
                    producto: productoDetalle?.name || 'Sin producto',
                    terminados: Number(registro?.terminados) || 0,
                    verificados: Number(registro?.cantidad_verificada) || 0,
                    cernido: resultado.cernido,
                    sellado: resultado.sellado,
                    envasado: resultado.envasado,
                    etiquetado: resultado.etiquetado,
                    subtotal: resultado.total,
                    cantidadLabel,
                    cantidadValor
                });
            });

            setDetalles(filas);
            setTotales(acumulado);
            setExtras('0');
            setDescuento('0');
            setAumento('0');

            if (registrosSinRegla > 0) {
                mostrarNotificacion('warning', `${registrosSinRegla} registro(s) no tienen regla aplicable.`);
            } else {
                mostrarNotificacion('success', 'Cálculo realizado correctamente.');
            }
        } catch (err) {
            console.error('Error al buscar registros:', err);
            setError(err.message || 'Error al obtener los registros');
            mostrarNotificacion('error', err.message || 'Error al obtener los registros.');
        } finally {
            setIsBuscarLoading(false);
        }
    };

    const formatDateForPayload = (date) => {
        if (!date) return null;
        const instance = new Date(date);
        if (Number.isNaN(instance.getTime())) {
            return null;
        }
        const year = instance.getFullYear();
        const month = String(instance.getMonth() + 1).padStart(2, '0');
        const day = String(instance.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleRegistrarPago = async () => {
        if (detalles.length === 0) {
            mostrarNotificacion('warning', 'No hay detalles para registrar el pago.');
            return;
        }

        if (!responsableSeleccionado) {
            mostrarNotificacion('warning', 'Selecciona un responsable específico para registrar el pago.');
            return;
        }

        if (!selectedRange.inicio || !selectedRange.fin) {
            mostrarNotificacion('warning', 'Selecciona un rango de fechas válido para registrar el pago.');
            return;
        }

        const fechaInicio = formatDateForPayload(selectedRange.inicio);
        const fechaFin = formatDateForPayload(selectedRange.fin);

        if (!fechaInicio || !fechaFin) {
            mostrarNotificacion('error', 'No se pudo interpretar el rango de fechas seleccionado.');
            return;
        }

        setIsRegistrarLoading(true);

        try {
            const response = await pagosDamabravaService.create({
                responsable_id: responsableSeleccionado,
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                totales: {
                    cernido: totales.cernido,
                    sellado: totales.sellado,
                    envasado: totales.envasado,
                    etiquetado: totales.etiquetado,
                    total: totales.total,
                    total_con_ajustes: totalConAjustes,
                    total_produccion: totalProduccion
                },
                extras: extrasNumber,
                descuento: descuentoNumber,
                aumento: aumentoNumber,
                total_ajustado: totalConAjustes,
                registros: detalles.map((detalle) => detalle.id)
            });

            if (!response.success) {
                throw new Error(response.message || 'Error al registrar el pago.');
            }

            mostrarNotificacion('success', 'Pago registrado correctamente.');
            setIsTablaOpen(false);
            setDetalles([]);
            setTotales(initialTotals);
            setSelectedRange({ inicio: null, fin: null });
            setResponsableSeleccionado('');
            setExtras('0');
            setDescuento('0');
            setAumento('0');
            if (typeof onPagoRegistrado === 'function') {
                let responsableInfo = response.data?.responsable || null;
                if (!responsableInfo && responsableSeleccionado) {
                    const option = responsablesOptions.find(opt => opt.value === responsableSeleccionado);
                    if (option) {
                        responsableInfo = {
                            id: responsableSeleccionado,
                            name: option.label || 'Sin responsable'
                        };
                    }
                }

                const pagoRegistrado = {
                    ...response.data,
                    responsable: responsableInfo
                };

                const extrasRegistrados = Number(pagoRegistrado.extras) || 0;
                const descuentoRegistrado = Number(pagoRegistrado.descuento) || 0;
                const aumentoRegistrado = Number(pagoRegistrado.aumento) || 0;
                const totalProduccionRegistrado = Number(pagoRegistrado.total) || 0;

                pagoRegistrado.total_produccion = totalProduccionRegistrado;
                pagoRegistrado.total_con_ajustes = totalProduccionRegistrado + extrasRegistrados + aumentoRegistrado - descuentoRegistrado;

                await onPagoRegistrado(pagoRegistrado);
            }
            setIsOpen(false);
        } catch (err) {
            console.error('Error registrando pago Damabrava:', err);
            mostrarNotificacion('error', err.message || 'Error al registrar el pago.');
        } finally {
            setIsRegistrarLoading(false);
        }
    };

    const detallesTabla = useMemo(() => {
        return detalles.map((detalle) => ([
            detalle.producto,
            formatNumber(detalle.terminados, 2),
            formatNumber(detalle.verificados, 2),
            formatNumber(detalle.cernido, 2),
            formatNumber(detalle.sellado, 2),
            formatNumber(detalle.envasado, 2),
            formatNumber(detalle.etiquetado, 2),
            formatNumber(detalle.subtotal, 2)
        ]));
    }, [detalles]);

    const rangoSeleccionado = (selectedRange.inicio || selectedRange.fin)
        ? formatDateRangeForDisplay(selectedRange.inicio, selectedRange.fin, 'Rango seleccionado')
        : 'Sin rango seleccionado';

    const extrasNumber = Math.max(0, parseFloat(extras) || 0);
    const descuentoNumber = Math.max(0, parseFloat(descuento) || 0);
    const aumentoNumber = Math.max(0, parseFloat(aumento) || 0);
    const totalProduccion = Number(totales.total) || 0;
    const totalConAjustes = totalProduccion + extrasNumber + aumentoNumber - descuentoNumber;

    return (
        <>
            <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
                <HeaderModal
                    title="Registrar pago"
                    onClose={handleClose}
                />
                <div className={styles.modalContent}>
                    <Select
                        label="Responsable"
                        placeholder="Todos los responsables"
                        options={responsablesOptions}
                        value={responsableSeleccionado}
                        onChange={(value) => setResponsableSeleccionado(value || '')}
                        disabled={loadingResponsables}
                        icon='user'
                    />

                    <Boton
                        className='btn-gray'
                        label={selectedRange.inicio || selectedRange.fin ? rangoSeleccionado : 'Seleccionar rango'}
                        onClick={() => setIsFechaModalOpen(true)}
                    />
                    <Boton
                        className='btn-default'
                        label='Buscar'
                        onClick={handleBuscar}
                        loading={isBuscarLoading}
                        disabled={isBuscarLoading}
                    />


                    {error && (
                        <p className={styles.subTitle} style={{ color: '#e74c3c' }}>
                            {error}
                        </p>
                    )}

                    {detalles.length > 0 ? (
                        <>
                            <div className={styles.content}>
                                <Dato label="Registros" value={totales.registros} vertical={false} />
                                <Dato label="Cernido" value={`Bs. ${formatNumber(totales.cernido, 2)}`} vertical={false} />
                                <Dato label="Sellado" value={`Bs. ${formatNumber(totales.sellado, 2)}`} vertical={false} />
                                <Dato label="Envasado" value={`Bs. ${formatNumber(totales.envasado, 2)}`} vertical={false} />
                                <Dato label="Etiquetado" value={`Bs. ${formatNumber(totales.etiquetado, 2)}`} vertical={false} />
                            </div>
                            <div className={styles.content}>
                                <div
                                    className={styles.horizontal}
                                >
                                        <InputNormal
                                            tipo='number'
                                            placeholder='Extras'
                                            value={extras}
                                            onChange={handleExtrasChange}
                                            style={{ backgroundColor: 'var(--quaternary-color)' }}
                                   
                                        />

                                        <InputNormal
                                            tipo='number'
                                            placeholder='Aumento'
                                            value={aumento}
                                            onChange={handleAumentoChange}
                                            style={{ backgroundColor: 'var(--quaternary-color)' }}
                                    
                                        />

                                        <InputNormal
                                            tipo='number'
                                            placeholder='Descuento'
                                            value={descuento}
                                            onChange={handleDescuentoChange}
                                            style={{ backgroundColor: 'var(--quaternary-color)' }}
                                        
                                        />
                                    
                                </div>
                                <Dato label="Total producción" value={`Bs. ${formatNumber(totalProduccion, 2)}`} vertical={false} />
                                <Dato label="Total con ajustes" value={`Bs. ${formatNumber(totalConAjustes, 2)}`} especial='green' vertical={false} />
                            </div>
                        </>
                    ) : (
                        <p className={styles.subTitle} style={{ marginTop: '10px' }}>
                            Selecciona un rango de fechas y, opcionalmente, un responsable para calcular los pagos.
                        </p>
                    )}
                    <Boton
                        className='btn-gray'
                        label='Detalle de registros'
                        disabled={detalles.length === 0}
                        onClick={() => setIsTablaOpen(true)}
                    />

                    <div className={styles.buttons}>
                        <Boton
                            className='btn-original'
                            label='Registrar'
                            disabled={detalles.length === 0 || isRegistrarLoading || !responsableSeleccionado}
                            loading={isRegistrarLoading}
                            onClick={handleRegistrarPago}
                        />
                    </div>
                </div>
            </ViewModal>

            <FiltroFecha
                isOpen={isFechaModalOpen}
                setIsOpen={setIsFechaModalOpen}
                startDate={selectedRange.inicio}
                endDate={selectedRange.fin}
                onApply={handleApplyRange}
                onClear={handleClearRange}
                title="Seleccionar rango de fechas"
            />

            {isLargeScreen ? (
                <ModalTable
                    isOpen={isTablaOpen}
                    title="Detalle de registros"
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
                    rows={detallesTabla}
                    onClose={() => setIsTablaOpen(false)}
                />
            ) : (
                <ViewModal isOpen={isTablaOpen} setIsOpen={setIsTablaOpen}>
                    <HeaderModal
                        title="Detalle de registros"
                        onClose={() => setIsTablaOpen(false)}
                    />
                    <div className={styles.modalContent}>
                        {detalles.length > 0 ? (
                            detalles.map((detalle) => (
                                <ItemView
                                    key={detalle.id}
                                    title={detalle.producto}
                                    description={`${detalle.cantidadLabel || 'Terminados'}: ${formatNumber(detalle.cantidadValor ?? detalle.terminados, 2)}`}
                                    description2={`Cern: ${formatNumber(detalle.cernido, 2)} - Sell: ${formatNumber(detalle.sellado, 2)} - Evs: ${formatNumber(detalle.envasado, 2)} - Etq: ${formatNumber(detalle.etiquetado, 2)}`}
                                    flot1={`Sub: ${formatNumber(detalle.subtotal, 2)}`}
                                    icon='receipt'
                                />
                            ))
                        ) : (
                            <NoData
                                icon="receipt"
                                title="Sin registros"
                                detail="No hay registros calculados para mostrar"
                                transparent={false}
                                minHeight="200px"
                            />
                        )}
                    </div>
                </ViewModal>
            )}

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </>
    );
};

export default RegistroPago;
