import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Input from '../../common/inputs/Input';
import Boton from '../../common/Boton';
import ItemView from '../../common/ItemView';
import NoData from '../../common/NoData';
import EmpresaService from '../../../services/empresaService';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';

const FAVORITES_KEY = 'empresas_favoritas';

function AsociadosSearch({ isOpen, setIsOpen }) {
    const { sucursalSeleccionada: sucursalSeleccionadaUsuario } = useUser();
    const { employee, sucursalSeleccionada: sucursalSeleccionadaEmpleado } = useEmployee();
    const isEmployeeMode = !!employee;
    const sucursalSeleccionada = isEmployeeMode ? sucursalSeleccionadaEmpleado : sucursalSeleccionadaUsuario;
    const empresaIdActual = sucursalSeleccionada?.empresas?.id;

    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [empresas, setEmpresas] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [favorites, setFavorites] = useState([]);

    // Cargar favoritos al montar el componente
    useEffect(() => {
        loadFavorites();
    }, []);

    // Recargar favoritos y limpiar búsqueda cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            loadFavorites();
            setSearchTerm('');
            setEmpresas([]);
            setHasSearched(false);
            setLoading(false);
        }
    }, [isOpen]);

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

    // Verificar si es la empresa actual (no se puede agregar como favorito)
    const esEmpresaActual = (empresaId) => empresaId && empresaIdActual && empresaId === empresaIdActual;

    // Toggle favorito
    const toggleFavorite = (empresa) => {
        if (esEmpresaActual(empresa.id)) return;

        const isFav = isFavorite(empresa.id);
        let newFavorites;

        if (isFav) {
            newFavorites = favorites.filter(fav => fav.id !== empresa.id);
        } else {
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
                <p className={styles.subTitle}>SOCIOS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '20px' }}>
                    {favorites.map((empresa) => (
                        <ItemView
                            key={empresa.id}
                            title={empresa.name || 'Sin nombre'}
                            description={empresa.description || 'Sin descripción'}
                            circulo={true}
                            transparent={false}
                            showFavorite={!esEmpresaActual(empresa.id)}
                            isFavorite={true}
                            onFavoriteToggle={() => toggleFavorite(empresa)}
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
        // Si no se ha buscado, mostrar solo favoritos (sin mensaje de NoData)
        if (!hasSearched) {
            return <>{renderFavoritos()}</>;
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
                    <p className={styles.subTitle}>RESULTADOS DE BÚSQUEDA</p>
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
                                    showFavorite={!esEmpresaActual(empresa.id)}
                                    isFavorite={isFavorite(empresa.id)}
                                    onFavoriteToggle={() => toggleFavorite(empresa)}
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

    const handleModalToggle = (value) => {
        if (!value) {
            setIsOpen(false);
        } else {
            setIsOpen(true);
        }
    };

    return (
        <>
            <ViewModal isOpen={isOpen} setIsOpen={handleModalToggle}>
                <HeaderModal
                    title="Socios"
                    onClose={() => handleModalToggle(false)}
                />
                <div className={styles.modalContent}>
                    <Input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar empresa"
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
        </>
    );
}

export default AsociadosSearch;