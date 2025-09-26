// services/apiService.ts
class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    
    // Intentar obtener token del localStorage al inicializar
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  removeToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Si el token ha expirado, limpiar y redirigir
      if (response.status === 401) {
        this.removeToken();
        // En una app real, aquí redirigirías al login
        throw new Error('Sesión expirada');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP Error ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // --- AUTENTICACIÓN ---
  async login(email: string, password: string) {
    const response = await this.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.success && response.access_token) {
      this.setToken(response.access_token);
      
      // También guardar información del usuario
      if (typeof window !== 'undefined' && response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    }
    
    return response;
  }

  async register(nombre: string, email: string, password: string) {
    return await this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nombre, email, password }),
    });
  }

  async logout() {
    this.removeToken();
    // En una app real, aquí podrías hacer una llamada al servidor para invalidar el token
  }

  // --- DASHBOARD ---
  async getDashboardStats() {
    const response = await this.fetch('/dashboard/stats');
    return response.data;
  }

  async getProfile() {
    const response = await this.fetch('/dashboard/profile');
    return response.data;
  }

  async getAlerts() {
    const response = await this.fetch('/dashboard/alerts');
    return response.data || [];
  }

  async getRecentActivity() {
    const response = await this.fetch('/dashboard/activity');
    return response.data || [];
  }

  // --- SITIOS ---
  async getSites() {
    const response = await this.fetch('/sites/');
    return response.data || [];
  }

  async getAllSites() {
    const response = await this.fetch('/sites/all');
    return response.data || [];
  }

  // --- DISPOSITIVOS ---
  async createDevice(deviceData: {
    nombre: string;
    macAddress: string;
    ipAddress?: string;
    siteId: number;
  }) {
    const response = await this.fetch('/raspberries', {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
    return response;
  }

  async updateDevice(deviceId: number, deviceData: {
    nombre: string;
    macAddress: string;
    ipAddress?: string;
  }) {
    const response = await this.fetch(`/raspberries/${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(deviceData),
    });
    return response;
  }

  async deleteDevice(deviceId: number) {
    const response = await this.fetch(`/raspberries/${deviceId}`, {
      method: 'DELETE',
    });
    return response;
  }

  // --- UTILIDADES ---
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getCurrentUser() {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }
}

// Exportar una instancia singleton
export const apiService = new ApiService();
export default ApiService;