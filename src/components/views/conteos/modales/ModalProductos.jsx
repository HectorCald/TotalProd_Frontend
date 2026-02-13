import React, { useMemo, useState, useEffect } from 'react';
import { useLayout } from '../../../../context/LayoutContext';
import ModalTable from '../../../common/ModalTable';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import ItemView from '../../../common/ItemView';
import Select from '../../../common/Select';
import NoData from '../../../common/NoData';
import LoadingSpinner from '../../../common/LoadingSpinner';
import conteosService from '../../../../services/conteosService';
import { useToast } from '../../../../context/ToastContext';
import useVirtualPagination from '../../../../hooks/useVirtualPagination';
import styles from '../../../../styles/view.module.css';

function ModalProductos({ isOpen, setIsOpen, conteo, detalles, setDetalles }) {
    const { isLargeScreen } = useLayout();
    const { showDanger } = useToast();
    const [isLoadingDetalles, setIsLoadingDetalles] = useState(false);
    
    // Filtros de modal (desktop)
    const [filtroFisico, setFiltroFisico] = useState('todos'); // igual | mayor | menor | todos

    // Filtros para móvil
    const [filtroMovil, setFiltroMovil] = useState('todos'); // igual | mayor | menor | todos

    // Cargar detalles cuando se abre el modal
    useEffect(() => {
        if (isOpen && conteo?.id && detalles.length === 0) {
            const cargarDetalles = async () => {
                setIsLoadingDetalles(true);
                try {
                    const resp = await conteosService.getDetalles(conteo.id);
                    if (resp.success) {
                        if (setDetalles) {
                            setDetalles(resp.data || []);
                        }
                    } else {
                        showDanger('Error', resp.message || 'Error al cargar detalles');
                    }
                } catch (error) {
                    console.error('[MODAL PRODUCTOS] Error cargando detalles:', error);
                    showDanger('Error', 'Error al cargar detalles del conteo');
                } finally {
                    setIsLoadingDetalles(false);
                }
            };
            cargarDetalles();
        }
    }, [isOpen, conteo?.id, detalles.length, setDetalles, showDanger]);

    // Detalles filtrados y ordenados para desktop
    const detallesFiltradosDesktop = useMemo(() => {
        let detallesFiltrados = detalles;
        
        // Aplicar filtro
        if (filtroFisico !== 'todos') {
            detallesFiltrados = detalles.filter(detalle => {
                const sistema = Number(detalle.sistema ?? 0);
                const fisico = Number(detalle.fisico ?? 0);

                if (filtroFisico === 'igual') return fisico === sistema;
                if (filtroFisico === 'mayor') return fisico > sistema;
                if (filtroFisico === 'menor') return fisico < sistema;

                return true;
            });
        }

        // Ordenar
        return detallesFiltrados.sort((a, b) => {
            const isAlmacen = conteo?.tipo === 'almacen';
            const nombreA = isAlmacen ? (a.producto_almacen?.name || '') : (a.producto_acopio?.name || '');
            const nombreB = isAlmacen ? (b.producto_almacen?.name || '') : (b.producto_acopio?.name || '');
            return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
        });
    }, [detalles, conteo, filtroFisico]);

    // Aplicar paginación virtual a los detalles filtrados de desktop
    const {
        visibleItems: detallesFiltradosDesktopVisibles,
        handleScroll: handleDetallesDesktopScroll
    } = useVirtualPagination(detallesFiltradosDesktop, 30);

    // Filas preparadas para ModalTable (solo los visibles)
    const rowsMemo = useMemo(() => detallesFiltradosDesktopVisibles.map((d) => {
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
    }), [detallesFiltradosDesktopVisibles, conteo]);

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

    // Detalles filtrados y ordenados para móvil
    const detallesFiltradosMovil = useMemo(() => {
        let detallesFiltrados = detalles;
        
        // Aplicar filtro
        if (filtroMovil !== 'todos') {
            detallesFiltrados = detalles.filter(detalle => {
                const sistema = Number(detalle.sistema ?? 0);
                const fisico = Number(detalle.fisico ?? 0);

                if (filtroMovil === 'igual') return fisico === sistema;
                if (filtroMovil === 'mayor') return fisico > sistema;
                if (filtroMovil === 'menor') return fisico < sistema;

                return true;
            });
        }

        // Ordenar
        return detallesFiltrados.sort((a, b) => {
            const isAlmacen = conteo?.tipo === 'almacen';
            const nombreA = isAlmacen ? (a.producto_almacen?.name || '') : (a.producto_acopio?.name || '');
            const nombreB = isAlmacen ? (b.producto_almacen?.name || '') : (b.producto_acopio?.name || '');
            return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
        });
    }, [detalles, conteo, filtroMovil]);

    // Aplicar paginación virtual a los detalles filtrados de móvil
    const {
        visibleItems: detallesFiltrados,
        handleScroll: handleDetallesScroll
    } = useVirtualPagination(detallesFiltradosMovil, 30);

    if (isLargeScreen) {
        return (
            <ModalTable
                isOpen={isOpen}
                title="Productos del Conteo"
                headers={conteo?.tipo === 'almacen' ? ['Producto', 'Sistema', 'Físico', 'Stock grup sist.', 'Stock grup fís.'] : ['Producto', 'Sistema', 'Físico', 'Medida', 'Justificación']}
                rows={isLoadingDetalles ? [] : rowsMemo}
                filters={isLoadingDetalles ? {} : filtersConfig}
                onScroll={handleDetallesDesktopScroll}
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
                onClose={() => setIsOpen(false)}
            >
                {isLoadingDetalles && <LoadingSpinner />}
            </ModalTable>
        );
    }

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Productos del Conteo"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent} onScroll={handleDetallesScroll}>
                {isLoadingDetalles ? (
                    <LoadingSpinner />
                ) : (
                    <>
                        <Select
                            placeholder="Filtrar productos"
                            options={filtroOptions}
                            value={filtroMovil}
                            onChange={setFiltroMovil}
                            icon="filter"
                        />

                        {detallesFiltrados.length > 0 ? detallesFiltrados.map((d, idx) => {
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
                    </>
                )}
            </div>
        </ViewModal>
    );
}

export default ModalProductos;
