import React, { useState, useEffect } from 'react';
import styles from '../../../styles/Inicial.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemLine from '../../common/ItemLine';
import LoadingSpinner from '../../common/LoadingSpinner';
import Notification from '../../common/Notification';
import NoData from '../../common/NoData';

function ModalContactos({ isOpen, setIsOpen, onContactoSeleccionado }) {
    const [contactos, setContactos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [apiDisponible, setApiDisponible] = useState(false);
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
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    // Verificar si la API está disponible al montar el componente
    useEffect(() => {
        // Verificar si la Contact Picker API está disponible
        const disponible = 'contacts' in navigator && 'ContactsManager' in window;
        setApiDisponible(disponible);
    }, []);

    // Función para manejar cuando se selecciona un contacto
    const handleContactoSelect = (contacto) => {
        if (onContactoSeleccionado) {
            onContactoSeleccionado({
                name: contacto.name,
                phone: contacto.phone
            });
        }
        setIsOpen(false);
    };

    // Función para obtener contactos del dispositivo
    const obtenerContactos = async () => {
        setLoading(true);
        setError(null);

        try {
            // Verificar si la Contact Picker API está disponible
            if ('contacts' in navigator && 'ContactsManager' in window) {
                const contactsManager = navigator.contacts;
                const properties = ['name', 'tel'];
                const options = { multiple: true };

                try {
                    // Esta API abre el selector nativo del dispositivo
                    const contacts = await contactsManager.select(properties, options);
                    
                    if (contacts && contacts.length > 0) {
                        const contactosFormateados = contacts.map((contact, index) => {
                            // La API devuelve arrays para name y tel
                            const nombre = contact.name && contact.name.length > 0 
                                ? contact.name[0] 
                                : 'Sin nombre';
                            const telefono = contact.tel && contact.tel.length > 0 
                                ? contact.tel[0] 
                                : '';
                            
                            return {
                                id: index,
                                name: nombre,
                                phone: telefono
                            };
                        });
                        
                        // Si solo se seleccionó un contacto, usarlo directamente
                        if (contactosFormateados.length === 1) {
                            handleContactoSelect(contactosFormateados[0]);
                        } else {
                            // Si hay múltiples, mostrarlos para que el usuario elija
                            setContactos(contactosFormateados);
                        }
                    } else {
                        // El usuario canceló la selección
                        setIsOpen(false);
                    }
                } catch (err) {
                    if (err.name === 'AbortError') {
                        // El usuario canceló la selección
                        setIsOpen(false);
                        return;
                    } else if (err.name === 'NotSupportedError' || err.name === 'SecurityError') {
                        throw new Error('No se pudo acceder a los contactos. Verifica los permisos del navegador.');
                    }
                    throw err;
                }
            } else {
                throw new Error('La API de contactos no está disponible en este navegador. Esta funcionalidad requiere un navegador que soporte la Contact Picker API (como Chrome en Android).');
            }
        } catch (err) {
            console.error('Error al obtener contactos:', err);
            const mensajeError = 'No se puede cargar los contactos del teléfono. Esta funcionalidad solo está disponible en dispositivos móviles Android.';
            setError(mensajeError);
            mostrarNotificacion('error', mensajeError);
        } finally {
            setLoading(false);
        }
    };

    // Resetear cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            setError(null);
            
            // Verificar nuevamente si la API está disponible
            const disponible = 'contacts' in navigator && 'ContactsManager' in window;
            
            if (disponible) {
                setContactos([]);
                obtenerContactos();
            } else {
                // Si la API no está disponible, mostrar error con NoData
                console.error('Error: La API de contactos no está disponible en este navegador. Esta funcionalidad requiere un navegador que soporte la Contact Picker API (como Chrome en Android).');
                setError('No se puede cargar los contactos del teléfono. Esta funcionalidad solo está disponible en dispositivos móviles Android.');
            }
        }
    }, [isOpen]);

    return (
        <>
            <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
                <HeaderModal
                    title="Seleccionar Contacto"
                    onClose={() => setIsOpen(false)}
                />
                <div className={styles.modalContent}>
                    {loading ? (
                        <LoadingSpinner />
                    ) : error ? (
                        <NoData
                            icon="error-circle"
                            title="Error al importar"
                            detail={error}
                            transparent={true}
                            minHeight="200px"
                            isError={true}
                        />
                    ) : contactos.length === 0 && !error ? (
                        <NoData
                            icon="user"
                            title="No se encontraron contactos"
                            detail="No se seleccionaron contactos o no hay contactos disponibles en tu dispositivo"
                            transparent={true}
                            minHeight="200px"
                        />
                    ) : (
                        <>
                            <p className={styles.subTitle}>
                                Selecciona un contacto para importar su información
                            </p>
                            {contactos.map((contacto) => (
                                <ItemLine
                                    key={contacto.id}
                                    title={`${contacto.name}${contacto.phone ? ` - ${contacto.phone}` : ' (Sin teléfono)'}`}
                                    icon="user"
                                    onClick={() => handleContactoSelect(contacto)}
                                    arrow={true}
                                />
                            ))}
                        </>
                    )}
                </div>
            </ViewModal>
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </>
    );
}

export default ModalContactos;

