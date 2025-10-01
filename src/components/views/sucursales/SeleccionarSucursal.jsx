import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemView from '../../common/ItemView';
import sucursalesService from '../../../services/sucursalesService';
import { useUser } from '../../../context/UserContext';

function SeleccionarSucursal({ isOpen, setIsOpen, empresaId, onSucursalSeleccionada, canClose = true }) {
    const { seleccionarSucursal } = useUser();
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && empresaId) {
            cargarSucursales();
        }
    }, [isOpen, empresaId]);

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
    };

    if (!isOpen) return null;

    return (
        <ViewModal isOpen={isOpen} setIsOpen={canClose ? setIsOpen : () => {}}>
            <HeaderModal
                title="Seleccionar Sucursal"
                onClose={canClose ? () => setIsOpen(false) : undefined}
            />
            <div className={styles.modalContent}>
                {loading ? (
                    <div className={styles.noData}>
                        <p>Cargando sucursales...</p>
                    </div>
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
                    <div className={styles.noData}>
                        <p>No hay sucursales disponibles</p>
                    </div>
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
