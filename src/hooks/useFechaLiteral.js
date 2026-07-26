import { useMemo } from 'react';

const useFechaLiteral = (dateStr, abbreviate = false, includeTime = false) => {
  return useMemo(() => {
    if (!dateStr) return '';
    
    let normalizedDateStr = dateStr;
    let timePart = '';

    if (typeof dateStr === 'string' && dateStr.length > 10) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        normalizedDateStr = `${yyyy}-${mm}-${dd}`;
        
        if (includeTime) {
          let hours = d.getHours();
          const minutes = String(d.getMinutes()).padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12;
          hours = hours ? hours : 12; // the hour '0' should be '12'
          timePart = `, ${hours}:${minutes} ${ampm}`;
        }
      } else {
        normalizedDateStr = dateStr.slice(0, 10);
      }
    } else if (typeof dateStr === 'string' && dateStr.length <= 10) {
      normalizedDateStr = dateStr.slice(0, 10);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedDateStr)) {
      const [year, month, day] = normalizedDateStr.split('-');
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
      
      return `${d} de ${meses[m]} de ${y}${timePart}`;
    }

    if (/^\d{4}-\d{2}$/.test(normalizedDateStr)) {
      const [year, month] = normalizedDateStr.split('-');
      const m = parseInt(month, 10) - 1;
      const y = parseInt(year, 10);
      
      if (abbreviate) {
        const mesesAbbr = [
          'ene', 'feb', 'mar', 'abr', 'may', 'jun',
          'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
        ];
        const yAbbr = String(y).slice(-2);
        return `${mesesAbbr[m]} ${yAbbr}`;
      }

      const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      
      return `${meses[m]} de ${y}`;
    }

    return '';
  }, [dateStr, abbreviate]);
};

export default useFechaLiteral;