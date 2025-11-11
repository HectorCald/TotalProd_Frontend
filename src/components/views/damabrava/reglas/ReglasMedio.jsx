import React, { useEffect, useRef, useState } from 'react';
import styles from '../../../../styles/view.module.css';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import ItemView from '../../../common/ItemView';
import InputNormal from '../../../common/InputNormal';
import Select from '../../../common/Select';
import Boton from '../../../common/Boton';
import Switch from '../../../common/Switch';
import InputSugerencias from '../../../common/InputSugerencias';
import FetchData from '../../../mixed/FetchData';
import productsAlmacenService from '../../../../services/productsAlmacenService';
import Notification from '../../../common/Notification';
import reglasProduccionDamabravaService from '../../../../services/reglasProduccionDamabravaService';

const MULTIPLIER_FACTORS = {
    x1: 1,
    x2: 2,
    x3: 3,
    x4: 4,
    x5: 5,
};

const defaultGeneralBaseValues = {
    sellado: 0.006,
    cernido: 0.08,
    envasado: 0.048,
    etiquetado: 0.016,
};

const formatNumber = (value, decimals = 3) => {
    if (!Number.isFinite(value)) return '';
    return value.toFixed(decimals);
};

const initialGeneralFormState = {
    producto: '',
    sellado: formatNumber(defaultGeneralBaseValues.sellado),
    selladoMultiplier: 'x1',
    cernido: formatNumber(defaultGeneralBaseValues.cernido, 3),
    cernidoMultiplier: 'x1',
    envasado: formatNumber(defaultGeneralBaseValues.envasado),
    envasadoMultiplier: 'x1',
    etiquetado: formatNumber(defaultGeneralBaseValues.etiquetado),
    etiquetadoMultiplier: 'x1',
};

