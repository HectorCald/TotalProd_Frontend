import React, { useState, useEffect } from 'react';
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

    const opcionesGrafico = {
        responsive: true,
        maintainAspectRatio: false,
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
    };

    // Procesar datos para el gráfico
    const datosGrafico = React.useMemo(() => {
        if (!movimientos || movimientos.length === 0) {
            return configurarGrafico([]);
        }
        
        const datosPorMes = procesarDatosParaGrafico(movimientos);
        return configurarGrafico(datosPorMes);
    }, [movimientos]);

    return (
        <div className={styles.salesCard}>
            <div className={styles.salesCardHeader}>
                <div className={styles.salesCardTitle}>Movimientos</div>
            </div>
            
            <div className={styles.salesCardChart}>
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
