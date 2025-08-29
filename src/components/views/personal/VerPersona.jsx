import React, { useState } from 'react';
import styles from './VerPersona.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';

import Dato from '../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import EditarPersona from './EditarPersona';
import HistoriaPersona from './HistorialPersona';

function VerUsuario({ isOpen, setIsOpen, usuario }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const permisos = usuario?.permisos || {
        crear: false,
        editar: false,
        eliminar: false,
        anular: false
    };
    const plugins = Array.isArray(usuario?.plugins) ? usuario.plugins : [];

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>{usuario?.nombre}
                    <div className={styles.buttonContainer} >
                        <button className={styles.iconButtonEdit} onClick={() => setIsEditOpen(true)}>
                            <BoxIcon
                                name='edit'
                                className={styles.icon}
                            />
                        </button>
                        <button className={styles.iconButtonHistory} onClick={() => setIsHistoryOpen(true)}>
                            <BoxIcon
                                name='history'
                                className={styles.icon}
                            />
                        </button>
                    </div>
                </h1>
                <p className={styles.subTitle}>INFORMACIÓN PERSONAL</p>
                <div className={styles.content}>
                    <Dato label="Email" value={usuario?.email || 'N/A'} />
                    <Dato label="Celular" value={usuario?.celular || 'N/A'} />
                    <Dato label="Estado" value={usuario?.estado? 'Activo':'Inactivo'} especial={usuario?.estado? 'green':'red'} />
                </div>
                <p className={styles.subTitle}>TUS FUNCIONES</p>
                <div className={styles.content}>
                    <Dato label="Rol" value={usuario?.rol || 'N/A'} />
                </div>
                <p className={styles.subTitle}>TUS PERMISOS</p>
                <div className={styles.content}>
                    <Dato
                        label="Eliminación"
                        value={permisos.eliminar ? 'Permitido' : 'Denegado'}
                    />
                    <Dato
                        label="Creación"
                        value={permisos.crear ? 'Permitido' : 'Denegado'}
                    />
                    <Dato
                        label="Edición"
                        value={permisos.editar ? 'Permitido' : 'Denegado'}
                    />
                    <Dato
                        label="Anulación"
                        value={permisos.anular ? 'Permitido' : 'Denegado'}
                    />
                </div>
                <p className={styles.subTitle}>PLUGINS HABILITADOS</p>
                <div className={styles.content}>
                    {plugins.map((plugin, index) => (
                        <Dato
                            key={index}
                            label={`Plugin ${index + 1}`}
                            value={plugin}
                        />
                    ))}
                    {plugins.length === 0 && (
                        <Dato label="Plugins" value="No hay plugins habilitados" />
                    )}
                </div>
            </div>

            {/* Modal de Edición de Permisos */}
            <EditarPersona isOpen={isEditOpen} setIsOpen={setIsEditOpen} usuario={usuario} />

            {/*Modal de Historial de acciones del usuario*/}
            <HistoriaPersona isOpen={isHistoryOpen} setIsOpen={setIsHistoryOpen} usuario={usuario} />
        </View>
    );
}
export default VerUsuario;