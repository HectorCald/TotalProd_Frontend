import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import InfoCard from '../../../../components/common/information/InfoCard';
import useFormatNumber from '../../../../hooks/useFormatNumber';
import { useUser } from '../../../../context/UserContext';
import { isSoloVentas } from '../../../../utils/empresaHelper';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';

const ViewInfo = ({ isOpen, onClose, producto, onEdit, onDelete }) => {
    const { formatPrice } = useFormatNumber();
    const { user } = useUser();
    const soloVentas = isSoloVentas(user);

    if (!producto) return null;

    const categoryText = (producto.category_names && producto.category_names.length > 0)
        ? producto.category_names.join(', ')
        : producto.category_name || null;

    const categoryTag = categoryText ? {
        text: categoryText,
        icon: 'tag'
    } : null;

    const tagsItems = [
        producto.codigo_barras ? {
            text: producto.codigo_barras,
            icon: 'barcode'
        } : null,
        categoryTag,
        (producto.grup && Number(producto.grup) > 0) ? {
            text: 'Se agrupa en '+producto.grup,
            icon: 'layer'
        } : null
    ].filter(Boolean);

    const prices = producto.price_product || [];
    const getPriceValue = (p) => p.valor !== undefined && p.valor !== null && p.valor !== '' ? p.valor : 0;
    
    let preciosItems = [];
    if (prices.length === 0) {
        preciosItems = [{ clave: 'Precio', valor: `Bs. ${formatPrice(0)}` }];
    } else {
        preciosItems = prices.map(p => ({
            clave: p.prices_types?.name || 'Precio',
            valor: `Bs. ${formatPrice(getPriceValue(p))}`
        }));
    }

    let recetaItems = [];
    if (!soloVentas) {
        const recetas = producto.recetas || [];
        const tieneReceta = recetas.length > 0 && recetas[0].recetas_detalle && recetas[0].recetas_detalle.length > 0;
        
        if (tieneReceta) {
            recetaItems = recetas[0].recetas_detalle.map(d => {
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
                        : `${rounded}`.replace(/\.0+$/, '').replace(/(\.[\d]*?)0+$/, '$1');
                    formattedValue = `${formatted} ${codeMayor}`;
                }

                return {
                    clave: ingredienteNombre,
                    valor: formattedValue
                };
            });
        }
    }

    const inventarioItems = [
        { clave: 'Stock', valor: producto.stock !== undefined && producto.stock !== null ? producto.stock : 0 },
        { clave: 'Stock Mínimo', valor: producto.stock_minimo !== undefined && producto.stock_minimo !== null ? producto.stock_minimo : 0 },
        ...(producto.costo_produccion !== undefined && producto.costo_produccion !== null ? [{ clave: 'Costo de Compra', valor: `Bs. ${formatPrice(producto.costo_produccion)}` }] : [])
    ];

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
                    subtitle="Información del Producto"
                    icon="package"
                    customBlock={
                        <>
                            {tagsItems.length > 0 && (
                                <ColumnInfo items={tagsItems} />
                            )}
                            <ColumnInfo 
                                title="Inventario"
                                items={inventarioItems}
                            />
                            <ColumnInfo 
                                title="Precios"
                                items={preciosItems}
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
