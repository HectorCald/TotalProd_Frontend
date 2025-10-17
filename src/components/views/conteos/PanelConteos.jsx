import React, { useState, useEffect } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import Notification from '../../common/Notification';
import RefreshIndicator from '../../common/RefreshIndicator';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import conteosService from '../../../services/conteosService';
import VerConteo from './VerConteo';

function PanelConteos({ isOpen, setIsOpen, tipoConteo = 'almacen' }) {
    const { isLargeScreen } = useLayout();

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [conteos, setConteos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

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

    const cargarConteos = async () => {
        setIsLoading(true);
        try {
            // Mapeo directo según BD: 'almacen' | 'acopio'
            const tipo = tipoConteo === 'almacen' ? 'almacen' : tipoConteo === 'acopio' ? 'acopio' : null;
            const resp = await conteosService.getAll({ tipo });
            if (resp.success) {
                const data = resp.data || [];
                const filteredByTipo = tipo ? data.filter(c => ((c.tipo || '').toString().trim().toLowerCase() === (tipo || '').toString().trim().toLowerCase())) : data;
                setConteos(filteredByTipo);
            } else {
                throw new Error(resp.message || 'Error al obtener conteos');
            }
        } catch (e) {
            mostrarNotificacion('error', e.message || 'Error al obtener conteos');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setShowRefreshIndicator(true);
            setIsRefreshing(true);
            cargarConteos().finally(() => {
                setTimeout(() => {
                    setIsRefreshing(false);
                    setTimeout(() => setShowRefreshIndicator(false), 800);
                }, 400);
            });
        }
    }, [isOpen]);

    // tipoConteo controla el dataset
    useEffect(() => {
        if (isOpen) {
            cargarConteos();
        }
    }, [tipoConteo]);

    const filtered = conteos.filter(c => {
        if (!searchQuery) return true;
        const text = `${c.tipo || ''} ${c.observaciones || ''}`.toLowerCase();
        return text.includes(searchQuery.toLowerCase());
    });

    const opciones = [];

    const tableHeaders = [
        { key: 'tipo', label: 'Tipo', icon: 'category' },
        { key: 'fecha', label: 'Fecha', icon: 'calendar' },
        { key: 'detalles', label: 'Items', icon: 'list-ul' },
        { key: 'observaciones', label: 'Observaciones', icon: 'message-square-detail' }
    ];

    const tableData = filtered.map(c => ({
        id: c.id,
        tipo: c.tipo === 'almacen' ? 'Almacén' : 'Materia Prima',
        fecha: new Date(c.fecha).toLocaleString(),
        detalles: (c.detalles || []).length,
        observaciones: c.observaciones || ''
    }));

    const handleRegistro = (conteo) => {
        // Se abrirá un modal de detalle (VerConteo)
        setSelectedConteo(conteo);
        setIsOpenVerConteo(true);
    };

    const handleConteoDeleted = (deletedConteoId) => {
        // Remover el conteo eliminado del estado local
        setConteos(prevConteos => prevConteos.filter(c => c.id !== deletedConteoId));
        mostrarNotificacion('success', 'Conteo eliminado exitosamente');
    };

    const handleConteoReemplazado = (conteoId) => {
        // Podemos recargar o simplemente notificar; por ahora solo notificar
        mostrarNotificacion('success', 'Stock reemplazado correctamente');
    };

    const [isOpenVerConteo, setIsOpenVerConteo] = useState(false);
    const [selectedConteo, setSelectedConteo] = useState(null);

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
            <HeaderView
                onBack={() => setIsOpen(false)}
                showSearch={true}
                searchPlaceholder="Buscar conteos..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                onSearchClear={() => setSearchQuery('')}
                searchExpanded={isSearchExpanded}
                onSearchToggle={setIsSearchExpanded}
                title={tipoConteo === 'acopio' ? 'Conteos Materia Prima' : tipoConteo === 'almacen' ? 'Conteos Almacén' : 'Conteos'}
            />
            <div className={styles.container}>
                <div className={styles.titleContainer}>
                    <RefreshIndicator isVisible={showRefreshIndicator} isLoading={isRefreshing} />
                </div>
                <div className={styles.content} style={{ maxHeight: '100%' }}>
                    {isLargeScreen ? (
                        <Table
                            headers={tableHeaders}
                            data={tableData}
                            onRowClick={(row) => {
                                const original = filtered.find(c => c.id === row.id);
                                handleRegistro(original);
                            }}
                            getBadge={() => null}
                        />
                    ) : (
                        filtered.length > 0 ? (
                            filtered.map((c, idx) => (
                                <ItemView
                                    key={c.id || idx}
                                    title={`${c.tipo === 'almacen' ? 'Almacén' : 'Materia Prima'} - ${new Date(c.fecha).toLocaleDateString()}`}
                                    description={c.observaciones || 'Sin observaciones'}
                                    icon='list-check'
                                    onClick={() => handleRegistro(c)}
                                    flot1={`${(c.detalles || []).length} ítems`}
                                />
                            ))
                        ) : (
                            <div className={styles.noData}>
                                <p>{searchQuery ? 'No se encontraron conteos' : 'No hay conteos registrados'}</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Modal de ver conteo */}
            <VerConteo
                isOpen={isOpenVerConteo}
                setIsOpen={setIsOpenVerConteo}
                conteo={selectedConteo}
                onConteoDeleted={handleConteoDeleted}
                onConteoReplaced={handleConteoReemplazado}
            />
        </View>
    );
}

export default PanelConteos;


