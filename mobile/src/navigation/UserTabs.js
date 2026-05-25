import React from 'react';
import UserDashboardScreen from '../screens/UserDashboardScreen';
import CatalogScreen from '../screens/CatalogScreen';
import BookBorrowingsScreen from '../screens/BookBorrowingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ResponsiveSidebarShell from './ResponsiveSidebarShell';

export default function UserTabs() {
  return (
    <ResponsiveSidebarShell
      title="Library"
      subtitle="Student / Faculty Portal"
      initialRouteName="Dashboard"
      items={[
        { section: 'Main', name: 'Dashboard', label: 'Home', icon: 'home', component: UserDashboardScreen },
        { section: 'Main', name: 'Catalog', label: 'Catalog', icon: 'book', component: CatalogScreen },
        { section: 'Main', name: 'BookBorrowings', label: 'Book Borrowings', icon: 'library', component: BookBorrowingsScreen },
        { section: 'Main', name: 'Notifications', label: 'Alerts', icon: 'notifications', component: NotificationsScreen },
        { section: 'Account', name: 'Settings', label: 'Me', icon: 'settings', component: SettingsScreen },
      ]}
    />
  );
}
