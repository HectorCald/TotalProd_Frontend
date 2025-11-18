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
    
    // Obtener nombre de la empresa actual
    // Si hay sucursal seleccionada, usar su empresa; si no, usar la primera sucursal cargada
    const nombreEmpresaActual = sucursalSeleccionada?.empresas?.name || 
                                 (sucursales.length > 0 ? sucursales[0]?.empresas?.name : '');
    const esDamabrava = nombreEmpresaActual === 'Damabrava';
    
    useEffect(() => {
        if (isOpen && empresaId && canAdministrarSucursales) {
            cargarSucursales();
        }
    }, [isOpen, empresaId, canAdministrarSucursales]);

    // Auto-seleccionar la primera sucursal disponible cuando no hay sucursal seleccionada
    useEffect(() => {
        if (
            sucursales.length > 0 &&
            !loading &&
            isOpen &&
            !error &&
            !sucursalSeleccionada &&
            canAdministrarSucursales
        ) {
            // Filtrar sucursales según las reglas (igual que en el render)
            const sucursalesFiltradas = sucursales.filter(sucursal => {
                const esCasaMatrizAsociada = sucursal.name && sucursal.name.startsWith('Casa Matriz (') && sucursal.name.endsWith(')');
                
                if (esDamabrava) {
                    return true;
                }
                
                return !esCasaMatrizAsociada;
            });

            // Auto-seleccionar la primera sucursal disponible sin mostrar el modal y sin refresh
            if (sucursalesFiltradas.length > 0) {
                const sucursal = sucursalesFiltradas[0];
                seleccionarSucursal(sucursal);
                
                // Notificar al componente padre
                if (onSucursalSeleccionada) {
                    onSucursalSeleccionada(sucursal);
                }
                
                // Cerrar modal
                setIsOpen(false);
                // NO hacer refresh cuando es auto-selección
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sucursales, loading, isOpen, error, sucursalSeleccionada, canAdministrarSucursales, esDamabrava]);

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
        }

        // Disparar evento para actualizar componentes sin recargar la página
        window.dispatchEvent(new CustomEvent('sucursal-changed'));
    };

    // No mostrar el modal si no hay sucursal seleccionada (se auto-seleccionará la primera)
    // Solo mostrar el modal si hay sucursal seleccionada (apertura manual)
    if (!canAdministrarSucursales) return null;

    if (!isOpen || (!sucursalSeleccionada && !loading && !error)) return null;

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
                        {sucursales
                            .filter(sucursal => {
                                // Si la sucursal tiene formato "Casa Matriz (nombre empresa)", es de empresa asociada
                                const esCasaMatrizAsociada = sucursal.name && sucursal.name.startsWith('Casa Matriz (') && sucursal.name.endsWith(')');
                                
                                // Si es "Damabrava", mostrar todas las sucursales
                                if (esDamabrava) {
                                    return true;
                                }
                                
                                // Si no es "Damabrava", ocultar las "Casa Matriz" de empresas asociadas
                                return !esCasaMatrizAsociada;
                            })
                            .map((sucursal) => (
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
