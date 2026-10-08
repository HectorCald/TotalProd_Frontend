import React, { useState, useEffect } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Boton from '../../../../components/common/botones/Boton';
import InfoCard from '../../../../components/common/information/InfoCard';
import useFormatNumber from '../../../../hooks/useFormatNumber';
import { useUser } from '../../../../context/UserContext';
import { isSoloVentas } from '../../../../utils/empresaHelper';
import BotonIcon from '../../../../components/common/botones/BotonIcon';
import ColumnInfo from '../../../../components/common/outputs/ColumnInfo';
import AgregarEditarProducto from './AgregarEditarProducto';
import EliminarProducto from './EliminarProducto';

const ViewInfo = ({ isOpen, onClose, producto: propsProducto, onEdit, onDelete, onGuardar, onEliminar, readOnly }) => {
    const { formatPrice } = useFormatNumber();
    const { user } = useUser();
    const soloVentas = isSoloVentas(user);

    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [producto, setProducto] = useState(propsProducto);

    useEffect(() => {
        setProducto(propsProducto);
    }, [propsProducto]);

    const handleProductoGuardado = (nuevoProducto) => {
        setProducto(prev => ({ ...prev, ...nuevoProducto }));
        if (onGuardar) onGuardar(nuevoProducto);
        if (onEdit) onEdit(nuevoProducto);
    };

    const handleProductoEliminado = (id) => {
        setIsEliminarOpen(false);
        onClose();
        if (onEliminar) onEliminar(id);
        if (onDelete) onDelete(id);
    };

    if (!producto) return null;

    const currentEmpresaId = user?.empresa_id || localStorage.getItem('empresa_id');
    const isProductReadOnly = Boolean(readOnly || (
        producto.empresa_id && 
        currentEmpresaId && 
        String(producto.empresa_id) !== String(currentEmpresaId)
    ));

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

    return (
        <>
            <ModalCentro
                isOpen={isOpen && !isEliminarOpen}
                onClose={onClose}
                title=""
                confirmText="Editar"
                onConfirm={() => {
                    setIsEditarOpen(true);
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
                            <ColumnInfo 
                                items={[
                                    producto.codigo_barras && {
                                        icon: 'barcode',
                                        text: producto.codigo_barras
                                    },
                                    ((producto.category_names && producto.category_names.length > 0)
                                        ? producto.category_names.join(', ')
                                        : producto.category_name) && {
                                        icon: 'tag',
                                        text: (producto.category_names && producto.category_names.length > 0)
                                            ? producto.category_names.join(', ')
                                            : producto.category_name
                                    },
                                    (producto.grup && Number(producto.grup) > 0) && {
                                        icon: 'layer',
                                        text: `Se agrupa en ${producto.grup}`
                                    }
                                ].filter(Boolean)} 
                            />
                            <ColumnInfo 
                                title="Inventario"
                                items={[
                                    { clave: 'Stock', valor: producto.stock !== undefined && producto.stock !== null ? producto.stock : 0 },
                                    { clave: 'Stock Mínimo', valor: producto.stock_minimo !== undefined && producto.stock_minimo !== null ? producto.stock_minimo : 0 },
                                    ...(producto.costo_produccion !== undefined && producto.costo_produccion !== null ? [{ clave: 'Costo de Compra', valor: `Bs. ${formatPrice(producto.costo_produccion)}` }] : [])
                                ]}
                            />
                            <ColumnInfo 
                                title="Precios"
                                items={(!producto.price_product || producto.price_product.length === 0)
                                    ? [{ clave: 'Precio', valor: `Bs. ${formatPrice(0)}` }]
                                    : producto.price_product.map(p => ({
                                        clave: p.prices_types?.name || 'Precio',
                                        valor: `Bs. ${formatPrice(p.valor !== undefined && p.valor !== null && p.valor !== '' ? p.valor : 0)}`
                                    }))
                                }
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
                    actionButton={!isProductReadOnly ? (
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            <Boton
                                label="Editar Producto"
                                iconName="edit"
                                className="btn-primary"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    setIsEditarOpen(true);
                                }}
                            />
                            <BotonIcon
                                iconName="trash"
                                className="btn-error"
                                tooltip="Eliminar Producto"
                                tooltipAlign="end"
                                onClick={() => {
                                    setIsEliminarOpen(true);
                                }}
                            />
                        </div>
                    ) : null}
                />
            </ModalCentro>

            <AgregarEditarProducto
                isOpen={isEditarOpen}
                onClose={() => setIsEditarOpen(false)}
                productoSeleccionado={producto}
                onGuardar={handleProductoGuardado}
            />

            <EliminarProducto
                isOpen={isEliminarOpen}
                onClose={() => setIsEliminarOpen(false)}
                productoSeleccionado={producto}
                onEliminar={handleProductoEliminado}
            />
        </>
    );
};

export default ViewInfo;
