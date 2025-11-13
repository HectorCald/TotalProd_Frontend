/**
 * Calcula el tamaño de datos en diferentes unidades
 * @param {any} data - Los datos a calcular
 * @returns {object} Objeto con sizeBytes, sizeKB y sizeMB
 */
export const calculateDataSize = (data) => {
    try {
        // Convertir los datos a JSON string para calcular el tamaño
        const jsonString = JSON.stringify(data);
        // Calcular tamaño en bytes usando Blob
        const sizeInBytes = new Blob([jsonString]).size;
        // Convertir a KB
        const sizeInKB = sizeInBytes / 1024;
        // Convertir a MB
        const sizeInMB = sizeInBytes / (1024 * 1024);
        
        return {
            sizeBytes: sizeInBytes,
            sizeKB: parseFloat(sizeInKB.toFixed(2)),
            sizeMB: parseFloat(sizeInMB.toFixed(4))
        };
    } catch (error) {
        console.error('Error calculando tamaño de datos:', error);
        return {
            sizeBytes: 0,
            sizeKB: 0,
            sizeMB: 0
        };
    }
};

/**
 * Calcula el tamaño de datos en MB (mantiene compatibilidad)
 * @param {any} data - Los datos a calcular
 * @returns {number} Tamaño en MB
 */
export const calculateSizeInMB = (data) => {
    return calculateDataSize(data).sizeMB;
};

/**
 * Registra el tamaño de datos en localStorage
 * @param {any} data - Los datos a registrar
 * @param {string} serviceName - Nombre del servicio
 * @param {string} method - Método utilizado
 */
export const logDataSize = (data, serviceName, method) => {
    if (!data) return;

    const sizes = calculateDataSize(data);
    const timestamp = new Date().toISOString();
    const dateTime = new Date().toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const logEntry = {
        sizeBytes: sizes.sizeBytes,
        sizeKB: sizes.sizeKB,
        sizeMB: sizes.sizeMB,
        method: method,
        service: serviceName,
        dateTime: dateTime,
        timestamp: timestamp
    };

    try {
        // Obtener registros existentes o crear array vacío
        const existingLogs = localStorage.getItem('dataFetchLogs');
        const logs = existingLogs ? JSON.parse(existingLogs) : [];

        // Agregar nuevo registro
        logs.push(logEntry);

        // Guardar de vuelta en localStorage
        localStorage.setItem('dataFetchLogs', JSON.stringify(logs));
    } catch (error) {
        console.error('Error guardando en localStorage:', error);
    }
};

/**
 * Limpia los logs de dataFetchLogs si ha pasado un día desde el último registro
 * Compara la fecha del último registro guardado con la fecha actual
 * Esta función debe ser llamada al inicio de Home.jsx y HomeEmpleado.jsx
 */
export const clearDataFetchLogsIfNeeded = () => {
    try {
        const existingLogs = localStorage.getItem('dataFetchLogs');
        
        // Si no hay logs, no hay nada que limpiar
        if (!existingLogs) {
            return;
        }

        const logs = JSON.parse(existingLogs);
        
        // Si el array está vacío, no hay nada que limpiar
        if (!logs || logs.length === 0) {
            return;
        }

        // Obtener el último registro (el más reciente)
        const lastLog = logs[logs.length - 1];
        
        // Si no tiene timestamp, no podemos comparar, así que limpiamos por seguridad
        if (!lastLog.timestamp) {
            localStorage.removeItem('dataFetchLogs');
            console.log('🧹 Logs de dataFetchLogs limpiados (sin timestamp válido)');
            return;
        }

        // Comparar fechas: obtener solo la fecha (sin hora) del último registro y de hoy
        const lastLogDate = new Date(lastLog.timestamp).toDateString();
        const today = new Date().toDateString();
        
        // Si la fecha del último registro es diferente a hoy, limpiar logs
        if (lastLogDate !== today) {
            localStorage.removeItem('dataFetchLogs');
            console.log('🧹 Logs de dataFetchLogs limpiados (reset diario)');
        }
    } catch (error) {
        console.error('Error limpiando logs diarios:', error);
    }
};

/**
 * Componente que calcula el tamaño de datos en MB y los registra en localStorage
 * @param {any} data - Los datos a calcular
 * @param {string} serviceName - Nombre del servicio
 * @param {string} method - Método utilizado
 */
function DataSizeLogger({ data, serviceName, method }) {
    if (data) {
        logDataSize(data, serviceName, method);
    }
    return null; // Componente no renderiza nada
}

export default DataSizeLogger;

