import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemView from '../../common/ItemView';
import sucursalesService from '../../../services/sucursalesService';
import { useUser } from '../../../context/UserContext';
import { useLayout } from '../../../context/LayoutContext';
import NoData from '../../common/NoData';

function SeleccionarSucursal({ isOpen, setIsOpen, empresaId, onSucursalSeleccionada }) {
    const { seleccionarSucursal, sucursalSeleccionada } = useUser();
    const { isLargeScreen } = useLayout();
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // No permitir cerrar si no hay sucursal seleccionada
    const closed = !sucursalSeleccionada;

    useEffect(() => {
        if (isOpen && empresaId) {
            cargarSucursales();
        }
    }, [isOpen, empresaId]);

    // Auto-seleccionar si solo hay una sucursal Y no hay sucursal seleccionada previamente
    useEffect(() => {
        if (sucursales.length === 1 && !loading && isOpen && !error && !sucursalSeleccionada) {
            // Auto-seleccionar la única sucursal disponible sin mostrar el modal y sin refresh
            const sucursal = sucursales[0];
            seleccionarSucursal(sucursal);
            
            // Notificar al componente padre
            if (onSucursalSeleccionada) {
                onSucursalSeleccionada(sucursal);
            }
            
            // Cerrar modal
            setIsOpen(false);
            // NO hacer refresh cuando es auto-selección
        }
    }, [sucursales, loading, isOpen, error, sucursalSeleccionada]);

    const cargarSucursales = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await sucursalesService.getByEmpresaId(empresaId);
            
            if (response.success) {
                setSucursales(response.data);
            } else {
                setError('Error al cargar las sucursales');
            }
        } catch (error) {
            console.error('Error al cargar sucursales:', error);
            setError('Error al cargar las sucursales');
        } finally {
            setLoading(false);
        }
    };

    const handleSeleccionarSucursal = (sucursal) => {
        // Guardar sucursal seleccionada en el contexto global
        seleccionarSucursal(sucursal);
        
        // Notificar al componente padre
        if (onSucursalSeleccionada) {
            onSucursalSeleccionada(sucursal);
        }
        
        // Cerrar modal
        setIsOpen(false);
        
        // Recargar la página cuando es selección manual desde el modal
        // La auto-selección (solo 1 sucursal sin selección previa) no hace refresh
        window.location.reload();
    };

    // No mostrar el modal si solo hay una sucursal Y no hay sucursal seleccionada (se auto-selecciona)
    // Si hay sucursal seleccionada, mostrar el modal aunque sea solo una (apertura manual)
    if (!isOpen || (sucursales.length === 1 && !loading && !error && !sucursalSeleccionada)) return null;

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen} closed={closed}>
            <HeaderModal
                title="Seleccionar Sucursal"
                onClose={() => setIsOpen(false)}
                closed={closed}
            />
            <div className={styles.modalContent}>
                {loading ? (
                    <NoData 
                        icon="loader-alt"
                        title="Cargando sucursales..."
                        detail="Obteniendo todas las sucursales disponibles"
                        transparent={true}
                        minHeight="150px"
                    />
                ) : error ? (
                    <div className={styles.errorContainer}>
                        <p className={styles.errorText}>{error}</p>
                        <button 
                            className={styles.retryButton}
                            onClick={cargarSucursales}
                        >
                            Reintentar
                        </button>
                    </div>
                ) : sucursales.length === 0 ? (
                    <NoData 
                        icon="store"
                        title="Sin sucursales"
                        detail="No hay sucursales disponibles para seleccionar"
                        transparent={false}
                        minHeight="150px"
                    />
                ) : (
                    <div className={styles.sucursalesList}>
                        {sucursales.map((sucursal) => (
                            <ItemView
                                key={sucursal.id}
                                icon="building"
                                title={sucursal.name}
                                subtitle={`Empresa: ${sucursal.empresas?.name || 'N/A'}`}
                                onClick={() => handleSeleccionarSucursal(sucursal)}
                                transparent={false}
                            />
                        ))}
                    </div>
                )}
            </div>
        </ViewModal>
    );
}

export default SeleccionarSucursal;
