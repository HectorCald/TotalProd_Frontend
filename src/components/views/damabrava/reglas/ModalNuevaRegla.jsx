import React, { useState, useRef, useEffect } from 'react';
import styles from '../../../../styles/view.module.css';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import ItemView from '../../../common/ItemView';
import Input from '../../../common/inputs/Input';
import InputSelect from '../../../common/inputs/InputSelect';
import InputSearch from '../../../common/inputs/InputSearch';
import Boton from '../../../common/Boton';
import Switch from '../../../common/Switch';
import FetchData from '../../../mixed/FetchData';
import productsAlmacenService from '../../../../services/productsAlmacenService';
import reglasProduccionDamabravaService from '../../../../services/reglasProduccionDamabravaService';
import { useToast } from '../../../../context/ToastContext';

const MULTIPLIER_FACTORS = { x1: 1, x2: 2, x3: 3, x4: 4, x5: 5 };

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

const multiplicadorOptions = [
    { value: 'x1', label: 'x1' },
    { value: 'x2', label: 'x2' },
    { value: 'x3', label: 'x3' },
    { value: 'x4', label: 'x4' },
    { value: 'x5', label: 'x5' },
];

function ModalNuevaRegla({ isOpen, setIsOpen, tipoRegla, onReglaRegistrada }) {
    const { showSuccess, showDanger } = useToast();
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

    const handleGeneralInputChange = (field) => (event) => {
        const { value } = event.target;
        if (['sellado', 'envasado', 'etiquetado'].includes(field)) {
            const multiplierKey = `${field}Multiplier`;
            const multiplierFactor = MULTIPLIER_FACTORS[generalForm[multiplierKey]] || 1;
            const numericValue = parseFloat(value);
            if (!Number.isNaN(numericValue)) {
                setGeneralBaseValues((prev) => ({ ...prev, [field]: numericValue / multiplierFactor }));
            }
        } else if (field === 'cernido') {
            const numericValue = parseFloat(value);
            if (!Number.isNaN(numericValue)) {
                setGeneralBaseValues((prev) => ({ ...prev, cernido: numericValue }));
            }
        }
        setGeneralForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleGeneralSelectChange = (field) => (value) => {
        setGeneralForm((prev) => {
            const updated = { ...prev, [field]: value };
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
        if (checked) setGeneralForm((prev) => ({ ...prev, producto: '' }));
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

    const handleClose = () => {
        setGeneralForm(initialGeneralFormState);
        setEsReglaGeneral(true);
        setGeneralBaseValues({ ...defaultGeneralBaseValues });
        setEspecialProducto('');
        setEspecialProductoSeleccionado(null);
        setGramajeDesde('');
        setGramajeHasta('');
        setIsSaving(false);
        setIsOpen(false);
    };

    const handleGuardarRegla = async () => {
        if (!tipoRegla || isSaving) return;

        const payload = {
            tipo: tipoRegla,
            sellado: generalForm.sellado,
            cernido: generalForm.cernido,
            envasado: generalForm.envasado,
            etiquetado: generalForm.etiquetado,
        };

        if (tipoRegla === 'general') {
            payload.general = esReglaGeneral;
            if (!esReglaGeneral) {
                if (!generalForm.producto?.trim()) {
                    showDanger('Ingresa el texto de "Producto contiene".');
                    return;
                }
                payload.contiene = generalForm.producto.trim();
            }
        } else if (tipoRegla === 'especial') {
            if (!especialProductoSeleccionado) {
                showDanger('Selecciona un producto válido para la regla especial.');
                return;
            }
            payload.general = false;
            payload.contiene = (especialProducto || '').trim();
            payload.producto_almacen_id = especialProductoSeleccionado.id;
        } else if (tipoRegla === 'gramaje') {
            if (!gramajeDesde || !gramajeHasta) {
                showDanger('Completa los campos "Desde" y "Hasta" para la regla por gramaje.');
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
                showDanger(response.message || 'No se pudo registrar la regla.');
                return;
            }
            handleClose();
            if (onReglaRegistrada) onReglaRegistrada(response.data);
            showSuccess('Regla registrada correctamente.');
        } catch (error) {
            showDanger(error.message || 'No se pudo registrar la regla.');
        } finally {
            setIsSaving(false);
        }
    };

    const getTitle = () => {
        if (tipoRegla === 'especial') return 'Regla Especial';
        if (tipoRegla === 'gramaje') return 'Regla por gramaje';
        return 'Regla General';
    };

    if (!tipoRegla) return null;

    return (
        <>
            <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
                <HeaderModal title={getTitle()} onClose={handleClose} />
                <div className={styles.modalContent}>
                    {tipoRegla === 'especial' && (
                        <InputSearch
                            label="Producto"
                            value={especialProducto}
                            placeholder="Buscar y seleccionar producto"
                            onChange={(e) => setEspecialProducto(e.target.value)}
                            onSugerenciaSelect={handleEspecialProductoSelect}
                            options={productos}
                            mostrarCampo="name"
                            buscarCampo="name"
                            minCaracteres={1}
                            disabled={loadingProductos}
                            loading={loadingProductos}
                        />
                    )}

                    {tipoRegla === 'gramaje' && (
                        <div className={styles.horizontal}>
                            <Input
                                tipo="number"
                                label="Desde (gramos)"
                                value={gramajeDesde}
                                onChange={(e) => setGramajeDesde(e.target.value)}
                            />
                            <Input
                                tipo="number"
                                label="Hasta (gramos)"
                                value={gramajeHasta}
                                onChange={(e) => setGramajeHasta(e.target.value)}
                            />
                        </div>
                    )}

                    {tipoRegla === 'general' && (
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
                                <Input
                                    type="text"
                                    label="Producto contiene"
                                    value={generalForm.producto}
                                    onChange={handleGeneralInputChange('producto')}
                                />
                            )}
                        </>
                    )}

                    <Input
                        tipo="number"
                        label="Cernido"
                        value={generalForm.cernido}
                        onChange={handleGeneralInputChange('cernido')}
                    />

                    <div className={styles.horizontal}>
                        <Input
                            tipo="number"
                            label="Sellado"
                            value={generalForm.sellado}
                            onChange={handleGeneralInputChange('sellado')}
                        />
                        <InputSelect
                            label="Multiplicador"
                            options={multiplicadorOptions}
                            value={generalForm.selladoMultiplier}
                            onChange={handleGeneralSelectChange('selladoMultiplier')}
                            placeholder="Seleccionar"
                        />
                    </div>

                    <div className={styles.horizontal}>
                        <Input
                            tipo="number"
                            label="Envasado"
                            value={generalForm.envasado}
                            onChange={handleGeneralInputChange('envasado')}
                        />
                        <InputSelect
                            label="Multiplicador"
                            options={multiplicadorOptions}
                            value={generalForm.envasadoMultiplier}
                            onChange={handleGeneralSelectChange('envasadoMultiplier')}
                            placeholder="Seleccionar"
                            openDirection="up"
                        />
                    </div>

                    <div className={styles.horizontal}>
                        <Input
                            tipo="number"
                            label="Etiquetado"
                            value={generalForm.etiquetado}
                            onChange={handleGeneralInputChange('etiquetado')}
                        />
                        <InputSelect
                            label="Multiplicador"
                            options={multiplicadorOptions}
                            value={generalForm.etiquetadoMultiplier}
                            onChange={handleGeneralSelectChange('etiquetadoMultiplier')}
                            placeholder="Seleccionar"
                            openDirection="up"
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
                isOpen={tipoRegla === 'especial'}
                onDataLoaded={(data) => setProductos(data || [])}
                onLoadingStart={() => setLoadingProductos(true)}
                onLoadingEnd={() => setLoadingProductos(false)}
                serviceName="ProductosAlmacen"
            />

        </>
    );
}

export default ModalNuevaRegla;
