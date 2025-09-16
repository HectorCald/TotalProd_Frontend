import React, { useState, useEffect } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerSucursal from './VerSucursal';
import Boton from '../../common/Boton';
import EditarAgregarSucursal from './EditarAgregarSucursal';
import sucursalesService from '../../../services/sucursalesService';
import LoadingSpinner from '../../common/LoadingSpinner';
import InfoModal from '../../common/InfoModal';
import Notification from '../../common/Notification';
import { useUser } from '../../../context/UserContext';

function Sucursales({ isOpen, setIsOpen }) {
    const { user } = useUser();
    
    // Estados para los modales
    const [isOpenVerSucursal, setIsOpenVerSucursal] = useState(false);
    const [infoSucursal, setInfoSucursal] = useState(null);
    const [isAgregarOpen, setIsAgregarOpen] = useState(false);

    // Estados para la carga
    const [loading, setLoading] = useState(false);

    // Estados para los datos
    const [sucursalData, setSucursalData] = useState([]);

    // Estados para la notificación
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });
    const mostrarNotificacion = (tipo, texto) => {
        setNotification({
            isVisible: true,
            type: tipo,
            text: texto
        });

        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    // Estados y configuraciones para el modal de información
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        description: '',
        showButton: false
    });

    // Función para manejar el click en una sucursal
    const handleSucursal = (sucursal) => {
        setInfoSucursal(sucursal);
        setIsOpenVerSucursal(true);
    };

    // Función para obtener las sucursales
    const fetchSucursales = async () => {
        if (!user?.empresa_id) return;
        
        try {
            setLoading(true);
            const response = await sucursalesService.getByEmpresaId(user.empresa_id);
            if (response.success && response.data) {
                setSucursalData(response.data);
                // Cerrar modal si estaba abierto y ahora tenemos datos
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            } else {
                setSucursalData([]);
            }
        } catch (error) {
            console.error('Error obteniendo sucursales:', error);
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Error de Acceso',
                description: 'No tienes permisos para acceder a esta función.',
                showButton: true
            });
        } finally {
            setLoading(false);
        }
    };

    // Efecto para cargar datos cuando se abre
    useEffect(() => {
        if (isOpen) {
            // Asegurar que el modal esté cerrado al abrir el componente
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            fetchSucursales();
        }
    }, [isOpen, user?.empresa_id]);

    // Función para manejar cuando se crea una nueva sucursal
    const handleSucursalCreated = (newSucursal) => {
        // Agregar la nueva sucursal a la lista
        setSucursalData(prev => [newSucursal, ...prev]);
        // Cerrar el modal
        setIsAgregarOpen(false);
        mostrarNotificacion('success', 'Sucursal agregada correctamente');
    };

    // Función para manejar cuando se elimina una sucursal
    const handleSucursalDeleted = (deletedId) => {
        // Remover la sucursal eliminada de la lista
        setSucursalData(prev => prev.filter(sucursal => sucursal.id !== deletedId));
        // Cerrar el modal de ver sucursal
        setIsOpenVerSucursal(false);
        mostrarNotificacion('success', 'Sucursal eliminada correctamente');
    };

    // Función para manejar cuando se actualiza una sucursal
    const handleSucursalUpdated = (updatedSucursal) => {
        // Actualizar solo la sucursal específica en la lista
        setSucursalData(prev => prev.map(sucursal =>
            sucursal.id === updatedSucursal.id ? updatedSucursal : sucursal
        ));
        // Cerrar el modal de ver sucursal
        setIsOpenVerSucursal(false);
        mostrarNotificacion('success', 'Sucursal actualizada correctamente');
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            {loading && <LoadingSpinner iconName='building' />}
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>{user?.empresa?.name || 'Empresa'}</h1>
                <p className={styles.subTitle}>SUCURSALES</p>
                <div className={styles.content} style={{ height: 'calc(100vh - 235px)' }}>
                    {sucursalData.length > 0 ? (
                        sucursalData.map((sucursal, index) => (
                            <ItemView
                                key={sucursal.id || index}
                                title={sucursal.name || 'Sin nombre'}
                                description={`Creada el ${sucursal.created_at ? new Date(sucursal.created_at).toLocaleDateString('es-ES') : 'Sin fecha'}`}
                                icon="building"
                                arrow={true}
                                onClick={() => handleSucursal(sucursal)}
                            />
                        ))
                    ) : (
                        <div className={styles.noData}>
                            <p>No hay sucursales registradas</p>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.buttonFooter}>
                <Boton
                    className='btn-original'
                    label='Nueva sucursal'
                    onClick={() => { setIsAgregarOpen(true); }}
                />
            </div>

            {/* Modal de ver sucursal*/}
            <VerSucursal 
                isOpen={isOpenVerSucursal} 
                setIsOpen={setIsOpenVerSucursal} 
                sucursal={infoSucursal}
                onSucursalDeleted={handleSucursalDeleted}
                onSucursalUpdated={handleSucursalUpdated}
            />

            {/* Modal de agregar sucursal*/}
            <EditarAgregarSucursal 
                isOpen={isAgregarOpen} 
                setIsOpen={setIsAgregarOpen} 
                tipo='agregar'
                onSucursalCreated={handleSucursalCreated}
            />

            {/* Modal de Información */}
            <InfoModal
                isOpen={modalConfig.isOpen}
                setIsOpen={(isOpen) => setModalConfig(prev => ({ ...prev, isOpen }))}
                type={modalConfig.type}
                title={modalConfig.title}
                description={modalConfig.description}
                showButton={modalConfig.showButton}
                buttonText="Aceptar"
                onButtonClick={() => setIsOpen(false)}
            />
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}

export default Sucursales;
