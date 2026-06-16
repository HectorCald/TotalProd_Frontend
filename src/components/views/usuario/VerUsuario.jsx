import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/old/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/old/Dato';
import ItemView from '../../common/old/ItemView';
import Notification from '../../common/old/Notification';
import ImagenEmpresa from './ImagenEmpresa';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';
import { useState, useEffect } from 'react';

function VerUsuario({ isOpen, setIsOpen }) {
    const { user: userInfo, sucursalSeleccionada: userSucursal } = useUser();
    const { employee: employeeInfo, sucursalSeleccionada: employeeSucursal } = useEmployee();
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });
    const [isOpenImagenEmpresa, setIsOpenImagenEmpresa] = useState(false);

    // Determinar si es usuario normal o empleado
    const isEmployee = !!employeeInfo;
    const usuario = isEmployee ? employeeInfo : userInfo;
    const sucursal = isEmployee ? employeeSucursal : userSucursal;

    // Obtener nombre de la empresa
    const nombreEmpresa = sucursal?.empresas?.name || 'N/A';
    
    // Obtener tipo de app
    const getTipoApp = () => {
        if (isEmployee) {
            // Para empleados, obtener el tipo desde la sucursal
            const tipo = sucursal?.empresas?.tipo;
            if (tipo === 'ventas') return 'Ventas';
            if (tipo === 'ventas_produccion') return 'Ventas y Producción';
            return 'N/A';
        } else {
            // Para usuarios, obtener el tipo desde el user
            const tipo = userInfo?.empresa?.tipo;
            if (tipo === 'ventas') return 'Ventas';
            if (tipo === 'ventas_produccion') return 'Ventas y Producción';
            return 'N/A';
        }
    };
    
    const tipoApp = getTipoApp();
    
    // Obtener la imagen a mostrar - usar directamente del contexto
    const displayImage = usuario?.logo_tipo || sucursal?.empresas?.logo_tipo;
    
    
    // Función para manejar la edición de imagen
    const handleImagenEmpresa = () => {
        setIsOpenImagenEmpresa(true);
    };
    
    const handleImageChange = (newImage, type, message) => {
        // Mostrar notificación si se proporciona
        if (type && message) {
            mostrarNotificacion(type, message);
        }
    };

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
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                {/* Información del usuario usando ItemView */}
                <div className={styles.content} style={{ padding: '10px', gap: '10px' }}>
                    <ItemView
                        title={nombreCompleto}
                        description={isEmployee ? usuario.codigo || 'Sin código' : usuario.email || 'Sin email'}
                        description2={`${nombreEmpresa}${isEmployee && sucursal ? ` • ${sucursal.name}` : ''}`}
                        circulo={true}
                        transparent={false}
                        style={{ padding: '0px', minHeight: 'auto'}}
                        button={!isEmployee}
                        onButtonClick={!isEmployee ? handleImagenEmpresa : undefined}
                        customIcon={displayImage ? (
                            <div 
                                style={{ 
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '10px',
                                    backgroundImage: `url(${displayImage})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat'
                                }}
                            />
                        ) : undefined}
                        icon={displayImage ? undefined : 'building'}
                    />
                </div>
                <p className={styles.subTitle}>INFORMACIÓN PERSONAL</p>
                <div className={styles.content}>
                    {isEmployee && (
                        <Dato 
                            label="Código de empleado" 
                            value={usuario.codigo || 'N/A'} 
                            icon='copy'
                            onClick={handleCopyCode}
                        />
                    )}
                    {isEmployee && (
                        <Dato 
                            label="Cargo" 
                            value={usuario.cargo || 'N/A'} 
                            icon='briefcase'
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
                    <Dato
                        label="Tipo de aplicación"
                        value={tipoApp}
                    />
                </div>
            </div>

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
            <ImagenEmpresa 
                isOpen={isOpenImagenEmpresa} 
                setIsOpen={setIsOpenImagenEmpresa}
                currentImage={displayImage}
                onImageChange={handleImageChange}
                empresaId={sucursal?.empresas?.id}
            />
        </View>
    );
}

export default VerUsuario;