import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderModal from '../../common/HeaderModal';
import ViewModal from '../../ui/ViewModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Notification from '../../common/Notification';
import MensajeError from '../../common/MensajeError';
import MapaModal from './MapaModal';
import clientService from '../../../services/clientService';
import { useUser } from '../../../context/UserContext';
import useHistorialLogger from '../../ui/HistorialLogger';

function EditarAgregar({ isOpen, setIsOpen, usuario, tipo, onClientCreated, onClientUpdated }) {
    const { sucursalSeleccionada } = useUser();
    const { logAccion } = useHistorialLogger({
        modulo: 'Clientes',
        campos: ['name', 'phone', 'direccion', 'description', 'total_orders', 'location']
    });

    // Estados para los datos del cliente
    const [dataEdit, setDataEdit] = useState({
        name: '',
        phone: '',
        direccion: '',
        description: '',
        total_orders: 0,
        coordenadas: null
    });

    // Estados para la notificación
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'error',
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

    // Estado para mensaje de error de contactos
    const [errorContactos, setErrorContactos] = useState('');

    // Estados para el mapa
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    // Estados para la carga
    const [loading, setLoading] = useState(false);
   

    // Efecto para cargar los datos del cliente
    useEffect(() => {
        if (usuario && tipo === 'editar') {
            // Parsear las coordenadas del string a objeto
            let coordenadasObj = null;
            if (usuario.location && typeof usuario.location === 'string') {
                const coordsMatch = usuario.location.match(/\(([^,]+),([^)]+)\)/);
                if (coordsMatch) {
                    const lng = parseFloat(coordsMatch[1]);
                    const lat = parseFloat(coordsMatch[2]);
                    coordenadasObj = { lat, lng };
                }
            }

            setDataEdit({
                name: usuario.name || '',
                phone: usuario.phone || '',
                direccion: usuario.direccion || '',
                description: usuario.description || '',
                total_orders: usuario.total_orders || 0,
                coordenadas: coordenadasObj
            });
        } else {
            setDataEdit({
                name: '',
                phone: '',
                direccion: '',
                description: '',
                total_orders: 0,
                coordenadas: null
            });
        }
    }, [isOpen, usuario, tipo]);


    // Función para enviar los datos del cliente
    const handleSubmit = async () => {
        if (!dataEdit.name.trim()) {
            mostrarNotificacion('error', 'El nombre es obligatorio');
            return;
        }

        // Preparar datos para enviar
        const datosParaEnviar = {
            name: dataEdit.name,
            phone: dataEdit.phone,
            direccion: dataEdit.direccion,
            description: dataEdit.description,
            total_orders: dataEdit.total_orders,
            location: dataEdit.coordenadas ? `(${dataEdit.coordenadas.lng},${dataEdit.coordenadas.lat})` : null
        };
        setLoading(true);
        try {
            let response;

            if (tipo === 'editar') {
                response = await clientService.update(usuario.id, datosParaEnviar, sucursalSeleccionada?.id);
            } else {
                response = await clientService.create(datosParaEnviar, sucursalSeleccionada?.id);
            }

            if (response.success) {
                const datosAntes = tipo === 'editar' ? usuario : null;
                const datosDespues = response.data || (tipo === 'agregar' ? {
                    ...datosParaEnviar,
                    id: response.id || null
                } : null);
                const registroId = (response.data && response.data.id) || datosDespues?.id || usuario?.id || null;
                const lugarAfectado = (datosDespues && datosDespues.name) || datosParaEnviar.name || usuario?.name || 'Cliente';
                const comentarioAccion = tipo === 'editar'
                    ? 'Actualización de datos del cliente'
                    : 'Creación de cliente';

                await logAccion({
                    accion: tipo === 'editar' ? 'EDITAR' : 'CREAR',
                    lugarAfectado,
                    registroId,
                    datosAntes,
                    datosDespues,
                    comentario: comentarioAccion
                });

                if (tipo === 'editar' && onClientUpdated) {
                    onClientUpdated(response.data);
                } else if (tipo === 'agregar' && onClientCreated) {
                    onClientCreated(response.data);
                }
                setIsOpen(false);
            } else {
                mostrarNotificacion('error', response.message || `Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} el cliente`);
            }
        } catch (error) {
            console.error(`Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} cliente:`, error);
            mostrarNotificacion('error', 'Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    }

    // Función para seleccionar la ubicación
    const handleLocationSelect = (locationData) => {

        const nuevaDireccion = locationData.direccion || locationData.address || `Ubicación: ${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)}`;
        const nuevasCoordenadas = {
            lat: locationData.lat,
            lng: locationData.lng
        };

        setDataEdit(prev => ({
            ...prev,
            direccion: nuevaDireccion,
            coordenadas: nuevasCoordenadas
        }));

        setIsMapModalOpen(false);
    };

    // Función para abrir el mapa
    const handleOpenMap = () => {
        setIsMapModalOpen(true);
    };

    // Función para mostrar coordenadas en el campo de dirección
    const getDireccionDisplay = () => {
        if (dataEdit.direccion && dataEdit.direccion.trim() !== '') {
            // Si hay dirección seleccionada (nueva o existente), mostrarla
            return dataEdit.direccion;
        } else if (tipo === 'editar' && dataEdit.coordenadas) {
            // Al editar, mostrar las coordenadas existentes si no hay dirección nueva
            return `Coordenadas: (${dataEdit.coordenadas.lng}, ${dataEdit.coordenadas.lat})`;
        } else {
            // Campo vacío para nuevo cliente
            return '';
        }
    };

    // Título dinámico para el mapa
    const getMapTitle = () => {
        if (tipo === 'editar') {
            return 'Editar ubicación';
        } else {
            return 'Seleccionar ubicación';
        }
    };

    // Determinar si el mapa debe ser de solo lectura
    const isMapReadOnly = tipo === 'ver';

    // Función para importar contacto directamente
    const handleImportarContacto = async () => {
        setErrorContactos('');
        
        try {
            // Verificar si la Contact Picker API está disponible
            const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
            const isAndroid = /Android/i.test(navigator.userAgent);
            const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edg|OPR|Samsung/i.test(navigator.userAgent);
            
            // Verificar disponibilidad de la API
            let contactsManager = null;
            if ('contacts' in navigator && navigator.contacts && typeof navigator.contacts.select === 'function') {
                contactsManager = navigator.contacts;
            } else if ('ContactsManager' in window && window.ContactsManager) {
                contactsManager = new window.ContactsManager();
            }
            
            if (!isSecure || !isAndroid || !isChrome || !contactsManager) {
                setErrorContactos('Esta funcionalidad solo está disponible en dispositivos Android con Chrome.');
                setTimeout(() => setErrorContactos(''), 5000);
                return;
            }
            
            // Llamar directamente a la API desde el click del usuario
            const properties = ['name', 'tel'];
            const options = { multiple: false }; // Solo un contacto
            
            try {
                const contacts = await contactsManager.select(properties, options);
                
                if (contacts && contacts.length > 0) {
                    const contacto = contacts[0];
                    const nombre = contacto.name && contacto.name.length > 0 ? contacto.name[0] : '';
                    const telefono = contacto.tel && contacto.tel.length > 0 ? contacto.tel[0] : '';
                    
                    // Llenar directamente los campos
                    setDataEdit(prev => ({
                        ...prev,
                        name: nombre || prev.name,
                        phone: telefono || prev.phone
                    }));
                    
                    mostrarNotificacion('success', 'Contacto importado correctamente');
                }
            } catch (err) {
                if (err.name === 'AbortError') {
                    // Usuario canceló, no mostrar error
                    return;
                }
                console.error('Error al obtener contactos:', err);
                let mensajeError = 'Error al acceder a los contactos.';
                if (err.name === 'NotSupportedError') {
                    mensajeError = 'La API de contactos no está soportada en este dispositivo.';
                } else if (err.name === 'SecurityError') {
                    mensajeError = 'No se pudo acceder a los contactos. Verifica los permisos del navegador.';
                } else if (err.message) {
                    mensajeError = err.message;
                }
                setErrorContactos(mensajeError);
                setTimeout(() => setErrorContactos(''), 5000);
            }
        } catch (err) {
            console.error('Error al importar contacto:', err);
            setErrorContactos('Error al acceder a los contactos. Esta funcionalidad solo está disponible en dispositivos Android con Chrome.');
            setTimeout(() => setErrorContactos(''), 5000);
        }
    };

    return (
        <>
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal title={tipo === 'agregar' ? 'Nuevo cliente' : tipo === 'editar' ? 'Editar cliente' : 'Ver cliente'} onClose={() => setIsOpen(false)} />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>INFORMACION PERSONAL</p>
                {tipo === 'agregar' && (
                    <>
                        <Boton
                            className='btn-gray'
                            label='Importar de contacto'
                            onClick={handleImportarContacto}
                            style={{ marginBottom: '10px' }}
                        />
                        {errorContactos && <MensajeError mensaje={errorContactos} />}
                    </>
                )}
                <InputNormal
                    tipo="text"
                    icon="user"
                    value={dataEdit.name}
                    placeholder='Nombre completo'
                    onChange={(e) => setDataEdit({ ...dataEdit, name: e.target.value })}
                    disabled={tipo === 'ver'}
                />
                <InputNormal
                    tipo="number"
                    icon="phone"
                    value={dataEdit.phone}
                    placeholder='Celular'
                    onChange={(e) => setDataEdit({ ...dataEdit, phone: e.target.value })}
                    disabled={tipo === 'ver'}
                />
                <InputNormal
                    tipo="text"
                    icon="text"
                    value={dataEdit.description}
                    placeholder='Descripción (opcional)'
                    onChange={(e) => setDataEdit({ ...dataEdit, description: e.target.value })}
                    disabled={tipo === 'ver'}
                />
                <InputNormal
                    tipo="number"
                    icon="cart"
                    value={dataEdit.total_orders === 0 ? '' : dataEdit.total_orders}
                    placeholder='Total de pedidos'
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                            setDataEdit({ ...dataEdit, total_orders: 0 });
                        } else {
                            setDataEdit({ ...dataEdit, total_orders: parseInt(value) || 0 });
                        }
                    }}
                    disabled={tipo === 'ver'}
                />
                <p className={styles.subTitle}>UBICACIÓN</p>
                <InputNormal
                    tipo="text"
                    icon="map-pin"
                    value={getDireccionDisplay()}
                    placeholder='Dirección'
                    readonly={tipo !== 'ver'}
                    onClick={tipo !== 'ver' ? handleOpenMap : undefined}
                    buttonIcon="map"
                    buttonIconClick={handleOpenMap}
                    disabled={tipo === 'ver'}
                />
                {tipo !== 'ver' && (
                    <Boton
                        className='btn-original'
                        label={tipo === 'editar' ? 'Actualizar Cliente' : 'Agregar Cliente'}
                        style={{ marginTop: 'auto' }}
                        onClick={handleSubmit}
                        loading={loading}
                        disabled={!dataEdit.name}
                    />
                )}
            </div>

            
        </ViewModal>
        <MapaModal
                isOpen={isMapModalOpen}
                setIsOpen={setIsMapModalOpen}
                onLocationSelect={handleLocationSelect}
                initialLocation={dataEdit.coordenadas ? `(${dataEdit.coordenadas.lng},${dataEdit.coordenadas.lat})` : null}
                readOnly={isMapReadOnly}
                title={getMapTitle()}
            />

        <Notification
            isVisible={notification.isVisible}
            type={notification.type}
            text={notification.text}
        />
        </>
    );
}
export default EditarAgregar;