import React, { useState } from 'react';
import styles from './Reportes.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Select from '../../common/Select';
import DatoTiempo from '../../common/DatoTiempo';
import Boton from '../../common/Boton';

const areas = [
    { value: 'acopio', label: 'Acopio', icon: 'leaf' },
    { value: 'almacen', label: 'Almacén', icon: 'store' },
    { value: 'produccion', label: 'Producción', icon: 'factory' },
];
function Reportes({ isOpen, setIsOpen, usuario }) {
    const [selectedAreas, setSelectedAreas] = useState('');
    const [dataFecha, setDataFecha] = useState({
        inicio: 'Seleccione una fecha',
        fin: 'Seleccione una fecha',
    });
    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Reportes</h1>
                <p className={styles.subTitle}>AREA</p>
                <div className={styles.content}>
                    <Select
                        placeholder="Seleccionar opción"
                        options={areas}
                        value={selectedAreas}
                        onChange={setSelectedAreas}
                        icon="user"
                    />
                </div>
                <p className={styles.subTitle}>PERIODO</p>
                <div className={styles.content}>
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
                </div>
                <p className={styles.subTitle}>Se va a generar un documento PDF con el reporte del AREA seleccioanda</p>
                <Boton
                    className='btn-original'
                    label='Generar'
                    style={{ marginTop: 'auto' }}
                />
            </div>
        </View>
    );
}
export default Reportes;