import React, { useState, useEffect } from 'react';
import ModalLateral from '../../../../components/common/modals/ModalLateral';
import Input from '../../../../components/common/inputs/Input';
import InputSelect from '../../../../components/common/inputs/InputSelect';
import productsAlmacenService from '../../../../services/productsAlmacenService';
import productsAcopioService from '../../../../services/productsAcopioService';
import NoData from '../../../../components/common/widgets/NoData';
import { useToast } from '../../../../context/ToastContext';
import SelectCategoriasAcopio from '../../../../components/common/fast/SelectCategoriasAcopio';
import SelectCategoriasAlmacen from '../../../../components/common/fast/SelectCategoriasAlmacen';
import useVirtualPagination from '../../../../hooks/useVirtualPagination';
import conteosService from '../../../../services/conteosService';
import { useUser } from '../../../../context/UserContext';
import { useEmployee } from '../../../../context/EmployeeContext';
import BotonIcon from '../../../../components/common/botones/BotonIcon';

const AgregarEditarConteo = ({ isOpen, onClose, isAcopio }) => {
    const { showDanger, showSuccess } = useToast();
    const { user: userInfo } = useUser();
    const { employee: employeeInfo } = useEmployee();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [productos, setProductos] = useState([]);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
    
    // Modo de conteo (solo útil para almacén)
    const [modoAgrupacion, setModoAgrupacion] = useState('unidad');

    const opcionesAgrupacion = [
        { value: 'unidad', label: 'Por Unidades' },
        { value: 'grupo', label: 'Por Grupos' }
    ];

    // Clave de localStorage según el tipo de conteo
    const storageKey = isAcopio ? 'conteoAcopioEnProgreso' : 'conteoAlmacenEnProgreso';

    useEffect(() => {
        if (isOpen) {
            if (!isAcopio) {
                // Restaurar modalidad guardada para almacén
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        if (parsed.modalidad) setModoAgrupacion(parsed.modalidad);
                    } catch (_) {}
                }
            } else {
                setModoAgrupacion('unidad');
            }
            setCategoriaSeleccionada('');
            fetchProductos();
        } else {
            setProductos([]);
            setCategoriaSeleccionada('');
        }
    }, [isOpen, isAcopio]);

    const fetchProductos = async () => {
        setFetching(true);
        try {
            let response;
            if (isAcopio) {
                response = await productsAcopioService.productsConteo();
            } else {
                response = await productsAlmacenService.productsConteo();
            }

            if (response && response.success) {
                // Restaurar valores guardados desde localStorage
                let savedMap = {};
                try {
                    const raw = localStorage.getItem(storageKey);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        (parsed.productos || []).forEach(p => { savedMap[p.id] = p; });
                    }
                } catch (_) {}

                const formatted = response.data.map(p => ({
                    ...p,
                    typedValue: savedMap[p.id]?.typedValue ?? '',
                    justificacion: savedMap[p.id]?.justificacion ?? '',
                    grup: Number(p.grup || 0),
                    stock: Number(p.stock || 0)
                }));
                setProductos(formatted);
            } else {
                showDanger(null, response?.message || 'Error desconocido');
            }
        } catch (error) {
            showDanger(null, 'No se pudieron obtener los productos');
        } finally {
            setFetching(false);
        }
    };

    // Persistir en localStorage al cambiar productos o modalidad
    useEffect(() => {
        if (!isOpen || productos.length === 0) return;
        const hayDatos = productos.some(p => p.typedValue !== '' && p.typedValue !== null && p.typedValue !== undefined);
        if (!hayDatos) {
            localStorage.removeItem(storageKey);
            return;
        }
        const data = {
            modalidad: modoAgrupacion,
            productos: productos
                .filter(p => p.typedValue !== '' && p.typedValue !== null && p.typedValue !== undefined)
                .map(p => ({ id: p.id, typedValue: p.typedValue, justificacion: p.justificacion || '' }))
        };
        localStorage.setItem(storageKey, JSON.stringify(data));
    }, [productos, modoAgrupacion, isOpen, storageKey]);

    const formatStock = (stock, grup, modo) => {
        if (modo === 'grupo' && grup > 0) {
            const numGrupos = Math.floor(stock / grup);
            const udsRestantes = stock % grup;
            if (numGrupos > 0 && udsRestantes > 0) {
                return `${numGrupos} GR ${udsRestantes} UD`;
            } else if (numGrupos > 0) {
                return `${numGrupos} GR`;
            } else {
                return `${udsRestantes} UD`;
            }
        }
        return `${stock} UD`;
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const detalles = [];
            
            for (const prod of productos) {
                const stockActual = Number(prod.stock) || 0;
                
                let stockFisico;
                if (prod.typedValue === '' || prod.typedValue === null || prod.typedValue === undefined) {
                    stockFisico = stockActual;
                } else {
                    const calculado = calcularUnidadesTotales(prod.typedValue, prod.grup);
                    stockFisico = calculado !== null ? calculado : 0;
                }
                
                if (stockActual > 0 || stockFisico > 0) {
                    detalles.push({
                        producto_id: prod.id,
                        sistema: stockActual,
                        fisico: stockFisico,
                        justificacion: prod.justificacion || null
                    });
                }
            }
            
            if (detalles.length === 0) {
                showDanger(null, 'No hay productos válidos para registrar en el conteo');
                setLoading(false);
                return;
            }
            
            const payload = {
                tipo: isAcopio ? 'acopio' : 'almacen',
                observaciones: `Conteo de ${isAcopio ? 'Materia Prima' : 'Almacén'} - Generado automáticamente`,
                detalles
            };
            
            const response = await conteosService.create(payload);
            
            if (response.success) {
                showSuccess(null, 'Conteo registrado exitosamente');
                // Limpiar storage al confirmar exitosamente
                localStorage.removeItem(storageKey);
                
                const token = localStorage.getItem('token');
                let isEmployeeSession = false;
                if (token) {
                    try {
                        const base64Url = token.split('.')[1];
                        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                        }).join(''));
                        const decoded = JSON.parse(jsonPayload);
                        isEmployeeSession = decoded.type === 'employee';
                    } catch (error) {
                        isEmployeeSession = false;
                    }
                }
                
                let userObj = null;
                let personalObj = null;
                
                if (isEmployeeSession && employeeInfo) {
                    personalObj = { name: `${employeeInfo.first_name || ''} ${employeeInfo.last_name || ''}`.trim() || 'Empleado' };
                } else if (!isEmployeeSession && userInfo) {
                    userObj = { name: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 'Usuario' };
                }

                onClose({
                    id: response.id,
                    fecha: new Date().toISOString(),
                    tipo: payload.tipo,
                    observaciones: payload.observaciones,
                    detalles_count: detalles.length,
                    user: userObj,
                    personal: personalObj
                });
            } else {
                showDanger(null, response.message || 'Error al guardar el conteo');
            }
        } catch (error) {
            console.error('Error al guardar:', error);
            showDanger(null, 'Ocurrió un error inesperado al guardar el conteo');
        } finally {
            setLoading(false);
        }
    };

    const calcularUnidadesTotales = (typedValue, grup) => {
        if (!typedValue && typedValue !== 0) return null;
        const strVal = String(typedValue).replace(',', '.');
        if (strVal === '') return null;
        
        if (!isAcopio && modoAgrupacion === 'grupo' && grup > 0) {
            const parts = strVal.split('.');
            const grupos = parseInt(parts[0] || '0', 10);
            const unidadesStr = parts[1] || '0';
            const unidadesExtras = parseInt(unidadesStr, 10);
            return (grupos * grup) + unidadesExtras;
        } else {
            return parseFloat(strVal);
        }
    };

    const getEstadoValidacion = (typedValue, actualStock, grup, unidadMedida) => {
        if (typedValue === '' || typedValue === null || typedValue === undefined) return null;
        
        const conteo = calcularUnidadesTotales(typedValue, grup);
        if (conteo === null || isNaN(conteo)) return null;

        const diff = conteo - actualStock;

        if (diff === 0) {
            return { type: 'info', message: 'Stock actual y contado son iguales' };
        } else if (diff > 0) {
            return { type: 'success', message: `Sobran ${Number(diff.toFixed(2))} ${unidadMedida}` };
        } else {
            return { type: 'error', message: `Faltan ${Math.abs(Number(diff.toFixed(2)))} ${unidadMedida}` };
        }
    };

    const handleInputChange = (index, value) => {
        setProductos(prev => {
            const next = [...prev];
            const prod = next[index];

            // Validar decimales para almacén en modo unidad
            if (!isAcopio && modoAgrupacion === 'unidad') {
                const cleanValue = value.replace(',', '.');
                if (cleanValue.includes('.')) {
                    // Prevenir decimales
                    return next;
                }
            }
            
            prod.typedValue = value;
            return next;
        });
    };

    // Filtrar localmente por categoría
    const filteredProductos = React.useMemo(() => {
        if (!categoriaSeleccionada) return productos;
        return productos.filter(p => {
            if (isAcopio) {
                return String(p.category_id) === String(categoriaSeleccionada);
            } else {
                return p.category_ids && p.category_ids.some(id => String(id) === String(categoriaSeleccionada));
            }
        });
    }, [productos, categoriaSeleccionada, isAcopio]);

    // Paginación virtual local
    const { visibleItems, loaderRef } = useVirtualPagination(filteredProductos, 30);

    const handleLimpiarCampos = () => {
        setProductos(prev => prev.map(p => ({
            ...p,
            typedValue: '',
            justificacion: ''
        })));
        localStorage.removeItem(storageKey);
    };

    return (
        <ModalLateral
            isOpen={isOpen}
            onClose={() => onClose(null)}
            title={isAcopio ? "Nuevo Conteo - Materia Prima" : "Nuevo Conteo - Almacén"}
            confirmText="Guardar"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading || fetching}
        >
            <div 
                style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', height: '100%', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
            >
                {!isAcopio && (
                    <div>
                        <InputSelect
                            options={opcionesAgrupacion}
                            value={modoAgrupacion}
                            onChange={(val) => setModoAgrupacion(val)}
                            placeholder="Seleccione modo..."
                            clearable={false}
                        />
                    </div>
                )}
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '5px', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {isAcopio ? (
                            <SelectCategoriasAcopio 
                                value={categoriaSeleccionada}
                                onChange={(val) => setCategoriaSeleccionada(val)}
                                useSelect={true}
                                multiple={false}
                                label="Filtrar por categoría"
                                placeholder="Todas las categorías"
                            />
                        ) : (
                            <SelectCategoriasAlmacen 
                                value={categoriaSeleccionada}
                                onChange={(val) => setCategoriaSeleccionada(val)}
                                useSelect={true}
                                multiple={false}
                                label="Filtrar por categoría"
                                placeholder="Todas las categorías"
                            />
                        )}
                    </div>
                    <BotonIcon
                        iconName="trash"
                        className="btn-error"
                        tooltip="Limpiar todos los campos"
                        onClick={handleLimpiarCampos}
                        style={{ height: '40px', width: '40px', minWidth: '40px', flexShrink: 0 }}
                    />
                </div>

                {fetching ? (
                    <div style={{ padding: '20px' }}>
                        <NoData icon="loader-alt" title="Cargando productos..." transparent />
                    </div>
                ) : filteredProductos.length === 0 ? (
                    <div style={{ padding: '20px' }}>
                        <NoData icon="box" title="No hay productos disponibles" transparent />
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {visibleItems.map((prod) => {
                            // Encontrar el índice original en `productos` para poder actualizar su estado correctamente
                            const originalIndex = productos.findIndex(p => p.id === prod.id);
                            const unidadMedida = isAcopio ? (prod.medida || 'UD') : 'UD';
                            const validation = getEstadoValidacion(prod.typedValue, prod.stock, prod.grup, unidadMedida);
                            
                            let titleHtml;
                            let placeholderText;

                            if (isAcopio) {
                                const stockFormatted = Number(Number(prod.stock || 0).toFixed(2));
                                titleHtml = (
                                    <span>
                                        {prod.name} <span style={{ color: 'var(--primary-color)' }}>({stockFormatted} {prod.medida})</span>
                                    </span>
                                );
                                placeholderText = `${stockFormatted} ${prod.medida}`;
                            } else {
                                const stockFormatted = formatStock(prod.stock, prod.grup, modoAgrupacion);
                                titleHtml = (
                                    <span>
                                        {prod.name} <span style={{ color: 'var(--primary-color)' }}>({stockFormatted})</span>
                                    </span>
                                );
                                placeholderText = `${stockFormatted}`;
                            }

                            return (
                                <div key={prod.id} style={{ 
                                    marginBottom: '5px', 
                                    ...(isAcopio ? { padding: '10px', border: '1px solid var(--quaternary-color)', borderRadius: '8px' } : {}) 
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div>
                                            <Input
                                                tipo="number"
                                                label={titleHtml}
                                                value={prod.typedValue}
                                                onChange={(e) => handleInputChange(originalIndex, e.target.value)}
                                                placeholder={placeholderText}
                                                error={validation?.message}
                                                errorType={validation?.type}
                                            />
                                        </div>
                                        {isAcopio && (
                                            <div>
                                                <Input
                                                    tipo="text"
                                                    label="Observaciones"
                                                    value={prod.justificacion}
                                                    onChange={(e) => {
                                                        setProductos(prev => {
                                                            const next = [...prev];
                                                            next[originalIndex].justificacion = e.target.value;
                                                            return next;
                                                        });
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={loaderRef} style={{ height: '10px' }} />
                    </div>
                )}
            </div>
        </ModalLateral>
    );
};

export default AgregarEditarConteo;
