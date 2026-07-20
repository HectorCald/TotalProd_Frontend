import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import InputSelect from '../../../../components/common/inputs/InputSelect';
import InputSearch from '../../../../components/common/inputs/InputSearch';
import Boton from '../../../../components/common/botones/Boton';
import InputSwitch from '../../../../components/common/inputs/InputSwitch';
import { useToast } from '../../../../context/ToastContext';
import productsAlmacenService from '../../../../services/productsAlmacenService';
import reglasProduccionDamabravaService from '../../../../services/reglasProduccionDamabravaService';

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

const NuevaRegla = ({ isOpen, onClose, tipoRegla, onReglaRegistrada }) => {
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

    useEffect(() => {
        const fetchProductos = async () => {
            if (tipoRegla === 'especial') {
                setLoadingProductos(true);
                try {
                    const response = await productsAlmacenService.getAll();
                    if (response.success) {
                        setProductos(response.data || []);
                    }
                } catch (error) {
                    console.error('Error al obtener productos', error);
                } finally {
                    setLoadingProductos(false);
                }
            }
        };
        fetchProductos();
    }, [tipoRegla]);

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
        onClose();
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
            if (onReglaRegistrada) onReglaRegistrada(response.data);
            handleClose();
        } catch (error) {
            showDanger(error.message || 'No se pudo registrar la regla.');
        } finally {
            setIsSaving(false);
        }
    };

    const getTitle = () => {
        if (tipoRegla === 'especial') return 'Nueva Regla Especial';
        if (tipoRegla === 'gramaje') return 'Nueva Regla por Gramaje';
        return 'Nueva Regla General';
    };

    if (!tipoRegla) return null;

    return (
        <ModalLateral
            isOpen={isOpen}
            onClose={handleClose}
            title={getTitle()}
            primaryButtonText="Guardar"
            onPrimaryClick={handleGuardarRegla}
            isPrimaryLoading={isSaving}
            width="500px"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
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
                    <div style={{ display: 'flex', gap: '15px' }}>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <InputSwitch
                            label="Es regla general"
                            subtitle="Desactiva para especificar un texto que debe contener el producto"
                            checked={esReglaGeneral}
                            onChange={handleReglaGeneralSwitch}
                            icon="check-circle"
                        />
                        {!esReglaGeneral && (
                            <Input
                                tipo="text"
                                label="El nombre del producto debe contener:"
                                value={generalForm.producto}
                                onChange={handleGeneralInputChange('producto')}
                                placeholder="Ej: Especial"
                            />
                        )}
                    </div>
                )}

                <div style={{ marginTop: '10px' }}>
                    <h3 style={{ fontSize: '14px', color: 'var(--text-color)', marginBottom: '15px' }}>Valores de Procesos</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <Input
                            tipo="number"
                            label="Cernido"
                            value={generalForm.cernido}
                            onChange={handleGeneralInputChange('cernido')}
                        />

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 2 }}>
                                <Input
                                    tipo="number"
                                    label="Sellado"
                                    value={generalForm.sellado}
                                    onChange={handleGeneralInputChange('sellado')}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <InputSelect
                                    label="Multiplicador"
                                    options={multiplicadorOptions}
                                    value={generalForm.selladoMultiplier}
                                    onChange={handleGeneralSelectChange('selladoMultiplier')}
                                    placeholder="Seleccionar"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 2 }}>
                                <Input
                                    tipo="number"
                                    label="Envasado"
                                    value={generalForm.envasado}
                                    onChange={handleGeneralInputChange('envasado')}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <InputSelect
                                    label="Multiplicador"
                                    options={multiplicadorOptions}
                                    value={generalForm.envasadoMultiplier}
                                    onChange={handleGeneralSelectChange('envasadoMultiplier')}
                                    placeholder="Seleccionar"
                                    openDirection="up"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 2 }}>
                                <Input
                                    tipo="number"
                                    label="Etiquetado"
                                    value={generalForm.etiquetado}
                                    onChange={handleGeneralInputChange('etiquetado')}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <InputSelect
                                    label="Multiplicador"
                                    options={multiplicadorOptions}
                                    value={generalForm.etiquetadoMultiplier}
                                    onChange={handleGeneralSelectChange('etiquetadoMultiplier')}
                                    placeholder="Seleccionar"
                                    openDirection="up"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ModalLateral>
    );
};

export default NuevaRegla;
