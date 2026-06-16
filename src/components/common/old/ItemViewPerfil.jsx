import React from 'react';
import styles from './ItemViewPerfil.module.css';
import { BoxIcon } from 'boxicons-react';

const ItemViewPerfil = ({ 
    title, 
    description, 
    image, 
    icon, 
    badges = [],
    customIcon 
}) => {
    return (
        <div className={styles.perfilContainer}>
            <div className={styles.perfilContent}>
                <div className={styles.perfilImageContainer}>
                    {customIcon ? (
                        customIcon
                    ) : image ? (
                        <div 
                            className={styles.perfilImage}
                            style={{ 
                                backgroundImage: `url(${image})`,
                            }}
                        />
                    ) : icon ? (
                        <div className={styles.perfilIconContainer}>
                            <BoxIcon name={icon} className={styles.perfilIcon} />
                        </div>
                    ) : null}
                </div>
                
                <div className={styles.perfilTextContainer}>
                    {title && (
                        <h1 className={styles.perfilTitle}>{title}</h1>
                    )}
                    
                    {description && (
                        <p className={styles.perfilDescription}>{description}</p>
                    )}
                </div>
            </div>
            
            {badges.length > 0 && (
                <div className={styles.perfilBadges}>
                    {badges.map((badge, index) => (
                        <div 
                            key={index} 
                            className={`${styles.badge} ${badge.onClick ? styles.badgeClickable : ''}`}
                            style={{
                                backgroundColor: badge.backgroundColor || 'var(--quaternary-color)',
                                color: badge.color || 'var(--white-color)'
                            }}
                            onClick={badge.onClick}
                        >
                            {badge.icon && (
                                <BoxIcon name={badge.icon} className={styles.badgeIcon} />
                            )}
                            {badge.text && (
                                <span className={styles.badgeText}>{badge.text}</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ItemViewPerfil;

