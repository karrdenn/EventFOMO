import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { configureNotifications } from './src/services/reminders';
import { ThemeProvider, useTheme } from './src/theme';

// Sets up how reminders look and behave. This runs once, when the app starts.
configureNotifications();

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
          <ThemedStatusBar />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}