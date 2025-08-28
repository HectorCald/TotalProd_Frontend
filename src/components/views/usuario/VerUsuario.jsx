import styles from './VerUsuario.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/Dato';


function VerUsuario({ isOpen, setIsOpen, usuario }) {
    
    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Detalles de mi cuenta</h1>
                <p className={styles.subTitle}>INFORMACIÓN PERSONAL</p>
                <div className={styles.content}>
                    <Dato label="Nombre completo" value={usuario.nombre || 'N/A'} />
                    <Dato label="Email" value={usuario.email || 'N/A'} />
                    <Dato label="Teléfono" value={usuario.telefono || '12345678'} />
                </div>
                <p className={styles.subTitle}>TUS FUNCIONES</p>
                <div className={styles.content}>
                    <Dato label="Rol" value={usuario.rol || 'Administrador'} />
                </div>
                <p className={styles.subTitle}>TUS PERMISOS</p>
                <div className={styles.content}>
                    <Dato label="Eliminar" value={usuario.permiso || 'Permitido'} />
                    <Dato label="Creación" value={usuario.permiso || 'Denegado'} />
                    <Dato label="Edición" value={usuario.permiso || 'Denegado'} />
                    <Dato label="Anulación" value={usuario.permiso || 'Permitido'} />
                </div>
                <p className={styles.subTitle}>TUS FUNCIONES EXTRAS</p>
                <div className={styles.content}>
                    <Dato label="Nombre de la función" value={usuario.permiso || 'Tareas'} />
                </div>
            </div>
        </View>
    );
}
export default VerUsuario;