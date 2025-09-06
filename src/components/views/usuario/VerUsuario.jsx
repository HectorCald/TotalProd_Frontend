import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/Dato';
import { useUser } from '../../../context/UserContext';


function VerUsuario({ isOpen, setIsOpen }) {
    const { user: usuario } = useUser();
    
    if (!usuario) {
        return null;
    }
    
    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Detalles de mi Cuenta</h1>
                <p className={styles.subTitle}>INFORMACIÓN PERSONAL</p>
                <div className={styles.content}>
                    <Dato label="Nombre completo" value={usuario.firstName + ' ' + usuario.lastName || 'N/A'} />
                    <Dato label="Correo electrónico" value={usuario.email || 'N/A'} />
                    <Dato label="Celular" value={usuario.phone || 'N/A'} />
                    <Dato label="Estado" value={usuario.is_active? 'Activo':'Inactivo'}  especial={usuario.is_active?'green':'red'}/>
                </div>
            </div>
        </View>
    );
}
export default VerUsuario;