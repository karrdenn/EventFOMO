import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ProfileScreen from '../screens/ProfileScreen';
import HomeScreen from '../screens/HomeScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { useColors, useTheme } from '../theme';
import { AuthStackParamList } from './types';
import MyEventsScreen from '../screens/MyEventsScreen';
import EditEventScreen from '../screens/EditEventScreen';
import CalendarScreen from '../screens/CalendarScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AlertsScreen from '../screens/AlertsScreen';
import NotificationPrefsScreen from '../screens/NotificationPrefsScreen';
import AppearanceScreen from '../screens/AppearanceScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ShowQRScreen from '../screens/ShowQRScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import AttendanceHistoryScreen from '../screens/AttendanceHistoryScreen';
import { useReminderSync } from '../hooks/useReminderSync';
import { useNotificationTap } from '../hooks/useNotificationTap';
import { usePushRegistration } from '../hooks/usePushRegistration';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tabIcons: Record<string, IconName> = {
  Home: 'home',
  Calendar: 'calendar',
  Create: 'add-circle',
  Alerts: 'notifications',
  Profile: 'person',
};

function Tabs() {
  const { profile } = useAuth();
  const colors = useColors();
  const { unread } = useNotifications(profile?.uid);
  useReminderSync();
  usePushRegistration();
  useNotificationTap();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.divider },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={tabIcons[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Create" component={CreateEventScreen} />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{ tabBarBadge: unread > 0 ? unread : undefined }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function MainStack() {
  const colors = useColors();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} options={{ title: 'Event Details' }} />
      <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} options={{ title: 'Attendance History' }} />
      <Stack.Screen name="MyEvents" component={MyEventsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditEvent" component={EditEventScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Check In' }} />
      <Stack.Screen name="ShowQR" component={ShowQRScreen} options={{ title: 'Event QR Code' }} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} options={{ title: 'Attendance' }} />
      <Stack.Screen
        name="NotificationPrefs"
        component={NotificationPrefsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Appearance" component={AppearanceScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function AuthFlow() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, profile, loading, logOut } = useAuth();
  const { colors, isDark } = useTheme();

  // Colors the navigation system uses for backgrounds, cards and borders.
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.divider,
    },
  };

  // Checking who is logged in, or waiting for the profile to load.
  if (loading || (user && !profile)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        {user && !profile && !loading ? (
          <TouchableOpacity onPress={() => logOut()} style={{ marginTop: 24 }}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Log out</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>{user ? <MainStack /> : <AuthFlow />}</NavigationContainer>
  );
}