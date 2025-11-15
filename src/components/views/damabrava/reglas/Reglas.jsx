import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../../styles/Inicial.module.css';
import HeaderView from '../../../common/HeaderView';
import View from '../../../ui/View';
import Boton from '../../../common/Boton';
import ItemView from '../../../common/ItemView';
import LoadingSpinner from '../../../common/LoadingSpinner';
import { useLayout } from '../../../../context/LayoutContext';
import Table from '../../../common/Table';
import NoData from '../../../common/NoData';
import PullToRefresh from '../../../common/PullToRefresh';
import RefreshIndicator from '../../../common/RefreshIndicator';
import ReglasMedio from './ReglasMedio';
import Notification from '../../../common/Notification';
import FetchData from '../../../mixed/FetchData';
import reglasProduccionDamabravaService from '../../../../services/reglasProduccionDamabravaService';
import VerRegla from './VerRegla';
import useSessionCache from '../../../../hooks/useSessionCache';

function Reglas({ isOpen, setIsOpen }) {
    const { isLargeScreen } = useLayout();

    // Estados para reglas (persistidos en sesión)
    const {
        value: reglas,
        setValue: setReglas,
    } = useSessionCache({
        key: 'reglasDamabrava',
        defaultValue: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para RefreshIndicator (solo PC)
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);

    // Estado para el modal de nueva regla
    const [isOpenReglasMedio, setIsOpenReglasMedio] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });
    const [isVerReglaOpen, setIsVerReglaOpen] = useState(false);
    const [reglaSeleccionada, setReglaSeleccionada] = useState(null);

    const mostrarNotificacion = (type, text) => {
        setNotification({
            isVisible: true,
            type,
            text
        });

        setTimeout(() => {
            setNotification((prev) => ({
                ...prev,
                isVisible: false
            }));
        }, 3000);
    };

    const handleReglasLoaded = useCallback((data) => {
        setReglas(Array.isArray(data) ? data : []);
        setError(null);
    }, []);

    const handleError = useCallback((err) => {
        console.error('Error cargando reglas:', err);
        setError(err);
    }, []);

    const handleLoadingStart = useCallback(() => {
        if (reglas.length === 0) {
            setIsLoading(true);
        }
        setActiveRequests((prev) => {
            const newCount = prev + 1;
            if (isLargeScreen && newCount > 0) {
                setShowRefreshIndicator(true);
                setIsRefreshing(true);
            }
            return newCount;
        });
    }, [reglas.length, isLargeScreen]);

    const handleLoadingEnd = useCallback(() => {
        setIsLoading(false);
        setActiveRequests((prev) => {
            const newCount = Math.max(0, prev - 1);
            if (newCount === 0 && isLargeScreen) {
                setTimeout(() => {
                    setIsRefreshing(false);
                    setTimeout(() => {
                        setShowRefreshIndicator(false);
                    }, 500);
                }, 300);
            }
            return newCount;
        });
    }, [isLargeScreen]);

    useEffect(() => {
        if (!isOpen) {
            setNotification((prev) => ({ ...prev, isVisible: false }));
        }
    }, [isOpen]);

    const handleRefresh = async () => {
        try {
            const response = await reglasProduccionDamabravaService.getAll();
            if (response.success) {
                handleReglasLoaded(response.data);
            }
        } catch (refreshError) {
            console.error('Error al refrescar reglas:', refreshError);
        }
    };

    const handleReglaRegistrada = (nuevaRegla) => {
        if (nuevaRegla) {
            setReglas((prev) => [nuevaRegla, ...prev]);
        }
        setReloadToken((prev) => prev + 1);
        mostrarNotificacion('success', 'Regla registrada correctamente.');
    };

    const handleReglaEliminada = (reglaId) => {
        if (!reglaId) return;
        setReglas((prev) => prev.filter((regla) => regla.id !== reglaId));
        setIsVerReglaOpen(false);
        setReglaSeleccionada(null);
        mostrarNotificacion('success', 'Regla eliminada correctamente.');
    };

    // Headers para la tabla
    const tableHeaders = [
        { key: 'nombre', label: 'Nombre', icon: 'file' },
        { key: 'tipo', label: 'Tipo', icon: 'category' },
        { key: 'detalle', label: 'Detalle', icon: 'comment' },
    ];

    const obtenerTipoRegla = (regla) => {
        if (regla.general === true) return 'General';
        if (regla.general === false) return 'Especial';
        return 'Por gramaje';
    };

    const obtenerNombreRegla = (regla) => {
        if (regla.general === true) return 'Regla general';
        if (regla.general === false) {
            return regla.producto_almacen?.name || 'Regla especial';
        }
        return 'Regla por gramaje';
    };

    const obtenerDetalleRegla = (regla) => {
        if (regla.general === true) {
            return 'Aplica a todos los productos';
        }
        if (regla.general === false) {
            return regla.contiene || 'Aplicación específica';
        }
        return `Gramaje: ${regla.desde_gramaje ?? '--'} - ${regla.hasta_gramaje ?? '--'}`;
    };

    // Datos para la tabla
    const tableData = reglas.map(regla => ({
        id: regla.id,
        nombre: obtenerNombreRegla(regla),
        tipo: obtenerTipoRegla(regla),
        detalle: obtenerDetalleRegla(regla),
    }));

    return (
        <View
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            isMainView={true}
        >
            <HeaderView
                onBack={() => setIsOpen(false)}
                showSearch={false}
                title="Reglas"
            />
            <div className={styles.container}>
                {isLoading ? (
                    <LoadingSpinner />
                ) : isLargeScreen ? (
                    <>
                        <div className={styles.titleContainer}>
                            <RefreshIndicator
                                isVisible={showRefreshIndicator}
                                isLoading={isRefreshing}
                            />
                        </div>
                        <div className={styles.content}
                        style={
                            {
                                maxHeight: 'calc(100% - 80px)',
                                minHeight: 'calc(100% - 80px)'
                            }
                        }>
                            {reglas.length > 0 ? (
                                <Table
                                    headers={tableHeaders}
                                    data={tableData}
                                    onRowClick={(reglaRow) => {
                                        const reglaOriginal = reglas.find((r) => r.id === reglaRow.id);
                                        if (reglaOriginal) {
                                            setReglaSeleccionada(reglaOriginal);
                                            setIsVerReglaOpen(true);
                                        }
                                    }}
                                />
                            ) : (
                                <NoData
                                    icon="file"
                                    title="No hay reglas"
                                    detail="Crea nuevas reglas para comenzar a gestionar tus reglas de producción"
                                    transparent={true}
                                    minHeight="200px"
                                />
                            )}
                        </div>
                    </>
                ) : (
                    <PullToRefresh
                        onRefresh={handleRefresh}
                        screenName="Reglas"
                        containerStyle={{
                            maxHeight: 'calc(100% - 80px)',
                            minHeight: 'calc(100% - 80px)'
                        }}
                    >
                        {reglas.length > 0 ? (
                            reglas.map((regla, index) => (
                                <ItemView
                                    key={regla.id || index}
                                    title={obtenerNombreRegla(regla)}
                                    description={obtenerDetalleRegla(regla)}
                                    description2={obtenerTipoRegla(regla)}
                                    arrow={true}
                                    onClick={() => {
                                        setReglaSeleccionada(regla);
                                        setIsVerReglaOpen(true);
                                    }}
                                    icon='book'
                                />
                            ))
                        ) : (
                            <NoData
                                icon="file"
                                title="No hay reglas"
                                detail="Crea nuevas reglas para comenzar a gestionar tus reglas de producción"
                                transparent={true}
                                minHeight="200px"
                            />
                        )}
                    </PullToRefresh>
                )}
                <div className={styles.buttonFooter}>
                    <Boton
                        className='btn-original'
                        label='Nueva regla'
                        onClick={() => setIsOpenReglasMedio(true)}
                    />
                </div>
            </div>

            {/* Modal de ReglasMedio */}
            <ReglasMedio
                isOpen={isOpenReglasMedio}
                setIsOpen={setIsOpenReglasMedio}
                onReglaRegistrada={handleReglaRegistrada}
            />
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
            <VerRegla
                isOpen={isVerReglaOpen}
                setIsOpen={setIsVerReglaOpen}
                regla={reglaSeleccionada}
                onReglaEliminada={handleReglaEliminada}
            />
            {isOpen && (
                <FetchData
                    service={reglasProduccionDamabravaService}
                    serviceName="reglasProduccionDamabravaService"
                    isOpen={isOpen}
                    methodParams={[reloadToken]}
                    onDataLoaded={handleReglasLoaded}
                    onLoadingStart={handleLoadingStart}
                    onLoadingEnd={handleLoadingEnd}
                    onError={handleError}
                />
            )}
        </View>
    );
}

export default Reglas;

