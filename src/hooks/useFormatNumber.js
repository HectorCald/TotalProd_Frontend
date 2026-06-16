import { useCallback } from 'react';

const useFormatNumber = () => {
    // Formatea un número como precio: siempre 2 decimales, miles con ".", decimal con ","
    const formatPrice = useCallback((val) => {
        const num = parseFloat(val ?? 0);
        if (isNaN(num)) return '0,00';
        const [intPart, decPart] = num.toFixed(2).split('.');
        const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${intFormatted},${decPart}`;
    }, []);

    return { formatPrice };
};

export default useFormatNumber;
