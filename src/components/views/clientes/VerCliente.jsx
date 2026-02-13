import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import HeaderModal from '../../common/HeaderModal';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import Dato from '../../common/Dato';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import { useToast } from '../../../context/ToastContext';
import { useLayout } from '../../../context/LayoutContext';
import FetchData from '../../mixed/FetchData';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import clientService from '../../../services/clientService';
import ItemView from '../../common/ItemView';
import MapaModal from './MapaModal';
import MapPin from './MapPin';
import VerMovimiento from '../movimientos/VerMovimiento';
import NoData from '../../common/NoData';
import LoadingSpinner from '../../common/LoadingSpinner';
import ModalEliminar from './modales/ModalEliminar';
import Skeleton from '../../common/Skeleton';

function VerCliente({ isOpen, setIsOpen, usuario, onClientDeleted, onClientUpdated }) {
    const { showInfo } = useToast();
    const { isLargeScreen } = useLayout();
    // Estados para los modales
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isMovimientosOpen, setIsMovimientosOpen] = useState(false);
    const [isVerMovimientoOpen, setIsVerMovimientoOpen] = useState(false);
    const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);

    // Estados para el mapa
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    // Estados para movimientos
    const [movimientos, setMovimientos] = useState([]);
    const [loadingMovimientosList, setLoadingMovimientosList] = useState(false);

    // Estado para datos de ubicación del mapa
    const [locationData, setLocationData] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);

    // Ubicación resuelta: tabla clients o último movimiento (se obtiene al abrir VerCliente)
    const [ubicacionResuelta, setUbicacionResuelta] = useState(null);
    const [loadingUbicacion, setLoadingUbicacion] = useState(false);
    // Función para manejar el click en un movimiento
    const handleMovimientoClick = (movimiento) => {
        setMovimientoSeleccionado(movimiento);
        // Cerrar el modal de movimientos para que VerMovimiento quede visible al frente
        setIsMovimientosOpen(false);
        setIsVerMovimientoOpen(true);
    }

    // Callbacks para FetchData
    const handleMovimientosLoaded = useCallback((data) => {
        // Limitar a los últimos 10 movimientos
        const limitedMovements = (data || []).slice(0, 10);
        setMovimientos(limitedMovements);
    }, []);

    const handleLoading = useCallback((isLoading) => {
        setLoadingMovimientosList(isLoading);
    }, []);

    // Resetear movimientos y ubicación cuando cambia el cliente; iniciar en loading para mostrar spinner desde el principio
    useEffect(() => {
        setMovimientos([]);
        setLocationData(null);
        setLoadingLocation(false);
        setUbicacionResuelta(null);
        setLoadingUbicacion(Boolean(usuario?.id));
    }, [usuario?.id]);

    // Al abrir VerCliente, obtener ubicación (tabla clients o último movimiento)
    useEffect(() => {
        if (!isOpen || !usuario?.id) return;

        setLoadingUbicacion(true);
        clientService
            .getLocation(usuario.id)
            .then((res) => {
                const loc = res?.success && res?.data ? res.data.location : null;
                setUbicacionResuelta(loc ?? null);
            })
            .catch(() => setUbicacionResuelta(null))
            .finally(() => setLoadingUbicacion(false));
    }, [isOpen, usuario?.id]);


    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>DETALLES</h1>
                </div>
                <div className={styles.contentRow}>
                    <div className={styles.contentHalf}>
                        <div className={styles.content}>
                            <ItemView
                                title="Información del Cliente"
                                transparent={true}
                                icon="user"
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                            />
                            <Dato label="Nombre" value={usuario?.name || 'N/A'} vertical={false} />
                            <Dato label="Celular" value={usuario?.phone || 'N/A'} vertical={false} />
                            <Dato label="Descripción" value={usuario?.description || 'Sin descripción'} vertical={false} />
                            <Dato label="Total de pedidos" value={usuario?.total_orders || '0'} vertical={false} />
                            {(loadingUbicacion || ubicacionResuelta) && (
                                <>
                                    {loadingUbicacion ? (
                                        <>
                                            <Skeleton width="100%" height="25px" />
                                            <Skeleton width="100%" height="25px" />
                                            <Skeleton width="100%" height="25px" />
                                        </>
                                    ) : loadingLocation ? (
                                        <>
                                            <Skeleton width="100%" height="25px" />
                                            <Skeleton width="100%" height="25px" />
                                            <Skeleton width="100%" height="25px" />
                                        </>
                                    ) : (
                                        <>
                                            <Dato
                                                label="País"
                                                value={
                                                    locationData?.pais && locationData?.ciudad
                                                        ? `${locationData.pais} - ${locationData.ciudad}`
                                                        : locationData?.pais || locationData?.ciudad || '--'
                                                }
                                                vertical={false}
                                            />
                                            <Dato label="Ciudad" value={locationData?.ciudad || '--'} vertical={false} />
                                            <Dato label="Dirección" value={locationData?.direccion || locationData?.address || '--'} vertical={!isLargeScreen} />
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                        {/* Botón para ver movimientos */}
                        <Boton
                            className='btn-gray'
                            label='Movimientos'
                            onClick={() => setIsMovimientosOpen(true)}
                        />
                    </div>
                    <div className={styles.contentHalf}>
                        <div className={styles.content} style={{ height: '100%', minHeight: '100%' }}>
                            {loadingUbicacion ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', minHeight: '200px' }}>
                                    <LoadingSpinner />
                                </div>
                            ) : !ubicacionResuelta ? (
                                <NoData
                                    icon="map"
                                    title="No hay ubicación"
                                    detail="Este cliente no tiene ubicación registrada ni en movimientos recientes"
                                    transparent={false}
                                    minHeight="200px"
                                />
                            ) : (
                                <MapPin 
                                    initialLocation={ubicacionResuelta} 
                                    onLocationData={setLocationData}
                                    onLoadingChange={setLoadingLocation}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Editar Cliente'
                        onClick={() => setIsEditOpen(true)}
                        iconName='edit'
                        hideTextOnMobile={true}
                    />
                    <Boton
                        className='btn-red'
                        label='Eliminar Cliente'
                        onClick={() => setIsDeleteOpen(true)}
                        iconName='trash'
                        hideTextOnMobile={true}
                    />

                </div>
            </div>

            {/* Modal de Editar*/}
            <EditarAgregar
                isOpen={isEditOpen}
                setIsOpen={setIsEditOpen}
                usuario={usuario}
                tipo='editar'
                onClientUpdated={onClientUpdated}
            />

            {/* Modal de Eliminar*/}
            <ModalEliminar
                isOpen={isDeleteOpen}
                setIsOpen={setIsDeleteOpen}
                cliente={usuario}
                setIsOpenVerCliente={setIsOpen}
                onClienteEliminado={onClientDeleted}
            />

            {/* Modal de Mapa*/}
            <MapaModal
                isOpen={isMapModalOpen}
                setIsOpen={setIsMapModalOpen}
                initialLocation={ubicacionResuelta}
                readOnly={true}
            />

            {/* Modal de movimientos */}
            <ViewModal isOpen={isMovimientosOpen} setIsOpen={setIsMovimientosOpen}>
                <HeaderModal
                    title="Movimientos del Cliente"
                    onClose={() => setIsMovimientosOpen(false)}
                />
                <div className={styles.modalContent}>
                    {loadingMovimientosList ? (
                        <NoData
                            icon="loader-alt"
                            title="Cargando movimientos..."
                            detail="Obteniendo el historial de movimientos del cliente"
                            transparent={true}
                            minHeight="150px"
                        />
                    ) : movimientos.length > 0 ? (
                        <>
                            <p className={styles.subTitle}>HISTORIAL DE MOVIMIENTOS</p>
                            {movimientos.map((movimiento, index) => (
                                <ItemView
                                    key={movimiento.id || index}
                                    title={movimiento.productos && movimiento.productos.length > 0
                                        ? movimiento.productos.length === 1
                                            ? `${movimiento.productos[0]?.producto?.name || 'Sin producto'} - ${movimiento.productos[0]?.cantidad || '0'} ud`
                                            : `${movimiento.productos.length} productos`
                                        : 'Sin productos'
                                    }
                                    description={`${movimiento.observaciones || 'Sin observaciones'} • ${new Date(movimiento.fecha).toLocaleDateString()}`}
                                    icon={movimiento.type === 'entrada' ? 'plus-circle' : 'minus-circle'}
                                    onClick={() => handleMovimientoClick(movimiento)}
                                    arrow={false}
                                    flot3={movimiento?.estado === 'anulado' ? 'Anulado' : ''}
                                    flot1={movimiento?.estado === 'anulado' ? '' : 'Finalizado'}
                                    colorIcon={movimiento.type === 'entrada' ? 'verde' : 'rojo'}
                                />
                            ))}
                        </>
                    ) : (
                        <NoData
                            icon="history"
                            title="No hay movimientos"
                            detail="Este cliente no tiene movimientos registrados aún"
                            transparent={false}
                            minHeight="150px"
                        />
                    )}
                </div>
            </ViewModal>

            {/* FetchData para movimientos - solo cuando se abre el modal */}
            {isMovimientosOpen && usuario?.id && (
                <FetchData
                    service={movimientosAlmacenService}
                    serviceName="movimientosAlmacenService"
                    method="getByCliente"
                    methodParams={[usuario.id]}
                    isOpen={isMovimientosOpen}
                    onDataLoaded={handleMovimientosLoaded}
                    onLoadingStart={() => handleLoading(true)}
                    onLoadingEnd={() => handleLoading(false)}
                />
            )}

            {/* Modal de Ver Movimiento */}
            <VerMovimiento
                isOpen={isVerMovimientoOpen}
                setIsOpen={setIsVerMovimientoOpen}
                movimiento={movimientoSeleccionado}
            />
        </View>
    );
}
export default VerCliente;