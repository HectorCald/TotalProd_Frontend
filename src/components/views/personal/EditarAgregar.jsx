import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderModal from '../../common/HeaderModal';
import ViewModal from '../../ui/ViewModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Carousel from '../../common/Carousel';
import MultiSelect from '../../common/MultiSelect';
import personalService from '../../../services/personalService';
import modulesService from '../../../services/modulesService';
import Switch from '../../common/Switch';
import Select from '../../common/Select';
import Notification from '../../common/Notification';
import { isDamabrava } from '../../../utils/empresaHelper';
import NoData from '../../common/NoData';

function EditarAgregar({ isOpen, setIsOpen, usuario, tipo, onPersonalCreated, onPersonalUpdated, sucursales = [] }) {

    // Estados para los datos del personal
    const [dataEdit, setDataEdit] = useState({
        first_name: '',
        last_name: '',
        codigo: ''
    });
    const [estado, setEstado] = useState(true); // Siempre activo por defecto
    const [sucursalId, setSucursalId] = useState('');
    const [permisos, setPermisos] = useState({
        crear: false,
        eliminar: false,
        editar: false,
        anular: false,
        reemplazar: false
    });
    const [rastrear, setRastrear] = useState(false);
    // Estado para la notificación
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });

    // Estados para módulos y submódulos
    const [modules, setModules] = useState([]);
    const [selectedModules, setSelectedModules] = useState([]);
    const [loadingModules, setLoadingModules] = useState(false);


    // Estados para modales
    const [isConfiguracionOpen, setIsConfiguracionOpen] = useState(false);


    // Estados para la carga
    const [loading, setLoading] = useState(false);


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


    // Función para mostrar notificación
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

    // Función para copiar código al portapapeles
    const handleCopyCode = async () => {
        if (!dataEdit.codigo) {
            mostrarNotificacion('error', 'No hay código para copiar');
            return;
        }

        try {
            await navigator.clipboard.writeText(dataEdit.codigo);
            mostrarNotificacion('success', 'Código copiado al portapapeles');
        } catch (error) {
            console.error('Error al copiar:', error);
            mostrarNotificacion('error', 'Error al copiar el código');
        }
    };

    // Función para cargar módulos
    const loadModules = async () => {
        try {
            setLoadingModules(true);
            const response = await modulesService.getAll();
            if (response.success) {
                // Si la empresa es Damabrava, cargar TODOS los módulos
                if (isDamabrava()) {
                    setModules(response.data);
                } else {
                    // Para otras empresas, cargar todos los módulos EXCEPTO los de Damabrava
                    const nonDamabravaModules = response.data.filter(module =>
                        !module.name.toLowerCase().includes('damabrava') &&
                        !module.name.toLowerCase().includes('producción') &&
                        !module.name.toLowerCase().includes('formulario') &&
                        !module.name.toLowerCase().includes('verificación')
                    );
                    setModules(nonDamabravaModules);
                }
            }
        } catch (error) {
            console.error('Error al cargar módulos:', error);
        } finally {
            setLoadingModules(false);
        }
    };


    // Efecto para cargar los datos del personal
    useEffect(() => {
        if (usuario && tipo === 'editar') {
            setDataEdit({
                first_name: usuario.first_name || '',
                last_name: usuario.last_name || '',
                codigo: usuario.codigo || ''
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
                setPermisos(usuario.permisos);
            }

            // Cargar estado de rastreo si existe
            if (usuario.rastrear !== undefined) {
                setRastrear(usuario.rastrear);
            }
        } else {
            setDataEdit({
                first_name: '',
                last_name: '',
                codigo: ''
            });
            setSelectedModules([]);
            setEstado(true); // Siempre activo por defecto
            setSucursalId('');
            setPermisos({
                crear: false,
                eliminar: false,
                editar: false,
                anular: false,
                reemplazar: false
            });
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
        // Activar loading inmediatamente
        setLoading(true);

        // Validar campos obligatorios
        if (!dataEdit.first_name.trim()) {
            mostrarNotificacion('error', 'El nombre es obligatorio');
            setLoading(false);
            return;
        }

        if (!dataEdit.last_name.trim()) {
            mostrarNotificacion('error', 'El apellido es obligatorio');
            setLoading(false);
            return;
        }

        if (!sucursalId) {
            mostrarNotificacion('error', 'La sucursal es obligatoria');
            setLoading(false);
            return;
        }

        // Generar código automáticamente si no existe
        let codigoFinal = dataEdit.codigo;
        if (!codigoFinal && dataEdit.first_name && dataEdit.last_name) {
            codigoFinal = generarCodigo(dataEdit.first_name, dataEdit.last_name);
        }

        // Validar longitud del código
        if (codigoFinal.length !== 8) {
            mostrarNotificacion('error', 'El código debe tener exactamente 8 caracteres');
            setLoading(false);
            return;
        }

        // Validar que se seleccione al menos un submódulo
        if (selectedModules.length === 0) {
            mostrarNotificacion('error', 'Debe seleccionar al menos un submódulo');
            setLoading(false);
            return;
        }


        // Preparar datos para enviar
        const datosParaEnviar = {
            first_name: dataEdit.first_name,
            last_name: dataEdit.last_name,
            codigo: codigoFinal,
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

                if (tipo === 'editar' && onPersonalUpdated) {
                    onPersonalUpdated(response.data);
                } else if (tipo === 'agregar' && onPersonalCreated) {

                    onPersonalCreated(response.data);
                }

                // Cerrar modal inmediatamente
                setIsOpen(false);
            } else {
                mostrarNotificacion('error', response.message || `Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} el personal`);
            }
        } catch (error) {
            console.error(`Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} personal:`, error);
            mostrarNotificacion('error', 'Error de conexión con el servidor');
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

    return (
        <>
            <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
                <HeaderModal title={tipo === 'agregar' ? 'Nuevo personal' : tipo === 'editar' ? 'Editar personal' : 'Ver personal'} onClose={() => setIsOpen(false)} />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>INFORMACION PERSONAL</p>
                    <InputNormal
                        tipo="text"
                        icon="user"
                        value={dataEdit.first_name}
                        placeholder='Nombre'
                        onChange={(e) => {
                            const newFirstName = e.target.value;
                            setDataEdit(prev => ({
                                ...prev,
                                first_name: newFirstName,
                                // Solo regenerar código si estamos en modo agregar
                                codigo: (tipo === 'agregar' && prev.last_name) ? generarCodigo(newFirstName, prev.last_name) : prev.codigo
                            }));
                        }}
                        disabled={tipo === 'ver'}
                    />
                    <InputNormal
                        tipo="text"
                        icon="user"
                        value={dataEdit.last_name}
                        placeholder='Apellido'
                        onChange={(e) => {
                            const newLastName = e.target.value;
                            setDataEdit(prev => ({
                                ...prev,
                                last_name: newLastName,
                                // Solo regenerar código si estamos en modo agregar
                                codigo: (tipo === 'agregar' && prev.first_name) ? generarCodigo(prev.first_name, newLastName) : prev.codigo
                            }));
                        }}
                        disabled={tipo === 'ver'}
                    />
                    <InputNormal
                        tipo="text"
                        icon="hash"
                        value={dataEdit.codigo}
                        placeholder='Código (autogenerado)'
                        onChange={(e) => setDataEdit({ ...dataEdit, codigo: e.target.value })}
                        disabled={tipo === 'ver' || tipo === 'editar'}
                        readonly={tipo === 'editar'}
                        buttonIcon="copy"
                        buttonIconClick={handleCopyCode}
                    />

                        <Select
                            value={sucursalId}
                            onChange={(value) => setSucursalId(value)}
                            options={sucursales.map(sucursal => ({
                                value: sucursal.id,
                                label: sucursal.name,
                                id: sucursal.id,
                                name: sucursal.name
                            }))}
                            placeholder='Sucursal (obligatorio)'
                            disabled={tipo === 'ver'}
                            icon='store'
                        />
                 

                    {tipo !== 'ver' && (

                        <Boton
                            className='btn-gray'
                            label='Ver Configuración'
                            onClick={() => setIsConfiguracionOpen(true)}
                        />

                    )}

                    {tipo !== 'ver' && (
                        <Boton
                            className='btn-original'
                            label={tipo === 'editar' ? 'Actualizar Personal' : 'Agregar Personal'}
                            style={{ marginTop: 'auto' }}
                            onClick={handleSubmit}
                            loading={loading}
                            disabled={!dataEdit.first_name || !dataEdit.last_name || !sucursalId}
                        />
                    )}
                </div>

                <Notification
                    isVisible={notification.isVisible}
                    type={notification.type}
                    text={notification.text}
                />

            </ViewModal>
            {/* Modal de Configuración */}
            <ViewModal isOpen={isConfiguracionOpen} setIsOpen={setIsConfiguracionOpen}>
                <HeaderModal
                    title="Configuración"
                    onClose={() => setIsConfiguracionOpen(false)}
                />
                <div className={styles.modalContent}>
                    {tipo === 'editar' && (
                        <>
                            <p className={styles.subTitle}>ESTADO</p>
                            <div className={styles.content}>
                                
                            <Switch
                                    icon="check-circle"
                                    title="Activo"
                                    subtitle="Indica si el usuario está activo o inactivo"
                                    checked={estado}
                                    onChange={setEstado}
                                />
                            </div>
                        </>
                    )}
                    <p className={styles.subTitle}>PERMISOS</p>
                    <div className={styles.content}>
                        <Switch
                            icon="file"
                            title="Crear"
                            subtitle="Permite crear nuevos productos o items"
                            checked={permisos.crear || false}
                            onChange={(checked) => hanclePermisos('crear', checked)}
                        />
                        <Switch
                            icon="trash"
                            title="Eliminar"
                            subtitle="Permite eliminar registros"
                            checked={permisos.eliminar || false}
                            onChange={(checked) => hanclePermisos('eliminar', checked)}
                        />
                        <Switch
                            icon="edit"
                            title="Editar"
                            subtitle="Permite modificar registros"
                            checked={permisos.editar || false}
                            onChange={(checked) => hanclePermisos('editar', checked)}
                        />
                        <Switch
                            icon="x-circle"
                            title="Anular"
                            subtitle="Permite anular registros"
                            checked={permisos.anular || false}
                            onChange={(checked) => hanclePermisos('anular', checked)}
                        />
                        <Switch
                            icon="refresh"
                            title="Reemplazar"
                            subtitle="Permite reemplazar stocks por conteos"
                            checked={permisos.reemplazar || false}
                            onChange={(checked) => hanclePermisos('reemplazar', checked)}
                        />
                    </div>
                    <p className={styles.subTitle}>RASTREO</p>
                    <div className={styles.content}>
                        <Switch
                            icon="map"
                            title="Rastrear Ubicación"
                            subtitle="Permite rastrear la ubicación del empleado"
                            checked={rastrear || false}
                            onChange={setRastrear}
                        />
                    </div>
                    <p className={styles.subTitle}>MÓDULOS {isDamabrava() ? '(TODOS)' : '(GENERALES)'}</p>
                    {loadingModules ? (
                        <NoData
                            icon="loader-alt"
                            title="Cargando módulos..."
                            detail="Obteniendo módulos disponibles para asignar"
                            transparent={true}
                            minHeight="150px"
                        />
                    ) : modules.filter(module => module.sub_modulos && module.sub_modulos.length > 0).length > 0 ? (
                        <Carousel>
                            {modules
                                .filter(module => module.sub_modulos && module.sub_modulos.length > 0)
                                .map((module) => (
                                    <div key={module.id}>
                                        <MultiSelect
                                            title={module.name}
                                            options={module.sub_modulos.map(sub => ({
                                                name: sub.name,
                                                value: sub.id
                                            }))}
                                            selectedValues={selectedModules}
                                            onChange={setSelectedModules}
                                        />
                                    </div>
                                ))}
                        </Carousel>
                    ) : (
                        <NoData
                            icon="grid-alt"
                            title="Sin módulos"
                            detail="No hay módulos con submódulos disponibles para asignar"
                            transparent={false}
                            minHeight="150px"
                        />
                    )}
                    <Boton
                        className='btn-original'
                        label='Cerrar Configuración'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsConfiguracionOpen(false)}
                    />
                </div>
            </ViewModal >
        </>
    );
}
export default EditarAgregar;