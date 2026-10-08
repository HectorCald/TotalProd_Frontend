import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import InfoCard from '../../../../components/common/information/InfoCard';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';

const ViewInfo = ({ isOpen, onClose, producto, onEdit, onDelete }) => {
    if (!producto) return null;

    // Receta items
    const recetas = producto.recetas_acopio || [];
    const tieneReceta = recetas.length > 0 && recetas[0].recetas_acopio_detalle && recetas[0].recetas_acopio_detalle.length > 0;
    
    let recetaItems = [];
    if (tieneReceta) {
        recetaItems = recetas[0].recetas_acopio_detalle.map(d => {
            const ingredienteNombre = d.products_acopio?.name || 'Ingrediente';
            const tm = d.products_acopio?.type_measure || {};
            const codeMayor = tm.code || '';
            const codeMenor = tm.code_menor || '';
            const measureValue = tm.value ? Number(tm.value) : null;
            const cantidadNum = Number(d.cantidad);

            let formattedValue = '';
            if (isNaN(cantidadNum) || cantidadNum <= 0) {
                formattedValue = `0 ${codeMayor}`;
            } else if (measureValue && cantidadNum < 1) {
                const menor = Math.round(cantidadNum * measureValue);
                formattedValue = `${menor} ${codeMenor}`;
            } else {
                const rounded = Math.round(cantidadNum * 1000) / 1000;
                const formatted = Number.isInteger(rounded)
                    ? `${rounded}`
                    : `${rounded}`.replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');
                formattedValue = `${formatted} ${codeMayor}`;
            }

            return {
                clave: ingredienteNombre,
                valor: formattedValue
            };
        });
    }

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title=""
            confirmText="Editar"
            onConfirm={() => {
                if (onEdit) onEdit(producto);
            }}
            hideFooter={true}
            visibleOverflow={true}
        >
                <InfoCard
                    title={producto.name || 'Sin nombre'}
                    subtitle="Información de Materia Prima"
                    icon="cube"
                    customBlock={
                        <>
                            <ColumnInfo 
                                items={[
                                    producto.category?.name && {
                                        icon: 'tag',
                                        text: producto.category.name
                                    },
                                    producto.type_measure?.name && {
                                        icon: 'ruler',
                                        text: producto.type_measure.name
                                    }
                                ].filter(Boolean)} 
                            />
                            <ColumnInfo 
                                title="Inventario"
                                items={[
                                    { clave: 'Cantidad', valor: `${producto.quantity !== undefined && producto.quantity !== null ? producto.quantity : 0} ${producto.type_measure?.code || ''}` },
                                    { clave: 'Stock Mínimo', valor: `${producto.stock_minimo !== undefined && producto.stock_minimo !== null ? producto.stock_minimo : 0} ${producto.type_measure?.code || ''}` }
                                ]}
                            />
                            {recetaItems.length > 0 && (
                                <ColumnInfo 
                                    title="Receta"
                                    items={recetaItems}
                                />
                            )}
                            {producto.description && (
                                <ColumnInfo 
                                    title="Descripción"
                                    items={[{ text: producto.description }]}
                                />
                            )}
                        </>
                    }
                    actionButton={
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            <Boton
                                label="Editar Producto"
                                iconName="edit"
                                className="btn-primary"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    if (onEdit) onEdit(producto);
                                }}
                            />
                            <BotonIcon
                                iconName="trash"
                                className="btn-error"
                                tooltip="Eliminar Producto"
                                tooltipAlign="end"
                                onClick={() => {
                                    if (onDelete) onDelete(producto);
                                }}
                            />
                        </div>
                    }
                />
        </ModalCentro>
    );
};

export default ViewInfo;