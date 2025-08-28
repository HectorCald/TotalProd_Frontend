import React, { useState } from 'react';
import styles from './AlmacenAcopio.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputSearch from '../../common/InputSearch';
import ItemView from '../../common/ItemView';
import VerProducto from './VerProducto';
import Filtros from '../../common/Filtros';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemLine from '../../common/ItemLine';
import Boton from '../../common/Boton';
import EditarAgregar from '../almacen-acopio/EditarAgregar';

const productoData = [
    {
        producto: 'Ajo Molido',
        lotesBruto: [
            { lote: 1, peso: 123 },
            { lote: 2, peso: 150 },
        ],
        lotesPrima: [
            { lote: 1, peso: 456 },
            { lote: 2, peso: 300 },
        ],
        categoria: 'Amapolita',
        icon: 'leaf',
    },
]


function Registros({ isOpen, setIsOpen }) {
    const [isOpenVerProducto, setIsOpenVerProducto] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const [isAgregarOpen, setIsAgregarOpen] = useState(false);

    const [isOpenMateria, setOpenMateria] = useState(false);
    const [isOpenCategoria, setOpenCategoria] = useState(false);
    const [isOpenOrden, setOpenOrden] = useState(false);


    const [filtroActivo, setFiltroActivo] = useState('todos');
    const handleRegistro = (registro) => {
        setIsOpenVerProducto(true);
        setInfoPersona(productoData[registro]);
    };
    const opciones = [
        {
            label: 'Materia',
            active: filtroActivo === 'area',
            onClick: () => setOpenMateria(true)
        },
        {
            label: 'Categorias',
            active: filtroActivo === 'categorias',
            onClick: () => setOpenCategoria(true)
        },
        {
            label: 'Ordenamiento',
            active: filtroActivo === 'ordenamiento',
            onClick: () => setOpenOrden(true)
        },
    ];

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Almacen Acopio</h1>
                <InputSearch
                    placeholder='Buscar producto'
                    type="text"
                />
                <Filtros options={opciones} />
                <div className={styles.content} >
                    {
                        productoData?.map((dato, index) => (
                            <ItemView
                                key={dato.id || index} // usa id si existe
                                title={dato.producto}
                                description={'Bruto: ' + dato.lotesBruto?.reduce((acc, lote) => acc + lote.peso, 0) + ' Kg.' + ' - ' + 'Prima: ' + dato.lotesPrima?.reduce((acc, lote) => acc + lote.peso, 0) + ' kg.'}
                                icon={dato.icon}
                                arrow={true}
                                onClick={() => { handleRegistro(index) }}
                            />
                        ))

                    }
                </div>
            </div>
            <div className={styles.buttonFooter}>
                <Boton
                    className='btn-default'
                    label='Categorias'
                    onClick={() => { setIsAgregarOpen(true); }}
                />
                <Boton
                    className='btn-original'
                    label='Nuevo producto'
                    onClick={() => { setIsAgregarOpen(true); }}
                />
            </div>
            {/* Modal de ver registro*/}
            <VerProducto isOpen={isOpenVerProducto} setIsOpen={setIsOpenVerProducto} registro={infoPersona} />


            {/* Modal de editar*/}
            <EditarAgregar isOpen={isAgregarOpen} setIsOpen={setIsAgregarOpen} tipo='agregar' />
            {/* Modal de materia*/}
            <ViewModal isOpen={isOpenMateria} setIsOpen={setOpenMateria}>
                <HeaderModal
                    title="Tipo de materia"
                    onClose={() => setOpenMateria(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Selecciona una opción para mostrar el peso segun la materia.</p>
                    <ItemLine
                        title='Materia Bruta'
                        icon='cube'
                        onClick={() => setFiltroActivo('produccion')}
                    />
                    <ItemLine
                        title='Materia Prima'
                        icon='leaf'
                        onClick={() => setFiltroActivo('acopio')}
                    />
                </div>
            </ViewModal>
            {/* Modal de categorias*/}
            <ViewModal isOpen={isOpenCategoria} setIsOpen={setOpenCategoria}>
                <HeaderModal
                    title="Categorias"
                    onClose={() => setOpenCategoria(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Selecciona una opción para filtrar todos los productos que correspondan a esa categoria.</p>
                    <ItemLine
                        title='Venado'
                        icon='tag'
                        onClick={() => setFiltroActivo('produccion')}
                    />
                    <ItemLine
                        title='Amapolita'
                        icon='tag'
                        onClick={() => setFiltroActivo('acopio')}
                    />
                </div>
            </ViewModal>
            {/* Modal de ordenamiento*/}
            <ViewModal isOpen={isOpenOrden} setIsOpen={setOpenOrden}>
                <HeaderModal
                    title="Ordenamiento"
                    onClose={() => setOpenOrden(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Selecciona una opción para ordenar los productos</p>
                    <ItemLine
                        title='Orden A-Z'
                        icon='sort-a-z'
                        onClick={() => setFiltroActivo('produccion')}
                    />
                    <ItemLine
                        title='Orden Z-A'
                        icon='sort-z-a'
                        onClick={() => setFiltroActivo('acopio')}
                    />
                    <ItemLine
                        title='Orden Menor-Mayor'
                        icon='up-arrow-alt'
                        onClick={() => setFiltroActivo('acopio')}
                    />
                    <ItemLine
                        title='Orden Mayor-Menor'
                        icon='down-arrow-alt'
                        onClick={() => setFiltroActivo('acopio')}
                    />
                </div>
            </ViewModal>
        </View>

    );
}
export default Registros;