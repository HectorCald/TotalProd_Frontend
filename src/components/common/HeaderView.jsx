import React, { useCallback } from 'react';
import styles from './HeaderView.module.css';
import { BoxIcon } from 'boxicons-react';
import SearchHeader from './SearchHeader';

export const normalizeSearchValue = (text) => {
    if (!text) return '';
    const base = text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[-_/]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!base) return '';

    const variations = new Set([base]);
    const collapsed = base.replace(/\s+/g, '');
    if (collapsed) {
        variations.add(collapsed);
    }

    const tokens = base.split(' ').filter(Boolean);
    if (tokens.length > 1) {
        const sortedCollapsed = tokens.slice().sort().join('');
        if (sortedCollapsed) {
            variations.add(sortedCollapsed);
        }
        const reversedCollapsed = tokens.slice().reverse().join('');
        if (reversedCollapsed) {
            variations.add(reversedCollapsed);
        }
    }

    return Array.from(variations).join('|');
};

export const splitNormalizedVariants = (value = '') => {
    if (!value) return [];
    return value.split('|').map(variant => variant.trim()).filter(Boolean);
};

export const normalizedIncludes = (sourceNormalized = '', queryNormalized = '') => {
    if (!queryNormalized) return true;
    const sourceVariants = splitNormalizedVariants(sourceNormalized);
    if (sourceVariants.length === 0) return false;
    const queryVariants = splitNormalizedVariants(queryNormalized);
    if (queryVariants.length === 0) return false;
    return queryVariants.some(queryVariant =>
        sourceVariants.some(sourceVariant => sourceVariant.includes(queryVariant))
    );
};

export const getPrimaryNormalizedValue = (value = '') => {
    const [primary = ''] = splitNormalizedVariants(value);
    return primary;
};

const HeaderView = ({
    title, 
    onBack = () => {}, 
    // Props para el buscador
    showSearch = false,
    searchPlaceholder = 'Buscar...',
    searchValue = '',
    onSearchChange = () => {},
    onSearchClear = () => {},
    onSearchNormalizedChange = () => {},
    searchExpanded = false,
    onSearchToggle = () => {},
    // Prop para ajustar el header cuando hay canasta abierta
    withCart = false,
    // Prop para ocultar la flecha de regreso
    showBackButton = true,
    // Contenido adicional a la derecha (botones, etc.)
    rightContent = null
}) => {
    const handleSearchChange = useCallback((value) => {
        const normalizedValue = normalizeSearchValue(value);
        onSearchChange(value);
        onSearchNormalizedChange(normalizedValue);
    }, [onSearchChange, onSearchNormalizedChange]);

    const handleSearchClear = useCallback(() => {
        onSearchChange('');
        onSearchNormalizedChange('');
        onSearchClear();
    }, [onSearchChange, onSearchClear, onSearchNormalizedChange]);

    return (
        <div className={`${styles.headerView} ${withCart ? styles.headerViewWithCart : ''}`}>
            <div className={styles.headerLeft}>
                {showBackButton ? (
                    <button className={styles.headerViewButton} onClick={onBack}>
                        <BoxIcon name='left-arrow-alt' className={styles.icon}/>
                    </button>
                ) : (
                    <span className={styles.headerPlaceholder} />
                )}
            </div>
            
            {title && <h1 className={styles.headerViewTitle}>{title}</h1>}
            
            <div className={styles.headerRight}>
                {rightContent}
                {/* Buscador expandible */}
                {showSearch && (
                    <div className={styles.searchWrapper}>
                        <SearchHeader
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={handleSearchChange}
                            onClear={handleSearchClear}
                            isExpanded={searchExpanded}
                            onToggle={onSearchToggle}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeaderView;