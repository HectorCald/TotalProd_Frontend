// Configuración central de la API
const API_CONFIG = {
    // Cambia aquí para cambiar entre local, mobile y producción
    ENVIRONMENT: 'production', // 'local' | 'mobile' | 'production'
    
    // URLs de los backends
    LOCAL: 'http://localhost:5000/api',
    MOBILE: 'http://192.168.100.193:5000/api', // IP de tu PC para desarrollo móvil
    PRODUCTION: 'https://total-prod-backend.vercel.app/api',
    
    // Obtener la URL base según el entorno
    getBaseURL() {
        switch(this.ENVIRONMENT) {
            case 'production':
                return this.PRODUCTION;
            case 'mobile':
                return this.MOBILE;
            case 'local':
            default:
                return this.LOCAL;
        }
    },
    
    // Cambiar entorno fácilmente
    setEnvironment(env) {
        if (['local', 'mobile', 'production'].includes(env)) {
            this.ENVIRONMENT = env;
            console.log(`🌍 API Environment cambiado a: ${env}`);
        } else {
            console.error('❌ Entorno no válido. Use "local", "mobile" o "production"');
        }
    },
    
    // Obtener información del entorno actual
    getCurrentEnvironment() {
        return this.ENVIRONMENT;
    }
};

export default API_CONFIG;
