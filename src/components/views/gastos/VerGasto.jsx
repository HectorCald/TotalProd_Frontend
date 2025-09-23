import React, { useState } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Dato from '../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../common/Boton';
import gastosService from '../../../services/gastosService';
import ItemView from '../../common/ItemView';
import Notification from '../../common/Notification';
import ModalDescarga from '../../ui/ModalDescarga';
import EditarAgregarGasto from './EditarAgregarGasto';

function VerGasto({ isOpen, setIsOpen, gasto, onGastoEliminado, onGastoActualizado }) {
    const [loading, setLoading] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isEditarOpen, setIsEditarOpen] = useState(false);

    // Función para preparar datos de descarga
    const prepararDatosDescarga = () => {
        if (!gasto) return { informacionSuperior: {}, tablaHeaders: [], tablaValores: [] };

        // Información superior
        const informacionSuperior = {
            'Responsable': gasto?.user?.name || gasto?.personal?.name || 'Usuario desconocido',
            'Fecha': new Date(gasto?.fecha_gasto).toLocaleString(),
            'Concepto': gasto?.concepto || 'Sin concepto',
            'Valor': `Bs. ${(gasto?.valor || 0).toFixed(2)}`,
            'Método de Pago': gasto?.metodo_pago || 'No especificado',
            'Sucursal': gasto?.sucursal?.name || 'Sucursal no encontrada'
        };

        if (gasto?.proveedor?.name) {
            informacionSuperior['Proveedor'] = gasto.proveedor.name;
        }

        // No hay tabla para gastos, solo información
        return { informacionSuperior, tablaHeaders: [], tablaValores: [] };
    };


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

    // Función para manejar cuando se actualiza un gasto
    const handleGastoUpdated = (gastoActualizado) => {
        if (onGastoActualizado) {
            onGastoActualizado(gastoActualizado);
        }
        setIsEditarOpen(false);
        setIsOpen(false);
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    Detalles del Gasto
                    <div className={styles.iconButton}>
                        <button className={styles.iconButton} onClick={() => setIsDescargaOpen(true)}>
                            <BoxIcon
                                name='download'
                                className={styles.iconDownload}
                            />
                        </button>
                    </div>
                </h1>

                <p className={styles.subTitle}>INFORMACIÓN DEL RESPONSABLE</p>
                <ItemView
                    title={gasto?.user?.name || gasto?.personal?.name || 'Usuario desconocido'}
                    description="Responsable del gasto"
                    transparent={false}
                />

                <p className={styles.subTitle}>INFORMACIÓN DEL GASTO</p>
                <ItemView
                    title={gasto?.concepto || 'Sin concepto'}
                    description={`Fecha: ${new Date(gasto?.fecha_gasto).toLocaleDateString()}`}
                    description2={`Valor: Bs. ${(gasto?.valor || 0).toFixed(2)}`}
                    transparent={false}
                    circulo={false}
                    flot6="Gasto"
                />

                <div className={styles.content}>
                    <Dato
                        label="Valor"
                        value={`Bs. ${(gasto?.valor || 0).toFixed(2)}`}
                        vertical={false}
                        especial='red'
                    />
                </div>

                <div className={styles.content}>
                    <Dato
                        label="Método de Pago"
                        value={gasto?.metodo_pago || 'No especificado'}
                        vertical={false}
                    />
                </div>

                {gasto?.proveedor?.name && (
                    <ItemView
                        title={gasto.proveedor.name}
                        description="Proveedor"
                        transparent={false}
                    />
                )}

                <div className={styles.content}>
                    <Dato
                        label="Sucursal"
                        value={gasto?.sucursal?.name || 'No especificada'}
                        vertical={false}
                    />
                </div>

                <div className={styles.buttons}>
                    <Boton
                        className='btn-gray'
                        label='Editar Gasto'
                        onClick={() => setIsEditarOpen(true)}
                    />
                    <Boton
                        className='btn-red'
                        label='Eliminar Gasto'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsEliminarOpen(true)}
                    />
                </div>
            </div>

            {/* Modal de descarga */}
            <ModalDescarga
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                titulo="Descargar Gasto"
                subtitulo="Selecciona el formato que prefieras para descargar este gasto."
                nombreArchivo={`Gasto_${new Date(gasto?.fecha_gasto).toLocaleDateString().replace(/\//g, '-')}_${gasto?.concepto?.replace(/[^a-zA-Z0-9]/g, '_') || 'gasto'}`}
                {...prepararDatosDescarga()}
            />

            {/* Modal de editar gasto */}
            <EditarAgregarGasto
                isOpen={isEditarOpen}
                setIsOpen={setIsEditarOpen}
                gasto={gasto}
                tipo='editar'
                onGastoUpdated={handleGastoUpdated}
            />

            {/* Modal de eliminar gasto */}
            <ViewModal isOpen={isEliminarOpen} setIsOpen={setIsEliminarOpen}>
                <HeaderModal
                    title="Eliminar Gasto"
                    onClose={() => setIsEliminarOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas eliminar permanentemente este gasto? Esta acción no se puede deshacer.
                    </p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-red'
                            label='Sí, eliminar'
                            style={{ marginTop: 'auto' }}
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    const response = await gastosService.delete(gasto.id);

                                    if (response.success) {
                                        setIsEliminarOpen(false);
                                        setIsOpen(false);

                                        if (onGastoEliminado) {
                                            onGastoEliminado(gasto.id);
                                        }
                                    } else {
                                        mostrarNotificacion('error', response.message || 'Error al eliminar el gasto');
                                    }
                                } catch (error) {
                                    console.error('Error eliminando gasto:', error);
                                    mostrarNotificacion('error', 'Error al eliminar el gasto');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            loading={loading}
                        />
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsEliminarOpen(false)}
                        />
                    </div>
                </div>
            </ViewModal>

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}

export default VerGasto;
