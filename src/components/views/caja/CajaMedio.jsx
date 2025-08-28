import React, { useState } from 'react';
import styles from './CajaMedio.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemView from '../../common/ItemView';
import NuevoMovimiento from './NuevoMovimiento';
import Movimientos from './Movimientos';

function CajaMedio({ isOpen, setIsOpen }) {
    const [isEntradaOpen, setIsEntradaOpen] = useState(false);
    const [isMovimientosOpen, setIsMovimientosOpen] = useState(false);
    return (
        <ViewModal ViewModal isOpen={isOpen} setIsOpen={setIsOpen} >
            <HeaderModal
                title="Caja chica"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <ItemView
                    title='Nuevo movimiento'
                    description='Registrar una entrada de dinero a la caja'
                    icon='plus'
                    arrow={true}
                    onClick={() => setIsEntradaOpen(true)}
                />
                <ItemView
                    title='Ver movimientos'
                    description='Ver el historial de movimientos de la caja'
                    icon='file'
                    arrow={true}
                    onClick={()=> setIsMovimientosOpen(true)}
                />
            </div>
            <NuevoMovimiento isOpen={isEntradaOpen} setIsOpen={setIsEntradaOpen} />
            <Movimientos isOpen={isMovimientosOpen} setIsOpen={setIsMovimientosOpen} />
        </ViewModal >
    );
}
export default CajaMedio;