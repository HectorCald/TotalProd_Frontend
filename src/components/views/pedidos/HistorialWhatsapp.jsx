import React, { useState, useEffect } from 'react';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/old/HeaderModal';
import Boton from '../../common/botones/Boton';
import Notification from '../../common/old/Notification';
import styles from '../../../styles/view.module.css';
import whatsappIcon from '../../../assets/whatsapp.png';

function HistorialWhatsapp({ isOpen, setIsOpen, titulo, descripcion, tipo, datos }) {
    const [contenidoEditable, setContenidoEditable] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Estado para notificaciones
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });

    // Función para formatear los datos de la entrega
    const formatearDatosEntrega = (entrega) => {
        if (!entrega) return '';
        
        let texto = `*Se realizó la entrega de:*\n`;
        texto += `${entrega.fecha} - ${entrega.hora}\n\n`;
        
        if (entrega.productos && entrega.productos.length > 0) {
            texto += '*PRODUCTOS:*\n';
            entrega.productos.forEach((producto, index) => {
                const estadoTexto = producto.estado_entrega === 'llego' ? 'Llegó' : 'No llegó';
                texto += `• ${producto.nombre} (${producto.cantidad_ud} ${producto.unidad_ud}) - ${estadoTexto}\n`;
            });
            texto += `\nSe realizó la entrega en la app de TotalProd\n`;
        }
        
        if (entrega.observaciones) {
            texto += `\n*OBSERVACIONES:*\n${entrega.observaciones}\n`;
        }
        
        return texto;
    };

    // Función para formatear el historial completo de entregas
    const formatearHistorial = (historial) => {
        if (!historial || historial.length === 0) return 'No hay entregas en el historial.';
        
        let texto = '*HISTORIAL DE ENTREGAS*\n\n';
        
        historial.forEach((entrega, index) => {
            texto += `--- *ENTREGA ${index + 1}* ---\n`;
            
            // Formatear entrega individual sin el texto de TotalProd
            let entregaTexto = `*Se realizó la entrega de:*\n`;
            entregaTexto += `${entrega.fecha} - ${entrega.hora}\n\n`;
            
            if (entrega.productos && entrega.productos.length > 0) {
                entregaTexto += '*PRODUCTOS:*\n';
                entrega.productos.forEach((producto, prodIndex) => {
                    const estadoTexto = producto.estado_entrega === 'llego' ? 'Llegó' : 'No llegó';
                    entregaTexto += `• ${producto.nombre} (${producto.cantidad_ud} ${producto.unidad_ud}) - ${estadoTexto}\n`;
                });
            }
            
            if (entrega.observaciones) {
                entregaTexto += `\n*OBSERVACIONES:*\n${entrega.observaciones}\n`;
            }
            
            texto += entregaTexto;
            texto += '\n';
        });
        
        return texto;
    };

    // Cargar contenido cuando cambien los datos
    useEffect(() => {
        if (datos && tipo) {
            if (tipo === 'ultima-entrega') {
                setContenidoEditable(formatearDatosEntrega(datos));
            } else if (tipo === 'historial') {
                setContenidoEditable(formatearHistorial(datos));
            }
        } else {
            setContenidoEditable('');
        }
    }, [datos, tipo]);

    // Función para mostrar notificación
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

    // Función para enviar por WhatsApp
    const handleEnviarWhatsApp = () => {
        if (!contenidoEditable.trim()) {
            mostrarNotificacion('error', 'No hay contenido para enviar');
            return;
        }

        setLoading(true);
        
        // Crear el mensaje con formato (sin número específico)
        const mensaje = encodeURIComponent(contenidoEditable);
        const url = `https://wa.me/?text=${mensaje}`;
        
        // Abrir WhatsApp en una nueva ventana sin contacto específico
        window.open(url, '_blank');
        
        setLoading(false);
    };

    // Función para limpiar datos
    const handleLimpiar = () => {
        if (tipo === 'ultima-entrega') {
            // Limpiar última entrega
            localStorage.removeItem('ultimaEntregaAcopio');
            setContenidoEditable('');
            mostrarNotificacion('success', 'Última entrega eliminada');
        } else if (tipo === 'historial') {
            // Limpiar historial completo
            localStorage.removeItem('historialEntregasAcopio');
            setContenidoEditable('');
            mostrarNotificacion('success', 'Historial de entregas eliminado');
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal 
                title={titulo || 'Historial de Entregas'} 
                onClose={() => setIsOpen(false)} 
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>{descripcion || 'INFORMACIÓN'}</p>
                
                {/* Pizarra editable */}
                <div className={styles.content} style={{ 
                    minHeight: '400px', 
                    padding: '15px',
                    backgroundColor: 'var(--tertiary-color)',
                    borderRadius: '15px',
                    marginBottom: '20px'
                }}>
                    <textarea
                        value={contenidoEditable}
                        onChange={(e) => setContenidoEditable(e.target.value)}
                        placeholder="Aquí puedes editar el contenido antes de enviarlo por WhatsApp..."
                        style={{
                            width: '100%',
                            height: '350px',
                            border: 'none',
                            outline: 'none',
                            backgroundColor: 'transparent',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            lineHeight: '1.5',
                            resize: 'vertical',
                            padding: '10px',
                            color: 'var(--white-color)',
                            userSelect: 'text',
                            WebkitUserSelect: 'text',
                            MozUserSelect: 'text',
                            msUserSelect: 'text'
                        }}
                    />
                </div>

                {/* Botones */}
                <div className={styles.buttons}>
                    <Boton
                        className='btn-red'
                        label='Limpiar'
                        onClick={handleLimpiar}
                        disabled={!contenidoEditable.trim()}
                        style={{ marginTop: 'auto' }}
                    />
                    <Boton
                        className='btn-default'
                        label='Enviar'
                        icon={whatsappIcon}
                        onClick={handleEnviarWhatsApp}
                        loading={loading}
                        disabled={!contenidoEditable.trim()}
                        style={{ marginTop: 'auto' }}
                    />
                </div>
            </div>

            {/* Notificación */}
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </ViewModal>
    );
}

export default HistorialWhatsapp;
