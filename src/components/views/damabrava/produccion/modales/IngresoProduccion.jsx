import React, { useState, useEffect } from 'react';
import styles from '../../../../../styles/view.module.css';
import ViewModal from '../../../../ui/ViewModal';
import HeaderModal from '../../../../common/HeaderModal';
import Dato from '../../../../common/Dato';
import Input from '../../../../common/inputs/Input';
import Boton from '../../../../common/Boton';
import { useToast } from '../../../../../context/ToastContext';
import movimientosAlmacenService from '../../../../../services/movimientosAlmacenService';
import registrosProduccionDamabravaService from '../../../../../services/registrosProduccionDamabravaService';

function IngresoProduccion({ isOpen, setIsOpen, producto, cantidadVerificada, cantidadIngresada = 0, registroId, responsable, onIngresoRealizado }) {
    const { showSuccess, showDanger, showWarning } = useToast();
    const [cantidadIngreso, setCantidadIngreso] = useState('');
    const [grupos, setGrupos] = useState(0);
    const [unidadesSueltas, setUnidadesSueltas] = useState(0);
    const [loading, setLoading] = useState(false);

    // Calcular grupos y unidades sueltas
    useEffect(() => {
        if (cantidadIngreso && producto) {
            const cantidad = parseInt(cantidadIngreso) || 0;
            const agrupacion = producto.grup || 1; // Si grup es null, usar 1 por defecto

            if (cantidad > 0) {
                const gruposCalculados = Math.floor(cantidad / agrupacion);
                const unidadesSueltasCalculadas = cantidad % agrupacion;

                setGrupos(gruposCalculados);
                setUnidadesSueltas(unidadesSueltasCalculadas);
            } else {
                setGrupos(0);
                setUnidadesSueltas(0);
            }
        } else {
            setGrupos(0);
            setUnidadesSueltas(0);
        }
    }, [cantidadIngreso, producto]);

    // Calcular cantidad disponible para ingresar
    const cantidadDisponible = cantidadVerificada - cantidadIngresada;

    // Validar cantidad de ingreso
    const handleCantidadChange = (e) => {
        const valor = e.target.value;
        const cantidad = parseInt(valor) || 0;

        // No permitir valores negativos
        if (cantidad < 0) {
            return;
        }

        // No permitir más de la cantidad disponible
        if (cantidad > cantidadDisponible) {
            showWarning('Advertencia', `No puedes ingresar más de ${cantidadDisponible} unidades disponibles`);
            return;
        }

        setCantidadIngreso(valor);
    };

    // Formatear texto de grupos y unidades
    const formatearGruposUnidades = () => {
        if (grupos === 0 && unidadesSueltas === 0) {
            return '0 unidades';
        }

        let texto = '';

        if (grupos > 0) {
            texto += `${grupos} grupo${grupos > 1 ? 's' : ''}`;
        }

        if (unidadesSueltas > 0) {
            if (texto) texto += ', ';
            texto += `${unidadesSueltas} unidad${unidadesSueltas > 1 ? 'es' : ''}`;
        }

        return texto;
    };

    // Manejar el ingreso de producción
    const handleRealizarIngreso = async () => {
        // Validaciones
        if (!cantidadIngreso || parseInt(cantidadIngreso) <= 0) {
            showWarning('Advertencia', 'Debes ingresar una cantidad válida');
            return;
        }

        if (parseInt(cantidadIngreso) > cantidadDisponible) {
            showWarning('Advertencia', 'No puedes ingresar más de la cantidad disponible');
            return;
        }

        if (!registroId) {
            showWarning('Advertencia', 'No se encontró el ID del registro de producción');
            return;
        }

        setLoading(true);
        try {
            // NO restar ingredientes porque ya se restaron al registrar la producción
            // Los ingredientes ya fueron consumidos al crear el registro de producción

            // Preparar datos del movimiento de entrada
            const movimientoData = {
                type: 'entrada',
                observaciones: `Ingreso desde producción (${responsable || 'Usuario desconocido'})`,
                precio_id: null, // Será manejado por el backend con un precio por defecto
                metodo_pago: null,
                cliente_id: null,
                proveedor_id: null,
                restar_ingredientes: false, // NO restar ingredientes (ya se restaron al registrar)
                produccion_damabrava_id: registroId, // ID del registro de producción de Damabrava
                productos: [{
                    id: producto.id,
                    cantidad: parseInt(cantidadIngreso),
                    precio: 0 // Precio 0 para ingresos de producción
                }]
            };


            // Crear el movimiento de entrada
            const response = await movimientosAlmacenService.create(movimientoData);

            if (response.success) {
                // Actualizar la cantidad ingresada en el registro de producción
                const nuevaCantidadIngresada = cantidadIngresada + parseInt(cantidadIngreso);
                const updateResponse = await registrosProduccionDamabravaService.updateCantidadIngresada(
                    registroId, 
                    nuevaCantidadIngresada
                );

                if (updateResponse.success) {
                    // Verificar si el registro está completo (cantidad_ingresada = cantidad_verificada)
                    const registroCompleto = nuevaCantidadIngresada >= cantidadVerificada;
                    const estadoFinal = registroCompleto ? 'Ingresado' : 'verificado';
                    
                    showSuccess('Ingreso realizado', registroCompleto
                        ? `Ingreso completado. El registro cambió a estado: ${estadoFinal}`
                        : 'Ingreso de producción realizado correctamente');

                    // Notificar al componente padre sobre el ingreso realizado
                    if (onIngresoRealizado) {
                        onIngresoRealizado({
                            cantidadIngresada: parseInt(cantidadIngreso),
                            nuevaCantidadIngresadaTotal: nuevaCantidadIngresada,
                            movimientoId: response.data.id,
                            registroCompleto: registroCompleto,
                            nuevoEstado: estadoFinal,
                            registroActualizado: updateResponse.data
                        });
                    }

                    // Limpiar campos y cerrar modal
                    setCantidadIngreso('');
                    setIsOpen(false);
                } else {
                    showDanger('Error', `Movimiento creado, pero error al actualizar registro: ${updateResponse.message}`);
                }
            } else {
                showWarning('Advertencia', response.message || 'Error al crear el movimiento de entrada');
            }

        } catch (error) {
            console.error('Error realizando ingreso:', error);
            showDanger('Error', error.message || 'Error al realizar el ingreso de producción');
        } finally {
            setLoading(false);
        }
    };

    // Limpiar campos cuando se cierra el modal
    const handleClose = () => {
        setCantidadIngreso('');
        setIsOpen(false);
    };

    return (
        <>
            <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
                <HeaderModal
                    title="Ingreso de Producción"
                    onClose={handleClose}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Información del ingreso:</p>

                    {/* Información del producto */}
                    {producto && (
                        <div className={styles.content}>
                            <Dato
                                label="Producto"
                                value={producto.name || 'Sin nombre'}
                                vertical={false}
                            />
                            <Dato
                                label="Agrupación"
                                value={`${producto.grup || 1} unidades por grupo`}
                                vertical={false}
                            />
                            <Dato
                                label="Cantidad Verificada"
                                value={`${cantidadVerificada} unidades`}
                                vertical={false}
                                especial="green"
                            />
                            {cantidadIngresada > 0 && (
                                <Dato
                                    label="Cantidad Ya Ingresada"
                                    value={`${cantidadIngresada} unidades`}
                                    vertical={false}
                                    especial="orange"
                                />
                            )}
                            <Dato
                                label="Cantidad Disponible"
                                value={`${cantidadDisponible} unidades`}
                                vertical={false}
                                especial="blue"
                            />
                            {/* Mostrar cálculo de grupos y unidades */}
                            {cantidadIngreso && parseInt(cantidadIngreso) > 0 && (
                                <Dato
                                    label="Equivalencia"
                                    value={formatearGruposUnidades()}
                                    vertical={false}
                                    especial="blue"
                                />
                            )}
                        </div>
                    )}

                    {/* Input para cantidad de ingreso */}
                    <Input
                        tipo="number"
                        label="Cantidad a Ingresar"
                        value={cantidadIngreso}
                        onChange={handleCantidadChange}
                        readOnly={loading}
                    />

                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={handleClose}
                        />
                        <Boton
                            className='btn-original'
                            label='Realizar Ingreso'
                            style={{ marginTop: 'auto' }}
                            onClick={handleRealizarIngreso}
                            loading={loading}
                        />
                    </div>
                </div>
            </ViewModal>

        </>
    );
}

export default IngresoProduccion;
