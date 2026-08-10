import React, { useMemo, useState, useEffect } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Tabla from '../../../../components/common/information/Tabla';
import conteosService from '../../../../services/conteosService';
import { useToast } from '../../../../context/ToastContext';
import LoadingSpinner from '../../../../components/common/old/LoadingSpinner';
import useVirtualPagination from '../../../../hooks/useVirtualPagination';

const ProductosConteo = ({ isOpen, onClose, conteoSeleccionado }) => {
    const [detalles, setDetalles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { showDanger } = useToast();

    useEffect(() => {
        if (isOpen && conteoSeleccionado?.id) {
            const cargarDetalles = async () => {
                setIsLoading(true);
                try {
                    const resp = await conteosService.getDetalles(conteoSeleccionado.id);
                    if (resp.success) {
                        setDetalles(resp.data || []);
                    } else {
                        showDanger('Error', resp.message || 'Error al cargar detalles');
                    }
                } catch (error) {
                    showDanger('Error', 'Error al cargar detalles del conteo');
                } finally {
                    setIsLoading(false);
                }
            };
            cargarDetalles();
        } else {
            setDetalles([]);
        }
    }, [isOpen, conteoSeleccionado, showDanger]);

    const isAlmacen = conteoSeleccionado?.tipo === 'almacen';

    const columns = useMemo(() => [
        {
            header: 'Producto',
            render: (row) => isAlmacen ? (row.producto_almacen?.name || 'Sin nombre') : (row.producto_acopio?.name || 'Sin nombre'),
            width: isAlmacen ? '40%' : '30%',
            isMobileMain: true
        },
        {
            header: 'Sistema',
            render: (row) => {
                const sistema = Number(row.sistema || 0);
                const medidaCode = !isAlmacen ? (row.producto_acopio?.type_measure?.code || '') : '';
                return isAlmacen ? `${sistema} ud` : `${sistema.toFixed(2)} ${medidaCode}`;
            },
            mobileRender: (row) => {
                const sistema = Number(row.sistema || 0);
                const medidaCode = !isAlmacen ? (row.producto_acopio?.type_measure?.code || '') : '';
                return `SIS: ${isAlmacen ? `${sistema} ud` : `${sistema.toFixed(2)} ${medidaCode}`}`;
            },
            statusType: () => 'default',
            width: isAlmacen ? '20%' : '15%',
            isMobileStatus: true
        },
        {
            header: 'Físico',
            render: (row) => {
                const fisico = Number(row.fisico || 0);
                const medidaCode = !isAlmacen ? (row.producto_acopio?.type_measure?.code || '') : '';
                return isAlmacen ? `${fisico} ud` : `${fisico.toFixed(2)} ${medidaCode}`;
            },
            mobileRender: (row) => {
                const fisico = Number(row.fisico || 0);
                const medidaCode = !isAlmacen ? (row.producto_acopio?.type_measure?.code || '') : '';
                return `FIS: ${isAlmacen ? `${fisico} ud` : `${fisico.toFixed(2)} ${medidaCode}`}`;
            },
            statusType: () => 'info',
            width: isAlmacen ? '20%' : '15%',
            isMobileStatus2: true
        },
        {
            header: isAlmacen ? 'Diferencia' : 'DIF.',
            render: (row) => {
                const fisico = Number(row.fisico || 0);
                const sistema = Number(row.sistema || 0);
                const diff = fisico - sistema;
                const medidaCode = !isAlmacen ? (row.producto_acopio?.type_measure?.code || '') : '';
                const diffFormatted = isAlmacen ? `${Math.abs(diff)} ud` : `${Math.abs(diff).toFixed(2)} ${medidaCode}`;
                
                if (diff === 0) return <span style={{color: 'gray'}}>0</span>;
                if (diff > 0) return <span style={{color: '#10b981'}}>+{diffFormatted}</span>; // green
                return <span style={{color: '#ef4444'}}>-{diffFormatted}</span>; // red
            },
            mobileRender: (row) => {
                const fisico = Number(row.fisico || 0);
                const sistema = Number(row.sistema || 0);
                const diff = fisico - sistema;
                if (diff === 0) return '';
                const medidaCode = !isAlmacen ? (row.producto_acopio?.type_measure?.code || '') : '';
                const diffFormatted = isAlmacen ? `${Math.abs(diff)} ud` : `${Math.abs(diff).toFixed(2)} ${medidaCode}`;
                return diff > 0 ? `+${diffFormatted}` : `-${diffFormatted}`;
            },
            statusType: (row) => {
                const fisico = Number(row.fisico || 0);
                const sistema = Number(row.sistema || 0);
                const diff = fisico - sistema;
                return diff > 0 ? 'success' : 'error';
            },
            width: isAlmacen ? '20%' : '15%',
            isMobileStatus3: true
        },
        ...(isAlmacen ? [] : [{
            header: 'Observaciones',
            render: (row) => row.justificacion || '--',
            width: '40%'
        }])
    ], [isAlmacen]);

    const [search, setSearch] = useState('');
    const [tableFilters, setTableFilters] = useState({});

    const productosFlattened = useMemo(() => {
        return (detalles || []).map(p => ({
            ...p,
            productoNombre: isAlmacen ? (p.producto_almacen?.name || '') : (p.producto_acopio?.name || '')
        }));
    }, [detalles, isAlmacen]);

    const filteredDetalles = useMemo(() => {
        let result = [...productosFlattened];
        if (search) {
            const s = search.toLowerCase();
            result = result.filter(p => 
                p.productoNombre && p.productoNombre.toLowerCase().includes(s)
            );
        }
        
        result.sort((a, b) => {
            const valA = String(a.productoNombre || '');
            const valB = String(b.productoNombre || '');
            const direction = (tableFilters.sort_order && tableFilters.sort_order[0] === 'desc') ? -1 : 1;
            return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' }) * direction;
        });
        
        return result;
    }, [productosFlattened, search, tableFilters]);

    const { visibleItems, hasMore, loadMore } = useVirtualPagination(filteredDetalles, 30);

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title={`Productos del Conteo ${conteoSeleccionado?.codigo || ''}`}
            width="800px"
            hideFooter={true}
            contentStyle={{ paddingBlock: 0 }}
        >
            <div style={{ padding: '10px 0' }}>
                {isLoading ? (
                    <LoadingSpinner />
                ) : productosFlattened.length > 0 ? (
                    <Tabla
                        data={visibleItems}
                        columns={columns}
                        remote={true}
                        searchValue={search}
                        onSearchChange={setSearch}
                        externalFilters={tableFilters}
                        onFiltersChange={setTableFilters}
                        searchKeys={['productoNombre']}
                        searchPlaceholder="Buscar por producto..."
                        containerStyle={{ minHeight: 'auto', padding: 0 }}
                        onLoadMore={hasMore ? loadMore : undefined}
                    />
                ) : (
                    <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        No hay productos para mostrar en este conteo.
                    </p>
                )}
            </div>
        </ModalCentro>
    );
};

export default ProductosConteo;
