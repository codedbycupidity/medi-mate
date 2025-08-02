import React from 'react';
import LoginForm from '../components/auth/LoginForm';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-dark-900 mb-2">
            MediMate
          </h1>
          <p className="text-lg text-brand-600">
            Your Personal Medication Assistant
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;