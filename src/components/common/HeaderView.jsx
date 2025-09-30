import React from 'react';
import styles from './HeaderView.module.css';
import { BoxIcon } from 'boxicons-react';
import SearchHeader from './SearchHeader';

const HeaderView = ({
    title, 
    onBack, 
    // Props para el buscador
    showSearch = false,
    searchPlaceholder = 'Buscar...',
    searchValue = '',
    onSearchChange = () => {},
    onSearchClear = () => {},
    searchExpanded = false,
    onSearchToggle = () => {}
}) => {
    return (
        <div className={styles.headerView}>
            <div className={styles.headerLeft}>
                <button className={styles.headerViewButton} onClick={onBack}>
                    <BoxIcon name='left-arrow-alt' className={styles.icon}/>
                </button>
            </div>
            
            {title && <h1 className={styles.headerViewTitle}>{title}</h1>}
            
            <div className={styles.headerRight}>
                {/* Buscador expandible */}
                {showSearch && (
                    <div className={styles.searchWrapper}>
                        <SearchHeader
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={onSearchChange}
                            onClear={onSearchClear}
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