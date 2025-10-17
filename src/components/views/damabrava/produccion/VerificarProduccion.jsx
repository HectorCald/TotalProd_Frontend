import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../../styles/Inicial.module.css';
import HeaderView from '../../../common/HeaderView';
import View from '../../../ui/View';
import ItemView from '../../../common/ItemView';
import VerProduccion from './VerProduccion';
import Filtros from '../../../common/Filtros';
import Notification from '../../../common/Notification';
import registrosProduccionDamabravaService from '../../../../services/registrosProduccionDamabravaService';
import RefreshIndicator from '../../../common/RefreshIndicator';
import { useLayout } from '../../../../context/LayoutContext';
import Table from '../../../common/Table';
import FiltroOrdenamiento from '../../../mixed/FiltroOrdenamiento';
import FiltroResponsable from '../../../mixed/FiltroResponsable';
import FiltroEstados from '../../../mixed/FiltroEstados';

function VerificarProduccion({ isOpen, setIsOpen }) {
    const { isLargeScreen } = useLayout();
    
    // Estados para los modales
    const [isOpenVerProduccion, setIsOpenVerProduccion] = useState(false);
    const [infoProduccion, setInfoProduccion] = useState(null);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    
    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Estado para acumular todos los registros de todas las páginas
    const [allRegistros, setAllRegistros] = useState([]);
    
    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // Estados para filtros
    const [filtroEstado, setFiltroEstado] = useState(null);
    const [filtroResponsable, setFiltroResponsable] = useState(null);
    const [ordenamiento, setOrdenamiento] = useState('fecha_desc');

    // Estados para registros
    const [registros, setRegistros] = useState([]);
    const [hasMorePages, setHasMorePages] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Función para cargar registros
    const cargarRegistros = async (page = 1, search = '', estado = null, orden = 'fecha_desc', responsable = null) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await registrosProduccionDamabravaService.getAll(page, 10, estado, orden, search, responsable);
                
            if (response.success) {
                setRegistros(response.data);
                setHasMorePages(response.pagination?.hasNextPage || false);
            } else {
                setError(response);
            }
        } catch (error) {
            setError(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Acumular datos de todas las páginas cuando llegan nuevos registros
    useEffect(() => {
        if (registros && registros.length > 0 && isOpen) {
            if (currentPage === 1) {
                // Si es la primera página, tomar todos los registros que vienen del servicio
                setAllRegistros(registros);
            } else {
                // Si es una página posterior, acumular los datos
                setAllRegistros(prevRegistros => {
                    // Evitar duplicados por si acaso
                    const existingIds = new Set(prevRegistros.map(r => r.id));
                    const newRegistros = registros.filter(r => !existingIds.has(r.id));
                    return [...prevRegistros, ...newRegistros];
                });
            }
        }
    }, [registros, currentPage, isOpen]);

    // Mostrar indicador cuando se ejecuta fetcher (cualquier cambio en isLoading)
    useEffect(() => {
        if (isLoading && isOpen && !showRefreshIndicator) {
            setShowRefreshIndicator(true);
            setIsRefreshing(true);
        } else if (!isLoading && showRefreshIndicator && isOpen) {
            // Cuando termina de cargar, mostrar "Actualizado" por 1 segundo
            setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => {
                    setShowRefreshIndicator(false);
                }, 1000);
            }, 500);
        }
    }, [isLoading, isOpen, showRefreshIndicator]);

    // Cargar registros cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            // Mostrar indicador inmediatamente al abrir
            setShowRefreshIndicator(true);
            setIsRefreshing(true);
            // Cargar primera página
            cargarRegistros(1, debouncedSearchQuery, filtroEstado, ordenamiento, filtroResponsable);
        }
    }, [isOpen]);

    // Cargar registros cuando cambian los parámetros
    useEffect(() => {
        if (isOpen) {
            cargarRegistros(currentPage, debouncedSearchQuery, filtroEstado, ordenamiento, filtroResponsable);
        }
    }, [currentPage, debouncedSearchQuery, filtroEstado, ordenamiento, filtroResponsable]);

    // Limpiar indicador cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            setShowRefreshIndicator(false);
            setIsRefreshing(false);
        }
    }, [isOpen]);

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

    // Estados para filtros y modales
    const [isOpenFiltroOrden, setIsOpenFiltroOrden] = useState(false);
    const [isOpenFiltroResponsable, setIsOpenFiltroResponsable] = useState(false);
    const [isOpenFiltroEstados, setIsOpenFiltroEstados] = useState(false);

    // Función para manejar el click en un registro
    const handleRegistro = (registro) => {
        setInfoProduccion(registro);
        setIsOpenVerProduccion(true);
    };

    // Función para manejar refresh con indicador
    const handleRefresh = async () => {
        setShowRefreshIndicator(true);
        setIsRefreshing(true);
        
        // Limpiar estado acumulado y resetear página
        setAllRegistros([]);
        setCurrentPage(1);
        
        try {
            await cargarRegistros(1, debouncedSearchQuery, filtroEstado, ordenamiento, filtroResponsable);
            
            // Mostrar "Actualizado" por 1 segundo
            setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => {
                    setShowRefreshIndicator(false);
                }, 1000);
            }, 500);
        } catch (error) {
            setIsRefreshing(false);
            setShowRefreshIndicator(false);
        }
    };

    // Función para manejar scroll infinito
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !isLoading) {
            setCurrentPage(prev => prev + 1);
        }
    };

    // Función para manejar ordenamiento
    const handleOrdenamiento = (orden) => {
        setOrdenamiento(orden);
        setCurrentPage(1);
    };

    // Funciones para el buscador expandible
    const handleSearchChange = (value) => {
        setSearchQuery(value);
    };

    const handleSearchClear = () => {
        setSearchQuery('');
    };

    const handleSearchToggle = (isExpanded) => {
        setIsSearchExpanded(isExpanded);
    };

    // Efecto para resetear búsqueda cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setCurrentPage(1);
        }
    }, [isOpen]);

    // Efecto para limpiar datos acumulados SOLO cuando cambia la búsqueda, filtro o ordenamiento
    useEffect(() => {
        if (isOpen) {
            setAllRegistros([]);
            setCurrentPage(1);
        }
    }, [debouncedSearchQuery, filtroEstado, ordenamiento, filtroResponsable]);

    // Efecto para manejar errores
    useEffect(() => {
        if (error) {
            console.error('Error obteniendo registros de producción:', error);
        }
    }, [error]);


    // Función para manejar cuando se elimina un registro
    const handleRegistroEliminado = (registroId) => {
        // Actualizar el estado local acumulado
        setAllRegistros(prevRegistros => 
            prevRegistros.filter(registro => registro.id !== registroId)
        );
        
        mostrarNotificacion('success', 'Registro eliminado correctamente');
    };

    // Función para manejar cuando se verifica un registro
    const handleRegistroVerificado = (registroActualizado) => {
        // Si recibimos el registro completo actualizado, lo usamos
        if (typeof registroActualizado === 'object' && registroActualizado.id) {
            // Obtener el registro anterior para comparar
            const registroAnterior = allRegistros.find(r => r.id === registroActualizado.id);
            
            setAllRegistros(prevRegistros => 
                prevRegistros.map(registro => 
                    registro.id === registroActualizado.id 
                        ? registroActualizado
                        : registro
                )
            );
            
            // Mostrar notificación según el tipo de cambio
            if (registroActualizado.estado === 'verificado' && registroAnterior?.estado === 'pendiente') {
                mostrarNotificacion('success', 'Registro verificado correctamente');
            } else if (registroActualizado.estado === 'pendiente' && registroAnterior?.estado === 'verificado') {
                mostrarNotificacion('success', 'Verificación anulada correctamente');
            } else if (registroActualizado.estado === 'Ingresado') {
                // Determinar si es un ingreso completo o parcial
                const cantidadIngresada = registroActualizado.cantidad_ingresada || 0;
                const cantidadVerificada = registroActualizado.cantidad_verificada || 0;
                const cantidadAnterior = registroAnterior?.cantidad_ingresada || 0;
                const cantidadNuevaIngresada = cantidadIngresada - cantidadAnterior;
                
                if (cantidadIngresada >= cantidadVerificada) {
                    mostrarNotificacion('success', 
                        `¡Registro completado! Se ingresaron ${cantidadNuevaIngresada} unidades. Estado: Ingresado`
                    );
                } else {
                    const cantidadRestante = cantidadVerificada - cantidadIngresada;
                    mostrarNotificacion('success', 
                        `Se ingresaron ${cantidadNuevaIngresada} unidades. Quedan ${cantidadRestante} por ingresar`
                    );
                }
            } else if (registroAnterior && registroActualizado.cantidad_ingresada !== registroAnterior.cantidad_ingresada) {
                // Ingreso parcial (estado sigue siendo 'verificado')
                const cantidadIngresada = registroActualizado.cantidad_ingresada || 0;
                const cantidadVerificada = registroActualizado.cantidad_verificada || 0;
                const cantidadAnterior = registroAnterior?.cantidad_ingresada || 0;
                const cantidadNuevaIngresada = cantidadIngresada - cantidadAnterior;
                const cantidadRestante = cantidadVerificada - cantidadIngresada;
                
                mostrarNotificacion('success', 
                    `Se ingresaron ${cantidadNuevaIngresada} unidades. Quedan ${cantidadRestante} por ingresar`
                );
            } else {
                mostrarNotificacion('success', 'Registro actualizado correctamente');
            }
        } else {
            // Fallback para compatibilidad (solo ID)
            setAllRegistros(prevRegistros => 
                prevRegistros.map(registro => 
                    registro.id === registroActualizado 
                        ? { ...registro, estado: 'verificado' }
                        : registro
                )
            );
            mostrarNotificacion('success', 'Registro verificado correctamente');
        }
    };

    // Función para obtener el nombre del filtro de estado
    const getEstadoNombre = () => {
        if (filtroEstado === null) return 'Todos los estados';
        if (filtroEstado === 'pendiente') return 'Pendientes';
        if (filtroEstado === 'verificado') return 'Verificados';
        if (filtroEstado === 'Ingresado') return 'Ingresados';
        return 'Todos los estados';
    };

    // Función para obtener el nombre del filtro de responsable
    const getResponsableNombre = () => {
        if (!filtroResponsable) return 'Todos los responsables';
        return filtroResponsable.name;
    };

    // Función para obtener el nombre del ordenamiento
    const getOrdenamientoNombre = () => {
        const ordenamientos = {
            'fecha_desc': 'Más recientes',
            'fecha_asc': 'Más antiguos'
        };
        return ordenamientos[ordenamiento] || 'Ordenamiento';
    };

    const opciones = [
        {
            label: getOrdenamientoNombre(),
            active: ordenamiento !== 'fecha_desc',
            onClick: () => setIsOpenFiltroOrden(true)
        },
        {
            label: getEstadoNombre(),
            active: filtroEstado !== null,
            onClick: () => setIsOpenFiltroEstados(true)
        },
        {
            label: getResponsableNombre(),
            active: filtroResponsable !== null,
            onClick: () => setIsOpenFiltroResponsable(true)
        }
    ];

    // Headers para la tabla
    const tableHeaders = [
        { key: 'producto', label: 'Producto', icon: 'package' },
        { key: 'responsable', label: 'Responsable', icon: 'user' },
        { key: 'lote', label: 'Lote', icon: 'hash' },
        { key: 'proceso', label: 'Proceso', icon: 'cog' },
        { key: 'terminados', label: 'Terminados', icon: 'check-circle' },
        { key: 'fecha', label: 'Fecha', icon: 'calendar' },
        { key: 'estado', label: 'Estado', icon: 'check-circle' }
    ];

    // Datos para la tabla
    const tableData = allRegistros.map(registro => ({
        id: registro.id,
        producto: registro.producto_almacen?.name || 'Sin producto',
        responsable: registro.user?.name || registro.personal?.name || 'Usuario desconocido',
        lote: registro.lote || '0',
        proceso: registro.proceso === 'cernido' ? 'Cernido' : 
                 registro.proceso === 'seleccionado' ? 'Seleccionado' : 
                 registro.proceso === 'ninguno' ? 'Ninguno' : registro.proceso,
        terminados: `${registro.terminados || '0'} ud`,
        fecha: new Date(registro.fecha).toLocaleDateString(),
        estado: registro.estado === 'pendiente' ? 'Pendiente' : 
                registro.estado === 'verificado' ? 'Verificado' : 
                registro.estado === 'Ingresado' ? 'Ingresado' : registro.estado
    }));

    // Función para obtener el badge de estado
    const getCellBadge = (item, headerKey) => {
        if (headerKey === 'estado') {
            const estado = item.estado;
            const badgeConfig = {
                'Pendiente': {
                    text: 'Pendiente',
                    className: 'error' // amarillo
                },
                'Verificado': {
                    text: 'Verificado',
                    className: 'success' // verde
                },
                'Ingresado': {
                    text: 'Ingresado',
                    className: 'info' // azul
                },
            };
            
            return badgeConfig[estado] || {
                text: estado,
                className: 'default'
            };
        }
        
        if (headerKey === 'proceso') {
            const proceso = item.proceso;
            const badgeConfig = {
                'Cernido': {
                    text: 'Cernido',
                    className: 'info' // azul
                },
                'Seleccionado': {
                    text: 'Seleccionado',
                    className: 'info' // verde
                },
                'Ninguno': {
                    text: 'Ninguno',
                    className: 'info' // gris
                },
            };
            
            return badgeConfig[proceso] || {
                text: proceso,
                className: 'default'
            };
        }
        
        return null;
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
            <HeaderView 
                onBack={() => setIsOpen(false)}
                showSearch={true}
                searchPlaceholder="Buscar registros de producción..."
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
                title="Verificar Producción"
            />
            <div className={styles.container}>
                <div className={styles.titleContainer}>
                    <RefreshIndicator
                        isVisible={showRefreshIndicator}
                        isLoading={isRefreshing}
                    />
                </div>
                <Filtros options={opciones} />
                <div
                    className={styles.content}
                    onScroll={!isLargeScreen ? handleScroll : undefined}
                    style={{
                        maxHeight: '100%'
                    }}
                >
                    {isLargeScreen ? (
                        // Vista de tabla para pantallas grandes
                        <Table
                            headers={tableHeaders}
                            data={tableData}
                            onRowClick={(registro) => {
                                // Buscar el registro original sin formatear
                                const registroOriginal = allRegistros.find(r => r.id === registro.id);
                                handleRegistro(registroOriginal);
                            }}
                            getCellBadge={getCellBadge}
                            onScroll={handleScroll}
                        />
                    ) : (
                        // Vista de cards para pantallas pequeñas
                        allRegistros.length > 0 ? (
                            allRegistros.map((registro, index) => {
                                return (
                                    <ItemView
                                        key={registro.id || index}
                                        title={registro.producto_almacen?.name || 'Sin producto'}
                                        description={`${registro.terminados || '0'} terminados • ${new Date(registro.fecha).toLocaleDateString()} • ${registro.proceso === 'cernido' ? 'Cernido' : registro.proceso === 'seleccionado' ? 'Seleccionado' : registro.proceso === 'ninguno' ? 'Ninguno' : registro.proceso}`}
                                        icon="package"
                                        onClick={() => handleRegistro(registro)}
                                        arrow={false}
                                        flot1={registro?.estado === 'verificado' ? 'Verificado' : registro?.estado === 'Ingresado' ? 'Ingresado' : ''}  
                                        flot3={registro?.estado === 'pendiente' ? 'Pendiente' : ''}
                                        gris={true}
                                    />
                                );
                            })
                        ) : (
                            <div className={styles.noData}>
                                <p>{searchQuery ? 'No se encontraron registros de producción' : 'No hay registros de producción'}</p>
                            </div>
                        )
                    )}

                    {/* Indicador de carga para más elementos */}
                    {isLoading && (
                        <div className={styles.loadingMore}>
                            <p>Cargando más registros...</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Modal de ver registro de producción */}
            <VerProduccion
                isOpen={isOpenVerProduccion}
                setIsOpen={setIsOpenVerProduccion}
                registro={infoProduccion}
                onRegistroEliminado={handleRegistroEliminado}
                onRegistroVerificado={handleRegistroVerificado}
            />

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Filtro de ordenamiento */}
            <FiltroOrdenamiento
                isOpen={isOpenFiltroOrden}
                setIsOpen={setIsOpenFiltroOrden}
                onOrdenamientoSeleccionado={handleOrdenamiento}
            />

            {/* Filtro de estados */}
            <FiltroEstados
                isOpen={isOpenFiltroEstados}
                setIsOpen={setIsOpenFiltroEstados}
                onEstadoSeleccionado={setFiltroEstado}
                estadoSeleccionado={filtroEstado}
            />

            {/* Filtro de responsables */}
            <FiltroResponsable
                isOpen={isOpenFiltroResponsable}
                setIsOpen={setIsOpenFiltroResponsable}
                onResponsableSeleccionado={setFiltroResponsable}
                responsableSeleccionado={filtroResponsable}
            />
        </View>
    );
}

export default VerificarProduccion;
