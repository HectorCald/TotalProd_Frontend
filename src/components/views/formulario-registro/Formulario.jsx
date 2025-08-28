import React, { useState } from 'react';
import styles from './Formulario.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Select from '../../common/Select';
import DatoTiempo from '../../common/DatoTiempo';

const proceso = [
    { value: 'cernido', label: 'Cernido', icon: 'filter' },
    { value: 'seleccion', label: 'Selección', icon: 'check-square' },
    { value: 'ninguno', label: 'Ninguno', icon: 'x-circle' },
];
function Formulario({ isOpen, setIsOpen, data='', tipo}) {

    const [selectedProceso, setSelectedProceso] = useState('');
    const [dataMov, setDataMov] = useState(data);
    const [dataFecha, setDataFecha] = useState('');
    return (
        <ViewModal ViewModal isOpen={isOpen} setIsOpen={setIsOpen} >
            <HeaderModal
                title={tipo === 'editar' ? 'Editar registro' : 'Nuevo registro'}
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>INFORMACIÓN DEL MOVIMIENTO</p>
                <InputNormal
                    tipo="text"
                    value={dataMov.producto}
                    placeholder='Producto'
                    onChange={(e) => setDataMov({ ...dataMov, producto: e.target.value })}
                />
                <div className={styles.horizontal} >
                    <InputNormal
                        tipo="number"
                        value={dataMov.gramaje}
                        placeholder='Gramaje'
                        onChange={(e) => setDataMov({ ...dataMov, gramaje: e.target.value })}
                    />
                    <InputNormal
                        tipo="number"
                        value={dataMov.lote}
                        placeholder='Lote'
                        onChange={(e) => setDataMov({ ...dataMov, lote: e.target.value })}
                    />
                </div>

                <div className={styles.content}>
                    <Select
                        placeholder="Proceso"
                        options={proceso}
                        value={selectedProceso}
                        onChange={setSelectedProceso}
                        icon="cog"
                    />
                </div>
                <div className={styles.horizontal} >
                    <InputNormal
                        tipo="number"
                        value={dataMov.microondas}
                        placeholder='Microondas'
                        onChange={(e) => setDataMov({ ...dataMov, microondas: e.target.value })}
                    />
                    <InputNormal
                        tipo="number"
                        value={dataMov.envasesTerminados}
                        placeholder='Acabado'
                        onChange={(e) => setDataMov({ ...dataMov, pais: e.target.value })}
                    />
                </div>

                <div className={styles.content}>
                    <DatoTiempo
                        label="Fecha de vencimiento"
                        value={dataMov.fechaVencimiento}
                        onChange={(fecha) => setDataFecha({
                            ...dataFecha,
                            fin: fecha || 'Seleccione una fecha'
                        })}
                    />
                </div>

                <Boton
                    className='btn-original'
                    label='Registrar'
                    style={{ marginTop: 'auto' }}
                />
            </div>
        </ViewModal >
    );
}
export default Formulario;