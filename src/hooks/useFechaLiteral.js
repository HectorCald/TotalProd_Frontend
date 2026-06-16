import { useMemo } from 'react';

const useFechaLiteral = (dateStr, abbreviate = false) => {
  return useMemo(() => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '';
    const [year, month, day] = dateStr.split('-');
    const m = parseInt(month, 10) - 1;
    const d = parseInt(day, 10);
    const y = parseInt(year, 10);
    
    if (abbreviate) {
      const mesesAbbr = [
        'ene', 'feb', 'mar', 'abr', 'may', 'jun',
        'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
      ];
      const yAbbr = String(y).slice(-2);
      return `${d} ${mesesAbbr[m]} ${yAbbr}`;
    }

    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    return `${d} de ${meses[m]} de ${y}`;
  }, [dateStr, abbreviate]);
};

export default useFechaLiteral;
