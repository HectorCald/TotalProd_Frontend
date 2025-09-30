import React, { useState } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemView from '../../common/ItemView';
import PanelPedidos from './PanelPedidos';
import AlmacenAcopio from '../almacen-acopio/AlmacenAcopio';

function PedidosMedio({ isOpen, setIsOpen }) {
    const [isPedidosOpen, setIsPedidosOpen] = useState(false);
    const [tipoPedido, setTipoPedido] = useState('');

    const handleTipoPedido = (tipo) => {
        // Cerrar el modal del medio
        setIsOpen(false);
        // Abrir directamente la vista específica
        setIsPedidosOpen(true);
        setTipoPedido(tipo);
    }

    const handlePedidosClose = () => {
        setIsPedidosOpen(false);
        setTipoPedido('');
    }

    return (
        <>
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen} >
            <HeaderModal
                title="Pedidos"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <ItemView
                    title='Almacén General'
                    description='Ver y gestionar los pedidos del almacén general'
                    icon='package'
                    arrow={true}
                    onClick={() => handleTipoPedido('almacen')}
                />
                <ItemView
                    title='Materia Prima'
                    description='Ver y gestionar los pedidos de materia prima'
                    icon='leaf'
                    arrow={true}
                    onClick={() => handleTipoPedido('acopio')}
                />
            </div>
            
        </ViewModal>
        {/* Pedidos */}
        <PanelPedidos 
            isOpen={isPedidosOpen && (tipoPedido === 'almacen' || tipoPedido === 'acopio')} 
            setIsOpen={handlePedidosClose} 
            tipoPedido={tipoPedido} 
        />
        </>
    );
}

export default PedidosMedio;
