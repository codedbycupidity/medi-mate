import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MedicationsPage from './pages/MedicationsPage';
import RemindersPage from './pages/RemindersPage';
import CreateReminderPage from './pages/CreateReminderPage';
import ReminderHistory from './components/reminders/ReminderHistory';
import DashboardPage from './pages/DashboardPage';
import { ThemeProvider } from './components/providers/theme-provider';
import { NavBar } from './components/NavBar';

// Placeholder Components - implement these later
const Profile: React.FC = () => <div className="p-8 text-center text-foreground">Profile</div>
const Settings: React.FC = () => <div className="p-8 text-center text-foreground">Settings</div>
const Calendar: React.FC = () => <div className="p-8 text-center text-foreground">Calendar</div>
const Analytics: React.FC = () => <div className="p-8 text-center text-foreground">Analytics</div>
const Notifications: React.FC = () => <div className="p-8 text-center text-foreground">Notifications</div>

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
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <NavBar user={user} onLogout={handleLogout} />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2">
        <div className="flex justify-around">
          <a href="/dashboard" className="flex flex-col items-center py-2">
            <span className="text-sm font-medium text-muted-foreground">Dashboard</span>
          </a>
          <a href="/medications" className="flex flex-col items-center py-2">
            <span className="text-sm font-medium text-muted-foreground">Medications</span>
          </a>
          <a href="/reminders" className="flex flex-col items-center py-2">
            <span className="text-sm font-medium text-muted-foreground">Reminders</span>
          </a>
          <a href="/calendar" className="flex flex-col items-center py-2">
            <span className="text-sm font-medium text-muted-foreground">Calendar</span>
          </a>
          <a href="/profile" className="flex flex-col items-center py-2">
            <span className="text-sm font-medium text-muted-foreground">Profile</span>
          </a>
        </div>
      </nav>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="dark">
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
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/medications"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MedicationsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/medications/add"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MedicationsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reminders/create"
          element={
            <ProtectedRoute>
              <MainLayout>
                <CreateReminderPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reminders/history"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ReminderHistory />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reminders"
          element={
            <ProtectedRoute>
              <MainLayout>
                <RemindersPage />
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
    </ThemeProvider>
  );
};

export default App;