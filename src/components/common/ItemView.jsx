import React from 'react';
import styles from './ItemView.module.css';
import { BoxIcon } from 'boxicons-react';

const ItemView = ({ title, description, icon, onClick, arrow, entrada, entradaData }) => {  
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

  // Función para generar color basado en la letra
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
  const initialsColor = initials ? generateColor(initials.charAt(0)) : '';
  const initialsBackgroundColor = initials ? generateLighterColor(initialsColor) : '';

  return (
    <div className={styles.itemView} onClick={onClick}>
      <div className={styles.itemViewIcon} style={{ backgroundColor: initialsBackgroundColor }}>
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
        {entrada && description ? <p>{description}</p> : null}

        {/* Inputs dinámicos según la longitud de entradaData */}
        {entrada && entradaData?.length > 0 && (
          <div className={styles.inputsEntrada}>
            {entradaData.map((item, i) => (
              <div key={i} className={styles.inputWithLabel}>
                <p>{item.name}</p>
                <input
                  type="number"
                  inputMode= 'numeric'
                  value={item.value}
                  onChange={(e) => console.log(item.name, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {arrow && (
        <div className={styles.itemViewArrow}>
          <BoxIcon name="chevron-right" className={styles.icon} />
        </div>
      )}
    </div>
  );
};

export default ItemView;
