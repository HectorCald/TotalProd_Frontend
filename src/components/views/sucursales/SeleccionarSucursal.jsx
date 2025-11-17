import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemView from '../../common/ItemView';
import sucursalesService from '../../../services/sucursalesService';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';
import NoData from '../../common/NoData';

function SeleccionarSucursal({ isOpen, setIsOpen, empresaId, onSucursalSeleccionada, canClose = false }) {
    const { seleccionarSucursal: seleccionarSucursalUsuario, sucursalSeleccionada: sucursalSeleccionadaUsuario } = useUser();
    const { seleccionarSucursal: seleccionarSucursalEmpleado, sucursalSeleccionada: sucursalSeleccionadaEmpleado, employee } = useEmployee();
    const isEmployeeMode = !!employee;
    const canAdministrarSucursales = isEmployeeMode ? (employee?.permisos?.sucursales === true) : true;
    const seleccionarSucursal = isEmployeeMode ? seleccionarSucursalEmpleado : seleccionarSucursalUsuario;
    const sucursalSeleccionada = isEmployeeMode ? sucursalSeleccionadaEmpleado : sucursalSeleccionadaUsuario;
    const allowManualClose = canClose || (isEmployeeMode && canAdministrarSucursales);
    const closed = allowManualClose ? false : !sucursalSeleccionada;
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [autoSeleccionado, setAutoSeleccionado] = useState(false);
    
    // Cargar sucursales automáticamente cuando hay empresaId y no hay sucursal seleccionada
    // O cuando el modal está abierto (apertura manual)
    useEffect(() => {
        if (empresaId && canAdministrarSucursales && (isOpen || !sucursalSeleccionada)) {
            cargarSucursales();
        }
    }, [empresaId, canAdministrarSucursales, isOpen, sucursalSeleccionada]);

    // Auto-seleccionar la primera sucursal cuando se cargan y no hay sucursal seleccionada
    // Esto solo ocurre cuando NO es apertura manual del modal (isOpen es false)
    useEffect(() => {
        if (
            sucursales.length > 0 &&
            !loading &&
            !error &&
            !sucursalSeleccionada &&
            !autoSeleccionado &&
            canAdministrarSucursales &&
            !isOpen // Solo auto-seleccionar si el modal NO está abierto (no es apertura manual)
        ) {
            // Auto-seleccionar la primera sucursal disponible sin mostrar el modal y sin refresh
            const sucursal = sucursales[0];
            seleccionarSucursal(sucursal);
            setAutoSeleccionado(true);
            
            // Notificar al componente padre
            if (onSucursalSeleccionada) {
                onSucursalSeleccionada(sucursal);
            }
            
            // Actualizar empresa_id si es empleado
            if (isEmployeeMode) {
                const empresaId = sucursal?.empresas?.id || sucursal?.empresa_id;
                if (empresaId) {
                    localStorage.setItem('empresa_id', empresaId);
                }
            }
            // NO hacer refresh cuando es auto-selección
        }
    }, [sucursales, loading, isOpen, error, sucursalSeleccionada, autoSeleccionado, canAdministrarSucursales, isEmployeeMode, seleccionarSucursal, onSucursalSeleccionada]);

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
        if (isEmployeeMode && !canAdministrarSucursales) {
            return;
        }
        // Guardar sucursal seleccionada en el contexto global
        seleccionarSucursal(sucursal);
        
        // Notificar al componente padre
        if (onSucursalSeleccionada) {
            onSucursalSeleccionada(sucursal);
        }
        
        // Cerrar modal
        setIsOpen(false);
        
        if (isEmployeeMode) {
            // Actualizar empresa_id para flujos que dependen de localStorage
            const empresaId = sucursal?.empresas?.id || sucursal?.empresa_id;
            if (empresaId) {
                localStorage.setItem('empresa_id', empresaId);
            }
            localStorage.setItem('employeeSucursalOverride', 'true');
            window.location.reload();
            return;
        }

        // Recargar la página cuando es selección manual desde el modal (solo usuarios normales)
        window.location.reload();
    };

    // No hacer nada si no tiene permisos
    if (!canAdministrarSucursales) return null;

    // Solo mostrar el modal si el usuario lo abre manualmente (isOpen es true)
    // Si no está abierto, el componente se renderiza invisible para permitir auto-selección
    if (!isOpen) {
        // Renderizar un componente invisible para que los useEffect funcionen
        return <div style={{ display: 'none' }} />;
    }

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
