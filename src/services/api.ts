const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || '/api';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Session expirée, veuillez vous reconnecter.');
      }
      const errorText = await response.text();
      throw new Error(errorText || `Erreur ${response.status}`);
    }

    if (response.status === 204) return {} as T;

    return response.json();
  }

  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('token', response.token);
    return response;
  }

  logout() {
    localStorage.removeItem('token');
  }

  async getUsers(page = 1, search = '', filters: Record<string, any> = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      ...(search ? { search } : {}),
      ...filters,
    });
    return this.request(`/users/?${params.toString()}`);
  }

  async getUser(id: string) {
    return this.request(`/users/${id}/`);
  }

  async createUser(userData: any) {
    return this.request('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}/`, {
      method: 'DELETE',
    });
  }

  async getDashboardStats() {
    return this.request('/dashboard/stats/');
  }

  async updateUserPermissions(userId: string, permissions: string[]) {
    return this.request(`/users/${userId}/permissions/`, {
      method: 'POST',
      body: JSON.stringify({ permissions }),
    });
  }

  async getSettings() {
    return this.request('/settings/');
  }

  async updateSettings(settings: any) {
    return this.request('/settings/', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
