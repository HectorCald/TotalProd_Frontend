import React, { useState, useEffect } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputSearch from '../../common/InputSearch';
import ItemView from '../../common/ItemView';
import VerPersona from './VerPersona';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import personalService from '../../../services/personalService';
import sucursalesService from '../../../services/sucursalesService';
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';
import InfoModal from '../../common/InfoModal';
import Notification from '../../common/Notification';


function Personal({ isOpen, setIsOpen }) {
    const [isOpenVerPersona, setIsOpenVerPersona] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const [isOpenEditarAgregar, setIsOpenEditarAgregar] = useState(false);

    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Estado para búsqueda local
    const [searchQuery, setSearchQuery] = useState('');

    // Estados para personal
    const [personal, setPersonal] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para sucursales
    const [sucursales, setSucursales] = useState([]);
    const [sucursalesLoading, setSucursalesLoading] = useState(false);
    const [sucursalesError, setSucursalesError] = useState(null);

    // Función para cargar personal
    const cargarPersonal = async () => {
        console.log('cargando personal');
        setIsLoading(true);
        setShowRefreshIndicator(true);
        setIsRefreshing(true);
        setError(null);
        
        try {
            const response = await personalService.getAll();
            if (response.success) {
                setPersonal(response.data);
            } else {
                setError(response);
            }
        } catch (error) {
            setError(error);
        } finally {
            setIsLoading(false);
            // Mostrar "Actualizado" por 1 segundo
            setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => {
                    setShowRefreshIndicator(false);
                }, 1000);
            }, 500);
        }
    };

    // Función para cargar sucursales
    const cargarSucursales = async () => {
        setSucursalesLoading(true);
        setSucursalesError(null);
        
        try {
            const response = await sucursalesService.getByEmpresaId();
            if (response.success) {
                setSucursales(response.data);
            } else {
                setSucursalesError(response);
            }
        } catch (error) {
            setSucursalesError(error);
        } finally {
            setSucursalesLoading(false);
        }
    };

    // Cargar datos cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            cargarPersonal();
            cargarSucursales();
        }
    }, [isOpen]);

    // Limpiar indicador cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            setShowRefreshIndicator(false);
            setIsRefreshing(false);
        }
    }, [isOpen]);



    // Estado para la notificación
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


    // Función para manejar el click en un personal
    const handlePersonal = (persona) => {
        setIsOpenVerPersona(true);
        setInfoPersona(persona);
    };


    // Función para manejar refresh con indicador
    const handleRefresh = async () => {
        await cargarPersonal();
        await cargarSucursales();
    };

    // Efecto para resetear búsqueda cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    // Filtrar personal localmente basado en la búsqueda
    const personalFiltrado = personal.filter(persona => 
        `${persona.first_name} ${persona.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (persona.codigo && persona.codigo.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Efecto para manejar errores de SWR
    useEffect(() => {
        if (error) {
            console.error('Error obteniendo personal:', error);
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Error de Acceso',
                description: 'No tienes permisos para acceder a esta función.',
                showButton: true
            });
        }
    }, [error]);

    // Función para manejar cuando se crea un nuevo personal
    const handlePersonalCreated = (newPersonal) => {
        // Actualizar el estado local con el personal que devuelve el servidor
        setPersonal(prevPersonal => [newPersonal, ...prevPersonal]);
        
        // Cerrar el modal
        setIsOpenEditarAgregar(false);
        mostrarNotificacion('success', 'Personal agregado correctamente');
    };

    // Función para manejar cuando se elimina un personal
    const handlePersonalDeleted = (deletedId) => {
        // Actualizar el estado local removiendo el personal eliminado
        setPersonal(prevPersonal => prevPersonal.filter(personal => personal.id !== deletedId));
        
        // Cerrar el modal de ver personal
        setIsOpenVerPersona(false);
        mostrarNotificacion('success', 'Personal eliminado correctamente');
    };

    // Función para manejar cuando se actualiza un personal
    const handlePersonalUpdated = (updatedPersonal) => {
        // Actualizar el estado local con el personal actualizado que devuelve el servidor
        setPersonal(prevPersonal => prevPersonal.map(personal => 
            personal.id === updatedPersonal.id ? updatedPersonal : personal
        ));
        
        // Cerrar el modal de ver personal
        setIsOpenVerPersona(false);
        mostrarNotificacion('success', 'Personal actualizado correctamente');
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.title}>
                        Personal
                        <button className={styles.refreshButton} onClick={handleRefresh}>
                            <BoxIcon name='refresh' />
                        </button>
                    </h1>
                    <RefreshIndicator
                        isVisible={showRefreshIndicator}
                        isLoading={isRefreshing}
                    />
                </div>
                <div className={styles.searchContainer}>
                    <InputSearch
                        placeholder='Buscar por nombre o código...'
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                        }}
                    />
                </div>
                <div className={styles.content}>
                    {personalFiltrado.length > 0 ? (
                        personalFiltrado.map((persona, index) => (
                            <ItemView
                                key={persona.id || index}
                                title={`${persona.first_name} ${persona.last_name}`}
                                description={`Código: ${persona.codigo}`}
                                arrow={true}
                                onClick={() => handlePersonal(persona)}
                                float2={persona.is_active ? 'Activo' : 'Inactivo'}
                            />
                        ))
                    ) : (
                        <div className={styles.noData}>
                            <p>{searchQuery ? 'No se encontró personal' : 'No hay personal registrado'}</p>
                        </div>
                    )}
                </div>
                <div className={styles.buttonFooter}>
                    <Boton
                        className='btn-original'
                        label='Agregar personal'
                        onClick={() => setIsOpenEditarAgregar(true)}
                    />
                </div>
            </div>
            {/* Modal de Ver Personal */}
            <VerPersona
                isOpen={isOpenVerPersona}
                setIsOpen={setIsOpenVerPersona}
                usuario={infoPersona}
                onProveedorDeleted={handlePersonalDeleted}
                onProveedorUpdated={handlePersonalUpdated}
                sucursales={sucursales}
            />

            {/* Modal de Editar/Agregar */}
            <EditarAgregar
                isOpen={isOpenEditarAgregar}
                setIsOpen={setIsOpenEditarAgregar}
                tipo='agregar'
                onPersonalCreated={handlePersonalCreated}
                sucursales={sucursales}
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
                onButtonClick={(setIsOpen)}
            />
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}
export default Personal;