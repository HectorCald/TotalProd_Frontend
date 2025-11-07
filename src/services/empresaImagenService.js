import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.getBaseURL();

// Función helper para obtener el token de autorización
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

class EmpresaImagenService {
    /**
     * Crear nueva imagen de empresa
     * @param {string} imageBase64 - Imagen en base64
     * @param {string} empresaId - ID de la empresa
     * @returns {Promise<Object>} - Respuesta del servidor
     */
    static async createImage(imageBase64, empresaId) {
        try {
            const response = await fetch(`${API_BASE_URL}/empresa-imagen`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    image: imageBase64,
                    empresa_id: empresaId
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Error en la petición');
            }
            
            return data;
        } catch (error) {
            console.error('Error creating empresa imagen:', error);
            throw error;
        }
    }

    /**
     * Obtener imagen de empresa del usuario
     * @param {string} empresaId - ID de la empresa
     * @returns {Promise<Object>} - Respuesta del servidor
     */
    static async getImage(empresaId) {
        try {
            const response = await fetch(`${API_BASE_URL}/empresa-imagen?empresa_id=${empresaId}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Error en la petición');
            }
            
            return data;
        } catch (error) {
            console.error('Error getting empresa imagen:', error);
            throw error;
        }
    }

    /**
     * Actualizar imagen de empresa
     * @param {string} imageBase64 - Nueva imagen en base64
     * @param {string} empresaId - ID de la empresa
     * @returns {Promise<Object>} - Respuesta del servidor
     */
    static async updateImage(imageBase64, empresaId) {
        try {
            const response = await fetch(`${API_BASE_URL}/empresa-imagen`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    image: imageBase64,
                    empresa_id: empresaId
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Error en la petición');
            }
            
            return data;
        } catch (error) {
            console.error('Error updating empresa imagen:', error);
            throw error;
        }
    }

    /**
     * Eliminar imagen de empresa
     * @param {string} empresaId - ID de la empresa
     * @returns {Promise<Object>} - Respuesta del servidor
     */
    static async deleteImage(empresaId) {
        try {
            console.log('🔥🔥🔥 DELETE IMAGE METHOD CALLED 🔥🔥🔥');
            console.log('Attempting to delete empresa imagen...');
            console.log('API URL:', `${API_BASE_URL}/empresa-imagen?empresa_id=${empresaId}`);
            console.log('Headers:', getAuthHeaders());
            
            const response = await fetch(`${API_BASE_URL}/empresa-imagen?empresa_id=${empresaId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            console.log('DELETE Response status:', response.status);
            console.log('DELETE Response ok:', response.ok);
            
            const data = await response.json();
            console.log('DELETE Response data:', data);
            
            if (!response.ok) {
                throw new Error(data.message || 'Error en la petición');
            }
            
            return data;
        } catch (error) {
            console.error('Error deleting empresa imagen:', error);
            throw error;
        }
    }

    /**
     * Obtener URL transformada de la imagen
     * @param {Object} options - Opciones de transformación
     * @param {number} options.width - Ancho de la imagen
     * @param {number} options.height - Alto de la imagen
     * @param {string} options.crop - Tipo de recorte
     * @param {string} options.gravity - Punto de enfoque
     * @returns {Promise<Object>} - Respuesta del servidor
     */
    static async getTransformedUrl(options = {}) {
        try {
            const params = new URLSearchParams();
            
            if (options.width) params.append('width', options.width);
            if (options.height) params.append('height', options.height);
            if (options.crop) params.append('crop', options.crop);
            if (options.gravity) params.append('gravity', options.gravity);

            const response = await fetch(`${API_BASE_URL}/empresa-imagen/transformed?${params.toString()}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Error en la petición');
            }
            
            return data;
        } catch (error) {
            console.error('Error getting transformed URL:', error);
            throw error;
        }
    }

    /**
     * Convertir archivo a base64
     * @param {File} file - Archivo a convertir
     * @returns {Promise<string>} - Imagen en base64
     */
    static async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    /**
     * Validar si el archivo es una imagen válida
     * @param {File} file - Archivo a validar
     * @returns {boolean} - True si es válido
     */
    static validateImageFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 3 * 1024 * 1024; // 3MB máximo

        if (!validTypes.includes(file.type)) {
            throw new Error('Tipo de archivo no válido. Se recomienda PNG con fondo transparente.');
        }

        if (file.size > maxSize) {
            throw new Error('El archivo es demasiado grande. El tamaño máximo es 3MB.');
        }

        return true;
    }
}

export default EmpresaImagenService;
