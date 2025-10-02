import React, { useState, useEffect } from 'react';
import styles from '../../../../styles/view.module.css';
import HeaderView from '../../../common/HeaderView';
import View from '../../../ui/View';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Dato from '../../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import ItemView from '../../../common/ItemView';
import Notification from '../../../common/Notification';
import ModalDescarga from '../../../ui/ModalDescarga';

function VerMiProduccion({ isOpen, setIsOpen, registro }) {
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
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

    // Función para manejar el destacado
    const handleDestacar = () => {
        if (!registro?.id) return;

        let registrosDestacados = JSON.parse(localStorage.getItem('RegistrosProduccionDestacados') || '[]');

        if (isDestacado) {
            // Quitar de destacados
            registrosDestacados = registrosDestacados.filter(r => r.id !== registro.id);
            setIsDestacado(false);
        } else {
            // Verificar si ya hay 10 registros destacados
            if (registrosDestacados.length >= 10) {
                mostrarNotificacion('error', 'Solo puedes destacar máximo 10 registros de producción');
                return;
            }

            // Agregar a destacados
            registrosDestacados.push({
                id: registro.id,
                tipo: 'produccion'
            });
            setIsDestacado(true);
        }

        localStorage.setItem('RegistrosProduccionDestacados', JSON.stringify(registrosDestacados));
    };

    useEffect(() => {
        if (registro?.id) {
            const registrosDestacados = JSON.parse(localStorage.getItem('RegistrosProduccionDestacados') || '[]');
            const esDestacado = registrosDestacados.some(r => r.id === registro.id);
            setIsDestacado(esDestacado);
        }
    }, [registro?.id]);

    // Función para preparar datos de descarga
    const prepararDatosDescarga = () => {
        if (!registro) return { informacionSuperior: {}, tablaHeaders: [], tablaValores: [] };

        // Obtener nombre de la sucursal
        const nombreSucursal = registro?.sucursal?.name || 'Sucursal no encontrada';

        // Información superior
        const informacionSuperior = {
            'Responsable': registro?.user?.name || registro?.personal?.name || 'Usuario desconocido',
            'Producto': registro?.producto_almacen?.name || 'Sin producto',
            'Lote': registro?.lote || '0',
            'Proceso': registro?.proceso === 'cernido' ? 'Cernido' :
                registro?.proceso === 'seleccionado' ? 'Seleccionado' :
                    registro?.proceso === 'ninguno' ? 'Ninguno' : registro?.proceso,
            'Microondas': `${registro?.microondas || '0'} min`,
            'Terminados': `${registro?.terminados || '0'} ud`,
            'Fecha de Registro': new Date(registro?.fecha).toLocaleString(),
            'Fecha de Vencimiento': new Date(registro?.vencimiento).toLocaleDateString(),
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
            informacionSuperior['Fecha de Verificación'] = new Date(registro.fecha_verificado).toLocaleDateString();
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
                <h1 className={styles.title}>
                    Mis Detalles de Producción
                    <div className={styles.iconButton}>
                        <button
                            className={styles.iconButton}
                            onClick={handleDestacar}
                            title={isDestacado ? 'Quitar de destacados' : 'Destacar registro'}
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
                <p className={styles.subTitle}>INFORMACIÓN DEL REGISTRO</p>
                <ItemView
                    title={registro?.user?.name || registro?.personal?.name || 'Usuario desconocido'}
                    description="Responsable del registro"
                    transparent={false}
                />
                <ItemView
                    title={registro?.producto_almacen?.name || 'Sin producto'}
                    description={`Lote: ${registro?.lote || '0'}`}
                    description2={`Proceso: ${registro?.proceso === 'cernido' ? 'Cernido' : registro?.proceso === 'seleccionado' ? 'Seleccionado' : registro?.proceso === 'ninguno' ? 'Ninguno' : registro?.proceso}`}
                    transparent={false}
                    circulo={false}
                    flot6={
                        registro?.estado === 'pendiente' ? 'Pendiente' : 
                        registro?.estado === 'verificado' ? 'Verificado' : 
                        registro?.estado === 'Ingresado' ? 'Ingresado' : 
                        registro?.estado || ''
                    }
                />

                {/* Información de producción */}
                <div className={styles.content}>
                    <Dato
                        label="Tiempo de Microondas"
                        value={`${registro?.microondas || '0'} segundos`}
                        vertical={false}
                    />
                    <Dato
                        label="Cantidad Terminados"
                        value={`${registro?.terminados || '0'} unidades`}
                        vertical={false}
                        especial='green'
                    />
                    <Dato
                        label="Fecha de Vencimiento"
                        value={new Date(registro?.vencimiento).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: '2-digit' // o 'long' si lo quieres con nombre: "octubre"
                          })}
                          
                        vertical={false}
                    />
                    <Dato
                        label="Fecha de Registro"
                        value={new Date(registro?.fecha).toLocaleString()}
                        vertical={false}
                    />
                </div>

                {/* Información de verificación si existe */}
                {registro?.fecha_verificado && (
                    <div className={styles.content}>
                        <Dato
                            label="Fecha de Verificación"
                            value={new Date(registro.fecha_verificado).toLocaleDateString()}
                            vertical={false}
                        />

                        <Dato
                            label="Cantidad Verificada"
                            value={`${registro.cantidad_verificada} unidades`}
                            vertical={false}
                            especial='blue'
                        />
                        <Dato
                            label="Cantidad Ingresada"
                            value={`${registro.cantidad_ingresada} unidades`}
                            vertical={false}
                            especial='green'
                        />

                    </div>
                )}

                {/* Observaciones del registro */}
                {registro?.observaciones && (
                    <div className={styles.content}>
                        <Dato
                            label="Observaciones"
                            value={registro.observaciones}
                            vertical={true}
                        />
                    </div>
                )}
            </div>

            {/* Modal de descarga */}
            <ModalDescarga
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                titulo="Descargar Mi Registro de Producción"
                subtitulo="Selecciona el formato que prefieras para descargar este registro."
                nombreArchivo={`Mi_Registro_Produccion_${registro?.lote || '0'}_${new Date(registro?.fecha).toLocaleDateString().replace(/\//g, '-')}`}
                {...prepararDatosDescarga()}
            />

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View >
    );
}

export default VerMiProduccion;
