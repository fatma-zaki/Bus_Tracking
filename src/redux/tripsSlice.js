import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from './api';

export const fetchTrips = createAsyncThunk(
  'trips/fetchTrips',
  async ({ date, driverId } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (date) {
        const dateObj = new Date(date);
        params.date = dateObj.toISOString().split('T')[0];
      }
      if (driverId) params.driverId = driverId;

      const response = await api.get('/trips', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || {
        message: `Failed to fetch trips: ${error.message}`,
      });
    }
  }
);

export const createTrip = createAsyncThunk(
  'trips/createTrip',
  async (tripData, { rejectWithValue }) => {
    try {
      const response = await api.post('/trips', tripData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const tripsSlice = createSlice({
  name: 'trips',
  initialState: {
    trips: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.trips = action.payload;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createTrip.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.trips.push(action.payload);
      })
      .addCase(createTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default tripsSlice.reducer;