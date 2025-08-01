import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';

interface RequestOptions extends RequestInit {
  authenticated?: boolean;
}

class ApiService {
  private baseURL: string;

  constructor() {
    // Use the shared API URL constant
    this.baseURL = API_URL;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { authenticated = true, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (authenticated) {
      const token = await this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.makeRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      authenticated: false,
    });

    if (response.token) {
      await AsyncStorage.setItem('authToken', response.token);
    }

    return response;
  }

  async logout() {
    await AsyncStorage.removeItem('authToken');
  }

  async register(data: { email: string; password: string; name: string }) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      authenticated: false,
    });
  }

  // Medication endpoints
  async getMedications() {
    return this.makeRequest('/medications');
  }

  async createMedication(medication: any) {
    return this.makeRequest('/medications', {
      method: 'POST',
      body: JSON.stringify(medication),
    });
  }

  async updateMedication(id: string, medication: any) {
    return this.makeRequest(`/medications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(medication),
    });
  }

  async deleteMedication(id: string) {
    return this.makeRequest(`/medications/${id}`, {
      method: 'DELETE',
    });
  }

  // Reminder endpoints
  async getReminders() {
    return this.makeRequest('/reminders');
  }

  async createReminder(reminder: any) {
    return this.makeRequest('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminder),
    });
  }

  async updateReminder(id: string, reminder: any) {
    return this.makeRequest(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reminder),
    });
  }

  async deleteReminder(id: string) {
    return this.makeRequest(`/reminders/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.makeRequest('/health', { authenticated: false });
  }
}

export default new ApiService();