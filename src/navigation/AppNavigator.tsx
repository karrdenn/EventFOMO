import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { AuthStackParamList } from './types';

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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={tabIcons[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={PlaceholderScreen} />
      <Tab.Screen name="Create" component={PlaceholderScreen} />
      <Tab.Screen name="Alerts" component={PlaceholderScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="EventDetails" component={PlaceholderScreen} />
      <Stack.Screen name="Scanner" component={PlaceholderScreen} />
      <Stack.Screen name="MyEvents" component={PlaceholderScreen} />
      <Stack.Screen name="EditEvent" component={PlaceholderScreen} />
      <Stack.Screen name="ShowQR" component={PlaceholderScreen} />
      <Stack.Screen name="Attendance" component={PlaceholderScreen} />
      <Stack.Screen name="NotificationPrefs" component={PlaceholderScreen} />
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

  return <NavigationContainer>{user ? <MainStack /> : <AuthFlow />}</NavigationContainer>;
}