import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Placeholder Components - implement these later
const Dashboard: React.FC = () => <div className="p-8 text-center text-brand-600">Dashboard</div>
const Medications: React.FC = () => <div className="p-8 text-center text-brand-600">Medications</div>
const Reminders: React.FC = () => <div className="p-8 text-center text-brand-600">Reminders</div>
const Profile: React.FC = () => <div className="p-8 text-center text-brand-600">Profile</div>
const Settings: React.FC = () => <div className="p-8 text-center text-brand-600">Settings</div>
const Calendar: React.FC = () => <div className="p-8 text-center text-brand-600">Calendar</div>
const Analytics: React.FC = () => <div className="p-8 text-center text-brand-600">Analytics</div>
const Notifications: React.FC = () => <div className="p-8 text-center text-brand-600">Notifications</div>

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('authToken') !== null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Main Layout Component
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-brand-50">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b border-brand-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-dark-900">
              MediMate
            </h1>
            <nav className="hidden md:flex space-x-6 items-center">
              <a href="/dashboard" className="px-3 py-2 text-sm font-medium text-brand-700 hover:text-dark-900">
                Dashboard
              </a>
              <a href="/medications" className="px-3 py-2 text-sm font-medium text-brand-700 hover:text-dark-900">
                Medications
              </a>
              <a href="/reminders" className="px-3 py-2 text-sm font-medium text-brand-700 hover:text-dark-900">
                Reminders
              </a>
              <a href="/calendar" className="px-3 py-2 text-sm font-medium text-brand-700 hover:text-dark-900">
                Calendar
              </a>
              <a href="/analytics" className="px-3 py-2 text-sm font-medium text-brand-700 hover:text-dark-900">
                Analytics
              </a>
              <a href="/profile" className="px-3 py-2 text-sm font-medium text-brand-700 hover:text-dark-900">
                Profile
              </a>
              <div className="ml-4 flex items-center space-x-4">
                {user && (
                  <span className="text-sm text-gray-600">
                    Welcome, {user.name}
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-200 px-4 py-2">
        <div className="flex justify-around">
          <a href="/dashboard" className="flex flex-col items-center py-2">
            <span className="text-sm font-medium text-brand-600">Dashboard</span>
          </a>
          <a href="/medications" className="flex flex-col items-center py-2">
            <span className="text-sm font-medium text-brand-600">Medications</span>
          </a>
          <a href="/reminders" className="flex flex-col items-center py-2">
            <span className="text-sm font-medium text-brand-600">Reminders</span>
          </a>
          <a href="/calendar" className="flex flex-col items-center py-2">
            <span className="text-sm font-medium text-brand-600">Calendar</span>
          </a>
          <a href="/profile" className="flex flex-col items-center py-2">
            <span className="text-sm font-medium text-brand-600">Profile</span>
          </a>
        </div>
      </nav>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/medications"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Medications />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reminders"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Reminders />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Calendar />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Analytics />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Settings />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Notifications />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

export default App;