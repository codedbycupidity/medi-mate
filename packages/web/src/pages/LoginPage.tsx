import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import { ThemeToggle } from '../components/theme-toggle';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-foreground mb-2">
            MediMate
          </h1>
          <p className="text-lg text-muted-foreground">
            Your Personal Medication Assistant
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;