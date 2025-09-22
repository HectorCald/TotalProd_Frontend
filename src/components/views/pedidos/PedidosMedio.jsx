import React, { useState } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemView from '../../common/ItemView';
import PanelPedidos from './PanelPedidos';

function PedidosMedio({ isOpen, setIsOpen }) {
    const [isPedidosOpen, setIsPedidosOpen] = useState(false);
    const [tipoPedido, setTipoPedido] = useState('');

    const handleTipoPedido = (tipo) => {
        setIsPedidosOpen(true);
        setTipoPedido(tipo);
    }

    return (
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
                {/*
                <ItemView
                    title='Materia Prima'
                    description='Ver y gestionar los pedidos de materia prima'
                    icon='leaf'
                    arrow={true}
                    onClick={() => handleTipoPedido('acopio')}
                />
                */}
            </div>
            <PanelPedidos 
                isOpen={isPedidosOpen} 
                setIsOpen={setIsPedidosOpen} 
                tipoPedido={tipoPedido} 
            />
        </ViewModal>
    );
}

export default PedidosMedio;
