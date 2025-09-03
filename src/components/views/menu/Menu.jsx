import styles from './Menu.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import { FUNCTIONS } from '../../../constants/functions';
import { ACOPIO_FUNCTIONS } from '../../../constants/acopioFunctions';
import { ALMACEN_FUNCTIONS } from '../../../constants/almacenFunctions';
import ItemLine from '../../common/ItemLine';
import { useState } from 'react';
import Personal from '../personal/Personal';
import Clientes from '../clientes/Clientes';
import Proveedores from '../proveedores/Proveedores';
import Pagos from '../pagos/Pagos';
import Reportes from '../reportes/Reportes';
import CajaMedio from '../caja/CajaMedio';
import Formulario from '../formulario-registro/Formulario'
import Registros from '../formulario-registro/Registros';
import AlmacenMedio from '../almacen-acopio/AlmacenMedio';


function Menu({ isOpen, setIsOpen, onViewChange }) {
    const [activeView, setActiveView] = useState(null);

    const handleViewOpen = (viewName) => {
        setActiveView(viewName);
    };

    const handleViewClose = () => {
        setActiveView(null);
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Menu</h1>
                <p className={styles.subTitle}>General</p>
                <div className={styles.opciones}>
                    {FUNCTIONS.map((item, index) => (
                        <ItemLine
                            key={index}
                            icon={item.icon}
                            title={item.name}
                            onClick={() => handleViewOpen(item.view)}
                        />
                    ))}
                </div>
                <p className={styles.subTitle}>Almacen</p>
                <div className={styles.opciones}>
                    {ALMACEN_FUNCTIONS.map((item, index) => (
                        <ItemLine
                            key={index}
                            icon={item.icon}
                            title={item.name}
                            onClick={() => handleViewOpen(item.view)}
                        />
                    ))}
                </div>
                <p className={styles.subTitle}>Acopio</p>
                <div className={styles.opciones}>
                    {ACOPIO_FUNCTIONS.map((item, index) => (
                        <ItemLine
                            key={index}
                            icon={item.icon}
                            title={item.name}
                            onClick={() => handleViewOpen(item.view)}
                        />
                    ))}
                </div>
                
            </div>

            <Personal
                isOpen={activeView === 'personal'}
                setIsOpen={() => handleViewClose()}
            />
            <Clientes
                isOpen={activeView === 'clientes'}
                setIsOpen={() => handleViewClose()}
            />
            <Proveedores
                isOpen={activeView === 'proveedores'}
                setIsOpen={() => handleViewClose()}
            />
            <Pagos
                isOpen={activeView === 'pagos'}
                setIsOpen={() => handleViewClose()}
            />
            <Reportes
                isOpen={activeView === 'reportes'}
                setIsOpen={() => handleViewClose()}
            />
            <CajaMedio
                isOpen={activeView === 'caja'}
                setIsOpen={() => handleViewClose()}
            />
            <Formulario
                isOpen={activeView === 'formulario'}
                setIsOpen={() => handleViewClose()}
            />
            <Registros
                isOpen={activeView === 'registros-produccion'}
                setIsOpen={() => handleViewClose()}
            />
            <AlmacenMedio
                isOpen={activeView === 'almacen-medio-acopio'}
                setIsOpen={() => handleViewClose()}
            />
        </View>

    );
}
export default Menu;