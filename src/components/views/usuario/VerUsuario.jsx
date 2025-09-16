import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/Dato';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';


function VerUsuario({ isOpen, setIsOpen }) {
    const { user: userInfo } = useUser();
    const { employee: employeeInfo } = useEmployee();

    // Determinar si es usuario normal o empleado
    const isEmployee = !!employeeInfo;
    const usuario = isEmployee ? employeeInfo : userInfo;
    
    if (!usuario) {
        return null;
    }
    
    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>{isEmployee ? 'Detalles de mi Cuenta' : 'Detalles de mi Cuenta'}</h1>
                <p className={styles.subTitle}>INFORMACIÓN PERSONAL</p>
                <div className={styles.content}>
                    <Dato 
                        label="Nombre completo" 
                        value={isEmployee ? 
                            `${usuario.first_name} ${usuario.last_name}` : 
                            `${usuario.firstName} ${usuario.lastName}` || 'N/A'
                        } 
                    />
                    {!isEmployee && (
                        <Dato label="Correo electrónico" value={usuario.email || 'N/A'} />
                    )}
                    {isEmployee && (
                        <Dato label="Código de empleado" value={usuario.codigo || 'N/A'} />
                    )}
                    {!isEmployee && (
                        <Dato label="Celular" value={usuario.phone || 'N/A'} />
                    )}
                    <Dato 
                        label="Estado" 
                        value={usuario.is_active ? 'Activo' : 'Inactivo'}  
                        especial={usuario.is_active ? 'green' : 'red'}
                    />
                    {isEmployee && (
                        <Dato 
                            label="Tipo de cuenta" 
                            value="Empleado" 
                            especial="blue"
                        />
                    )}
                </div>
            </div>
        </View>
    );
}
export default VerUsuario;