import axios from 'axios';
import { NativeModules, Platform } from 'react-native';

let tokenRef = null;

export const setAuthToken = (token) => {
  tokenRef = token;
};

const resolveApiBaseUrl = () => {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  if (!configuredBaseUrl.includes('localhost') && !configuredBaseUrl.includes('127.0.0.1')) {
    return configuredBaseUrl;
  }

  const scriptURL = NativeModules?.SourceCode?.scriptURL || '';
  const host = scriptURL ? scriptURL.split('://')[1]?.split(':')[0] : '';

  if (!host) {
    if (Platform.OS === 'android') {
      return configuredBaseUrl.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
    }

    return configuredBaseUrl;
  }

  return configuredBaseUrl.replace('localhost', host).replace('127.0.0.1', host);
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000
});

api.interceptors.request.use((config) => {
  if (tokenRef) {
    config.headers.Authorization = `Bearer ${tokenRef}`;
  }
  return config;
});

export default api;
