import React, { useState, useEffect } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import InputDate from '../../../common/InputDate';
import { useToast } from '../../../../context/ToastContext';
import deudasService from '../../../../services/deudasService';
import styles from '../../../../styles/view.module.css';

function ModalEditarVencimiento({ 
    isOpen, 
    setIsOpen, 
    deudaActual,
    onDeudaActualizada
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    const [fechaVencEdit, setFechaVencEdit] = useState('');

    // Inicializar fecha de vencimiento para edición
    useEffect(() => {
        if (isOpen && deudaActual?.fecha_vencimiento) {
            const d = new Date(deudaActual.fecha_vencimiento);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            setFechaVencEdit(`${yyyy}-${mm}-${dd}`);
        }
    }, [isOpen, deudaActual?.fecha_vencimiento]);

    const handleGuardar = async () => {
        if (!fechaVencEdit) {
            showDanger('Error', 'La fecha de vencimiento es obligatoria');
            return;
        }
        setLoading(true);
        try {
            const resp = await deudasService.update(deudaActual.id, { fecha_vencimiento: fechaVencEdit });
            if (resp.success) {
                if (onDeudaActualizada) {
                    onDeudaActualizada(resp.data);
                }
                showSuccess('Éxito', 'Fecha de vencimiento actualizada');
                setIsOpen(false);
            } else {
                showDanger('Error', resp.message || 'Error al actualizar la fecha');
            }
        } catch (e) {
            console.error('Error actualizando vencimiento:', e);
            showDanger('Error', 'Error al actualizar la fecha');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Editar Fecha de Vencimiento"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>NUEVA FECHA DE VENCIMIENTO</p>
                <InputDate
                    mode='date'
                    value={fechaVencEdit}
                    onChange={(val) => setFechaVencEdit(val)}
                    placeholder='Fecha de vencimiento'
                    icon='time'
                />
                <Boton
                    className='btn-original'
                    label='Guardar'
                    style={{ marginTop: 'auto' }}
                    onClick={handleGuardar}
                    loading={loading}
                    disabled={!fechaVencEdit}
                />
            </div>
        </ViewModal>
    );
}

export default ModalEditarVencimiento;
