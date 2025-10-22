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

const SalesChart = ({ sucuId }) => {
    const { data: movimientos, loading, error } = useMovimientosData();
    const [hoveredData, setHoveredData] = useState(null);

    // Procesar datos para el gráfico de ventas por mes
    const procesarDatosParaGraficoVentas = (movimientos) => {
        if (!movimientos || movimientos.length === 0) {
            return [];
        }

        const ahora = new Date();
        const añoActual = ahora.getFullYear();

        // Crear objeto para almacenar ventas por mes
        const ventasPorMes = {};
        
        // Inicializar todos los meses del año actual
        for (let mes = 1; mes <= 12; mes++) {
            ventasPorMes[mes] = 0;
        }

        // Procesar cada movimiento (solo salidas = ventas)
        movimientos.forEach(movimiento => {
            const fechaMovimiento = new Date(movimiento.fecha);
            const añoMovimiento = fechaMovimiento.getFullYear();
            const mesMovimiento = fechaMovimiento.getMonth() + 1;

            // Solo procesar movimientos del año actual y que sean salidas (ventas)
            if (añoMovimiento === añoActual && movimiento.type === 'salida' && movimiento.estado !== 'anulado') {
                // Calcular total de la venta (suma de productos vendidos)
                if (movimiento.productos && movimiento.productos.length > 0) {
                    const totalVenta = movimiento.productos.reduce((sum, producto) => {
                        return sum + (producto.cantidad * producto.precio_unitario);
                    }, 0);
                    ventasPorMes[mesMovimiento] += totalVenta;
                }
            }
        });

        // Convertir a array para el gráfico
        return Object.keys(ventasPorMes).map(mes => ({
            mes: parseInt(mes),
            ventas: ventasPorMes[mes]
        }));
    };

    // Configuración del gráfico
    const configurarGrafico = (datosPorMes) => {
        const meses = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];

        const labels = datosPorMes.map(item => meses[item.mes - 1]);
        const data = datosPorMes.map(item => item.ventas);

        return {
            labels,
            datasets: [
                {
                    label: 'Ventas por mes',
                    data,
                    borderColor: 'rgb(34, 197, 94)', // Verde para ventas
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(34, 197, 94)',
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
        onHover: (event, activeElements) => {
            if (activeElements && activeElements.length > 0) {
                const dataIndex = activeElements[0].index;
                const datosHovereado = obtenerDatosMesHovereado(dataIndex);
                setHoveredData(datosHovereado);
            } else {
                setHoveredData(null);
            }
        },
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
                borderColor: 'rgb(34, 197, 94)',
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
                        return `Bs. ${context.parsed.y.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
                    },
                    callback: function(value) {
                        return `Bs. ${value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    }
                }
            }
        },
        elements: {
            point: {
                hoverBackgroundColor: 'rgb(34, 197, 94)'
            }
        }
    };

    // Calcular total de ventas del mes actual
    const calcularVentasMesActual = (movimientos) => {
        if (!movimientos || movimientos.length === 0) {
            return 0;
        }

        const ahora = new Date();
        const añoActual = ahora.getFullYear();
        const mesActual = ahora.getMonth() + 1;

        let totalVentasMesActual = 0;

        movimientos.forEach(movimiento => {
            const fechaMovimiento = new Date(movimiento.fecha);
            const añoMovimiento = fechaMovimiento.getFullYear();
            const mesMovimiento = fechaMovimiento.getMonth() + 1;

            if (añoMovimiento === añoActual && mesMovimiento === mesActual && movimiento.type === 'salida' && movimiento.estado !== 'anulado') {
                if (movimiento.productos && movimiento.productos.length > 0) {
                    const totalVenta = movimiento.productos.reduce((sum, producto) => {
                        return sum + (producto.cantidad * producto.precio_unitario);
                    }, 0);
                    totalVentasMesActual += totalVenta;
                }
            }
        });

        return totalVentasMesActual;
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
        const datosPorMes = procesarDatosParaGraficoVentas(movimientos);
        const datosMesActual = datosPorMes.find(item => item.mes === mesActual);
        
        return {
            mes: mesActual,
            ventas: datosMesActual ? datosMesActual.ventas : 0,
            nombreMes: obtenerMesActual()
        };
    };

    // Obtener datos del mes hovereado
    const obtenerDatosMesHovereado = (mesIndex) => {
        const meses = [
            'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
            'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
        ];
        const datosPorMes = procesarDatosParaGraficoVentas(movimientos);
        const datosMes = datosPorMes[mesIndex];
        
        return {
            mes: datosMes ? datosMes.mes : mesIndex + 1,
            ventas: datosMes ? datosMes.ventas : 0,
            nombreMes: meses[mesIndex]
        };
    };

    // Procesar datos para el gráfico
    const datosGrafico = React.useMemo(() => {
        if (!movimientos || movimientos.length === 0) {
            return configurarGrafico([]);
        }
        
        const datosPorMes = procesarDatosParaGraficoVentas(movimientos);
        return configurarGrafico(datosPorMes);
    }, [movimientos]);

    // Calcular total de ventas del mes actual
    const totalVentasMesActual = React.useMemo(() => {
        return calcularVentasMesActual(movimientos);
    }, [movimientos]);

    // Efecto para limpiar el hover cuando el mouse sale del gráfico
    useEffect(() => {
        const handleMouseLeave = () => {
            setHoveredData(null);
        };

        const chartContainer = document.querySelector(`#ventas-chart-container`);
        if (chartContainer) {
            chartContainer.addEventListener('mouseleave', handleMouseLeave);
            return () => {
                chartContainer.removeEventListener('mouseleave', handleMouseLeave);
            };
        }
    }, []);

    // Obtener datos a mostrar (hovereado o mes actual)
    const datosAMostrar = hoveredData || obtenerDatosMesActual();

    return (
        <div className={styles.salesCard}>
            <div className={styles.salesCardHeader}>
                <div className={styles.salesCardTitle}>Ventas</div>
                <div className={styles.salesCardValue}>Bs. {datosAMostrar.ventas.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className={styles.salesCardMonth}>{datosAMostrar.nombreMes}</div>
            </div>
            
            <div className={styles.salesCardChart} id="ventas-chart-container">
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

export default React.memo(SalesChart);
