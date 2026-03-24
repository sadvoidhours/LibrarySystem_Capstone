import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import SuperadminDashboardScreen from '../screens/SuperadminDashboardScreen';
import ManageUsersScreen from '../screens/ManageUsersScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ManageBooksScreen from '../screens/ManageBooksScreen';
import ReportsScreen from '../screens/ReportsScreen';
import AuditLogsScreen from '../screens/AuditLogsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { palette, shadows } from '../theme/colors';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Overview: { focused: 'shield-checkmark', unfocused: 'shield-checkmark-outline' },
  Accounts: { focused: 'people', unfocused: 'people-outline' },
  Scanner: { focused: 'scan', unfocused: 'scan-outline' },
  Books: { focused: 'book', unfocused: 'book-outline' },
  Reports: { focused: 'stats-chart', unfocused: 'stats-chart-outline' },
  Profile: { focused: 'person-circle', unfocused: 'person-circle-outline' },
  'Audit Logs': { focused: 'document-text', unfocused: 'document-text-outline' },
};

export default function SuperadminTabs() {
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
          const icons = TAB_ICONS[route.name] || TAB_ICONS.Overview;
          return <Ionicons name={focused ? icons.focused : icons.unfocused} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Overview" component={SuperadminDashboardScreen} />
      <Tab.Screen name="Accounts" component={ManageUsersScreen} />
      <Tab.Screen name="Scanner" component={ScannerScreen} />
      <Tab.Screen name="Books" component={ManageBooksScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Profile" component={SettingsScreen} />
      <Tab.Screen name="Audit Logs" component={AuditLogsScreen} />
    </Tab.Navigator>
  );
}
