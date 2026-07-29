import { useCallback } from 'react';

const useFormatNumber = () => {
    // Formatea un número como precio: 2 decimales, miles con ".", decimal con ","
    const formatPrice = useCallback((val) => {
        const parsedVal = parseFloat(val ?? 0);
        if (isNaN(parsedVal)) return '0,00';
        const [intPart, decPart] = parsedVal.toFixed(2).split('.');
        const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${intFormatted},${decPart}`;
    }, []);

    return { formatPrice };
};

export default useFormatNumber;
