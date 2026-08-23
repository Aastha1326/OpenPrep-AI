// ── Widget Registry & Layout Defaults ──

export const WIDGET_REGISTRY = [
  {
    id: 'progress-chart',
    name: 'Progress Chart',
    componentName: 'ProgressChart',
    description: 'Weekly completion trend chart and study stats summary.',
    category: 'Analytics',
    defaultSize: { colSpan: 6 },
  },
  {
    id: 'recent-tests',
    name: 'Recent Tests',
    componentName: 'RecentTests',
    description: 'Overview of recent quiz and PYQ test attempts and scores.',
    category: 'Analytics',
    defaultSize: { colSpan: 6 },
  },
  {
    id: 'quick-start',
    name: 'Quick Start',
    componentName: 'QuickStart',
    description: 'Instant launch action shortcuts for quizzes, study plans, and notes.',
    category: 'Study',
    defaultSize: { colSpan: 12 },
  },
  {
    id: 'pinned-tasks',
    name: 'Upcoming Tasks',
    componentName: 'PinnedTasks',
    description: 'Today’s study plan goals and pinned tasks.',
    category: 'Tasks',
    defaultSize: { colSpan: 6 },
  },
  {
    id: 'subject-mastery',
    name: 'Subject Mastery',
    componentName: 'SubjectMastery',
    description: 'Breakdown of syllabus progress per subject.',
    category: 'Analytics',
    defaultSize: { colSpan: 6 },
  },
  {
    id: 'recent-activity',
    name: 'Recent Activity',
    componentName: 'RecentActivity',
    description: 'Log of your recent actions, reviews, and uploads.',
    category: 'Activity',
    defaultSize: { colSpan: 6 },
  },
  {
    id: 'readiness-widget',
    name: 'Exam Readiness',
    componentName: 'ReadinessWidget',
    description: 'Estimated preparedness score for your target exam.',
    category: 'Analytics',
    defaultSize: { colSpan: 6 },
  },
  {
    id: 'flashcard-widget',
    name: 'Flashcard Review',
    componentName: 'FlashcardWidget',
    description: 'Quick review widget for due SM-2 flashcards.',
    category: 'Study',
    defaultSize: { colSpan: 6 },
  },
];

export const DEFAULT_LAYOUT = [
  { id: 'quick-start', colSpan: 12, order: 0 },
  { id: 'progress-chart', colSpan: 6, order: 1 },
  { id: 'recent-tests', colSpan: 6, order: 2 },
  { id: 'pinned-tasks', colSpan: 6, order: 3 },
  { id: 'subject-mastery', colSpan: 6, order: 4 },
];

const getInitialLayout = () => {
  try {
    if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') {
      const saved = localStorage.getItem('openprep_dashboard_layout');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch (e) {
    // fallback to default
  }
  return DEFAULT_LAYOUT;
};

// ── Async Thunks ──

export const fetchDashboardLayout = createAsyncThunk(
  'dashboard/fetchLayout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/user/dashboard');
      if (response.data?.data?.layout) {
        return response.data.data.layout;
      }
      return null;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch dashboard layout');
    }
  }
);

export const saveDashboardLayout = createAsyncThunk(
  'dashboard/saveLayout',
  async (layout, { rejectWithValue }) => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
        localStorage.setItem('openprep_dashboard_layout', JSON.stringify(layout));
      }
      const response = await API.post('/user/dashboard', { layout });
      return response.data?.data?.layout || layout;
    } catch (err) {
      // Even if request fails, return current layout for offline/optimistic updates
      return layout;
    }
  }
);

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
  layout: getInitialLayout(),
  isCustomizing: false,
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
  loadingLayout: false,

  errorStats: null,
  errorSubjects: null,
  errorPlan: null,
  errorFlashcards: null,
  errorAnalytics: null,
  errorLayout: null,
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
    setDashboardLayout: (state, action) => {
      state.layout = action.payload;
      if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
        localStorage.setItem('openprep_dashboard_layout', JSON.stringify(action.payload));
      }
    },
    addWidget: (state, action) => {
      const { id, colSpan } = action.payload;
      if (state.layout.some((item) => item.id === id)) return;
      const regItem = WIDGET_REGISTRY.find((w) => w.id === id);
      const newWidget = {
        id,
        colSpan: colSpan || regItem?.defaultSize?.colSpan || 6,
        order: state.layout.length,
      };
      state.layout.push(newWidget);
      if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
        localStorage.setItem('openprep_dashboard_layout', JSON.stringify(state.layout));
      }
    },
    removeWidget: (state, action) => {
      const widgetId = typeof action.payload === 'string' ? action.payload : action.payload.id;
      state.layout = state.layout.filter((item) => item.id !== widgetId);
      if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
        localStorage.setItem('openprep_dashboard_layout', JSON.stringify(state.layout));
      }
    },
    reorderWidgets: (state, action) => {
      state.layout = action.payload;
      if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
        localStorage.setItem('openprep_dashboard_layout', JSON.stringify(state.layout));
      }
    },
    resizeWidget: (state, action) => {
      const { id, colSpan } = action.payload;
      const target = state.layout.find((w) => w.id === id);
      if (target) {
        target.colSpan = colSpan;
        if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
          localStorage.setItem('openprep_dashboard_layout', JSON.stringify(state.layout));
        }
      }
    },
    resetDashboardLayout: (state) => {
      state.layout = DEFAULT_LAYOUT;
      if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
        localStorage.setItem('openprep_dashboard_layout', JSON.stringify(DEFAULT_LAYOUT));
      }
    },
    toggleCustomizing: (state) => {
      state.isCustomizing = !state.isCustomizing;
    },
    setCustomizing: (state, action) => {
      state.isCustomizing = !!action.payload;
    },
    clearErrors: (state) => {
      state.errorStats = null;
      state.errorSubjects = null;
      state.errorPlan = null;
      state.errorFlashcards = null;
      state.errorLayout = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Fetch Layout ──
      .addCase(fetchDashboardLayout.pending, (state) => {
        state.loadingLayout = true;
        state.errorLayout = null;
      })
      .addCase(fetchDashboardLayout.fulfilled, (state, action) => {
        state.loadingLayout = false;
        if (action.payload && Array.isArray(action.payload) && action.payload.length > 0) {
          state.layout = action.payload;
          if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
            localStorage.setItem('openprep_dashboard_layout', JSON.stringify(action.payload));
          }
        }
      })
      .addCase(fetchDashboardLayout.rejected, (state, action) => {
        state.loadingLayout = false;
        state.errorLayout = action.payload;
      })

      // ── Save Layout ──
      .addCase(saveDashboardLayout.fulfilled, (state, action) => {
        if (action.payload && Array.isArray(action.payload)) {
          state.layout = action.payload;
        }
      })

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

export const {
  toggleTheme,
  setTheme,
  setDashboardLayout,
  addWidget,
  removeWidget,
  reorderWidgets,
  resizeWidget,
  resetDashboardLayout,
  toggleCustomizing,
  setCustomizing,
  clearErrors,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;

