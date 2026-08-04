import React, { useState, useMemo, useEffect, useRef } from 'react';
import styles from './DateRibbon.module.css';
import SelectTipoFecha from './modals/SelectTipoFecha';
import CalendarModal from '../CalendarModal';
import ModalCentro from '../../modals/ModalCentro';
import Boton from '../../botones/Boton';
import useFechaLiteral from '../../../../hooks/useFechaLiteral';

const DateFilterField = ({ label, value, onClick, onClear }) => {
    const literal = useFechaLiteral(value);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', width: '50px', color: 'var(--secondary-color)' }}>{label}:</span>
            <button 
                type="button" 
                onClick={onClick}
                style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--quaternary-color)',
                    backgroundColor: '#fff',
                    textAlign: 'left',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    minHeight: '36px'
                }}
            >
                <span style={{ color: value ? '#1a1a1a' : '#a0aec0' }}>{value ? literal || value : 'Seleccionar'}</span>
                {value && (
                    <div 
                        onClick={(e) => {
                            e.stopPropagation();
                            onClear();
                        }}
                        style={{ display: 'flex', alignItems: 'center', padding: '2px', cursor: 'pointer' }}
                    >
                        ✕
                    </div>
                )}
            </button>
        </div>
    );
};

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

const DateRibbon = ({ onTipoFechaChange, onDateSelected, onCustomDateRange }) => {
  const [tipoFecha, setTipoFecha] = useState('diario');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const ribbonRef = useRef(null);
  
  // Estado para fecha personalizada
  const [customDateRange, setCustomDateRange] = useState({ inicio: '', fin: '' });
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(null); // 'inicio' | 'fin'
  
  const options = useMemo(() => {
      if (tipoFecha === 'personalizada') {
          if (customDateRange.inicio && customDateRange.fin) {
              const formatLabel = (dateStr) => {
                  const parts = dateStr.split('-');
                  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
              };
              return [{ 
                  value: `${customDateRange.inicio}__${customDateRange.fin}`, 
                  label: `${formatLabel(customDateRange.inicio)} - ${formatLabel(customDateRange.fin)}` 
              }];
          }
          return [];
      }
      return generateOptions(tipoFecha);
  }, [tipoFecha, customDateRange]);

  const [selectedOption, setSelectedOption] = useState(options[options.length - 1]?.value);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  useEffect(() => {
      if (tipoFecha !== 'personalizada' && options.length > 0 && !options.find(opt => opt.value === selectedOption)) {
          const val = options[options.length - 1].value;
          setSelectedOption(val);
      }
  }, [options, selectedOption, tipoFecha]);

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
      if (tipo === 'personalizada') {
          setTipoFecha(tipo);
          if (onTipoFechaChange) onTipoFechaChange(tipo);
          // Abrir modal de rango personalizado
          setShowCustomModal(true);
      } else {
          setTipoFecha(tipo);
          if (onTipoFechaChange) onTipoFechaChange(tipo);
      }
  };

  const handleCustomDateApply = () => {
      if (customDateRange.inicio && customDateRange.fin) {
          const val = `${customDateRange.inicio}__${customDateRange.fin}`;
          setSelectedOption(val);
          if (onDateSelected) onDateSelected(val);
          setShowCustomModal(false);
      }
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
              {tipoFecha === 'personalizada' && options.length === 0 && (
                  <button 
                      className={styles.dateButton}
                      onClick={() => setShowCustomModal(true)}
                      style={{ color: '#999', fontStyle: 'italic' }}
                  >
                      Seleccionar rango de fechas...
                  </button>
              )}
          </div>
          <button className={styles.calendarButton} onClick={() => setIsModalOpen(true)}>
              <i className='bx bx-calendar'></i>
          </button>
          
          <SelectTipoFecha 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              onSelect={handleTipoFechaChange} 
          />

          {/* Modal de fecha personalizada */}
          <ModalCentro
              isOpen={showCustomModal}
              onClose={() => setShowCustomModal(false)}
              title="Fecha Personalizada"
              hideFooter={true}
              contentStyle={{ padding: '15px 20px 20px 20px' }}
          >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <DateFilterField 
                      label="Desde"
                      value={customDateRange.inicio}
                      onClick={() => setCalendarOpen('inicio')}
                      onClear={() => setCustomDateRange(prev => ({ ...prev, inicio: '' }))}
                  />
                  <DateFilterField 
                      label="Hasta"
                      value={customDateRange.fin}
                      onClick={() => setCalendarOpen('fin')}
                      onClear={() => setCustomDateRange(prev => ({ ...prev, fin: '' }))}
                  />
                  <Boton 
                      label="Aplicar" 
                      className="btn-primary" 
                      onClick={handleCustomDateApply}
                      disabled={!customDateRange.inicio || !customDateRange.fin}
                  />
              </div>
          </ModalCentro>

          {calendarOpen && (
              <CalendarModal 
                  isOpen={!!calendarOpen}
                  onClose={() => setCalendarOpen(null)}
                  selectedDate={customDateRange[calendarOpen] || ''}
                  onSelectDate={(val) => {
                      setCustomDateRange(prev => ({ ...prev, [calendarOpen]: val }));
                      setCalendarOpen(null);
                  }}
              />
          )}
      </div>
  );
};

export default DateRibbon;
