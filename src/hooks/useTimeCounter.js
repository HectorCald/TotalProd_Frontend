import { useState, useEffect } from 'react';

const useTimeCounter = (startDate, endDate) => {
    const [timeLeft, setTimeLeft] = useState(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!startDate || !endDate) {
            setTimeLeft(null);
            return;
        }

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const start = new Date(startDate).getTime();
            const end = new Date(endDate).getTime();

            // Si el plan aún no ha comenzado
            if (now < start) {
                const timeUntilStart = end - start;
                return calculateTimeComponents(timeUntilStart);
            }

            // Si el plan ha expirado
            if (now >= end) {
                setIsExpired(true);
                return null;
            }

            // Calcular tiempo restante
            const timeRemaining = end - now;
            return calculateTimeComponents(timeRemaining);
        };

        const calculateTimeComponents = (milliseconds) => {
            const seconds = Math.floor(milliseconds / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            const months = Math.floor(days / 30);

            // Determinar qué mostrar basado en la duración
            if (months > 0) {
                return {
                    months: months,
                    days: days % 30,
                    hours: 0,
                    seconds: 0,
                    display: 'months'
                };
            } else if (days > 0) {
                return {
                    months: 0,
                    days: days,
                    hours: hours % 24,
                    seconds: 0,
                    display: 'days'
                };
            } else if (hours > 0) {
                return {
                    months: 0,
                    days: 0,
                    hours: hours,
                    seconds: seconds % 60,
                    display: 'hours'
                };
            } else {
                return {
                    months: 0,
                    days: 0,
                    hours: 0,
                    seconds: seconds,
                    display: 'seconds'
                };
            }
        };

        // Calcular tiempo inicial
        setTimeLeft(calculateTimeLeft());

        // Actualizar cada segundo
        const interval = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);
        }, 1000);

        return () => clearInterval(interval);
    }, [startDate, endDate]);

    return { timeLeft, isExpired };
};

export default useTimeCounter;
