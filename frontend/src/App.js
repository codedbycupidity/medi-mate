// frontend/src/App.js (Text-Only Component Placeholders)
import React, { useState } from 'react'

// Placeholder Components - implement these later
const Dashboard = () => <div className="p-8 text-center text-brand-600">Dashboard</div>
const Medications = () => <div className="p-8 text-center text-brand-600">Medications</div>
const Reminders = () => <div className="p-8 text-center text-brand-600">Reminders</div>
const Profile = () => <div className="p-8 text-center text-brand-600">Profile</div>
const Settings = () => <div className="p-8 text-center text-brand-600">Settings</div>
const Calendar = () => <div className="p-8 text-center text-brand-600">Calendar</div>
const Analytics = () => <div className="p-8 text-center text-brand-600">Analytics</div>
const Notifications = () => <div className="p-8 text-center text-brand-600">Notifications</div>
const MedicationDetail = () => <div className="p-8 text-center text-brand-600">MedicationDetail</div>
const ReminderHistory = () => <div className="p-8 text-center text-brand-600">ReminderHistory</div>
const DoseTracker = () => <div className="p-8 text-center text-brand-600">DoseTracker</div>
const Reports = () => <div className="p-8 text-center text-brand-600">Reports</div>
const Help = () => <div className="p-8 text-center text-brand-600">Help</div>

function App() {
  const [currentView, setCurrentView] = useState('dashboard')

  // Simple view switcher - replace with proper routing later
  const renderCurrentView = () => {
    switch(currentView) {
      case 'dashboard': return <Dashboard />
      case 'medications': return <Medications />
      case 'reminders': return <Reminders />
      case 'add-medication': return <AddMedication />
      case 'profile': return <Profile />
      case 'settings': return <Settings />
      case 'calendar': return <Calendar />
      case 'analytics': return <Analytics />
      case 'notifications': return <Notifications />
      case 'medication-detail': return <MedicationDetail />
      case 'reminder-history': return <ReminderHistory />
      case 'dose-tracker': return <DoseTracker />
      case 'reports': return <Reports />
      case 'emergency': return <Emergency />
      case 'help': return <Help />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-brand-50">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b border-brand-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-dark-900">
              MediMate
            </h1>
            <nav className="hidden md:flex space-x-6">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  currentView === 'dashboard' ? 'text-dark-900' : 'text-brand-700 hover:text-dark-900'
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setCurrentView('medications')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  currentView === 'medications' ? 'text-dark-900' : 'text-brand-700 hover:text-dark-900'
                }`}
              >
                Medications
              </button>
              <button 
                onClick={() => setCurrentView('reminders')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  currentView === 'reminders' ? 'text-dark-900' : 'text-brand-700 hover:text-dark-900'
                }`}
              >
                Reminders
              </button>
              <button 
                onClick={() => setCurrentView('calendar')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  currentView === 'calendar' ? 'text-dark-900' : 'text-brand-700 hover:text-dark-900'
                }`}
              >
                Calendar
              </button>
              <button 
                onClick={() => setCurrentView('analytics')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  currentView === 'analytics' ? 'text-dark-900' : 'text-brand-700 hover:text-dark-900'
                }`}
              >
                Analytics
              </button>
              <button 
                onClick={() => setCurrentView('profile')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  currentView === 'profile' ? 'text-dark-900' : 'text-brand-700 hover:text-dark-900'
                }`}
              >
                Profile
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto">
        {renderCurrentView()}
      </main>

      {/* Quick Action Buttons */}
      <div className="fixed bottom-6 right-6 space-y-3">
        <button 
          onClick={() => setCurrentView('add-medication')}
          className="bg-brand-500 hover:bg-brand-600 text-white p-3 rounded-full shadow-lg transition-all hover:scale-105 text-sm"
          title="Add Medication"
        >
          +
        </button>
        <button 
          onClick={() => setCurrentView('notifications')}
          className="bg-accent-800 hover:bg-accent-900 text-white p-3 rounded-full shadow-lg transition-all hover:scale-105 text-sm"
          title="Notifications"
        >
          !
        </button>
        <button 
          onClick={() => setCurrentView('emergency')}
          className="bg-error-600 hover:bg-error-700 text-white p-3 rounded-full shadow-lg transition-all hover:scale-105 text-sm"
          title="Emergency"
        >
          SOS
        </button>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-200 px-4 py-2">
        <div className="flex justify-around">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="flex flex-col items-center py-2"
          >
            <span className="text-sm font-medium text-brand-600">Dashboard</span>
          </button>
          <button 
            onClick={() => setCurrentView('medications')}
            className="flex flex-col items-center py-2"
          >
            <span className="text-sm font-medium text-brand-600">Medications</span>
          </button>
          <button 
            onClick={() => setCurrentView('reminders')}
            className="flex flex-col items-center py-2"
          >
            <span className="text-sm font-medium text-brand-600">Reminders</span>
          </button>
          <button 
            onClick={() => setCurrentView('calendar')}
            className="flex flex-col items-center py-2"
          >
            <span className="text-sm font-medium text-brand-600">Calendar</span>
          </button>
          <button 
            onClick={() => setCurrentView('profile')}
            className="flex flex-col items-center py-2"
          >
            <span className="text-sm font-medium text-brand-600">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default App