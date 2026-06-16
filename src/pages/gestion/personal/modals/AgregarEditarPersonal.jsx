import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import InputSelect from '../../../../components/common/inputs/InputSelect';
import InputSwitch from '../../../../components/common/inputs/InputSwitch';
import { useToast } from '../../../../context/ToastContext';
import personalService from '../../../../services/personalService';
import cargosService from '../../../../services/cargosService';
import SelectSucursal from '../../../../components/common/fast/SelectSucursal';
import { useUser } from '../../../../context/UserContext';
import { useEmployee } from '../../../../context/EmployeeContext';

const AgregarEditarPersonal = ({ isOpen, onClose, personalSeleccionado, onGuardar }) => {
    const { empresa } = useUser();
    const { employee } = useEmployee();
    const { showSuccess, showDanger, showWarning } = useToast();

    const [loading, setLoading] = useState(false);
    const [cargos, setCargos] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    const [fieldErrors, setFieldErrors] = useState({ first_name: false, last_name: false, email: false, cargo_id: false });
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        cargo_id: '',
        sucursal_id: '',
        is_active: true,
        permisos: {
            crear: false,
            eliminar: false,
            editar: false,
            anular: false,
            reemplazar: false,
            info: false,
            sucursales: false
        }
    });

    // Cargar cargos y sucursales
    useEffect(() => {
        if (isOpen) {
            const loadInitialData = async () => {
                setLoadingData(true);
                try {
                    const cargosRes = await cargosService.getAll();
                    if (cargosRes.success) setCargos(cargosRes.data || []);
                } catch (error) {
                    console.error('Error al cargar datos:', error);
                } finally {
                    setLoadingData(false);
                }
            };

            if (cargos.length === 0) {
                loadInitialData();
            }
        }
    }, [isOpen, cargos.length]);

    // Función para generar correo automático
    const generarEmail = (firstName, lastName) => {
        if (!firstName || !lastName) return '';
        const namePart = `${firstName.trim().split(' ')[0]}.${lastName.trim().split(' ')[0]}`.toLowerCase();
        
        const empresaNameRaw = empresa?.name || employee?.sucursal?.empresas?.name || 'empresa';
        const empresaName = empresaNameRaw.toLowerCase().replace(/\s+/g, '');
        
        return `${namePart}@${empresaName}.com`;
    };

    // Limpiar o llenar campos
    useEffect(() => {
        if (isOpen) {
            setFieldErrors({ first_name: false, last_name: false, email: false, cargo_id: false });
            if (personalSeleccionado) {
                setFormData({
                    first_name: personalSeleccionado.first_name || '',
                    last_name: personalSeleccionado.last_name || '',
                    email: personalSeleccionado.codigo || '',
                    cargo_id: personalSeleccionado.cargo_id || '',
                    sucursal_id: personalSeleccionado.sucursal_id || '',
                    is_active: personalSeleccionado.is_active !== undefined ? personalSeleccionado.is_active : true,
                    permisos: personalSeleccionado.permisos || {
                        crear: false,
                        eliminar: false,
                        editar: false,
                        anular: false,
                        reemplazar: false,
                        info: false,
                        sucursales: false
                    }
                });
            } else {
                setFormData({
                    first_name: '',
                    last_name: '',
                    email: '',
                    cargo_id: '',
                    sucursal_id: '',
                    is_active: true,
                    permisos: {
                        crear: false,
                        eliminar: false,
                        editar: false,
                        anular: false,
                        reemplazar: false,
                        info: false,
                        sucursales: false
                    }
                });
            }
        }
    }, [isOpen, personalSeleccionado]);

    const handleConfirm = async () => {
        let hasErrors = false;
        const newFieldErrors = { first_name: false, last_name: false, email: false, cargo_id: false };

        if (!formData.first_name.trim()) {
            newFieldErrors.first_name = true;
            hasErrors = true;
        }

        if (!formData.last_name.trim()) {
            newFieldErrors.last_name = true;
            hasErrors = true;
        }

        if (!formData.cargo_id) {
            newFieldErrors.cargo_id = true;
            hasErrors = true;
        }

        let emailFinal = formData.email;
        if (!emailFinal && formData.first_name && formData.last_name) {
            emailFinal = generarEmail(formData.first_name, formData.last_name);
        }

        if (hasErrors) {
            setFieldErrors(newFieldErrors);
            return;
        }

        setFieldErrors({ first_name: false, last_name: false, email: false, cargo_id: false });

        const selectedCargo = cargos.find(c => c.id === formData.cargo_id);
        const datosParaEnviar = {
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            codigo: emailFinal,
            cargo_id: formData.cargo_id,
            cargo: selectedCargo ? selectedCargo.name : '',
            sucursal_id: formData.sucursal_id || null,
            is_active: formData.is_active,
            permisos: formData.permisos
        };

        setLoading(true);
        try {
            let response;
            const tipo = personalSeleccionado ? 'editar' : 'agregar';

            if (tipo === 'editar') {
                response = await personalService.update(personalSeleccionado.id, datosParaEnviar);
            } else {
                response = await personalService.create(datosParaEnviar);
            }

            if (response.success) {
                if (onGuardar) {
                    onGuardar(response.data || { id: personalSeleccionado?.id, ...datosParaEnviar });
                }

                setLoading(false);
                onClose();
                showSuccess('Operación exitosa', `Personal ${tipo === 'editar' ? 'actualizado' : 'creado'} correctamente`);
            } else {
                setLoading(false);
                showDanger('Operación fallida', response.message);
            }
        } catch (error) {
            setLoading(false);
            showDanger('Error de conexión', error.message || 'Error de conexión con el servidor');
        }
    };

    const handleClose = () => {
        if (loading) return;
        onClose();
    };

    const handlePermisoChange = (permiso, value) => {
        setFormData(prev => ({
            ...prev,
            permisos: {
                ...prev.permisos,
                [permiso]: value
            }
        }));
    };

    return (
        <ModalLateral
            isOpen={isOpen}
            onClose={handleClose}
            title={personalSeleccionado ? "Editar Personal" : "Nuevo Personal"}
            confirmText="Guardar"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Input
                    tipo="text"
                    required={true}
                    label="Nombres"
                    value={formData.first_name}
                    onChange={(e) => {
                        const newFirstName = e.target.value;
                        setFormData(prev => ({
                            ...prev,
                            first_name: newFirstName,
                            email: (!personalSeleccionado && prev.last_name) ? generarEmail(newFirstName, prev.last_name) : prev.email
                        }));
                        setFieldErrors((prev) => ({ ...prev, first_name: false }));
                    }}
                    readOnly={loading}
                    error={fieldErrors.first_name}
                    onClearError={() => setFieldErrors((prev) => ({ ...prev, first_name: false }))}
                />

                <Input
                    tipo="text"
                    required={true}
                    label="Apellidos"
                    value={formData.last_name}
                    onChange={(e) => {
                        const newLastName = e.target.value;
                        setFormData(prev => ({
                            ...prev,
                            last_name: newLastName,
                            email: (!personalSeleccionado && prev.first_name) ? generarEmail(prev.first_name, newLastName) : prev.email
                        }));
                        setFieldErrors((prev) => ({ ...prev, last_name: false }));
                    }}
                    readOnly={loading}
                    error={fieldErrors.last_name}
                    onClearError={() => setFieldErrors((prev) => ({ ...prev, last_name: false }))}
                />

                <Input
                    tipo="text"
                    required={true}
                    label="Correo Empleado (Autogenerado)"
                    value={formData.email}
                    readOnly={true}
                    error={fieldErrors.email}
                />

                <InputSelect
                    label="Cargo"
                    required={true}
                    value={formData.cargo_id}
                    onChange={(val) => {
                        setFormData({ ...formData, cargo_id: val });
                        setFieldErrors((prev) => ({ ...prev, cargo_id: false }));
                    }}
                    options={cargos.map(c => ({ value: c.id, label: c.name }))}
                    placeholder={loadingData ? "Cargando cargos..." : "Seleccionar cargo"}
                    disabled={loading || loadingData}
                    error={fieldErrors.cargo_id}
                />

                <SelectSucursal
                    label="Sucursal"
                    required={true}
                    value={formData.sucursal_id}
                    onChange={(val) => setFormData({ ...formData, sucursal_id: val })}
                    disabled={loading || loadingData}
                    onLoaded={(sucursalesList) => {
                       if (!personalSeleccionado && sucursalesList.length > 0 && !formData.sucursal_id) {
                           setFormData(prev => ({ ...prev, sucursal_id: String(sucursalesList[0].id) }));
                       }
                    }}
                />

                {personalSeleccionado && (
                    <InputSwitch
                        label="Estado"
                        subtitle={formData.is_active ? "Activo" : "Inactivo"}
                        checked={formData.is_active}
                        onChange={(val) => setFormData({ ...formData, is_active: val })}
                        readOnly={loading}
                    />
                )}

                <div style={{ marginTop: '10px' }}>
                    <p style={{ fontWeight: '500', marginBottom: '15px' }}>Permisos Adicionales</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <InputSwitch
                            label="Crear"
                            checked={formData.permisos.crear}
                            onChange={(val) => handlePermisoChange('crear', val)}
                            readOnly={loading}
                        />
                        <InputSwitch
                            label="Editar"
                            checked={formData.permisos.editar}
                            onChange={(val) => handlePermisoChange('editar', val)}
                            readOnly={loading}
                        />
                        <InputSwitch
                            label="Eliminar"
                            checked={formData.permisos.eliminar}
                            onChange={(val) => handlePermisoChange('eliminar', val)}
                            readOnly={loading}
                        />
                        <InputSwitch
                            label="Anular"
                            checked={formData.permisos.anular}
                            onChange={(val) => handlePermisoChange('anular', val)}
                            readOnly={loading}
                        />
                        <InputSwitch
                            label="Reemplazar"
                            checked={formData.permisos.reemplazar}
                            onChange={(val) => handlePermisoChange('reemplazar', val)}
                            readOnly={loading}
                        />
                        <InputSwitch
                            label="Información"
                            checked={formData.permisos.info}
                            onChange={(val) => handlePermisoChange('info', val)}
                            readOnly={loading}
                        />
                        <InputSwitch
                            label="Sucursales"
                            checked={formData.permisos.sucursales}
                            onChange={(val) => handlePermisoChange('sucursales', val)}
                            readOnly={loading}
                        />
                    </div>
                </div>
            </div>
        </ModalLateral>
    );
};

export default AgregarEditarPersonal;
