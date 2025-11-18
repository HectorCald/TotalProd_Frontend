import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemViewPerfil from '../../common/ItemViewPerfil';
import ComponenteFull from '../../common/ComponenteFull';

const FAVORITES_KEY = 'empresas_favoritas';

function EmpresaView({ isOpen, setIsOpen, empresa }) {
    const [favorites, setFavorites] = useState([]);
    const [isFavorite, setIsFavorite] = useState(false);

    // Cargar favoritos al montar el componente
    useEffect(() => {
        loadFavorites();
    }, []);

    // Actualizar estado de favorito cuando cambia la empresa o los favoritos
    useEffect(() => {
        if (empresa) {
            setIsFavorite(checkIsFavorite(empresa.id));
        }
    }, [empresa, favorites]);

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

    // Verificar si una empresa es favorita
    const checkIsFavorite = (empresaId) => {
        return favorites.some(fav => fav.id === empresaId);
    };

    // Guardar favoritos en localStorage
    const saveFavorites = (newFavorites) => {
        try {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
            setFavorites(newFavorites);
            // Disparar evento personalizado para notificar cambios
            window.dispatchEvent(new CustomEvent('favorites-updated'));
        } catch (error) {
            console.error('Error al guardar favoritos:', error);
        }
    };

    // Toggle favorito
    const toggleFavorite = () => {
        if (!empresa) return;

        const isFav = checkIsFavorite(empresa.id);
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
        setIsFavorite(!isFav);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    if (!empresa) {
        return null;
    }

    const displayImage = empresa.logo_tipo;

    // Preparar badges para el perfil
    const badges = [];
    
    // Badge de tipo de empresa - verificar si existe y no es null/undefined
    if (empresa.tipo && empresa.tipo !== null && empresa.tipo !== undefined && empresa.tipo !== '') {
        const tipoText = empresa.tipo === 'ventas' ? 'Ventas' : empresa.tipo === 'ventas_produccion' ? 'Ventas y Producción' : empresa.tipo;
        badges.push({
            text: tipoText,
            icon: 'store',
            backgroundColor: 'rgba(70, 130, 253, 0.2)',
            color: 'var(--info-color)'
        });
    }

    badges.push({
        text: isFavorite ? 'Asociado' : 'Asociarme',
        icon: isFavorite ? 'heart' : 'heart',
        backgroundColor: isFavorite ? 'rgba(239, 68, 68, 0.2)' : 'rgba(79, 79, 79, 0.2)',
        color: isFavorite ? 'var(--error-color)' : 'var(--quinary-color)',
        onClick: toggleFavorite
    });

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
            <HeaderView onBack={handleClose} title="Detalles de Empresa" />
            
            <div className={styles.container}>
                {/* Información de la empresa usando ItemViewPerfil */}
                <div className={styles.content} style={{ background: 'none', }}>
                <ItemViewPerfil
                    title={empresa.name || 'Sin nombre'}
                    description={empresa.description || 'Sin descripción'}
                    image={displayImage}
                    icon={displayImage ? undefined : 'building'}
                    badges={badges}
                />

                
                    <ComponenteFull
                        title="Catálogo de productos"
                        subtitle="Ver productos disponibles"
                        icon="package"
                        type="arrow"
                        onClick={() => {
                            // TODO: Implementar navegación a catálogo
                            console.log('Catálogo de productos');
                        }}
                    />
                    <ComponenteFull
                        title="Pedidos"
                        subtitle="Gestionar pedidos"
                        icon="cart"
                        type="arrow"
                        onClick={() => {
                            // TODO: Implementar navegación a pedidos
                            console.log('Pedidos');
                        }}
                    />
                    <ComponenteFull
                        title="Transferencias"
                        subtitle="Realizar transferencias"
                        icon="transfer"
                        type="arrow"
                        onClick={() => {
                            // TODO: Implementar navegación a transferencias
                            console.log('Transferencias');
                        }}
                    />
                </div>
            </div>
        </View>
    );
}

export default EmpresaView;

