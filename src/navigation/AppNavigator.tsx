import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
      <Tab.Screen name="Home" component={PlaceholderScreen} />
      <Tab.Screen name="Calendar" component={PlaceholderScreen} />
      <Tab.Screen name="Create" component={PlaceholderScreen} />
      <Tab.Screen name="Alerts" component={PlaceholderScreen} />
      <Tab.Screen name="Profile" component={PlaceholderScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
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
    </NavigationContainer>
  );
}