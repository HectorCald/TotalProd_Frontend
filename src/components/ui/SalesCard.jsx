import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { useMovimientosData } from '../../hooks/useMovimientosData';
import styles from './SalesCard.module.css';

// Registrar componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const SalesCard = ({ sucuId }) => {
    const { data: movimientos, loading, error } = useMovimientosData();
    const [hoveredData, setHoveredData] = useState(null);


    // Procesar datos para el gráfico por mes
    const procesarDatosParaGrafico = (movimientos) => {
        if (!movimientos || movimientos.length === 0) {
            return [];
        }

        const ahora = new Date();
        const añoActual = ahora.getFullYear();

        // Crear objeto para almacenar movimientos por mes
        const movimientosPorMes = {};
        
        // Inicializar todos los meses del año actual
        for (let mes = 1; mes <= 12; mes++) {
            movimientosPorMes[mes] = 0;
        }

        // Procesar cada movimiento
        movimientos.forEach(movimiento => {
            const fechaMovimiento = new Date(movimiento.fecha);
            const añoMovimiento = fechaMovimiento.getFullYear();
            const mesMovimiento = fechaMovimiento.getMonth() + 1;

            // Solo contar movimientos del año actual
            if (añoMovimiento === añoActual) {
                movimientosPorMes[mesMovimiento]++;
            }
        });

        // Convertir a array para el gráfico
        return Object.keys(movimientosPorMes).map(mes => ({
            mes: parseInt(mes),
            cantidad: movimientosPorMes[mes]
        }));
    };

    // Configuración del gráfico
    const configurarGrafico = (datosPorMes) => {
        const meses = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];

        const labels = datosPorMes.map(item => meses[item.mes - 1]);
        const data = datosPorMes.map(item => item.cantidad);

        return {
            labels,
            datasets: [
                {
                    label: 'Movimientos por mes',
                    data,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        };
    };

    // Obtener datos del mes hovereado
    const obtenerDatosMesHovereado = useCallback((mesIndex) => {
        const meses = [
            'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
            'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
        ];
        const datosPorMes = procesarDatosParaGrafico(movimientos);
        const datosMes = datosPorMes[mesIndex];
        
        return {
            mes: datosMes ? datosMes.mes : mesIndex + 1,
            cantidad: datosMes ? datosMes.cantidad : 0,
            nombreMes: meses[mesIndex]
        };
    }, [movimientos]);

    // Callback para manejar el hover del gráfico
    const handleHover = useCallback((event, activeElements) => {
        if (activeElements && activeElements.length > 0) {
            const dataIndex = activeElements[0].index;
            const datosHovereado = obtenerDatosMesHovereado(dataIndex);
            setHoveredData(datosHovereado);
        } else {
            setHoveredData(null);
        }
    }, [obtenerDatosMesHovereado]);

    // Memoizar opciones del gráfico para evitar recreaciones innecesarias
    const opcionesGrafico = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        onHover: handleHover,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: false,
                animation: false,
                callbacks: {
                    title: function(context) {
                        const mesesCompletos = [
                            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                        ];
                        const mesIndex = context[0].dataIndex;
                        return mesesCompletos[mesIndex];
                    },
                    label: function(context) {
                        return `${context.parsed.y} movimientos`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#6b7280',
                    font: {
                        size: 12
                    }
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: '#6b7280',
                    font: {
                        size: 12
                    }
                }
            }
        },
        elements: {
            point: {
                hoverBackgroundColor: 'rgb(59, 130, 246)'
            }
        }
    }), [handleHover]);

    // Calcular total del mes actual
    const calcularTotalMesActual = (movimientos) => {
        if (!movimientos || movimientos.length === 0) {
            return 0;
        }

        const ahora = new Date();
        const añoActual = ahora.getFullYear();
        const mesActual = ahora.getMonth() + 1;

        let totalMesActual = 0;

        movimientos.forEach(movimiento => {
            const fechaMovimiento = new Date(movimiento.fecha);
            const añoMovimiento = fechaMovimiento.getFullYear();
            const mesMovimiento = fechaMovimiento.getMonth() + 1;

            if (añoMovimiento === añoActual && mesMovimiento === mesActual) {
                totalMesActual++;
            }
        });

        return totalMesActual;
    };

    // Obtener nombre del mes actual
    const obtenerMesActual = () => {
        const ahora = new Date();
        const meses = [
            'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
            'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
        ];
        return meses[ahora.getMonth()];
    };

    // Obtener datos del mes actual por defecto
    const obtenerDatosMesActual = () => {
        const ahora = new Date();
        const mesActual = ahora.getMonth() + 1;
        const datosPorMes = procesarDatosParaGrafico(movimientos);
        const datosMesActual = datosPorMes.find(item => item.mes === mesActual);
        
        return {
            mes: mesActual,
            cantidad: datosMesActual ? datosMesActual.cantidad : 0,
            nombreMes: obtenerMesActual()
        };
    };

    // Procesar datos para el gráfico
    const datosGrafico = useMemo(() => {
        if (!movimientos || movimientos.length === 0) {
            return configurarGrafico([]);
        }
        
        const datosPorMes = procesarDatosParaGrafico(movimientos);
        return configurarGrafico(datosPorMes);
    }, [movimientos]);

    // Calcular total del mes actual
    const totalMesActual = useMemo(() => {
        return calcularTotalMesActual(movimientos);
    }, [movimientos]);

    // Efecto para limpiar el hover cuando el mouse sale del gráfico
    useEffect(() => {
        const handleMouseLeave = () => {
            setHoveredData(null);
        };

        const chartContainer = document.querySelector(`#movimientos-chart-container`);
        if (chartContainer) {
            chartContainer.addEventListener('mouseleave', handleMouseLeave);
            return () => {
                chartContainer.removeEventListener('mouseleave', handleMouseLeave);
            };
        }
    }, []);

    // Memoizar datos del mes actual para evitar recálculos innecesarios
    const datosMesActual = useMemo(() => {
        return obtenerDatosMesActual();
    }, [movimientos]);

    // Obtener datos a mostrar (hovereado o mes actual)
    const datosAMostrar = useMemo(() => {
        return hoveredData || datosMesActual;
    }, [hoveredData, datosMesActual]);

    return (
        <div className={styles.salesCard}>
            <div className={styles.salesCardHeader}>
                <div className={styles.salesCardTitle}>Movimientos</div>
                <div className={styles.salesCardValue}>{datosAMostrar.cantidad}</div>
                <div className={styles.salesCardMonth}>{datosAMostrar.nombreMes}</div>
            </div>
            
            <div className={styles.salesCardChart} id="movimientos-chart-container">
                {loading ? (
                    <div className={styles.chartLoading}>
                        <div className={styles.loadingSpinner}></div>
                        <span>Cargando...</span>
                    </div>
                ) : (
                    <div className={styles.chartContainer}>
                        <Line data={datosGrafico} options={opcionesGrafico} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(SalesCard);
