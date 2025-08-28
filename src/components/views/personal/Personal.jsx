import React, { useState } from 'react';
import styles from './Personal.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputSearch from '../../common/InputSearch';
import ItemView from '../../common/ItemView';
import VerPersona from './VerPersona';

const personalData = [
    {
        nombre: 'Héctor Ortiz',
        email: 'hector@example.com',
        telefono: '999-888-777',
        icon: 'user',
        rol: 'Administrador',
        estado: 'Activo',
        permisos: {
            eliminar: true,
            editar: true,
            crear: false,
            anular: false
        }
    },
]


function Personal({ isOpen, setIsOpen }) {
    const [isOpenVerPersona, setIsOpenVerPersona] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const handlePersona = (persona) => {
        setIsOpenVerPersona(true);
        setInfoPersona(personalData[persona]);
    };
    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Personal</h1>
                <InputSearch
                    placeholder='Buscar persona'
                    type="text"
                />
                <div className={styles.content} >
                    {
                        personalData?.map((dato, index) => (
                            <ItemView
                                key={dato.id || index} // usa id si existe
                                title={dato.nombre}
                                description={dato.email}
                                icon={dato.icon}
                                arrow={true}
                                onClick={() => { handlePersona(index) }}
                            />
                        ))

                    }
                </div>
            </div>
            <VerPersona isOpen={isOpenVerPersona} setIsOpen={setIsOpenVerPersona} usuario={infoPersona} />
        </View>
    );
}
export default Personal;