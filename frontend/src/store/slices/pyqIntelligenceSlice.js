import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchFrequencyAnalysis = createAsyncThunk(
  'pyqIntelligence/fetchFrequency',
  async (subjectId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/pyq-intelligence/frequency/${subjectId}`, { headers: authHeaders() });
      return res.data.data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
);

export const fetchTrendAnalysis = createAsyncThunk(
  'pyqIntelligence/fetchTrends',
  async (subjectId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/pyq-intelligence/trends/${subjectId}`, { headers: authHeaders() });
      return res.data.data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
);

export const fetchRepeatDetection = createAsyncThunk(
  'pyqIntelligence/fetchRepeats',
  async (subjectId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/pyq-intelligence/repeats/${subjectId}`, { headers: authHeaders() });
      return res.data.data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
);

export const fetchSmartRecommendations = createAsyncThunk(
  'pyqIntelligence/fetchRecommendations',
  async (subjectId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/pyq-intelligence/recommendations/${subjectId}`, { headers: authHeaders() });
      return res.data.data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
);

export const fetchFullIntelligence = createAsyncThunk(
  'pyqIntelligence/fetchFull',
  async (subjectId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/pyq-intelligence/full-intelligence/${subjectId}`, { headers: authHeaders() });
      return res.data.data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
);

const pyqIntelligenceSlice = createSlice({
  name: 'pyqIntelligence',
  initialState: {
    frequency: null,
    trends: null,
    repeats: null,
    recommendations: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearPyqError: (state) => { state.error = null; },
    clearIntelligence: (state) => {
      state.frequency = null;
      state.trends = null;
      state.repeats = null;
      state.recommendations = null;
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state) => { state.loading = true; state.error = null; };
    const handleRejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(fetchFrequencyAnalysis.pending, handlePending)
      .addCase(fetchFrequencyAnalysis.fulfilled, (s, a) => { s.loading = false; s.frequency = a.payload; })
      .addCase(fetchFrequencyAnalysis.rejected, handleRejected)
      .addCase(fetchTrendAnalysis.pending, handlePending)
      .addCase(fetchTrendAnalysis.fulfilled, (s, a) => { s.loading = false; s.trends = a.payload; })
      .addCase(fetchTrendAnalysis.rejected, handleRejected)
      .addCase(fetchRepeatDetection.pending, handlePending)
      .addCase(fetchRepeatDetection.fulfilled, (s, a) => { s.loading = false; s.repeats = a.payload; })
      .addCase(fetchRepeatDetection.rejected, handleRejected)
      .addCase(fetchSmartRecommendations.pending, handlePending)
      .addCase(fetchSmartRecommendations.fulfilled, (s, a) => { s.loading = false; s.recommendations = a.payload; })
      .addCase(fetchSmartRecommendations.rejected, handleRejected)
      .addCase(fetchFullIntelligence.pending, handlePending)
      .addCase(fetchFullIntelligence.fulfilled, (s, a) => {
        s.loading = false;
        s.frequency = a.payload.frequency;
        s.trends = a.payload.trends;
        s.repeats = a.payload.repeats;
        s.recommendations = a.payload.recommendations;
      })
      .addCase(fetchFullIntelligence.rejected, handleRejected);
  },
});

export const { clearPyqError, clearIntelligence } = pyqIntelligenceSlice.actions;
export default pyqIntelligenceSlice.reducer;
