import React, { useState } from 'react';
import styles from './Movimientos.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputSearch from '../../common/InputSearch';
import ItemView from '../../common/ItemView';
import VerRegistro from './VerRegistro';
import Filtros from '../../common/Filtros';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemLine from '../../common/ItemLine';
import Boton from '../../common/Boton';
import DatoTiempo from '../../common/DatoTiempo';
import NuevoMovimiento from './NuevoMovimiento';

const registroData = [
    {
        fecha: '2024-10-01',
        monto: 1500,
        concepto: 'Compra de insumos',
        tipo: 'Salida',
        icon: 'credit-card',
        formaPago: 'Transferencia',
        observaciones: 'Pago realizado mediante transferencia bancaria',
    },
]


function Movimientos({ isOpen, setIsOpen }) {
    const [isOpenVerRegistro, setIsOpenVerRegistro] = useState(false);
    const [isOpenNuevo, setIsOpenNuevo] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);

    const [isOpenArea, setOpenArea] = useState(false);
    const [isOpenFecha, setOpenFecha] = useState(false);

    const [dataFecha, setDataFecha] = useState({
        inicio: 'Seleccione una fecha',
        fin: 'Seleccione una fecha',
    });


    const [filtroActivo, setFiltroActivo] = useState('todos');
    const handleRegistro = (registro) => {
        setIsOpenVerRegistro(true);
        setInfoPersona(registroData[registro]);
    };
    const opciones = [

        {
            label: 'Tipo',
            active: filtroActivo === 'area',
            onClick: () => setOpenArea(true)
        },
        {
            label: 'Fecha',
            active: filtroActivo === 'fecha',
            onClick: () => setOpenFecha(true)
        }
    ];
    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Movimientos de caja</h1>
                <InputSearch
                    placeholder='Buscar movimiento'
                    type="text"
                />
                <Filtros options={opciones} />
                <div className={styles.content} >
                    {
                        registroData?.map((dato, index) => (
                            <ItemView
                                key={dato.id || index} // usa id si existe
                                title={dato.concepto}
                                description={dato.tipo + ' - ' + dato.monto + ' BOB'}
                                icon={dato.icon}
                                arrow={true}
                                onClick={() => { handleRegistro(index) }}
                            />
                        ))

                    }
                </div>
                <div className={styles.buttonFooter}>
                    <Boton
                        className='btn-original'
                        label='Agregar'
                        onClick={() => { setIsOpenNuevo(true) }}
                    />
                </div>
            </div>
            {/* Modal de Ver Registro*/}
            <NuevoMovimiento isOpen={isOpenNuevo} setIsOpen={setIsOpenNuevo} />

            <VerRegistro isOpen={isOpenVerRegistro} setIsOpen={setIsOpenVerRegistro} registro={infoPersona} />
            {/* Modal de tipo*/}
            <ViewModal isOpen={isOpenArea} setIsOpen={setOpenArea}>
                <HeaderModal
                    title="Tipo de movimiento"
                    onClose={() => setOpenArea(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Selecciona una opción para filtrar todos los pagos segun el area.</p>
                    <ItemLine
                        title='Entradas'
                        icon='factory'
                        onClick={() => setFiltroActivo('produccion')}
                    />
                    <ItemLine
                        title='Salidas'
                        icon='leaf'
                        onClick={() => setFiltroActivo('acopio')}
                    />
                </div>
            </ViewModal>
            {/* Modal de fecha*/}
            <ViewModal isOpen={isOpenFecha} setIsOpen={setOpenFecha}>
                <HeaderModal
                    title="Fecha"
                    onClose={() => setOpenFecha(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Selecciona el rango de fechas para filtrar todos los pagos en ese periodo.</p>
                    <DatoTiempo
                        label="Inicio"
                        value={dataFecha.inicio}
                        onChange={(fecha) => setDataFecha({
                            ...dataFecha,
                            inicio: fecha || 'Seleccione una fecha'
                        })}
                    />
                    <DatoTiempo
                        label="Fin"
                        value={dataFecha.fin}
                        onChange={(fecha) => setDataFecha({
                            ...dataFecha,
                            fin: fecha || 'Seleccione una fecha'
                        })}
                    />
                    <div className={styles.space} ></div>
                    <Boton
                        className='btn-default'
                        label='Limpiar filtros'
                        style={{ marginTop: 'auto' }}
                    />
                    <Boton
                        className='btn-original'
                        label='Aceptar'
                        style={{ marginTop: 'auto' }}
                    />
                </div>
            </ViewModal>
        </View>

    );
}
export default Movimientos;