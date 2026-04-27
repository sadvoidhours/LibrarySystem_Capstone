import React, { useCallback } from 'react';
import { View } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { createAppTheme } from './src/theme/colors';

// Prevent the splash screen from auto-hiding while assets/fonts load
SplashScreen.preventAutoHideAsync().catch(() => {});

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
  const [fontsLoaded] = useFonts(MaterialCommunityIcons.font);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <Provider store={store}>
          <AppShell />
        </Provider>
      </SafeAreaProvider>
    </View>
  );
}
