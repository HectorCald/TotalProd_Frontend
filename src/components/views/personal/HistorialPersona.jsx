import React, { useEffect, useState } from 'react';
import styles from './HistorialPersona.module.css';
import HeaderModal from '../../common/HeaderModal';
import ViewModal from '../../ui/ViewModal';
import ItemTiempo from '../../common/ItemTiempo';

const historialData = [
    {
        id:'HISTP-0001',
        fechaHora: '29/8/2025, 14:53:58',
        idUser: 'USERSUM-0001',
        accion: 'CREAR',
        icon:'plus-square',
        descripcion:'Se creo el usuario Manuel Lopez'
    },
    {
        id:'HISTP-0002',
        fechaHora: '29/8/2025, 14:53:58',
        idUser: 'USERSUM-0001',
        accion: 'EDITAR',
        icon:'edit',
        descripcion:'Se creo el usuario Manuel Lopez'
    },
    {
        id:'HISTP-0003',
        fechaHora: '29/8/2025, 14:53:58',
        idUser: 'USERSUM-0001',
        accion: 'ELIMINAR',
        icon:'trash',
        descripcion:'Se creo el usuario Manuel Lopez'
    },
    {
        id:'HISTP-0004',
        fechaHora: '29/8/2025, 14:53:58',
        idUser: 'USERSUM-0001',
        accion: 'ACTUALIZAR',
        icon:'refresh',
        descripcion:'Se creo el usuario Manuel Lopez'
    },
    {
        id:'HISTP-0005',
        fechaHora: '29/8/2025, 14:53:58',
        idUser: 'USERSUM-0001',
        accion: 'ANULAR',
        icon:'no-entry',
        descripcion:'Se creo el usuario Manuel Lopez'
    },
    {
        id:'HISTP-0006',
        fechaHora: '29/8/2025, 14:53:58',
        idUser: 'USERSUM-0001',
        accion: 'REMPLAZAR',
        icon:'transfer',
        descripcion:'Se creo el usuario Manuel Lopez'
    },
    {
        id:'HISTP-0007',
        fechaHora: '29/8/2025, 14:53:58',
        idUser: 'USERSUM-0002',
        accion: 'ANULAR',
        icon:'no-entry',
        descripcion:'Se creo el usuario Manuel Lopez'
    },
    {
        id:'HISTP-0008',
        fechaHora: '29/8/2025, 14:53:58',
        idUser: 'USERSUM-0002',
        accion: 'REMPLAZAR',
        icon:'transfer',
        descripcion:'Se creo el usuario Manuel Lopez'
    },
]

function HistoriaPersona({ isOpen, setIsOpen, usuario }) {
    const [dataUsuarioId, setDataUsuarioId] = useState('');
    const [filteredHistory, setFilteredHistory] = useState([]);

    useEffect(() => {
        if (usuario?.id) {
            setDataUsuarioId(usuario.id);
            // Filtrar el historial por el ID del usuario
            const historiaFiltrada = historialData.filter(item => item.idUser === usuario.id);
            setFilteredHistory(historiaFiltrada);
        }
    }, [isOpen, usuario]);

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Historial"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>ACCIONES DE LOS ULTIMOS 30 DÍAS</p>
                {filteredHistory.length > 0 ? (
                    filteredHistory.map((dato) => (
                        <ItemTiempo
                            key={dato.id}
                            hora={dato.fechaHora.split(',')[1].trim().slice(0,5)}
                            titulo={dato.accion}
                            detalle={dato.descripcion}
                            icon={dato.icon}
                            arrow={true}
                        />
                    ))
                ) : (
                    <p className={styles.noData}>No hay registros de actividad para este usuario</p>
                )}
            </div>
        </ViewModal>
    );
}
export default HistoriaPersona;