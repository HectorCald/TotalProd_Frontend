import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import personalStyles from './EditarPersona.module.css';
import HeaderModal from '../../common/HeaderModal';
import ViewModal from '../../ui/ViewModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import MensajeError from '../../common/MensajeError';
import Carousel from '../../common/Carousel';
import MultiSelect from '../../common/MultiSelect';
import proveedorService from '../../../services/proveedorService';
import modulesService from '../../../services/modulesService';
import Switch from '../../common/Switch';

function EditarAgregar({ isOpen, setIsOpen, usuario, tipo, onProveedorCreated, onProveedorUpdated }) {

    // Estados para los datos del personal
    const [dataEdit, setDataEdit] = useState({
        first_name: '',
        last_name: '',
        celular: '',
        codigo: ''
    });
    const [estado, setEstado] = useState(false);
    const [permisos, setPermisos] = useState({
        crear: false,
        eliminar: false,
        editar: false,
        anular: false
    });
    // Estados para los mensajes de error y éxito
    const [errorMessage, setErrorMessage] = useState('');

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

        const firstInitial = firstName.charAt(0).toUpperCase();
        const lastInitial = lastName.charAt(0).toUpperCase();
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

        return `${firstInitial}${lastInitial}${randomNum}`;
    };

    // Función para cargar módulos
    const loadModules = async () => {
        try {
            setLoadingModules(true);
            const response = await modulesService.getAll();
            if (response.success) {
                setModules(response.data);
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
                celular: usuario.celular || '',
                codigo: usuario.codigo || ''
            });

            // Cargar módulos seleccionados si existen
            if (usuario.modules) {
                try {
                    const modulesArray = Array.isArray(usuario.modules)
                        ? usuario.modules
                        : JSON.parse(usuario.modules);
                    setSelectedModules(modulesArray);
                } catch (error) {
                    console.error('Error al parsear módulos:', error);
                    setSelectedModules([]);
                }
            }

            // Cargar estado y permisos si existen
            if (usuario.estado !== undefined) {
                setEstado(usuario.estado);
            }
            if (usuario.permisos) {
                setPermisos(usuario.permisos);
            }
        } else {
            setDataEdit({
                first_name: '',
                last_name: '',
                celular: '',
                codigo: ''
            });
            setSelectedModules([]);
            setEstado(false);
            setPermisos({
                crear: false,
                eliminar: false,
                editar: false,
                anular: false
            });
        }
        setErrorMessage('');
    }, [isOpen, usuario, tipo]);

    // Efecto para cargar módulos cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            loadModules();
        }
    }, [isOpen]);


    // Función para enviar los datos del personal
    const handleSubmit = async () => {
        if (!dataEdit.first_name.trim()) {
            setErrorMessage('El nombre es obligatorio');
            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
            return;
        }

        if (!dataEdit.last_name.trim()) {
            setErrorMessage('El apellido es obligatorio');
            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
            return;
        }

        // Generar código automáticamente si no existe
        let codigoFinal = dataEdit.codigo;
        if (!codigoFinal && dataEdit.first_name && dataEdit.last_name) {
            codigoFinal = generarCodigo(dataEdit.first_name, dataEdit.last_name);
        }

        // Preparar datos para enviar
        const datosParaEnviar = {
            first_name: dataEdit.first_name,
            last_name: dataEdit.last_name,
            celular: dataEdit.celular,
            codigo: codigoFinal,
            modules: selectedModules,
            estado: estado,
            permisos: permisos
        };
        setLoading(true);
        try {
            let response;

            if (tipo === 'editar') {
                response = await proveedorService.update(usuario.id, datosParaEnviar);
            } else {
                response = await proveedorService.create(datosParaEnviar);
            }

            if (response.success) {
                if (tipo === 'editar' && onProveedorUpdated) {
                    onProveedorUpdated(response.data);
                } else if (tipo === 'agregar' && onProveedorCreated) {
                    onProveedorCreated(response.data);
                }
                setIsOpen(false);
            } else {
                setErrorMessage(response.message || `Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} el personal`);
                setTimeout(() => {
                    setErrorMessage('')
                }, 3000);
            }
        } catch (error) {
            console.error(`Error al ${tipo === 'editar' ? 'actualizar' : 'crear'} personal:`, error);
            setErrorMessage('Error de conexión con el servidor');
            setTimeout(() => {
                setErrorMessage('')
            }, 3000);
        } finally {
            setLoading(false);
        }
    }


    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal title={tipo === 'agregar' ? 'Nuevo personal' : tipo === 'editar' ? 'Editar personal' : 'Ver personal'} onClose={() => setIsOpen(false)} />
            <div className={styles.modalContent}>
                <MensajeError mensaje={errorMessage} />
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
                            codigo: prev.last_name ? generarCodigo(newFirstName, prev.last_name) : prev.codigo
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
                            codigo: prev.first_name ? generarCodigo(prev.first_name, newLastName) : prev.codigo
                        }));
                    }}
                    disabled={tipo === 'ver'}
                />
                <InputNormal
                    tipo="text"
                    icon="hash"
                    value={dataEdit.codigo}
                    placeholder='Código (generado automáticamente)'
                    onChange={(e) => setDataEdit({ ...dataEdit, codigo: e.target.value })}
                    disabled={tipo === 'ver'}
                />
                <InputNormal
                    tipo="number"
                    icon="phone"
                    value={dataEdit.celular}
                    placeholder='Celular'
                    onChange={(e) => setDataEdit({ ...dataEdit, celular: e.target.value })}
                    disabled={tipo === 'ver'}
                />

                {tipo !== 'ver' && (
                    <div className={styles.content} style={{ padding: '10px 15px' }}>
                        <Boton
                            className='btn-default'
                            label='Ver Configuración'
                            onClick={() => setIsConfiguracionOpen(true)}
                        />
                    </div>
                )}

                {tipo !== 'ver' && (
                    <Boton
                        className='btn-original'
                        label={tipo === 'editar' ? 'Actualizar' : 'Guardar'}
                        style={{ marginTop: 'auto' }}
                        onClick={handleSubmit}
                        loading={loading}
                        disabled={!dataEdit.first_name || !dataEdit.last_name}
                    />
                )}
            </div>

            {/* Modal de Configuración */}
            <ViewModal isOpen={isConfiguracionOpen} setIsOpen={setIsConfiguracionOpen}>
                <HeaderModal
                    title="Configuración del Personal"
                    onClose={() => setIsConfiguracionOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>ESTADO</p>
                    <Switch
                        icon="check-circle"
                        title="Activo"
                        subtitle="Indica si el usuario está activo o inactivo"
                        checked={estado}
                        onChange={setEstado}
                    />
                    
                    <p className={styles.subTitle}>PERMISOS</p>
                    <Switch
                        icon="file"
                        title="Crear"
                        subtitle="Permite crear nuevos productos o items"
                        checked={permisos.crear || false}
                        onChange={(checked) => setPermisos({ ...permisos, crear: checked })}
                    />
                    <Switch
                        icon="trash"
                        title="Eliminar"
                        subtitle="Permite eliminar registros"
                        checked={permisos.eliminar || false}
                        onChange={(checked) => setPermisos({ ...permisos, eliminar: checked })}
                    />
                    <Switch
                        icon="edit"
                        title="Editar"
                        subtitle="Permite modificar registros y productos"
                        checked={permisos.editar || false}
                        onChange={(checked) => setPermisos({ ...permisos, editar: checked })}
                    />
                    <Switch
                        icon="x-circle"
                        title="Anular"
                        subtitle="Permite anular registros"
                        checked={permisos.anular || false}
                        onChange={(checked) => setPermisos({ ...permisos, anular: checked })}
                    />

                    <p className={styles.subTitle}>MÓDULOS</p>
                    {loadingModules ? (
                        <div className={styles.noData}>
                            <p>Cargando módulos...</p>
                        </div>
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
                        <div className={styles.noData}>
                            <p>No hay módulos con submódulos disponibles</p>
                        </div>
                    )}
                </div>
            </ViewModal>

        </ViewModal>
    );
}
export default EditarAgregar;