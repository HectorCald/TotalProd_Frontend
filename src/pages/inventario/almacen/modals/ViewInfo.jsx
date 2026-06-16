import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import InfoCard from '../../../../components/common/information/InfoCard';
import useFormatNumber from '../../../../hooks/useFormatNumber';
import { useUser } from '../../../../context/UserContext';
import { isSoloVentas } from '../../../../utils/empresaHelper';

const ViewInfo = ({ isOpen, onClose, producto, onEdit }) => {
    const { formatPrice } = useFormatNumber();
    const { user } = useUser();
    const soloVentas = isSoloVentas(user);

    if (!producto) return null;

    const categoryTags = (producto.category_names && producto.category_names.length > 0)
        ? producto.category_names.map(cat => ({
            text: cat,
            icon: 'tag'
        }))
        : (producto.category_name ? [{
            text: producto.category_name,
            icon: 'tag'
        }] : []);

    // Obtener etiquetas del producto
    const tags = [
        producto.codigo_barras ? {
            text: producto.codigo_barras,
            icon: 'barcode'
        } : null,
        ...categoryTags,
        (producto.grup && Number(producto.grup) > 0) ? {
            text: `Grupo: ${producto.grup}`,
            icon: 'layer'
        } : null
    ].filter(Boolean);

    // Formatear precios
    const prices = producto.price_product || [];
    let priceStat = null;

    const getPriceValue = (p) => p.valor !== undefined && p.valor !== null && p.valor !== '' ? p.valor : 0;
    if (prices.length === 0) {
        priceStat = {
            label: 'Precio',
            value: `Bs. ${formatPrice(0)}`
        };
    } else if (prices.length === 1) {
        const p = prices[0];
        priceStat = {
            label: p.prices_types?.name || 'Precio',
            value: `Bs. ${formatPrice(getPriceValue(p))}`
        };
    } else {
        const mainPrice = prices[0];
        priceStat = {
            label: 'Precios',
            value: `Bs. ${formatPrice(getPriceValue(mainPrice))}`,
            tooltipItems: prices.map(p => ({
                label: p.prices_types?.name || 'Precio',
                value: `Bs. ${formatPrice(getPriceValue(p))}`
            }))
        };
    }

    // Receta tag
    if (!soloVentas) {
        const recetas = producto.recetas || [];
        if (recetas.length > 0 && recetas[0].recetas_detalle && recetas[0].recetas_detalle.length > 0) {
            tags.push({
                text: 'Con Receta',
                color: 'success',
                icon: 'receipt',
                tooltipItems: recetas[0].recetas_detalle.map(d => {
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
                        label: ingredienteNombre,
                        value: formattedValue
                    };
                })
            });
        }
    }

    const stats = [
        {
            label: 'Stock',
            value: producto.stock !== undefined && producto.stock !== null ? producto.stock : 0,
            icon: 'package'
        },
        {
            label: 'Stock Mínimo',
            value: producto.stock_minimo !== undefined && producto.stock_minimo !== null ? producto.stock_minimo : 0,
            icon: 'bell'
        },
        priceStat
    ];

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title=""
            confirmText="Editar"
            onConfirm={() => {
                onClose();
                if (onEdit) onEdit(producto);
            }}
            hideFooter={true}
            width="450px"
        >
            <div style={{ margin: '-10px -24px -24px -24px' }}>
                <InfoCard
                    title={producto.name || 'Sin nombre'}
                    subtitle="Información del Producto"
                    description={producto.description}
                    tags={tags}
                    stats={stats}
                    icon="package"
                    actionButton={
                        <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                            <Boton
                                label="Editar Producto"
                                iconName="edit"
                                className="btn-primary"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    onClose();
                                    if (onEdit) onEdit(producto);
                                }}
                            />
                        </div>
                    }
                />
            </div>
        </ModalCentro>
    );
};

export default ViewInfo;
