import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import InputSelect from '../../../../components/common/inputs/InputSelect';
import InputSwitch from '../../../../components/common/inputs/InputSwitch';
import Boton from '../../../../components/common/botones/Boton';
import { useToast } from '../../../../context/ToastContext';
import productsAcopioService from '../../../../services/productsAcopioService';
import Mensaje from '../../../../components/common/outputs/Mensaje';
import SelectCategoriasAcopio from '../../../../components/common/fast/SelectCategoriasAcopio';
import AgregarEditarReceta from './AgregarEditarReceta';
import useSessionCache from '../../../../hooks/useSessionCache';
import typeMeasureService from '../../../../services/typeMeasureService';

const AgregarEditarProducto = ({
    isOpen,
    onClose,
    productoSeleccionado,
    onGuardar
}) => {
    const { showSuccess, showDanger } = useToast();

    const { value: typeMeasures, setValue: setTypeMeasures } = useSessionCache({
        key: 'ListadoTiposMedida',
        defaultValue: []
    });

    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ name: false, quantity: false, type_measure_id: false, receta: false });
    
    const [isRecetaOpen, setIsRecetaOpen] = useState(false);
    const [hasReceta, setHasReceta] = useState(false);
    const [recetaGuardada, setRecetaGuardada] = useState(null);
    const [hasMovements, setHasMovements] = useState(false);


    const [formData, setFormData] = useState({
        name: '',
        description: '',
        quantity: 0,
        type_measure_id: '',
        category_id: '',
        stock_minimo: ''
    });

    useEffect(() => {
        if (!isOpen) return;

        const fetchMeasures = async () => {
            // Ya no retornamos para que siempre actualice en segundo plano
            try {
                const response = await typeMeasureService.getAll();
                if (response.success && response.data) {
                    setTypeMeasures(response.data);
                }
            } catch (error) {
                console.error("Error al obtener unidades de medida:", error);
            }
        };

        fetchMeasures();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setFieldErrors({ name: false, quantity: false, type_measure_id: false, receta: false });

            if (productoSeleccionado) {
                // Cargar receta si existe
                let recetaData = null;
                if (productoSeleccionado.recetas_acopio && productoSeleccionado.recetas_acopio.length > 0) {
                    const receta = productoSeleccionado.recetas_acopio[0];
                    recetaData = {
                        descripcion: receta.description || '',
                        productos: receta.recetas_acopio_detalle ? receta.recetas_acopio_detalle.map(detalle => ({
                            producto_acopio_id: detalle.products_acopio?.id || detalle.producto_acopio_id,
                            cantidad: detalle.cantidad
                        })) : []
                    };
                    setHasReceta(true);
                } else {
                    setHasReceta(false);
                }
                setRecetaGuardada(recetaData);

                setFormData({
                    name: productoSeleccionado.name || '',
                    description: productoSeleccionado.description || '',
                    quantity: productoSeleccionado.quantity !== undefined && productoSeleccionado.quantity !== null ? productoSeleccionado.quantity : 0,
                    type_measure_id: productoSeleccionado.type_measure_id || '',
                    category_id: productoSeleccionado.category_id || '',
                    stock_minimo: productoSeleccionado.stock_minimo !== undefined && productoSeleccionado.stock_minimo !== null ? productoSeleccionado.stock_minimo : ''
                });

                // Check movements
                const checkMovements = async () => {
                    try {
                        const response = await productsAcopioService.hasMovements(productoSeleccionado.id);
                        if (response.success) {
                            setHasMovements(response.data?.hasMovements || false);
                        }
                    } catch (error) {
                        console.error('Error verificando movimientos:', error);
                    }
                };
                checkMovements();
            } else {
                setFormData({
                    name: '',
                    description: '',
                    quantity: 0,
                    type_measure_id: '',
                    category_id: '',
                    stock_minimo: ''
                });
                setHasReceta(false);
                setRecetaGuardada(null);
                setHasMovements(false);
            }
        }
    }, [isOpen, productoSeleccionado]);

    const handleConfirm = async () => {
        let hasErrors = false;
        const newFieldErrors = { name: false, quantity: false, type_measure_id: false, receta: false };

        if (!formData.name.trim()) {
            newFieldErrors.name = true;
            hasErrors = true;
        }

        const quantityVal = formData.quantity;
        if (quantityVal === '' || quantityVal === null || quantityVal === undefined) {
            newFieldErrors.quantity = true;
            hasErrors = true;
        } else {
            const numQuantity = parseFloat(String(quantityVal).replace(',', '.'));
            if (isNaN(numQuantity) || numQuantity < 0) {
                newFieldErrors.quantity = true;
                hasErrors = true;
            }
        }

        if (!formData.type_measure_id) {
            newFieldErrors.type_measure_id = true;
            hasErrors = true;
        }

        if (hasReceta && (!recetaGuardada || !recetaGuardada.productos || recetaGuardada.productos.length === 0)) {
            newFieldErrors.receta = true;
            hasErrors = true;
        }

        if (hasErrors) {
            setFieldErrors(newFieldErrors);
            return;
        }

        setFieldErrors({ name: false, quantity: false, type_measure_id: false, receta: false });

        const numQuantity = parseFloat(String(formData.quantity).replace(',', '.'));

        const productDataToSubmit = {
            name: formData.name,
            description: formData.description || null,
            quantity: numQuantity,
            type_measure_id: formData.type_measure_id,
            category_id: formData.category_id || null,
            stock_minimo: formData.stock_minimo ? parseFloat(formData.stock_minimo) : 0,
            receta: hasReceta ? recetaGuardada : null
        };

        setLoading(true);
        try {
            let response;
            const esEdicion = !!productoSeleccionado;

            if (esEdicion) {
                response = await productsAcopioService.update(productoSeleccionado.id, productDataToSubmit);
            } else {
                response = await productsAcopioService.create(productDataToSubmit);
            }

            if (response.success) {
                if (onGuardar) {
                    onGuardar(response.data);
                }

                setLoading(false);
                onClose();
                showSuccess(null, response.message || `Producto ${esEdicion ? 'actualizado' : 'creado'} exitosamente`);
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

    const opcionesMedidas = typeMeasures.map(item => ({
        value: String(item.id),
        label: item.name || item.code || 'Sin nombre'
    }));

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
                        label="Cantidad"
                        value={formData.quantity}
                        onChange={(e) => {
                            setFormData({ ...formData, quantity: e.target.value });
                            setFieldErrors((prev) => ({ ...prev, quantity: false }));
                        }}
                        readOnly={loading}
                        error={fieldErrors.quantity}
                        onClearError={() => setFieldErrors((prev) => ({ ...prev, quantity: false }))}
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

                <InputSelect
                    label="Tipo de medida"
                    value={String(formData.type_measure_id || '')}
                    onChange={(val) => {
                        setFormData({ ...formData, type_measure_id: val });
                        setFieldErrors((prev) => ({ ...prev, type_measure_id: false }));
                    }}
                    options={opcionesMedidas}
                    placeholder={productoSeleccionado && hasMovements ? 'No editable - tiene movimientos' : 'Seleccionar'}
                    disabled={loading || (productoSeleccionado && hasMovements)}
                    required={true}
                    error={fieldErrors.type_measure_id}
                />

                {productoSeleccionado && hasMovements && (
                    <Mensaje
                        type="info"
                        title="Medida Bloqueada"
                        message="El tipo de medida no se puede modificar porque ya existen movimientos de inventario registrados para este producto."
                    />

                )}

                <SelectCategoriasAcopio
                    value={String(formData.category_id || '')}
                    onChange={(val) => setFormData({ ...formData, category_id: val })}
                    fetchTrigger={isOpen}
                    disabled={loading}
                    placeholder="Sin categoría"
                />

                <h4 style={{ marginBlock: '5px', fontSize: '12px', color: 'var(--black-color)' }}>RECETA</h4>
                    <InputSwitch
                        label="¿Tiene receta?"
                        subtitle="Marca si esta materia prima se produce a partir de otra materia prima"
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
                        className='btn-default'
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