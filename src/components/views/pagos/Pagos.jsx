import React, { useState } from 'react';
import styles from './Pagos.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerRegistro from './VerRegistro';
import Filtros from '../../common/Filtros';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemLine from '../../common/ItemLine';
import Boton from '../../common/Boton';
import DatoTiempo from '../../common/DatoTiempo';

const registroData = [
    {
        fecha: '2024-10-01',
        monto: 1500,
        concepto: 'Compra de insumos',
        beneficiario: 'Proveedor XYZ',
        tipo: 'Acopio',
        icon: 'credit-card',
        pagador: 'Empresa ABC',
        estado: 'Completado',
        observaciones: 'Pago realizado mediante transferencia bancaria',
    },
]


function Pagos({ isOpen, setIsOpen }) {
    const [isOpenVerRegistro, setIsOpenVerRegistro] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);

    const [isOpenArea, setOpenArea] = useState(false);
    const [isOpenEstado, setOpenEstado] = useState(false);
    const [isOpenFecha, setOpenFecha] = useState(false);

    const [dataFecha, setDataFecha] = useState({
        inicio: 'Seleccione una fecha',
        fin: 'Seleccione una fecha',
    });

    const [filtroActivo, setFiltroActivo] = useState('todos');
    
    // Estados para el buscador expandible
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const handleRegistro = (registro) => {
        setIsOpenVerRegistro(true);
        setInfoPersona(registroData[registro]);
    };

    // Funciones para el buscador expandible
    const handleSearchChange = (value) => {
        setSearchQuery(value);
    };

    const handleSearchClear = () => {
        setSearchQuery('');
    };

    const handleSearchToggle = (isExpanded) => {
        setIsSearchExpanded(isExpanded);
    };

    const opciones = [
        {
            label: 'Estado',
            active: filtroActivo === 'estado',
            onClick: () => setOpenEstado(true)
        },
        {
            label: 'Area',
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
            <HeaderView 
                onBack={() => setIsOpen(false)}
                showSearch={true}
                searchPlaceholder="Buscar pago"
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
            />
            <div className={styles.container}>
                <h1 className={styles.title}>Pagos</h1>
                <Filtros options={opciones} />
                <div className={styles.content} >
                    {
                        registroData?.map((dato, index) => (
                            <ItemView
                                key={dato.id || index} // usa id si existe
                                title={dato.concepto}
                                description={dato.beneficiario + ' - ' + dato.monto + ' BOB'}
                                icon={dato.icon}
                                arrow={true}
                                onClick={() => { handleRegistro(index) }}
                            />
                        ))

                    }
                </div>

            </div>
            <VerRegistro isOpen={isOpenVerRegistro} setIsOpen={setIsOpenVerRegistro} registro={infoPersona} />
            {/* Modal de area*/}
            <ViewModal isOpen={isOpenArea} setIsOpen={setOpenArea}>
                <HeaderModal
                    title="Area"
                    onClose={() => setOpenArea(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Selecciona una opción para filtrar todos los pagos segun el area.</p>
                    <ItemLine
                        title='Producción'
                        icon='factory'
                        onClick={() => setFiltroActivo('produccion')}
                    />
                    <ItemLine
                        title='Acopio'
                        icon='leaf'
                        onClick={() => setFiltroActivo('acopio')}
                    />
                    <ItemLine
                        title='Almacén'
                        icon='store'
                        onClick={() => setFiltroActivo('almacen')}
                    />
                    <ItemLine
                        title='Todos'
                        icon='money'
                        onClick={() => setFiltroActivo('todos')}
                    />
                </div>
            </ViewModal>
            {/* Modal de estado*/}
            <ViewModal isOpen={isOpenEstado} setIsOpen={setOpenEstado}>
                <HeaderModal
                    title="Estado"
                    onClose={() => setOpenEstado(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Selecciona una opción para filtrar todos los pagos segun el estado.</p>
                    <ItemLine
                        title='Completado'
                        icon='check-circle'
                        onClick={() => setFiltroActivo('produccion')}
                    />
                    <ItemLine
                        title='Anulado'
                        icon='x-circle'
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
export default Pagos;