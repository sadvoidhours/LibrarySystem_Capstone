import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { createAppTheme } from './src/theme/colors';

function AppShell() {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const theme = createAppTheme(themeMode);

  return (
    <NavigationContainer theme={theme}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    MaterialCommunityIcons.loadFont().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <AppShell />
      </Provider>
    </SafeAreaProvider>
  );
}