function ReglasMedio({ isOpen, setIsOpen, onReglaRegistrada }) {
    const [activeModal, setActiveModal] = useState(null); // 'general' | 'especial' | 'gramaje' | null
    const [generalForm, setGeneralForm] = useState(initialGeneralFormState);
    const [esReglaGeneral, setEsReglaGeneral] = useState(true);
    const [generalBaseValues, setGeneralBaseValues] = useState({ ...defaultGeneralBaseValues });
    const [especialProducto, setEspecialProducto] = useState('');
    const [especialProductoSeleccionado, setEspecialProductoSeleccionado] = useState(null);
    const [productos, setProductos] = useState([]);
    const [loadingProductos, setLoadingProductos] = useState(false);
    const [gramajeDesde, setGramajeDesde] = useState('');
    const [gramajeHasta, setGramajeHasta] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });
    const notificationTimeoutRef = useRef(null);

    const multiplicadorOptions = [
        { value: 'x1', label: 'x1' },
        { value: 'x2', label: 'x2' },
        { value: 'x3', label: 'x3' },
        { value: 'x4', label: 'x4' },
        { value: 'x5', label: 'x5' },
    ];

    const resetGeneralForm = () => {
        setGeneralForm(initialGeneralFormState);
        setEsReglaGeneral(true);
        setGeneralBaseValues({ ...defaultGeneralBaseValues });
    };

    const resetEspecialForm = () => {
        setEspecialProducto('');
        setEspecialProductoSeleccionado(null);
    };

    const resetGramajeForm = () => {
        setGramajeDesde('');
        setGramajeHasta('');
    };

    useEffect(() => {
        return () => {
            if (notificationTimeoutRef.current) {
                clearTimeout(notificationTimeoutRef.current);
            }
        };
    }, []);

    const mostrarNotificacion = (type, text) => {
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }

        setNotification({
            isVisible: true,
            type,
            text
        });

        notificationTimeoutRef.current = setTimeout(() => {
            setNotification((prev) => ({
                ...prev,
                isVisible: false
            }));
        }, 3000);
    };

    const handleGeneralInputChange = (field) => (event) => {
        const { value } = event.target;
        if (['sellado', 'envasado', 'etiquetado'].includes(field)) {
            const multiplierKey = `${field}Multiplier`;
            const multiplierFactor = MULTIPLIER_FACTORS[generalForm[multiplierKey]] || 1;
            const numericValue = parseFloat(value);
            if (!Number.isNaN(numericValue)) {
                setGeneralBaseValues((prev) => ({
                    ...prev,
                    [field]: numericValue / multiplierFactor,
                }));
            }
        } else if (field === 'cernido') {
            const numericValue = parseFloat(value);
            if (!Number.isNaN(numericValue)) {
                setGeneralBaseValues((prev) => ({
                    ...prev,
                    cernido: numericValue,
                }));
            }
        }

        setGeneralForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleGeneralSelectChange = (field) => (value) => {
        setGeneralForm((prev) => {
            const updated = {
                ...prev,
                [field]: value,
            };

            const baseField = field.replace('Multiplier', '');
            if (['sellado', 'envasado', 'etiquetado'].includes(baseField)) {
                const multiplierFactor = MULTIPLIER_FACTORS[value] || 1;
                const baseValue = generalBaseValues[baseField];
                updated[baseField] = formatNumber(baseValue * multiplierFactor);
            }

            return updated;
        });
    };

    const handleReglaGeneralSwitch = (checked) => {
        setEsReglaGeneral(checked);
        if (checked) {
            setGeneralForm((prev) => ({
                ...prev,
                producto: '',
            }));
        }
    };

    const handleEspecialProductoChange = (event) => {
        const { value } = event.target;
        setEspecialProducto(value);

        if (!especialProductoSeleccionado || especialProductoSeleccionado.name !== value) {
            setEspecialProductoSeleccionado(null);
        }
    };

    const handleEspecialProductoSelect = (producto) => {
        if (typeof producto === 'string') {
            setEspecialProducto(producto);
            setEspecialProductoSeleccionado(null);
            return;
        }

        setEspecialProductoSeleccionado(producto);
        setEspecialProducto(producto?.name || '');
    };

    const handleCloseModal = () => {
        setActiveModal(null);
        resetGeneralForm();
        resetEspecialForm();
        resetGramajeForm();
    setIsSaving(false);
    };

    const handleGuardarRegla = async () => {
        if (!activeModal || isSaving) {
            return;
        }

        const payload = {
            tipo: activeModal,
            sellado: generalForm.sellado,
            cernido: generalForm.cernido,
            envasado: generalForm.envasado,
            etiquetado: generalForm.etiquetado
        };

        if (activeModal === 'general') {
            payload.general = esReglaGeneral;

            if (!esReglaGeneral) {
                if (!generalForm.producto || !generalForm.producto.trim()) {
                    mostrarNotificacion('error', 'Ingresa el texto de "Producto contiene".');
                    return;
                }

                payload.contiene = generalForm.producto.trim();
            }
        } else if (activeModal === 'especial') {
            if (!especialProductoSeleccionado) {
                mostrarNotificacion('error', 'Selecciona un producto válido para la regla especial.');
                return;
            }

            payload.general = false;
            payload.contiene = (especialProducto || '').trim();
            payload.producto_almacen_id = especialProductoSeleccionado.id;
        } else if (activeModal === 'gramaje') {
            if (!gramajeDesde || !gramajeHasta) {
                mostrarNotificacion('error', 'Completa los campos "Desde" y "Hasta" para la regla por gramaje.');
                return;
            }

            payload.general = null;
            payload.desde_gramaje = gramajeDesde;
            payload.hasta_gramaje = gramajeHasta;
        }

        setIsSaving(true);

        try {
            const response = await reglasProduccionDamabravaService.create(payload);

            if (!response.success) {
                mostrarNotificacion('error', response.message || 'No se pudo registrar la regla.');
                return;
            }

            handleCloseModal();
            setIsOpen(true);
            if (onReglaRegistrada && typeof onReglaRegistrada === 'function') {
                onReglaRegistrada(response.data);
            }
            mostrarNotificacion('success', 'Regla registrada correctamente.');
        } catch (error) {
            mostrarNotificacion('error', error.message || 'No se pudo registrar la regla.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTipoRegla = (tipo) => {
        setIsOpen(false);

        if (tipo === 'general') {
            resetGeneralForm();
            setActiveModal('general');
            return;
        }

        if (tipo === 'especial') {
            resetEspecialForm();
            setActiveModal('especial');
            return;
        }

        if (tipo === 'gramaje') {
            resetGramajeForm();
            setActiveModal('gramaje');
        }
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <>
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Nueva Regla"
                onClose={handleClose}
            />
            <div className={styles.modalContent}>
                <ItemView
                    title='General'
                    description='Crear regla general'
                    icon='file'
                    arrow={true}
                    onClick={() => handleTipoRegla('general')}
                />
                    <ItemView
                        title='Especial'
                        description='Crear regla especial'
                        icon='star'
                        arrow={true}
                        onClick={() => handleTipoRegla('especial')}
                    />
                    <ItemView
                        title='Por gramaje'
                        description='Crear regla por gramaje'
                        icon='ruler'
                        arrow={true}
                        onClick={() => handleTipoRegla('gramaje')}
                    />
                </div>
            </ViewModal>
            <ViewModal isOpen={!!activeModal} setIsOpen={() => handleCloseModal()}>
                <HeaderModal
                    title={activeModal === 'especial' ? 'Regla Especial' : 'Regla General'}
                    onClose={handleCloseModal}
                />
                <div className={styles.modalContent}>
                     {activeModal === 'especial' && (
                        <>
                            <InputSugerencias
                                type="text"
                                value={especialProducto}
                                placeholder="Selecciona un producto"
                                onChange={handleEspecialProductoChange}
                                sugerencias={productos}
                                onSugerenciaSelect={handleEspecialProductoSelect}
                                mostrarCampo="name"
                                buscarCampo="name"
                                minCaracteres={1}
                                showIcon={true}
                                iconName="box"
                                disabled={loadingProductos}
                                loading={loadingProductos}
                            />
                        </>
                    )}
                    {activeModal === 'gramaje' && (
                        <>
                            <div className={styles.horizontal}>
                                <InputNormal
                                    tipo="number"
                                    placeholder="Desde gramos"
                                    value={gramajeDesde}
                                    onChange={(event) => setGramajeDesde(event.target.value)}
                                    icon="chevrons-down"
                                />
                                <InputNormal
                                    tipo="number"
                                    placeholder="Hasta gramos"
                                    value={gramajeHasta}
                                    onChange={(event) => setGramajeHasta(event.target.value)}
                                    icon="chevrons-up"
                                />
                            </div>
                        </>
                    )}
                    {activeModal === 'general' && (
                        <>
                            <div className={styles.content}>
                            <Switch
                                title="Es regla general"
                                subtitle="Desactiva para especificar contenido"
                                checked={esReglaGeneral}
                                onChange={handleReglaGeneralSwitch}
                                icon="check-circle"
                            />
                            </div>
                            {!esReglaGeneral && (
                                <InputNormal
                                    tipo="text"
                                    placeholder="Producto contiene"
                                    value={generalForm.producto}
                                    onChange={handleGeneralInputChange('producto')}
                                    icon="package"
                                />
                            )}
                        </>)}
                    <InputNormal
                        tipo="number"
                        placeholder="Cernido"
                        value={generalForm.cernido}
                        onChange={handleGeneralInputChange('cernido')}
                        icon="filter"
                    />

                    <div className={styles.horizontal}>
                        <InputNormal
                            tipo="number"
                            placeholder="Sellado"
                            value={generalForm.sellado}
                            onChange={handleGeneralInputChange('sellado')}
                            icon="cog"
                        />
                        <Select
                            label="Multiplicador"
                            options={multiplicadorOptions}
                            value={generalForm.selladoMultiplier}
                            onChange={handleGeneralSelectChange('selladoMultiplier')}
                        />
                    </div>

                    <div className={styles.horizontal}>
                        <InputNormal
                            tipo="number"
                            placeholder="Envasado"
                            value={generalForm.envasado}
                            onChange={handleGeneralInputChange('envasado')}
                            icon="archive"
                        />
                        <Select
                            label="Multiplicador"
                            options={multiplicadorOptions}
                            value={generalForm.envasadoMultiplier}
                            onChange={handleGeneralSelectChange('envasadoMultiplier')}
                        />
                    </div>

                    <div className={styles.horizontal}>
                        <InputNormal
                            tipo="number"
                            placeholder="Etiquetado"
                            value={generalForm.etiquetado}
                            onChange={handleGeneralInputChange('etiquetado')}
                            icon="label"
                        />
                        <Select
                            label="Multiplicador"
                            options={multiplicadorOptions}
                            value={generalForm.etiquetadoMultiplier}
                            onChange={handleGeneralSelectChange('etiquetadoMultiplier')}
                        />
                    </div>

                    <div className={styles.buttons}>
                        <Boton
                            label="Guardar"
                            className="btn-original"
                            onClick={handleGuardarRegla}
                            loading={isSaving}
                            disabled={isSaving}
                        />
                    </div>



            </div>
        </ViewModal>
            <FetchData
                service={productsAlmacenService}
                method="getAll"
                methodParams={[]}
                isOpen={activeModal === 'especial'}
                onDataLoaded={(data) => setProductos(data || [])}
                onLoadingStart={() => setLoadingProductos(true)}
                onLoadingEnd={() => setLoadingProductos(false)}
                serviceName="ProductosAlmacen"
            />
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </>
    );
}

export default ReglasMedio;

