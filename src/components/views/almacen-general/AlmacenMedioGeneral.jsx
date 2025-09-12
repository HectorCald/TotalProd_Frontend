import React, { useState } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemView from '../../common/ItemView';
import AlmacenGeneral from './AlmacenGeneral';


function AlmacenMedioGeneral({ isOpen, setIsOpen }) {
    const [isAlmacenOpen, setIsAlmcenOpen] = useState(false);
    const [type, setType] = useState('');

    const handleTypeAlmacen = (tipo) => {
        setIsAlmcenOpen(true);
        setType(tipo);
    }

    return (
        <ViewModal ViewModal isOpen={isOpen} setIsOpen={setIsOpen} >
            <HeaderModal
                title="Almacén General"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <ItemView
                    title='Salida o Venta'
                    description='Realizar una salida de productos del almacén'
                    icon='up-arrow-alt'
                    arrow={true}
                    onClick={()=> handleTypeAlmacen('salida')}
                />
                <ItemView
                    title='Entrada'
                    description='Realizar una entrada de productos al almacén'
                    icon='down-arrow-alt'
                    arrow={true}
                    onClick={()=> handleTypeAlmacen('entrada')}
                />
                <ItemView
                    title='Productos'
                    description='Ver y gestionar los productos en el almacén'
                    icon='package'
                    arrow={true}
                    onClick={()=> handleTypeAlmacen('almacen')}
                />
            </div>
            {/* Almcen general */}
            <AlmacenGeneral isOpen={isAlmacenOpen} setIsOpen={setIsAlmcenOpen} tipo={type} />
        </ViewModal >
    );
}
export default AlmacenMedioGeneral;