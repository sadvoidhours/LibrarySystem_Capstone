import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/client';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/notifications/my');
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to load notifications');
  }
});

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/notifications/${notificationId}/read`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update notification');
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const updated = action.payload;
        state.items = state.items.map((notification) =>
          notification._id === updated._id ? updated : notification
        );
      });
  }
});

export default notificationsSlice.reducer;
