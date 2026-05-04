import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
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

// We'll call preventAutoHideAsync during mount to control timing.

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
  // Preload the common icon fonts from local assets so they are available
  // immediately in production builds.
  const [fontsLoaded] = useFonts({
    'material-community': require('./assets/fonts/MaterialCommunityIcons.ttf'),
    'material': require('./assets/fonts/MaterialIcons.ttf'),
    'ionicons': require('./assets/fonts/Ionicons.ttf'),
    'FontAwesome': require('./assets/fonts/FontAwesome.ttf'),
    'anticon': require('./assets/fonts/AntDesign.ttf'),
    'entypo': require('./assets/fonts/Entypo.ttf'),
    'evilicons': require('./assets/fonts/EvilIcons.ttf'),
    'feather': require('./assets/fonts/Feather.ttf'),
    'FontAwesome5_Regular': require('./assets/fonts/FontAwesome5_Regular.ttf'),
    'FontAwesome5_Solid': require('./assets/fonts/FontAwesome5_Solid.ttf'),
    'FontAwesome5_Brands': require('./assets/fonts/FontAwesome5_Brands.ttf'),
    'FontAwesome6_Regular': require('./assets/fonts/FontAwesome6_Regular.ttf'),
    'FontAwesome6_Solid': require('./assets/fonts/FontAwesome6_Solid.ttf'),
    'FontAwesome6_Brands': require('./assets/fonts/FontAwesome6_Brands.ttf'),
    'fontisto': require('./assets/fonts/Fontisto.ttf'),
    'foundation': require('./assets/fonts/Foundation.ttf'),
    'octicons': require('./assets/fonts/Octicons.ttf'),
    'SimpleLineIcons': require('./assets/fonts/SimpleLineIcons.ttf'),
    'simple-line-icons': require('./assets/fonts/SimpleLineIcons.ttf'),
    'zocial': require('./assets/fonts/Zocial.ttf'),
  });

  const [isReady, setIsReady] = useState(false);

  // Error boundary to surface any JS errors on startup (useful without adb)
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { error: null, info: null };
    }
    componentDidCatch(error, info) {
      this.setState({ error, info });
      // Still log to console for remote error collectors
      console.error(error, info);
    }
    render() {
      if (this.state.error) {
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>App startup error</Text>
            <ScrollView>
              <Text>{String(this.state.error)}</Text>
              <Text>{this.state.info?.componentStack}</Text>
            </ScrollView>
          </View>
        );
      }
      return this.props.children;
    }
  }

  // Control the native splash: prevent auto-hide, then hide when ready or after timeout
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
      } catch (e) {
        // ignore
      }

      if (fontsLoaded && mounted) {
        await SplashScreen.hideAsync();
        setIsReady(true);
      }
    })();

    const fallback = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
      if (mounted) setIsReady(true);
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(fallback);
    };
  }, [fontsLoaded]);

  // Also react immediately when fonts finish loading
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
      setIsReady(true);
    }
  }, [fontsLoaded]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
      setIsReady(true);
    }
  }, [fontsLoaded]);

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <Provider store={store}>
          <ErrorBoundary>
            <AppShell />
          </ErrorBoundary>
        </Provider>
      </SafeAreaProvider>
      {/* small overlay to match native splash until we consider app ready */}
      {!isReady && <View style={styles.splashPlaceholder} pointerEvents="none" />}
    </View>
  );
}

const styles = StyleSheet.create({
  splashPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EBEBB6',
  },
  errorContainer: { flex: 1, padding: 20 },
  errorTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
});
