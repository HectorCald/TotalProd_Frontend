import React from 'react';
import styles from './RegisterBlock.module.css';
import { BoxIcon } from 'boxicons-react';
import NoData from './NoData';
import useFormatNumber from '../../../hooks/useFormatNumber';
import useFechaLiteral from '../../../hooks/useFechaLiteral';

const RegisterRow = ({ item, onDelete, isDeleting }) => {
    const { formatPrice } = useFormatNumber();
    const fechaStr = typeof item.fecha === 'string' && item.fecha.length > 10 ? item.fecha.substring(0, 10) : item.fecha;
    const literalDate = useFechaLiteral(fechaStr, false);

    return (
        <div className={styles.item}>
            <div className={styles.itemContent}>
                <div className={styles.itemHeader}>
                    <span className={styles.itemAmount}>
                        {`Bs. ${formatPrice(item.monto ?? item.valor ?? 0)}`}
                    </span>
                    {(literalDate || item.fecha) && (
                        <span className={styles.itemDate}>
                            • {literalDate || item.fecha}
                        </span>
                    )}
                </div>
                {item.detalle && (
                    <span className={styles.itemDetail}>
                        {item.detalle}
                    </span>
                )}
            </div>
            {onDelete && (
                <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    disabled={isDeleting}
                    className={styles.deleteButton}
                    title="Eliminar"
                >
                    <BoxIcon name={isDeleting ? "loader-alt" : "trash"} className={isDeleting ? "bx-spin" : ""} size="sm" />
                </button>
            )}
        </div>
    );
};

const RegisterBlock = ({
    title = 'Historial de Pagos',
    items = [],
    loading = false,
    loadingTitle = 'Cargando pagos...',
    loadingDetail = 'Obteniendo el historial de pagos',
    emptyTitle = 'No hay pagos',
    emptyDetail = 'Esta deuda no tiene pagos registrados aún',
    onDelete,
    deletingId = null,
    maxHeight = '300px'
}) => {
    return (
        <div className={styles.container}>
            {title && <p className={styles.title}>{title}</p>}
            <div className={styles.list} style={{ maxHeight }}>
                {loading ? (
                    <NoData
                        icon="loader-alt"
                        title={loadingTitle}
                        detail={loadingDetail}
                        transparent={true}
                        minHeight="100px"
                    />
                ) : items.length > 0 ? (
                    items.map(item => (
                        <RegisterRow
                            key={item.id}
                            item={item}
                            onDelete={onDelete}
                            isDeleting={deletingId === item.id}
                        />
                    ))
                ) : (
                    <NoData
                        icon="history"
                        title={emptyTitle}
                        detail={emptyDetail}
                        transparent={true}
                        minHeight="100px"
                    />
                )}
            </div>
        </div>
    );
};

export default RegisterBlock;
