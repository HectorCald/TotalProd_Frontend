import React, { useMemo, useState } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import Dato from '../../common/Dato';
import Boton from '../../common/Boton';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import { useLayout } from '../../../context/LayoutContext';
import ModalTable from '../../common/ModalTable';
import conteosService from '../../../services/conteosService';
import Notification from '../../common/Notification';
import AlmacenGeneralAuxiliar from '../almacen-general-auxiliar/AlmacenGeneral-Auxiliar';
import AlmacenAcopioAuxiliar from '../almacen-acopio-auxiliar/AlmacenAcopio-Auxiliar';
import Select from '../../common/Select';
import NoData from '../../common/NoData';
import Text from '../../common/Text';

function VerConteo({ isOpen, setIsOpen, conteo, onConteoDeleted, onConteoReplaced }) {
    const { isLargeScreen } = useLayout();
    const detalles = conteo?.detalles || [];
    const tipoNombre = conteo?.tipo === 'almacen' ? 'Almacén' : 'Materia Prima';
    const fechaObj = conteo ? new Date(conteo.fecha) : null;
    const fechaLocal = fechaObj ? fechaObj.toLocaleDateString() : '--';
    const horaLocal = fechaObj ? fechaObj.toLocaleTimeString() : '--';
    const [isProductosOpen, setIsProductosOpen] = useState(false);
    // Filtros de modal (desktop)
    const [filtroFisico, setFiltroFisico] = useState('todos'); // igual | mayor | menor | todos

    // Filtros para móvil
    const [filtroMovil, setFiltroMovil] = useState('todos'); // igual | mayor | menor | todos

    // Estados para eliminación y reemplazo
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [isReplacing, setIsReplacing] = useState(false);
    const [isReemplazarOpen, setIsReemplazarOpen] = useState(false);
    // Estados para la notificación
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
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

    // Estado para abrir almacén en modo conteo
    const [isAlmacenOpen, setIsAlmacenOpen] = useState(false);

    // Filas preparadas para ModalTable (siempre calculadas para no violar reglas de hooks)
    const rowsMemo = useMemo(() => (detalles || [])
        .sort((a, b) => {
            const isAlmacen = conteo?.tipo === 'almacen';
            const nombreA = isAlmacen ? (a.producto_almacen?.name || '') : (a.producto_acopio?.name || '');
            const nombreB = isAlmacen ? (b.producto_almacen?.name || '') : (b.producto_acopio?.name || '');
            return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
        })
        .map((d) => {
            const isAlmacen = conteo?.tipo === 'almacen';
            const nombreProducto = isAlmacen ? (d.producto_almacen?.name || 'Producto') : (d.producto_acopio?.name || 'Producto');
            const medidaCode = !isAlmacen ? (d.producto_acopio?.type_measure?.code || '') : '';
            const grup = isAlmacen ? (d.producto_almacen?.grup || 0) : 0;
            const sistema = Number(d.sistema ?? 0);
            const fisico = Number(d.fisico ?? 0);
            if (isAlmacen) {
                const sysG = grup > 0 ? Math.floor(sistema / grup) : 0;
                const sysU = grup > 0 ? (sistema % grup) : 0;
                const fisG = grup > 0 ? Math.floor(fisico / grup) : 0;
                const fisU = grup > 0 ? (fisico % grup) : 0;
                const fmt = (g, u) => {
                    if (grup <= 0) return '--';
                    if (u > 0) return `${g} g. ${u} u.`;
                    return `${g} g.`;
                };
                return [
                    nombreProducto,
                    `${sistema} ud`,
                    `${fisico} ud`,
                    grup > 0 ? fmt(sysG, sysU) : '--',
                    grup > 0 ? fmt(fisG, fisU) : '--'
                ];
            }
            return [
                nombreProducto,
                `${Number(sistema).toFixed(2)}${medidaCode ? ` ${medidaCode}` : ''}`,
                `${Number(fisico).toFixed(2)}${medidaCode ? ` ${medidaCode}` : ''}`,
                medidaCode || '--',
                d.justificacion || ''
            ];
        })
        .filter((row) => {
            const isAlmacen = conteo?.tipo === 'almacen';
            if (filtroFisico !== 'todos') {
                const sistema = parseFloat(String(row[1]).replace(/[^0-9.]/g, '')) || 0;
                const fisico = parseFloat(String(row[2]).replace(/[^0-9.]/g, '')) || 0;
                const rel = fisico === sistema ? 0 : (fisico > sistema ? 1 : -1);
                if ((filtroFisico === 'igual' && rel !== 0) || (filtroFisico === 'mayor' && rel <= 0) || (filtroFisico === 'menor' && rel >= 0)) return false;
            }
            return true;
        }), [detalles, conteo, filtroFisico]);

    const filtersConfig = useMemo(() => {
        const opts = [
            { value: 'todos', label: 'Todos' },
            { value: 'igual', label: 'Azul' },
            { value: 'mayor', label: 'Verde' },
            { value: 'menor', label: 'Rojo' }
        ];
        return {
            2: { value: filtroFisico, onChange: setFiltroFisico, options: opts }
        };
    }, [filtroFisico]);

    // Opciones para el Select de móvil
    const filtroOptions = [
        { value: 'todos', label: 'Todos' },
        { value: 'igual', label: 'Azul' },
        { value: 'mayor', label: 'Verde' },
        { value: 'menor', label: 'Rojo' }
    ];

    // Función para filtrar detalles en móvil
    const detallesFiltrados = useMemo(() => {
        if (filtroMovil === 'todos') return detalles;

        return detalles.filter(detalle => {
            const sistema = Number(detalle.sistema ?? 0);
            const fisico = Number(detalle.fisico ?? 0);

            if (filtroMovil === 'igual') return fisico === sistema;
            if (filtroMovil === 'mayor') return fisico > sistema;
            if (filtroMovil === 'menor') return fisico < sistema;

            return true;
        });
    }, [detalles, filtroMovil]);

    const handleDeleteConteo = async () => {
        if (!conteo?.id) return;

        setIsDeleting(true);
        try {
            const result = await conteosService.delete(conteo.id);
            if (result.success) {
                // Cerrar modales y notificar al componente padre inmediatamente
                setIsEliminarOpen(false);
                setIsOpen(false);
                if (onConteoDeleted) {
                    onConteoDeleted(conteo.id);
                }
            } else {
                mostrarNotificacion('error', result.message);
            }
        } catch (error) {
            mostrarNotificacion('error', 'Error al eliminar el conteo');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleReemplazarConteo = async () => {
        if (!conteo?.id) return;
        setIsReplacing(true);
        try {
            let result;
            // Usar el método correcto según el tipo de conteo
            if (conteo.tipo === 'acopio') {
                result = await conteosService.replaceAcopio(conteo.id);
            } else {
                result = await conteosService.replace(conteo.id);
            }

            if (result.success) {
                // Cerrar modal de confirmación inmediatamente
                setIsReemplazarOpen(false);
                if (onConteoReplaced) {
                    onConteoReplaced(conteo.id);
                }
            } else {
                mostrarNotificacion('error', result.message);
            }
        } catch (error) {
            mostrarNotificacion('error', 'Error al reemplazar stock');
        } finally {
            setIsReplacing(false);
        }
    };

    const handleRepetirConteo = () => {
        if (!conteo || !detalles.length) return;

        try {
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
            mostrarNotificacion('error', 'Error al cargar datos del conteo');
        }
    };
    return (
        <>
            <View isOpen={isOpen} setIsOpen={setIsOpen}>
                <HeaderView onBack={() => setIsOpen(false)} />
                <div className={styles.container}>
                    <h1 className={styles.title}>Conteo • {tipoNombre}</h1>
                    <div className={styles.content}>
                        <Dato label="Tipo" value={tipoNombre} vertical={false} />
                        <Dato label="Fecha" value={fechaLocal} vertical={false} />
                        <Dato label="Hora" value={horaLocal} vertical={false} />
                    </div>
                    {detalles.length > 0 && (

                        <Boton
                            className='btn-gray'
                            label={`Productos (${detalles.length})`}
                            onClick={() => setIsProductosOpen(true)}
                        />

                    )}

                    <div className={styles.buttons}>
                        <Boton
                            className='btn-red'
                            label='Eliminar Conteo'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsEliminarOpen(true)}
                        />
                        <Boton
                            className='btn-orange'
                            label={conteo?.tipo === 'acopio' ? 'Reemplazar Stock Acopio' : 'Reemplazar Stock Almacén'}
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsReemplazarOpen(true)}
                        />
                        <Boton
                            className='btn-blue'
                            label='Repetir Conteo'
                            style={{ marginTop: 'auto' }}
                            onClick={handleRepetirConteo}
                        />
                    </div>
                    {conteo?.observaciones && (
                        <div className={styles.content}>
                            <Dato label="Observaciones" value={conteo.observaciones} vertical={true} />
                        </div>
                    )}
                </div>

                {/* Modal de productos del conteo */}
                {isLargeScreen ? (
                    <ModalTable
                        isOpen={isProductosOpen}
                        title="Productos del Conteo"
                        headers={conteo?.tipo === 'almacen' ? ['Producto', 'Sistema', 'Físico', 'Stock grup sist.', 'Stock grup fís.'] : ['Producto', 'Sistema', 'Físico', 'Medida', 'Justificación']}
                        rows={rowsMemo}
                        filters={filtersConfig}
                        columnWidths={conteo?.tipo === 'almacen' ? {
                            0: '25%', // Producto
                            1: '15%', // Sistema
                            2: '15%', // Físico
                            3: '20%', // Stock grup sist.
                            4: '20%'  // Stock grup fís.
                        } : {
                            0: '25%', // Producto
                            1: '12%', // Sistema
                            2: '12%', // Físico
                            3: '10%', // Medida
                            4: '40%'  // Justificación
                        }}
                        getCellBadge={(row, cIdx) => {
                            const isAlmacen = conteo?.tipo === 'almacen';
                            if (Array.isArray(row)) {
                                if (isAlmacen) {
                                    // cIdx: 1->Sistema, 2->Físico, 3->Stock grup sist., 4->Stock grup fís.
                                    if (cIdx === 2) {
                                        // badge Físico (unidades)
                                        const sistemaStr = row[1] || '';
                                        const fisicoStr = row[2] || '';
                                        const sistema = parseFloat(String(sistemaStr).replace(/[^0-9.]/g, '')) || 0;
                                        const fisico = parseFloat(String(fisicoStr).replace(/[^0-9.]/g, '')) || 0;
                                        if (fisico === sistema) return { text: fisicoStr, className: 'info' };
                                        if (fisico > sistema) return { text: fisicoStr, className: 'success' };
                                        return { text: fisicoStr, className: 'error' };
                                    }
                                    if (cIdx === 4) {
                                        // badge Stock grup fís. comparar contra sist.
                                        const sys = row[3];
                                        const fis = row[4];
                                        if (!sys || !fis || sys === '--' || fis === '--') return null;
                                        const parsePair = (s) => {
                                            const match = String(s).match(/(\d+)\s*g\.?\s*(\d+)?/i);
                                            const g = match ? parseInt(match[1], 10) : 0;
                                            const uMatch = String(s).match(/g\.?\s*(\d+)\s*u\.?/i);
                                            const u = uMatch ? parseInt(uMatch[1], 10) : 0;
                                            return { g, u };
                                        };
                                        const a = parsePair(sys);
                                        const b = parsePair(fis);
                                        const cmp = (x, y) => (x.g === y.g && x.u === y.u) ? 0 : (x.g > y.g || (x.g === y.g && x.u > y.u) ? 1 : -1);
                                        const rel = cmp(b, a);
                                        if (rel === 0) return { text: fis, className: 'info' };
                                        if (rel > 0) return { text: fis, className: 'success' };
                                        return { text: fis, className: 'error' };
                                    }
                                } else {
                                    // acopio: cIdx: 1->Sistema, 2->Físico
                                    if (cIdx === 2) {
                                        const sistemaStr = row[1] || '';
                                        const fisicoStr = row[2] || '';
                                        const sistema = parseFloat(String(sistemaStr).replace(/[^0-9.]/g, '')) || 0;
                                        const fisico = parseFloat(String(fisicoStr).replace(/[^0-9.]/g, '')) || 0;
                                        if (fisico === sistema) return { text: fisicoStr, className: 'info' };
                                        if (fisico > sistema) return { text: fisicoStr, className: 'success' };
                                        return { text: fisicoStr, className: 'error' };
                                    }
                                }
                            }
                            return null;
                        }}
                        onClose={() => setIsProductosOpen(false)}
                    />
                ) : (
                    <ViewModal isOpen={isProductosOpen} setIsOpen={setIsProductosOpen}>
                        <HeaderModal
                            title="Productos del Conteo"
                            onClose={() => setIsProductosOpen(false)}
                        />
                        <div className={styles.modalContent}>
                            {/* Select de filtro para móvil */}

                            <Select
                                placeholder="Filtrar productos"
                                options={filtroOptions}
                                value={filtroMovil}
                                onChange={setFiltroMovil}
                                icon="filter"
                            />


                            {detallesFiltrados.length > 0 ? detallesFiltrados
                                .sort((a, b) => {
                                    const isAlmacen = conteo?.tipo === 'almacen';
                                    const nombreA = isAlmacen ? (a.producto_almacen?.name || '') : (a.producto_acopio?.name || '');
                                    const nombreB = isAlmacen ? (b.producto_almacen?.name || '') : (b.producto_acopio?.name || '');
                                    return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
                                })
                                .map((d, idx) => {
                                    const isAlmacen = conteo?.tipo === 'almacen';
                                    const nombreProducto = isAlmacen ? (d.producto_almacen?.name || 'Producto') : (d.producto_acopio?.name || 'Producto');
                                    const grup = isAlmacen ? (d.producto_almacen?.grup || 0) : 0;
                                    const medidaCode = !isAlmacen ? (d.producto_acopio?.type_measure?.code || '') : '';
                                    const sistema = Number(d.sistema ?? 0);
                                    const fisico = Number(d.fisico ?? 0);
                                    return (
                                        <ItemView
                                            key={d.id || idx}
                                            title={nombreProducto}
                                            description={isAlmacen
                                                ? (() => {
                                                    if (grup <= 0) return `Sistema: ${sistema} ud`;
                                                    const sysG = Math.floor(sistema / grup);
                                                    const sysU = sistema % grup;
                                                    const fmt = (g, u) => u > 0 ? `${g} g. ${u} u.` : `${g} g.`;
                                                    return `Sistema: ${sistema} ud • Grup sist.: ${fmt(sysG, sysU)}`;
                                                })()
                                                : `Sistema: ${Number(sistema).toFixed(2)}${medidaCode ? ` ${medidaCode}` : ''}`}
                                            description2={isAlmacen
                                                ? (() => {
                                                    if (grup <= 0) return `Físico: ${fisico} ud`;
                                                    const fisG = Math.floor(fisico / grup);
                                                    const fisU = fisico % grup;
                                                    const fmt = (g, u) => u > 0 ? `${g} g. ${u} u.` : `${g} g.`;
                                                    return `Físico: ${fisico} ud • Grup fís.: ${fmt(fisG, fisU)}`;
                                                })()
                                                : `Físico: ${Number(fisico).toFixed(2)}${medidaCode ? ` ${medidaCode}` : ''}${d.justificacion ? ` • ${d.justificacion}` : ''}`}
                                            {...(() => {
                                                if (fisico === sistema) return { flot1: '=' };
                                                if (fisico > sistema) return { flot4: '+' };
                                                return { flot3: '-' };
                                            })()}
                                            icon='box'
                                        />
                                    );
                                }) : (
                                <NoData
                                    icon="box"
                                    title="No hay productos"
                                    detail="No hay productos registrados en este conteo"
                                    transparent={false}
                                    minHeight="200px"
                                />
                            )}
                        </div>
                    </ViewModal>
                )}

                {/* Modal de confirmación para eliminar conteo */}
                <ViewModal isOpen={isEliminarOpen} setIsOpen={setIsEliminarOpen}>
                    <HeaderModal
                        title="Eliminar Conteo"
                        onClose={() => setIsEliminarOpen(false)}
                    />
                    <div className={styles.modalContent}>
                        <p className={styles.subTitle}>
                            ¿Estás seguro que deseas eliminar permanentemente este conteo? Esta acción no se puede deshacer y se eliminarán todos los detalles asociados.
                        </p>
                        <div className={styles.buttons}>
                            <Boton
                                className='btn-default'
                                label='Cancelar'
                                style={{ marginTop: 'auto' }}
                                onClick={() => setIsEliminarOpen(false)}
                            />
                            <Boton
                                className='btn-red'
                                label='Sí, eliminar'
                                style={{ marginTop: 'auto' }}
                                onClick={handleDeleteConteo}
                                loading={isDeleting}
                                disabled={isDeleting}
                                segundosDisabled={5}
                            />
                        </div>
                    </div>
                </ViewModal>

                {/* Modal de confirmación para reemplazar conteo */}
                <ViewModal isOpen={isReemplazarOpen} setIsOpen={setIsReemplazarOpen}>
                    <HeaderModal
                        title={conteo?.tipo === 'acopio' ? "Reemplazar Stock Acopio" : "Reemplazar Stock Almacén"}
                        onClose={() => setIsReemplazarOpen(false)}
                    />
                    <div className={styles.modalContent}>
                        <p className={styles.subTitle}>
                            ¿Estás seguro de continuar con el reemplazo de stock?
                        </p>
                        <div style={{ marginTop: '10px', width: '100%' }}>
                            <Text type="warning" align="left">
                                Al reemplazar stock este va a tomar las cantidades físicas de este conteo y las va a reemplazar en el stock principal de los productos.
                            </Text>
                        </div>
                        <div className={styles.buttons}>
                            <Boton
                                className='btn-default'
                                label='Cancelar'
                                style={{ marginTop: 'auto' }}
                                onClick={() => setIsReemplazarOpen(false)}
                            />
                            <Boton
                                className='btn-orange'
                                label='Sí, reemplazar'
                                style={{ marginTop: 'auto' }}
                                onClick={handleReemplazarConteo}
                                loading={isReplacing}
                                disabled={isReplacing}
                                segundosDisabled={5}
                            />
                        </div>
                    </div>
                </ViewModal>

                <Notification
                    type={notification.type}
                    text={notification.text}
                    isVisible={notification.isVisible}
                    onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
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