import React from 'react';
import styles from './ItemViewInput.module.css';
import { BoxIcon } from 'boxicons-react';

// Componente basado en ItemProduct, pero con inputs en lugar de controles de stock
// Acepta un prop `inputs` para renderizar campos de entrada lado a lado
// `inputs` es un arreglo de objetos: { name, value, onChange, placeholder, type, label, inputProps }
// `diffState` puede ser 'faltante', 'sobrante' o 'igual' para cambiar colores del borde e icono
const ItemViewInput = ({ 
    title, 
    icon, 
    onClick, 
    arrow, 
    flot1, 
    flot2, 
    flot3, 
    descriptionBadge,
    descriptionBadgeColor = 'default',
    diffState = 'igual', // 'faltante', 'sobrante', 'igual'
    style = {}, 
    inputs = [] 
}) => {
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

    // Determinar clases CSS según el estado de diferencia (solo para icono ahora)

    const getIconClass = () => {
        if (diffState === 'faltante') return styles.itemViewInputIconFaltante;
        if (diffState === 'sobrante') return styles.itemViewInputIconSobrante;
        return '';
    };

  return (
        <div 
            className={styles.itemViewInput}
            onClick={onClick} 
            style={style}
        >
            {icon && (
                <div className={`${styles.itemViewInputIcon} ${getIconClass()}`}>
                    <BoxIcon
                        name={icon}
                        className={styles.icon}
                    />
            </div>
          )}
            <div className={styles.itemViewInputContent}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.title}>
                        {title}
                    </h1>
                </div>
                {descriptionBadge && (
                    <div className={styles.descriptionsContainer}>
                        <span className={`${styles.descriptionBadge} ${getBadgeColorClass()}`}>
                            {descriptionBadge}
                        </span>
        </div>
      )}
                {/* Fila de inputs lado a lado */}
                {Array.isArray(inputs) && inputs.length > 0 && (
                    <div className={styles.inputsRow}>
            {inputs.map((input, idx) => {
              const isNumber = input.type === 'number';
              const effectiveType = isNumber ? 'text' : (input.type || 'text');
              const effectiveOnChange = (e) => {
                if (isNumber) {
                  const normalized = (e.target?.value ?? '').replace(/,/g, '.');
                  if (typeof input.onChange === 'function') {
                    input.onChange({
                      ...e,
                      target: {
                        ...e.target,
                        value: normalized
                      }
                    });
                  }
                  return;
                }
                if (typeof input.onChange === 'function') input.onChange(e);
              };
              
              // Manejar Enter para desenfocar el input
              const handleKeyDown = (e) => {
                if (e.key === 'Enter') {
                  e.target.blur();
                }
              };
              
              // Determinar el color del texto según el diffState del input
              const getInputTextColor = () => {
                if (input.diffState === 'faltante') return { color: 'var(--error-color)' };
                if (input.diffState === 'sobrante') return { color: 'var(--success-color)' };
                return {};
              };

              return (
                                <div 
                                    key={input.name || idx} 
                                    className={styles.inputGroup}
                                    style={input.width ? { flex: `0 0 ${input.width}%` } : {}}
                                >
                                    {input.label && (
                                        <label className={styles.inputLabel} htmlFor={input.name || `input-${idx}`}>
                                            {input.label}
                                        </label>
                                    )}
                  <input
                    id={input.name || `input-${idx}`}
                    className={styles.inputControl}
                    type={effectiveType}
                    placeholder={input.placeholder || ''}
                    value={input.value}
                    onChange={effectiveOnChange}
                    onKeyDown={handleKeyDown}
                    enterKeyHint="done"
                    style={{ ...getInputTextColor(), ...(input.inputProps?.style || {}) }}
                    {...(input.inputProps ? (() => {
                      const { style, ...restProps } = input.inputProps;
                      return restProps;
                    })() : {})}
                    {...(isNumber ? { inputMode: 'decimal' } : {})}
                  />
                </div>
              );
            })}
          </div>
                )}
      </div>

      {arrow && (
                <div className={styles.itemViewInputArrow}>
          <BoxIcon name="chevron-right" className={styles.icon} />
        </div>
      )}
    </div>
  );
};

export default ItemViewInput;
