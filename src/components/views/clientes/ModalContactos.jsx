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
            // Verificar si la Contact Picker API está disponible de múltiples formas
            let contactsManager = null;
            
            if ('contacts' in navigator && navigator.contacts && typeof navigator.contacts.select === 'function') {
                contactsManager = navigator.contacts;
            } else if ('ContactsManager' in window && window.ContactsManager) {
                contactsManager = new window.ContactsManager();
            } else if (navigator.contacts) {
                contactsManager = navigator.contacts;
            }

            if (contactsManager && typeof contactsManager.select === 'function') {
                const properties = ['name', 'tel'];
                const options = { multiple: true };

                try {
                    console.log('Intentando abrir selector de contactos...');
                    // Esta API abre el selector nativo del dispositivo
                    // Debe ser llamado desde una acción del usuario (ya lo es, desde el click)
                    const contacts = await contactsManager.select(properties, options);
                    console.log('Contactos seleccionados:', contacts);
                    
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
                // Verificar si es problema de HTTPS
                const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
                if (!isSecure) {
                    throw new Error('La API de contactos requiere HTTPS. Por favor, accede a la aplicación usando HTTPS.');
                }
                throw new Error('La API de contactos no está disponible en este navegador. Esta funcionalidad requiere Chrome en Android (versión 80 o superior).');
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

    // Resetear y verificar cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            setError(null);
            setContactos([]);
            
            // Verificar si estamos en HTTPS (requisito de la API)
            const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
            
            // Detectar si es Android
            const isAndroid = /Android/i.test(navigator.userAgent);
            const isMobile = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);
            const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edg|OPR|Samsung/i.test(navigator.userAgent);
            
            // Verificar si la Contact Picker API está disponible
            // La API puede estar en navigator.contacts o en window.ContactsManager
            const disponible = 
                isSecure &&
                isAndroid &&
                isChrome &&
                (('contacts' in navigator && navigator.contacts && typeof navigator.contacts.select === 'function') ||
                ('ContactsManager' in window && window.ContactsManager));
            
            setApiDisponible(disponible);
            
            // Debug en consola solo cuando se abre el modal
            console.log('=== Contact Picker API Debug (Modal abierto) ===');
            console.log('HTTPS:', isSecure);
            console.log('Es Android:', isAndroid);
            console.log('Es móvil:', isMobile);
            console.log('Es Chrome:', isChrome);
            console.log('navigator.contacts existe:', 'contacts' in navigator);
            console.log('navigator.contacts.select existe:', 'contacts' in navigator && navigator.contacts && typeof navigator.contacts.select === 'function');
            console.log('window.ContactsManager existe:', 'ContactsManager' in window);
            console.log('API disponible:', disponible);
            console.log('User Agent:', navigator.userAgent);
            
            if (disponible) {
                console.log('✅ Contact Picker API detectada, abriendo selector...');
                // Llamar inmediatamente cuando el modal se abre (acción del usuario)
                obtenerContactos();
            } else {
                // Si la API no está disponible, mostrar error con NoData
                console.log('❌ Contact Picker API no disponible');
                let motivo = '';
                if (!isSecure) {
                    motivo = 'Requiere HTTPS (excepto localhost)';
                } else if (!isAndroid) {
                    motivo = 'Solo funciona en dispositivos Android (no en Windows, Mac, iOS, etc.)';
                } else if (!isChrome) {
                    motivo = 'Solo funciona en Chrome (no en Safari, Firefox, Edge, etc.)';
                } else {
                    motivo = 'La API no está disponible en este navegador/dispositivo';
                }
                console.log('⚠️ Motivo:', motivo);
                setError('No se puede cargar los contactos del teléfono. Esta funcionalidad solo está disponible en dispositivos Android con Chrome.');
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

