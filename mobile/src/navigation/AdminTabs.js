import React from 'react';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ManageBooksScreen from '../screens/ManageBooksScreen';
import ReportsScreen from '../screens/ReportsScreen';
import VerifyUsersScreen from '../screens/VerifyUsersScreen';
import BorrowingQueueScreen from '../screens/BorrowingQueueScreen';
import ResponsiveSidebarShell from './ResponsiveSidebarShell';

export default function AdminTabs() {
  return (
    <ResponsiveSidebarShell
      title="Admin"
      subtitle="Librarian operations overview"
      initialRouteName="Dashboard"
      items={[
        { section: 'Overview', name: 'Dashboard', label: 'Home', icon: 'speedometer', component: AdminDashboardScreen },
        { section: 'Work', name: 'Approvals', label: 'Approvals', icon: 'checkmark-circle', component: VerifyUsersScreen },
        { section: 'Work', name: 'Scanner', label: 'Scan', icon: 'scan', component: ScannerScreen },
        { section: 'Work', name: 'Borrowings', label: 'Book Loans', icon: 'book', component: BorrowingQueueScreen },
        { section: 'Manage', name: 'Books', label: 'Books', icon: 'library', component: ManageBooksScreen },
        { section: 'Manage', name: 'Reports', label: 'Reports', icon: 'stats-chart', component: ReportsScreen },
      ]}
    />
  );
}
