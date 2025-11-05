import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Select from '../../common/Select';
import Notification from '../../common/Notification';
import SelectorMetodoPago from '../../mixed/SelectorMetodoPago';
import Proveedores from '../proveedores/Proveedores';
import Dato from '../../common/Dato';
import ItemView from '../../common/ItemView';
import Text from '../../common/Text';
import pedidosAcopioService from '../../../services/pedidosAcopioService';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';

function EntregaPedidoAcopio({ isOpen, setIsOpen, pedido, onEntregaRealizada }) {
    const { user } = useUser();
    const { employee } = useEmployee();

    // Función para obtener el nombre del usuario actual
    const getCurrentUserName = () => {
        // Priorizar employee si está disponible
        if (employee) {
            if (employee.firstName && employee.lastName) return `${employee.firstName} ${employee.lastName}`;
            if (employee.first_name) return employee.firstName;
            if (employee.name) return employee.name;
            return 'Empleado';
        }
        // Si no hay employee, usar user
        if (user) {
            if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
            if (user.firstName) return user.firstName;
            if (user.name) return user.name;
            return 'Usuario';
        }
        return 'Usuario';
    };

    const [dataEntrega, setDataEntrega] = useState({
        cantidadEntregada: '',
        unidadEntregada: 'kg',
        cantidadUD: '',
        unidadUD: 'caja',
        proveedor_id: '',
        costo: '',
        transporte_otros: '',
        metodo_pago: '',
        estado_entrega: 'llego',
        observaciones: ''
    });

    const [loading, setLoading] = useState(false);

    // Estados para la notificación
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'error',
        text: ''
    });

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

    // Estados para proveedor
    const [isProveedoresSeleccionOpen, setIsProveedoresSeleccionOpen] = useState(false);
    const [proveedorSeleccionadoData, setProveedorSeleccionadoData] = useState(null);

    // Opciones para los selects de medidas
    const medidasPeso = [
        { value: 'kg', label: 'Kilogramo', icon: 'tag' },
        { value: 'l', label: 'Litro', icon: 'tag' },
        { value: 'ud', label: 'Unidad', icon: 'tag' },
        { value: 'm', label: 'Metro', icon: 'tag' }
    ];

    const medidasUnidad = [
        { value: 'caja', label: 'Caja', icon: 'package' },
        { value: 'bolsa', label: 'Bolsa', icon: 'shopping-bag' },
        { value: 'saco', label: 'Saco', icon: 'package' },
        { value: 'pieza', label: 'Pieza', icon: 'cube-alt' }
    ];

    const estadosEntrega = [
        { value: 'llego', label: 'Llegó', icon: 'check-circle' },
        { value: 'no_llego', label: 'No llegó', icon: 'x-circle' }
    ];

    // Efecto para resetear el formulario
    useEffect(() => {
        if (isOpen) {
            setDataEntrega({
                cantidadEntregada: '',
                unidadEntregada: 'kg',
                cantidadUD: '',
                unidadUD: 'caja',
                proveedor_id: '',
                costo: '',
                transporte_otros: '',
                metodo_pago: '',
                estado_entrega: 'llego',
                observaciones: ''
            });
            setProveedorSeleccionadoData(null);
        }
    }, [isOpen]);

    // Función para actualizar los datos del formulario
    const handleChange = (field, value) => {
        setDataEntrega({ ...dataEntrega, [field]: value });
    };

    // Función para manejar cuando se selecciona un proveedor
    const handleProveedorSeleccionado = (proveedor) => {
        setProveedorSeleccionadoData(proveedor);
        setDataEntrega(prev => ({ ...prev, proveedor_id: proveedor.id }));
        setIsProveedoresSeleccionOpen(false);
    };

    // Función para realizar la entrega
    const handleRealizarEntrega = async () => {
        // Validaciones
        if (!dataEntrega.cantidadEntregada || dataEntrega.cantidadEntregada <= 0) {
            mostrarNotificacion('error', 'La cantidad entregada es obligatoria y debe ser mayor a 0');
            return;
        }

        if (!dataEntrega.cantidadUD || dataEntrega.cantidadUD <= 0) {
            mostrarNotificacion('error', 'La cantidad en unidades es obligatoria y debe ser mayor a 0');
            return;
        }

        if (!dataEntrega.proveedor_id) {
            mostrarNotificacion('error', 'Debe seleccionar un proveedor');
            return;
        }

        if (!dataEntrega.costo || dataEntrega.costo <= 0) {
            mostrarNotificacion('error', 'El costo es obligatorio y debe ser mayor a 0');
            return;
        }

        if (!dataEntrega.metodo_pago || dataEntrega.metodo_pago.trim() === '') {
            mostrarNotificacion('error', 'El método de pago es obligatorio');
            return;
        }

        if (!dataEntrega.estado_entrega) {
            mostrarNotificacion('error', 'El estado de entrega es obligatorio');
            return;
        }

        setLoading(true);

        try {
            // Agregar el nombre del usuario actual a los datos de entrega
            const dataEntregaConUsuario = {
                ...dataEntrega,
                entregado_por: getCurrentUserName()
            };

            const response = await pedidosAcopioService.entregar(pedido.id, dataEntregaConUsuario);

            if (response.success) {
                // Cerrar modal inmediatamente y pasar los datos del pedido actualizado
                setIsOpen(false);
                if (onEntregaRealizada) {
                    onEntregaRealizada(response.data);
                }
                setLoading(false);
            } else {
                mostrarNotificacion('error', response.message || 'Error al realizar la entrega');
                setLoading(false);
            }

        } catch (error) {
            console.error('Error al realizar entrega:', error);
            mostrarNotificacion('error', 'Error al realizar la entrega');
            setLoading(false);
        }
    };

    if (!pedido) return null;

    return (
        <>
            <ViewModal isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
                <HeaderModal
                    title='Entregar Pedido'
                    onClose={() => setIsOpen(false)}
                />

                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>DETALLES DE LA ENTREGA</p>

                    {/* Cantidad entregada con select de medidas */}
                    <div className={styles.content} style={{ flexDirection: 'row', alignItems: 'center', padding: '0px 10px', paddingInline: '0' }}>
                        <InputNormal
                            tipo="number"
                            value={dataEntrega.cantidadEntregada}
                            placeholder='Peso'
                            onChange={(e) => handleChange('cantidadEntregada', e.target.value)}
                            icon='calculator'
                            step="0.01"
                            min="0"
                        />
                        <Select
                            value={dataEntrega.unidadEntregada}
                            onChange={(value) => handleChange('unidadEntregada', value)}
                            options={medidasPeso}
                            placeholder="Medida"
                        />
                    </div>

                    {/* Cantidad en unidades con select de medidas */}
                    <div className={styles.content} style={{ flexDirection: 'row', alignItems: 'center', padding: '0px 10px', paddingInline: '0' }}>
                        <InputNormal
                            tipo="number"
                            value={dataEntrega.cantidadUD}
                            placeholder='Piezas'
                            onChange={(e) => handleChange('cantidadUD', e.target.value)}
                            icon='package'
                            step="1"
                            min="1"
                        />
                        <Select
                            value={dataEntrega.unidadUD}
                            onChange={(value) => handleChange('unidadUD', value)}
                            options={medidasUnidad}
                            placeholder="Medida"
                        />
                    </div>

                    {/* Selector de proveedor */}
                    <Boton
                        className='btn-gray'
                        label={proveedorSeleccionadoData ? 'Proveedor: ' + proveedorSeleccionadoData.name : 'Seleccionar Proveedor (obligatorio)'}
                        onClick={() => setIsProveedoresSeleccionOpen(true)}
                    />

                    {/* Input de costo */}
                    <InputNormal
                        tipo="number"
                        value={dataEntrega.costo}
                        placeholder='Costo (obligatorio)'
                        onChange={(e) => handleChange('costo', e.target.value)}
                        icon='money'
                        step="0.01"
                        min="0"
                    />

                    {/* Input de transporte/otros */}
                    <InputNormal
                        tipo="number"
                        value={dataEntrega.transporte_otros}
                        placeholder='Transporte/Otros'
                        onChange={(e) => handleChange('transporte_otros', e.target.value)}
                        icon='truck'
                        step="0.01"
                        min="0"
                    />

                    {/* Selector de método de pago */}
                    <SelectorMetodoPago
                        value={dataEntrega.metodo_pago}
                        onChange={(value) => handleChange('metodo_pago', value)}
                    />

                    {/* Selector de estado de entrega */}
                    <Select
                        value={dataEntrega.estado_entrega}
                        onChange={(value) => handleChange('estado_entrega', value)}
                        options={estadosEntrega}
                        placeholder="Estado de la entrega"
                        icon='truck'
                    />

                    {/* Input de observaciones */}
                    <InputNormal
                        tipo="text"
                        value={dataEntrega.observaciones}
                        placeholder='Observaciones (opcional)'
                        onChange={(e) => handleChange('observaciones', e.target.value)}
                        icon='comment'
                    />

                    {/* Text informativo sobre gastos */}
                    <div style={{ marginTop: '10px', marginBottom: '10px', width: '100%' }}>
                        <Text type="info" align="left">
                            Al realizar la entrega se van a generar registros de gasto del costo de compra y del transporte si hubiera por separado.
                        </Text>
                    </div>

                    {/* Botón de realizar entrega */}
                    <Boton
                        className='btn-original'
                        label='Realizar Entrega'
                        style={{ marginTop: 'auto' }}
                        onClick={handleRealizarEntrega}
                        loading={loading}
                        disabled={
                            !dataEntrega.cantidadEntregada ||
                            dataEntrega.cantidadEntregada <= 0 ||
                            !dataEntrega.cantidadUD ||
                            dataEntrega.cantidadUD <= 0 ||
                            !dataEntrega.proveedor_id ||
                            !dataEntrega.costo ||
                            dataEntrega.costo <= 0 ||
                            !dataEntrega.metodo_pago ||
                            dataEntrega.metodo_pago.trim() === '' ||
                            !dataEntrega.estado_entrega
                        }
                        // Nota: transporte_otros no es obligatorio, por lo que no se incluye en la validación
                    />
                </div>
                <Notification
                    isVisible={notification.isVisible}
                    type={notification.type}
                    text={notification.text}
                />
                {/* Modal de selección de proveedores */}
                <Proveedores
                    isOpen={isProveedoresSeleccionOpen}
                    setIsOpen={setIsProveedoresSeleccionOpen}
                    modoSeleccion={true}
                    onProveedorSeleccionado={handleProveedorSeleccionado}
                />
            </ViewModal>
        </>
    );
}

export default EntregaPedidoAcopio;
