import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { setAuthToken } from '../../api/client';

const parseAuthError = (error, fallbackMessage) => {
  if (error?.response?.data?.errors?.length) {
    return error.response.data.errors[0]?.msg || fallbackMessage;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }

  if (!error?.response) {
    return 'Unable to connect to server. Check network/API URL.';
  }

  return fallbackMessage;
};

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    setAuthToken(data.token);
    return data;
  } catch (error) {
    return rejectWithValue(parseAuthError(error, 'Login failed'));
  }
});

export const register = createAsyncThunk(
  'auth/register',
  async ({ name, email, phone, studentIdNumber, password, role = 'student' }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', {
        name,
        email,
        phone,
        studentIdNumber,
        password,
        role
      });

      return data;
    } catch (error) {
      return rejectWithValue(parseAuthError(error, 'Registration failed'));
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (updates, { rejectWithValue }) => {
    try {
      const { data } = await api.patch('/users/me', updates);
      return data;
    } catch (error) {
      return rejectWithValue(parseAuthError(error, 'Unable to update profile'));
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch('/users/me/password', { currentPassword, newPassword });
      return data;
    } catch (error) {
      return rejectWithValue(parseAuthError(error, 'Unable to change password'));
    }
  }
);

const initialState = {
  token: null,
  user: null,
  loading: false,
  error: null,
  registerMessage: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.error = null;
      state.registerMessage = null;
      setAuthToken(null);
    },
    clearAuthFeedback: (state) => {
      state.error = null;
      state.registerMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.registerMessage = null;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.registerMessage = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.registerMessage = action.payload.message || 'Registration submitted.';
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { logout, clearAuthFeedback } = authSlice.actions;
export default authSlice.reducer;
