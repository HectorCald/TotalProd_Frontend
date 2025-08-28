import styles from './Menu.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ListaDesplegable from '../../common/ListaDesplegable';
import { FUNCTIONS } from '../../../constants/functions';
import { PRODUCTION_FUNCTIONS } from '../../../constants/productionFunctions';
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
import AlmacenAcopio from '../almacen-acopio/AlmacenAcopio';


function Menu({ isOpen, setIsOpen, onViewChange }) {
    const [activeList, setActiveList] = useState(null);

    const handleListToggle = (listName) => {
        setActiveList(activeList === listName ? null : listName);
    };

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
                <ListaDesplegable
                    title="Administración"
                    icon="user-circle"
                    isOpen={activeList === "Administración"}
                    onToggle={handleListToggle}
                >
                    {FUNCTIONS.map((func) => (
                        <ItemLine
                            key={func.name}
                            title={func.name}
                            icon={func.icon}
                            onClick={() => handleViewOpen(func.view)}
                        />
                    ))}
                </ListaDesplegable>
                <ListaDesplegable
                    title="Producción"
                    icon="factory"
                    isOpen={activeList === "Producción"}
                    onToggle={handleListToggle}
                >
                    {PRODUCTION_FUNCTIONS.map((func) => (
                        <ItemLine
                            key={func.name}
                            title={func.name}
                            icon={func.icon}
                            onClick={() => handleViewOpen(func.view)}
                        />
                    ))}
                </ListaDesplegable>
                <ListaDesplegable
                    title="Acopio"
                    icon="leaf"
                    isOpen={activeList === "Acopio"}
                    onToggle={handleListToggle}
                >
                    {ACOPIO_FUNCTIONS.map((func) => (
                        <ItemLine
                            key={func.name}
                            title={func.name}
                            icon={func.icon}
                            onClick={() => handleViewOpen(func.view)}
                        />
                    ))}
                </ListaDesplegable>
                <ListaDesplegable
                    title="Almacen"
                    icon="store"
                    isOpen={activeList === "Almacen"}
                    onToggle={handleListToggle}
                >
                    {ALMACEN_FUNCTIONS.map((func) => (
                        <ItemLine
                            key={func.name}
                            title={func.name}
                            icon={func.icon}
                            onClick={() => handleViewOpen(func.view)}
                        />
                    ))}
                </ListaDesplegable>
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
            <AlmacenAcopio
                isOpen={activeView === 'almacen-acopio'}
                setIsOpen={() => handleViewClose()}
            />
        </View>

    );
}
export default Menu;