import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
// import { API_BASE_URL, API_ENDPOINTS } from '@medimate/shared';

// Get API URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL;
console.log('[API Service] Using API_BASE_URL:', API_BASE_URL);
const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me'
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    UPDATE_PASSWORD: '/users/password',
    DELETE_ACCOUNT: '/users/account'
  },
  MEDICATIONS: {
    LIST: '/medications',
    CREATE: '/medications',
    GET: (id: string) => `/medications/${id}`,
    UPDATE: (id: string) => `/medications/${id}`,
    DELETE: (id: string) => `/medications/${id}`,
    SCHEDULE: (id: string) => `/medications/${id}/schedule`
  },
  REMINDERS: {
    LIST: '/reminders',
    CREATE: '/reminders',
    GET: (id: string) => `/reminders/${id}`,
    UPDATE: (id: string) => `/reminders/${id}`,
    DELETE: (id: string) => `/reminders/${id}`,
    ACKNOWLEDGE: (id: string) => `/reminders/${id}/acknowledge`
  }
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh or redirect to login
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }

  // Auth methods
  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  clearAuthToken(): void {
    localStorage.removeItem('authToken');
  }
}

export const apiClient = new ApiClient();
export { API_ENDPOINTS };