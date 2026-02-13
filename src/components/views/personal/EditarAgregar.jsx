import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderModal from '../../common/HeaderModal';
import ViewModal from '../../ui/ViewModal';
import Boton from '../../common/Boton';
import Input from '../../common/inputs/Input';
import InputCall from '../../common/inputs/InputCall';
import personalService from '../../../services/personalService';
import modulesService from '../../../services/modulesService';
import Switch from '../../common/Switch';
import InputSelect from '../../common/inputs/InputSelect';
import { useToast } from '../../../context/ToastContext';
import { isDamabrava, isSoloVentas } from '../../../utils/empresaHelper';
import { useUser } from '../../../context/UserContext';
import Text from '../../common/Text';
import useHistorialLogger from '../../ui/HistorialLogger';
import ModalConfiguracion from './modales/ModalConfiguracion';

function EditarAgregar({ isOpen, setIsOpen, usuario, tipo, onPersonalCreated, onPersonalUpdated, sucursales = [] }) {
    const { user } = useUser();
    const { showSuccess, showDanger, showWarning } = useToast();
    const soloVentas = isSoloVentas(user);
    const { logAccion } = useHistorialLogger({
        modulo: 'Personal',
        campos: ['first_name', 'last_name', 'codigo', 'cargo', 'sucursal', 'is_active', 'permisos']
    });

    // Estados para los datos del personal
    const [dataEdit, setDataEdit] = useState({
        first_name: '',
        last_name: '',
        codigo: '',
        cargo: ''
    });
    const [estado, setEstado] = useState(true); // Siempre activo por defecto
    const [sucursalId, setSucursalId] = useState('');
    const createPermisosIniciales = () => ({
        crear: false,
        eliminar: false,
        editar: false,
        anular: false,
        reemplazar: false,
        info: false,
        sucursales: false
    });

    const [permisos, setPermisos] = useState(() => createPermisosIniciales());
    const [rastrear, setRastrear] = useState(false);

    // Estados para módulos y submódulos
    const [modules, setModules] = useState([]);
    const [selectedModules, setSelectedModules] = useState([]);
    const [loadingModules, setLoadingModules] = useState(false);


    // Estados para modales
    const [isConfiguracionOpen, setIsConfiguracionOpen] = useState(false);


    // Estados para la carga
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ first_name: false, last_name: false, cargo: false, sucursalId: false });

    // Función para generar código automático
    const generarCodigo = (firstName, lastName) => {
        if (!firstName || !lastName) return '';

        // Tomar las dos primeras letras del nombre y apellido
        const firstTwo = firstName.substring(0, 2).toUpperCase();
        const lastTwo = lastName.substring(0, 2).toUpperCase();

        // Generar 4 números aleatorios
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

        return `${firstTwo}${lastTwo}${randomNum}`;
    };


    // Función para copiar código al portapapeles
    const handleCopyCode = async () => {
        if (!dataEdit.codigo) {
            showWarning('Código', 'No hay código para copiar. Ingresa nombre y apellido para generarlo.', 5000);
            return;
        }

        try {
            await navigator.clipboard.writeText(dataEdit.codigo);
            showSuccess('Éxito', 'Código copiado al portapapeles');
        } catch (error) {
            console.error('Error al copiar:', error);
            showDanger('Error', 'Error al copiar el código');
        }
    };

    // Función para cargar módulos
    const loadModules = async () => {
        try {
            setLoadingModules(true);
            const response = await modulesService.getAll();
            if (response.success) {
                let filteredModules = response.data;

                // Si la empresa es Damabrava, cargar TODOS los módulos
                if (isDamabrava()) {
                    filteredModules = response.data;
                } else {
                    // Para otras empresas, cargar todos los módulos EXCEPTO los de Damabrava
                    filteredModules = response.data.filter(module =>
                        !module.name.toLowerCase().includes('damabrava') &&
                        !module.name.toLowerCase().includes('producción') &&
                        !module.name.toLowerCase().includes('formulario') &&
                        !module.name.toLowerCase().includes('verificación')
                    );
                }

                // Si es solo ventas (y es usuario, no empleado), filtrar módulos de materia prima
                // Solo aplica cuando se está creando/editando personal, no cuando es un empleado
                if (soloVentas && tipo !== 'ver') {
                    filteredModules = filteredModules.map(module => {
                        // Filtrar submódulos de materia prima
                        if (module.sub_modulos && module.sub_modulos.length > 0) {
                            const filteredSubModulos = module.sub_modulos.filter(subModulo => {
                                // Ocultar submódulos relacionados con materia prima/acopio
                                const isMateriaPrima = subModulo.name.toLowerCase().includes('materia') ||
                                    subModulo.name.toLowerCase().includes('acopio') ||
                                    subModulo.name.toLowerCase().includes('pesaje') ||
                                    module.name.toLowerCase().includes('materia');
                                return !isMateriaPrima;
                            });

                            // Si el módulo tiene submódulos después del filtro, incluirlo
                            if (filteredSubModulos.length > 0) {
                                return {
                                    ...module,
                                    sub_modulos: filteredSubModulos
                                };
                            }
                            // Si no quedan submódulos, excluir el módulo completo
                            return null;
                        }
                        // Si el módulo no tiene submódulos, verificar si es de materia prima
                        const isMateriaPrimaModule = module.name.toLowerCase().includes('materia') ||
                            module.name.toLowerCase().includes('acopio');
                        return isMateriaPrimaModule ? null : module;
                    }).filter(module => module !== null); // Eliminar módulos null
                }

                setModules(filteredModules);
            }
        } catch (error) {
            console.error('Error al cargar módulos:', error);
        } finally {
            setLoadingModules(false);
        }
    };


    // Efecto para cargar los datos del personal
    useEffect(() => {
        setFieldErrors({ first_name: false, last_name: false, cargo: false, sucursalId: false });
        if (usuario && tipo === 'editar') {
            setDataEdit({
                first_name: usuario.first_name || '',
                last_name: usuario.last_name || '',
                codigo: usuario.codigo || '',
                cargo: usuario.cargo || ''
            });

            // Cargar módulos seleccionados si existen
            if (usuario.modules) {
                try {
                    const modulesArray = Array.isArray(usuario.modules)
                        ? usuario.modules
                        : JSON.parse(usuario.modules);
                    // Extraer solo los IDs de los módulos
                    const moduleIds = modulesArray.map(module => module.id || module);
                    setSelectedModules(moduleIds);
                } catch (error) {
                    console.error('Error al parsear módulos:', error);
                    setSelectedModules([]);
                }
            }

            // Cargar estado si existe
            if (usuario.is_active !== undefined) {
                setEstado(usuario.is_active);
            }

            // Cargar sucursal si existe
            if (usuario.sucursal_id) {
                setSucursalId(usuario.sucursal_id);
            }

            // Cargar permisos si existen
            if (usuario.permisos) {
                setPermisos({
                    crear: usuario.permisos.crear || false,
                    eliminar: usuario.permisos.eliminar || false,
                    editar: usuario.permisos.editar || false,
                    anular: usuario.permisos.anular || false,
                    reemplazar: usuario.permisos.reemplazar || false,
                    info: usuario.permisos.info || false,
                    sucursales: usuario.permisos.sucursales || false
                });
            }

            // Cargar estado de rastreo si existe
            if (usuario.rastrear !== undefined) {
                setRastrear(usuario.rastrear);
            }
        } else {
            setDataEdit({
                first_name: '',
                last_name: '',
                codigo: '',
                cargo: ''
            });
            setSelectedModules([]);
            setEstado(true); // Siempre activo por defecto
            setSucursalId('');
            setPermisos(createPermisosIniciales());
            setRastrear(false);
        }
    }, [isOpen, usuario, tipo]);

    // Efecto para cargar módulos cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            loadModules();
        }
    }, [isOpen]);


    // Función para enviar los datos del personal
    const handleSubmit = async () => {
        // Validar campos obligatorios
        if (!dataEdit.first_name.trim()) {
            setFieldErrors((prev) => ({ ...prev, first_name: true }));
            showWarning('Validación', 'El nombre es obligatorio', 5000);
            return;
        }

        if (!dataEdit.last_name.trim()) {
            setFieldErrors((prev) => ({ ...prev, last_name: true }));
            showWarning('Validación', 'El apellido es obligatorio', 5000);
            return;
        }

        if (!dataEdit.cargo.trim()) {
            setFieldErrors((prev) => ({ ...prev, cargo: true }));
            showWarning('Validación', 'El cargo es obligatorio', 5000);
            return;
        }

        if (!sucursalId) {
            setFieldErrors((prev) => ({ ...prev, sucursalId: true }));
            showWarning('Validación', 'La sucursal es obligatoria', 5000);
            return;
        }

        // Generar código automáticamente si no existe
        let codigoFinal = dataEdit.codigo;
        if (!codigoFinal && dataEdit.first_name && dataEdit.last_name) {
            codigoFinal = generarCodigo(dataEdit.first_name, dataEdit.last_name);
        }

        // Validar longitud del código
        if (codigoFinal.length !== 8) {
            showWarning('Validación', 'El código debe tener exactamente 8 caracteres', 5000);
            return;
        }

        // Validar que se seleccione al menos un submódulo
        if (selectedModules.length === 0) {
            showWarning('Validación', 'Debe seleccionar al menos un submódulo', 5000);
            return;
        }

        setFieldErrors({ first_name: false, last_name: false, cargo: false, sucursalId: false });
        setLoading(true);

        // Preparar datos para enviar
        const datosParaEnviar = {
            first_name: dataEdit.first_name,
            last_name: dataEdit.last_name,
            codigo: codigoFinal,
            cargo: dataEdit.cargo,
            modules: selectedModules,
            is_active: estado,
            sucursal_id: sucursalId || null,
            permisos: permisos,
            rastrear: rastrear
        };
        try {
            let response;

            if (tipo === 'editar') {
                response = await personalService.update(usuario.id, datosParaEnviar);
            } else {
                response = await personalService.create(datosParaEnviar);
            }

            if (response.success) {
                const registroId = (response.data && response.data.id) || response.id || usuario?.id || null;
                const lugarAfectado = (response.data && response.data.first_name)
                    ? `${response.data.first_name || ''} ${response.data.last_name || ''}`.trim() || 'Personal'
                    : `${datosParaEnviar.first_name || ''} ${datosParaEnviar.last_name || ''}`.trim() || 'Personal';
                const comentarioAccion = tipo === 'editar'
                    ? 'Actualización de personal'
                    : 'Creación de personal';

                // Detalles: información general + todos los permisos (sin módulos). Keys = labels en español.
                const sucursalNombreDespues = sucursales.find(s => s.id === datosParaEnviar.sucursal_id)?.name ?? null;
                const sucursalNombreAntes = tipo === 'editar'
                    ? (usuario?.sucursal?.name ?? sucursales.find(s => s.id === usuario?.sucursal_id)?.name ?? null)
                    : null;
                const labelsPermisos = {
                    crear: 'Permiso de creación',
                    eliminar: 'Permiso de eliminación',
                    editar: 'Permiso de edición',
                    anular: 'Permiso de anulación',
                    reemplazar: 'Permiso de reemplazo',
                    info: 'Permiso de información',
                    sucursales: 'Permiso de sucursales'
                };
                const camposDetalle = {
                    'Nombres': tipo === 'editar' ? { antes: usuario?.first_name ?? null, despues: datosParaEnviar.first_name } : { despues: datosParaEnviar.first_name },
                    'Apellidos': tipo === 'editar' ? { antes: usuario?.last_name ?? null, despues: datosParaEnviar.last_name } : { despues: datosParaEnviar.last_name },
                    'Código': tipo === 'editar' ? { antes: usuario?.codigo ?? null, despues: datosParaEnviar.codigo } : { despues: datosParaEnviar.codigo },
                    'Cargo': tipo === 'editar' ? { antes: usuario?.cargo ?? null, despues: datosParaEnviar.cargo } : { despues: datosParaEnviar.cargo },
                    'Sucursal': tipo === 'editar' ? { antes: sucursalNombreAntes, despues: sucursalNombreDespues } : { despues: sucursalNombreDespues },
                    'Activo': tipo === 'editar' ? { antes: usuario?.is_active ?? false, despues: datosParaEnviar.is_active } : { despues: datosParaEnviar.is_active }
                };
                Object.entries(labelsPermisos).forEach(([key, label]) => {
                    const pAntes = tipo === 'editar' ? (usuario?.permisos?.[key] ?? false) : null;
                    const pDespues = datosParaEnviar.permisos?.[key] ?? false;
                    camposDetalle[label] = tipo === 'editar'
                        ? { antes: pAntes, despues: pDespues }
                        : { despues: pDespues };
                });
                const detallesPersonalizados = {
                    campos: camposDetalle,
                    comentario: comentarioAccion
                };

                await logAccion({
                    accion: tipo === 'editar' ? 'EDITAR' : 'CREAR',
                    lugarAfectado,
                    registroId,
                    comentario: comentarioAccion,
                    detallesPersonalizados
                });

                if (tipo === 'editar' && onPersonalUpdated) {
                    onPersonalUpdated(response.data);
                } else if (tipo === 'agregar' && onPersonalCreated) {

                    onPersonalCreated(response.data);
                }

                // Cerrar modal inmediatamente
                setIsOpen(false);
                showSuccess('Éxito', `Personal ${tipo === 'editar' ? 'actualizado' : 'creado'} correctamente`);
            } else {
                showDanger('Error', response.message || `Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} el personal`);
            }
        } catch (error) {
            console.error(`Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} personal:`, error);
            showDanger('Error', 'Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    }

    const hanclePermisos = (permiso, value) => {
        setPermisos({
            ...permisos,
            [permiso]: value
        })
    }

    const isReadOnly = tipo === 'ver' || loading;

    return (
        <>
            <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
                <HeaderModal title={tipo === 'agregar' ? 'Nuevo Empleado' : tipo === 'editar' ? 'Editar Empleado' : 'Ver Empleado'} onClose={() => setIsOpen(false)} />
                <div className={styles.modalContent}>
                    <hr className={styles.separator} />
                    <p className={styles.subTitle}>Información personal</p>
                    <Input
                        tipo="text"
                        label="Nombres"
                        value={dataEdit.first_name}
                        onChange={(e) => {
                            const newFirstName = e.target.value;
                            setDataEdit(prev => ({
                                ...prev,
                                first_name: newFirstName,
                                codigo: (tipo === 'agregar' && prev.last_name) ? generarCodigo(newFirstName, prev.last_name) : prev.codigo
                            }));
                            setFieldErrors((prev) => ({ ...prev, first_name: false }));
                        }}
                        required={true}
                        readOnly={isReadOnly}
                        error={fieldErrors.first_name}
                        onClearError={() => setFieldErrors((prev) => ({ ...prev, first_name: false }))}
                    />
                    <Input
                        tipo="text"
                        label="Apellidos"
                        value={dataEdit.last_name}
                        onChange={(e) => {
                            const newLastName = e.target.value;
                            setDataEdit(prev => ({
                                ...prev,
                                last_name: newLastName,
                                codigo: (tipo === 'agregar' && prev.first_name) ? generarCodigo(prev.first_name, newLastName) : prev.codigo
                            }));
                            setFieldErrors((prev) => ({ ...prev, last_name: false }));
                        }}
                        required={true}
                        readOnly={isReadOnly}
                        error={fieldErrors.last_name}
                        onClearError={() => setFieldErrors((prev) => ({ ...prev, last_name: false }))}
                    />
                    <InputCall
                        label="Código"
                        value={dataEdit.codigo}
                        placeholder="Código Autogenerado"
                        onClick={handleCopyCode}
                        readOnly={isReadOnly}
                    />
                    {dataEdit.codigo ? (
                        <Text type="warning" align="left">
                            Una vez creado el personal con el código autogenerado, no es posible cambiarlo. Presiona el campo para copiar el código.
                        </Text>
                    ) : null}
                    <Input
                        tipo="text"
                        label="Cargo"
                        value={dataEdit.cargo}
                        onChange={(e) => {
                            setDataEdit({ ...dataEdit, cargo: e.target.value });
                            setFieldErrors((prev) => ({ ...prev, cargo: false }));
                        }}
                        required={true}
                        readOnly={isReadOnly}
                        error={fieldErrors.cargo}
                        onClearError={() => setFieldErrors((prev) => ({ ...prev, cargo: false }))}
                    />
                    <InputSelect
                        label="Sucursal"
                        value={sucursalId}
                        onChange={(value) => {
                            setSucursalId(value);
                            setFieldErrors((prev) => ({ ...prev, sucursalId: false }));
                        }}
                        options={sucursales.map(sucursal => ({
                            value: sucursal.id,
                            label: sucursal.name
                        }))}
                        placeholder="Seleccionar sucursal (obligatorio)"
                        disabled={isReadOnly}
                        readOnly={isReadOnly}
                        required={true}
                        error={fieldErrors.sucursalId}
                    />
                    {tipo === 'editar' && (

                        <div className={styles.content} style={{ padding: '10px 15px',marginTop: '10px'}}>
                            <Switch
                                icon="check-circle"
                                title="Activo"
                                subtitle="Indica si el usuario está activo o inactivo"
                                checked={estado}
                                onChange={setEstado}
                                readOnly={loading}
                            />
                        </div>

                    )}
                    <div className={styles.space}></div>
                    {tipo !== 'ver' && (
                        <Boton
                            className='btn-gray'
                            label='Configuración'
                            onClick={() => setIsConfiguracionOpen(true)}
                            readOnly={loading}
                        />
                    )}

                    {tipo !== 'ver' && (
                        <div className={styles.buttons}>
                            <Boton
                                className='btn-original'
                                label={tipo === 'editar' ? 'Actualizar Personal' : 'Agregar Personal'}
                                style={{ marginTop: 'auto' }}
                                onClick={handleSubmit}
                                loading={loading}
                                disabled={loading}
                            />
                        </div>
                    )}
                </div>


            </ViewModal>
            <ModalConfiguracion
                isOpen={isConfiguracionOpen}
                setIsOpen={setIsConfiguracionOpen}
                permisos={permisos}
                onPermisoChange={hanclePermisos}
                selectedModules={selectedModules}
                onSelectedModulesChange={setSelectedModules}
                modules={modules.filter((m) => {
                    const name = (m.name || '').toLowerCase();
                    return name !== 'balance' && name !== 'reportes';
                })}
                loadingModules={loadingModules}
            />
        </>
    );
}
export default EditarAgregar;