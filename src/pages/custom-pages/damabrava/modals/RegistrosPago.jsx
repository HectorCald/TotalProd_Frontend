import React, { useMemo } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Tabla from '../../../../components/common/information/Tabla';

const formatNumberString = (value, decimals = 2) => {
    const num = Number(value || 0);
    return num.toLocaleString('es-BO', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

const RegistrosPago = ({ isOpen, onClose, data = [] }) => {
    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            const dateA = new Date(a.fecha || 0).getTime();
            const dateB = new Date(b.fecha || 0).getTime();
            return dateA - dateB;
        });
    }, [data]);
    const columns = useMemo(() => [
        {
            header: 'Producto',
            render: (row) => row.producto,
            width: '25%',
        },
        {
            header: 'Terminados',
            render: (row) => formatNumberString(row.terminados, 2),
            width: '10%',
        },
        {
            header: 'Verificados',
            render: (row) => formatNumberString(row.verificados, 2),
            width: '10%',
        },
        {
            header: 'Cernido',
            render: (row) => formatNumberString(row.cernido, 2),
            width: '10%',
        },
        {
            header: 'Sellado',
            render: (row) => formatNumberString(row.sellado, 2),
            width: '10%',
        },
        {
            header: 'Envasado',
            render: (row) => formatNumberString(row.envasado, 2),
            width: '10%',
        },
        {
            header: 'Etiquetado',
            render: (row) => formatNumberString(row.etiquetado, 2),
            width: '10%',
        },
        {
            header: 'Subtotal',
            render: (row) => `Bs. ${formatNumberString(row.subtotal || row.total, 2)}`,
            width: '15%',
        }
    ], []);

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title="Detalle de registros"
            width="1000px"
            hideFooter={true}
            contentStyle={{ paddingBlock: 0 }}
        >
            <div style={{ padding: '10px 0' }}>
                {data.length > 0 ? (
                    <Tabla
                        data={sortedData}
                        columns={columns}
                        searchKeys={['producto']}
                        searchPlaceholder="Buscar por producto..."
                        containerStyle={{ minHeight: 'auto', padding: 0 }}
                    />
                ) : (
                    <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        No hay registros para mostrar.
                    </p>
                )}
            </div>
        </ModalCentro>
    );
};

export default RegistrosPago;
