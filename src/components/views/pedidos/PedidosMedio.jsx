import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemView from '../../common/ItemView';
import PanelPedidos from './PanelPedidos';
import AlmacenAcopio from '../almacen-acopio/AlmacenAcopio';
import { useUser } from '../../../context/UserContext';
import { isSoloVentas } from '../../../utils/empresaHelper';

function PedidosMedio({ isOpen, setIsOpen }) {
    const { user } = useUser();
    const soloVentas = isSoloVentas(user);
    const [isPedidosOpen, setIsPedidosOpen] = useState(false);
    const [tipoPedido, setTipoPedido] = useState('');

    // Si solo hay una opción (solo ventas), abrir directamente
    useEffect(() => {
        if (isOpen) {
            if (soloVentas) {
                // Solo hay una opción, abrir directamente
                setIsOpen(false);
                setIsPedidosOpen(true);
                setTipoPedido('almacen');
            }
        }
    }, [isOpen, soloVentas, setIsOpen]);

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
        setIsOpen(false);
    }

    // Si solo hay una opción, no mostrar el modal, solo el componente
    if (soloVentas) {
        return (
            <PanelPedidos 
                isOpen={isPedidosOpen} 
                setIsOpen={handlePedidosClose} 
                tipoPedido={tipoPedido || 'almacen'} 
            />
        );
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
