import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import InputSwitch from '../../../../components/common/inputs/InputSwitch';
import Radiobox from '../../../../components/common/inputs/Radiobox';
import Mensaje from '../../../../components/common/outputs/Mensaje';
import NoData from '../../../../components/common/widgets/NoData';
import { useToast } from '../../../../context/ToastContext';
import sucursalesService from '../../../../services/sucursalesService';
import pricesTypesService from '../../../../services/pricesTypesService';

const AgregarEditarSucursal = ({ isOpen, onClose, sucursalSeleccionada, onGuardar }) => {
    const { showSuccess, showDanger, showWarning } = useToast();
    const [loading, setLoading] = useState(false);
    const [loadingPrecios, setLoadingPrecios] = useState(false);
    const [precios, setPrecios] = useState([]);
    const [fieldErrors, setFieldErrors] = useState({ name: false });

    const [name, setName] = useState('');
    const [almacenSeparado, setAlmacenSeparado] = useState(true);
    const [preciosSeleccionados, setPreciosSeleccionados] = useState([]);

    // Cargar precios disponibles
    const loadPrecios = async () => {
        try {
            setLoadingPrecios(true);
            const response = await pricesTypesService.getAll();
            if (response.success) {
                setPrecios(response.data || []);
            }
        } catch (error) {
            console.error('Error al cargar precios:', error);
            showDanger(null, 'Error al cargar los tipos de precios');
        } finally {
            setLoadingPrecios(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadPrecios();
        }
    }, [isOpen]);

    // Limpiar o llenar campos cuando se abre/cierra el modal
    useEffect(() => {
        if (isOpen) {
            setFieldErrors({ name: false });
            if (sucursalSeleccionada) {
                setName(sucursalSeleccionada.name || sucursalSeleccionada.nombre || '');
                setAlmacenSeparado(!sucursalSeleccionada.almacen_sucursal_id);
                if (sucursalSeleccionada.precios && Array.isArray(sucursalSeleccionada.precios)) {
                    const preciosIds = sucursalSeleccionada.precios.map(precio => precio.id || precio).filter(Boolean);
                    setPreciosSeleccionados(preciosIds);
                } else {
                    setPreciosSeleccionados([]);
                }
            } else {
                setName('');
                setAlmacenSeparado(true);
                setPreciosSeleccionados([]);
            }
        }
    }, [isOpen, sucursalSeleccionada]);

    const handleConfirm = async () => {
        if (!name.trim()) {
            setFieldErrors((prev) => ({ ...prev, name: true }));
            showWarning('Validación', 'El nombre es obligatorio');
            return;
        }

        if (!preciosSeleccionados || preciosSeleccionados.length === 0) {
            showWarning('Validación', 'Debe seleccionar al menos un tipo de precio');
            return;
        }

        setFieldErrors({ name: false });
        setLoading(true);

        const sucursalData = {
            name: name.trim(),
            almacenSeparado: almacenSeparado,
            precios: preciosSeleccionados
        };

        try {
            let response;
            const tipo = sucursalSeleccionada ? 'editar' : 'agregar';

            if (tipo === 'editar') {
                response = await sucursalesService.update(sucursalSeleccionada.id, sucursalData);
            } else {
                response = await sucursalesService.create(sucursalData);
            }

            if (response.success) {
                const registroId = (response.data && response.data.id) || response.id || sucursalSeleccionada?.id || null;

                if (onGuardar) {
                    const dataDeRetorno = {
                        ...(response.data || sucursalSeleccionada),
                        ...sucursalData,
                        id: registroId,
                        precios: precios.filter(p => preciosSeleccionados.includes(p.id)),
                        almacen_sucursal_id: almacenSeparado ? null : (response.data?.almacen_sucursal_id || sucursalSeleccionada?.almacen_sucursal_id || 1)
                    };
                    onGuardar(dataDeRetorno);
                }
                setLoading(false);
                onClose();
                showSuccess(null, response.message || `Sucursal ${tipo === 'editar' ? 'actualizada' : 'creada'} correctamente`);
            } else if (response.code === 'MODULE_NOT_INCLUDED') {
                setLoading(false);
                showDanger(null, `Tu plan actual (${response.currentPlan}) no incluye acceso al módulo "${response.requiredModule}".`);
            } else if (response.code === 'NO_PLAN') {
                setLoading(false);
                showDanger(null, 'Necesitas un plan activo para acceder a esta función.');
            } else {
                setLoading(false);
                showDanger(null, response.message || `Error al ${tipo} la sucursal`);
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

    const isSwitchDisabled = sucursalSeleccionada
        && sucursalSeleccionada.total_pedidos > 0
        && !sucursalSeleccionada.almacen_sucursal_id;

    return (
        <ModalLateral
            isOpen={isOpen}
            onClose={handleClose}
            title={sucursalSeleccionada ? "Editar Sucursal" : "Nueva Sucursal"}
            confirmText="Guardar"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        >
                <Input
                    tipo="text"
                    required={true}
                    label="Nombre de la sucursal"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, name: false }));
                    }}
                    readOnly={loading}
                    error={fieldErrors.name}
                    onClearError={() => setFieldErrors((prev) => ({ ...prev, name: false }))}
                />

                <InputSwitch
                    id="switch-almacen"
                    label="Almacén separado"
                    subtitle="La sucursal tendrá su propio almacén y stock"
                    checked={almacenSeparado}
                    onChange={setAlmacenSeparado}
                    icon="store"
                    disabled={isSwitchDisabled || loading}
                    readOnly={loading}
                />

                {isSwitchDisabled && (
                    <Mensaje
                        type="warning"
                        message="No es posible separar el almacén si hay pedidos o movimientos en la sucursal"
                    />
                )}

                <div style={{ marginTop: '10px' }}>
                    {loadingPrecios ? (
                        <NoData
                            icon="loader-alt"
                            title="Cargando precios..."
                            detail="Obteniendo tipos de precios disponibles"
                            transparent={true}
                            minHeight="150px"
                        />
                    ) : precios.length > 0 ? (
                        <Radiobox
                            title="Tipos de precios disponibles"
                            options={precios.map(precio => ({
                                name: precio.name || precio.nombre,
                                value: precio.id
                            }))}
                            selectedValues={preciosSeleccionados}
                            onChange={setPreciosSeleccionados}
                            disabled={loading}
                        />
                    ) : (
                        <NoData
                            icon="grid-alt"
                            title="Sin tipos de precios"
                            detail="No hay tipos de precios disponibles para asignar"
                            transparent={false}
                            minHeight="150px"
                        />
                    )}
                </div>
         
        </ModalLateral>
    );
};

export default AgregarEditarSucursal;