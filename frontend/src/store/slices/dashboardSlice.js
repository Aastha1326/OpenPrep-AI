import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

// ── Async Thunks ──

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/progress/dashboard');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch dashboard stats');
    }
  }
);

export const fetchInteractiveAnalytics = createAsyncThunk(
  'dashboard/fetchInteractiveAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/progress/analytics');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch interactive analytics');
    }
  }
);

export const fetchSubjectBreakdown = createAsyncThunk(
  'dashboard/fetchSubjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/progress/subjects');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch subject breakdown');
    }
  }
);

export const fetchActivePlan = createAsyncThunk(
  'dashboard/fetchActivePlan',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/study-plans/active');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch study plan');
    }
  }
);

export const fetchDueFlashcards = createAsyncThunk(
  'dashboard/fetchFlashcards',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/flashcards?dueOnly=true');
      return response.data.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch flashcards');
    }
  }
);

export const reviewFlashcard = createAsyncThunk(
  'dashboard/reviewFlashcard',
  async ({ cardId, quality }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/flashcards/${cardId}/review`, { quality });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to review flashcard');
    }
  }
);

// ── Helper: Initial theme detection ──
const getInitialTheme = () => {
  try {
    if (typeof localStorage === 'undefined' || !localStorage || typeof localStorage.getItem !== 'function') {
      return 'light';
    }
    const saved = localStorage.getItem('openprep_theme') || localStorage.getItem('theme');
    return saved === 'dark' ? 'dark' : 'light';
  } catch (e) {
    return 'light';
  }
};


// ── Initial State ──
const initialState = {
  theme: getInitialTheme(),
  stats: null,
  weeklyChartData: [],
  recentActivity: [],
  subjectBreakdown: [],
  activePlan: null,
  dueFlashcards: [],
  interactiveAnalytics: null,

  loadingStats: false,
  loadingSubjects: false,
  loadingPlan: false,
  loadingFlashcards: false,
  loadingAnalytics: false,

  errorStats: null,
  errorSubjects: null,
  errorPlan: null,
  errorFlashcards: null,
  errorAnalytics: null,
};

// ── Slice ──
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      // Rotate through: system -> light -> dark -> high-contrast
      let nextTheme = 'system';

      if (state.theme === 'system') nextTheme = 'light';
      else if (state.theme === 'light') nextTheme = 'dark';
      else if (state.theme === 'dark') nextTheme = 'high-contrast';
      
      state.theme = nextTheme;
      localStorage.setItem('openprep_theme', nextTheme);
      localStorage.setItem('theme', nextTheme);
    },

    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('openprep_theme', action.payload);
      localStorage.setItem('theme', action.payload);
    },
    clearErrors: (state) => {
      state.errorStats = null;
      state.errorSubjects = null;
      state.errorPlan = null;
      state.errorFlashcards = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Dashboard Stats ──
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loadingStats = true;
        state.errorStats = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loadingStats = false;
        state.stats = action.payload;
        state.weeklyChartData = action.payload.weeklyChartData || [];
        state.recentActivity = action.payload.recentActivity || [];
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loadingStats = false;
        state.errorStats = action.payload;
      })

      // ── Subject Breakdown ──
      .addCase(fetchSubjectBreakdown.pending, (state) => {
        state.loadingSubjects = true;
        state.errorSubjects = null;
      })
      .addCase(fetchSubjectBreakdown.fulfilled, (state, action) => {
        state.loadingSubjects = false;
        state.subjectBreakdown = action.payload || [];
      })
      .addCase(fetchSubjectBreakdown.rejected, (state, action) => {
        state.loadingSubjects = false;
        state.errorSubjects = action.payload;
      })

      // ── Active Plan ──
      .addCase(fetchActivePlan.pending, (state) => {
        state.loadingPlan = true;
        state.errorPlan = null;
      })
      .addCase(fetchActivePlan.fulfilled, (state, action) => {
        state.loadingPlan = false;
        state.activePlan = action.payload;
      })
      .addCase(fetchActivePlan.rejected, (state, action) => {
        state.loadingPlan = false;
        state.errorPlan = action.payload;
        state.activePlan = null;
      })

      // ── Due Flashcards ──
      .addCase(fetchDueFlashcards.pending, (state) => {
        state.loadingFlashcards = true;
        state.errorFlashcards = null;
      })
      .addCase(fetchDueFlashcards.fulfilled, (state, action) => {
        state.loadingFlashcards = false;
        state.dueFlashcards = action.payload || [];
      })
      .addCase(fetchDueFlashcards.rejected, (state, action) => {
        state.loadingFlashcards = false;
        state.errorFlashcards = action.payload;
      })

      // ── Review Flashcard ──
      .addCase(reviewFlashcard.fulfilled, (state, action) => {
        const reviewedId = action.meta.arg.cardId;
        state.dueFlashcards = state.dueFlashcards.filter((c) => c.id !== reviewedId);
      })

      // ── Interactive Analytics ──
      .addCase(fetchInteractiveAnalytics.pending, (state) => {
        state.loadingAnalytics = true;
        state.errorAnalytics = null;
      })
      .addCase(fetchInteractiveAnalytics.fulfilled, (state, action) => {
        state.loadingAnalytics = false;
        state.interactiveAnalytics = action.payload;
      })
      .addCase(fetchInteractiveAnalytics.rejected, (state, action) => {
        state.loadingAnalytics = false;
        state.errorAnalytics = action.payload;
      });
  },
});

export const { toggleTheme, setTheme, clearErrors } = dashboardSlice.actions;
export default dashboardSlice.reducer;
