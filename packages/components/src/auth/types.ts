export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export interface LoginFormProps extends AuthFormProps {}

export interface SignupFormProps extends AuthFormProps {}