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
    
    // Resetear autoSeleccionado y limpiar sucursal cuando cambia empresaId (cambio de cuenta)
    useEffect(() => {
        if (!empresaId) return; // No hacer nada si no hay empresaId
        
        console.log('🔄 SeleccionarSucursal - empresaId cambió a:', empresaId);
        setAutoSeleccionado(false);
        setSucursales([]); // Limpiar sucursales anteriores
        
        // Verificar sucursal seleccionada desde localStorage también (puede estar desincronizada)
        const sucursalGuardada = localStorage.getItem('sucursalSeleccionada');
        let sucursalActual = sucursalSeleccionada;
        
        if (sucursalGuardada) {
            try {
                const parsed = JSON.parse(sucursalGuardada);
                // Si no hay sucursal en contexto, usar la de localStorage
                if (!sucursalActual) {
                    sucursalActual = parsed;
                }
                // Verificar si la sucursal guardada es de otra empresa
                const sucursalEmpresaId = parsed?.empresas?.id || parsed?.empresa_id;
                if (sucursalEmpresaId && sucursalEmpresaId !== empresaId) {
                    console.log('🔄 SeleccionarSucursal - La sucursal guardada es de otra empresa, limpiando');
                    localStorage.removeItem('sucursalSeleccionada');
                    sucursalActual = null;
                }
            } catch (e) {
                console.error('Error al parsear sucursal guardada:', e);
                localStorage.removeItem('sucursalSeleccionada');
            }
        }
        
        // Si hay sucursal seleccionada en contexto, verificar si es de la empresa actual
        if (sucursalActual) {
            const sucursalEmpresaId = sucursalActual?.empresas?.id || sucursalActual?.empresa_id;
            // Si la sucursal seleccionada es de otra empresa, limpiarla
            if (sucursalEmpresaId && sucursalEmpresaId !== empresaId) {
                console.log('🔄 SeleccionarSucursal - La sucursal del contexto es de otra empresa, limpiando');
                // Limpiar del contexto
                if (isEmployeeMode) {
                    seleccionarSucursalEmpleado(null);
                } else {
                    seleccionarSucursalUsuario(null);
                }
                // Limpiar de localStorage
                localStorage.removeItem('sucursalSeleccionada');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [empresaId]);
    
    // Cargar sucursales automáticamente cuando hay empresaId y no hay sucursal seleccionada
    // O cuando el modal está abierto (apertura manual)
    useEffect(() => {
        if (empresaId && canAdministrarSucursales && (isOpen || !sucursalSeleccionada)) {
            // Solo cargar si no se han cargado ya o si el modal está abierto
            if (sucursales.length === 0 || isOpen) {
            cargarSucursales();
        }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            console.log('🔄 SeleccionarSucursal - Auto-seleccionando sucursal:', sucursal);
            console.log('🔄 SeleccionarSucursal - Estructura sucursal:', {
                id: sucursal.id,
                name: sucursal.name,
                empresas: sucursal.empresas,
                empresa_id: sucursal.empresa_id
            });
            
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
            
            console.log('✅ SeleccionarSucursal - Sucursal auto-seleccionada y guardada en localStorage');
            // NO hacer refresh cuando es auto-selección
        }
    }, [sucursales, loading, isOpen, error, sucursalSeleccionada, autoSeleccionado, canAdministrarSucursales, isEmployeeMode, seleccionarSucursal, onSucursalSeleccionada]);

    const cargarSucursales = async () => {
        if (!empresaId) {
            console.error('❌ SeleccionarSucursal - No hay empresaId para cargar sucursales');
            setError('No hay empresa seleccionada');
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            setError('');
            console.log('🔄 SeleccionarSucursal - Cargando sucursales para empresaId:', empresaId);
            const response = await sucursalesService.getByEmpresaId(empresaId);
            
            if (response.success) {
                console.log('✅ SeleccionarSucursal - Sucursales cargadas:', response.data.length);
                setSucursales(response.data);
            } else {
                console.error('❌ SeleccionarSucursal - Error al cargar sucursales:', response.message);
                setError(response.message || 'Error al cargar las sucursales');
            }
        } catch (error) {
            console.error('❌ SeleccionarSucursal - Error al cargar sucursales:', error);
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
            // No recargar - React re-renderizará automáticamente
            return;
        }

        // No recargar - React re-renderizará automáticamente con la nueva sucursal seleccionada
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
