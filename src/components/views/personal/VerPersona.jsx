import React, { useState } from 'react';
import styles from './VerPersona.module.css';
import HeaderView from '../../common/HeaderView';
import HeaderModal from '../../common/HeaderModal';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import Dato from '../../common/Dato';
import Switch from '../../common/Switch';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../common/Boton';
import Select from '../../common/Select';
import MultiSelect from '../../common/MultiSelect';
import Carousel from '../../common/Carousel';

const roles = [
    { value: 'administracion', label: 'Administración', icon: 'user-circle' },
    { value: 'acopio', label: 'Acopio', icon: 'leaf' },
    { value: 'almacen', label: 'Almacén', icon: 'store' },
    { value: 'produccion', label: 'Producción', icon: 'factory' },
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
    { name: 'Pedidos', value: 'pedidos'},
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

function VerUsuario({ isOpen, setIsOpen, usuario }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedPlugins, setSelectedPlugins] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState(usuario?.rol || '');
    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    {usuario?.nombre}
                    <button className={styles.iconButton} onClick={() => setIsEditOpen(true)}>
                        <BoxIcon
                            name='edit'
                            className={styles.icon}
                        />
                    </button>

                </h1>
                <p className={styles.subTitle}>INFORMACIÓN PERSONAL</p>
                <div className={styles.content}>
                    <Dato label="Nombre completo" value={usuario?.nombre} />
                    <Dato label="Correo electrónico" value={usuario?.email} />
                    <Dato label="Teléfono" value={usuario?.telefono} />
                </div>
                <p className={styles.subTitle}>ROL</p>
                <div className={styles.contentPermisos}>
                    <Dato label="Rol" value={usuario?.rol} />
                </div>
                <p className={styles.subTitle}>ESTADO</p>
                <div className={styles.contentPermisos}>
                    <Dato label="Estado" value={usuario?.estado} />
                </div>
                <p className={styles.subTitle}>PERMISOS</p>
                <div className={styles.contentPermisos}>
                    <Dato label="Crear" value={usuario?.permisos.crear ? 'Sí' : 'No'} />
                    <Dato label="Editar" value={usuario?.permisos.editar ? 'Sí' : 'No'} />
                    <Dato label="Eliminar" value={usuario?.permisos.eliminar ? 'Sí' : 'No'} />
                    <Dato label="Anular" value={usuario?.permisos.anular ? 'Sí' : 'No'} />
                </div>
                <p className={styles.subTitle}>OTRAS FUNCIONES</p>
                <div className={styles.contentPermisos}>
                    <Dato label="Función" value='Tareas' />
                </div>
            </div>

            {/* Modal de Edición de Permisos */}
            <ViewModal isOpen={isEditOpen} setIsOpen={setIsEditOpen}>
                <HeaderModal
                    title="Editar"
                    onClose={() => setIsEditOpen(false)}
                />
                <div className={styles.modalContent}>
                    <div className={styles.switchesContainer}>
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
                            checked={usuario?.permisos?.crear || false}
                            onChange={(checked) => console.log('Crear:', checked)}
                        />
                        <p className={styles.subTitle}>PERMISOS</p>
                        <Switch
                            icon="file"
                            title="Crear"
                            subtitle="Permite crear nuevos productos o items"
                            checked={usuario?.permisos?.crear || false}
                            onChange={(checked) => console.log('Crear:', checked)}
                        />
                        <Switch
                            icon="trash"
                            title="Eliminar"
                            subtitle="Permite eliminar registros"
                            checked={usuario?.permisos?.eliminar || false}
                            onChange={(checked) => console.log('Eliminar:', checked)}
                        />
                        <Switch
                            icon="edit"
                            title="Editar"
                            subtitle="Permite modificar registros"
                            checked={usuario?.permisos?.editar || false}
                            onChange={(checked) => console.log('Editar:', checked)}
                        />
                        <Switch
                            icon="x-circle"
                            title="Anular"
                            subtitle="Permite anular registros"
                            checked={usuario?.permisos?.anular || false}
                            onChange={(checked) => console.log('Anular:', checked)}
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
                        />
                    </div>
                </div>
            </ViewModal>
        </View>
    );
}
export default VerUsuario;