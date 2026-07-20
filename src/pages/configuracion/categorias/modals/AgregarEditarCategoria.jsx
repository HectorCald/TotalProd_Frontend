import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import InputSelect from '../../../../components/common/inputs/InputSelect';
import { useToast } from '../../../../context/ToastContext';
import categoryAlmacenService from '../../../../services/categoryAlmacenService';
import categoryAcopioService from '../../../../services/categoryAcopioService';
import { useUser } from '../../../../context/UserContext';
import { useEmployee } from '../../../../context/EmployeeContext';

const AgregarEditarCategoria = ({ isOpen, onClose, categoriaSeleccionada, onGuardar }) => {
    const { showSuccess, showDanger } = useToast();
    const { user: userInfo, sucursalSeleccionada: userSucursal } = useUser();
    const { employee: employeeInfo, sucursalSeleccionada: employeeSucursal } = useEmployee();
    const sucursalSeleccionada = userSucursal || employeeSucursal;
    const tipoEmpresa = sucursalSeleccionada?.empresas?.tipo || userInfo?.empresa?.tipo || employeeInfo?.sucursal?.empresas?.tipo || 'ventas_produccion';
    const isSoloVentas = tipoEmpresa === 'ventas';
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ name: false, tipo: false });
    const [formData, setFormData] = useState({
        name: '',
        tipo: 'almacen' // por defecto
    });

    useEffect(() => {
        if (isOpen) {
            setFieldErrors({ name: false, tipo: false });
            if (categoriaSeleccionada) {
                setFormData({
                    name: categoriaSeleccionada.name || categoriaSeleccionada.nombre || '',
                    tipo: categoriaSeleccionada._tipo_modulo || 'almacen'
                });
            } else {
                setFormData({
                    name: '',
                    tipo: 'almacen'
                });
            }
        }
    }, [isOpen, categoriaSeleccionada]);

    const handleConfirm = async () => {
        let hasErrors = false;
        const newErrors = { name: false, tipo: false };

        if (!formData.name.trim()) {
            newErrors.name = true;
            hasErrors = true;
        }

        if (!categoriaSeleccionada && !formData.tipo) {
            newErrors.tipo = true;
            hasErrors = true;
        }

        setFieldErrors(newErrors);

        if (hasErrors) {
            return;
        }

        const datosParaEnviar = {
            name: formData.name.trim()
        };

        setLoading(true);
        try {
            let response;
            const esEdicion = !!categoriaSeleccionada;
            const serviceToUse = formData.tipo === 'almacen' ? categoryAlmacenService : categoryAcopioService;

            if (esEdicion) {
                response = await serviceToUse.update(categoriaSeleccionada.id, datosParaEnviar);
            } else {
                response = await serviceToUse.create(datosParaEnviar);
            }

            if (response.success) {
                const base = response.data || {};
                const categoriaGuardada = {
                    ...base,
                    id: base.id ?? categoriaSeleccionada?.id ?? response.id,
                    name: base.name || formData.name.trim(),
                    _tipo_modulo: formData.tipo,
                };

                if (onGuardar) {
                    onGuardar(categoriaGuardada);
                }
                setLoading(false);
                onClose();
                showSuccess(null, response.message || `Categoría ${esEdicion ? 'actualizada' : 'creada'} correctamente`);
            } else {
                setLoading(false);
                showDanger(null, response.message || `Error al ${esEdicion ? 'editar' : 'agregar'} la categoría`, 5000, false);
            }
        } catch (error) {
            setLoading(false);
            showDanger(null, 'Revisa tu conexión a internet', 5000, false);
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
            title={categoriaSeleccionada ? "Editar Categoría" : "Nueva Categoría"}
            confirmText="Guardar"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        >
            <Input
                tipo="text"
                required={true}
                label="Nombre de la categoría"
                value={formData.name}
                onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setFieldErrors((prev) => ({ ...prev, name: false }));
                }}
                readOnly={loading}
                error={fieldErrors.name}
                onClearError={() => setFieldErrors((prev) => ({ ...prev, name: false }))}
            />

            {!categoriaSeleccionada && !isSoloVentas && (
                <InputSelect
                    label="Tipo de Categoría"
                    required={true}
                    value={formData.tipo}
                    onChange={(val) => {
                        setFormData({ ...formData, tipo: val });
                        setFieldErrors((prev) => ({ ...prev, tipo: false }));
                    }}
                    options={[
                        { value: 'almacen', label: 'Almacén' },
                        { value: 'acopio', label: 'Materia Prima' }
                    ]}
                    disabled={loading}
                    error={fieldErrors.tipo}
                    onClearError={() => setFieldErrors((prev) => ({ ...prev, tipo: false }))}
                />
            )}
        </ModalLateral>
    );
};

export default AgregarEditarCategoria;
