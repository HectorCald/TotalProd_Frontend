const API_BASE_URL = process.env.REACT_APP_API_URL;

class CompanyTypeService {

    static async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/companyTypes/getAll`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            return data;
        } catch (error) {
            return {
                success: false,
                error: 'Error de conexión con el servidor'
            };
        }
    }

}

export default CompanyTypeService;
