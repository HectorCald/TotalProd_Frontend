import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import Text from '../../../common/Text';
import { useToast } from '../../../../context/ToastContext';
import useHistorialLogger from '../../../ui/HistorialLogger';
import { buildConteoDetallesParaHistorial } from '../../../../utils/logFormatters';
import conteosService from '../../../../services/conteosService';
import styles from '../../../../styles/view.module.css';

function ModalReemplazarConteo({ 
    isOpen, 
    setIsOpen, 
    conteo,
    detalles,
    setDetalles,
    onConteoReplaced
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    
    const moduloConteo = conteo?.tipo === 'acopio' ? 'Pesaje' : 'Conteo';
    const { logAccion } = useHistorialLogger({
        modulo: moduloConteo
    });

    const handleReemplazarConteo = async () => {
        if (!conteo?.id) return;
        
        setLoading(true);
        try {
            // Cargar detalles antes de reemplazar si no están cargados
            let detallesParaLog = detalles;
            if (detalles.length === 0) {
                const resp = await conteosService.getDetalles(conteo.id);
                if (resp.success) {
                    detallesParaLog = resp.data || [];
                    if (setDetalles) {
                        setDetalles(detallesParaLog);
                    }
                }
            }
            
            let result;
            
            // Usar el método correcto según el tipo de conteo
            if (conteo.tipo === 'acopio') {
                result = await conteosService.replaceAcopio(conteo.id);
            } else {
                result = await conteosService.replace(conteo.id);
            }

            if (result.success) {
                showSuccess('Éxito', 'Stock reemplazado correctamente');
                setIsOpen(false);
                
                const detallesPersonalizados = buildConteoDetallesParaHistorial(conteo, 'REMPLAZO');
                const codigo = conteo?.codigo ?? conteo?.id ?? '';

                await logAccion({
                    accion: 'REMPLAZO',
                    lugarAfectado: `Conteo ${codigo ? '#' + codigo : ''}`.trim() || 'Conteo',
                    registroId: conteo.id,
                    comentario: 'Reemplazo de stock con conteo',
                    detallesPersonalizados
                });

                if (onConteoReplaced) {
                    onConteoReplaced(conteo.id);
                }
            } else {
                showDanger('Error', result.message || 'Error al reemplazar stock');
            }
        } catch (error) {
            console.error('Error al reemplazar conteo:', error);
            showDanger('Error', 'Error al reemplazar stock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title={conteo?.tipo === 'acopio' ? "Reemplazar Stock Acopio" : "Reemplazar Stock Almacén"}
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Estás seguro de continuar con el reemplazo de stock?
                </p>
                <div style={{ marginTop: '10px', width: '100%' }}>
                    <Text type="warning" align="left">
                        Al reemplazar stock este va a tomar las cantidades físicas de este conteo y las va a reemplazar en el stock principal de los productos.
                    </Text>
                </div>
                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Cancelar'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsOpen(false)}
                    />
                    <Boton
                        className='btn-orange'
                        label='Sí, reemplazar'
                        style={{ marginTop: 'auto' }}
                        onClick={handleReemplazarConteo}
                        loading={loading}
                        disabled={loading}
                        segundosDisabled={5}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalReemplazarConteo;
