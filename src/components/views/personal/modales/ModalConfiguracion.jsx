import React from 'react';
import styles from '../../../../styles/view.module.css';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import Switch from '../../../common/Switch';
import OpcionDesplegable from '../../../common/OpcionDesplegable';
import Carousel from '../../../common/Carousel';
import MultiSelect from '../../../common/MultiSelect';
import NoData from '../../../common/NoData';

function ModalConfiguracion({
    isOpen,
    setIsOpen,
    permisos,
    onPermisoChange,
    selectedModules,
    onSelectedModulesChange,
    modules,
    loadingModules
}) {
    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Configuración"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Permisos</p>
                <div className={styles.content}>
                    <Switch
                        icon="file"
                        title="Crear"
                        subtitle="Permite crear nuevos productos o items"
                        checked={permisos.crear || false}
                        onChange={(checked) => onPermisoChange('crear', checked)}
                    />
                    <Switch
                        icon="trash"
                        title="Eliminar"
                        subtitle="Permite eliminar registros, productos, etc."
                        checked={permisos.eliminar || false}
                        onChange={(checked) => onPermisoChange('eliminar', checked)}
                    />
                    <Switch
                        icon="edit"
                        title="Editar"
                        subtitle="Permite modificar registros o productos"
                        checked={permisos.editar || false}
                        onChange={(checked) => onPermisoChange('editar', checked)}
                    />
                    <Switch
                        icon="x-circle"
                        title="Anular"
                        subtitle="Permite anular registros o pedidos"
                        checked={permisos.anular || false}
                        onChange={(checked) => onPermisoChange('anular', checked)}
                    />
                    <Switch
                        icon="refresh"
                        title="Reemplazar"
                        subtitle="Permite reemplazar stocks por conteos"
                        checked={permisos.reemplazar || false}
                        onChange={(checked) => onPermisoChange('reemplazar', checked)}
                    />
                </div>
                <OpcionDesplegable titulo="Otros permisos" scrollOnOpen={false} disableAnimation={true}>
                    <div className={styles.content}>
                        <Switch
                            icon="show"
                            title="Ver información"
                            subtitle="Permite ver información (Costos, precios, etc.)"
                            checked={permisos.info || false}
                            onChange={(checked) => onPermisoChange('info', checked)}
                        />
                        <Switch
                            icon="store"
                            title="Administrar sucursales"
                            subtitle="Permite cambiar la sucursal asignada a otras"
                            checked={permisos.sucursales || false}
                            onChange={(checked) => onPermisoChange('sucursales', checked)}
                        />
                    </div>
                </OpcionDesplegable>
                <p className={styles.subTitle}>Módulos</p>
                {loadingModules ? (
                    <NoData
                        icon="loader-alt"
                        title="Cargando módulos..."
                        detail="Obteniendo módulos disponibles para asignar"
                        transparent={true}
                        minHeight="150px"
                    />
                ) : modules.filter(module => module.sub_modulos && module.sub_modulos.length > 0).length > 0 ? (
                    <div className={styles.content} style={{ paddingInline: '5px', paddingBottom: '5px' }}>
                        <Carousel>
                            {modules
                                .filter(module => module.sub_modulos && module.sub_modulos.length > 0)
                                .map((module) => (
                                    <div key={module.id}>
                                        <MultiSelect
                                            title={`${module.name.toUpperCase()} (${module.sub_modulos.length})`}
                                            options={module.sub_modulos.map(sub => ({
                                                name: sub.name,
                                                value: sub.id
                                            }))}
                                            selectedValues={selectedModules}
                                            onChange={onSelectedModulesChange}
                                        />
                                    </div>
                                ))}
                        </Carousel>
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
                <div className={styles.buttons}>
                    <Boton
                        className='btn-original'
                        label='Cerrar Configuración'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsOpen(false)}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalConfiguracion;
