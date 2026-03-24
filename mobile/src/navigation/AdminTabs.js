import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ManageBooksScreen from '../screens/ManageBooksScreen';
import ReportsScreen from '../screens/ReportsScreen';
import VerifyUsersScreen from '../screens/VerifyUsersScreen';
import { palette, shadows } from '../theme/colors';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: { focused: 'speedometer', unfocused: 'speedometer-outline' },
  Approvals: { focused: 'checkmark-circle', unfocused: 'checkmark-circle-outline' },
  Scanner: { focused: 'scan', unfocused: 'scan-outline' },
  Books: { focused: 'book', unfocused: 'book-outline' },
  Reports: { focused: 'stats-chart', unfocused: 'stats-chart-outline' },
};

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: palette.white, ...shadows.sm },
        headerTintColor: palette.chestnut,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: palette.white,
          borderTopColor: palette.gray200,
          borderTopWidth: 1,
          paddingTop: 4,
          height: 60,
          ...shadows.md,
        },
        tabBarActiveTintColor: palette.chestnut,
        tabBarInactiveTintColor: palette.gray400,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = TAB_ICONS[route.name] || TAB_ICONS.Dashboard;
          return <Ionicons name={focused ? icons.focused : icons.unfocused} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Approvals" component={VerifyUsersScreen} />
      <Tab.Screen name="Scanner" component={ScannerScreen} />
      <Tab.Screen name="Books" component={ManageBooksScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}
