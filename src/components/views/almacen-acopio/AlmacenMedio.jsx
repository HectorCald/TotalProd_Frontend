import React, { useState } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemView from '../../common/ItemView';
import AlmacenAcopio from './AlmacenAcopio';
import AlmacenAcopioAuxiliar from '../almacen-acopio-auxiliar/AlmacenAcopio-Auxiliar';


function AlmacenMedio({ isOpen, setIsOpen }) {
    const [isAlmacenOpen, setIsAlmcenOpen] = useState(false);
    const [isAuxOpen, setIsAuxOpen] = useState(false);
    const [type, setType] = useState('');

    const handleTypeAlmacen = (tipo) => {
        // Cerrar el modal del medio
        setIsOpen(false);
        if (tipo === 'conteo') {
            setIsAuxOpen(true);
            setType('conteo');
        } else {
            // Abrir directamente la vista específica
            setIsAlmcenOpen(true);
            setType(tipo);
        }
    }

    return (
        <>  {/* Almcen acopio */}
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
                    title='Conteo'
                    description='Realizar conteo físico (pesaje) de materia prima'
                    icon='calculator'
                    arrow={true}
                    onClick={()=> handleTypeAlmacen('conteo')}
                />
                <ItemView
                    title='Materia Prima'
                    description='Ver y gestionar los productos en el almacén'
                    icon='package'
                    arrow={true}
                    onClick={()=> handleTypeAlmacen('almacen')}
                />
            </div>
            
        </ViewModal >
        {/* Almcen acopio */}
        <AlmacenAcopio isOpen={isAlmacenOpen} setIsOpen={setIsAlmcenOpen} tipo={type} />
        <AlmacenAcopioAuxiliar isOpen={isAuxOpen} setIsOpen={setIsAuxOpen} tipo={type} />
        </>
    );
}
export default AlmacenMedio;