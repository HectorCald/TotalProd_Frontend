import React, { useState } from 'react';
import styles from './Registros.module.css';
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
import Formulario from './Formulario';

const registroData = [
    {
        fecha: '2024-10-01',
        producto: 'Ajo Molido',
        gramaje: 111,
        lote: 123,
        proceso: 'Cernido',
        microondas: '60',
        envasesTerminados: 222,
        fechaVencimiento: '2029-10',

        fechaVerificación: '2024-10-01',
        cantidadVerificada: 333,
        observaciones: 'Ninguna',
        icon: 'file'
    },
]


function Registros({ isOpen, setIsOpen }) {
    const [isOpenVerRegistro, setIsOpenVerRegistro] = useState(false);
    const [isOpenFormulario, setIsOpenFormulario] = useState(false);
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
                <h1 className={styles.title}>Registros</h1>
                <InputSearch
                    placeholder='Buscar registro'
                    type="text"
                />
                <Filtros options={opciones} />
                <div className={styles.content} >
                    {
                        registroData?.map((dato, index) => (
                            <ItemView
                                key={dato.id || index} // usa id si existe
                                title={dato.producto}
                                description={dato.lote + ' - ' + dato.gramaje + ' gr.'}
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
                        label='Nuevo registro'
                        onClick={() => { setIsOpenFormulario(true); }}
                    />
                </div>
            </div>
            {/* Modal de nuevo registro*/}
            <Formulario isOpen={isOpenFormulario} setIsOpen={setIsOpenFormulario} />
            {/* Modal de ver registro*/}
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
export default Registros;