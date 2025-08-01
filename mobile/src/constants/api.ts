// API configuration for mobile app
// In production, this should point to your actual API server

const API_HOST = __DEV__ ? 'http://localhost:3001' : 'https://api.medimate.com';

export const API_URL = `${API_HOST}/api`;

export const API_ENDPOINTS = {
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