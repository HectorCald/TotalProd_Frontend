import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/Dato';
import Boton from '../../common/Boton';
import ItemView from '../../common/ItemView';
import ModalDescarga from '../../ui/ModalDescarga';
import EditarAgregarGasto from './EditarAgregarGasto';
import ModalEliminar from './modales/ModalEliminar';
import ResumenFinanciero from '../../ui/ResumenFinanciero';
import Skeleton from '../../common/Skeleton';
import NoData from '../../common/NoData';
import proveedorService from '../../../services/proveedorService';
import { formatCurrency } from '../../../utils/numberUtils';
import { formatFechaLiteral } from '../../../utils/dateUtils';
import { useLayout } from '../../../context/LayoutContext';


function VerGasto({ isOpen, setIsOpen, gasto, onGastoEliminado, onGastoActualizado }) {
    const { isLargeScreen } = useLayout();
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isEditarOpen, setIsEditarOpen] = useState(false);

    // Estado local para el gasto (como VerProducto con productoActual) - actualización en tiempo real
    const [gastoActual, setGastoActual] = useState(gasto);

    useEffect(() => {
        setGastoActual(gasto);
    }, [gasto]);

    // Estado para la información del proveedor
    const [proveedorInfo, setProveedorInfo] = useState(null);
    const [loadingProveedor, setLoadingProveedor] = useState(false);

    // Cargar información del proveedor cuando hay proveedor_id
    useEffect(() => {
        const cargarProveedor = async () => {
            if (gastoActual?.proveedor_id) {
                setLoadingProveedor(true);
                setProveedorInfo(null); // Resetear antes de cargar
                try {
                    const response = await proveedorService.getById(gastoActual.proveedor_id);
                    if (response && response.success) {
                        setProveedorInfo(response.data);
                    } else {
                        console.warn('No se pudo cargar la información del proveedor:', response?.message);
                        setProveedorInfo(null);
                    }
                } catch (error) {
                    console.error('Error al cargar información del proveedor:', error);
                    setProveedorInfo(null);
                    // No mostrar notificación aquí para no molestar al usuario
                } finally {
                    setLoadingProveedor(false);
                }
            } else {
                setProveedorInfo(null);
                setLoadingProveedor(false);
            }
        };

        cargarProveedor();
    }, [gastoActual?.proveedor_id]);

    // Función para preparar datos de descarga
    const prepararDatosDescarga = () => {
        if (!gastoActual) return { informacionSuperior: {}, tablaHeaders: [], tablaValores: [] };

        // Información superior
        const informacionSuperior = {
            'Responsable': gastoActual?.user?.name || gastoActual?.personal?.name || 'Usuario desconocido',
            'Fecha': formatFechaLiteral(gastoActual?.fecha_gasto, !isLargeScreen),
            'Concepto': gastoActual?.concepto || 'Sin concepto',
            'Valor': formatCurrency(gastoActual?.valor),
            'Método de Pago': gastoActual?.metodo_pago || 'No especificado',
            'Sucursal': gastoActual?.sucursal?.name || 'Sucursal no encontrada'
        };

        if (gastoActual?.proveedor?.name) {
            informacionSuperior['Proveedor'] = gastoActual.proveedor.name;
        }

        // No hay tabla para gastos, solo información
        return { informacionSuperior, tablaHeaders: [], tablaValores: [] };
    };

    // Función para generar nombre de archivo
    const getNombreArchivo = () => {
        const fechaFormateada = formatFechaLiteral(gastoActual?.fecha_gasto, !isLargeScreen).replace(/\//g, '-');
        const conceptoLimpio = gastoActual?.concepto?.replace(/[^a-zA-Z0-9]/g, '_') || 'gasto';
        return `Gasto_${fechaFormateada}_${conceptoLimpio}`;
    };

    // Función para manejar cuando se actualiza un gasto (como VerProducto: actualizar local + notificar padre)
    const handleGastoUpdated = (gastoActualizado) => {
        setGastoActual(gastoActualizado);
        if (onGastoActualizado) {
            onGastoActualizado(gastoActualizado);
        }
        setIsEditarOpen(false);
    };

    // Función para calcular resumen financiero del gasto
    const calcularResumenGasto = () => {
        if (!gastoActual) {
            return {
                subtotalFormatted: formatCurrency(0),
                totalFormatted: formatCurrency(0),
                descuento: { tieneDescuento: false },
                aumento: { tieneAumento: false }
            };
        }

        const valor = parseFloat(gastoActual?.valor) || 0;

        return {
            subtotalFormatted: formatCurrency(valor),
            totalFormatted: formatCurrency(valor),
            descuento: { tieneDescuento: false },
            aumento: { tieneAumento: false }
        };
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>Detalles del Gasto</h1>
                        <p className={styles.subTitle}> Registrado el {formatFechaLiteral(gastoActual?.fecha_gasto, !isLargeScreen)}</p>
                    </div>
                    <div className={styles.iconButton}>
                        <Boton
                            iconName='download'
                            label='Descargar'
                            className='btn-default'
                            onClick={() => setIsDescargaOpen(true)}
                            hideTextOnMobile={true}
                        />
                    </div>
                </div>
                <div className={styles.contentRow}>
                    {/* Primera columna: Información del proveedor (solo si hay proveedor_id) */}
                    {gastoActual?.proveedor_id && (
                        <div className={styles.contentHalf}>
                            <div className={styles.content}>
                                <ItemView
                                    title="Información del Proveedor"
                                    transparent={true}
                                    icon="store"
                                    iconShape="square"
                                    style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                                />
                                {loadingProveedor ? (
                                    <>
                                        <Skeleton width="100%" height="25px" />
                                        <Skeleton width="100%" height="25px" />
                                        <Skeleton width="100%" height="25px" />
                                        <Skeleton width="100%" height="25px" />
                                        <Skeleton width="100%" height="25px" />
                                    </>
                                ) : 
                                    <>
                                        <Dato label="Nombre" value={proveedorInfo?.name || 'N/A'} vertical={false} />
                                        <Dato label="Celular" value={proveedorInfo?.phone || 'N/A'} vertical={false} />
                                        <Dato label="Descripción" value={proveedorInfo?.description || 'Sin descripción'} vertical={false} />
                                        <Dato label="Pedidos realizados" value={(proveedorInfo?.total_orders || 0) + ' Pedidos'} vertical={false} />
                                        <Dato label="Ubicación" value={proveedorInfo?.location || 'Sin ubicación'} vertical={false} />
                                    </>
                                }
                            </div>
                        </div>
                    )}

                    {/* Segunda columna: Detalles del gasto */}
                    <div className={styles.contentHalf}>
                        <div className={styles.content}>
                            <ItemView
                                title="Detalles del Gasto"
                                transparent={true}
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                                icon="money"
                            />
                            <Dato
                                label="Método de Pago"
                                value={gastoActual?.metodo_pago?.toUpperCase() || 'No especificado'}
                                vertical={false}
                            />
                            <Dato
                                label="Concepto"
                                value={gastoActual?.concepto || 'Sin concepto'}
                                vertical={false}
                            />
                            {gastoActual?.proveedor_id && (
                                <Dato
                                    label="Proveedor"
                                    value={proveedorInfo?.name || gastoActual?.proveedor?.name || 'Sin proveedor'}
                                    vertical={false}
                                />
                            )}
                            <Dato
                                label="Responsable"
                                value={gastoActual?.user?.name || gastoActual?.personal?.name || 'Usuario desconocido'}
                                vertical={false}
                            />
                            <Dato
                                label="Sucursal"
                                value={gastoActual?.sucursal?.name || 'Sin sucursal'}
                                vertical={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Resumen Financiero */}
                <ResumenFinanciero resumen={calcularResumenGasto()} />

                <div className={styles.buttons}>
                    <Boton
                        className='btn-red'
                        label='Eliminar Gasto'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsEliminarOpen(true)}
                        iconName='trash'
                        hideTextOnMobile={true}
                    />
                    <Boton
                        className='btn-default'
                        label='Editar Gasto'
                        onClick={() => setIsEditarOpen(true)}
                        iconName='edit'
                        hideTextOnMobile={true}
                    />
                </div>
            </div>

            {/* Modal de descarga */}
            <ModalDescarga
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                titulo="Descargar Gasto"
                subtitulo="Selecciona el formato que prefieras para descargar este gasto."
                nombreArchivo={getNombreArchivo()}
                {...prepararDatosDescarga()}
            />

            {/* Modal de editar gasto */}
            <EditarAgregarGasto
                isOpen={isEditarOpen}
                setIsOpen={setIsEditarOpen}
                gasto={gastoActual}
                tipo='editar'
                onGastoUpdated={handleGastoUpdated}
            />

            {/* Modal de eliminar gasto */}
            <ModalEliminar
                isOpen={isEliminarOpen}
                setIsOpen={setIsEliminarOpen}
                gasto={gastoActual}
                setIsOpenVerGasto={setIsOpen}
                onGastoEliminado={onGastoEliminado}
            />
        </View>
    );
}

export default VerGasto;