import React, { useEffect, useState } from 'react';
import styles from './EditarPersona.module.css';
import HeaderModal from '../../common/HeaderModal';
import ViewModal from '../../ui/ViewModal';
import Switch from '../../common/Switch';
import Boton from '../../common/Boton';
import Select from '../../common/Select';
import MultiSelect from '../../common/MultiSelect';
import Carousel from '../../common/Carousel';

const roles = [
    { value: 'Administración', label: 'Administración', icon: 'user-circle' },
    { value: 'Acopio', label: 'Acopio', icon: 'leaf' },
    { value: 'Almacén', label: 'Almacén', icon: 'store' },
    { value: 'Producción', label: 'Producción', icon: 'factory' },
    { value: 'Ninguno', label: 'Ninguno', icon: 'factory' },
];
const pluginsAlmacen = [
    { name: 'Almacen', value: 'almacen' },
    { name: 'Ingreso', value: 'ingreso' },
    { name: 'Salida', value: 'salida' },
    { name: 'Verificar', value: 'verificar' },
    { name: 'Conteo', value: 'conteo' },
];
const pluginsAcopio = [
    { name: 'Almacen', value: 'almacenAcopio' },
    { name: 'Ingreso', value: 'ingresoAcopio' },
    { name: 'Salida', value: 'salidaAcopio' },
    { name: 'Pesaje', value: 'pesaje' },
    { name: 'Pedidos', value: 'pedidos' },
    { name: 'Procesamiento', value: 'procesamiento' },
];
const pluginsAdministracion = [
    { name: 'Clientes', value: 'clientes' },
    { name: 'Proveedores', value: 'prooveedores' },
    { name: 'Reportes', value: 'reportes' },
    { name: 'Cotización', value: 'contizacion' },
    { name: 'Catalogo', value: 'catalogo' },
    { name: 'Caja', value: 'caja' },
];
const pluginsProduccion = [
    { name: 'Formulario', value: 'formulario' },
];


function EditarPersona({ isOpen, setIsOpen, usuario }) {
    const [dataUsuario, setDataUsuario] = useState({
        id: '',
        nombre: '',
        email: '',
        celular: '',
        icon: '',
        rol: '',
        estado: false,
        permisos: {
            eliminar: false,
            editar: false,
            crear: false,
            anular: false
        },
        plugins: [''],
    })
    const [selectedPlugins, setSelectedPlugins] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState('');
    

    const [permisos, setPermisos] = useState({
        crear: false,
        editar: false,
        eliminar: false,
        anular: false
    })
    const [estado, setEstado] = useState(dataUsuario.estado);

    useEffect(() => {
        if (usuario) {
            setDataUsuario(usuario);
            
            // Manejar permisos
            if (usuario.permisos) {
                setPermisos(usuario.permisos);
            }
            
            // Manejar estado
            if (usuario.estado !== undefined) {
                setEstado(usuario.estado);
            }

            // Manejar rol
            if (usuario.rol) {
                // Buscar si el rol del usuario coincide con alguno de los roles disponibles
                const rolEncontrado = roles.find(r => r.value === usuario.rol);
                if (rolEncontrado) {
                    setSelectedRoles(rolEncontrado.value);
                }
            }

            // Manejar plugins
            if (usuario.plugins) {
                let pluginArray;
                if (Array.isArray(usuario.plugins)) {
                    pluginArray = usuario.plugins;
                } else if (typeof usuario.plugins === 'string') {
                    try {
                        // Intentar parsear si es un string JSON
                        pluginArray = JSON.parse(usuario.plugins.replace(/'/g, '"'));
                    } catch {
                        // Si falla el parse, asumir que es un string simple
                        pluginArray = usuario.plugins;
                    }
                } else {
                    pluginArray = [];
                }
                setSelectedPlugins(Array.isArray(pluginArray) ? pluginArray : [pluginArray]);
            }
        }
    }, [isOpen, usuario]);
    const hanclePermisos = (permiso, value) => {
        setPermisos({
            ...permisos,
            [permiso]: value
        })
    }

    const hadleGuardar = (usuarioUpdate) => {
        console.log('Usuario actualizado' + usuarioUpdate)
        setIsOpen(false)
    }

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Editar"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>

                <p className={styles.subTitle}>ROL</p>
                <Select
                    placeholder="Seleccionar opción"
                    options={roles}
                    value={selectedRoles}
                    onChange={setSelectedRoles}
                    icon="user"
                />
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
                <p className={styles.subTitle}>FUNCIONES</p>
                <Carousel>
                    <div className={styles.carouselScreen}>
                        <MultiSelect
                            title="Almacen"
                            options={pluginsAlmacen}
                            selectedValues={selectedPlugins}
                            onChange={setSelectedPlugins}
                        />
                    </div>
                    <div className={styles.carouselScreen}>
                        <MultiSelect
                            title="Acopio"
                            options={pluginsAcopio}
                            selectedValues={selectedPlugins}
                            onChange={setSelectedPlugins}
                        />
                    </div>
                    <div className={styles.carouselScreen}>
                        <MultiSelect
                            title="Producción"
                            options={pluginsProduccion}
                            selectedValues={selectedPlugins}
                            onChange={setSelectedPlugins}
                        />
                    </div>
                    <div className={styles.carouselScreen}>
                        <MultiSelect
                            title="Administración"
                            options={pluginsAdministracion}
                            selectedValues={selectedPlugins}
                            onChange={setSelectedPlugins}
                        />
                    </div>
                </Carousel>
                <Boton
                    className='btn-original'
                    label='Guardar'
                    style={{ marginTop: 'auto' }}
                    onClick={() => hadleGuardar(dataUsuario)}
                />
            </div>
        </ViewModal>
    );
}
export default EditarPersona;