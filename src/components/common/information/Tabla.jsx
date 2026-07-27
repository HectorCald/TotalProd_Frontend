import React, { useState, useEffect, useRef } from 'react';
import styles from './Tabla.module.css';
import Boton from '../botones/Boton';
import Input from '../inputs/Input';
import Skeleton from '../widgets/Skeleton';
import { BoxIcon } from 'boxicons-react';
import FilterMultiple from '../widgets/FilterMultiple';
import { useLayout } from '../../../context/LayoutContext';
import BotonIcon from '../botones/BotonIcon';
import ItemMobile from './ItemMobile';

const colorsMap = {
    A: '#FF5A5F', // Red/Coral
    B: '#0288D1', // Blue
    C: '#4CAF50', // Green
    D: '#FF9F1C', // Orange
    E: '#9C27B0', // Purple
    F: '#00A896', // Teal
    G: '#E91E63', // Deep Pink
    H: '#E53E3E', // Red (specifically requested)
    I: '#00B5D8', // Cyan
    J: '#FFCD38', // Yellow
    K: '#795548', // Brown
    L: '#607D8B', // Blue Grey
    M: '#3182CE', // Blue
    N: '#38A169', // Green
    O: '#DD6B20', // Orange
    P: '#805AD5', // Purple
    Q: '#319795', // Teal
    R: '#D69E2E', // Yellow/Gold
    S: '#D53F8C', // Pink
    T: '#4A5568', // Slate
    U: '#48BB78', // Light Green
    V: '#667EEA', // Indigo
    W: '#9F7AEA', // Violet
    X: '#ED64A6', // Pinkish
    Y: '#ECC94B', // Gold
    Z: '#5A67D8'  // Royal Blue
};

const getInitialColor = (name) => {
    if (!name) return '#a0aec0';
    const char = name.trim().charAt(0).toUpperCase();
    return colorsMap[char] || '#a0aec0';
};

