import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import Accordion from '../../../../components/common/widgets/Accordion';
import Checkbox from '../../../../components/common/inputs/Checkbox';
import NoData from '../../../../components/common/widgets/NoData';
import { useToast } from '../../../../context/ToastContext';
import cargosService from '../../../../services/cargosService';
import modulesService from '../../../../services/modulesService';
import { useUser } from '../../../../context/UserContext';
import { useEmployee } from '../../../../context/EmployeeContext';

const formatSubmoduleName = (name) => {
    if (!name) return '';
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const AgregarEditarCargo = ({ isOpen, onClose, cargoSeleccionado, onGuardar }) => {
    const { showSuccess, showDanger, showWarning } = useToast();
    const { user: userInfo, sucursalSeleccionada: userSucursal } = useUser();
    const { employee: employeeInfo, sucursalSeleccionada: employeeSucursal } = useEmployee();
    const sucursalSeleccionada = userSucursal || employeeSucursal;
    const codigoEmpresa = sucursalSeleccionada?.empresas?.codigo || userInfo?.empresa?.codigo || employeeInfo?.sucursal?.empresas?.codigo || '';
    const tipoEmpresa = sucursalSeleccionada?.empresas?.tipo || userInfo?.empresa?.tipo || employeeInfo?.sucursal?.empresas?.tipo || 'ventas_produccion';
    const isSoloVentas = tipoEmpresa === 'ventas';
    const [loading, setLoading] = useState(false);
    const [loadingModules, setLoadingModules] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const [fieldErrors, setFieldErrors] = useState({ name: false });

    // Modules state
    const [modules, setModules] = useState([]);
    const [selectedModules, setSelectedModules] = useState([]);

    // Cargar módulos disponibles
    const loadModules = async () => {
        try {
            setLoadingModules(true);
            const response = await modulesService.getAll();
            if (response.success) {
                setModules(response.data || []);
            }
        } catch (error) {
            console.error('Error al cargar módulos:', error);
            showDanger(null, 'Error al cargar los módulos disponibles');
        } finally {
            setLoadingModules(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadModules();
        }
    }, [isOpen]);

    // Limpiar o llenar campos cuando se abre/cierra el modal
    useEffect(() => {
        if (isOpen) {
            setFieldErrors({ name: false });
            if (cargoSeleccionado) {
                setName(cargoSeleccionado.name || '');
                setDescription(cargoSeleccionado.description || '');

                if (cargoSeleccionado.modules && Array.isArray(cargoSeleccionado.modules)) {
                    // Pre-seleccionar módulos asignados
                    const modulosIds = cargoSeleccionado.modules.map(mod => mod.id || mod).filter(Boolean);
                    setSelectedModules(modulosIds);
                } else {
                    setSelectedModules([]);
                }
            } else {
                setName('');
                setDescription('');
                setSelectedModules([]);
            }
        }
    }, [isOpen, cargoSeleccionado]);

    const handleConfirm = async () => {
        if (!name.trim()) {
            setFieldErrors((prev) => ({ ...prev, name: true }));
            return;
        }

        if (selectedModules.length === 0) {
            showWarning('Advertencia', 'Debes seleccionar al menos un submódulo para el cargo');
            return;
        }

        setFieldErrors({ name: false });
        setLoading(true);

        const cargoData = {
            name: name.trim(),
            description: description.trim() || null,
            modules: selectedModules
        };

        try {
            let response;
            const tipo = cargoSeleccionado ? 'editar' : 'agregar';

            if (tipo === 'editar') {
                response = await cargosService.update(cargoSeleccionado.id, cargoData);
            } else {
                response = await cargosService.create(cargoData);
            }

            if (response.success) {
                const registroActualizado = response.data || cargoSeleccionado;

                if (onGuardar) {
                    onGuardar(registroActualizado);
                }

                setLoading(false);
                onClose();
                showSuccess(null, response.message || `Cargo ${tipo === 'editar' ? 'actualizado' : 'creado'} correctamente`);
            } else if (response.code === 'MODULE_NOT_INCLUDED') {
                setLoading(false);
                showDanger(null, `Tu plan actual (${response.currentPlan}) no incluye acceso al módulo "${response.requiredModule}".`);
            } else if (response.code === 'NO_PLAN') {
                setLoading(false);
                showDanger(null, 'Necesitas un plan activo para acceder a esta función.');
            } else {
                setLoading(false);
                showDanger(null, response.message || `Error al ${tipo} el cargo`);
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
        <ModalLateral
            isOpen={isOpen}
            onClose={handleClose}
            title={cargoSeleccionado ? "Editar Cargo" : "Nuevo Cargo"}
            confirmText="Guardar"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        >
            <Input
                tipo="text"
                required={true}
                label="Nombre del cargo"
                value={name}
                onChange={(e) => {
                    setName(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, name: false }));
                }}
                readOnly={loading}
                error={fieldErrors.name}
                onClearError={() => setFieldErrors((prev) => ({ ...prev, name: false }))}
            />

            <Input
                tipo="text"
                required={false}
                label="Descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                readOnly={loading}
            />
            <h4 style={{ marginBlock: '5px', fontSize: '12px', color: 'var(--black-color)' }}>MÓDULOS</h4>

            {loadingModules ? (
                <NoData
                    icon="loader-alt"
                    title="Cargando módulos..."
                    detail="Obteniendo módulos disponibles para asignar"
                    transparent={true}
                    minHeight="150px"
                />
            ) : modules.filter(module => module.sub_modulos && module.sub_modulos.length > 0 && (module.name.toLowerCase() !== 'damabrava' || codigoEmpresa === 'damabrava') && (!isSoloVentas || module.name.toLowerCase() !== 'materia')).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {modules
                        .filter(module => module.sub_modulos && module.sub_modulos.length > 0 && (module.name.toLowerCase() !== 'damabrava' || codigoEmpresa === 'damabrava') && (!isSoloVentas || module.name.toLowerCase() !== 'materia'))
                        .map((module) => (
                            <Accordion key={module.id} title={`${module.name.toUpperCase()} (${module.sub_modulos.length})`}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {module.sub_modulos.map(sub => (
                                        <Checkbox
                                            key={sub.id}
                                            label={formatSubmoduleName(sub.name)}
                                            checked={selectedModules.includes(sub.id)}
                                            onChange={(isChecked) => {
                                                if (isChecked) {
                                                    setSelectedModules(prev => [...prev, sub.id]);
                                                } else {
                                                    setSelectedModules(prev => prev.filter(id => id !== sub.id));
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            </Accordion>
                        ))}
                </div>
            ) : (
                <NoData
                    icon="grid-alt"
                    title="Sin módulos"
                    detail="No hay módulos con submódulos disponibles para asignar"
                    transparent={false}
                    minHeight="150px"
                />
            )}


        </ModalLateral>
    );
};

export default AgregarEditarCargo;
