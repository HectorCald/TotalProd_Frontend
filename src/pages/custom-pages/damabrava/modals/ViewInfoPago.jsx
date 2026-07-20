import React, { useEffect, useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import InfoCard from '../../../../components/common/information/InfoCard';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import { formatFechaLiteral } from '../../../../utils/dateUtils';
import Boton from '../../../../components/common/botones/Boton';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';
import MarcarPago from './MarcarPago';
import AnularPago from './AnularPago';
import EliminarPago from './EliminarPago';
import RegistrosPago from './RegistrosPago';
import styles from '../../../../styles/view.module.css';
import { useToast } from '../../../../context/ToastContext';
import pagosDamabravaService from '../../../../services/pagosDamabravaService';
import reglasProduccionDamabravaService from '../../../../services/reglasProduccionDamabravaService';
import { seleccionarReglaParaProducto, calcularPagoProcesos } from '../../../../utils/reglasPagoHelper';

const formatNumber = (value, decimals = 2) => {
    const num = Number(value || 0);
    return num.toLocaleString('es-BO', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

const ViewInfoPago = ({
    isOpen,
    onClose,
    pago,
    onPagoActualizado,
    onPagoEliminado
}) => {
    const [detallePago, setDetallePago] = useState(pago || null);
    const [isMarcarOpen, setIsMarcarOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isRegistrosOpen, setIsRegistrosOpen] = useState(false);

    const [loadingRegistros, setLoadingRegistros] = useState(false);
    const [registrosFetched, setRegistrosFetched] = useState([]);
    const [reglasFetched, setReglasFetched] = useState([]);
    const { showDanger } = useToast();

    useEffect(() => {
        if (isOpen) {
            setDetallePago(pago || null);
        }
    }, [isOpen, pago]);

    if (!detallePago && !isOpen) return null;

    const estadoActual = detallePago?.estado || 'pendiente';
    const responsableNombre = detallePago?.responsable?.name || 'Sin responsable';
    const periodoTexto = detallePago
        ? `${formatFechaLiteral(detallePago.fecha_inicio, true)} - ${formatFechaLiteral(detallePago.fecha_fin, true)}`
        : '--';
    const fechaCreacion = formatFechaLiteral(detallePago?.fecha, true);
    
    const registradoPorNombre =
        detallePago?.registrado_por?.name ||
        detallePago?.personal?.name ||
        detallePago?.user?.name ||
        'Sin información';
    
    const tags = [
        { label: 'Estado', text: estadoActual === 'pagado' ? 'Pagado' : 'Pendiente', icon: 'check-circle' },
        { label: 'Periodo', text: periodoTexto, icon: 'calendar' }
    ];

    const stats = [
        { label: 'Cernido', value: `Bs. ${formatNumber(detallePago?.cernido, 2)}`, icon: 'calculator' },
        { label: 'Sellado', value: `Bs. ${formatNumber(detallePago?.sellado, 2)}`, icon: 'calculator' },
        { label: 'Envasado', value: `Bs. ${formatNumber(detallePago?.envasado, 2)}`, icon: 'calculator' },
        { label: 'Etiquetado', value: `Bs. ${formatNumber(detallePago?.etiquetado, 2)}`, icon: 'calculator' }
    ];

    const handlePagoActualizado = (pagoActualizado) => {
        setDetallePago(pagoActualizado);
        if (onPagoActualizado) onPagoActualizado(pagoActualizado);
    };

    const handlePagoEliminado = (id) => {
        setIsEliminarOpen(false);
        onClose();
        if (onPagoEliminado) onPagoEliminado(id);
    };

    const handleVerRegistros = async () => {
        if (!detallePago?.id) return;
        setLoadingRegistros(true);
        try {
            const [reglasRes, registrosRes] = await Promise.all([
                reglasProduccionDamabravaService.getAll(),
                pagosDamabravaService.getRegistros(detallePago.id)
            ]);

            if (!reglasRes.success) {
                showDanger('Error', 'No se pudieron cargar las reglas de producción.');
                return;
            }

            if (!registrosRes.success) {
                showDanger('Error', 'No se pudieron cargar los registros del pago.');
                return;
            }

            const registrosData = Array.isArray(registrosRes.data) ? registrosRes.data : [];
            const reglasData = reglasRes.data || [];

            const calculados = registrosData.map((registro) => {
                const productoDetalle = registro.producto_almacen || null;
                const regla = seleccionarReglaParaProducto(reglasData, registro, productoDetalle);
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

            setRegistrosFetched(calculados);
            setIsRegistrosOpen(true);
        } catch (error) {
            console.error('Error fetching data:', error);
            showDanger('Error', 'Hubo un error de conexión al cargar registros.');
        } finally {
            setLoadingRegistros(false);
        }
    };

    return (
        <>
        <ModalCentro
            isOpen={isOpen && !isMarcarOpen && !isAnularOpen && !isEliminarOpen && !isRegistrosOpen}
            onClose={onClose}
            title=""
            confirmText="Cerrar"
            onConfirm={onClose}
            hideFooter={true}
            width="450px"
            receipt={true}
        >
            {detallePago && (
                <InfoCard
                    title={responsableNombre}
                    subtitle={`Registrado por ${registradoPorNombre} el ${fechaCreacion}`}
                    statusDot={estadoActual === 'pendiente' ? 'error' : 'success'}
                    icon="user"
                    customBlock={
                        <>
                            {tags.length > 0 && (
                                <ColumnInfo items={tags.map(t => ({ text: t.text, icon: t.icon }))} />
                            )}
                            {stats.length > 0 && (
                                <ColumnInfo 
                                    title="Detalles"
                                    items={stats.map(s => ({ clave: s.label, valor: s.value }))}
                                />
                            )}
                        </>
                    }
                    actionButton={
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            <Boton
                                label="Ver Registros"
                                iconName="list-ul"
                                className="btn-primary"
                                style={{ flex: 1 }}
                                onClick={handleVerRegistros}
                                loading={loadingRegistros}
                                disabled={loadingRegistros}
                            />
                            {estadoActual !== 'pagado' ? (
                                <BotonIcon
                                    iconName="check-circle"
                                    className="btn-primary"
                                    tooltip="Marcar como pagado"
                                    onClick={() => setIsMarcarOpen(true)}
                                />
                            ) : (
                                <BotonIcon
                                    iconName="undo"
                                    className="btn-warning"
                                    tooltip="Anular pagado"
                                    onClick={() => setIsAnularOpen(true)}
                                />
                            )}
                            <BotonIcon
                                iconName="trash"
                                className="btn-error"
                                tooltip="Eliminar pago"
                                tooltipAlign='end'
                                onClick={() => setIsEliminarOpen(true)}
                            />
                        </div>
                    }
                />
            )}
        </ModalCentro>

        <MarcarPago
            isOpen={isMarcarOpen}
            onClose={() => setIsMarcarOpen(false)}
            pago={detallePago}
            onMarcar={handlePagoActualizado}
        />

        <AnularPago
            isOpen={isAnularOpen}
            onClose={() => setIsAnularOpen(false)}
            pago={detallePago}
            onAnular={handlePagoActualizado}
        />

        <EliminarPago
            isOpen={isEliminarOpen}
            onClose={() => setIsEliminarOpen(false)}
            pago={detallePago}
            onEliminar={handlePagoEliminado}
        />

        <RegistrosPago
            isOpen={isRegistrosOpen}
            onClose={() => setIsRegistrosOpen(false)}
            data={registrosFetched}
        />
        </>
    );
};

export default ViewInfoPago;
