import React, { useState, useEffect } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerPersona from './VerPersona';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import LoadingSpinner from '../../common/LoadingSpinner';

import personalService from '../../../services/personalService';
import InfoModal from '../../common/InfoModal';
import Notification from '../../common/Notification';


function Personal({ isOpen, setIsOpen }) {
    const [isOpenVerPersona, setIsOpenVerPersona] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const [isOpenEditarAgregar, setIsOpenEditarAgregar] = useState(false);

    const [personalData, setPersonalData] = useState([]);

    // Estados para la carga
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMorePages, setHasMorePages] = useState(true);



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

    // Función para obtener el personal
    const fetchPersonal = async (page = 1, reset = true) => {
        try {
            if (reset) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const response = await personalService.getAll(page, 20, '');
            if (response.success && response.data) {
                if (reset) {
                    setPersonalData(response.data);
                } else {
                    setPersonalData(prev => [...prev, ...response.data]);
                }

                setCurrentPage(page);
                setHasMorePages(response.pagination?.hasNextPage || false);

                // Cerrar modal si estaba abierto y ahora tenemos datos
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            } else if (response.code === 'MODULE_NOT_INCLUDED') {
                setModalConfig({
                    isOpen: true,
                    type: 'warning',
                    title: 'Módulo No Incluido',
                    description: `Tu plan actual (${response.currentPlan}) no incluye acceso al módulo "${response.requiredModule}". Actualiza tu plan para acceder a esta función.`,
                    showButton: true
                });
            } else if (response.code === 'NO_PLAN') {
                setModalConfig({
                    isOpen: true,
                    type: 'warning',
                    title: 'Plan Requerido',
                    description: 'Necesitas un plan activo para acceder a esta función. Actualiza tu plan desde el perfil.',
                    showButton: true
                });
            } else {
                // Si no es éxito pero tampoco es un error de plan, no abrir modal
                console.log('Respuesta del servidor:', response);
            }
        } catch (error) {
            console.error('Error obteniendo personal:', error);
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Error de Acceso',
                description: 'No tienes permisos para acceder a esta función.',
                showButton: true
            });
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };
    // Función para manejar scroll infinito
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !loadingMore) {
            fetchPersonal(currentPage + 1, false);
        }
    };

    // Efecto para cargar datos cuando se abre
    useEffect(() => {
        if (isOpen) {
            console.log('Personal - Cargando datos');
            // Asegurar que el modal esté cerrado al abrir el componente
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            setCurrentPage(1);
            setHasMorePages(true);
            fetchPersonal(1, true);
        }
    }, [isOpen]);

    // Función para manejar cuando se crea un nuevo personal
    const handlePersonalCreated = (newPersonal) => {
        // Agregar el nuevo personal a la lista
        setPersonalData(prev => [newPersonal, ...prev]);
        // Cerrar el modal
        setIsOpenEditarAgregar(false);
        mostrarNotificacion('success', 'Personal agregado correctamente');
    };

    // Función para manejar cuando se elimina un personal
    const handlePersonalDeleted = (deletedId) => {
        // Remover el personal eliminado de la lista
        setPersonalData(prev => prev.filter(personal => personal.id !== deletedId));
        // Cerrar el modal de ver personal
        setIsOpenVerPersona(false);
        mostrarNotificacion('success', 'Personal eliminado correctamente');
    };

    // Función para manejar cuando se actualiza un personal
    const handlePersonalUpdated = (updatedPersonal) => {
        // Actualizar solo el personal específico en la lista
        setPersonalData(prev => prev.map(personal =>
            personal.id === updatedPersonal.id ? updatedPersonal : personal
        ));
        // Cerrar el modal de ver personal
        setIsOpenVerPersona(false);
        mostrarNotificacion('success', 'Personal actualizado correctamente');
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            {loading && <LoadingSpinner iconName='user' />}
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Personal</h1>
                <div className={styles.content} onScroll={handleScroll}>
                    {personalData.length > 0 ? (
                        personalData.map((personal, index) => (
                            <ItemView
                                key={personal.id || index}
                                title={`${personal.first_name} ${personal.last_name}`}
                                description={`Código: ${personal.codigo}`}
                                arrow={true}
                                onClick={() => handlePersonal(personal)}
                                float2={personal.is_active ? 'Activo' : 'Inactivo'}
                            />
                        ))
                    ) : (
                        <div className={styles.noData}>
                            <p>No hay personal registrado</p>
                        </div>
                    )}

                    {/* Indicador de carga para más elementos */}
                    {loadingMore && (
                        <div className={styles.loadingMore}>
                            <p>Cargando más personal...</p>
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
            />

            {/* Modal de Editar/Agregar */}
            <EditarAgregar
                isOpen={isOpenEditarAgregar}
                setIsOpen={setIsOpenEditarAgregar}
                tipo='agregar'
                onPersonalCreated={handlePersonalCreated}
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