import { useCallback } from 'react';

const useFormatNumber = () => {
    // Formatea un número como precio: siempre 2 decimales (redondeado a 1 decimal primero), miles con ".", decimal con ","
    const formatPrice = useCallback((val) => {
        const parsedVal = parseFloat(val ?? 0);
        if (isNaN(parsedVal)) return '0,00';
        const num = Math.round(parsedVal * 10) / 10;
        const [intPart, decPart] = num.toFixed(2).split('.');
        const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${intFormatted},${decPart}`;
    }, []);

    return { formatPrice };
};

export default useFormatNumber;
