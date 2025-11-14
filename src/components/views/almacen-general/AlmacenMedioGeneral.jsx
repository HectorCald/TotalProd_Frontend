import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemView from '../../common/ItemView';
import AlmacenGeneral from './AlmacenGeneral';

import AlmacenGeneralAuxiliar from '../almacen-general-auxiliar/AlmacenGeneral-Auxiliar';
import { OFFLINE_NETWORK_FLAG } from '../../../utils/offlineNetworkInterceptor';


function AlmacenMedioGeneral({ isOpen, setIsOpen }) {
    const [isAlmacenOpen, setIsAlmcenOpen] = useState(false);
    const [type, setType] = useState('');
    const [isAlmacenAuxiliarOpen, setIsAlmacenAuxiliarOpen] = useState(false);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    const updateOfflineFlag = useCallback(() => {
        try {
            setIsOfflineMode(localStorage.getItem(OFFLINE_NETWORK_FLAG) === 'true');
        } catch {
            setIsOfflineMode(false);
        }
    }, []);

    useEffect(() => {
        updateOfflineFlag();
        const handler = () => updateOfflineFlag();
        window.addEventListener('offline-mode-changed', handler);
        window.addEventListener('storage', handler);
        return () => {
            window.removeEventListener('offline-mode-changed', handler);
            window.removeEventListener('storage', handler);
        };
    }, [updateOfflineFlag]);
    const handleTypeAlmacen = (tipo) => {
        // Cerrar el modal del medio
        setIsOpen(false);
        // Abrir la vista correcta según el tipo
        if (tipo === 'conteo' || tipo === 'cotizar') {
            setIsAlmacenAuxiliarOpen(true);
            setType(tipo);
        } else {
            setIsAlmcenOpen(true);
            setType(tipo);
        }
    }

    return (
        <>
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
                        onClick={() => handleTypeAlmacen('salida')}
                    />
                    <ItemView
                        title='Entrada'
                        description='Realizar una entrada de productos al almacén'
                        icon='down-arrow-alt'
                        arrow={true}
                        onClick={() => handleTypeAlmacen('entrada')}
                        disabled={isOfflineMode}
                    />

                    <ItemView
                        title='Nuevo Pedido'
                        description='Realizar un nuevo pedido de productos'
                        icon='cart-add'
                        arrow={true}
                        onClick={() => handleTypeAlmacen('pedido')}
                        disabled={isOfflineMode}
                    />
                    {/*
                <ItemView
                    title='Transferencia'
                    description='Realizar una transferencia de productos entre sucursales'
                    icon='transfer'
                    arrow={true}
                    onClick={()=> handleTypeAlmacen('almacen')}
                /> */}
                    <ItemView
                        title='Conteo'
                        description='Ver y gestionar el conteo de productos en el almacén'
                        icon='calculator'
                        arrow={true}
                        onClick={() => handleTypeAlmacen('conteo')}
                        disabled={isOfflineMode}
                    />
                    <ItemView
                        title='Productos'
                        description='Ver y gestionar los productos en el almacén'
                        icon='package'
                        arrow={true}
                        onClick={() => handleTypeAlmacen('almacen')}
                        disabled={isOfflineMode}
                    />
                    <ItemView
                        title='Cotizar'
                        description='Ver y gestionar cotizaciones de productos'
                        icon='file'
                        arrow={true}
                        onClick={() => handleTypeAlmacen('cotizar')}
                        disabled={isOfflineMode}
                    />
                </div>

            </ViewModal >
            {/* Almcen general */}
            <AlmacenGeneral isOpen={isAlmacenOpen} setIsOpen={setIsAlmcenOpen} tipo={type} />
            <AlmacenGeneralAuxiliar isOpen={isAlmacenAuxiliarOpen} setIsOpen={setIsAlmacenAuxiliarOpen} tipo={type} />
        </>
    );
}
export default AlmacenMedioGeneral;