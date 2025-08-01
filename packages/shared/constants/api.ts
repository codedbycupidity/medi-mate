// API base URL should be configured per platform
// Frontend: import.meta.env.VITE_API_URL
// Mobile: Config.API_URL_DEV or Config.API_URL_PROD
// Backend: process.env.API_URL
export const API_BASE_URL = process.env.API_URL || '/api';

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