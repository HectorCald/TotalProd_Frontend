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
                    // Log detallado del error
                    console.error('=== ERROR AL LLAMAR contactsManager.select ===');
                    console.error('Error name:', err.name);
                    console.error('Error message:', err.message);
                    console.error('Error stack:', err.stack);
                    console.error('Error completo:', err);
                    console.error('contactsManager:', contactsManager);
                    console.error('typeof contactsManager.select:', typeof contactsManager.select);
                    
                    if (err.name === 'AbortError') {
                        // El usuario canceló la selección
                        setIsOpen(false);
                        setLoading(false);
                        return;
                    } else if (err.name === 'NotSupportedError') {
                        const errorMsg = `La API de contactos no está soportada en este dispositivo. Asegúrate de usar Chrome versión 80 o superior en Android.\n\nError técnico: ${err.message || err.toString()}`;
                        throw new Error(errorMsg);
                    } else if (err.name === 'SecurityError') {
                        const errorMsg = `No se pudo acceder a los contactos. Verifica los permisos del navegador y asegúrate de estar en HTTPS.\n\nError técnico: ${err.message || err.toString()}`;
                        throw new Error(errorMsg);
                    } else if (err.name === 'TypeError') {
                        const errorMsg = `Error de tipo: La función select no está disponible o no es una función.\n\nError técnico: ${err.message || err.toString()}`;
                        throw new Error(errorMsg);
                    } else {
                        // Lanzar el error con toda la información disponible
                        const errorMsg = `Error al acceder a los contactos.\n\nTipo: ${err.name || 'Desconocido'}\nMensaje: ${err.message || err.toString() || 'Error desconocido'}`;
                        throw new Error(errorMsg);
                    }
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
            // Log completo del error para debugging
            console.error('=== ERROR COMPLETO AL OBTENER CONTACTOS ===');
            console.error('Error name:', err.name);
            console.error('Error message:', err.message);
            console.error('Error stack:', err.stack);
            console.error('Error completo:', err);
            console.error('Error toString:', err.toString());
            
            // Obtener mensaje de error específico y detallado
            let mensajeError = '';
            let detalleError = '';
            
            if (err.name === 'AbortError') {
                // Usuario canceló, no mostrar error
                setIsOpen(false);
                setLoading(false);
                return;
            } else if (err.name === 'NotSupportedError') {
                mensajeError = 'La API de contactos no está soportada';
                detalleError = 'La API de contactos no está soportada en este dispositivo o navegador. Asegúrate de usar Chrome versión 80 o superior en Android.';
            } else if (err.name === 'SecurityError') {
                mensajeError = 'Error de seguridad al acceder a contactos';
                detalleError = 'No se pudo acceder a los contactos por razones de seguridad. Verifica los permisos del navegador y asegúrate de estar en HTTPS.';
            } else if (err.name === 'TypeError') {
                mensajeError = 'Error de tipo en la API de contactos';
                detalleError = `Error de tipo: ${err.message || 'La función select no está disponible o no es una función'}`;
            } else if (err.message) {
                mensajeError = 'Error al acceder a los contactos';
                detalleError = `${err.message}${err.name ? ` (${err.name})` : ''}`;
            } else {
                mensajeError = 'Error desconocido';
                detalleError = `Error al acceder a los contactos: ${err.toString() || 'Error desconocido'}${err.name ? ` (Tipo: ${err.name})` : ''}`;
            }
            
            // Agregar información adicional si está disponible
            if (err.stack) {
                console.error('Stack trace:', err.stack);
            }
            
            // Mensaje completo para mostrar en NoData
            const mensajeCompleto = `${detalleError}\n\nDetalles técnicos:\n- Tipo de error: ${err.name || 'Desconocido'}\n- Mensaje: ${err.message || 'Sin mensaje'}`;
            
            setError(mensajeCompleto);
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
                let mensajeError = '';
                
                if (!isSecure) {
                    motivo = 'Requiere HTTPS (excepto localhost)';
                    mensajeError = 'La API de contactos requiere HTTPS. Por favor, accede a la aplicación usando HTTPS.';
                } else if (!isAndroid) {
                    motivo = 'Solo funciona en dispositivos Android (no en Windows, Mac, iOS, etc.)';
                    mensajeError = 'Esta funcionalidad solo está disponible en dispositivos Android. Estás usando un dispositivo de escritorio o iOS.';
                } else if (!isChrome) {
                    motivo = 'Solo funciona en Chrome (no en Safari, Firefox, Edge, etc.)';
                    mensajeError = 'Esta funcionalidad solo está disponible en Chrome para Android. Por favor, usa Chrome en tu dispositivo Android.';
                } else {
                    motivo = 'La API no está disponible en este navegador/dispositivo';
                    mensajeError = 'La API de contactos no está disponible. Asegúrate de usar Chrome versión 80 o superior en un dispositivo Android.';
                }
                
                console.log('⚠️ Motivo:', motivo);
                setError(mensajeError);
                // Mostrar notificación también cuando no es Android
                mostrarNotificacion('error', mensajeError);
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

