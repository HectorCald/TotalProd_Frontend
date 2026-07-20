import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Input from '../../../../components/common/inputs/Input';
import ItemMultiple from '../../../../components/common/information/ItemMultiple';
import empresaService from '../../../../services/empresaService';
import { useToast } from '../../../../context/ToastContext';

const VincularSocioModal = ({ isOpen, onClose, socioSeleccionado, onVincular }) => {
    const { showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    const [codigo, setCodigo] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = async () => {
        if (!socioSeleccionado?.id) {
            showDanger(null, 'Empresa no válida');
            return;
        }

        if (!codigo.trim()) {
            setError(true);
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const response = await empresaService.verificarCodigo(socioSeleccionado.id, codigo);

            if (response.success) {
                setLoading(false);
                setCodigo('');
                onClose();
                onVincular(socioSeleccionado);
            } else {
                setLoading(false);
                showDanger(null, response.message || 'Código incorrecto');
            }
        } catch (err) {
            setLoading(false);
            showDanger(null, 'Revisa tu conexión a internet');
        }
    };

    const handleClose = () => {
        if (loading) return;
        setCodigo('');
        setError('');
        onClose();
    };

    if (!socioSeleccionado && isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Vincular Socio"
            confirmText="Confirmar"
            confirmColorClass="btn-primary"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock:'10px' }}
        >
        
                <ItemMultiple
                    title={socioSeleccionado?.name || 'Sin nombre'}
                    description={socioSeleccionado?.description || 'Socio'}
                    icon={socioSeleccionado?.logo_tipo ? undefined : 'building'}
                    logo={socioSeleccionado?.logo_tipo}
                />
           
            <Input
                label="Código privado"
                value={codigo}
                onChange={(e) => {
                    setCodigo(e.target.value);
                    if (error) setError('');
                }}
                error={error}
                required
            />
        </ModalCentro>
    );
};

export default VincularSocioModal;
