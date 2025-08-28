import React, { useState } from 'react';
import styles from './Proveedores.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputSearch from '../../common/InputSearch';
import ItemView from '../../common/ItemView';
import VerProveedor from './VerProveedor';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';

const personaData = [
    {
        nombre: 'Héctor Ortiz',
        telefono: '999888777',
        icon: 'id-card',
        direccion: 'Av. Siempre Viva 123',
        pais: 'Bolivia',
        ciudad: 'La Paz',
        totalPedidos: 15,
        totalDinero: 2500,
    },
]


function Proveedores({ isOpen, setIsOpen }) {
    const [isOpenVerProveedor, setIsOpenVerProveedor] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const [isOpenEditarAgregar, setIsOpenEditarAgregar] = useState(false);
    const handleProveedor = (persona) => {
        setIsOpenVerProveedor(true);
        setInfoPersona(personaData[persona]);
    };
    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Proveedores</h1>
                <InputSearch
                    placeholder='Buscar proveedor'
                    type="text"
                />
                <div className={styles.content} >
                    {
                        personaData?.map((dato, index) => (
                            <ItemView
                                key={dato.id || index} // usa id si existe
                                title={dato.nombre}
                                description={dato.ciudad + ' - ' + dato.pais}
                                icon={dato.icon}
                                arrow={true}
                                onClick={() => { handleProveedor(index) }}
                            />
                        ))

                    }
                </div>
                <div className={styles.buttonFooter}>
                    <Boton
                        className='btn-original'
                        label='Agregar cliente'
                        onClick={() => setIsOpenEditarAgregar(true)}
                    />
                </div>
            </div>
            <EditarAgregar isOpen={isOpenEditarAgregar} setIsOpen={setIsOpenEditarAgregar} tipo='agregar'/>
            <VerProveedor isOpen={isOpenVerProveedor} setIsOpen={setIsOpenVerProveedor} usuario={infoPersona} />
        </View>
    );
}
export default Proveedores;