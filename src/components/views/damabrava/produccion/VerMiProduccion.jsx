import React, { useState } from 'react';
import styles from '../../../../styles/view.module.css';
import HeaderView from '../../../common/HeaderView';
import View from '../../../ui/View';
import Dato from '../../../common/Dato';
import Boton from '../../../common/Boton';
import ItemView from '../../../common/ItemView';
import ModalDescarga from '../../../ui/ModalDescarga';
import StatusBadge from '../../../common/StatusBadge';
import NoData from '../../../common/NoData';
import { formatFechaLiteral, formatHoraSinSegundos, formatFechaHoraLiteral } from '../../../../utils/dateUtils';
import { useLayout } from '../../../../context/LayoutContext';

function VerMiProduccion({ isOpen, setIsOpen, registro }) {
    const { isLargeScreen } = useLayout();
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);

    // Formateo seguro Mes Año (evita desfase por zonas horarias)
    const formatMesAnio = (v) => {
        if (!v) return '';
        const base = String(v).split('T')[0];
        const [y, m] = base.split('-');
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const nombreMes = meses[(parseInt(m, 10) || 1) - 1] || '';
        return `${nombreMes} ${y}`;
    };

    const procesoLabel = registro?.proceso === 'cernido' ? 'Cernido' : registro?.proceso === 'seleccionado' ? 'Seleccionado' : registro?.proceso === 'ninguno' ? 'Ninguno' : registro?.proceso || '--';

    // Función para preparar datos de descarga
    const prepararDatosDescarga = () => {
        if (!registro) return { informacionSuperior: {}, tablaHeaders: [], tablaValores: [] };

        // Obtener nombre de la sucursal
        const nombreSucursal = registro?.sucursal?.name || 'Sucursal no encontrada';

        // Información superior (sin responsable)
        const informacionSuperior = {
            'Producto': registro?.producto_almacen?.name || 'Sin producto',
            'Lote': registro?.lote || '0',
            'Proceso': registro?.proceso === 'cernido' ? 'Cernido' :
                registro?.proceso === 'seleccionado' ? 'Seleccionado' :
                    registro?.proceso === 'ninguno' ? 'Ninguno' : registro?.proceso,
            'Microondas': `${registro?.microondas || '0'} min`,
            'Terminados': `${registro?.terminados || '0'} ud`,
            'Fecha de Registro': formatFechaHoraLiteral(registro?.fecha),
            'Fecha de Vencimiento': formatFechaLiteral(registro?.vencimiento, !isLargeScreen),
            'Estado': registro?.estado === 'pendiente' ? 'Pendiente' :
                registro?.estado === 'verificado' ? 'Verificado' :
                    registro?.estado === 'Ingresado' ? 'Ingresado' :
                        registro?.estado === 'anulado' ? 'Anulado' : registro?.estado,
            'Sucursal': nombreSucursal
        };

        if (registro?.observaciones) {
            informacionSuperior['Observaciones'] = registro.observaciones;
        }

        if (registro?.fecha_verificado) {
            informacionSuperior['Fecha de Verificación'] = formatFechaLiteral(registro.fecha_verificado, !isLargeScreen);
        }

        if (registro?.cantidad_verificada) {
            informacionSuperior['Cantidad Verificada'] = `${registro.cantidad_verificada} ud`;
        }

        // No hay tabla para registros de producción, solo información
        const tablaHeaders = [];
        const tablaValores = [];

        return { informacionSuperior, tablaHeaders, tablaValores };
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>Mis Detalles<StatusBadge estado={registro?.estado} variant="produccion" /></h1>
                        <p className={styles.subTitle}>Registrado el {formatFechaLiteral(registro?.fecha, !isLargeScreen)}</p>
                    </div>
                    <div className={styles.iconButton}>
                        <Boton
                            iconName="download"
                            label="Descargar"
                            className="btn-default"
                            onClick={() => setIsDescargaOpen(true)}
                            hideTextOnMobile={true}
                        />
                    </div>
                </div>

                <div className={styles.contentRow}>
                    {/* Primera columna: Información de la producción (sin responsable) */}
                    <div className={styles.contentHalf}>
                        <div className={styles.content} style={{ height: '100%' }}>
                            <ItemView
                                title="Información de la Producción"
                                transparent={true}
                                icon="box"
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                            />
                            <Dato label="Producto" value={registro?.producto_almacen?.name || 'Sin producto'} vertical={false} />
                            <Dato label="Lote" value={registro?.lote || '0'} vertical={false} />
                            <Dato label="Proceso" value={procesoLabel} vertical={false} />
                            <Dato label="Tiempo de Microondas" value={`${registro?.microondas || '0'} segundos`} vertical={false} />
                            <Dato label="Cantidad Terminados" value={`${registro?.terminados || '0'} unidades`} vertical={false} />
                            <Dato label="Fecha de Vencimiento" value={formatMesAnio(registro?.vencimiento)} vertical={false} />
                            {registro?.observaciones && (
                                <Dato label="Observaciones" value={registro.observaciones} vertical={false} />
                            )}
                        </div>
                    </div>

                    {/* Segunda columna: Datos de verificación (o NoData si no está verificado) */}
                    <div className={styles.contentHalf}>
                        <div className={styles.content} style={{ height: '100%' }}>
                            <ItemView
                                title="Información de Verificación"
                                transparent={true}
                                icon="check-double"
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                            />
                            {registro?.estado !== 'pendiente' && registro?.fecha_verificado ? (
                                <>
                                    <Dato label="Fecha de Verificación" value={formatFechaLiteral(registro.fecha_verificado, !isLargeScreen)} vertical={false} />
                                    <Dato label="Cantidad Verificada" value={`${registro.cantidad_verificada} unidades`} vertical={false} especial="green" />
                                    <Dato label="Cantidad Ingresada" value={`${registro.cantidad_ingresada} unidades`} vertical={false} especial="blue" />
                                </>
                            ) : (
                                <NoData
                                    icon="check-shield"
                                    title="Falta información de verificación"
                                    detail="Este registro aún no ha sido verificado."
                                    transparent={true}
                                    minHeight="140px"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de descarga */}
            <ModalDescarga
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                titulo="Descargar Mi Registro de Producción"
                subtitulo="Selecciona el formato que prefieras para descargar este registro."
                nombreArchivo={`Mi_Registro_Produccion_${registro?.lote || '0'}_${formatFechaLiteral(registro?.fecha, false).replace(/\s+/g, '_')}`}
                {...prepararDatosDescarga()}
            />
        </View>
    );
}

export default VerMiProduccion;
