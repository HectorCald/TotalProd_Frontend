import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLayout } from '../../../../context/LayoutContext';

import SideBar from '../../../../components/essentials/SideBar';
import NavBar from '../../../../components/essentials/NavBar';
import MenuSide from '../../../../components/essentials/MenuSide';
import layoutStyles from '../../../../pages/home/View.module.css';
import styles from './Planificador.module.css';
import BotonFlotante from '../../../../components/common/botones/BotonFlotante';
import AgregarEditarTarea from './modals/AgregarEditarTarea';
import ViewInfoTarea from './modals/ViewInfoTarea';
import EliminarTarea from './modals/EliminarTarea';
import personalService from '../../../../services/personalService';
import planificadorService from '../../../../services/planificadorService';
import Skeleton from '../../../../components/common/widgets/Skeleton';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DIAS_SEMANA_COMPLETO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const formatDateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const Planificador = () => {
  const { isLargeScreen } = useLayout();

  // Fecha actual visualizada en el calendario
  const [currentDate, setCurrentDate] = useState(new Date());

  // Tareas del planificador (desde el backend, por mes)
  const [tareas, setTareas] = useState([]);
  const [loadingTareas, setLoadingTareas] = useState(true);

  const cargarTareas = useCallback(async (year, month) => {
    try {
      setLoadingTareas(true);
      const res = await planificadorService.getAll(year, month);
      if (res && res.success && Array.isArray(res.data)) {
        setTareas(res.data.map(t => ({
          ...t,
          responsableId: t.responsable_id,
          frecuencia: t.frecuencia || 'unica',
        })));
      }
    } catch (err) {
      console.error('Error cargando tareas del planificador:', err);
    } finally {
      setLoadingTareas(false);
    }
  }, []);

  // Recargar tareas al cambiar de mes o año (sin recargar al navegar días en el mismo mes)
  const currentYearVal = currentDate.getFullYear();
  const currentMonthVal = currentDate.getMonth();

  useEffect(() => {
    cargarTareas(currentYearVal, currentMonthVal + 1);
  }, [currentYearVal, currentMonthVal, cargarTareas]);


  // Catálogo de personal
  const [personal, setPersonal] = useState([]);

  useEffect(() => {
    const loadPersonal = async () => {
      try {
        const res = await personalService.getAll();
        if (res && res.success && Array.isArray(res.data)) {
          setPersonal(res.data);
        }
      } catch (err) {
        console.error('Error cargando catálogo de personal en planificador:', err);
      }
    };
    loadPersonal();
  }, []);

  // Opciones de responsable (solo personal activo)
  const personalOptions = useMemo(() => {
    return (personal || [])
      .filter((p) => p.is_active !== false)
      .map((p) => {
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || 'Personal';
        const cargo = p.cargo || p.cargos?.name || '';
        return {
          value: String(p.id),
          label: cargo ? `${fullName} (${cargo})` : fullName,
          raw: {
            ...p,
            nombre_completo: fullName,
            cargo: cargo || '--',
          },
        };
      });
  }, [personal]);

  // Control del modal lateral de creación / edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [preselectedDate, setPreselectedDate] = useState('');

  // Control del modal central de visualización de detalles
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [tareaParaVer, setTareaParaVer] = useState(null);

  // Control del modal de eliminación con reapertura si se cancela
  const [isEliminarOpen, setIsEliminarOpen] = useState(false);
  const [tareaParaEliminar, setTareaParaEliminar] = useState(null);
  const [returnToViewOnDeleteClose, setReturnToViewOnDeleteClose] = useState(false);

  // Filtro activo por estado ('Pendiente' | 'En Progreso' | 'Completado' | null)
  const [filtroEstado, setFiltroEstado] = useState(null);

  const handleToggleFiltroEstado = useCallback((estado) => {
    setFiltroEstado((prev) => (prev === estado ? null : estado));
  }, []);

  const handleOpenCreateModal = useCallback((dateStr = '') => {
    setTareaSeleccionada(null);
    setPreselectedDate(dateStr || formatDateKey(new Date()));
    setIsModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((task) => {
    setTareaSeleccionada(task);
    setPreselectedDate(task.fecha);
    setIsModalOpen(true);
  }, []);

  const handleOpenViewModal = useCallback((task, e) => {
    if (e) e.stopPropagation();
    setTareaParaVer(task);
    setIsViewModalOpen(true);
  }, []);

  const handleEliminarClick = useCallback((task) => {
    setTareaParaEliminar(task);
    setIsViewModalOpen(false);
    setReturnToViewOnDeleteClose(true);
    setIsEliminarOpen(true);
  }, []);

  const handleGuardarTarea = useCallback((savedTarea) => {
    const normalizada = {
      ...savedTarea,
      responsableId: savedTarea.responsableId || savedTarea.responsable_id,
      responsable_id: savedTarea.responsable_id || savedTarea.responsableId,
      frecuencia: savedTarea.frecuencia || 'unica',
    };

    setTareas((prev) => {
      const index = prev.findIndex((t) => t.id === normalizada.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], ...normalizada };
        return next;
      }
      return [...prev, normalizada];
    });

    if (tareaParaVer && tareaParaVer.id === normalizada.id) {
      setTareaParaVer((prev) => ({ ...prev, ...normalizada }));
    }
  }, [tareaParaVer]);

  const handleEliminarTarea = useCallback((taskId) => {
    setTareas((prev) => prev.filter((t) => t.id !== taskId));
    if (tareaParaVer && tareaParaVer.id === taskId) {
      setTareaParaVer(null);
      setIsViewModalOpen(false);
    }
    if (tareaSeleccionada && tareaSeleccionada.id === taskId) {
      setTareaSeleccionada(null);
      setIsModalOpen(false);
    }
  }, [tareaParaVer, tareaSeleccionada]);

  // Navegación rápida de días, meses y años
  const handlePrev = () => {
    if (!isLargeScreen) {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1));
    } else {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }
  };

  const handleNext = () => {
    if (!isLargeScreen) {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1));
    } else {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayChange = (e) => {
    const newDay = parseInt(e.target.value, 10);
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), newDay));
  };

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    setCurrentDate((prev) => {
      const maxDays = new Date(prev.getFullYear(), newMonth + 1, 0).getDate();
      const clampedDay = Math.min(prev.getDate(), maxDays);
      return new Date(prev.getFullYear(), newMonth, clampedDay);
    });
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    setCurrentDate((prev) => {
      const maxDays = new Date(newYear, prev.getMonth() + 1, 0).getDate();
      const clampedDay = Math.min(prev.getDate(), maxDays);
      return new Date(newYear, prev.getMonth(), clampedDay);
    });
  };

  // Soporte de deslizamiento táctil horizontal
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartXRef.current;
    const diffY = touchEndY - touchStartYRef.current;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Cálculo de celdas del calendario para el mes seleccionado
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const calendarDays = useMemo(() => {
    const year = currentYear;
    const month = currentMonth;

    const firstDayIndex = new Date(year, month, 1).getDay();
    // Ajustar lunes como primer día (0 = Lun, 6 = Dom)
    const startingOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = formatDateKey(new Date());
    const cells = [];

    // Días previos
    for (let i = startingOffset - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const d = new Date(year, month - 1, dayNum);
      const dateKey = formatDateKey(d);
      cells.push({
        dateKey,
        dayNum,
        isCurrentMonth: false,
        isToday: dateKey === todayStr,
      });
    }

    // Días del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateKey = formatDateKey(dateObj);
      cells.push({
        dateKey,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateKey === todayStr,
      });
    }

    // Días del mes siguiente para completar la matriz de semanas
    const totalCellsNeeded = cells.length <= 35 ? 35 : 42;
    const nextDaysNeeded = totalCellsNeeded - cells.length;
    for (let d = 1; d <= nextDaysNeeded; d++) {
      const dateObj = new Date(year, month + 1, d);
      const dateKey = formatDateKey(dateObj);
      cells.push({
        dateKey,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateKey === todayStr,
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Indexar todas las tareas por fecha (incluyendo repetición semanal y mensual)
  const allTasksByDate = useMemo(() => {
    const map = {};
    if (!calendarDays || calendarDays.length === 0) return map;

    calendarDays.forEach((cell) => {
      const [cYear, cMonth, cDay] = cell.dateKey.split('-').map(Number);
      const cellDate = new Date(cYear, cMonth - 1, cDay);
      const cellDayOfWeek = cellDate.getDay();

      tareas.forEach((t) => {
        if (!t.fecha) return;
        const [tYear, tMonth, tDay] = t.fecha.split('-').map(Number);
        const taskDate = new Date(tYear, tMonth - 1, tDay);

        let matches = false;
        if (!t.frecuencia || t.frecuencia === 'unica') {
          matches = cell.dateKey === t.fecha;
        } else if (t.frecuencia === 'semanal') {
          matches = cellDate >= taskDate && cellDayOfWeek === taskDate.getDay();
        } else if (t.frecuencia === 'mensual') {
          matches = cellDate >= taskDate && cDay === tDay;
        }

        if (matches) {
          if (!map[cell.dateKey]) map[cell.dateKey] = [];
          map[cell.dateKey].push(t);
        }
      });
    });

    return map;
  }, [tareas, calendarDays]);

  // Tareas filtradas por estado si hay un filtro seleccionado
  const tasksByDate = useMemo(() => {
    if (!filtroEstado) return allTasksByDate;
    const map = {};
    Object.keys(allTasksByDate).forEach((dateKey) => {
      const filtered = allTasksByDate[dateKey].filter((t) => t.estado === filtroEstado);
      if (filtered.length > 0) {
        map[dateKey] = filtered;
      }
    });
    return map;
  }, [allTasksByDate, filtroEstado]);

  const selectedDateKey = useMemo(() => formatDateKey(currentDate), [currentDate]);
  const selectedDayTasks = tasksByDate[selectedDateKey] || [];

  // Contadores de estado del mes visualizado (siempre calculan sobre todas las tareas)
  const monthStats = useMemo(() => {
    let pendientes = 0;
    let progreso = 0;
    let completadas = 0;

    const seenTaskIds = new Set();
    calendarDays.forEach((cell) => {
      if (cell.isCurrentMonth && allTasksByDate[cell.dateKey]) {
        allTasksByDate[cell.dateKey].forEach((t) => {
          if (!seenTaskIds.has(t.id)) {
            seenTaskIds.add(t.id);
            if (t.estado === 'Pendiente') pendientes++;
            else if (t.estado === 'En Progreso') progreso++;
            else if (t.estado === 'Completado') completadas++;
          }
        });
      }
    });

    return { pendientes, progreso, completadas, total: pendientes + progreso + completadas };
  }, [calendarDays, allTasksByDate]);

  // Generador de rango de años (año actual - 3 hasta año actual + 5)
  const availableYears = useMemo(() => {
    const nowY = new Date().getFullYear();
    const list = [];
    for (let y = nowY - 3; y <= nowY + 5; y++) {
      list.push(y);
    }
    return list;
  }, []);

  return (
    <>
      <NavBar />
      <div className={layoutStyles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={layoutStyles.contentArea}>
          <div className={styles.planificadorWrapper}>
            {/* Título de la página */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 className={layoutStyles.title} style={{ margin: 0 }}>Planificador</h1>
            </div>

            {/* Tarjeta del Calendario */}
            <div
              className={styles.calendarCard}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Barra superior de navegación y filtros */}
              <div className={styles.calendarHeader}>
                <div className={styles.navigationSection}>
                  <button
                    type="button"
                    className={styles.navBtn}
                    onClick={handlePrev}
                    title={!isLargeScreen ? "Día anterior" : "Mes anterior"}
                  >
                    <i className="bx bx-chevron-left"></i>
                  </button>

                  <div className={styles.monthYearSelectors}>
                    {!isLargeScreen && (
                      <select
                        className={styles.selectInput}
                        value={currentDay}
                        onChange={handleDayChange}
                      >
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    )}

                    <select
                      className={styles.selectInput}
                      value={currentMonth}
                      onChange={handleMonthChange}
                    >
                      {MESES.map((m, idx) => (
                        <option key={m} value={idx}>
                          {m}
                        </option>
                      ))}
                    </select>

                    <select
                      className={styles.selectInput}
                      value={currentYear}
                      onChange={handleYearChange}
                    >
                      {availableYears.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className={styles.navBtn}
                    onClick={handleNext}
                    title={!isLargeScreen ? "Día siguiente" : "Mes siguiente"}
                  >
                    <i className="bx bx-chevron-right"></i>
                  </button>

                  {isLargeScreen && (
                    <button
                      type="button"
                      className={styles.todayBtn}
                      onClick={handleToday}
                      title="Ir al día de hoy"
                    >
                      <i className="bx bx-calendar-event"></i>
                      Hoy
                    </button>
                  )}
                </div>

                {/* Resumen de estados en el mes */}
                <div className={styles.statsSection}>
                  <span
                    className={`${styles.statBadge} ${styles.badgePendiente} ${
                      filtroEstado === 'Pendiente' ? styles.statBadgeActive : ''
                    } ${filtroEstado && filtroEstado !== 'Pendiente' ? styles.statBadgeInactive : ''}`}
                    onClick={() => handleToggleFiltroEstado('Pendiente')}
                    title={filtroEstado === 'Pendiente' ? 'Desactivar filtro' : 'Filtrar solo pendientes'}
                  >
                    {monthStats.pendientes} Pendientes
                  </span>
                  <span
                    className={`${styles.statBadge} ${styles.badgeProgreso} ${
                      filtroEstado === 'En Progreso' ? styles.statBadgeActive : ''
                    } ${filtroEstado && filtroEstado !== 'En Progreso' ? styles.statBadgeInactive : ''}`}
                    onClick={() => handleToggleFiltroEstado('En Progreso')}
                    title={filtroEstado === 'En Progreso' ? 'Desactivar filtro' : 'Filtrar solo en progreso'}
                  >
                    {monthStats.progreso} En Progreso
                  </span>
                  <span
                    className={`${styles.statBadge} ${styles.badgeCompletado} ${
                      filtroEstado === 'Completado' ? styles.statBadgeActive : ''
                    } ${filtroEstado && filtroEstado !== 'Completado' ? styles.statBadgeInactive : ''}`}
                    onClick={() => handleToggleFiltroEstado('Completado')}
                    title={filtroEstado === 'Completado' ? 'Desactivar filtro' : 'Filtrar solo completadas'}
                  >
                    {monthStats.completadas} Completadas
                  </span>
                </div>
              </div>

              {/* Encabezado de los días de la semana (solo en desktop) */}
              {isLargeScreen && (
                <div className={styles.weekdayHeader}>
                  {DIAS_SEMANA.map((dia) => (
                    <div key={dia} className={styles.weekdayCell}>
                      {dia}
                    </div>
                  ))}
                </div>
              )}

              {/* Contenedor con vista día a día en móvil o grilla completa en desktop */}
              <div className={styles.calendarScrollArea} style={{ backgroundColor: '#ffffff' }}>
                {!isLargeScreen ? (
                  <div
                    className={`${styles.dayCell} ${
                      selectedDateKey === formatDateKey(new Date()) ? styles.dayCellToday : ''
                    }`}
                    style={{ minHeight: '100%', height: '100%', padding: '12px 14px', cursor: 'default' }}
                  >
                    <div className={styles.dayHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          className={`${styles.dayNumber} ${
                            selectedDateKey === formatDateKey(new Date()) ? styles.dayNumberToday : ''
                          }`}
                          style={{ width: '28px', height: '28px', fontSize: '13px' }}
                        >
                          {currentDay}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                          {DIAS_SEMANA_COMPLETO[currentDate.getDay()]}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.addDayBtn}
                        style={{ opacity: 1, width: '26px', height: '26px', fontSize: '18px' }}
                        onClick={() => handleOpenCreateModal(selectedDateKey)}
                        title="Agregar tarea en este día"
                      >
                        <i className="bx bx-plus"></i>
                      </button>
                    </div>

                    {/* Tareas del día o skeleton de carga */}
                    <div className={styles.taskList} style={{ marginTop: '8px' }}>
                      {loadingTareas ? (
                        <>
                          <Skeleton height="28px" borderRadius="6px" style={{ marginBottom: '4px' }} />
                          <Skeleton height="28px" borderRadius="6px" />
                        </>
                      ) : (
                        selectedDayTasks.map((tarea) => {
                          let pillClass = styles.pillPendiente;
                          if (tarea.estado === 'En Progreso') pillClass = styles.pillProgreso;
                          else if (tarea.estado === 'Completado') pillClass = styles.pillCompletado;

                          return (
                            <div
                              key={tarea.id}
                              className={`${styles.taskPill} ${pillClass}`}
                              onClick={(e) => handleOpenViewModal(tarea, e)}
                              title={`${tarea.titulo}\nResponsable: ${tarea.responsableNombre}\nEstado: ${tarea.estado}`}
                              style={{ padding: '8px 10px' }}
                            >
                              <div className={styles.taskTitle}>{tarea.titulo}</div>
                              {tarea.responsableNombre && (
                                <div className={styles.taskResponsible}>
                                  <i className="bx bx-user" style={{ fontSize: '11px' }}></i>
                                  <span>{tarea.responsableNombre}</span>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={styles.calendarGrid}>
                    {calendarDays.map((cell) => {
                      const dayTasks = tasksByDate[cell.dateKey] || [];
                      const isOtherMonth = !cell.isCurrentMonth;

                      return (
                        <div
                          key={cell.dateKey}
                          className={`${styles.dayCell} ${isOtherMonth ? styles.dayCellOtherMonth : ''} ${
                            cell.isToday ? styles.dayCellToday : ''
                          }`}
                          onClick={() => handleOpenCreateModal(cell.dateKey)}
                          title={`Click para planificar tarea el ${cell.dateKey}`}
                        >
                          <div className={styles.dayHeader}>
                            <span
                              className={`${styles.dayNumber} ${cell.isToday ? styles.dayNumberToday : ''}`}
                            >
                              {cell.dayNum}
                            </span>
                            <button
                              type="button"
                              className={styles.addDayBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCreateModal(cell.dateKey);
                              }}
                              title="Agregar tarea en este día"
                            >
                              <i className="bx bx-plus"></i>
                            </button>
                          </div>

                          {/* Tareas del día o skeleton de carga */}
                          <div className={styles.taskList}>
                            {loadingTareas ? (
                              cell.isCurrentMonth && (
                                <>
                                  <Skeleton height="18px" borderRadius="6px" style={{ marginBottom: '4px' }} />
                                  {Math.random() > 0.5 && (
                                    <Skeleton height="18px" borderRadius="6px" />
                                  )}
                                </>
                              )
                            ) : (
                              dayTasks.map((tarea) => {
                                let pillClass = styles.pillPendiente;
                                if (tarea.estado === 'En Progreso') pillClass = styles.pillProgreso;
                                else if (tarea.estado === 'Completado') pillClass = styles.pillCompletado;

                                return (
                                  <div
                                    key={tarea.id}
                                    className={`${styles.taskPill} ${pillClass}`}
                                    onClick={(e) => handleOpenViewModal(tarea, e)}
                                    title={`${tarea.titulo}\nResponsable: ${tarea.responsableNombre}\nEstado: ${tarea.estado}`}
                                  >
                                    <div className={styles.taskTitle}>{tarea.titulo}</div>
                                    {tarea.responsableNombre && (
                                      <div className={styles.taskResponsible}>
                                        <i className="bx bx-user" style={{ fontSize: '11px' }}></i>
                                        <span>{tarea.responsableNombre}</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botón flotante para agregar tarea */}
      <BotonFlotante
        onClick={() => handleOpenCreateModal(selectedDateKey)}
        iconName="plus"
        ariaLabel="Nueva Tarea"
        style={{ bottom: !isLargeScreen ? '100px' : undefined }}
      />

      {/* Modal central para visualizar información y cambiar estado */}
      <ViewInfoTarea
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        tarea={tareaParaVer}
        onEdit={handleOpenEditModal}
        onEliminarClick={handleEliminarClick}
        onGuardar={handleGuardarTarea}
      />

      {/* Modal lateral para agregar o editar tarea (se muestra encima) */}
      <AgregarEditarTarea
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTareaSeleccionada(null);
        }}
        tareaSeleccionada={tareaSeleccionada}
        preselectedDate={preselectedDate}
        personalOptions={personalOptions}
        onGuardar={handleGuardarTarea}
      />

      {/* Modal de confirmación para eliminar tarea */}
      <EliminarTarea
        isOpen={isEliminarOpen}
        onClose={(wasDeleted) => {
          setIsEliminarOpen(false);
          if (returnToViewOnDeleteClose && wasDeleted !== true) {
            setIsViewModalOpen(true);
          }
          setReturnToViewOnDeleteClose(false);
        }}
        tareaSeleccionada={tareaParaEliminar}
        onEliminar={(idEliminado) => {
          handleEliminarTarea(idEliminado);
          setReturnToViewOnDeleteClose(false);
          setIsViewModalOpen(false);
        }}
      />

      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Planificador;