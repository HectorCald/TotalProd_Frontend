import React, { useState, useEffect } from 'react';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/HeaderModal';
import styles from '../../styles/Inicial.module.css';
import ItemLine from '../common/ItemLine';
import pedidosAcopioService from '../../services/pedidosAcopioService';
import pedidosAlmacenService from '../../services/pedidosAlmacenService';
import NoData from '../common/NoData';

function FiltroSolicitante({ isOpen, setIsOpen, onSolicitanteSeleccionado, solicitanteSeleccionado, tipoPedido = '' }) {
    const [solicitantes, setSolicitantes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cargar solicitantes solo la primera vez
    useEffect(() => {
        if (solicitantes.length === 0) {
            cargarSolicitantes(false);
        }
    }, []);

    // Refrescar solicitantes en silencio cuando el modal se abra, sin bloquear la UI
    useEffect(() => {
        if (isOpen) {
            cargarSolicitantes(true);
        }
    }, [isOpen, tipoPedido]);

    const cargarSolicitantes = async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);
        
        try {
            const service = tipoPedido === 'acopio' ? pedidosAcopioService : pedidosAlmacenService;
            const response = await service.getSolicitantesUnicos();
            
            if (response.success && response.data) {
                setSolicitantes(response.data);
            } else {
                setError(response.message || 'Error al obtener los solicitantes');
                if (!silent) {
                    setSolicitantes([]);
                }
            }
        } catch (error) {
            console.error('❌ Error cargando solicitantes:', error);
            setError('Error al cargar los solicitantes');
            if (!silent) {
                setSolicitantes([]);
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleSeleccionar = (solicitante) => {
        onSolicitanteSeleccionado(solicitante);
        setIsOpen(false);
    };

    const handleLimpiar = () => {
        onSolicitanteSeleccionado(null);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Filtrar por Solicitante"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona el solicitante de los registros a mostrar</p>

                {loading ? (
                    <NoData
                        icon="loader-alt"
                        title="Cargando solicitantes..."
                        detail="Por favor espera"
                        transparent={true}
                        minHeight="200px"
                    />
                ) : error ? (
                    <NoData
                        icon="error"
                        title="Error"
                        detail={error}
                        transparent={true}
                        minHeight="200px"
                        isError={true}
                    />
                ) : (
                    <>
                        {/* Opción para mostrar todos */}
                        <ItemLine
                            title="Todos los solicitantes"
                            icon="user"
                            onClick={handleLimpiar}
                        />

                        {solicitantes.length > 0 ? (
                            solicitantes.map((solicitante) => (
                                <ItemLine
                                    key={`${solicitante.tipo}-${solicitante.id}`}
                                    title={solicitante.name}
                                    icon={solicitante.tipo === 'personal' ? 'user' : 'user-circle'}
                                    onClick={() => handleSeleccionar(solicitante)}
                                />
                            ))
                        ) : (
                            <NoData
                                icon="user"
                                title="No se encontraron solicitantes"
                                detail="No hay solicitantes disponibles"
                                transparent={true}
                                minHeight="200px"
                            />
                        )}
                    </>
                )}
            </div>
        </ViewModal>
    );
}

export default FiltroSolicitante;

