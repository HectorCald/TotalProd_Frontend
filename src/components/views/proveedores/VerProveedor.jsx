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
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import ItemView from '../../common/ItemView';
import ItemLine from '../../common/ItemLine';
import MapaModal from '../clientes/MapaModal';
import MapPin from '../clientes/MapPin';
import NoData from '../../common/NoData';
import ModalEliminar from './modales/ModalEliminar';
import Skeleton from '../../common/Skeleton';

function VerProveedor({ isOpen, setIsOpen, usuario, onProveedorDeleted, onProveedorUpdated }) {
    const { showInfo } = useToast();
    const { isLargeScreen } = useLayout();

    // Estados para los modales
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isMovimientosOpen, setIsMovimientosOpen] = useState(false);

    // Estados para el mapa
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    // Estados para movimientos
    const [movimientos, setMovimientos] = useState([]);
    const [loadingMovimientosList, setLoadingMovimientosList] = useState(false);

    // Estado para datos de ubicación del mapa
    const [locationData, setLocationData] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);

    const handleOpenMap = () => {
        if (usuario.location) {
            setIsMapModalOpen(true);
        } else {
            showInfo('Información', 'No hay ubicación para mostrar');
        }
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

    // Resetear movimientos cuando cambia el proveedor
    useEffect(() => {
        setMovimientos([]);
        setLocationData(null); // Resetear datos de ubicación cuando cambia el proveedor
        setLoadingLocation(false);
    }, [usuario?.id]);

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Detalles</h1>
                </div>
                <div className={styles.contentRow}>
                    <div className={styles.contentHalf}>
                        <div className={styles.content}>
                            <ItemView
                                title="Información del Proveedor"
                                transparent={true}
                                icon="user"
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                            />
                            <Dato label="Nombre" value={usuario?.name || 'N/A'} vertical={false} />
                            <Dato label="Celular" value={usuario?.phone || 'N/A'} vertical={false} />
                            <Dato label="Descripción" value={usuario?.description || 'Sin descripción'} vertical={false} />
                            <Dato label="Total de pedidos" value={usuario?.total_orders || '0'} vertical={false} />
                            {usuario?.location && (
                                <>
                                    {loadingLocation ? (
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
                        <div className={styles.content}>
                            <MapPin 
                                initialLocation={usuario?.location || null} 
                                onLocationData={setLocationData}
                                onLoadingChange={setLoadingLocation}
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Editar Proveedor'
                        onClick={() => setIsEditOpen(true)}
                        iconName='edit'
                        hideTextOnMobile={true}
                    />
                    <Boton
                        className='btn-red'
                        label='Eliminar Proveedor'
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
                onProveedorUpdated={onProveedorUpdated}
            />

            {/* Modal de Eliminar*/}
            <ModalEliminar
                isOpen={isDeleteOpen}
                setIsOpen={setIsDeleteOpen}
                proveedor={usuario}
                setIsOpenVerProveedor={setIsOpen}
                onProveedorEliminado={onProveedorDeleted}
            />

            {/* Modal de Mapa*/}
            <MapaModal
                isOpen={isMapModalOpen}
                setIsOpen={setIsMapModalOpen}
                initialLocation={usuario?.location}
                readOnly={true}
            />

            {/* Modal de movimientos */}
            <ViewModal isOpen={isMovimientosOpen} setIsOpen={setIsMovimientosOpen}>
                <HeaderModal
                    title="Movimientos del Proveedor"
                    onClose={() => setIsMovimientosOpen(false)}
                />
                <div className={styles.modalContent}>
                    {loadingMovimientosList ? (
                        <NoData 
                            icon="loader-alt"
                            title="Cargando movimientos..."
                            detail="Obteniendo el historial de movimientos del proveedor"
                            transparent={true}
                            minHeight="150px"
                        />
                    ) : movimientos.length > 0 ? (
                        <>
                            <p className={styles.subTitle}>HISTORIAL DE MOVIMIENTOS</p>
                            {movimientos.map((movimiento, index) => (
                                <ItemView
                                    key={movimiento.id || index}
                                    title={`${movimiento.type === 'entrada' ? 'Entrada' : 'Salida'} - ${movimiento.quantity} ${movimiento.product?.type_measure?.code || ''}`}
                                    description={
                                        <div>
                                            <div>{movimiento.observations || 'Sin observaciones'}</div>
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                                {new Date(movimiento.date).toLocaleDateString()}
                                                {movimiento.product?.name && ` • ${movimiento.product.name}`}
                                            </div>
                                        </div>
                                    }
                                    icon={movimiento.type === 'entrada' ? 'plus-circle' : 'minus-circle'}
                                    arrow={false}
                                />
                            ))}
                        </>
                    ) : (
                        <NoData 
                            icon="history"
                            title="No hay movimientos"
                            detail="Este proveedor no tiene movimientos registrados aún"
                            transparent={false}
                            minHeight="150px"
                        />
                    )}
                </div>
            </ViewModal>

            {/* FetchData para movimientos */}
            {isOpen && usuario?.id && (
                <FetchData
                    service={movimientosAcopioService}
                    serviceName="movimientosAcopioService"
                    method="getByProveedor"
                    methodParams={[usuario.id]}
                    isOpen={isOpen}
                    onDataLoaded={handleMovimientosLoaded}
                    onLoadingStart={() => handleLoading(true)}
                    onLoadingEnd={() => handleLoading(false)}
                />
            )}

        </View>
    );
}
export default VerProveedor;