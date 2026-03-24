import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import UserDashboardScreen from '../screens/UserDashboardScreen';
import CatalogScreen from '../screens/CatalogScreen';
import BorrowingsScreen from '../screens/BorrowingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { getThemePalette, shadows } from '../theme/colors';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: { focused: 'home', unfocused: 'home-outline' },
  Catalog: { focused: 'book', unfocused: 'book-outline' },
  Borrowings: { focused: 'library', unfocused: 'library-outline' },
  Notifications: { focused: 'notifications', unfocused: 'notifications-outline' },
  Settings: { focused: 'settings', unfocused: 'settings-outline' },
};

export default function UserTabs() {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: palette.background, ...shadows.sm },
        headerTintColor: palette.gray800,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
        headerTitleAlign: 'center',
        tabBarStyle: {
          backgroundColor: palette.white,
          borderTopColor: palette.gray100,
          borderTopWidth: 1,
          paddingTop: 6,
          height: 64,
          ...shadows.md,
        },
        tabBarActiveTintColor: palette.chestnut,
        tabBarInactiveTintColor: palette.gray400,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = TAB_ICONS[route.name] || TAB_ICONS.Dashboard;
          return <Ionicons name={focused ? icons.focused : icons.unfocused} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={UserDashboardScreen} />
      <Tab.Screen name="Catalog" component={CatalogScreen} />
      <Tab.Screen name="Borrowings" component={BorrowingsScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
