import React, { useState, useEffect } from 'react';
import styles from '../../../../styles/view.module.css';
import HeaderView from '../../../common/HeaderView';
import View from '../../../ui/View';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Dato from '../../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../../common/Boton';
import ItemView from '../../../common/ItemView';
import Notification from '../../../common/Notification';
import ModalDescarga from '../../../ui/ModalDescarga';
import registrosProduccionDamabravaService from '../../../../services/registrosProduccionDamabravaService';
import productsAlmacenService from '../../../../services/productsAlmacenService';
import InputNormal from '../../../common/InputNormal';
import IngresoProduccion from './IngresoProduccion';

function VerProduccion({ isOpen, setIsOpen, registro, onRegistroAnulado, onRegistroEliminado, onRegistroVerificado }) {
    const [loading, setLoading] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isVerificarOpen, setIsVerificarOpen] = useState(false);
    const [isIngresoOpen, setIsIngresoOpen] = useState(false);
    const [productoDetalle, setProductoDetalle] = useState(null);
    const [loadingProducto, setLoadingProducto] = useState(false);
    
    // Estado local para el registro actualizado
    const [registroActual, setRegistroActual] = useState(registro);

    // Actualizar el registro local cuando cambie el prop
    useEffect(() => {
        setRegistroActual(registro);
    }, [registro]);

    // Estados para el modal de verificación
    const [cantidadVerificada, setCantidadVerificada] = useState('');
    const [observacionesVerificacion, setObservacionesVerificacion] = useState('');

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


    // Función para preparar datos de descarga
    const prepararDatosDescarga = () => {
        if (!registroActual) return { informacionSuperior: {}, tablaHeaders: [], tablaValores: [] };

        // Obtener nombre de la sucursal
        const nombreSucursal = registroActual?.sucursal?.name || 'Sucursal no encontrada';

        // Información superior
        const informacionSuperior = {
            'Responsable': registroActual?.user?.name || registroActual?.personal?.name || 'Usuario desconocido',
            'Producto': registroActual?.producto_almacen?.name || 'Sin producto',
            'Lote': registroActual?.lote || '0',
            'Proceso': registroActual?.proceso === 'cernido' ? 'Cernido' :
                registroActual?.proceso === 'seleccionado' ? 'Seleccionado' :
                    registroActual?.proceso === 'ninguno' ? 'Ninguno' : registroActual?.proceso,
            'Microondas': `${registroActual?.microondas || '0'} min`,
            'Terminados': `${registroActual?.terminados || '0'} ud`,
            'Fecha de Registro': new Date(registroActual?.fecha).toLocaleString(),
            'Fecha de Vencimiento': new Date(registroActual?.vencimiento).toLocaleDateString(),
            'Estado': registroActual?.estado === 'pendiente' ? 'Pendiente' :
                registroActual?.estado === 'verificado' ? 'Verificado' :
                    registroActual?.estado === 'Ingresado' ? 'Ingresado' :
                        registroActual?.estado === 'anulado' ? 'Anulado' : registroActual?.estado,
            'Sucursal': nombreSucursal
        };

        if (registroActual?.observaciones) {
            informacionSuperior['Observaciones'] = registroActual.observaciones;
        }

        if (registroActual?.fecha_verificado) {
            informacionSuperior['Fecha de Verificación'] = new Date(registroActual.fecha_verificado).toLocaleDateString();
        }

        if (registroActual?.cantidad_verificada) {
            informacionSuperior['Cantidad Verificada'] = `${registroActual.cantidad_verificada} ud`;
        }

        // No hay tabla para registros de producción, solo información
        const tablaHeaders = [];
        const tablaValores = [];

        return { informacionSuperior, tablaHeaders, tablaValores };
    };

    // Handle para anular verificación
    const handleAnular = async () => {
        // Validar que no haya cantidad ingresada
        if ((registroActual?.cantidad_ingresada || 0) > 0) {
            mostrarNotificacion('error', 'No se puede anular la verificación porque ya hay cantidad ingresada al almacén');
            return;
        }

        setLoading(true);
        try {
            const response = await registrosProduccionDamabravaService.unverify(registroActual.id);

            if (response.success) {
                setIsAnularOpen(false);
                setIsOpen(false); // Cerrar el modal principal

                // Actualizar el registro local con los datos devueltos
                setRegistroActual(response.data);
                if (onRegistroVerificado) {
                    onRegistroVerificado(response.data);
                }
            } else {
                mostrarNotificacion('error', response.message || 'Error al anular la verificación');
            }
        } catch (error) {
            console.error('Error anulando verificación:', error);
            mostrarNotificacion('error', 'Error al anular la verificación');
        } finally {
            setLoading(false);
        }
    };

    // Handle para eliminar registro
    const handleEliminar = async () => {
        setLoading(true);
        try {
            const response = await registrosProduccionDamabravaService.delete(registroActual.id);

            if (response.success) {
                setIsEliminarOpen(false);
                setIsOpen(false);

                if (onRegistroEliminado) {
                    onRegistroEliminado(registroActual.id);
                }
                mostrarNotificacion('success', 'Registro eliminado correctamente');
            } else {
                mostrarNotificacion('error', response.message || 'Error al eliminar el registro');
            }
        } catch (error) {
            console.error('Error eliminando registro:', error);
            mostrarNotificacion('error', 'Error al eliminar el registro');
        } finally {
            setLoading(false);
        }
    };

    // Handle para verificar registro
    const handleVerificar = async () => {
        // Validaciones
        if (!cantidadVerificada || isNaN(cantidadVerificada) || parseFloat(cantidadVerificada) < 0) {
            mostrarNotificacion('error', 'La cantidad verificada debe ser un número válido mayor o igual a 0');
            return;
        }

        setLoading(true);
        try {
            const verificacionData = {
                cantidad_verificada: parseFloat(cantidadVerificada),
                observaciones: observacionesVerificacion || null
            };

            const response = await registrosProduccionDamabravaService.verify(registroActual.id, verificacionData);

            if (response.success) {
                setIsVerificarOpen(false);

                // Limpiar campos del modal
                setCantidadVerificada('');
                setObservacionesVerificacion('');

                // Actualizar el registro local con los datos devueltos
                setRegistroActual(response.data);
                if (onRegistroVerificado) {
                    onRegistroVerificado(response.data);
                }
            } else {
                mostrarNotificacion('error', response.message || 'Error al verificar el registro');
            }
        } catch (error) {
            console.error('Error verificando registro:', error);
            mostrarNotificacion('error', 'Error al verificar el registro');
        } finally {
            setLoading(false);
        }
    };

    // Función para abrir el modal de verificación
    const handleOpenVerificar = () => {
        // Pre-llenar con la cantidad de terminados como sugerencia
        setCantidadVerificada(registroActual?.terminados?.toString() || '');
        setObservacionesVerificacion('');
        setIsVerificarOpen(true);
    };

    // Función para obtener producto y abrir modal de ingreso
    const handleOpenIngreso = async () => {
        if (!registroActual?.producto_almacen?.id) {
            mostrarNotificacion('error', 'No se encontró el ID del producto');
            return;
        }

        setLoadingProducto(true);
        try {
            const response = await productsAlmacenService.getById(registroActual.producto_almacen.id);

            if (response.success && response.data) {
                setProductoDetalle(response.data);
                setIsIngresoOpen(true);
            } else {
                mostrarNotificacion('error', response.message || 'Error al obtener los detalles del producto');
            }
        } catch (error) {
            console.error('Error obteniendo producto:', error);
            mostrarNotificacion('error', 'Error al obtener los detalles del producto');
        } finally {
            setLoadingProducto(false);
        }
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    Detalles de Producción
                    <div className={styles.iconButton}>
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
                    title={registroActual?.user?.name || registroActual?.personal?.name || 'Usuario desconocido'}
                    description="Responsable del registro"
                    transparent={false}
                />
                <ItemView
                    title={registroActual?.producto_almacen?.name || 'Sin producto'}
                    description={`Lote: ${registroActual?.lote || '0'}`}
                    description2={`Proceso: ${registroActual?.proceso === 'cernido' ? 'Cernido' : registroActual?.proceso === 'seleccionado' ? 'Seleccionado' : registroActual?.proceso === 'ninguno' ? 'Ninguno' : registroActual?.proceso}`}
                    transparent={false}
                    circulo={false}
                    flot6={
                        registroActual?.estado === 'pendiente' ? 'Pendiente' : 
                        registroActual?.estado === 'verificado' ? 'Verificado' : 
                        registroActual?.estado === 'Ingresado' ? 'Ingresado' : 
                        registroActual?.estado || ''
                    }
                />

                {/* Información de producción */}
                <div className={styles.content}>
                    <Dato
                        label="Tiempo de Microondas"
                        value={`${registroActual?.microondas || '0'} segundos`}
                        vertical={false}
                    />
                    <Dato
                        label="Cantidad Terminados"
                        value={`${registroActual?.terminados || '0'} unidades`}
                        vertical={false}
                        especial='green'
                    />
                    <Dato
                        label="Fecha de Vencimiento"
                        value={new Date(registroActual?.vencimiento).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: '2-digit' // o 'long' si lo quieres con nombre: "octubre"
                          })}
                          
                        vertical={false}
                    />
                    <Dato
                        label="Fecha de Registro"
                        value={new Date(registroActual?.fecha).toLocaleString()}
                        vertical={false}
                    />
                </div>

                {/* Información de verificación si existe */}
                {registroActual?.fecha_verificado && (
                    <div className={styles.content}>
                        <Dato
                            label="Fecha de Verificación"
                            value={new Date(registroActual.fecha_verificado).toLocaleDateString()}
                            vertical={false}
                        />

                        <Dato
                            label="Cantidad Verificada"
                            value={`${registroActual.cantidad_verificada} unidades`}
                            vertical={false}
                            especial='blue'
                        />
                        <Dato
                            label="Cantidad Ingresada"
                            value={`${registroActual.cantidad_ingresada} unidades`}
                            vertical={false}
                            especial='green'
                        />

                    </div>
                )}

                {/* Observaciones del registro */}
                {registroActual?.observaciones && (
                    <div className={styles.content}>
                        <Dato
                            label="Observaciones"
                            value={registroActual.observaciones}
                            vertical={true}
                        />
                    </div>
                )}

                <div className={styles.buttons}>
                    {registroActual?.estado === 'pendiente' ? (
                        <>
                            <Boton
                                className='btn-default'
                                label='Verificar Producción'
                                style={{ marginTop: 'auto' }}
                                onClick={handleOpenVerificar}
                            />
                            <Boton
                                className='btn-red'
                                label='Eliminar Registro'
                                style={{ marginTop: 'auto' }}
                                onClick={() => setIsEliminarOpen(true)}
                            />
                        </>
                    ) : registroActual?.estado === 'verificado' || registroActual?.estado === 'Ingresado' ? (
                        <>
                            {(registroActual?.cantidad_ingresada || 0) < (registroActual?.cantidad_verificada || 0) && (
                                <Boton
                                    className='btn-blue'
                                    label='Ingresar Producción'
                                    style={{ marginTop: 'auto' }}
                                    onClick={handleOpenIngreso}
                                    loading={loadingProducto}
                                />
                            )}
                            {(registroActual?.cantidad_ingresada || 0) === 0 && (
                                <Boton
                                    className='btn-red'
                                    label='Anular Verificación'
                                    style={{ marginTop: 'auto' }}
                                    onClick={() => setIsAnularOpen(true)}
                                />
                            )}
                        </>
                    ) : null}
                </div>
            </div>

            {/* Modal de descarga */}
            <ModalDescarga
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                titulo="Descargar Registro de Producción"
                subtitulo="Selecciona el formato que prefieras para descargar este registro."
                nombreArchivo={`Registro_Produccion_${registroActual?.lote || '0'}_${new Date(registroActual?.fecha).toLocaleDateString().replace(/\//g, '-')}`}
                {...prepararDatosDescarga()}
            />

            {/* Modal de verificar registro */}
            <ViewModal isOpen={isVerificarOpen} setIsOpen={setIsVerificarOpen}>
                <HeaderModal
                    title="Verificar Producción"
                    onClose={() => setIsVerificarOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        Ingresa los datos de verificación para este registro de producción.
                    </p>

                    <InputNormal
                        tipo="number"
                        placeholder="Cantidad verificada"
                        value={cantidadVerificada}
                        onChange={(e) => setCantidadVerificada(e.target.value)}
                        icon="hash"
                        label="Cantidad Real Verificada"
                    />

                    <InputNormal
                        tipo="textarea"
                        placeholder="Observaciones sobre la verificación... (Opcional)"
                        value={observacionesVerificacion}
                        onChange={(e) => setObservacionesVerificacion(e.target.value)}
                        icon="comment"
                        label="Observaciones"
                    />

                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsVerificarOpen(false)}
                        />
                        <Boton
                            className='btn-original'
                            label='Verificar'
                            style={{ marginTop: 'auto' }}
                            onClick={handleVerificar}
                            loading={loading}
                        />
                    </div>
                </div>
            </ViewModal>

            {/* Modal de anular verificación */}
            <ViewModal isOpen={isAnularOpen} setIsOpen={setIsAnularOpen}>
                <HeaderModal
                    title="Anular Verificación"
                    onClose={() => setIsAnularOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas anular la verificación de este registro? Esta acción volverá el registro al estado pendiente y eliminará los datos de verificación.
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
                            label='Sí, anular verificación'
                            style={{ marginTop: 'auto' }}
                            onClick={handleAnular}
                            loading={loading}
                        />
                    </div>
                </div>
            </ViewModal>

            {/* Modal de eliminar registro */}
            <ViewModal isOpen={isEliminarOpen} setIsOpen={setIsEliminarOpen}>
                <HeaderModal
                    title="Eliminar Registro"
                    onClose={() => setIsEliminarOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas eliminar permanentemente este registro de producción? Esta acción no se puede deshacer.
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

            {/* Modal de ingreso de producción */}
            <IngresoProduccion
                isOpen={isIngresoOpen}
                setIsOpen={setIsIngresoOpen}
                producto={productoDetalle}
                cantidadVerificada={registroActual?.cantidad_verificada || 0}
                cantidadIngresada={registroActual?.cantidad_ingresada || 0}
                registroId={registroActual?.id}
                responsable={registroActual?.user?.name || registroActual?.personal?.name || 'Usuario desconocido'}
                onIngresoRealizado={(datos) => {
                    // Actualizar el registro local con los datos devueltos del backend
                    if (onRegistroVerificado) {
                        const registroActualizado = datos.registroActualizado || {
                            ...registroActual,
                            cantidad_ingresada: datos.nuevaCantidadIngresadaTotal,
                            estado: datos.nuevoEstado
                        };
                        onRegistroVerificado(registroActualizado);
                    }
                    
                    // Cerrar el modal de VerProduccion
                    setIsOpen(false);
                }}
            />

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View >
    );
}

export default VerProduccion;
