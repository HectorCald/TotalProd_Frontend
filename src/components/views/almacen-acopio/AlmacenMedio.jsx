import React, { useState } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemView from '../../common/ItemView';
import AlmacenAcopio from './AlmacenAcopio';


function AlmacenMedio({ isOpen, setIsOpen }) {
    const [isAlmacenOpen, setIsAlmcenOpen] = useState(false);
    const [type, setType] = useState('');

    const handleTypeAlmacen = (tipo) => {
        setIsAlmcenOpen(true);
        setType(tipo);
    }

    return (
        <ViewModal ViewModal isOpen={isOpen} setIsOpen={setIsOpen} >
            <HeaderModal
                title="Materia Prima"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <ItemView
                    title='Salida'
                    description='Realizar una salida de materia prima del almacén'
                    icon='up-arrow-alt'
                    arrow={true}
                    onClick={()=> handleTypeAlmacen('salida')}
                />
                <ItemView
                    title='Entrada'
                    description='Realizar una entrada de materia prima al almacén'
                    icon='down-arrow-alt'
                    arrow={true}
                    onClick={()=> handleTypeAlmacen('entrada')}
                />
                <ItemView
                    title='Nuevo Pedido'
                    description='Realizar un nuevo pedido de materia prima'
                    icon='cart-add'
                    arrow={true}
                    onClick={()=> handleTypeAlmacen('pedido')}
                />
                <ItemView
                    title='Almacen'
                    description='Ver y gestionar los productos en el almacén'
                    icon='package'
                    arrow={true}
                    onClick={()=> handleTypeAlmacen('almacen')}
                />
            </div>
            {/* Almcen acopio */}
            <AlmacenAcopio isOpen={isAlmacenOpen} setIsOpen={setIsAlmcenOpen} tipo={type} />
        </ViewModal >
    );
}
export default AlmacenMedio;