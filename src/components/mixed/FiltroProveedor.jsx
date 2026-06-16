import React, { useState, useEffect, useCallback } from 'react';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/old/HeaderModal';
import styles from '../../styles/Inicial.module.css';
import ItemLine from '../common/old/ItemLine';
import proveedorService from '../../services/proveedorService';
import NoData from '../common/widgets/NoData';

function FiltroProveedor({ isOpen, setIsOpen, onProveedorSeleccionado, proveedorSeleccionado = null }) {
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasLoaded, setHasLoaded] = useState(false);

    const cargarProveedores = useCallback(async () => {
        if (!hasLoaded) {
            setLoading(true);
        }
        setError(null);

        try {
            const response = await proveedorService.getAll();

            if (response.success && Array.isArray(response.data)) {
                const proveedoresOrdenados = [...response.data].sort((a, b) => {
                    const nameA = (a.name || '').toLowerCase();
                    const nameB = (b.name || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                });

                setProveedores(proveedoresOrdenados);
            } else {
                setProveedores([]);
                setError(response.message || 'No se pudieron obtener los proveedores');
            }
        } catch (err) {
            console.error('Error cargando proveedores:', err);
            setError(err.message || 'Error al cargar los proveedores');
            setProveedores([]);
        } finally {
            setLoading(false);
            setHasLoaded(true);
        }
    }, [hasLoaded]);

    useEffect(() => {
        cargarProveedores();
    }, [cargarProveedores]);

    useEffect(() => {
        if (isOpen) {
            cargarProveedores();
        }
    }, [isOpen, cargarProveedores]);

    const handleSeleccionar = (proveedor) => {
        onProveedorSeleccionado(proveedor);
        setIsOpen(false);
    };

    const handleLimpiar = () => {
        onProveedorSeleccionado(null);
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Filtrar por Proveedor"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Selecciona el proveedor de los gastos a mostrar</p>

                {loading && (
                    <NoData
                        icon="loader-alt"
                        title="Cargando proveedores"
                        detail="Estamos obteniendo la lista de proveedores"
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
                            title="Todos los proveedores"
                            icon="user-pin"
                            onClick={handleLimpiar}
                        />

                        {proveedores.map((proveedor) => (
                            <ItemLine
                                key={proveedor.id}
                                title={proveedor.name || 'Proveedor sin nombre'}
                                icon="user"
                                onClick={() => handleSeleccionar(proveedor)}
                            />
                        ))}

                        {proveedores.length === 0 && (
                            <div className={styles.noData}>
                                <p>No se encontraron proveedores</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </ViewModal>
    );
}

export default FiltroProveedor;

