import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/Dato';
import Notification from '../../common/Notification';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';
import { useState } from 'react';


function VerUsuario({ isOpen, setIsOpen }) {
    const { user: userInfo, sucursalSeleccionada: userSucursal } = useUser();
    const { employee: employeeInfo, sucursalSeleccionada: employeeSucursal } = useEmployee();
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });

    // Determinar si es usuario normal o empleado
    const isEmployee = !!employeeInfo;
    const usuario = isEmployee ? employeeInfo : userInfo;
    const sucursal = isEmployee ? employeeSucursal : userSucursal;

    // Obtener nombre de la empresa
    const nombreEmpresa = sucursal?.empresas?.name || 'N/A';

    if (!usuario) {
        return null;
    }

    // Obtener nombre completo
    const nombreCompleto = isEmployee ?
        `${usuario.first_name} ${usuario.last_name}` :
        `${usuario.firstName} ${usuario.lastName}` || 'N/A';

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
        if (!usuario.codigo) {
            return;
        }

        try {
            await navigator.clipboard.writeText(usuario.codigo);
            mostrarNotificacion('success', 'Código copiado al portapapeles');
        } catch (error) {
            console.error('Error al copiar:', error);
            mostrarNotificacion('error', 'Error al copiar el código');
        }
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>{nombreCompleto}</h1>
                <p className={styles.subTitle}>INFORMACIÓN PERSONAL</p>
                <div className={styles.content}>
                    {!isEmployee && (
                        <Dato label="Correo electrónico" value={usuario.email || 'N/A'} />
                    )}
                    {isEmployee && (
                        <Dato 
                            label="Código de empleado" 
                            value={usuario.codigo || 'N/A'} 
                            icon='copy'
                            onClick={handleCopyCode}
                        />
                    )}
                    <Dato label="Celular" value={usuario.phone || 'N/A'} icon='phone' />

                    <Dato
                        label="Estado"
                        value={usuario.is_active ? 'Activo' : 'Inactivo'}
                        especial={usuario.is_active ? 'green' : 'red'}
                    />
                    <Dato
                        label="Tipo de cuenta"
                        value={isEmployee ? "Empleado" : "Propietario"}
                    />
                    <Dato
                        label="Empresa"
                        value={nombreEmpresa}
                    />
                    {isEmployee && sucursal && (
                        <Dato
                            label="Sucursal asignada"
                            value={sucursal.name || 'N/A'}
                        />
                    )}
                </div>
            </div>

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}
export default VerUsuario;