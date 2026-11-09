import React from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';
import NoData from '../../../../components/common/widgets/NoData';

const Top10MasVendidos = ({ isOpen, onClose, productos = [] }) => {
    const items = productos.slice(0, 10).map((prod, idx) => ({
        clave: `${idx + 1}. ${prod.name}`,
        valor: `${prod.cantidad} uds.`,
        colorValor: '#28a745'
    }));

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title="Top 10 Productos Más Vendidos"
            mensaje="Productos con mayor cantidad de unidades vendidas en el periodo seleccionado."
            hideCancel={true}
            confirmText="Cerrar"
            onConfirm={onClose}
            contentStyle={{ paddingBlock: 0 }}
        >
            <div style={{ marginTop: '10px' }}>
                {items.length > 0 ? (
                    <ColumnInfo
                        noScroll={true}
                        items={items}
                    />
                ) : (
                    <NoData
                        icon="box"
                        title="Sin ventas registradas"
                        detail="No hay productos vendidos en este periodo"
                        transparent={true}
                        minHeight="140px"
                    />
                )}
            </div>
        </ModalCentro>
    );
};

export default Top10MasVendidos;
