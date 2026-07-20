import React, { useState, useEffect } from 'react';
import { BoxIcon } from 'boxicons-react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Input from '../../../../components/common/inputs/Input';
import InputSelectBox from '../../../../components/common/inputs/InputSelectBox';
import productsAcopioService from '../../../../services/productsAcopioService';
import NoData from '../../../../components/common/widgets/NoData';

const AgregarEditarReceta = ({
    isOpen,
    setIsOpen,
    productoAlmacenId,
    recetaData = null,
    onRecetaCreated,
    onRecetaUpdated
}) => {
    const [dataReceta, setDataReceta] = useState({
        productos: [{ producto_acopio_id: '', cantidad: '' }]
    });

    const [loading, setLoading] = useState(false);
    const [productosAcopio, setProductosAcopio] = useState([]);
    const [loadingProductos, setLoadingProductos] = useState(false);

    // Cargar los productos de acopio disponibles
    useEffect(() => {
        const loadProductosAcopio = async () => {
            setLoadingProductos(true);
            try {
                const response = await productsAcopioService.getAllForReceta();
                if (response.success && response.data) {
                    const mappedOptions = response.data.map(producto => ({
                        value: String(producto.id),
                        label: producto.name,
                        id: producto.id,
                        name: producto.name,
                        quantity: producto.quantity,
                        type_measure: producto.type_measure
                    }));
                    setProductosAcopio(mappedOptions);
                }
            } catch (error) {
                console.error('Error al cargar productos de acopio:', error);
            } finally {
                setLoadingProductos(false);
            }
        };

        if (isOpen) {
            loadProductosAcopio();
        }
    }, [isOpen]);

    // Cargar receta existente si está disponible
    useEffect(() => {
        if (isOpen && recetaData && productosAcopio.length > 0) {
            const productosValidos = recetaData.productos.filter(p => {
                if (!p.producto_acopio_id) return false;
                return productosAcopio.some(opt => String(opt.value) === String(p.producto_acopio_id));
            }).map(p => ({
                producto_acopio_id: String(p.producto_acopio_id),
                cantidad: p.cantidad
            }));

            setDataReceta({
                productos: productosValidos.length > 0 ? productosValidos : [{ producto_acopio_id: '', cantidad: '' }]
            });
        } else if (isOpen && !recetaData) {
            setDataReceta({
                productos: [{ producto_acopio_id: '', cantidad: '' }]
            });
        }
    }, [isOpen, recetaData, productosAcopio]);

    // Agregar un nuevo ingrediente (materia prima)
    const agregarProducto = () => {
        const productosDisponibles = productosAcopio.filter(option => String(option.value) !== String(productoAlmacenId));
        const limiteMaximo = productosDisponibles.length;

        if (dataReceta.productos.length >= limiteMaximo) return;

        const opcionesDisponibles = getOpcionesDisponibles(-1);
        if (opcionesDisponibles.length === 0) return;

        setDataReceta(prev => ({
            ...prev,
            productos: [...prev.productos, { producto_acopio_id: '', cantidad: '' }]
        }));
    };

    // Eliminar un ingrediente
    const eliminarProducto = (index) => {
        if (index === 0) return; // La primera fila no se puede eliminar
        setDataReceta(prev => ({
            ...prev,
            productos: prev.productos.filter((_, i) => i !== index)
        }));
    };

    // Actualizar campos de una fila
    const actualizarProducto = (index, field, value) => {
        setDataReceta(prev => {
            const updatedProductos = prev.productos.map((producto, i) => {
                if (i !== index) return producto;

                let updated = { ...producto, [field]: value };
                
                // Determine if the product for this row is Unidad
                const targetProductId = field === 'producto_acopio_id' ? value : producto.producto_acopio_id;
                const selected = productosAcopio.find(p => String(p.value) === String(targetProductId));
                const isUnidad = selected?.type_measure?.code?.toLowerCase() === 'ud' || 
                                 selected?.type_measure?.name?.toLowerCase().includes('unidad');
                
                if (isUnidad && updated.cantidad) {
                    // Strip decimal part (both '.' and ',' are possible)
                    updated.cantidad = String(updated.cantidad).split('.')[0].split(',')[0];
                }
                return updated;
            });

            return {
                ...prev,
                productos: updatedProductos
            };
        });
    };

    // Filtrar opciones para que no se repitan materias primas ya seleccionadas
    const getOpcionesDisponibles = (currentIndex) => {
        const productosSeleccionados = dataReceta.productos
            .map((p, index) => index !== currentIndex ? String(p.producto_acopio_id) : null)
            .filter(id => id && id !== '');

        return productosAcopio.filter(option =>
            !productosSeleccionados.includes(String(option.value)) &&
            String(option.value) !== String(productoAlmacenId)
        );
    };

    // Formatear la unidad de medida dinámica
    const obtenerTextoMedida = (producto_acopio_id, cantidad) => {
        if (!producto_acopio_id) return '';
        const selected = productosAcopio.find(p => String(p.value) === String(producto_acopio_id));
        if (!selected) return '';

        const tm = selected.type_measure || {};
        const codeMayor = tm.code || '';
        const codeMenor = tm.code_menor || '';
        const measureValue = tm.value ? Number(tm.value) : null;
        const cantidadNum = parseFloat(String(cantidad || '0').replace(',', '.'));

        if (isNaN(cantidadNum) || cantidadNum <= 0) {
            return `Medida: ${codeMayor}`;
        }

        if (measureValue && cantidadNum < 1) {
            const menor = Math.round(cantidadNum * measureValue);
            return `= ${menor} ${codeMenor}`;
        } else {
            const rounded = Math.round(cantidadNum * 1000) / 1000;
            const formatted = Number.isInteger(rounded)
                ? `${rounded}`
                : `${rounded}`.replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');
            return `= ${formatted} ${codeMayor}`;
        }
    };

    const handleSubmit = () => {
        const invalid = dataReceta.productos.some(p => {
            const qty = parseFloat(String(p.cantidad).replace(',', '.'));
            return !p.producto_acopio_id || isNaN(qty) || qty <= 0;
        });
        if (invalid) return;

        setLoading(true);

        const nuevaRecetaData = {
            producto_almacen_id: productoAlmacenId,
            descripcion: '',
            productos: dataReceta.productos.map(p => ({
                producto_acopio_id: p.producto_acopio_id,
                cantidad: parseFloat(String(p.cantidad).replace(',', '.'))
            }))
        };

        if (recetaData && onRecetaUpdated) {
            onRecetaUpdated(nuevaRecetaData);
        } else if (onRecetaCreated) {
            onRecetaCreated(nuevaRecetaData);
        }

        setIsOpen(false);
        setLoading(false);
    };

    const canAddMore = dataReceta.productos.length < productosAcopio.filter(option => String(option.value) !== String(productoAlmacenId)).length &&
                       getOpcionesDisponibles(-1).length > 0;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title={recetaData ? "Editar Receta" : "Crear Receta"}
            confirmText="Guardar Receta"
            onConfirm={handleSubmit}
            loading={loading}
            confirmDisabled={
                loading ||
                loadingProductos ||
                dataReceta.productos.length === 0 ||
                dataReceta.productos.some(p => {
                    const qty = parseFloat(String(p.cantidad).replace(',', '.'));
                    return !p.producto_acopio_id || isNaN(qty) || qty <= 0;
                })
            }
            width="600px"
        >
            <div style={{ padding: '5px 0', minHeight: '350px', maxHeight: '60vh', overflowY: 'auto' }}>
                <p style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--secondary-color)', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Ingredientes de la Receta
                </p>

                {loadingProductos ? (
                    <NoData
                        icon="loader-alt"
                        title="Cargando productos..."
                        detail="Obteniendo productos de materia prima disponibles"
                        transparent={true}
                        minHeight="150px"
                    />
                ) : (
                    <>
                        {dataReceta.productos.map((producto, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'flex-start',
                                    marginBottom: '15px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                    border: '1px solid var(--quaternary-color)'
                                }}
                            >
                                <div style={{ flex: 3 }}>
                                    <InputSelectBox
                                        label={index === 0 ? "Materia Prima" : undefined}
                                        value={producto.producto_acopio_id}
                                        onChange={(value) => actualizarProducto(index, 'producto_acopio_id', value)}
                                        options={getOpcionesDisponibles(index)}
                                        placeholder="Seleccionar materia prima"
                                        disabled={loading}
                                    />
                                </div>
                                <div style={{ flex: 2 }}>
                                    {(() => {
                                        const selected = productosAcopio.find(p => String(p.value) === String(producto.producto_acopio_id));
                                        const isUnidad = selected?.type_measure?.code?.toLowerCase() === 'ud' || 
                                                         selected?.type_measure?.name?.toLowerCase().includes('unidad');
                                        return (
                                            <Input
                                                tipo="number"
                                                label={index === 0 ? "Cantidad" : undefined}
                                                value={producto.cantidad}
                                                placeholder={isUnidad ? "0" : "0.00"}
                                                onChange={(e) => actualizarProducto(index, 'cantidad', e.target.value)}
                                                step={isUnidad ? "1" : "0.01"}
                                                min={isUnidad ? "1" : "0.01"}
                                                readOnly={loading}
                                            />
                                        );
                                    })()}
                                    {producto.producto_acopio_id && (
                                        <span style={{ fontSize: '11px', color: 'var(--tertiary-color)', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                                            {obtenerTextoMedida(producto.producto_acopio_id, producto.cantidad)}
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignSelf: 'stretch', alignItems: 'center', marginTop: index === 0 ? '22px' : '0' }}>
                                    {index > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => eliminarProducto(index)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#e53935',
                                                padding: '8px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'background-color 0.15s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(229, 57, 53, 0.08)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            title="Eliminar ingrediente"
                                        >
                                            <BoxIcon name="trash" size="sm" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {canAddMore && (
                            <button
                                type="button"
                                onClick={agregarProducto}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px dashed var(--primary-color)',
                                    borderRadius: '8px',
                                    backgroundColor: 'var(--primary-color-light)',
                                    color: 'var(--primary-color)',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(49, 130, 206, 0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--primary-color-light)';
                                }}
                            >
                                <BoxIcon name="plus" size="xs" />
                                Agregar ingrediente
                            </button>
                        )}

                        {!canAddMore && dataReceta.productos.length > 0 && (
                            <p style={{ fontSize: '11px', color: 'var(--tertiary-color)', textAlign: 'center', marginTop: '10px' }}>
                                Has agregado todos los ingredientes disponibles para esta receta.
                            </p>
                        )}
                    </>
                )}
            </div>
        </ModalCentro>
    );
};

export default AgregarEditarReceta;