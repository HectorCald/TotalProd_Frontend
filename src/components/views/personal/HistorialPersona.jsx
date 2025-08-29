import React, { useEffect, useState } from 'react';
import styles from './HistorialPersona.module.css';
import HeaderModal from '../../common/HeaderModal';
import ViewModal from '../../ui/ViewModal';
import ItemTiempo from '../../common/ItemTiempo';

const historialData = [
    {
        id:'HISTP-0001',
        fechaHora: '27/8/2025, 14:53:58',
        idUser: 'USERSUM-0001',
        accion: 'CREAR',
        icon:'plus-square',
        descripcion:'Se creo el usuario Manuel Lopez'
    },
    {
        id:'HISTP-0002',
        fechaHora: '27/8/2025, 14:53:58',
        idUser: 'USERSUM-0001',
        accion: 'EDITAR',
        icon:'edit',
        descripcion:'Se creo el usuario Manuel Lopez'
    },
    {
        id:'HISTP-0003',
        fechaHora: '28/8/2025, 14:53:58',
        idUser: 'USERSUM-0001',
        accion: 'ELIMINAR',
        icon:'trash',
        descripcion:'Se creo el usuario Manuel Lopez'
    },
    {
        id:'HISTP-0004',
        fechaHora: '28/8/2025, 14:53:58',
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
    const [groupedHistory, setGroupedHistory] = useState({});

    // Función para obtener el título del grupo según la fecha
    const getGroupTitle = (dateStr) => {
        // Parseamos la fecha manualmente
        const [day, month, year] = dateStr.split(',')[0].split('/').map(num => parseInt(num, 10));
        const date = new Date(year, month - 1, day); // month - 1 porque los meses en JS van de 0 a 11
        
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        
        // Resetear las horas para comparar solo fechas
        today.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        if (date.getTime() === today.getTime()) return 'Hoy';
        if (date.getTime() === yesterday.getTime()) return 'Ayer';

        // Array de días de la semana en español
        const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        // Array de meses en español
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        
        // Formar la fecha manualmente
        const diaSemana = diasSemana[date.getDay()];
        const diaMes = date.getDate();
        const mes = meses[date.getMonth()];
        const anio = date.getFullYear();

        return `${diaSemana} ${diaMes} de ${mes} ${anio}`;
    };

    useEffect(() => {
        if (usuario?.id) {
            setDataUsuarioId(usuario.id);
            // Filtrar el historial por el ID del usuario
            const historiaFiltrada = historialData.filter(item => item.idUser === usuario.id);
            
            // Agrupar por fecha
            const grouped = historiaFiltrada.reduce((groups, item) => {
                const date = item.fechaHora.split(',')[0]; // Obtener solo la fecha
                const groupTitle = getGroupTitle(item.fechaHora);
                
                if (!groups[groupTitle]) {
                    groups[groupTitle] = [];
                }
                groups[groupTitle].push(item);
                return groups;
            }, {});

            setGroupedHistory(grouped);
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
                {Object.keys(groupedHistory).length > 0 ? (
                    Object.entries(groupedHistory)
                        .sort(([dateA], [dateB]) => {
                            // Ordenar las fechas de más reciente a más antigua
                            if (dateA === 'Hoy') return -1;
                            if (dateB === 'Hoy') return 1;
                            if (dateA === 'Ayer') return -1;
                            if (dateB === 'Ayer') return 1;
                            return 0;
                        })
                        .map(([date, items]) => (
                            <div key={date} className={styles.dateGroup}>
                                <p className={styles.subTitle2}>{date}</p>
                                {items.map((dato) => (
                                    <ItemTiempo
                                        key={dato.id}
                                        hora={dato.fechaHora.split(',')[1].trim().slice(0,5)}
                                        titulo={dato.accion}
                                        detalle={dato.descripcion}
                                        icon={dato.icon}
                                        arrow={true}
                                    />
                                ))}
                            </div>
                        ))
                ) : (
                    <p className={styles.noData}>No hay registros de actividad para este usuario</p>
                )}
            </div>
        </ViewModal>
    );
}
export default HistoriaPersona;