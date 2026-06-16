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

    // Función para formatear los datos del pedido
    const formatearDatosPedido = (pedido) => {
        if (!pedido) return '';
        
        let texto = `*Pedido de Materia Prima*\n`;
        texto += `${pedido.fecha} - ${pedido.hora}\n\n`;
        
        if (pedido.productos && pedido.productos.length > 0) {
            texto += '*PRODUCTOS:*\n';
            pedido.productos.forEach((producto, index) => {
                texto += `• ${producto.nombre} - ${producto.cantidad} ${producto.medida}\n`;
            });
            texto += `\nSe hizo el pedido en la app de TotalProd\n`;
        }
        
        if (pedido.observaciones) {
            texto += `\n*OBSERVACIONES:*\n${pedido.observaciones}\n`;
        }
        
        return texto;
    };

    // Función para formatear el historial completo
    const formatearHistorial = (historial) => {
        if (!historial || historial.length === 0) return 'No hay pedidos en el historial.';
        
        let texto = '*HISTORIAL DE PEDIDOS*\n\n';
        
        historial.forEach((pedido, index) => {
            texto += `--- *PEDIDO ${index + 1}* ---\n`;
            
            // Formatear pedido individual sin el texto de TotalProd
            let pedidoTexto = `*Pedido de Materia Prima*\n`;
            pedidoTexto += `${pedido.fecha} - ${pedido.hora}\n\n`;
            
            if (pedido.productos && pedido.productos.length > 0) {
                pedidoTexto += '*PRODUCTOS:*\n';
                pedido.productos.forEach((producto, prodIndex) => {
                    pedidoTexto += `• ${producto.nombre} - ${producto.cantidad} ${producto.medida}\n`;
                });
            }
            
            if (pedido.observaciones) {
                pedidoTexto += `\n*OBSERVACIONES:*\n${pedido.observaciones}\n`;
            }
            
            texto += pedidoTexto;
            texto += '\n';
        });
        
        return texto;
    };

    // Cargar contenido cuando cambien los datos
    useEffect(() => {
        if (datos && tipo) {
            if (tipo === 'ultimo-pedido') {
                setContenidoEditable(formatearDatosPedido(datos));
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
        if (tipo === 'ultimo-pedido') {
            // Limpiar último pedido
            localStorage.removeItem('ultimoPedidoAcopio');
            setContenidoEditable('');
            mostrarNotificacion('success', 'Último pedido eliminado');
        } else if (tipo === 'historial') {
            // Limpiar historial completo
            localStorage.removeItem('historialPedidosAcopio');
            setContenidoEditable('');
            mostrarNotificacion('success', 'Historial de pedidos eliminado');
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal 
                title={titulo || 'Historial'} 
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
                        label='Enviar por WhatsApp'
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
