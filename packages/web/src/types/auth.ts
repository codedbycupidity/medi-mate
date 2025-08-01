export interface User {
  _id: string;
  email: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  status: 'success' | 'fail' | 'error';
  message: string;
  token: string;
  data: {
    user: User;
  };
}

export interface LoginResponse extends AuthResponse {}
export interface RegisterResponse extends AuthResponse {}

export interface ApiError {
  status?: 'fail' | 'error';
  message: string;
  errors?: Record<string, string>;
}