import axios from 'axios';
import { NativeModules, Platform } from 'react-native';

let tokenRef = null;

export const setAuthToken = (token) => {
  tokenRef = token;
};

const resolveApiBaseUrl = () => {
  const configuredBaseUrl = String(process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();

  if (configuredBaseUrl) {
    const normalizedBaseUrl = configuredBaseUrl.replace(/\/+$/, '');
    const localhostMatch = normalizedBaseUrl.match(/^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i);

    if (localhostMatch) {
      const [, host, port = '', path = '/api'] = localhostMatch;
      return `http://${host}${port}${path || '/api'}`.replace(/\/+$/, '');
    }

    return normalizedBaseUrl;
  }

  const defaultBaseUrl = 'http://localhost:5000/api';

  if (Platform.OS === 'web') {
    return `${window.location.origin.replace(/\/$/, '')}/api`;
  }

  if (!defaultBaseUrl.includes('localhost') && !defaultBaseUrl.includes('127.0.0.1')) {
    return defaultBaseUrl;
  }

  const scriptURL = NativeModules?.SourceCode?.scriptURL || '';
  const host = scriptURL ? scriptURL.split('://')[1]?.split(':')[0] : '';

  if (!host) {
    if (Platform.OS === 'android') {
      return defaultBaseUrl.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
    }

    return defaultBaseUrl;
  }

  return defaultBaseUrl.replace('localhost', host).replace('127.0.0.1', host);
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
