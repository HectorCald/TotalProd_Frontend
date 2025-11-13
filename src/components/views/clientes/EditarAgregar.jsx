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
    const handleImportarContacto = async (e) => {
        // Prevenir cualquier comportamiento por defecto
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        setErrorContactos('');
        
        try {
            // Verificar si la Contact Picker API está disponible
            const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
            const isAndroid = /Android/i.test(navigator.userAgent);
            const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edg|OPR|Samsung/i.test(navigator.userAgent);
            
            // Obtener versión de Chrome
            const chromeVersionMatch = navigator.userAgent.match(/Chrome\/(\d+)/);
            const chromeVersion = chromeVersionMatch ? parseInt(chromeVersionMatch[1]) : null;
            const chromeVersionString = chromeVersionMatch ? chromeVersionMatch[1] : 'Desconocida';
            
            console.log('=== DEBUG IMPORTAR CONTACTO ===');
            console.log('HTTPS:', isSecure);
            console.log('Android:', isAndroid);
            console.log('Chrome:', isChrome);
            console.log('Versión de Chrome:', chromeVersion, `(${chromeVersionString})`);
            console.log('navigator.contacts:', 'contacts' in navigator);
            console.log('navigator.contacts.select:', 'contacts' in navigator && navigator.contacts && typeof navigator.contacts.select);
            console.log('window.ContactsManager:', 'ContactsManager' in window);
            console.log('User Agent completo:', navigator.userAgent);
            
            // Verificar disponibilidad de la API de forma más estricta
            if (!isSecure || !isAndroid || !isChrome) {
                setErrorContactos('Esta funcionalidad solo está disponible en dispositivos Android con Chrome.');
                setTimeout(() => setErrorContactos(''), 5000);
                return;
            }
            
            // Verificar versión de Chrome (requiere 80+)
            if (chromeVersion && chromeVersion < 80) {
                setErrorContactos(`Tu versión de Chrome (${chromeVersionString}) es muy antigua. La Contact Picker API requiere Chrome versión 80 o superior.\n\nSOLUCIÓN:\n1. Abre Google Play Store\n2. Busca "Chrome"\n3. Toca "Actualizar"\n4. Espera a que se actualice\n5. Reinicia Chrome y vuelve a intentar`);
                setTimeout(() => setErrorContactos(''), 10000);
                return;
            }
            
            // Verificar que la API realmente existe y es una función
            if (!('contacts' in navigator)) {
                setErrorContactos('La API de contactos no está disponible en este navegador.');
                setTimeout(() => setErrorContactos(''), 5000);
                return;
            }
            
            const contactsManager = navigator.contacts;
            
            if (!contactsManager) {
                setErrorContactos('No se pudo acceder al gestor de contactos.');
                setTimeout(() => setErrorContactos(''), 5000);
                return;
            }
            
            if (typeof contactsManager.select !== 'function') {
                console.error('contactsManager.select no es una función:', typeof contactsManager.select);
                setErrorContactos('La función de selección de contactos no está disponible. Asegúrate de usar Chrome versión 80 o superior.');
                setTimeout(() => setErrorContactos(''), 5000);
                return;
            }
            
            // Verificar permisos usando Permissions API si está disponible
            let hasPermission = true;
            if ('permissions' in navigator) {
                try {
                    const permissionStatus = await navigator.permissions.query({ name: 'contacts' });
                    console.log('Estado de permiso de contactos:', permissionStatus.state);
                    hasPermission = permissionStatus.state !== 'denied';
                    
                    if (permissionStatus.state === 'prompt') {
                        // El permiso aún no se ha solicitado, está bien
                        console.log('Permiso en estado "prompt" - se solicitará al usar la API');
                    } else if (permissionStatus.state === 'denied') {
                        setErrorContactos('Chrome no tiene permisos para acceder a contactos. Ve a Configuración → Aplicaciones → Chrome → Permisos → Contactos y habilítalo.');
                        setTimeout(() => setErrorContactos(''), 8000);
                        return;
                    }
                } catch (permError) {
                    console.log('No se pudo verificar permisos (normal en algunos navegadores):', permError);
                    // Continuar de todas formas, la API puede funcionar sin verificación previa
                }
            }
            
            // Llamar directamente a la API desde el click del usuario
            const properties = ['name', 'tel'];
            const options = { multiple: false }; // Solo un contacto
            
            console.log('Intentando abrir selector de contactos...');
            console.log('properties:', properties);
            console.log('options:', options);
            console.log('hasPermission:', hasPermission);
            
            // Llamar la API directamente sin delay
            const contacts = await contactsManager.select(properties, options);
            console.log('Contactos recibidos:', contacts);
            
            if (contacts && contacts.length > 0) {
                const contacto = contacts[0];
                const nombre = contacto.name && contacto.name.length > 0 ? contacto.name[0] : '';
                const telefono = contacto.tel && contacto.tel.length > 0 ? contacto.tel[0] : '';
                
                console.log('Contacto seleccionado - Nombre:', nombre, 'Teléfono:', telefono);
                
                // Llenar directamente los campos
                setDataEdit(prev => ({
                    ...prev,
                    name: nombre || prev.name,
                    phone: telefono || prev.phone
                }));
                
                mostrarNotificacion('success', 'Contacto importado correctamente');
            }
        } catch (err) {
            console.error('=== ERROR COMPLETO AL IMPORTAR CONTACTO ===');
            console.error('Error name:', err.name);
            console.error('Error message:', err.message);
            console.error('Error stack:', err.stack);
            console.error('Error completo:', err);
            console.error('Error toString:', err.toString());
            console.error('Error constructor:', err.constructor?.name);
            
            if (err.name === 'AbortError') {
                // Usuario canceló, no mostrar error
                return;
            }
            
            // Construir mensaje de error detallado
            let mensajeError = '';
            let detallesTecnicos = '';
            
            // Información básica del error
            const errorName = err.name || 'Error desconocido';
            const errorMessage = err.message || 'Sin mensaje de error';
            const errorString = err.toString() || 'Error sin descripción';
            
            // Detalles técnicos completos
            detallesTecnicos = `Tipo: ${errorName}\nMensaje: ${errorMessage}\nDescripción: ${errorString}`;
            
            if (err.stack) {
                detallesTecnicos += `\nStack: ${err.stack.split('\n').slice(0, 3).join('\n')}`;
            }
            
            // Obtener información del dispositivo/navegador para el error
            const chromeVersionMatch = navigator.userAgent.match(/Chrome\/(\d+)/);
            const chromeVersion = chromeVersionMatch ? chromeVersionMatch[1] : 'Desconocida';
            const androidVersionMatch = navigator.userAgent.match(/Android (\d+(\.\d+)?)/);
            const androidVersion = androidVersionMatch ? androidVersionMatch[1] : 'Desconocida';
            
            // Mensaje principal según el tipo de error
            if (errorMessage && errorMessage.toLowerCase().includes('unable to open')) {
                // Verificar si Chrome está desactualizado
                const chromeVersionNum = chromeVersionMatch ? parseInt(chromeVersionMatch[1]) : null;
                let solucionEspecifica = '';
                
                if (chromeVersionNum && chromeVersionNum < 80) {
                    solucionEspecifica = `\n\n🔴 PROBLEMA DETECTADO: Tu Chrome versión ${chromeVersion} es muy antigua.\n\nSOLUCIÓN INMEDIATA:\n1. Abre Google Play Store en tu Android\n2. Busca "Chrome" o "Google Chrome"\n3. Si aparece "Actualizar", tócalo\n4. Espera a que se actualice completamente\n5. Cierra Chrome completamente (no solo minimizar)\n6. Abre Chrome de nuevo\n7. Vuelve a esta app e intenta de nuevo\n\nLa Contact Picker API requiere Chrome versión 80 o superior. Tu versión actual (${chromeVersion}) no es compatible.`;
                } else if (chromeVersionNum && chromeVersionNum >= 80) {
                    solucionEspecifica = `\n\nTu Chrome versión ${chromeVersion} debería ser compatible, pero hay un problema.\n\nPosibles soluciones:\n1. Actualiza Chrome desde Play Store (puede haber una versión más reciente)\n2. Ve a Configuración → Aplicaciones → Chrome → Permisos → Contactos y habilítalo\n3. Reinicia Chrome completamente\n4. Verifica restricciones de administrador en el dispositivo`;
                } else {
                    solucionEspecifica = `\n\nSOLUCIÓN:\n1. Actualiza Chrome desde Play Store\n2. Verifica permisos de contactos en Configuración → Aplicaciones → Chrome\n3. Reinicia Chrome`;
                }
                
                mensajeError = `No se pudo abrir el selector de contactos.${solucionEspecifica}\n\nInformación del dispositivo:\n- Chrome versión: ${chromeVersion} (requiere 80+)\n- Android versión: ${androidVersion}\n\nDetalles técnicos del error:\n${detallesTecnicos}`;
            } else if (errorName === 'NotSupportedError') {
                mensajeError = `La API de contactos no está soportada.\n\nDetalles técnicos:\n${detallesTecnicos}`;
            } else if (errorName === 'SecurityError') {
                mensajeError = `Error de seguridad al acceder a contactos.\n\nVerifica:\n- Permisos de Chrome para contactos\n- Que estés en HTTPS\n- Configuración de seguridad del dispositivo\n\nDetalles técnicos:\n${detallesTecnicos}`;
            } else if (errorName === 'TypeError') {
                mensajeError = `Error de tipo: La función no está disponible.\n\nDetalles técnicos:\n${detallesTecnicos}`;
            } else {
                mensajeError = `Error al acceder a los contactos.\n\nDetalles técnicos:\n${detallesTecnicos}`;
            }
            
            setErrorContactos(mensajeError);
            setTimeout(() => setErrorContactos(''), 8000); // Más tiempo para leer el error completo
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