import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../../styles/Inicial.module.css';
import HeaderView from '../../../common/HeaderView';
import View from '../../../ui/View';
import ItemView from '../../../common/ItemView';
import Boton from '../../../common/Boton';
import LoadingSpinner from '../../../common/LoadingSpinner';
import { useLayout } from '../../../../context/LayoutContext';
import Table from '../../../common/Table';
import NoData from '../../../common/NoData';
import PullToRefresh from '../../../common/PullToRefresh';
import RefreshIndicator from '../../../common/RefreshIndicator';
import ReglasMedio from './ReglasMedio';

function Reglas({ isOpen, setIsOpen }) {
    const { isLargeScreen } = useLayout();

    // Estados para reglas
    const [reglas, setReglas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para RefreshIndicator (solo PC)
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);

    // Estado para el modal de nueva regla
    const [isOpenReglasMedio, setIsOpenReglasMedio] = useState(false);

    // Función para simular carga de datos con delay
    const cargarReglas = useCallback(async () => {
        setIsLoading(true);
        
        // Incrementar contador de peticiones activas
        setActiveRequests(prev => {
            const newCount = prev + 1;
            if (isLargeScreen && newCount > 0) {
                setShowRefreshIndicator(true);
                setIsRefreshing(true);
            }
            return newCount;
        });

        try {
            // Simular delay de 1 segundo
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simular datos vacíos por ahora
            setReglas([]);
            setError(null);
        } catch (e) {
            setError(e);
        } finally {
            setIsLoading(false);
            
            // Decrementar contador de peticiones activas
            setActiveRequests(prev => {
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
        }
    }, [isLargeScreen]);

    // Cargar datos cuando se abre
    useEffect(() => {
        if (isOpen) {
            cargarReglas();
        }
    }, [isOpen, cargarReglas]);

    // Función para manejar refresh
    const handleRefresh = async () => {
        await cargarReglas();
    };

    // Headers para la tabla
    const tableHeaders = [
        { key: 'nombre', label: 'Nombre', icon: 'file' },
        { key: 'tipo', label: 'Tipo', icon: 'category' },
        { key: 'descripcion', label: 'Descripción', icon: 'comment' },
    ];

    // Datos para la tabla
    const tableData = reglas.map(regla => ({
        id: regla.id,
        nombre: regla.nombre || 'Sin nombre',
        tipo: regla.tipo || '--',
        descripcion: regla.descripcion || '--',
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
                                    onRowClick={(regla) => {
                                        // Por ahora no hacer nada
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
                                    title={regla.nombre || 'Sin nombre'}
                                    description={regla.descripcion || 'Sin descripción'}
                                    arrow={true}
                                    onClick={() => {
                                        // Por ahora no hacer nada
                                    }}
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
            />
        </View>
    );
}

export default Reglas;

