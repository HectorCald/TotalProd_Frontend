/**
 * Valida si un correo electrónico tiene un formato correcto,
 * incluyendo arrobas, dominios y extensiones más comunes.
 * 
 * @param {string} email 
 * @returns {boolean}
 */
export const validateEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    
    const trimmed = email.trim();
    
    // Expresión regular estándar para formato de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) return false;
    
    const parts = trimmed.split('@');
    if (parts.length !== 2) return false;
    
    const domain = parts[1].toLowerCase();
    
    // Validar extensión del dominio (.com, .es, .net, etc.)
    const domainParts = domain.split('.');
    if (domainParts.length < 2) return false;
    
    const extension = domainParts[domainParts.length - 1];
    
    // Extensiones (.etc) y dominios más conocidos
    const extensionesComunes = [
        'com', 'es', 'net', 'org', 'co', 'info', 'biz', 'io', 'edu', 'gov', 
        'online', 'xyz', 'me', 'us', 'cl', 'mx', 'ar', 'pe', 've', 'uy', 'bo', 'py', 'ec'
    ];
    
    if (!extensionesComunes.includes(extension) && extension.length > 4) {
        return false;
    }
    
    return true;
};
