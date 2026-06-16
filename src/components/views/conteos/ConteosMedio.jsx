import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/old/HeaderModal';
import ItemView from '../../common/old/ItemView';
import PanelConteos from './PanelConteos';
import { useUser } from '../../../context/UserContext';
import { isSoloVentas } from '../../../utils/empresaHelper';


function ConteosMedio({ isOpen, setIsOpen }) {
    const { user } = useUser();
    const soloVentas = isSoloVentas(user);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [tipoConteo, setTipoConteo] = useState('almacen');

    // Si solo hay una opción (solo ventas), abrir directamente
    useEffect(() => {
        if (isOpen) {
            if (soloVentas) {
                // Solo hay una opción, abrir directamente
                setIsOpen(false);
                setIsPanelOpen(true);
                setTipoConteo('almacen');
            }
        }
    }, [isOpen, soloVentas, setIsOpen]);

    const handleTipoConteo = (tipo) => {
        setIsOpen(false);
        setIsPanelOpen(true);
        setTipoConteo(tipo);
    };

    const handleConteosClose = () => {
        setIsPanelOpen(false);
        setTipoConteo('almacen');
        setIsOpen(false);
    };

    // Si solo hay una opción, no mostrar el modal, solo el componente
    if (soloVentas) {
        return (
            <PanelConteos 
                isOpen={isPanelOpen} 
                setIsOpen={handleConteosClose} 
                tipoConteo={tipoConteo || 'almacen'} 
            />
        );
    }

    return (
        <>
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen} >
            <HeaderModal
                title="Conteos"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <ItemView
                    title='Almacén General'
                    description='Ver y gestionar los conteos del almacén general'
                    icon='store'
                    arrow={true}
                    onClick={() => handleTipoConteo('almacen')}
                />
                <ItemView
                    title='Materia Prima'
                    description='Ver y gestionar los conteos de materia prima'
                    icon='factory'
                    arrow={true}
                    onClick={() => handleTipoConteo('acopio')}
                />
            </div>
        </ViewModal>
        <PanelConteos isOpen={isPanelOpen} setIsOpen={setIsPanelOpen} tipoConteo={tipoConteo} />
        </>
    );
}

export default ConteosMedio;


