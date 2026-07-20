import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import { useToast } from '../../../../context/ToastContext';
import productsAlmacenService from '../../../../services/productsAlmacenService';
import pricesTypesService from '../../../../services/pricesTypesService';
import NoData from '../../../../components/common/widgets/NoData';
import { useUser } from '../../../../context/UserContext';
import { isSoloVentas } from '../../../../utils/empresaHelper';
import InputSwitch from '../../../../components/common/inputs/InputSwitch';
import Boton from '../../../../components/common/botones/Boton';
import AgregarEditarReceta from '../../materia-prima/modals/AgregarEditarReceta';
import Mensaje from '../../../../components/common/outputs/Mensaje';
import useSessionCache from '../../../../hooks/useSessionCache';
import SelectCategoriasAlmacen from '../../../../components/common/fast/SelectCategoriasAlmacen';

const AgregarEditarProducto = ({
    isOpen,
    onClose,
    productoSeleccionado,
    onGuardar,
}) => {
    const { showSuccess, showDanger } = useToast();

    const { user } = useUser();
    const soloVentas = isSoloVentas(user);

    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ name: false, stock: false, prices: {}, receta: false });
    const { value: preciosTipos, setValue: setPreciosTipos } = useSessionCache({
        key: 'ListadoTiposPrecios',
        defaultValue: []
    });
    const [loadingPrecios, setLoadingPrecios] = useState(false);

    const [isRecetaOpen, setIsRecetaOpen] = useState(false);
    const [hasReceta, setHasReceta] = useState(false);
    const [recetaGuardada, setRecetaGuardada] = useState(null);

    useEffect(() => {
        if (!isOpen) return;

        const fetchPreciosTipos = async () => {
            if (preciosTipos.length === 0) setLoadingPrecios(true);
            try {
                const response = await pricesTypesService.getAll();
                if (response.success && response.data) {
                    const preciosData = Array.isArray(response.data) ? response.data : [response.data];
                    const tiposFiltrados = preciosData.map(precio => ({
                        id: precio.id,
                        name: precio.name
                    }));
                    setPreciosTipos(tiposFiltrados);
                }
            } catch (error) {
                console.error("Error al obtener tipos de precios:", error);
            } finally {
                setLoadingPrecios(false);
            }
        };
        fetchPreciosTipos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        stock: 0,
        stock_minimo: 0,
        codigo_barras: '',
        grup: '',
        costo_produccion: '',
        category_ids: [],
        prices: {}
    });

    useEffect(() => {
        if (!isOpen) return;

        const fetchPreciosTipos = async () => {
            if (preciosTipos.length === 0) setLoadingPrecios(true);
            try {
                const response = await pricesTypesService.getAll();
                if (response.success && response.data) {
                    const preciosData = Array.isArray(response.data) ? response.data : [response.data];
                    const tiposFiltrados = preciosData.map(precio => ({
                        id: precio.id,
                        name: precio.name
                    }));
                    setPreciosTipos(tiposFiltrados);
                }
            } catch (error) {
                console.error("Error al obtener tipos de precios:", error);
            } finally {
                setLoadingPrecios(false);
            }
        };
        fetchPreciosTipos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setFieldErrors({ name: false, stock: false, prices: {}, receta: false });

            if (productoSeleccionado) {
                const prices = {};
                if (productoSeleccionado.price_product && Array.isArray(productoSeleccionado.price_product)) {
                    productoSeleccionado.price_product.forEach(price => {
                        if (price.prices_types && price.prices_types.id) {
                            prices[price.prices_types.id] = (price.valor !== undefined && price.valor !== null && price.valor !== '') ? price.valor : 0;
                        }
                    });
                }

                // Cargar receta si existe
                let recetaData = null;
                if (productoSeleccionado.recetas && productoSeleccionado.recetas.length > 0) {
                    const receta = productoSeleccionado.recetas[0];
                    recetaData = {
                        descripcion: receta.descripcion || '',
                        productos: receta.recetas_detalle ? receta.recetas_detalle.map(detalle => ({
                            producto_acopio_id: detalle.products_acopio?.id || detalle.producto_acopio_id,
                            cantidad: detalle.cantidad
                        })) : []
                    };
                    setHasReceta(true);
                } else {
                    setHasReceta(false);
                }
                setRecetaGuardada(recetaData);

                // Resolver category_ids: desde producto_categoria N:M o legacy category_id
                let categoryIds = [];
                if (productoSeleccionado.producto_categoria && productoSeleccionado.producto_categoria.length > 0) {
                    categoryIds = productoSeleccionado.producto_categoria.map(pc => String(pc.categoria_id));
                } else if (productoSeleccionado.category_id) {
                    categoryIds = [String(productoSeleccionado.category_id)];
                }

                setFormData({
                    name: productoSeleccionado.name || '',
                    description: productoSeleccionado.description || '',
                    stock: productoSeleccionado.stock !== undefined && productoSeleccionado.stock !== null ? productoSeleccionado.stock : 0,
                    stock_minimo: productoSeleccionado.stock_minimo !== undefined && productoSeleccionado.stock_minimo !== null ? productoSeleccionado.stock_minimo : 0,
                    codigo_barras: productoSeleccionado.codigo_barras || '',
                    grup: productoSeleccionado.grup || '',
                    costo_produccion: productoSeleccionado.costo_produccion !== undefined && productoSeleccionado.costo_produccion !== null ? productoSeleccionado.costo_produccion : '',
                    category_ids: categoryIds,
                    prices: prices
                });
            } else {
                setFormData({
                    name: '',
                    description: '',
                    stock: 0,
                    stock_minimo: 0,
                    codigo_barras: '',
                    grup: '',
                    costo_produccion: '',
                    category_ids: [],
                    prices: {}
                });
                setHasReceta(false);
                setRecetaGuardada(null);
            }
        }
    }, [isOpen, productoSeleccionado]);

    const handlePriceChange = (priceTypeId, value) => {
        setFormData(prev => ({
            ...prev,
            prices: {
                ...prev.prices,
                [priceTypeId]: value
            }
        }));
        setFieldErrors((prev) => ({
            ...prev,
            prices: { ...prev.prices, [priceTypeId]: false }
        }));
    };

    const handleConfirm = async () => {
        let hasErrors = false;
        const newFieldErrors = { name: false, stock: false, prices: {}, receta: false };

        if (!formData.name.trim()) {
            newFieldErrors.name = true;
            hasErrors = true;
        }

        const stockVal = formData.stock;
        if (stockVal === '' || stockVal === null || stockVal === undefined) {
            newFieldErrors.stock = true;
            hasErrors = true;
        } else {
            const parsedStock = parseInt(stockVal);
            if (isNaN(parsedStock) || parsedStock < 0) {
                newFieldErrors.stock = true;
                hasErrors = true;
            }
        }

        if (preciosTipos && preciosTipos.length > 0) {
            preciosTipos.forEach((pt) => {
                let val = formData.prices[pt.id];
                if (val === '' || val === null || val === undefined) {
                    val = 0;
                    formData.prices[pt.id] = 0;
                }
                const num = parseFloat(String(val).replace(',', '.'));
                if (isNaN(num) || num < 0) {
                    newFieldErrors.prices[pt.id] = true;
                    hasErrors = true;
                }
            });
        }

        if (!soloVentas && hasReceta && (!recetaGuardada || !recetaGuardada.productos || recetaGuardada.productos.length === 0)) {
            newFieldErrors.receta = true;
            hasErrors = true;
        }

        if (hasErrors) {
            setFieldErrors(newFieldErrors);
            return;
        }

        setFieldErrors({ name: false, stock: false, prices: {}, receta: false });

        const parseOptionalNum = (val, parser = parseFloat) => {
            if (val === '' || val === null || val === undefined) return null;
            const n = parser(val);
            return isNaN(n) ? null : n;
        };

        const datosParaEnviar = {
            name: formData.name,
            description: formData.description || null,
            stock: parseInt(formData.stock),
            codigo_barras: formData.codigo_barras || null,
            grup: parseOptionalNum(formData.grup, (v) => parseInt(v)),
            stock_minimo: parseOptionalNum(formData.stock_minimo) ?? 0,
            costo_produccion: parseOptionalNum(formData.costo_produccion),
            category_ids: formData.category_ids || [],
            prices: formData.prices,
            receta: (!soloVentas && hasReceta) ? recetaGuardada : null
        };

        setLoading(true);
        try {
            let response;
            const esEdicion = !!productoSeleccionado;

            if (esEdicion) {
                response = await productsAlmacenService.update(productoSeleccionado.id, datosParaEnviar);
            } else {
                response = await productsAlmacenService.create(datosParaEnviar);
            }

            if (response.success) {
                // Fusionar: primero los datos enviados (incluye description), luego lo que devuelve la API
                const productoGuardado = {
                    ...datosParaEnviar,
                    ...(response.data || {}),
                    description: formData.description || null,
                    category_ids: formData.category_ids,
                    category_name: response.data?.category_name || null,
                    category_names: response.data?.category_names || [],
                    producto_categoria: response.data?.producto_categoria || [],
                    price_product: response.data?.price_product || productoSeleccionado?.price_product || [],
                    recetas: response.data?.recetas || (hasReceta ? [recetaGuardada] : []) || productoSeleccionado?.recetas || [],
                    id: response.data?.id || productoSeleccionado?.id,
                };

                if (onGuardar) {
                    onGuardar(productoGuardado);
                }

                setLoading(false);
                onClose();
                showSuccess(null, response.message);
            } else {
                setLoading(false);
                showDanger(null, response.message);
            }
        } catch (error) {
            setLoading(false);
            showDanger(null, 'Revisa tu conexión a internet');
        }
    };

    const handleClose = () => {
        if (loading) return;
        onClose();
    };



    return (
        <>
            <ModalLateral
                isOpen={isOpen}
                onClose={handleClose}
                title={productoSeleccionado ? "Editar Producto" : "Nuevo Producto"}
            confirmText="Guardar"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        >
            <Input
                tipo="text"
                required={true}
                label="Nombre del Producto"
                value={formData.name}
                onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setFieldErrors((prev) => ({ ...prev, name: false }));
                }}
                readOnly={loading}
                error={fieldErrors.name}
                onClearError={() => setFieldErrors((prev) => ({ ...prev, name: false }))}
            />
            <Input
                tipo="text"
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                readOnly={loading}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
                <Input
                    tipo="number"
                    required={true}
                    label="Stock"
                    value={formData.stock}
                    onChange={(e) => {
                        setFormData({ ...formData, stock: e.target.value });
                        setFieldErrors((prev) => ({ ...prev, stock: false }));
                    }}
                    readOnly={loading}
                    error={fieldErrors.stock}
                    onClearError={() => setFieldErrors((prev) => ({ ...prev, stock: false }))}
                />
                <Input
                    tipo="number"
                    label="Stock mínimo"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                    step="0.01"
                    min="0"
                    readOnly={loading}
                />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <Input
                    tipo="text"
                    label="Código de barras"
                    value={formData.codigo_barras}
                    onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                    readOnly={loading}
                />
                <Input
                    tipo="number"
                    label="Grupo"
                    value={formData.grup}
                    onChange={(e) => setFormData({ ...formData, grup: e.target.value })}
                    step="1"
                    min="1"
                    readOnly={loading}
                />
            </div>

            {/* Categoría con InputSelect */}
            <SelectCategoriasAlmacen
                value={formData.category_ids}
                onChange={(vals) => setFormData({ ...formData, category_ids: vals })}
                fetchTrigger={isOpen}
                disabled={loading}
                multiple={true}
                placeholder="Buscar categoría..."
            />

                <Input
                    tipo="number"
                    label="Costo de compra"
                    value={formData.costo_produccion}
                    onChange={(e) => setFormData({ ...formData, costo_produccion: e.target.value })}
                    step="0.01"
                    min="0"
                    readOnly={loading}
                />
         

            <h4 style={{ marginBlock: '5px', fontSize: '12px', color: 'var(--black-color)' }}>PRECIOS</h4>
            {loadingPrecios ? (
                <NoData
                    icon="loader-alt"
                    title="Cargando precios..."
                    detail="Obteniendo tipos de precios disponibles"
                    transparent={true}
                    minHeight="150px"
                />
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {preciosTipos.map((priceType) => (
                        <div key={priceType.id} style={{ flex: '1 1 45%' }}>
                            <Input
                                tipo="number"
                                label={priceType.name}
                                value={formData.prices[priceType.id] ?? 0}
                                onChange={(e) => handlePriceChange(priceType.id, e.target.value)}
                                step="0.01"
                                min="0"
                                required={true}
                                readOnly={loading}
                                error={fieldErrors.prices?.[priceType.id]}
                                onClearError={() => setFieldErrors((prev) => ({ ...prev, prices: { ...prev.prices, [priceType.id]: false } }))}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Sección de Receta */}
            {!soloVentas && (
                <>
                    <h4 style={{ marginBlock: '5px', fontSize: '12px', color: 'var(--black-color)' }}>RECETA</h4>

                        <InputSwitch
                            label="¿Tiene receta?"
                            subtitle="Marca si este producto se produce a partir de materias primas de acopio"
                            checked={hasReceta}
                            onChange={(checked) => {
                                setHasReceta(checked);
                                if (!checked) setRecetaGuardada(null);
                            }}
                            icon="receipt"
                            readOnly={loading}
                        />
                 

                    {hasReceta && (
                        <Boton
                            className='btn-cancel'
                            label={recetaGuardada ? 'Editar Receta' : 'Crear Receta'}
                            style={{ width: '100%' }}
                            onClick={() => setIsRecetaOpen(true)}
                            readOnly={loading}
                        />
                    )}

                    {hasReceta && (!recetaGuardada || !recetaGuardada.productos || recetaGuardada.productos.length === 0) && (
                        
                            <Mensaje
                                type={fieldErrors.receta ? "error" : "warning"}
                                title={fieldErrors.receta ? "Receta vacía" : "Configurar Receta"}
                                message="Debe configurar una receta con al menos un producto ingrediente."
                            />
                       
                    )}
                </>
            )}
        </ModalLateral>

        <AgregarEditarReceta
            isOpen={isRecetaOpen}
            setIsOpen={setIsRecetaOpen}
            productoAlmacenId={productoSeleccionado?.id || null}
            recetaData={recetaGuardada}
            onRecetaCreated={(data) => { setRecetaGuardada(data); setIsRecetaOpen(false); }}
            onRecetaUpdated={(data) => { setRecetaGuardada(data); setIsRecetaOpen(false); }}
        />
        </>
    );
};

export default AgregarEditarProducto;