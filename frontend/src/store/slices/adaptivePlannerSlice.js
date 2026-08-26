import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const generateAdaptivePlan = createAsyncThunk(
  'adaptivePlanner/generate',
  async ({ examDate, dailyHours, subjectIds }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/adaptive-planner/generate`, { examDate, dailyHours, subjectIds }, { headers: authHeaders() });
      return res.data.data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
);

export const fetchAdaptiveAdjustments = createAsyncThunk(
  'adaptivePlanner/fetchAdjustments',
  async (planId, { rejectWithValue }) => {
    try {
      const url = planId ? `${API_URL}/adaptive-planner/adjustments/${planId}` : `${API_URL}/adaptive-planner/adjustments`;
      const res = await axios.get(url, { headers: authHeaders() });
      return res.data.data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
);

export const fetchTodayTasks = createAsyncThunk(
  'adaptivePlanner/fetchToday',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/adaptive-planner/today`, { headers: authHeaders() });
      return res.data.data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
);

export const fetchPlanStats = createAsyncThunk(
  'adaptivePlanner/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/adaptive-planner/stats`, { headers: authHeaders() });
      return res.data.data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
);

const adaptivePlannerSlice = createSlice({
  name: 'adaptivePlanner',
  initialState: {
    plan: null,
    adjustments: [],
    summary: null,
    todayTasks: [],
    todaySummary: null,
    planStats: null,
    generating: false,
    loading: false,
    error: null,
    generatedPlan: null,
  },
  reducers: {
    clearAdaptiveError: (state) => { state.error = null; },
    clearGeneratedPlan: (state) => { state.generatedPlan = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateAdaptivePlan.pending, (s) => { s.generating = true; s.error = null; })
      .addCase(generateAdaptivePlan.fulfilled, (s, a) => { s.generating = false; s.generatedPlan = a.payload; })
      .addCase(generateAdaptivePlan.rejected, (s, a) => { s.generating = false; s.error = a.payload; })
      .addCase(fetchAdaptiveAdjustments.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchAdaptiveAdjustments.fulfilled, (s, a) => {
        s.loading = false; s.plan = a.payload.plan; s.adjustments = a.payload.adjustments; s.summary = a.payload.summary;
      })
      .addCase(fetchAdaptiveAdjustments.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchTodayTasks.pending, (s) => { s.loading = true; })
      .addCase(fetchTodayTasks.fulfilled, (s, a) => { s.loading = false; s.todayTasks = a.payload.tasks; s.todaySummary = a.payload.summary; })
      .addCase(fetchTodayTasks.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchPlanStats.pending, (s) => { s.loading = true; })
      .addCase(fetchPlanStats.fulfilled, (s, a) => { s.loading = false; s.planStats = a.payload; })
      .addCase(fetchPlanStats.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const { clearAdaptiveError, clearGeneratedPlan } = adaptivePlannerSlice.actions;
export default adaptivePlannerSlice.reducer;
