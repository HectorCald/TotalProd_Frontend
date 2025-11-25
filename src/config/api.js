// Configuración central de la API
const API_CONFIG = {
    // Cambia aquí para cambiar entre local y producción
    ENVIRONMENT: 'production', // 'local' | 'production'
    
    // URLs de los backends
    LOCAL: 'http://localhost:5000/api',
    PRODUCTION: 'https://total-prod-backend.vercel.app/api',
        
    // Obtener la URL base según el entorno
    getBaseURL() {
        switch(this.ENVIRONMENT) {
            case 'production':
                return this.PRODUCTION;
            case 'local':
            default:
                return this.LOCAL;
        }
    },
    
    // Cambiar entorno fácilmente
    setEnvironment(env) {
        if (['local', 'production'].includes(env)) {
            this.ENVIRONMENT = env;
            console.log(`🌍 API Environment cambiado a: ${env}`);
        } else {
            console.error('❌ Entorno no válido. Use "local" o "production"');
        }
    },
    
    // Obtener información del entorno actual
    getCurrentEnvironment() {
        return this.ENVIRONMENT;
    }
};

export default API_CONFIG;