const Tabla = ({
    data = [],
    columns = [],
    isLoading = false,
    isLoadingMore = false,
    acciones = [],
    buttonLabel,
    buttonIcon = 'plus',
    onButtonClick,
    searchPlaceholder = 'Buscar',
    searchKeys = [],
    sortKey,
    onRowClick,
    onLoadMore,
    remote = false,
    searchValue,
    onSearchChange,
    externalFilters,
    onFiltersChange,
    filters,
    containerStyle,
    mobileCustomControls
}) => {
    const { isLargeScreen } = useLayout();
    const [localSearch, setLocalSearch] = useState('');
    const [localFilters, setLocalFilters] = useState({});

    const search = searchValue !== undefined ? searchValue : localSearch;
    const setSearch = onSearchChange || setLocalSearch;

    const activeFilters = externalFilters !== undefined ? externalFilters : localFilters;
    const setActiveFilters = onFiltersChange || setLocalFilters;

    const [activeDropdown, setActiveDropdown] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

    const defaultFilters = [
        {
            id: 'sort_order',
            title: 'Ordenamiento',
            singleSelect: true,
            options: [
                { label: 'A - Z', value: 'asc' },
                { label: 'Z - A', value: 'desc' }
            ]
        }
    ];

    const filtersToUse = filters || defaultFilters;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest(`.${styles.dropdownContainer}`)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Filter rows based on search input and searchKeys
    const filteredData = remote ? data : data.filter(row => {
        if (!search) return true;
        
        const normalize = (str) => {
            if (str === null || str === undefined) return '';
            return String(str)
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Remove accents
                .replace(/[-*]/g, "") // Remove dashes and asterisks
                .toLowerCase();
        };
        
        const searchNorm = normalize(search);

        if (searchKeys.length > 0) {
            return searchKeys.some(key => {
                const val = row[key];
                return val && normalize(val).includes(searchNorm);
            });
        }
        // Fallback: search in all keys
        return Object.values(row).some(val =>
            val && normalize(val).includes(searchNorm)
        );
    });

    // Sort rows based on sortKey
    const sortedData = [...filteredData];
    if (!remote && sortKey) {
        sortedData.sort((a, b) => {
            const valA = String(a[sortKey] || '');
            const valB = String(b[sortKey] || '');
            const direction = (activeFilters.sort_order && activeFilters.sort_order[0] === 'desc') ? -1 : 1;
            return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' }) * direction;
        });
    }

    const handleScroll = (e) => {
        if (!onLoadMore || isLoading || isLoadingMore) return;
        const { scrollTop, clientHeight, scrollHeight } = e.target;
        // Trigger when within 50px of the bottom
        if (scrollHeight - scrollTop - clientHeight < 50) {
            onLoadMore();
        }
    };

    const loaderRef = useRef(null);
    const loaderMobileRef = useRef(null);

    useEffect(() => {
        if (!onLoadMore || isLoading || isLoadingMore) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                onLoadMore();
            }
        }, {
            root: null,
            rootMargin: '150px',
            threshold: 0.1
        });

        const currentLoader = isLargeScreen ? loaderRef.current : loaderMobileRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [onLoadMore, isLoading, isLoadingMore, isLargeScreen, data]);

    return (
        <div className={styles.container} style={containerStyle}>
            <div className={styles.header}>
                <div className={styles.searchWrapper} style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, maxWidth: '600px' }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            tipo="text"
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            isSearch={true}
                            style={{ margin: '0' }}
                        />
                    </div>
                    <FilterMultiple
                        filters={filtersToUse}
                        onApply={(filters) => setActiveFilters(filters)}
                        activeFilters={activeFilters}
                    />
                </div>
                {onButtonClick && (
                    <div>
                        {isLargeScreen ? (
                            <Boton
                                className="btn-primary"
                                label={buttonLabel}
                                iconName={buttonIcon}
                                onClick={onButtonClick}
                            />
                        ) : (
                            <BotonIcon
                                className="btn-primary"
                                iconName={buttonIcon}
                                onClick={onButtonClick}
                            />
                        )}
                    </div>
                )}
            </div>

            {isLargeScreen ? (
                <div className={styles.tableWrapper} onScroll={handleScroll}>
                    <table className={styles.table}>
                    <thead>
                        <tr>
                            {columns.filter(c => !c.hiddenOnDesktop).map((col, index) => (
                                <th key={index} className={styles.th} style={{ width: col.width }}>
                                    {typeof col.header === 'string' ? col.header.toUpperCase() : col.header}
                                </th>
                            ))}
                            {acciones && acciones.length > 0 && <th className={styles.th}></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, index) => (
                                <tr key={index} className={styles.tr}>
                                    {columns.filter(c => !c.hiddenOnDesktop).map((col, colIdx) => (
                                        <td key={colIdx} className={styles.td}>
                                            <Skeleton width={col.skeletonWidth || "70%"} height="16px" />
                                        </td>
                                    ))}
                                    {acciones && acciones.length > 0 && (
                                        <td className={styles.td}>
                                            <Skeleton width="20px" height="20px" borderRadius="50%" />
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : sortedData.length > 0 ? (
                            sortedData.map((row, idx) => {
                                const rowKey = row.id || `row-${idx}`;
                                return (
                                    <tr
                                        key={rowKey}
                                        className={styles.tr}
                                        onClick={() => onRowClick && onRowClick(row)}
                                        style={onRowClick ? { cursor: 'pointer' } : {}}
                                    >
                                        {columns.filter(c => !c.hiddenOnDesktop).map((col, colIdx) => {
                                            const cellValue = row[col.accessor];
                                            let cellContent = col.render ? col.render(row) : (cellValue ?? '--');

                                            if (!col.render) {
                                                if (col.hasIcon) {
                                                    const valueStr = cellValue || '';
                                                    cellContent = (
                                                        <div className={styles.nombreCell}>
                                                            <div className={styles.iconContainer}>
                                                                <BoxIcon
                                                                    name={col.iconName || 'user'}
                                                                    className={styles.userIcon}
                                                                />
                                                            </div>
                                                            <span>{valueStr || 'Sin nombre'}</span>
                                                        </div>
                                                    );
                                                } else if (col.hasStatusDot || col.hasStatus) {
                                                    const status = col.statusType ? col.statusType(row) : 'default';
                                                    cellContent = (
                                                        <div className={`${styles.statusCell} ${styles[status] || ''}`}>
                                                            {col.hasStatusDot && <span className={styles.dot}></span>}
                                                            <span>{cellValue}</span>
                                                        </div>
                                                    );
                                                } else if (col.isBadgeArray) {
                                                    const arr = Array.isArray(cellValue) ? cellValue : (cellValue ? [cellValue] : []);
                                                    if (arr.length === 0) {
                                                        cellContent = '--';
                                                    } else {
                                                        const displayItems = arr.slice(0, 3);
                                                        const extraCount = arr.length - 3;
                                                        const bColor = col.badgeColor ? (typeof col.badgeColor === 'function' ? col.badgeColor(row) : col.badgeColor) : 'var(--primary-color)';
                                                        
                                                        cellContent = (
                                                          <div className={styles.badgeArrayContainer}>
                                                            {displayItems.map((item, idx) => (
                                                              <span key={idx} className={styles.badge} style={{
                                                                color: bColor,
                                                                backgroundColor: `color-mix(in srgb, ${bColor} 12%, transparent)`
                                                              }}>
                                                                {item}
                                                              </span>
                                                            ))}
                                                            {extraCount > 0 && (
                                                              <span className={styles.badgeExtra} style={{
                                                                color: bColor,
                                                                backgroundColor: `color-mix(in srgb, ${bColor} 20%, transparent)`
                                                              }} title={arr.slice(3).join(', ')}>
                                                                +{extraCount}
                                                              </span>
                                                            )}
                                                          </div>
                                                        );
                                                    }
                                                } else if (col.isBadge) {
                                                    const bColor = col.badgeColor ? (typeof col.badgeColor === 'function' ? col.badgeColor(row) : col.badgeColor) : 'var(--info-color)';
                                                    cellContent = (
                                                        <span className={styles.badgeSingle} style={{
                                                            color: bColor,
                                                            backgroundColor: `color-mix(in srgb, ${bColor} 12%, transparent)`
                                                        }}>
                                                            {cellValue ?? '--'}
                                                        </span>
                                                    );
                                                } else if (col.truncate) {
                                                    cellContent = (
                                                        <div
                                                            style={{
                                                                maxWidth: col.maxWidth || '250px',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}
                                                            title={cellValue || ''}
                                                        >
                                                            {cellValue || '--'}
                                                        </div>
                                                    );
                                                }
                                            }

                                            return (
                                                <td
                                                    key={colIdx}
                                                    className={`${styles.td} ${col.className || ''}`}
                                                    style={{ ...col.style, width: col.width }}
                                                >
                                                    {cellContent}
                                                </td>
                                            );
                                        })}
                                        {acciones && acciones.length > 0 && (
                                            <td className={styles.td}>
                                                {(() => {
                                                    const visibleAcciones = acciones.filter(accion => !accion.show || accion.show(row));
                                                    if (visibleAcciones.length === 0) return null;
                                                    return (
                                                        <div className={styles.dropdownContainer}>
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (activeDropdown === rowKey) {
                                                                        setActiveDropdown(null);
                                                                    } else {
                                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                                        const menuHeight = visibleAcciones.length * 45 + 16;
                                                                        let topPos = rect.bottom;
                                                                        if (topPos + menuHeight > window.innerHeight) {
                                                                            topPos = rect.top - menuHeight;
                                                                        }
                                                                        setDropdownPos({
                                                                            top: topPos,
                                                                            right: window.innerWidth - rect.right
                                                                        });
                                                                        setActiveDropdown(rowKey);
                                                                    }
                                                                }}
                                                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                            >
                                                                <BoxIcon
                                                                    name="dots-vertical-rounded"
                                                                    className={styles.actions}
                                                                />
                                                            </div>
                                                            {activeDropdown === rowKey && (
                                                                <div
                                                                    className={styles.dropdownMenu}
                                                                    style={{ top: `${dropdownPos.top}px`, right: `${dropdownPos.right}px` }}
                                                                >
                                                                    {visibleAcciones.map((accion, actIdx) => (
                                                                        <div
                                                                            key={actIdx}
                                                                            className={styles.dropdownItem}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                accion.onClick(row);
                                                                                setActiveDropdown(null);
                                                                            }}
                                                                        >
                                                                            {accion.icon && <BoxIcon name={accion.icon} className={styles.icon} />}
                                                                            <span>{accion.name}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={columns.filter(c => !c.hiddenOnDesktop).length + (acciones && acciones.length > 0 ? 1 : 0)} className={styles.td} style={{ textAlign: 'center' }}>
                                    No hay datos
                                </td>
                            </tr>
                        )}
                        {isLoadingMore && (
                            <tr className={styles.tr}>
                                {columns.filter(c => !c.hiddenOnDesktop).map((col, colIdx) => (
                                    <td key={colIdx} className={styles.td}>
                                        <Skeleton width={col.skeletonWidth || "70%"} height="16px" />
                                    </td>
                                ))}
                                {acciones && acciones.length > 0 && (
                                    <td className={styles.td}>
                                        <Skeleton width="20px" height="20px" borderRadius="50%" />
                                    </td>
                                )}
                            </tr>
                        )}
                        {onLoadMore && !isLoading && !isLoadingMore && (
                            <tr ref={loaderRef} style={{ height: '1px' }}>
                                <td colSpan={columns.filter(c => !c.hiddenOnDesktop).length + (acciones && acciones.length > 0 ? 1 : 0)} style={{ padding: 0 }} />
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            ) : (
                <div className={styles.mobileListWrapper} onScroll={handleScroll}>
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                                <Skeleton width="100%" height="60px" borderRadius="8px" />
                            </div>
                        ))
                    ) : sortedData.length > 0 ? (
                        sortedData.map((row, idx) => {
                            const rowKey = row.id || `row-${idx}`;
                            const mainCol = columns.find(c => c.isMobileMain) || columns.find(c => c.hasIcon) || columns[0];
                            const statusCol = columns.find(c => c.isMobileStatus) || columns.find(c => c.hasStatusDot || c.hasStatus || c.isBadge);
                            const status2Col = columns.find(c => c.isMobileStatus2);
                            const subtitleCol = columns.find(c => c.isMobileSubtitle) || columns.find(c => c !== mainCol && c !== statusCol && c !== status2Col);

                            const title = mainCol?.mobileRender ? mainCol.mobileRender(row) : (mainCol?.render ? mainCol.render(row) : (row[mainCol?.accessor] || '--'));
                            const status = statusCol ? (statusCol.mobileRender ? statusCol.mobileRender(row) : (statusCol.render ? statusCol.render(row) : row[statusCol.accessor])) : '';
                            const statusType = statusCol && statusCol.statusType ? statusCol.statusType(row) : 'default';
                            
                            const status2 = status2Col ? (status2Col.mobileRender ? status2Col.mobileRender(row) : (status2Col.render ? status2Col.render(row) : row[status2Col.accessor])) : '';
                            const status2Type = status2Col && status2Col.statusType ? status2Col.statusType(row) : 'default';

                            const subtitle = subtitleCol ? (subtitleCol.mobileRender ? subtitleCol.mobileRender(row) : (subtitleCol.render ? subtitleCol.render(row) : row[subtitleCol.accessor])) : '';
                            
                            // Si la columna principal tiene render, probablemente devuelve JSX. ItemMobile espera string en title, 
                            // pero React puede renderizar JSX en el title.
                            const icon = mainCol?.mobileIcon ? mainCol.mobileIcon(row) : (mainCol?.iconName || 'box');
                            const iconType = mainCol?.mobileIconType ? mainCol.mobileIconType(row) : 'default';

                            return (
                                <ItemMobile
                                    key={rowKey}
                                    icon={icon}
                                    iconType={iconType}
                                    title={title}
                                    subtitle={subtitle}
                                    status={status}
                                    statusType={statusType}
                                    status2={status2}
                                    status2Type={status2Type}
                                    customControls={mobileCustomControls ? mobileCustomControls(row) : null}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    actions={acciones ? acciones.map(a => ({
                                        ...a,
                                        onClick: () => a.onClick(row)
                                    })) : []}
                                />
                            );
                        })
                    ) : (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#718096', fontSize: '13px' }}>
                            No hay datos
                        </div>
                    )}
                    {isLoadingMore && (
                        <div style={{ padding: '12px 0' }}>
                            <Skeleton width="100%" height="60px" borderRadius="8px" />
                        </div>
                    )}
                    {onLoadMore && !isLoading && !isLoadingMore && (
                        <div ref={loaderMobileRef} style={{ height: '1px' }} />
                    )}
                </div>
            )}
        </div>
    );
};

export default Tabla;
