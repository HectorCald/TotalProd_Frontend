import React from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './InfoCard.module.css';

const InfoCard = ({ title, subtitle, description, customBlock, tags = [], stats = [], actionButton, icon = 'user', statusDot }) => {
    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.avatar}>
                    {typeof icon === 'string' ? (
                        <i className={`bx bx-${icon.replace(/^bx-/, '')}`}></i>
                    ) : (
                        icon
                    )}
                </div>
                <div className={styles.headerInfo}>
                    {title && (
                        <h2 className={styles.title}>
                            {title}
                            {statusDot && (
                                <span 
                                    className={`${styles.statusDotTitle} ${styles[statusDot] || ''}`}
                                    title={statusDot.charAt(0).toUpperCase() + statusDot.slice(1)}
                                ></span>
                            )}
                        </h2>
                    )}
                    {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                </div>
            </div>
            
            {tags && tags.length > 0 && (
                <div className={styles.tags}>
                    {tags.map((tag, index) => {
                        const isObject = typeof tag === 'object' && tag !== null;
                        const text = isObject ? tag.text || tag.label : tag;
                        const colorClass = isObject && tag.color ? styles[tag.color] : '';
                        const hasDot = isObject && tag.hasDot;
                        const icon = isObject && tag.icon;
                        const getDefaultLabel = (tagInfo) => {
                            if (tagInfo.label) return tagInfo.label;
                            if (tagInfo.hasDot) return 'Estado';
                            switch (tagInfo.icon) {
                                case 'user': return 'Persona / Usuario';
                                case 'building': return 'Empresa / Proveedor';
                                case 'tag': return 'Categoría';
                                case 'barcode': return 'Código de Barras';
                                case 'layer': return 'Grupo';
                                case 'receipt': return 'Receta';
                                case 'transfer': return 'Movimiento';
                                case 'id-card': return 'Documento';
                                case 'phone': return 'Teléfono';
                                case 'envelope': return 'Email';
                                case 'map-pin': return 'Ubicación';
                                case 'calendar': return 'Fecha';
                                case 'time': return 'Hora';
                                case 'check-circle': return 'Verificado';
                                case 'x-circle': return 'Cancelado';
                                case 'package': return 'Producto';
                                case 'store': return 'Sucursal';
                                case 'dollar-circle': return 'Precio';
                                case 'money': return 'Dinero';
                                case 'credit-card': return 'Tarjeta';
                                case 'car': return 'Vehículo';
                                case 'briefcase': return 'Cargo';
                                default: return 'Detalle';
                            }
                        };

                        const tagLabel = isObject ? getDefaultLabel(tag) : 'Detalle';
                        const hasTooltip = isObject && (tag.label || tag.icon || tag.hasDot || (tag.tooltipItems && tag.tooltipItems.length > 0));

                        return (
                            <span 
                                key={index} 
                                className={`${styles.tag} ${colorClass} ${hasTooltip ? styles.hasTooltip : ''}`}
                            >
                                {icon && (
                                    <BoxIcon 
                                        name={icon} 
                                        className={styles.tagIcon} 
                                    />
                                )}
                                {hasDot && <span className={styles.tagDot}></span>}
                                {text}
                                {hasTooltip && (
                                    <div className={styles.tooltip}>
                                        {(!tag.tooltipItems || tag.tooltipItems.length === 0) && (
                                            <div className={styles.tooltipItem}>
                                                <span className={styles.tooltipLabel}>{tagLabel}</span>
                                            </div>
                                        )}
                                        {tag.tooltipItems && tag.tooltipItems.length > 0 && tag.tooltipItems.map((item, idx) => (
                                            <div key={idx} className={styles.tooltipItem}>
                                                <span className={styles.tooltipLabel}>{item.label}</span>
                                                <span className={styles.tooltipValue}>{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </span>
                        );
                    })}
                </div>
            )}

            {description && (
                <div className={styles.description}>
                    {description}
                </div>
            )}
            
            {stats && stats.length > 0 && (
                <div className={`${styles.stats} ${stats.length > 5 ? styles.statsMany : stats.length > 3 ? styles.statsMedium : ''}`}>
                    {stats.map((stat, index) => (
                        <div key={index} className={`${styles.statItem} ${stat.tooltipItems && stat.tooltipItems.length > 0 ? styles.hasTooltip : ''}`}>
                            <div className={styles.statValue}>
                                {stat.icon && (
                                    typeof stat.icon === 'string' ? (
                                        <BoxIcon name={stat.icon} className={styles.statIcon} />
                                    ) : (
                                        <span>{stat.icon}</span>
                                    )
                                )}
                                {stat.value}
                            </div>
                            <div className={styles.statLabel}>{stat.label}</div>
                            {stat.tooltipItems && stat.tooltipItems.length > 0 && (
                                <div className={styles.tooltip}>
                                    {stat.tooltipItems.map((item, idx) => (
                                        <div key={idx} className={styles.tooltipItem}>
                                            <span className={styles.tooltipLabel}>{item.label}</span>
                                            <span className={styles.tooltipValue}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {customBlock && (
                <div className={styles.customBlock}>
                    {customBlock}
                </div>
            )}
            
            {actionButton && (
                <div className={styles.action}>
                    {actionButton}
                </div>
            )}
        </div>
    );
};

export default InfoCard;
