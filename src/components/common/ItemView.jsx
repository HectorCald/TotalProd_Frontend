import React from 'react';
import styles from './ItemView.module.css';
import { BoxIcon } from 'boxicons-react';

const ItemView = ({ title, description, icon, onClick, arrow, badge, flot1, flot2 }) => {  
  // Función para generar iniciales del título
  const generateInitials = (title) => {
    if (!title) return '';
    
    const words = title.trim().split(' ').filter(word => word.length > 0);
    
    if (words.length === 1) {
      // Una palabra: primera letra
      return words[0].charAt(0).toUpperCase();
    } else if (words.length >= 2) {
      // Dos o más palabras: primera letra de las dos primeras palabras
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    
    return '';
  };

  // Función para generar color basado en la letra (para el fondo)
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
    return colors[upperLetter] || '#7F8C8D'; // Color por defecto más oscuro
  };

  // Función para generar color de las iniciales (mismo color que fondo pero más chillón)
  const generateInitialsColor = (letter) => {
    const baseColor = generateColor(letter);
    
    // Convertir hex a RGB
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Hacer el color más chillón (aumentar brillo y saturación)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    // Aumentar el brillo (hacer más claro)
    const brightness = max / 255;
    const newBrightness = Math.min(1, brightness * 1.3); // 30% más brillante
    
    // Aumentar la saturación
    const delta = max - min;
    const saturation = delta === 0 ? 0 : delta / max;
    const newSaturation = Math.min(1, saturation * 1.5); // 50% más saturado
    
    // Aplicar brillo y saturación
    const newMax = Math.round(255 * newBrightness);
    const newR = Math.round(newMax - (newMax - r) * newSaturation);
    const newG = Math.round(newMax - (newMax - g) * newSaturation);
    const newB = Math.round(newMax - (newMax - b) * newSaturation);
    
    // Convertir de vuelta a hex
    const toHex = (n) => {
      const hex = Math.min(255, Math.max(0, n)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
  };

  // Función para generar color más claro
  const generateLighterColor = (color) => {
    // Convertir hex a RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Retornar el mismo color pero con transparencia (0.3 = 30% opacidad)
    return `rgba(${r}, ${g}, ${b}, 0.3)`;
  };

  // Generar iniciales si no hay icono
  const initials = !icon ? generateInitials(title) : '';
  const initialsColor = initials ? generateInitialsColor(initials.charAt(0)) : '';
  const initialsBackgroundColor = initials ? generateLighterColor(generateColor(initials.charAt(0))) : '';

  return (
    <div className={styles.itemView} onClick={onClick}>
      <div className={styles.itemViewIcon} style={{ backgroundColor: icon ? 'rgba(40, 180, 152, 0.3)' : initialsBackgroundColor }}>
        {icon ? (
          <BoxIcon name={icon} className={styles.icon} />
        ) : (
          <div 
            className={styles.initialsIcon}
            style={{ 
              color: initialsColor,
            }}
          >
            {initials}
          </div>
        )}
      </div>
      <div className={styles.itemViewContent}>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>

      {arrow && (
        <div className={styles.itemViewArrow}>
          <BoxIcon name="chevron-right" className={styles.icon} />
        </div>
      )}
      {badge && (
          <div key={`badge-${badge}`} className={styles.badge}>
            {badge}
          </div>
        )}
        <div className={styles.flot}>
          {flot1 ? <p className={styles.flot1}>{flot1}</p> : ''}
          {flot2 ? <p className={styles.flot2}>{flot2}</p> : ''}
        </div>
        
    </div>
  );
};

export default ItemView;
