import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

// ── Async Thunks ──

export const fetchGoals = createAsyncThunk(
  'studyGoals/fetchGoals',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/study-goals', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch goals');
    }
  }
);

export const fetchGoalById = createAsyncThunk(
  'studyGoals/fetchGoalById',
  async (goalId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/study-goals/${goalId}`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch goal');
    }
  }
);

export const createGoal = createAsyncThunk(
  'studyGoals/createGoal',
  async (goalData, { rejectWithValue }) => {
    try {
      const response = await API.post('/study-goals', goalData);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create goal');
    }
  }
);

export const updateGoal = createAsyncThunk(
  'studyGoals/updateGoal',
  async ({ goalId, updates }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/study-goals/${goalId}`, updates);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update goal');
    }
  }
);

export const deleteGoal = createAsyncThunk(
  'studyGoals/deleteGoal',
  async (goalId, { rejectWithValue }) => {
    try {
      await API.delete(`/study-goals/${goalId}`);
      return goalId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete goal');
    }
  }
);

export const recordProgress = createAsyncThunk(
  'studyGoals/recordProgress',
  async ({ goalId, value, source, note }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/study-goals/${goalId}/progress`, {
        value,
        source,
        note,
      });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to record progress');
    }
  }
);

export const fetchDailyStats = createAsyncThunk(
  'studyGoals/fetchDailyStats',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await API.get('/study-goals/stats/daily', {
        params: { startDate, endDate },
      });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch daily stats');
    }
  }
);

export const fetchSubjectAnalytics = createAsyncThunk(
  'studyGoals/fetchSubjectAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/study-goals/stats/subjects');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch subject analytics');
    }
  }
);

export const fetchStreakMetrics = createAsyncThunk(
  'studyGoals/fetchStreakMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/study-goals/stats/streaks');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch streak metrics');
    }
  }
);

export const fetchDashboard = createAsyncThunk(
  'studyGoals/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/study-goals/dashboard');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch dashboard');
    }
  }
);

export const generateWeeklyReport = createAsyncThunk(
  'studyGoals/generateWeeklyReport',
  async ({ weekStart, weekEnd }, { rejectWithValue }) => {
    try {
      const response = await API.post('/study-goals/reports/weekly', {
        weekStart,
        weekEnd,
      });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to generate report');
    }
  }
);

export const fetchWeeklyReports = createAsyncThunk(
  'studyGoals/fetchWeeklyReports',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/study-goals/reports/weekly', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch reports');
    }
  }
);

// ── Initial State ──

const initialState = {
  goals: [],
  goalsPagination: null,
  selectedGoal: null,
  selectedGoalProgress: [],
  dashboard: null,
  dailyStats: null,
  subjectAnalytics: [],
  streakMetrics: null,
  weeklyReports: [],
  weeklyReportsPagination: null,

  loadingGoals: false,
  loadingGoal: false,
  loadingDashboard: false,
  loadingStats: false,
  loadingSubjects: false,
  loadingStreaks: false,
  loadingReports: false,
  creatingGoal: false,
  recordingProgress: false,

  errorGoals: null,
  errorGoal: null,
  errorDashboard: null,
  errorStats: null,
  errorSubjects: null,
  errorStreaks: null,
  errorReports: null,
};

// ── Slice ──

const studyGoalSlice = createSlice({
  name: 'studyGoals',
  initialState,
  reducers: {
    clearSelectedGoal: (state) => {
      state.selectedGoal = null;
      state.selectedGoalProgress = [];
    },
    clearErrors: (state) => {
      state.errorGoals = null;
      state.errorGoal = null;
      state.errorDashboard = null;
      state.errorStats = null;
      state.errorSubjects = null;
      state.errorStreaks = null;
      state.errorReports = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Fetch Goals ──
      .addCase(fetchGoals.pending, (state) => {
        state.loadingGoals = true;
        state.errorGoals = null;
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.loadingGoals = false;
        state.goals = action.payload.data;
        state.goalsPagination = {
          total: action.payload.total,
          page: action.payload.page,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.loadingGoals = false;
        state.errorGoals = action.payload;
      })

      // ── Fetch Goal By ID ──
      .addCase(fetchGoalById.pending, (state) => {
        state.loadingGoal = true;
        state.errorGoal = null;
      })
      .addCase(fetchGoalById.fulfilled, (state, action) => {
        state.loadingGoal = false;
        state.selectedGoal = action.payload;
      })
      .addCase(fetchGoalById.rejected, (state, action) => {
        state.loadingGoal = false;
        state.errorGoal = action.payload;
      })

      // ── Create Goal ──
      .addCase(createGoal.pending, (state) => {
        state.creatingGoal = true;
      })
      .addCase(createGoal.fulfilled, (state, action) => {
        state.creatingGoal = false;
        state.goals.unshift(action.payload);
      })
      .addCase(createGoal.rejected, (state) => {
        state.creatingGoal = false;
      })

      // ── Update Goal ──
      .addCase(updateGoal.fulfilled, (state, action) => {
        const idx = state.goals.findIndex((g) => g.id === action.payload.id);
        if (idx !== -1) state.goals[idx] = action.payload;
        if (state.selectedGoal?.id === action.payload.id) {
          state.selectedGoal = action.payload;
        }
      })

      // ── Delete Goal ──
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.goals = state.goals.filter((g) => g.id !== action.payload);
        if (state.selectedGoal?.id === action.payload) {
          state.selectedGoal = null;
          state.selectedGoalProgress = [];
        }
      })

      // ── Record Progress ──
      .addCase(recordProgress.pending, (state) => {
        state.recordingProgress = true;
      })
      .addCase(recordProgress.fulfilled, (state, action) => {
        state.recordingProgress = false;
        const updatedGoal = action.payload.goal;
        const idx = state.goals.findIndex((g) => g.id === updatedGoal.id);
        if (idx !== -1) state.goals[idx] = updatedGoal;
        if (state.selectedGoal?.id === updatedGoal.id) {
          state.selectedGoal = updatedGoal;
        }
      })
      .addCase(recordProgress.rejected, (state) => {
        state.recordingProgress = false;
      })

      // ── Dashboard ──
      .addCase(fetchDashboard.pending, (state) => {
        state.loadingDashboard = true;
        state.errorDashboard = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loadingDashboard = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loadingDashboard = false;
        state.errorDashboard = action.payload;
      })

      // ── Daily Stats ──
      .addCase(fetchDailyStats.pending, (state) => {
        state.loadingStats = true;
        state.errorStats = null;
      })
      .addCase(fetchDailyStats.fulfilled, (state, action) => {
        state.loadingStats = false;
        state.dailyStats = action.payload;
      })
      .addCase(fetchDailyStats.rejected, (state, action) => {
        state.loadingStats = false;
        state.errorStats = action.payload;
      })

      // ── Subject Analytics ──
      .addCase(fetchSubjectAnalytics.pending, (state) => {
        state.loadingSubjects = true;
        state.errorSubjects = null;
      })
      .addCase(fetchSubjectAnalytics.fulfilled, (state, action) => {
        state.loadingSubjects = false;
        state.subjectAnalytics = action.payload;
      })
      .addCase(fetchSubjectAnalytics.rejected, (state, action) => {
        state.loadingSubjects = false;
        state.errorSubjects = action.payload;
      })

      // ── Streak Metrics ──
      .addCase(fetchStreakMetrics.pending, (state) => {
        state.loadingStreaks = true;
        state.errorStreaks = null;
      })
      .addCase(fetchStreakMetrics.fulfilled, (state, action) => {
        state.loadingStreaks = false;
        state.streakMetrics = action.payload;
      })
      .addCase(fetchStreakMetrics.rejected, (state, action) => {
        state.loadingStreaks = false;
        state.errorStreaks = action.payload;
      })

      // ── Weekly Reports ──
      .addCase(fetchWeeklyReports.pending, (state) => {
        state.loadingReports = true;
        state.errorReports = null;
      })
      .addCase(fetchWeeklyReports.fulfilled, (state, action) => {
        state.loadingReports = false;
        state.weeklyReports = action.payload.data;
        state.weeklyReportsPagination = {
          total: action.payload.total,
          page: action.payload.page,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchWeeklyReports.rejected, (state, action) => {
        state.loadingReports = false;
        state.errorReports = action.payload;
      });
  },
});

export const { clearSelectedGoal, clearErrors } = studyGoalSlice.actions;
export default studyGoalSlice.reducer;
