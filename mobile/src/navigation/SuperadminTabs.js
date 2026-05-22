import React from 'react';
import SuperadminDashboardScreen from '../screens/SuperadminDashboardScreen';
import ManageUsersScreen from '../screens/ManageUsersScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ManageBooksScreen from '../screens/ManageBooksScreen';
import ReportsScreen from '../screens/ReportsScreen';
import AuditLogsScreen from '../screens/AuditLogsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BorrowingQueueScreen from '../screens/BorrowingQueueScreen';
import ResponsiveSidebarShell from './ResponsiveSidebarShell';

export default function SuperadminTabs() {
  return (
    <ResponsiveSidebarShell
      title="Superadmin"
      subtitle="Govern users, staff, and system activity"
      initialRouteName="Overview"
      items={[
        { section: 'Overview', name: 'Overview', label: 'Home', icon: 'shield-checkmark', component: SuperadminDashboardScreen },
        { section: 'Management', name: 'Accounts', label: 'Users', icon: 'people', component: ManageUsersScreen },
        { section: 'Management', name: 'Scanner', label: 'Scan', icon: 'scan', component: ScannerScreen },
        { section: 'Management', name: 'BorrowingQueue', label: 'Book Loans', icon: 'book', component: BorrowingQueueScreen },
        { section: 'Management', name: 'Books', label: 'Books', icon: 'library', component: ManageBooksScreen },
        { section: 'Insights', name: 'Reports', label: 'Reports', icon: 'stats-chart', component: ReportsScreen },
        { section: 'Account', name: 'Profile', label: 'Me', icon: 'person-circle', component: SettingsScreen },
        { section: 'Insights', name: 'Audit Logs', label: 'Logs', icon: 'document-text', component: AuditLogsScreen },
      ]}
    />
  );
}
