import React, { useState } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemView from '../../common/ItemView';
import PanelMovimientos from './PanelMovimientos';


function MovimientosMedio({ isOpen, setIsOpen }) {
    const [isMovimientosOpen, setIsMovimientosOpen] = useState(false);
    const [tipoMovimiento, setTipoMovimiento] = useState('');

    const handleTipoMovimiento = (tipo) => {
        setIsMovimientosOpen(true);
        setTipoMovimiento(tipo);
    }

    return (
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
            <PanelMovimientos 
                isOpen={isMovimientosOpen} 
                setIsOpen={setIsMovimientosOpen} 
                tipoMovimiento={tipoMovimiento} 
            />
        </ViewModal>
    );
}
export default MovimientosMedio;