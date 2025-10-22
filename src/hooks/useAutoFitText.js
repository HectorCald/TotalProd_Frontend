import { useState, useEffect, useRef } from 'react';

/**
 * Hook personalizado para ajustar automáticamente el tamaño de fuente
 * hasta que el texto quepa en el contenedor disponible
 */
const useAutoFitText = (text, maxWidth, minFontSize = 10, maxFontSize = 14) => {
  const [fontSize, setFontSize] = useState(maxFontSize);
  const textRef = useRef(null);

  useEffect(() => {
    if (!text || !textRef.current || !maxWidth || maxWidth <= 0) return;

    const element = textRef.current;
    
    // Función para medir el ancho del texto con un tamaño de fuente específico
    const measureTextWidth = (fontSize) => {
      const tempElement = document.createElement('span');
      tempElement.style.fontSize = `${fontSize}px`;
      tempElement.style.fontWeight = '500';
      tempElement.style.fontFamily = getComputedStyle(element).fontFamily;
      tempElement.style.visibility = 'hidden';
      tempElement.style.position = 'absolute';
      tempElement.style.whiteSpace = 'nowrap';
      tempElement.style.left = '-9999px';
      tempElement.textContent = text;
      
      document.body.appendChild(tempElement);
      const width = tempElement.offsetWidth;
      document.body.removeChild(tempElement);
      
      return width;
    };

    // Función para encontrar el tamaño óptimo de fuente
    const findOptimalFontSize = () => {
      // Medir el ancho del texto con el tamaño máximo
      const maxWidthText = measureTextWidth(maxFontSize);
      
      // Si el texto cabe perfectamente con el tamaño máximo, usar ese tamaño
      if (maxWidthText <= maxWidth) {
        setFontSize(maxFontSize);
        return;
      }

      // Si el texto es más ancho que el contenedor, necesitamos reducir
      // Usar un margen de tolerancia más pequeño (2%) para ser más preciso
      const tolerance = maxWidth * 0.02;
      const targetWidth = maxWidth - tolerance;

      // Búsqueda binaria para encontrar el tamaño óptimo
      let minSize = minFontSize;
      let maxSize = maxFontSize;
      let optimalSize = minFontSize; // Empezar con el tamaño mínimo

      while (minSize <= maxSize) {
        const midSize = Math.floor((minSize + maxSize) / 2);
        const width = measureTextWidth(midSize);
        
        if (width <= targetWidth) {
          optimalSize = midSize;
          minSize = midSize + 1;
        } else {
          maxSize = midSize - 1;
        }
      }

      setFontSize(optimalSize);
    };

    // Usar requestAnimationFrame para asegurar que el DOM esté listo
    const timeoutId = setTimeout(() => {
      findOptimalFontSize();
    }, 50); // Pequeño delay para asegurar que el layout esté estable

    return () => clearTimeout(timeoutId);
  }, [text, maxWidth, minFontSize, maxFontSize]);

  return { fontSize, textRef };
};

export default useAutoFitText;
