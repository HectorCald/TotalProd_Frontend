import React, { useState } from 'react';
import styles from './Clientes.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputSearch from '../../common/InputSearch';
import ItemView from '../../common/ItemView';
import VerCliente from './VerCliente';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';

const personaData = [
    {
        icon: 'id-card',
        id:'CLTP-001',
        nombre: 'Héctor Ortiz',
        telefono: '999888777',
        direccion: 'Av. Siempre Viva 123',
        pais: 'Bolivia',
        ciudad: 'La Paz',
        totalPedidos: 15,
        totalDinero: 2500,
    },
]


function Clientes({ isOpen, setIsOpen }) {
    const [isOpenVerCliente, setIsOpenVerCliente] = useState(false);
    const [isOpenEditarAgregar, setIsOpenEditarAgregar] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);

    const handleCliente = (persona) => {
        setIsOpenVerCliente(true);
        setInfoPersona(personaData[persona]);
    };


    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Clientes</h1>
                <InputSearch
                    placeholder='Buscar cliente'
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
                                onClick={() => { handleCliente(index) }}
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
            {/* Modal de Ver CLiente*/}
            <VerCliente isOpen={isOpenVerCliente} setIsOpen={setIsOpenVerCliente} usuario={infoPersona} />

            {/* Modal de Editar/Agregar*/}
            <EditarAgregar isOpen={isOpenEditarAgregar} setIsOpen={setIsOpenEditarAgregar} tipo='agregar' />

        </View>
    );
}
export default Clientes;