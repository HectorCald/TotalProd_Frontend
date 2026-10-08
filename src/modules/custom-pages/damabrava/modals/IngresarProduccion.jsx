import React, { useState, useEffect } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Input from '../../../../components/common/inputs/Input';
import Mensaje from '../../../../components/common/outputs/Mensaje';
import { useToast } from '../../../../context/ToastContext';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import registrosProduccionDamabravaService from '../../../../services/registrosProduccionDamabravaService';

const IngresarProduccion = ({ isOpen, onClose, registro, onIngresar }) => {
    const { showSuccess, showDanger, showWarning } = useToast();

    const [cantidadIngreso, setCantidadIngreso] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const producto = registro?.producto_almacen;
    const cantidadVerificada = registro?.cantidad_verificada || 0;
    const cantidadIngresada = registro?.cantidad_ingresada || 0;
    const cantidadDisponible = Math.max(0, cantidadVerificada - cantidadIngresada);
    const responsable = registro?.user?.name || registro?.personal?.name || 'Usuario desconocido';

    useEffect(() => {
        if (isOpen) {
            setCantidadIngreso(cantidadDisponible.toString());
            setErrors({});
            setIsSubmitting(false);
        }
    }, [isOpen, cantidadDisponible]);

    const handleConfirm = async () => {
        const cantidad = parseInt(cantidadIngreso) || 0;

        if (!cantidadIngreso || cantidad <= 0) {
            setErrors({ cantidad: 'Debes ingresar una cantidad válida mayor a 0' });
            return;
        }

        if (cantidad > cantidadDisponible) {
            setErrors({ cantidad: `No puedes ingresar más de ${cantidadDisponible} unidades disponibles` });
            return;
        }

        if (!registro?.id || !producto?.id) {
            showWarning('Advertencia', 'Faltan datos del registro o del producto para realizar el ingreso');
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        try {
            // Preparar datos del movimiento de entrada
            const movimientoData = {
                type: 'entrada',
                observaciones: `Ingreso desde producción (${responsable})`,
                precio_id: null,
                metodo_pago: null,
                cliente_id: null,
                proveedor_id: null,
                restar_ingredientes: false,
                produccion_damabrava_id: registro.id,
                productos: [{
                    id: producto.id,
                    cantidad: cantidad,
                    precio: 0
                }]
            };

            const response = await movimientosAlmacenService.create(movimientoData);

            if (response.success) {
                const nuevaCantidadIngresada = cantidadIngresada + cantidad;
                const updateResponse = await registrosProduccionDamabravaService.updateCantidadIngresada(
                    registro.id,
                    nuevaCantidadIngresada
                );

                if (updateResponse.success) {
                    const registroCompleto = nuevaCantidadIngresada >= cantidadVerificada;
                    showSuccess('Ingreso realizado', registroCompleto
                        ? 'Ingreso completado. El registro cambió a estado: Ingresado'
                        : 'Ingreso de producción parcial realizado correctamente'
                    );

                    if (onIngresar) {
                        onIngresar({ ...registro, ...updateResponse.data });
                    }
                    onClose(true);
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
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        onClose();
    };

    if (!registro && isOpen) return null;

    const cantidad = parseInt(cantidadIngreso) || 0;
    const agrupacion = producto?.grup || 1;
    const grupos = cantidad > 0 ? Math.floor(cantidad / agrupacion) : 0;
    const unidadesSueltas = cantidad > 0 ? cantidad % agrupacion : 0;

    let textoEquivalencia = '';
    if (grupos > 0) textoEquivalencia += `${grupos} grupo${grupos > 1 ? 's' : ''}`;
    if (unidadesSueltas > 0) {
        if (textoEquivalencia) textoEquivalencia += ', ';
        textoEquivalencia += `${unidadesSueltas} unidad${unidadesSueltas > 1 ? 'es' : ''}`;
    }
    if (!textoEquivalencia) textoEquivalencia = '0 unidades';

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Ingreso de Producción"
            confirmText="Realizar Ingreso"
            onConfirm={handleConfirm}
            loading={isSubmitting}
            disableClose={isSubmitting}
            contentStyle={{ paddingBlock: 0 }}
        >
            <div style={{ display: 'flex', paddingBlock: '12px', flexDirection: 'column', gap: '20px', pointerEvents: isSubmitting ? 'none' : 'auto', opacity: isSubmitting ? 0.7 : 1 }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--quaternary-color)' }}>
                    <span style={{ fontSize: '14px', color: 'var(--secondary-color)' }}>Cantidad Disponible:</span>
                    <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{cantidadDisponible} ud.</span>
                </div>

                <Input
                    tipo="number"
                    label="Cantidad a Ingresar"
                    value={cantidadIngreso}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (parseInt(val) < 0) return;
                        setCantidadIngreso(val);
                        setErrors(prev => ({ ...prev, cantidad: null }));
                    }}
                    error={errors.cantidad}
                />

                {cantidadIngreso !== '' && cantidad > 0 && (
                    <Mensaje
                        type="info"
                        title="Equivalencia"
                        message={`El producto se agrupa de ${agrupacion} en ${agrupacion}. Estás ingresando: ${textoEquivalencia}.`}
                    />
                )}
            </div>
        </ModalCentro >
    );
};

export default IngresarProduccion;
