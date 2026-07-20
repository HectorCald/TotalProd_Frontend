import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import InputSelectBox from '../../../../components/common/inputs/InputSelectBox';
import InputFecha from '../../../../components/common/inputs/InputFecha';
import Input from '../../../../components/common/inputs/Input';
import Boton from '../../../../components/common/botones/Boton';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';
import RegistrosPago from './RegistrosPago';
import { useToast } from '../../../../context/ToastContext';
import personalService from '../../../../services/personalService';
import registrosProduccionDamabravaService from '../../../../services/registrosProduccionDamabravaService';
import pagosDamabravaService from '../../../../services/pagosDamabravaService';
import { seleccionarReglaParaProducto, calcularPagoProcesos } from '../../../../utils/reglasPagoHelper';

const formatNumber = (value, decimals = 2) => {
    const num = Number(value || 0);
    return num.toLocaleString('es-BO', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

const initialTotals = {
    registros: 0,
    cernido: 0,
    sellado: 0,
    envasado: 0,
    etiquetado: 0,
    total: 0
};

const RegistrarPago = ({ isOpen, onClose, reglas = [], onPagoRegistrado }) => {
    const { showSuccess, showWarning, showDanger } = useToast();
    
    const [responsableSeleccionado, setResponsableSeleccionado] = useState('');
    const [responsablesOptions, setResponsablesOptions] = useState([]);
    const [loadingResponsables, setLoadingResponsables] = useState(false);
    
    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);
    
    const [isBuscarLoading, setIsBuscarLoading] = useState(false);
    const [isRegistrarLoading, setIsRegistrarLoading] = useState(false);
    
    const [detalles, setDetalles] = useState([]);
    const [registrosRaw, setRegistrosRaw] = useState([]);
    const [totales, setTotales] = useState(initialTotals);
    const [isDetallesOpen, setIsDetallesOpen] = useState(false);
    
    const [extras, setExtras] = useState('0');
    const [descuento, setDescuento] = useState('0');
    const [aumento, setAumento] = useState('0');

    useEffect(() => {
        if (isOpen) {
            setResponsableSeleccionado('');
            setFechaInicio(null);
            setFechaFin(null);
            setDetalles([]);
            setRegistrosRaw([]);
            setTotales(initialTotals);
            setExtras('0');
            setDescuento('0');
            setAumento('0');
            cargarResponsables();
        }
    }, [isOpen]);

    const cargarResponsables = async () => {
        try {
            setLoadingResponsables(true);
            const response = await personalService.getAll();
            if (response.success && Array.isArray(response.data)) {
                const options = response.data
                    .filter((personal) => personal.id != null && personal.id !== '')
                    .map((personal) => ({
                        value: personal.id,
                        label: `${personal.first_name || ''} ${personal.last_name || ''}`.trim() || 'Sin nombre'
                    }))
                    .filter((opt) => opt.label.toLowerCase() !== 'todos los responsables')
                    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
                setResponsablesOptions(options);
            }
        } catch (error) {
            console.error('Error cargando responsables:', error);
            showDanger('Error al cargar responsables');
        } finally {
            setLoadingResponsables(false);
        }
    };

    const handleMontoChange = (setter) => (event) => {
        const { value } = event.target;
        if (value === '' || value === '-') {
            setter('');
            return;
        }
        const numeric = Number(value);
        if (Number.isNaN(numeric)) return;
        if (numeric < 0) {
            setter('0');
            return;
        }
        setter(value);
    };

    const handleBuscar = async () => {
        if (!responsableSeleccionado) {
            showWarning('Validación', 'Selecciona un responsable.');
            return;
        }
        if (!fechaInicio && !fechaFin) {
            showWarning('Validación', 'Selecciona un rango de fechas.');
            return;
        }

        setIsBuscarLoading(true);
        try {
            const responsablePayload = { id: responsableSeleccionado, tipo: 'personal' };

            const response = await registrosProduccionDamabravaService.getAll(
                1, 100, null, 'fecha_desc', '', responsablePayload, { inicio: fechaInicio, fin: fechaFin }
            );

            if (!response.success) {
                throw new Error(response.message || 'No se pudieron obtener los registros');
            }

            const datos = response.data || [];

            if (datos.length === 0) {
                setDetalles([]);
                setRegistrosRaw([]);
                setTotales(initialTotals);
                setExtras('0');
                setDescuento('0');
                setAumento('0');
                showWarning('Validación', 'No hay registros para los filtros seleccionados.');
                return;
            }

            const acumulado = { ...initialTotals };
            const filas = [];
            let registrosSinRegla = 0;

            datos.forEach((registro) => {
                const productoDetalle = registro?.producto_almacen || null;
                if (!productoDetalle) return;

                const regla = seleccionarReglaParaProducto(reglas, registro, productoDetalle);
                if (!regla) {
                    registrosSinRegla += 1;
                    return;
                }

                const usarCantidadVerificada = ['verificado', 'Ingresado'].includes(registro?.estado);
                const cantidadValor = usarCantidadVerificada
                    ? Number(registro?.cantidad_verificada) || 0
                    : Number(registro?.terminados) || 0;
                
                if (cantidadValor <= 0) return;

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

                const cantidadLabel = usarCantidadVerificada ? 'Verificados' : 'Terminados';

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
            setRegistrosRaw(datos);
            setTotales(acumulado);
            setExtras('0');
            setDescuento('0');
            setAumento('0');

            if (registrosSinRegla > 0) {
                showWarning('Validación', `${registrosSinRegla} registro(s) no tienen regla aplicable.`);
            } else {
                showSuccess('Éxito', 'Cálculo realizado correctamente.');
            }
        } catch (err) {
            console.error('Error al buscar registros:', err);
            showDanger('Error', err.message || 'Error al obtener los registros.');
        } finally {
            setIsBuscarLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (detalles.length === 0) {
            showWarning('Validación', 'No hay detalles para registrar el pago.');
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
                extras: Number(extras) || 0,
                descuento: Number(descuento) || 0,
                aumento: Number(aumento) || 0,
                total_ajustado: totalConAjustes,
                registros: detalles.map((detalle) => detalle.id)
            });

            if (!response.success) {
                throw new Error(response.message || 'Error al registrar el pago.');
            }

            if (onPagoRegistrado) {
                let responsableInfo = response.data?.responsable || null;
                if (!responsableInfo && responsableSeleccionado) {
                    const option = responsablesOptions.find(opt => opt.value === responsableSeleccionado);
                    if (option) {
                        responsableInfo = { id: responsableSeleccionado, name: option.label || 'Sin responsable' };
                    }
                }

                const pagoRegistrado = { ...response.data, responsable: responsableInfo };
                
                const extrasRegistrados = Number(pagoRegistrado.extras) || 0;
                const descuentoRegistrado = Number(pagoRegistrado.descuento) || 0;
                const aumentoRegistrado = Number(pagoRegistrado.aumento) || 0;
                const totalProduccionRegistrado = Number(pagoRegistrado.total) || 0;

                pagoRegistrado.total_produccion = totalProduccionRegistrado;
                pagoRegistrado.total_con_ajustes = totalProduccionRegistrado + extrasRegistrados + aumentoRegistrado - descuentoRegistrado;

                onPagoRegistrado(pagoRegistrado);
            }
            
            onClose(true);
        } catch (err) {
            console.error('Error registrando pago Damabrava:', err);
            showDanger('Error', err.message || 'Error al registrar el pago.');
        } finally {
            setIsRegistrarLoading(false);
        }
    };

    const handleClose = () => {
        if (isRegistrarLoading) return;
        onClose();
    };

    const extrasNumber = Math.max(0, parseFloat(extras) || 0);
    const descuentoNumber = Math.max(0, parseFloat(descuento) || 0);
    const aumentoNumber = Math.max(0, parseFloat(aumento) || 0);
    const totalProduccion = Number(totales.total) || 0;
    const totalConAjustes = totalProduccion + extrasNumber + aumentoNumber - descuentoNumber;

    return (
        <>
        <ModalLateral
            isOpen={isOpen && !isDetallesOpen}
            onClose={handleClose}
            title="Registrar Pago"
            confirmText="Registrar"
            onConfirm={handleConfirm}
            loading={isRegistrarLoading}
            disableClose={isRegistrarLoading}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <InputSelectBox
                    label="Responsable"
                    options={responsablesOptions}
                    value={responsableSeleccionado}
                    onChange={(val) => setResponsableSeleccionado(val)}
                    placeholder="Seleccione responsable..."
                    disabled={loadingResponsables}
                />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                        <InputFecha
                            label="Fecha Inicio"
                            value={fechaInicio}
                            onChange={(val) => setFechaInicio(val)}
                            abbreviate={true}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <InputFecha
                            label="Fecha Fin"
                            value={fechaFin}
                            onChange={(val) => setFechaFin(val)}
                            abbreviate={true}
                        />
                    </div>
                </div>

                <Boton
                    className="btn-cancel"
                    label="Buscar"
                    iconName="search"
                    onClick={handleBuscar}
                    loading={isBuscarLoading}
                    disabled={isBuscarLoading}
                />

                {detalles.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ flex: 1, minWidth: '80px' }}>
                                <Input
                                    label="Extras"
                                    tipo="number"
                                    value={extras}
                                    onChange={handleMontoChange(setExtras)}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: '80px' }}>
                                <Input
                                    label="Aumento"
                                    tipo="number"
                                    value={aumento}
                                    onChange={handleMontoChange(setAumento)}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: '80px' }}>
                                <Input
                                    label="Descuento"
                                    tipo="number"
                                    value={descuento}
                                    onChange={handleMontoChange(setDescuento)}
                                />
                            </div>
                        </div>

                        <ColumnInfo
                            title="Resumen del Pago"
                            items={[
                                { clave: 'Registros', valor: totales.registros },
                                { clave: 'Cernido', valor: `Bs. ${formatNumber(totales.cernido)}` },
                                { clave: 'Sellado', valor: `Bs. ${formatNumber(totales.sellado)}` },
                                { clave: 'Envasado', valor: `Bs. ${formatNumber(totales.envasado)}` },
                                { clave: 'Etiquetado', valor: `Bs. ${formatNumber(totales.etiquetado)}` }
                            ]}
                        />
                        <ColumnInfo
                            title="Finanzas"
                            items={[
                                { clave: 'Total Producción', valor: `Bs. ${formatNumber(totalProduccion)}` },
                                { clave: 'Extras (Bs.)', valor: `+ Bs. ${formatNumber(extrasNumber)}`, colorValor: 'var(--success-color)' },
                                { clave: 'Aumento (Bs.)', valor: `+ Bs. ${formatNumber(aumentoNumber)}`, colorValor: 'var(--success-color)' },
                                { clave: 'Descuento (Bs.)', valor: `- Bs. ${formatNumber(descuentoNumber)}`, colorValor: 'var(--error-color)' }
                            ].filter(item => {
                                if (item.clave.includes('Extras') && extrasNumber === 0) return false;
                                if (item.clave.includes('Aumento') && aumentoNumber === 0) return false;
                                if (item.clave.includes('Descuento') && descuentoNumber === 0) return false;
                                return true;
                            })}
                            finance={true}
                            financeTotal={`Bs. ${formatNumber(totalConAjustes)}`}
                        />

                        <Boton
                            className="btn-cancel"
                            label="Detalle de registros"
                            iconName="list-ul"
                            onClick={() => setIsDetallesOpen(true)}
                        />
                    </div>
                )}
            </div>
        </ModalLateral>

        <RegistrosPago
            isOpen={isDetallesOpen}
            onClose={() => setIsDetallesOpen(false)}
            data={detalles}
        />
        </>
    );
};

export default RegistrarPago;
