import React, { useState, useEffect } from 'react';
import styles from '../../../../styles/view.module.css';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import InputNormal from '../../../common/InputNormal';
import InputDate from '../../../common/InputDate';
import InputSugerencias from '../../../common/InputSugerencias';
import Select from '../../../common/Select';
import Notification from '../../../common/Notification';
import FetchData from '../../../mixed/FetchData';
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

    // Estado para notificaciones
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'error',
        text: ''
    });

    // Opciones para el select de proceso
    const opcionesProceso = [
        { value: 'cernido', label: 'Cernido', icon: 'filter' },
        { value: 'seleccionado', label: 'Seleccionado', icon: 'check-circle' },
        { value: 'ninguno', label: 'Ninguno', icon: 'x-circle' }
    ];

    const mostrarNotificacion = (tipo, texto) => {
        setNotification({
            isVisible: true,
            type: tipo,
            text: texto
        });

        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

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

    // Funciones para manejar la carga de productos
    const handleProductosLoaded = (data) => {
        setProductos(data || []);
    };

    const handleLoadingStart = () => {
        setLoadingProductos(true);
    };

    const handleLoadingEnd = () => {
        setLoadingProductos(false);
    };

    // Limpiar formulario cuando se abre/cierra el modal
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
            setNotification({
                isVisible: false,
                type: 'error',
                text: ''
            });
        }
    }, [isOpen]);

    // Función para actualizar los datos del formulario
    const handleChange = (field, value) => {
        setDataProduccion({ ...dataProduccion, [field]: value });
    };

    // Función para manejar el cambio del select de proceso
    const handleProcesoChange = (value) => {
        setDataProduccion(prev => ({ ...prev, proceso: value }));
    };

    // Función para manejar la selección de producto desde las sugerencias
    const handleProductoSelect = (producto) => {
        setProductoSeleccionado(producto);
        setDataProduccion(prev => ({ ...prev, producto: producto.name }));
        verificarRecetaProducto(producto.id);
    };

    // Función para manejar el cambio manual del input de producto
    const handleProductoChange = (e) => {
        const value = e.target.value;
        setDataProduccion(prev => ({ ...prev, producto: value }));

        // Si el valor no coincide exactamente con el producto seleccionado, limpiar la selección
        if (!productoSeleccionado || productoSeleccionado.name !== value) {
            setProductoSeleccionado(null);
            resetRecetaProductoState();
        }
    };

    // Función para validar y enviar los datos
    const handleSubmit = async () => {
        // Validaciones
        if (!dataProduccion.producto.trim()) {
            mostrarNotificacion('error', 'El producto es obligatorio');
            return;
        }

        if (!productoSeleccionado || !productoSeleccionado.id) {
            mostrarNotificacion('error', 'Debe seleccionar un producto válido de la lista');
            return;
        }

        if (recetaProductoState.loading) {
            mostrarNotificacion('warning', 'Estamos validando la receta del producto, por favor espera.');
            return;
        }

        if (!recetaProductoState.tieneReceta) {
            const mensaje = recetaProductoState.error || 'El producto seleccionado no tiene receta. Informe al administrador.';
            mostrarNotificacion('error', mensaje);
            return;
        }

        if (!dataProduccion.lote || dataProduccion.lote.toString().trim() === '') {
            mostrarNotificacion('error', 'El lote es obligatorio');
            return;
        }

        if (isNaN(dataProduccion.lote) || parseInt(dataProduccion.lote) <= 0) {
            mostrarNotificacion('error', 'El lote debe ser un número válido mayor a 0');
            return;
        }

        if (!dataProduccion.proceso) {
            mostrarNotificacion('error', 'Debe seleccionar un proceso');
            return;
        }


        if (!dataProduccion.terminados || dataProduccion.terminados.toString().trim() === '') {
            mostrarNotificacion('error', 'La cantidad de terminados es obligatoria');
            return;
        }

        if (isNaN(dataProduccion.terminados) || parseInt(dataProduccion.terminados) < 0) {
            mostrarNotificacion('error', 'La cantidad de terminados debe ser un número válido mayor o igual a 0');
            return;
        }

        if (!dataProduccion.fechaVencimiento) {
            mostrarNotificacion('error', 'La fecha de vencimiento es obligatoria');
            return;
        }

        // Validar que el mes/año no sea anterior al actual
        const [año, mes] = dataProduccion.fechaVencimiento.split('-');
        const fechaSeleccionada = new Date(parseInt(año), parseInt(mes) - 1); // mes - 1 porque Date usa 0-11
        const hoy = new Date();
        const mesActual = new Date(hoy.getFullYear(), hoy.getMonth());

        if (fechaSeleccionada < mesActual) {
            mostrarNotificacion('error', 'La fecha de vencimiento no puede ser anterior al mes actual');
            return;
        }

        setLoading(true);
        try {
            // Preparar datos para enviar al servidor
            const registroData = {
                producto_almacen_id: productoSeleccionado?.id || null,
                lote: parseInt(dataProduccion.lote),
                proceso: dataProduccion.proceso,
                microondas: parseInt(dataProduccion.microondas) || 0,
                terminados: parseInt(dataProduccion.terminados),
                vencimiento: dataProduccion.fechaVencimiento
            };

            // Enviar datos al servidor
            const response = await registrosProduccionDamabravaService.create(registroData);

            if (response.success) {
                mostrarNotificacion('success', 'Producción registrada exitosamente');

                // Limpiar formulario pero no cerrar modal
                setDataProduccion({
                    producto: '',
                    lote: '',
                    proceso: '',
                    microondas: '',
                    terminados: '',
                    fechaVencimiento: ''
                });
                setProductoSeleccionado(null);
            } else {
                mostrarNotificacion('error', response.message || 'Error al registrar la producción');
            }

        } catch (error) {
            console.error('Error al registrar producción:', error);

            // Manejar errores específicos de stock insuficiente
            if (error.response?.data?.ingredientesConStockInsuficiente) {
                const ingredientes = error.response.data.ingredientesConStockInsuficiente;
                let mensajeError = 'Stock insuficiente de ingredientes:\n';
                ingredientes.forEach(ing => {
                    mensajeError += `• ${ing.ingrediente}: Necesitas ${ing.cantidadNecesaria}, tienes ${ing.stockActual} (faltan ${ing.faltante})\n`;
                });
                mostrarNotificacion('error', mensajeError);
            } else {
                mostrarNotificacion('error', error.message || 'Error de conexión con el servidor');
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
                    <p className={styles.subTitle}>INFORMACIÓN DE PRODUCCIÓN</p>

                    <InputSugerencias
                        type="text"
                        value={dataProduccion.producto}
                        placeholder='Nombre del Producto'
                        onChange={handleProductoChange}
                        sugerencias={productos}
                        onSugerenciaSelect={handleProductoSelect}
                        mostrarCampo="name"
                        buscarCampo="name"
                        minCaracteres={1}
                        showIcon={true}
                        iconName="box"
                        disabled={loadingProductos}
                        loading={loadingProductos}
                    />

                    <InputNormal
                        tipo="number"
                        value={dataProduccion.lote}
                        placeholder='Número de Lote'
                        onChange={(e) => handleChange('lote', e.target.value)}
                        icon='hash'
                        step="1"
                        min="1"
                    />


                    <Select
                        placeholder="Proceso"
                        options={opcionesProceso}
                        value={dataProduccion.proceso}
                        onChange={handleProcesoChange}
                        icon="cog"
                    />

                    <InputNormal
                        tipo="number"
                        value={dataProduccion.microondas}
                        placeholder='Tiempo Microondas (segundos)'
                        onChange={(e) => handleChange('microondas', e.target.value)}
                        icon='time'
                        step="1"
                        min="0"
                    />

                    <InputNormal
                        tipo="number"
                        value={dataProduccion.terminados}
                        placeholder='Cantidad Terminados'
                        onChange={(e) => handleChange('terminados', e.target.value)}
                        icon='check-circle'
                        step="1"
                        min="0"
                    />
                    <p className={styles.subTitle}>FECHA DE VENCIMIENTO</p>

                    <InputDate
                        mode="month"
                        value={dataProduccion.fechaVencimiento}
                        onChange={(val) => handleChange('fechaVencimiento', val)}
                        placeholder="Mes y Año de Vencimiento"
                        icon="calendar"
                    />

                    <div className={styles.buttons} style={{ marginTop: 'auto' }}>
                        <Boton
                            className='btn-original'
                            label='Registrar Producción'
                            style={{ marginTop: 'auto' }}
                            onClick={handleSubmit}
                            loading={loading}
                            disabled={
                                !dataProduccion.producto.trim() ||
                                !dataProduccion.lote ||
                                !dataProduccion.proceso ||
                                !dataProduccion.terminados ||
                                !dataProduccion.fechaVencimiento ||
                                !productoSeleccionado ||
                                recetaProductoState.loading ||
                                !recetaProductoState.tieneReceta
                            }
                        />
                    </div>
                </div>

                <Notification
                    isVisible={notification.isVisible}
                    type={notification.type}
                    text={notification.text}
                />
            </ViewModal>

            {/* FetchData para obtener productos del almacén (ligero, solo id y name) */}
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
