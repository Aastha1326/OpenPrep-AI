import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const authHeaders = () => { const t = localStorage.getItem('token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

export const fetchAttemptHistory = createAsyncThunk('attemptHistory/fetch', async (filters, { rejectWithValue }) => {
  try {
    const res = await axios.get(`${API_URL}/attempt-history/history`, { params: filters, headers: authHeaders() });
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchScoreTrends = createAsyncThunk('attemptHistory/fetchTrends', async (filters, { rejectWithValue }) => {
  try {
    const res = await axios.get(`${API_URL}/attempt-history/trends`, { params: filters, headers: authHeaders() });
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchTopicProgress = createAsyncThunk('attemptHistory/fetchTopicProgress', async (subjectId, { rejectWithValue }) => {
  try {
    const params = subjectId ? { subjectId } : {};
    const res = await axios.get(`${API_URL}/attempt-history/topic-progress`, { params, headers: authHeaders() });
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchPerformanceSummary = createAsyncThunk('attemptHistory/fetchSummary', async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get(`${API_URL}/attempt-history/summary`, { headers: authHeaders() });
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

const attemptHistorySlice = createSlice({
  name: 'attemptHistory',
  initialState: { attempts: [], pagination: null, trends: [], trendSummary: null, topicProgress: [], summary: null, loading: false, error: null },
  reducers: { clearAttemptError: (s) => { s.error = null; } },
  extraReducers: (builder) => {
    const pending = (s) => { s.loading = true; s.error = null; };
    const rejected = (s, a) => { s.loading = false; s.error = a.payload; };
    builder
      .addCase(fetchAttemptHistory.pending, pending)
      .addCase(fetchAttemptHistory.fulfilled, (s, a) => { s.loading = false; s.attempts = a.payload.attempts; s.pagination = a.payload.pagination; })
      .addCase(fetchAttemptHistory.rejected, rejected)
      .addCase(fetchScoreTrends.pending, pending)
      .addCase(fetchScoreTrends.fulfilled, (s, a) => { s.loading = false; s.trends = a.payload.trends; s.trendSummary = a.payload.summary; })
      .addCase(fetchScoreTrends.rejected, rejected)
      .addCase(fetchTopicProgress.pending, pending)
      .addCase(fetchTopicProgress.fulfilled, (s, a) => { s.loading = false; s.topicProgress = a.payload.topics; })
      .addCase(fetchTopicProgress.rejected, rejected)
      .addCase(fetchPerformanceSummary.pending, pending)
      .addCase(fetchPerformanceSummary.fulfilled, (s, a) => { s.loading = false; s.summary = a.payload; })
      .addCase(fetchPerformanceSummary.rejected, rejected);
  },
});

export const { clearAttemptError } = attemptHistorySlice.actions;
export default attemptHistorySlice.reducer;
