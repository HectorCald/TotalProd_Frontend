import React, { useState, useMemo, useEffect, useRef } from 'react';
import styles from './DateRibbon.module.css';
import SelectTipoFecha from './modals/SelectTipoFecha';

const generateOptions = (tipo) => {
    const options = [];
    const today = new Date();
    
    const toLocalString = (d) => {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };
    
    if (tipo === 'diario') {
        const startDate = new Date(today.getFullYear(), 0, 1);
        for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            options.push({ value: toLocalString(d), label: dateStr });
        }
    } else if (tipo === 'semanal') {
        let d = new Date(today.getFullYear(), 0, 1);
        while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
        for (let curr = new Date(d); curr <= today; curr.setDate(curr.getDate() + 7)) {
            const endOfWeek = new Date(curr);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            if (endOfWeek > today) endOfWeek.setTime(today.getTime());
            
            const startStr = `${curr.getDate()} ${curr.toLocaleDateString('es-ES', { month: 'short' })}`;
            const endStr = `${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString('es-ES', { month: 'short' })}`;
            options.push({ value: toLocalString(curr), label: `${startStr} - ${endStr}` });
        }
    } else if (tipo === 'mensual') {
        const startYear = today.getFullYear() - 1;
        for (let y = startYear; y <= today.getFullYear(); y++) {
            const endMonth = (y === today.getFullYear()) ? today.getMonth() : 11;
            for (let m = 0; m <= endMonth; m++) {
                const dateObj = new Date(y, m, 1);
                const monthStr = dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                options.push({ value: toLocalString(dateObj), label: monthStr.charAt(0).toUpperCase() + monthStr.slice(1) });
            }
        }
    } else if (tipo === 'anual') {
        const startYear = today.getFullYear() - 5;
        for (let y = startYear; y <= today.getFullYear(); y++) {
            options.push({ value: y.toString(), label: y.toString() });
        }
    }
    return options; // Sin reverse para que el más reciente quede a la derecha
};

const DateRibbon = ({ onTipoFechaChange, onDateSelected }) => {
  const [tipoFecha, setTipoFecha] = useState('diario');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const ribbonRef = useRef(null);
  
  const options = useMemo(() => generateOptions(tipoFecha), [tipoFecha]);
  const [selectedOption, setSelectedOption] = useState(options[options.length - 1]?.value);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  useEffect(() => {
      if (options.length > 0 && !options.find(opt => opt.value === selectedOption)) {
          const val = options[options.length - 1].value;
          setSelectedOption(val);
      }
  }, [options, selectedOption]);

  useEffect(() => {
      if (onDateSelected && selectedOption) {
          onDateSelected(selectedOption);
      }
  }, [selectedOption, onDateSelected]);

  useEffect(() => {
      if (ribbonRef.current) {
          ribbonRef.current.scrollLeft = ribbonRef.current.scrollWidth;
      }
  }, [tipoFecha]);

  const handleSelectOption = (val) => {
      setSelectedOption(val);
      if (onDateSelected) onDateSelected(val);
  };

  const handleTipoFechaChange = (tipo) => {
      setTipoFecha(tipo);
      if (onTipoFechaChange) onTipoFechaChange(tipo);
  };

  const handleWheel = (e) => {
      if (ribbonRef.current) {
          ribbonRef.current.scrollLeft += e.deltaY;
      }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - ribbonRef.current.offsetLeft);
    setScrollLeftState(ribbonRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - ribbonRef.current.offsetLeft;
    const walk = (x - startX) * 2; 
    ribbonRef.current.scrollLeft = scrollLeftState - walk;
  };

  return (
      <div className={styles.dateRibbonContainer}>
          <div 
              className={`${styles.dateRibbon} ${isDragging ? styles.dragging : ''}`}
              ref={ribbonRef}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
          >
              {options.map(opt => (
                  <button 
                      key={opt.value} 
                      className={`${styles.dateButton} ${selectedOption === opt.value ? styles.active : ''}`}
                      onClick={() => handleSelectOption(opt.value)}
                  >
                      {opt.label}
                  </button>
              ))}
          </div>
          <button className={styles.calendarButton} onClick={() => setIsModalOpen(true)}>
              <i className='bx bx-calendar'></i>
          </button>
          
          <SelectTipoFecha 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              onSelect={handleTipoFechaChange} 
          />
      </div>
  );
};

export default DateRibbon;
