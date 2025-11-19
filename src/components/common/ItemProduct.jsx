import React, { useState, useEffect } from 'react';
import styles from './ItemProduct.module.css';
import { BoxIcon } from 'boxicons-react';
import { motion } from 'framer-motion';

const ItemProduct = ({ 
    title, 
    descriptionBadge, 
    descriptionBadgeColor = 'default', // 'default', 'info', 'warning', 'error', 'success'
    description2, 
    icon, 
    onClick, 
    precio, // Precio actual del producto
    unidadMedida, // Unidad de medida del producto (ej: 'kg', 'l', 'm')
    unidadMedidaNombre, // Nombre completo de la unidad de medida (ej: 'Kilogramo', 'Litro')
    unidadMedidaPedido, // Unidad de medida del pedido cuando está agregado (ej: 'kg', 'qq', 'l')
    showStockControls = false,
    cantidad = 0,
    onCantidadChange,
    onCantidadIncrement,
    onCantidadDecrement,
    maxCantidad,
    minCantidad = 1,
    animarCantidad = false,
    cantidadInputRef,
    showArrow = false,
    disabled = false,
    style = {}
}) => {
    // Estado temporal para el input (permite borrar el 0)
    const [cantidadTemp, setCantidadTemp] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [ultimaCantidadEnviada, setUltimaCantidadEnviada] = useState(null);

    // Sincronizar cantidadTemp cuando cantidad cambia desde fuera (si no está en edición)
    useEffect(() => {
        if (!isEditing && cantidadTemp === null) {
            // Actualizar ultimaCantidadEnviada cuando cantidad cambia desde fuera
            setUltimaCantidadEnviada(cantidad || 0);
        }
    }, [cantidad, isEditing, cantidadTemp]);

    // Función para obtener la clase CSS del badge según el color
    const getBadgeColorClass = () => {
        const colorMap = {
            'info': styles.badgeInfo,
            'warning': styles.badgeWarning,
            'error': styles.badgeError,
            'success': styles.badgeSuccess,
            'default': styles.badgeDefault
        };
        return colorMap[descriptionBadgeColor] || colorMap['default'];
    };

    // Determinar si tiene cantidad en carrito
    const tieneCantidad = cantidad > 0;
    
    // Determinar si tiene acción (solo cuando hay controles de stock, no cuando solo hay arrow)
    const tieneAccion = showStockControls;

    // Función para convertir código de unidad a nombre completo
    const getUnidadMedidaCompleta = (codigo) => {
        const unidadesMap = {
            'kg': 'Kilogramo',
            'Kg': 'Kilogramo',
            'KG': 'Kilogramo',
            'qq': 'Quintal',
            'Qq': 'Quintal',
            'QQ': 'Quintal',
            'l': 'Litro',
            'L': 'Litro',
            'Lt': 'Litro',
            'lbrs': 'Libras',
            'Lbrs': 'Libras',
            'LBRS': 'Libras',
            '@': 'Arroba',
            'cj': 'Caja',
            'Cj': 'Caja',
            'CJ': 'Caja',
            'm': 'Metro',
            'M': 'Metro',
            'gr': 'Gramo',
            'Gr': 'Gramo',
            'GR': 'Gramo',
            'ml': 'Mililitro',
            'Ml': 'Mililitro',
            'ML': 'Mililitro',
            'mm': 'Milímetro',
            'Mm': 'Milímetro',
            'MM': 'Milímetro'
        };
        return unidadesMap[codigo] || codigo;
    };

    // Determinar qué unidad de medida mostrar
    const unidadAMostrar = tieneCantidad && unidadMedidaPedido
        ? getUnidadMedidaCompleta(unidadMedidaPedido)
        : (unidadMedidaNombre || (unidadMedida ? getUnidadMedidaCompleta(unidadMedida) : ''));

    // Determinar si tiene controles de stock (para ajustar padding)
    const tieneControles = showStockControls;

    return (
        <div 
            className={`${styles.itemProduct} ${tieneControles ? styles.itemProductCompact : ''} ${disabled ? styles.disabled : ''}`} 
            onClick={disabled ? undefined : onClick} 
            style={style}
            aria-disabled={disabled}
        >
            {icon && (
                <div className={`${styles.itemProductIcon} ${tieneCantidad && tieneAccion ? styles.itemProductIconActive : ''} ${!tieneAccion ? styles.itemProductIconDefault : ''}`}>
                    <BoxIcon
                        name={icon}
                        className={styles.icon}
                    />
                </div>
            )}
            <div className={styles.itemProductContent}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.title}>
                        {title}
                    </h1>
                </div>
                <div className={styles.descriptionsContainer}>
                    {descriptionBadge && (
                        <span className={`${styles.descriptionBadge} ${getBadgeColorClass()}`}>
                            {descriptionBadge}
                        </span>
                    )}
                </div>
                {/* Fila de precio y controles */}
                {(precio !== undefined || (unidadAMostrar && showStockControls) || showStockControls) && (
                    <div className={styles.precioControlsRow}>
                        {precio !== undefined ? (
                            <span className={styles.precio}>
                                {typeof precio === 'number' ? `Bs. ${precio.toFixed(2)}` : precio}
                            </span>
                        ) : (unidadAMostrar && showStockControls) ? (
                            <span className={styles.precio}>
                                {unidadAMostrar}
                            </span>
                        ) : null}
                        {showStockControls && (
                            <div className={styles.stockControls}>
                    <button
                        className={styles.btnCantidad}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onCantidadDecrement) {
                                onCantidadDecrement();
                            }
                        }}
                        disabled={cantidad <= 0}
                    >
                        <BoxIcon name='minus' className={styles.iconMinus} />
                    </button>
                    <motion.span
                        animate={animarCantidad ? { scale: [1, 1.3, 0.9, 1] } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={styles.cantidad}
                    >
                        <input
                            ref={cantidadInputRef}
                            type="number"
                            min={minCantidad}
                            max={maxCantidad}
                            value={cantidadTemp !== null && cantidadTemp !== undefined ? cantidadTemp : (cantidad || 0)}
                            onChange={(e) => {
                                const valor = e.target.value;
                                if (valor === '') {
                                    setCantidadTemp('');
                                    // No llamar a onCantidadChange mientras está vacío, solo cuando pierde el foco
                                    return;
                                }
                                const nuevaCantidad = parseInt(valor, 10);
                                if (!Number.isNaN(nuevaCantidad)) {
                                    // Si hay maxCantidad y excede el límite, ajustar automáticamente al máximo
                                    let cantidadAjustada = nuevaCantidad;
                                    if (maxCantidad !== undefined && nuevaCantidad > maxCantidad) {
                                        cantidadAjustada = maxCantidad;
                                        setCantidadTemp(cantidadAjustada);
                                    } else {
                                        setCantidadTemp(nuevaCantidad);
                                    }
                                    
                                    // Actualizar siempre que sea un número válido (incluyendo cuando cantidad era 0)
                                    if (onCantidadChange && cantidadAjustada >= 0) {
                                        onCantidadChange(cantidadAjustada);
                                        setUltimaCantidadEnviada(cantidadAjustada);
                                    }
                                }
                            }}
                            onKeyDown={(e) => {
                                // Si se presiona Enter, quitar el focus del input
                                if (e.key === 'Enter') {
                                    e.target.blur();
                                }
                            }}
                            onBlur={(e) => {
                                const valor = e.target.value;
                                setIsEditing(false);
                                setCantidadTemp(null);
                                // Siempre pasar un número válido: 0 si está vacío, o el valor parseado
                                let cantidadFinal = valor === '' ? 0 : parseInt(valor, 10) || 0;
                                // Si hay maxCantidad y excede el límite, ajustar al máximo
                                if (maxCantidad !== undefined && cantidadFinal > maxCantidad) {
                                    cantidadFinal = maxCantidad;
                                }
                                // Asegurar que sea al menos 0
                                if (cantidadFinal < 0) {
                                    cantidadFinal = 0;
                                }
                                // Solo llamar a onCantidadChange si el valor cambió desde el último onChange
                                // Esto evita que se elimine el producto cuando el usuario escribe desde 0
                                if (onCantidadChange && cantidadFinal !== ultimaCantidadEnviada) {
                                    onCantidadChange(cantidadFinal);
                                    setUltimaCantidadEnviada(cantidadFinal);
                                }
                            }}
                            onFocus={(e) => {
                                // Al hacer foco, permitir editar el valor actual (incluyendo 0)
                                setIsEditing(true);
                                const valorActual = cantidad === 0 ? 0 : (cantidad || 0);
                                setCantidadTemp(valorActual);
                                // Seleccionar todo el texto para facilitar borrar
                                e.target.select();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            enterKeyHint="done"
                        />
                    </motion.span>
                    <button
                        className={styles.btnCantidad}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onCantidadIncrement) {
                                onCantidadIncrement();
                            }
                        }}
                        disabled={maxCantidad !== undefined && cantidad >= maxCantidad}
                    >
                        <BoxIcon name='plus' className={styles.iconPlus} />
                    </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Arrow solo si no hay controles de stock */}
            {!showStockControls && showArrow && (
                <div className={styles.itemProductArrow}>
                    <BoxIcon name="chevron-right" className={styles.icon} />
                </div>
            )}
        </div>
    );
};

export default ItemProduct;

