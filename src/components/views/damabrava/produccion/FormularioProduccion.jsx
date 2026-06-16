import React, { useState, useEffect } from 'react';
import styles from '../../../../styles/view.module.css';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/old/HeaderModal';
import Boton from '../../../common/botones/Boton';
import Input from '../../../common/inputs/Input';
import InputSelect from '../../../common/inputs/InputSelect';
import InputFecha from '../../../common/inputs/InputFecha';
import InputSearch from '../../../common/inputs/InputSearch';
import FetchData from '../../../mixed/FetchData';
import { useToast } from '../../../../context/ToastContext';
import { useLayout } from '../../../../context/LayoutContext';
import productsAlmacenService from '../../../../services/productsAlmacenService';
import registrosProduccionDamabravaService from '../../../../services/registrosProduccionDamabravaService';

const initialRecetaState = {
    loading: false,
    tieneReceta: false,
    error: null,
    productoId: null
};

function FormularioProduccion({ isOpen, setIsOpen }) {
    const { isLargeScreen } = useLayout();
    const { showSuccess, showDanger, showWarning } = useToast();
    const [dataProduccion, setDataProduccion] = useState({
        producto: '',
        lote: '',
        proceso: '',
        microondas: '',
        terminados: '',
        fechaVencimiento: ''
    });

    const [loading, setLoading] = useState(false);
    const [productos, setProductos] = useState([]);
    const [loadingProductos, setLoadingProductos] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [recetaProductoState, setRecetaProductoState] = useState(initialRecetaState);
    const [fieldErrors, setFieldErrors] = useState({
        producto: false,
        lote: false,
        proceso: false,
        microondas: false,
        terminados: false,
        fechaVencimiento: false
    });

    // Opciones para el select de proceso
    const opcionesProceso = [
        { value: 'cernido', label: 'Cernido' },
        { value: 'seleccionado', label: 'Seleccionado' },
        { value: 'ninguno', label: 'Ninguno' }
    ];

    const resetRecetaProductoState = () => {
        setRecetaProductoState({ ...initialRecetaState });
    };

    const verificarRecetaProducto = async (productoId) => {
        if (!productoId) {
            resetRecetaProductoState();
            return;
        }

        setRecetaProductoState(prev => ({
            ...prev,
            loading: true,
            productoId,
            error: null,
            tieneReceta: false
        }));

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
                const mensaje = response.message || 'No se pudo validar la receta del producto';
                setRecetaProductoState({
                    loading: false,
                    tieneReceta: false,
                    error: mensaje,
                    productoId
                });
            }
        } catch (error) {
            const mensaje = error.message || 'Error de conexión al validar la receta del producto';
            setRecetaProductoState({
                loading: false,
                tieneReceta: false,
                error: mensaje,
                productoId
            });
        }
    };

    const handleProductosLoaded = (data) => {
        setProductos(data || []);
    };

    const handleLoadingStart = () => {
        setLoadingProductos(true);
    };

    const handleLoadingEnd = () => {
        setLoadingProductos(false);
    };

    useEffect(() => {
        if (isOpen) {
            setDataProduccion({
                producto: '',
                lote: '',
                proceso: '',
                microondas: '',
                terminados: '',
                fechaVencimiento: ''
            });
            setProductoSeleccionado(null);
            resetRecetaProductoState();
            setFieldErrors({
                producto: false,
                lote: false,
                proceso: false,
                microondas: false,
                terminados: false,
                fechaVencimiento: false
            });
        }
    }, [isOpen]);

    const handleChange = (field, value) => {
        setDataProduccion(prev => ({ ...prev, [field]: value }));
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleProcesoChange = (value) => {
        setDataProduccion(prev => ({ ...prev, proceso: value }));
        if (fieldErrors.proceso) {
            setFieldErrors(prev => ({ ...prev, proceso: false }));
        }
    };

    const handleProductoSelect = (producto) => {
        setProductoSeleccionado(producto);
        setDataProduccion(prev => ({ ...prev, producto: producto.name }));
        if (fieldErrors.producto) {
            setFieldErrors(prev => ({ ...prev, producto: false }));
        }
        verificarRecetaProducto(producto.id);
    };

    const handleProductoChange = (e) => {
        const value = e.target.value;
        setDataProduccion(prev => ({ ...prev, producto: value }));
        if (fieldErrors.producto) {
            setFieldErrors(prev => ({ ...prev, producto: false }));
        }
        if (!productoSeleccionado || productoSeleccionado.name !== value) {
            setProductoSeleccionado(null);
            resetRecetaProductoState();
        }
    };

    const handleSubmit = async () => {
        if (!dataProduccion.producto.trim()) {
            setFieldErrors(prev => ({ ...prev, producto: true }));
            showWarning('Validación', 'El producto es obligatorio', 5000);
            return;
        }

        if (!productoSeleccionado || !productoSeleccionado.id) {
            setFieldErrors(prev => ({ ...prev, producto: true }));
            showWarning('Validación', 'Debe seleccionar un producto válido de la lista', 5000);
            return;
        }

        if (recetaProductoState.loading) {
            showWarning('Espera', 'Estamos validando la receta del producto, por favor espera.', 5000);
            return;
        }

        if (!recetaProductoState.tieneReceta) {
            const mensaje = recetaProductoState.error || 'El producto seleccionado no tiene receta. Informe al administrador.';
            showWarning('Validación', mensaje, 5000);
            return;
        }

        if (!dataProduccion.lote || dataProduccion.lote.toString().trim() === '') {
            setFieldErrors(prev => ({ ...prev, lote: true }));
            showWarning('Validación', 'El lote es obligatorio', 5000);
            return;
        }
        if (isNaN(dataProduccion.lote) || parseInt(dataProduccion.lote) <= 0) {
            setFieldErrors(prev => ({ ...prev, lote: true }));
            showWarning('Validación', 'El lote debe ser un número válido mayor a 0', 5000);
            return;
        }

        if (!dataProduccion.proceso) {
            setFieldErrors(prev => ({ ...prev, proceso: true }));
            showWarning('Validación', 'Debe seleccionar un proceso', 5000);
            return;
        }

        if (dataProduccion.microondas !== '' && (isNaN(dataProduccion.microondas) || parseInt(dataProduccion.microondas) < 0)) {
            setFieldErrors(prev => ({ ...prev, microondas: true }));
            showWarning('Validación', 'El tiempo en microondas debe ser un número mayor o igual a 0', 5000);
            return;
        }

        if (!dataProduccion.terminados || dataProduccion.terminados.toString().trim() === '') {
            setFieldErrors(prev => ({ ...prev, terminados: true }));
            showWarning('Validación', 'La cantidad de terminados es obligatoria', 5000);
            return;
        }
        if (isNaN(dataProduccion.terminados) || parseInt(dataProduccion.terminados) < 0) {
            setFieldErrors(prev => ({ ...prev, terminados: true }));
            showWarning('Validación', 'La cantidad de terminados debe ser un número válido mayor o igual a 0', 5000);
            return;
        }

        if (!dataProduccion.fechaVencimiento) {
            setFieldErrors(prev => ({ ...prev, fechaVencimiento: true }));
            showWarning('Validación', 'La fecha de vencimiento es obligatoria', 5000);
            return;
        }
        const [año, mes] = dataProduccion.fechaVencimiento.split('-');
        const fechaSeleccionada = new Date(parseInt(año), parseInt(mes) - 1);
        const hoy = new Date();
        const mesActual = new Date(hoy.getFullYear(), hoy.getMonth());
        if (fechaSeleccionada < mesActual) {
            setFieldErrors(prev => ({ ...prev, fechaVencimiento: true }));
            showWarning('Validación', 'La fecha de vencimiento no puede ser anterior al mes actual', 5000);
            return;
        }

        setFieldErrors({
            producto: false,
            lote: false,
            proceso: false,
            microondas: false,
            terminados: false,
            fechaVencimiento: false
        });

        setLoading(true);
        try {
            const registroData = {
                producto_almacen_id: productoSeleccionado?.id || null,
                lote: parseInt(dataProduccion.lote),
                proceso: dataProduccion.proceso,
                microondas: parseInt(dataProduccion.microondas) || 0,
                terminados: parseInt(dataProduccion.terminados),
                vencimiento: dataProduccion.fechaVencimiento
            };

            const response = await registrosProduccionDamabravaService.create(registroData);

            if (response.success) {
                showSuccess('Éxito', 'Producción registrada exitosamente', 5000);
                setDataProduccion({
                    producto: '',
                    lote: '',
                    proceso: '',
                    microondas: '',
                    terminados: '',
                    fechaVencimiento: ''
                });
                setProductoSeleccionado(null);
                setFieldErrors({
                    producto: false,
                    lote: false,
                    proceso: false,
                    microondas: false,
                    terminados: false,
                    fechaVencimiento: false
                });
            } else {
                showDanger('Error', response.message || 'Error al registrar la producción', 5000);
            }
        } catch (error) {
            console.error('Error al registrar producción:', error);
            if (error.response?.data?.ingredientesConStockInsuficiente) {
                const ingredientes = error.response.data.ingredientesConStockInsuficiente;
                let mensajeError = 'Stock insuficiente de ingredientes: ';
                mensajeError += ingredientes.map(ing =>
                    `${ing.ingrediente}: necesitas ${ing.cantidadNecesaria}, tienes ${ing.stockActual} (faltan ${ing.faltante})`
                ).join('; ');
                showDanger('Stock insuficiente', mensajeError, 6000);
            } else {
                showDanger('Error', error.message || 'Error de conexión con el servidor', 5000);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ViewModal isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
                <HeaderModal
                    title="Registro de Producción"
                    onClose={() => setIsOpen(false)}
                />
                <div className={styles.modalContent} style={!isLargeScreen ? { minHeight: '80vh' } : undefined}>


                    <InputSearch
                        label="Producto"
                        placeholder="Buscar y seleccionar producto"
                        value={dataProduccion.producto}
                        required
                        onChange={handleProductoChange}
                        sugerencias={productos}
                        onSugerenciaSelect={handleProductoSelect}
                        mostrarCampo="name"
                        buscarCampo="name"
                        minCaracteres={1}
                        disabled={loadingProductos}
                        loading={loadingProductos}
                        error={fieldErrors.producto}
                        onClearError={() => setFieldErrors(prev => ({ ...prev, producto: false }))}
                        onInvalidBlur={() => showWarning('Validación', 'Debe seleccionar un producto válido de la lista', 5000)}
                    />

                    <Input
                        tipo="number"
                        label="Número de Lote"
                        value={dataProduccion.lote}
                        onChange={(e) => handleChange('lote', e.target.value)}
                        required
                        error={fieldErrors.lote}
                        onClearError={() => setFieldErrors(prev => ({ ...prev, lote: false }))}
                        step="1"
                        min="1"
                    />

                    <InputSelect
                        label="Proceso"
                        value={dataProduccion.proceso}
                        onChange={handleProcesoChange}
                        options={opcionesProceso}
                        placeholder="Seleccionar"
                        required
                        error={fieldErrors.proceso}
                    />

                    <Input
                        tipo="number"
                        label="Tiempo Microondas (segundos)"
                        value={dataProduccion.microondas}
                        onChange={(e) => handleChange('microondas', e.target.value)}
                        error={fieldErrors.microondas}
                        onClearError={() => setFieldErrors(prev => ({ ...prev, microondas: false }))}
                        step="1"
                        min="0"
                    />

                    <Input
                        tipo="number"
                        label="Cantidad Terminados"
                        value={dataProduccion.terminados}
                        onChange={(e) => handleChange('terminados', e.target.value)}
                        required
                        error={fieldErrors.terminados}
                        onClearError={() => setFieldErrors(prev => ({ ...prev, terminados: false }))}
                        step="1"
                        min="0"
                    />

                    <InputFecha
                        mode="month"
                        label="Fecha de Vencimiento"
                        value={dataProduccion.fechaVencimiento}
                        onChange={(val) => handleChange('fechaVencimiento', val)}
                        required
                        error={fieldErrors.fechaVencimiento}
                        onClearError={() => setFieldErrors(prev => ({ ...prev, fechaVencimiento: false }))}
                        yearDirection="future"
                        openDirection="up"
                    />

                    <div className={styles.buttons} style={{ marginTop: 'auto' }}>
                        <Boton
                            className="btn-original"
                            label="Registrar Producción"
                            style={{ marginTop: 'auto' }}
                            onClick={handleSubmit}
                            loading={loading}
                        />
                    </div>
                </div>
            </ViewModal>

            <FetchData
                service={productsAlmacenService}
                method="getAllForProduction"
                methodParams={[]}
                isOpen={isOpen}
                onDataLoaded={handleProductosLoaded}
                onLoadingStart={handleLoadingStart}
                onLoadingEnd={handleLoadingEnd}
                serviceName="ProductosAlmacenForProduction"
            />
        </>
    );
}

export default FormularioProduccion;
