import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import InputNormal from '../../common/InputNormal';
import Boton from '../../common/Boton';
import ItemView from '../../common/ItemView';
import NoData from '../../common/NoData';
import EmpresaService from '../../../services/empresaService';
import EmpresaView from './EmpresaView';

const FAVORITES_KEY = 'empresas_favoritas';

function AsociadosSearch({ isOpen, setIsOpen }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [empresas, setEmpresas] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [selectedEmpresa, setSelectedEmpresa] = useState(null);
    const [isEmpresaViewOpen, setIsEmpresaViewOpen] = useState(false);

    // Cargar favoritos al montar el componente
    useEffect(() => {
        loadFavorites();
    }, []);

    // Recargar favoritos cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            loadFavorites();
        }
    }, [isOpen]);

    // Cerrar el modal principal cuando se cierra EmpresaView
    useEffect(() => {
        if (!isEmpresaViewOpen && selectedEmpresa) {
            // Si EmpresaView se cerró, también cerrar AsociadosSearch
            setIsOpen(false);
            setSelectedEmpresa(null);
        }
    }, [isEmpresaViewOpen, selectedEmpresa]);

    // Escuchar cambios en localStorage para actualizar favoritos
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === FAVORITES_KEY) {
                loadFavorites();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        // También escuchar eventos personalizados para cambios en la misma pestaña
        window.addEventListener('favorites-updated', loadFavorites);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('favorites-updated', loadFavorites);
        };
    }, []);

    // Cargar favoritos desde localStorage
    const loadFavorites = () => {
        try {
            const stored = localStorage.getItem(FAVORITES_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setFavorites(Array.isArray(parsed) ? parsed : []);
            }
        } catch (error) {
            console.error('Error al cargar favoritos:', error);
            setFavorites([]);
        }
    };

    // Guardar favoritos en localStorage
    const saveFavorites = (newFavorites) => {
        try {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
            setFavorites(newFavorites);
        } catch (error) {
            console.error('Error al guardar favoritos:', error);
        }
    };

    // Verificar si una empresa es favorita
    const isFavorite = (empresaId) => {
        return favorites.some(fav => fav.id === empresaId);
    };

    // Toggle favorito
    const toggleFavorite = (empresa) => {
        const isFav = isFavorite(empresa.id);
        let newFavorites;

        if (isFav) {
            // Remover de favoritos
            newFavorites = favorites.filter(fav => fav.id !== empresa.id);
        } else {
            // Agregar a favoritos
            newFavorites = [...favorites, {
                id: empresa.id,
                name: empresa.name,
                description: empresa.description,
                logo_tipo: empresa.logo_tipo,
                codigo: empresa.codigo,
                tipo: empresa.tipo,
                propietario_id: empresa.propietario_id
            }];
        }

        saveFavorites(newFavorites);
    };

    // Abrir vista de empresa
    const handleEmpresaClick = (empresa) => {
        setSelectedEmpresa(empresa);
        setIsEmpresaViewOpen(true);
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            return;
        }

        setLoading(true);
        setHasSearched(true);

        try {
            const result = await EmpresaService.searchByCodigo(searchTerm.trim());
            
            if (result.success && result.data && result.data.empresas) {
                setEmpresas(result.data.empresas);
            } else {
                setEmpresas([]);
            }
        } catch (error) {
            console.error('Error al buscar empresas:', error);
            setEmpresas([]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !loading) {
            handleSearch();
        }
    };

    const renderFavoritos = () => {
        if (favorites.length === 0) {
            return null;
        }

        return (
            <>
                <p className={styles.subTitle}>ASOCIADOS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '20px' }}>
                    {favorites.map((empresa) => (
                        <ItemView
                            key={empresa.id}
                            title={empresa.name || 'Sin nombre'}
                            description={empresa.description || 'Sin descripción'}
                            circulo={true}
                            transparent={false}
                            arrow={true}
                            onClick={() => handleEmpresaClick(empresa)}
                            customIcon={empresa.logo_tipo ? (
                                <div 
                                    style={{ 
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '10px',
                                        backgroundImage: `url(${empresa.logo_tipo})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat'
                                    }}
                                />
                            ) : undefined}
                            icon={empresa.logo_tipo ? undefined : 'building'}
                        />
                    ))}
                </div>
            </>
        );
    };

    const renderContent = () => {
        // Si no se ha buscado, mostrar solo favoritos
        if (!hasSearched) {
            return (
                <>
                    {renderFavoritos()}
                    <NoData
                        icon="search"
                        title="No hay búsquedas recientes"
                        detail="Ingresa un código de empresa para buscar asociados"
                        transparent={true}
                        minHeight="200px"
                    />
                </>
            );
        }

        // Si está cargando, mostrar loading
        if (loading) {
            return (
                <>
                    {renderFavoritos()}
                    <NoData
                        icon="loader-alt"
                        title="Buscando..."
                        detail="Por favor espera mientras buscamos las empresas"
                        transparent={true}
                        minHeight="200px"
                    />
                </>
            );
        }

        // Si no hay resultados
        if (empresas.length === 0) {
            return (
                <>
                    {renderFavoritos()}
                    <NoData
                        icon="box"
                        title="No se encontraron empresas"
                        detail="No hay empresas con el código ingresado"
                        transparent={true}
                        minHeight="200px"
                    />
                </>
            );
        }

        // Mostrar resultados
        return (
            <>
                {renderFavoritos()}
                {empresas.length > 0 && (
                    <>
                        <p className={styles.subTitle}>RESULTADOS DE BÚSQUEDA</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', minHeight: '200px' }}>
                            {empresas.map((empresa) => (
                                <ItemView
                                    key={empresa.id}
                                    title={empresa.name || 'Sin nombre'}
                                    description={empresa.description || 'Sin descripción'}
                                    circulo={true}
                                    transparent={false}
                                    arrow={true}
                                    onClick={() => handleEmpresaClick(empresa)}
                                    customIcon={empresa.logo_tipo ? (
                                        <div 
                                            style={{ 
                                                width: '50px',
                                                height: '50px',
                                                borderRadius: '10px',
                                                backgroundImage: `url(${empresa.logo_tipo})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat'
                                            }}
                                        />
                                    ) : undefined}
                                    icon={empresa.logo_tipo ? undefined : 'building'}
                                />
                            ))}
                        </div>
                    </>
                )}
            </>
        );
    };

    const modalVisible = isOpen && !isEmpresaViewOpen;

    const handleModalToggle = (value) => {
        if (!value) {
            setIsOpen(false);
        } else {
            setIsOpen(true);
        }
    };

    return (
        <>
            <ViewModal isOpen={modalVisible} setIsOpen={handleModalToggle}>
                <HeaderModal
                    title="Buscar Asociados"
                    onClose={() => handleModalToggle(false)}
                />
                <div className={styles.modalContent}>
                    <InputNormal
                        tipo="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar empresa"
                        icon="search"
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                    />

                    <Boton
                        className="btn-original"
                        onClick={handleSearch}
                        label="Buscar"
                        loading={loading}
                        disabled={loading || !searchTerm.trim()}
                    />
             
                    {renderContent()}
                </div>
            </ViewModal>
            {selectedEmpresa && (
                <EmpresaView 
                    isOpen={isEmpresaViewOpen} 
                    setIsOpen={setIsEmpresaViewOpen}
                    empresa={selectedEmpresa}
                />
            )}
        </>
    );
}

export default AsociadosSearch;

