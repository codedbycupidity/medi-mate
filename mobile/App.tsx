import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import {AuthProvider} from './src/contexts/AuthContext';

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

export default App;