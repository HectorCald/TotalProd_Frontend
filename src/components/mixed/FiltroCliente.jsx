import React, { useState, useEffect, useCallback } from 'react';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/old/HeaderModal';
import styles from '../../styles/Inicial.module.css';
import ItemLine from '../common/old/ItemLine';
import clientService from '../../services/clientService';
import NoData from '../common/widgets/NoData';

function FiltroCliente({ isOpen, setIsOpen, onClienteSeleccionado, clienteSeleccionado = null }) {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasLoaded, setHasLoaded] = useState(false);

    const cargarClientes = useCallback(async () => {
        if (!hasLoaded) {
            setLoading(true);
        }
        setError(null);

        try {
            const response = await clientService.getAll();

            if (response.success && Array.isArray(response.data)) {
                const clientesOrdenados = [...response.data].sort((a, b) => {
                    const nameA = (a.name || '').toLowerCase();
                    const nameB = (b.name || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                });

                setClientes(clientesOrdenados);
            } else {
                setClientes([]);
                setError(response.message || 'No se pudieron obtener los clientes');
            }
        } catch (err) {
            console.error('Error cargando clientes:', err);
            setError(err.message || 'Error al cargar los clientes');
        } finally {
            setLoading(false);
            setHasLoaded(true);
        }
    }, [hasLoaded]);

    useEffect(() => {
        cargarClientes();
    }, [cargarClientes]);

    useEffect(() => {
        if (isOpen) {
            cargarClientes();
        }
    }, [isOpen, cargarClientes]);

    const handleSeleccionar = (cliente) => {
        onClienteSeleccionado(cliente);
        setIsOpen(false);
    };

    const handleLimpiar = () => {
        onClienteSeleccionado(null);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Filtrar por Cliente"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona el cliente de los movimientos a mostrar</p>

                {loading && (
                    <NoData
                        icon="loader-alt"
                        title="Cargando clientes"
                        detail="Estamos obteniendo la lista de clientes"
                        transparent={true}
                    />
                )}

                {error && !loading && (
                    <div className={styles.error}>
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        <ItemLine
                            title="Todos los clientes"
                            icon="user-pin"
                            onClick={handleLimpiar}
                        />

                        {clientes.map((cliente) => (
                            <ItemLine
                                key={cliente.id}
                                title={cliente.name || 'Cliente sin nombre'}
                                icon="user"
                                onClick={() => handleSeleccionar(cliente)}
                            />
                        ))}

                        {clientes.length === 0 && (
                            <div className={styles.noData}>
                                <p>No se encontraron clientes</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </ViewModal>
    );
}

export default FiltroCliente;


