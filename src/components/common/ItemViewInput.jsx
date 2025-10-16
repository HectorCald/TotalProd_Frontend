import React from 'react';
import styles from './ItemViewInput.module.css';
import { BoxIcon } from 'boxicons-react';

// Componente basado en ItemView, pero sin descripción ni badge.
// En su lugar, acepta un prop `inputs` para renderizar campos de entrada.
// `inputs` es un arreglo de objetos: { name, value, onChange, placeholder, type, label, inputProps }
const ItemViewInput = ({ title, icon, onClick, arrow, flot1, flot2, flot3, flot4, flot5, flot6, circulo=true, transparent=true, gris=false, style={}, inputs=[] }) => {
  const generateInitials = (title) => {
    if (!title) return '';
    const words = title.trim().split(' ').filter(word => word.length > 0);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    } else if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return '';
  };

  const generateColor = (letter) => {
    const colors = {
      'A': '#E74C3C', 'B': '#3498DB', 'C': '#9B59B6', 'D': '#2ECC71',
      'E': '#F39C12', 'F': '#E67E22', 'G': '#1ABC9C', 'H': '#F1C40F',
      'I': '#8E44AD', 'J': '#2980B9', 'K': '#D35400', 'L': '#27AE60',
      'M': '#C0392B', 'N': '#34495E', 'O': '#E67E22', 'P': '#8E44AD',
      'Q': '#16A085', 'R': '#E74C3C', 'S': '#9B59B6', 'T': '#2ECC71',
      'U': '#F39C12', 'V': '#8E44AD', 'W': '#3498DB', 'X': '#E67E22',
      'Y': '#9B59B6', 'Z': '#16A085'
    };
    const upperLetter = letter.toUpperCase();
    return colors[upperLetter] || '#7F8C8D';
  };

  const generateInitialsColor = (letter) => {
    const baseColor = generateColor(letter);
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const brightness = max / 255;
    const newBrightness = Math.min(1, brightness * 1.3);
    const delta = max - min;
    const saturation = delta === 0 ? 0 : delta / max;
    const newSaturation = Math.min(1, saturation * 1.5);
    const newMax = Math.round(255 * newBrightness);
    const newR = Math.round(newMax - (newMax - r) * newSaturation);
    const newG = Math.round(newMax - (newMax - g) * newSaturation);
    const newB = Math.round(newMax - (newMax - b) * newSaturation);
    const toHex = (n) => {
      const hex = Math.min(255, Math.max(0, n)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
  };

  const generateLighterColor = (color) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, 0.3)`;
  };

  const initials = !icon ? generateInitials(title) : '';
  const initialsColor = initials ? generateInitialsColor(initials.charAt(0)) : '';
  const initialsBackgroundColor = initials ? generateLighterColor(generateColor(initials.charAt(0))) : '';

  return (
    <div className={styles.itemView} onClick={onClick} style={{ backgroundColor: transparent ? 'transparent' : 'var(--tertiary-color)', borderRadius: transparent ? '0' : '20px', ...style }}>
      {circulo && (
        <div className={styles.itemViewIcon} style={{ backgroundColor: gris ? 'var(--tertiary-color)' : (icon ? 'rgba(40, 180, 152, 0.3)' : initialsBackgroundColor) }}>
          {icon ? (
            <BoxIcon name={icon} className={`${styles.icon} ${gris ? styles.iconGris : ''}`} />
          ) : (
            <div 
              className={styles.initialsIcon}
              style={{ 
                color: gris ? 'var(--senary-color)' : initialsColor,
              }}
            >
              {initials}
            </div>
          )}
        </div>
      )}
      <div className={styles.itemViewContent}>
        <h1 className={styles.title}>{title}</h1>
        {/* Inputs en lugar de descripción */}
        {Array.isArray(inputs) && inputs.length > 0 ? (
          <div className={styles.inputsContainer}>
            {inputs.map((input, idx) => (
              <div key={input.name || idx} className={styles.inputRow}>
                {input.label ? <label className={styles.inputLabel} htmlFor={input.name || `input-${idx}`}>{input.label}</label> : null}
                <input
                  id={input.name || `input-${idx}`}
                  className={styles.inputControl}
                  type={input.type || 'text'}
                  placeholder={input.placeholder || ''}
                  value={input.value}
                  onChange={input.onChange}
                  {...(input.inputProps || {})}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {arrow && (
        <div className={styles.itemViewArrow}>
          <BoxIcon name="chevron-right" className={styles.icon} />
        </div>
      )}
    </div>
  );
};

export default ItemViewInput;


