import styles from './VerUsuario.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/Dato';


function VerUsuario({ isOpen, setIsOpen, usuario }) {
    // Parsear los permisos de JSON string a objeto
    const permisos = usuario.permisos ? JSON.parse(usuario.permisos) : {
        crear: false,
        editar: false,
        eliminar: false,
        anular: false
    };

    // Parsear los plugins de string a array
    const plugins = usuario.plugins ? JSON.parse(usuario.plugins.replace(/'/g, '"')) : [];
    
    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Detalles de mi cuenta</h1>
                <p className={styles.subTitle}>INFORMACIÓN PERSONAL</p>
                <div className={styles.content}>
                    <Dato label="Nombre completo" value={usuario.nombre || 'N/A'} />
                    <Dato label="Email" value={usuario.email || 'N/A'} />
                    <Dato label="Celular" value={usuario.celular || 'N/A'} />
                    <Dato label="Estado" value={usuario.estado? 'Activo':'Inactivo'}  especial={usuario.estado?'green':'red'}/>
                </div>
                <p className={styles.subTitle}>TUS FUNCIONES</p>
                <div className={styles.content}>
                    <Dato label="Rol" value={usuario.rol || 'N/A'} />
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
        </View>
    );
}
export default VerUsuario;