import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import InfoCard from '../../../../components/common/information/InfoCard';

const ViewInfo = ({ isOpen, onClose, producto, onEdit }) => {
    if (!producto) return null;

    // Obtener etiquetas del producto
    const tags = [
        producto.category?.name ? {
            text: producto.category.name,
            icon: 'tag'
        } : null,
        producto.type_measure?.name ? {
            text: `Medida: ${producto.type_measure.name}`,
            icon: 'ruler'
        } : null
    ].filter(Boolean);

    // Receta tag
    const recetas = producto.recetas_acopio || [];

    if (recetas.length > 0 && recetas[0].recetas_acopio_detalle && recetas[0].recetas_acopio_detalle.length > 0) {
        tags.push({
            text: 'Con Receta',
            color: 'success',
            icon: 'receipt',
            tooltipItems: recetas[0].recetas_acopio_detalle.map(d => {
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

    const stats = [
        {
            label: 'Cantidad',
            value: `${producto.quantity !== undefined && producto.quantity !== null ? producto.quantity : 0} ${producto.type_measure?.code || ''}`,
            icon: 'package'
        },
        {
            label: 'Stock Mínimo',
            value: `${producto.stock_minimo !== undefined && producto.stock_minimo !== null ? producto.stock_minimo : 0} ${producto.type_measure?.code || ''}`,
            icon: 'bell'
        }
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
                    subtitle="Información de Materia Prima"
                    description={producto.description}
                    tags={tags}
                    stats={stats}
                    icon="cube"
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