import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import UserTabs from './UserTabs';
import AdminTabs from './AdminTabs';
import SuperadminTabs from './SuperadminTabs';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const user = useSelector((state) => state.auth.user);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : user.role === 'admin' ? (
        <Stack.Screen name="AdminRoot" component={AdminTabs} />
      ) : user.role === 'superadmin' ? (
        <Stack.Screen name="SuperadminRoot" component={SuperadminTabs} />
      ) : (
        <Stack.Screen name="UserRoot" component={UserTabs} />
      )}
    </Stack.Navigator>
  );
}
