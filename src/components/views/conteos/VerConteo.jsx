import React, { useMemo, useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/old/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/old/ItemView';
import Dato from '../../common/old/Dato';
import Boton from '../../common/botones/Boton';
import { useLayout } from '../../../context/LayoutContext';
import conteosService from '../../../services/conteosService';
import { useToast } from '../../../context/ToastContext';
import ModalEliminarConteo from './modales/ModalEliminarConteo';
import ModalReemplazarConteo from './modales/ModalReemplazarConteo';
import ModalProductos from './modales/ModalProductos';
import AlmacenGeneralAuxiliar from '../almacen-general-auxiliar/AlmacenGeneral-Auxiliar';
import AlmacenAcopioAuxiliar from '../almacen-acopio-auxiliar/AlmacenAcopio-Auxiliar';
import { BoxIcon } from 'boxicons-react';
import DescargaConteoBuilder from './DescargaConteoBuilder';
import { formatFechaLiteral, formatHoraSinSegundos } from '../../../utils/dateUtils';
import StatusBadge from '../../common/old/StatusBadge';

function VerConteo({ isOpen, setIsOpen, conteo, onConteoDeleted, onConteoReplaced }) {
    const { isLargeScreen } = useLayout();
    const { showDanger } = useToast();
    const [detalles, setDetalles] = useState([]);
    const tipoNombre = conteo?.tipo === 'almacen' ? 'Almacén' : 'Materia Prima';
    const fechaLocal = formatFechaLiteral(conteo?.fecha, !isLargeScreen);
    const horaLocal = formatHoraSinSegundos(conteo?.fecha);
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);

    // Estados para modales
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isReemplazarOpen, setIsReemplazarOpen] = useState(false);

    // Resetear detalles cuando cambia el conteo
    useEffect(() => {
        if (conteo?.id) {
            setDetalles([]);
        }
    }, [conteo?.id]);


    // Estado para abrir almacén en modo conteo
    const [isAlmacenOpen, setIsAlmacenOpen] = useState(false);



    const handleRepetirConteo = async () => {
        if (!conteo) return;

        try {
            // Cargar detalles antes de repetir si no están cargados
            if (detalles.length === 0) {
                const resp = await conteosService.getDetalles(conteo.id);
                if (resp.success) {
                    setDetalles(resp.data || []);
                } else {
                    showDanger('Error', 'Error al cargar detalles del conteo');
                    return;
                }
            }

            if (detalles.length === 0) {
                showDanger('Error', 'El conteo no tiene detalles');
                return;
            }
            const isAlmacen = conteo.tipo === 'almacen';
            const storageKey = isAlmacen ? 'conteo_almacen_inputs' : 'conteo_acopio_inputs';


            // Preparar datos según el tipo de conteo
            let savedData = {};

            if (isAlmacen) {
                // Para almacén: guardar stockInputs, groupInputs, stockInputsText, groupInputsText
                const stockInputs = {};
                const groupInputs = {};
                const stockInputsText = {};
                const groupInputsText = {};

                detalles.forEach(detalle => {
                    if (detalle.producto_almacen?.id) {
                        const fisico = Number(detalle.fisico || 0);
                        const grup = Number(detalle.producto_almacen?.grup || 0);
                        const grupos = grup > 0 ? Math.floor(fisico / grup) : 0;
                        const productoId = detalle.producto_almacen.id;

                        stockInputs[productoId] = fisico;
                        stockInputsText[productoId] = String(fisico);

                        if (grup > 0) {
                            groupInputs[productoId] = grupos;
                            groupInputsText[productoId] = String(grupos);
                        }

                    }
                });

                savedData = {
                    stockInputs,
                    groupInputs,
                    stockInputsText,
                    groupInputsText,
                    timestamp: Date.now()
                };
            } else {
                // Para acopio: guardar quantityInputs, quantityInputsText, justificationInputsText
                const quantityInputs = {};
                const quantityInputsText = {};
                const justificationInputsText = {};

                detalles.forEach(detalle => {
                    if (detalle.producto_acopio?.id) {
                        const fisico = Number(detalle.fisico || 0);
                        const productoId = detalle.producto_acopio.id;

                        quantityInputs[productoId] = fisico;
                        // Guardar texto con dos decimales para coincidir con la UI
                        quantityInputsText[productoId] = Number.isFinite(fisico) ? fisico.toFixed(2) : '0.00';
                        justificationInputsText[productoId] = detalle.justificacion || '';

                    }
                });

                savedData = {
                    quantityInputs,
                    quantityInputsText,
                    justificationInputsText,
                    timestamp: Date.now()
                };
            }

            // Guardar en localStorage
            localStorage.setItem(storageKey, JSON.stringify(savedData));

            // Marcar que se está repitiendo un conteo
            localStorage.setItem('isRepeatingConteo', 'true');

            // Abrir almacén dentro de esta vista
            setIsAlmacenOpen(true);

        } catch (error) {
            console.error('Error al repetir conteo:', error);
            showDanger('Error', 'Error al cargar datos del conteo');
        }
    };


    return (
        <>
            <View isOpen={isOpen} setIsOpen={setIsOpen}>
                <HeaderView onBack={() => setIsOpen(false)} />
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.headerContent}>
                            <h1 className={styles.title}> {conteo?.codigo || 'Detalles'}</h1>
                            <p className={styles.subTitle}> Registrado el {formatFechaLiteral(conteo?.fecha, !isLargeScreen) + ' - ' + formatHoraSinSegundos(conteo?.fecha)}</p>
                        </div>
                        <div className={styles.iconButton}>
                            <Boton
                                iconName='download'
                                label='Descargar'
                                className='btn-default'
                                onClick={() => setIsDescargaOpen(true)}
                                hideTextOnMobile={true}
                            />
                        </div>
                    </div>
                    <div className={styles.contentRow}>
                        <div className={styles.contentHalf}>
                            <div className={styles.content}>
                                <ItemView
                                    title="Información del Conteo"
                                    transparent={true}
                                    icon="user"
                                    iconShape="square"
                                    style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                                />
                                <Dato
                                    label="Responsable del conteo"
                                    value={conteo?.user?.name || conteo?.personal?.name || 'Usuario desconocido'}
                                    vertical={false}
                                />
                            </div>
                            {(conteo?.detalles_count || 0) > 0 && (
                                <Boton
                                    className='btn-gray'
                                    label={`Lista de Productos`}
                                    onClick={() => setIsProductosOpen(true)}
                                />
                            )}

                        </div>
                    </div>

                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Repetir Conteo'
                            style={{ marginTop: 'auto' }}
                            onClick={handleRepetirConteo}
                            iconName='repeat'
                            hideTextOnMobile={true}
                        />
                        <Boton
                            className='btn-gray'
                            label={conteo?.tipo === 'acopio' ? 'Reemplazar Stock Acopio' : 'Reemplazar Stock Almacén'}
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsReemplazarOpen(true)}
                            iconName='box'
                            hideTextOnMobile={true}
                        />
                        <Boton
                            className='btn-red'
                            label='Eliminar Conteo'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsEliminarOpen(true)}
                            iconName='trash'
                            hideTextOnMobile={true}
                        />
                    </div>
                </div>

                {/* Modal de productos del conteo */}
                <ModalProductos
                    isOpen={isProductosOpen}
                    setIsOpen={setIsProductosOpen}
                    conteo={conteo}
                    detalles={detalles}
                    setDetalles={setDetalles}
                />

                {/* Modal de eliminar conteo */}
                <ModalEliminarConteo
                    isOpen={isEliminarOpen}
                    setIsOpen={setIsEliminarOpen}
                    conteo={conteo}
                    onConteoDeleted={onConteoDeleted}
                    onClose={() => setIsOpen(false)}
                />

                {/* Modal de reemplazar conteo */}
                <ModalReemplazarConteo
                    isOpen={isReemplazarOpen}
                    setIsOpen={setIsReemplazarOpen}
                    conteo={conteo}
                    detalles={detalles}
                    setDetalles={setDetalles}
                    onConteoReplaced={onConteoReplaced}
                />

                {/* Modal de descarga - para ambos tipos de conteo */}
                <DescargaConteoBuilder
                    isOpen={isDescargaOpen}
                    setIsOpen={setIsDescargaOpen}
                    conteo={conteo}
                    detalles={detalles}
                />

            </View>
            {/* Componentes de almacén para repetir conteo */}
            {conteo?.tipo === 'almacen' && (
                <AlmacenGeneralAuxiliar
                    isOpen={isAlmacenOpen}
                    setIsOpen={setIsAlmacenOpen}
                    tipo="conteo"
                />
            )}
            {conteo?.tipo === 'acopio' && (
                <AlmacenAcopioAuxiliar
                    isOpen={isAlmacenOpen}
                    setIsOpen={setIsAlmacenOpen}
                    tipo="conteo"
                />
            )}
        </>
    );
}

export default VerConteo;