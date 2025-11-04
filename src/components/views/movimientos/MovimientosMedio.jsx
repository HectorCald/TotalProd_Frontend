import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemView from '../../common/ItemView';
import PanelMovimientos from './PanelMovimientos';
import { useUser } from '../../../context/UserContext';
import { isSoloVentas } from '../../../utils/empresaHelper';


function MovimientosMedio({ isOpen, setIsOpen }) {
    const { user } = useUser();
    const soloVentas = isSoloVentas(user);
    const [isMovimientosOpen, setIsMovimientosOpen] = useState(false);
    const [tipoMovimiento, setTipoMovimiento] = useState('');

    // Si solo hay una opción (solo ventas), abrir directamente
    useEffect(() => {
        if (isOpen) {
            if (soloVentas) {
                // Solo hay una opción, abrir directamente
                setIsOpen(false);
                setIsMovimientosOpen(true);
                setTipoMovimiento('almacen');
            }
        }
    }, [isOpen, soloVentas, setIsOpen]);

    const handleTipoMovimiento = (tipo) => {
        // Cerrar el modal del medio
        setIsOpen(false);
        // Abrir directamente la vista específica
        setIsMovimientosOpen(true);
        setTipoMovimiento(tipo);
    }

    // Si solo hay una opción, no mostrar el modal, solo el componente
    if (soloVentas) {
        return (
            <PanelMovimientos 
                isOpen={isMovimientosOpen} 
                setIsOpen={() => {
                    setIsMovimientosOpen(false);
                    setIsOpen(false);
                }} 
                tipoMovimiento={tipoMovimiento || 'almacen'} 
            />
        );
    }

    return (
        <>  
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen} >
            <HeaderModal
                title="Movimientos"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <ItemView
                    title='Almacén General'
                    description='Ver y gestionar los movimientos del almacén general'
                    icon='store'
                    arrow={true}
                    onClick={() => handleTipoMovimiento('almacen')}
                />
                <ItemView
                    title='Materia Prima'
                    description='Ver y gestionar los movimientos de materia prima'
                    icon='factory'
                    arrow={true}
                    onClick={() => handleTipoMovimiento('acopio')}
                />
            </div>
        </ViewModal>
        {/* Movimientos */}
        <PanelMovimientos isOpen={isMovimientosOpen} setIsOpen={setIsMovimientosOpen} tipoMovimiento={tipoMovimiento} />
        </>
    );
}
export default MovimientosMedio;