import React from 'react';
import styles from './Logo.module.css';

const POSITION_CLASS = {
    right: 'posRight',
    left: 'posLeft',
    top: 'posTop',
    bottom: 'posBottom',
};

const LogoAnimation = ({ 
    size, 
    height, 
    width, 
    className = '', 
    style = {}, 
    alt = 'TotalProd Logo',
    showIcon,
    hideIcon,
    short,
    showText = true,
    textPosition = 'right',
    ...props 
}) => {
    const formatDimension = (val) => {
        if (val === undefined || val === null) return undefined;
        return typeof val === 'number' ? `${val}px` : val;
    };

    // El icono es cuadrado: si solo se define una dimensión, la otra toma el mismo valor
    // para reservar el espacio antes de que la imagen termine de cargar.
    const baseDimension = size || height || width || 70;
    const finalWidth = formatDimension(width || baseDimension);
    const finalHeight = formatDimension(height || baseDimension);

    const icon = (
        <img
            src={`${process.env.PUBLIC_URL || ''}/icon-redondo.png`}
            alt={alt}
            className={`${styles.logo} ${className}`.trim()}
            style={{
                width: finalWidth,
                height: finalHeight,
                ...style,
            }}
            {...props}
        />
    );

    if (!showText) return icon;

    const position = POSITION_CLASS[textPosition] ? textPosition : 'right';
    const isVertical = position === 'top' || position === 'bottom';
    const iconPx = parseFloat(height || size || width || 70) || 70;
    const fontSize = Math.round(iconPx * (isVertical ? 0.4 : 0.5));
    const gap = Math.round(iconPx * (isVertical ? 0.12 : 0.2));

    return (
        <span
            className={`${styles.logoWrapper} ${styles[POSITION_CLASS[position]]}`}
            style={{ gap: `${gap}px` }}
        >
            {icon}
            <span className={styles.logoText} style={{ fontSize: `${fontSize}px` }}>
                <span className={styles.logoTextTotal}>Total</span>
                <span className={styles.logoTextProd}>Prod</span>
            </span>
        </span>
    );
};

export default LogoAnimation;
