import React, { useRef, useEffect, useState } from 'react';
import styles from './ItemView.module.css';
import { BoxIcon } from 'boxicons-react';
import useAutoFitText from '../../hooks/useAutoFitText';

const ItemView = ({ title, description, description2, icon, onClick, arrow, badge, flot1, flot2, flot3, flot4, flot5, flot6, circulo = true, transparent = true, colorIcon = 'default', style = {} }) => {
  // Hook para ajuste automático de texto
  const titleContainerRef = useRef(null);
  const [availableWidth, setAvailableWidth] = useState(200); // Ancho por defecto
  
  // Calcular el ancho disponible para el título
  useEffect(() => {
    const updateAvailableWidth = () => {
      if (titleContainerRef.current) {
        const containerWidth = titleContainerRef.current.offsetWidth;
        
        // Calcular el espacio ocupado por elementos flot de forma más precisa
        let flotSpace = 0;
        const hasFlots = flot1 || flot2 || flot3 || flot4 || flot5 || flot6;
        
        if (hasFlots) {
          // Contar cuántos elementos flot hay para estimar el espacio
          const flotCount = [flot1, flot2, flot3, flot4, flot5, flot6].filter(Boolean).length;
          // Cada elemento flot ocupa aproximadamente 50-60px
          flotSpace = flotCount * 55;
        }
        
        // Calcular el espacio disponible
        const availableSpace = containerWidth - flotSpace - 20; // 20px de margen de seguridad
        
        // Asegurar un mínimo razonable
        setAvailableWidth(Math.max(100, availableSpace));
      }
    };

    // Delay para asegurar que el layout esté estable
    const timeoutId = setTimeout(updateAvailableWidth, 50);
    window.addEventListener('resize', updateAvailableWidth);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateAvailableWidth);
    };
  }, [flot1, flot2, flot3, flot4, flot5, flot6]);

  // Usar el hook de ajuste automático de texto
  const { fontSize, textRef } = useAutoFitText(title, availableWidth, 11, 14);

  // Debug temporal - remover después
  useEffect(() => {
    if (title && availableWidth > 0) {
      console.log(`Título: "${title}" | Ancho disponible: ${availableWidth}px | Tamaño fuente: ${fontSize}px`);
    }
  }, [title, availableWidth, fontSize]);

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

  // Función para obtener la clase CSS del icono
  const getIconClass = () => {
    const classMap = {
      'rojo': styles.iconRed,
      'verde': styles.iconGreen,
      'azul': styles.iconBlue,
      'gris': styles.iconGrey,
      'default': ''
    };
    return classMap[colorIcon] || classMap['default'];
  };

  // Función simple para obtener el color del fondo del icono
  const getIconBackgroundColor = () => {
    const backgroundMap = {
      'rojo': 'rgba(239, 68, 68, 0.2)',
      'verde': 'rgba(34, 197, 94, 0.2)',
      'azul': 'rgba(59, 130, 246, 0.2)',
      'gris': 'var(--tertiary-color)',
      'default': 'rgba(40, 180, 152, 0.3)'
    };
    return backgroundMap[colorIcon] || backgroundMap['default'];
  };

  // Generar iniciales si no hay icono
  const initials = !icon ? generateInitials(title) : '';
  const initialsColor = initials ? generateInitialsColor(initials.charAt(0)) : '';
  const initialsBackgroundColor = initials ? generateLighterColor(generateColor(initials.charAt(0))) : '';

  return (
    <div className={styles.itemView} onClick={onClick} style={{ backgroundColor: transparent ? 'transparent' : 'var(--tertiary-color)', borderRadius: transparent ? '0' : '20px', ...style }}>
      {circulo && (
        <div className={styles.itemViewIcon} style={{ backgroundColor: icon ? getIconBackgroundColor() : initialsBackgroundColor }}>
          {icon ? (
            <BoxIcon
              name={icon}
              className={`${styles.icon} ${getIconClass()}`}
            />
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
      )}
      <div className={styles.itemViewContent}>
        <div className={styles.titleContainer} ref={titleContainerRef}>
          <h1 
            ref={textRef}
            className={styles.title}
            style={{ fontSize: `${fontSize}px` }}
          >
            {title}
          </h1>
          <div className={styles.flot}>
            {flot1 ? <p className={styles.flot1}>{flot1}</p> : ''}
            {flot2 ? <p className={styles.flot2}>{flot2}</p> : ''}
            {flot3 ? <p className={styles.flot3}>{flot3}</p> : ''}
            {flot4 ? <p className={styles.flot4}>{flot4}</p> : ''}
            {flot5 ? <p className={styles.flot5}>{flot5}</p> : ''}
            {flot6 ? <p className={styles.flot6}>{flot6}</p> : ''}
          </div>
        </div>
        {description ? <p className={styles.description}>{description}</p> : null}
        {description2 ? <p className={styles.description}>{description2}</p> : null}
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
    </div>
  );
};

export default ItemView;
