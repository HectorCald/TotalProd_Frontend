import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import InputSelect from '../../../../components/common/inputs/InputSelect';
import InputSelectBox from '../../../../components/common/inputs/InputSelectBox';
import InputFecha from '../../../../components/common/inputs/InputFecha';
import FetchData from '../../../../components/mixed/FetchData';
import { useToast } from '../../../../context/ToastContext';
import productsAlmacenService from '../../../../services/productsAlmacenService';
import registrosProduccionDamabravaService from '../../../../services/registrosProduccionDamabravaService';

const initialRecetaState = {
    loading: false,
    tieneReceta: false,
    error: null,
    productoId: null
};

const opcionesProceso = [
    { value: 'cernido', label: 'Cernido' },
    { value: 'seleccionado', label: 'Seleccionado' },
    { value: 'ninguno', label: 'Ninguno' }
];

const Formulario = ({ isOpen, onClose, onGuardar }) => {
    const { showSuccess, showDanger, showWarning } = useToast();

    const [loading, setLoading] = useState(false);
    const [productos, setProductos] = useState([]);
    const [loadingProductos, setLoadingProductos] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [recetaProductoState, setRecetaProductoState] = useState(initialRecetaState);

    const [formData, setFormData] = useState({
        producto_almacen_id: '',
        lote: '',
        proceso: '',
        microondas: 0,
        terminados: '',
        fechaVencimiento: ''
    });

    const [fieldErrors, setFieldErrors] = useState({
        producto_almacen_id: false,
        lote: false,
        proceso: false,
        microondas: false,
        terminados: false,
        fechaVencimiento: false
    });

    const resetRecetaState = () => {
        setRecetaProductoState({ ...initialRecetaState });
    };

    const verificarRecetaProducto = async (productoId) => {
        if (!productoId) {
            resetRecetaState();
            return;
        }
        setRecetaProductoState(prev => ({ ...prev, loading: true, productoId, error: null, tieneReceta: false }));
        try {
            const response = await productsAlmacenService.getById(productoId);
            if (response.success && response.data) {
                const tieneReceta = Array.isArray(response.data.recetas) && response.data.recetas.length > 0;
                setRecetaProductoState({
                    loading: false,
                    tieneReceta,
                    error: tieneReceta ? null : 'El producto seleccionado no tiene receta. Informe al administrador.',
                    productoId
                });
            } else {
                setRecetaProductoState({
                    loading: false,
                    tieneReceta: false,
                    error: response.message || 'No se pudo validar la receta del producto',
                    productoId
                });
            }
        } catch (error) {
            setRecetaProductoState({
                loading: false,
                tieneReceta: false,
                error: error.message || 'Error de conexión al validar la receta del producto',
                productoId
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            setFormData({
                producto_almacen_id: '',
                lote: '',
                proceso: '',
                microondas: 0,
                terminados: '',
                fechaVencimiento: ''
            });
            setProductoSeleccionado(null);
            resetRecetaState();
            setFieldErrors({
                producto_almacen_id: false,
                lote: false,
                proceso: false,
                microondas: false,
                terminados: false,
                fechaVencimiento: false
            });
        }
    }, [isOpen]);

    const handleProductoChange = (val) => {
        const producto = productos.find(p => String(p.id) === String(val));
        setFormData(prev => ({ ...prev, producto_almacen_id: val || '' }));
        setFieldErrors(prev => ({ ...prev, producto_almacen_id: false }));
        if (producto) {
            setProductoSeleccionado(producto);
            verificarRecetaProducto(producto.id);
        } else {
            setProductoSeleccionado(null);
            resetRecetaState();
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleConfirm = async () => {
        let hasErrors = false;
        const newErrors = {
            producto_almacen_id: false,
            lote: false,
            proceso: false,
            microondas: false,
            terminados: false,
            fechaVencimiento: false
        };

        if (!formData.producto_almacen_id) {
            newErrors.producto_almacen_id = 'Debe seleccionar un producto';
            hasErrors = true;
        } else if (recetaProductoState.loading) {
            showWarning('Espera', 'Estamos validando la receta del producto, por favor espera.', 5000);
            return;
        } else if (!recetaProductoState.tieneReceta) {
            newErrors.producto_almacen_id = recetaProductoState.error || 'El producto no tiene receta. Informe al administrador.';
            hasErrors = true;
        }

        if (!formData.lote || formData.lote.toString().trim() === '') {
            newErrors.lote = 'El lote es obligatorio';
            hasErrors = true;
        } else if (isNaN(formData.lote) || parseInt(formData.lote) <= 0) {
            newErrors.lote = 'El lote debe ser un número mayor a 0';
            hasErrors = true;
        }

        if (!formData.proceso) {
            newErrors.proceso = 'Debe seleccionar un proceso';
            hasErrors = true;
        }

        const micVal = formData.microondas;
        if (micVal !== '' && micVal !== 0 && (isNaN(micVal) || parseInt(micVal) < 0)) {
            newErrors.microondas = 'El tiempo debe ser mayor o igual a 0';
            hasErrors = true;
        }

        if (!formData.terminados || formData.terminados.toString().trim() === '') {
            newErrors.terminados = 'La cantidad de terminados es obligatoria';
            hasErrors = true;
        } else if (isNaN(formData.terminados) || parseInt(formData.terminados) < 0) {
            newErrors.terminados = 'La cantidad debe ser mayor o igual a 0';
            hasErrors = true;
        }

        if (!formData.fechaVencimiento) {
            newErrors.fechaVencimiento = 'La fecha de vencimiento es obligatoria';
            hasErrors = true;
        } else {
            const [año, mes] = formData.fechaVencimiento.split('-');
            const fechaSeleccionada = new Date(parseInt(año), parseInt(mes) - 1);
            const hoy = new Date();
            const mesActual = new Date(hoy.getFullYear(), hoy.getMonth());
            if (fechaSeleccionada < mesActual) {
                newErrors.fechaVencimiento = 'La fecha no puede ser anterior al mes actual';
                hasErrors = true;
            }
        }

        if (hasErrors) {
            setFieldErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            const registroData = {
                producto_almacen_id: productoSeleccionado?.id || null,
                lote: parseInt(formData.lote),
                proceso: formData.proceso,
                microondas: parseInt(formData.microondas) || 0,
                terminados: parseInt(formData.terminados),
                vencimiento: formData.fechaVencimiento
            };

            const response = await registrosProduccionDamabravaService.create(registroData);

            if (response.success) {
                showSuccess('Éxito', 'Producción registrada exitosamente', 5000);
                if (onGuardar) {
                    onGuardar(response.data || registroData);
                }
                setLoading(false);
                onClose();
            } else {
                setLoading(false);
                showDanger('Error', response.message || 'Error al registrar la producción', 5000);
            }
        } catch (error) {
            setLoading(false);
            if (error.response?.data?.ingredientesConStockInsuficiente) {
                const ingredientes = error.response.data.ingredientesConStockInsuficiente;
                const mensajeError = 'Stock insuficiente: ' + ingredientes.map(ing =>
                    `${ing.ingrediente}: necesitas ${ing.cantidadNecesaria}, tienes ${ing.stockActual}`
                ).join('; ');
                showDanger('Stock insuficiente', mensajeError, 6000);
            } else {
                showDanger('Error', error.message || 'Error de conexión con el servidor', 5000);
            }
        }
    };

    const handleClose = () => {
        if (loading) return;
        onClose();
    };

    const opcionesProductos = productos.map(p => ({ value: p.id, label: p.name }));

    return (
        <>
            <ModalLateral
                isOpen={isOpen}
                onClose={handleClose}
                title="Nuevo Registro"
                confirmText="Registrar"
                onConfirm={handleConfirm}
                loading={loading}
                disableClose={loading}
            >
                <InputSelectBox
                    label="Producto"
                    value={formData.producto_almacen_id}
                    onChange={handleProductoChange}
                    options={opcionesProductos}
                    placeholder={loadingProductos ? 'Cargando productos...' : 'Seleccionar producto'}
                    required
                    disabled={loadingProductos || loading}
                    error={fieldErrors.producto_almacen_id}
                    onClearError={() => setFieldErrors(prev => ({ ...prev, producto_almacen_id: false }))}
                />

                <Input
                    tipo="number"
                    label="Número de Lote"
                    value={formData.lote}
                    onChange={(e) => handleChange('lote', e.target.value)}
                    required
                    readOnly={loading}
                    error={fieldErrors.lote}
                    onClearError={() => setFieldErrors(prev => ({ ...prev, lote: false }))}
                    step="1"
                    min="1"
                />

                <InputSelect
                    label="Proceso"
                    value={formData.proceso}
                    onChange={(val) => handleChange('proceso', val)}
                    options={opcionesProceso}
                    placeholder="Seleccionar"
                    required
                    error={fieldErrors.proceso}
                />

                <Input
                    tipo="number"
                    label="Tiempo Microondas (segundos)"
                    value={formData.microondas}
                    onChange={(e) => handleChange('microondas', e.target.value)}
                    readOnly={loading}
                    error={fieldErrors.microondas}
                    onClearError={() => setFieldErrors(prev => ({ ...prev, microondas: false }))}
                    step="1"
                    min="0"
                />

                <Input
                    tipo="number"
                    label="Cantidad Terminados"
                    value={formData.terminados}
                    onChange={(e) => handleChange('terminados', e.target.value)}
                    required
                    readOnly={loading}
                    error={fieldErrors.terminados}
                    onClearError={() => setFieldErrors(prev => ({ ...prev, terminados: false }))}
                    step="1"
                    min="0"
                />

                <InputFecha
                    mode="month"
                    label="Fecha de Vencimiento"
                    value={formData.fechaVencimiento}
                    onChange={(val) => handleChange('fechaVencimiento', val)}
                    required
                    readOnly={loading}
                    error={fieldErrors.fechaVencimiento}
                    onClearError={() => setFieldErrors(prev => ({ ...prev, fechaVencimiento: false }))}
                    yearDirection="future"
                    openDirection="up"
                />
            </ModalLateral>

            <FetchData
                service={productsAlmacenService}
                method="getAllForProduction"
                methodParams={[]}
                isOpen={isOpen}
                onDataLoaded={(data) => setProductos(data || [])}
                onLoadingStart={() => setLoadingProductos(true)}
                onLoadingEnd={() => setLoadingProductos(false)}
                serviceName="ProductosAlmacenForProduction"
            />
        </>
    );
};

export default Formulario;
