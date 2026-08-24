import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Async thunks
export const analyzeWeakness = createAsyncThunk(
  'weakness/analyze',
  async (snapshotType = 'manual', { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/weakness/analyze`,
        { snapshotType },
        { headers: getAuthHeaders() }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to analyze weaknesses'
      );
    }
  }
);

export const fetchWeaknessProfile = createAsyncThunk(
  'weakness/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/weakness/profile`, {
        headers: getAuthHeaders(),
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch weakness profile'
      );
    }
  }
);

export const fetchWeaknessReports = createAsyncThunk(
  'weakness/fetchReports',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/weakness/reports`, {
        params: { page, limit },
        headers: getAuthHeaders(),
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch weakness reports'
      );
    }
  }
);

export const fetchWeaknessTrends = createAsyncThunk(
  'weakness/fetchTrends',
  async (limit = 30, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/weakness/trends`, {
        params: { limit },
        headers: getAuthHeaders(),
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch weakness trends'
      );
    }
  }
);

export const fetchWeaknessHeatmap = createAsyncThunk(
  'weakness/fetchHeatmap',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/weakness/heatmap`, {
        headers: getAuthHeaders(),
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch heatmap data'
      );
    }
  }
);

export const fetchRecommendations = createAsyncThunk(
  'weakness/fetchRecommendations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/weakness/recommendations`, {
        headers: getAuthHeaders(),
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch recommendations'
      );
    }
  }
);

export const fetchSubjectAnalysis = createAsyncThunk(
  'weakness/fetchSubjectAnalysis',
  async (subjectId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/weakness/subject/${subjectId}`,
        { headers: getAuthHeaders() }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch subject analysis'
      );
    }
  }
);

const weaknessSlice = createSlice({
  name: 'weakness',
  initialState: {
    profile: null,
    reports: [],
    reportsPagination: null,
    trends: [],
    heatmap: null,
    heatmapSummary: null,
    recommendations: [],
    weakTopics: [],
    selectedSubject: null,
    analysisResult: null,
    loading: false,
    analyzing: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAnalysisResult: (state) => {
      state.analysisResult = null;
    },
    clearSelectedSubject: (state) => {
      state.selectedSubject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // analyzeWeakness
      .addCase(analyzeWeakness.pending, (state) => {
        state.analyzing = true;
        state.error = null;
      })
      .addCase(analyzeWeakness.fulfilled, (state, action) => {
        state.analyzing = false;
        state.analysisResult = action.payload;
        state.profile = action.payload.profile;
      })
      .addCase(analyzeWeakness.rejected, (state, action) => {
        state.analyzing = false;
        state.error = action.payload;
      })

      // fetchWeaknessProfile
      .addCase(fetchWeaknessProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeaknessProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchWeaknessProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchWeaknessReports
      .addCase(fetchWeaknessReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeaknessReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload.reports;
        state.reportsPagination = action.payload.pagination;
      })
      .addCase(fetchWeaknessReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchWeaknessTrends
      .addCase(fetchWeaknessTrends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeaknessTrends.fulfilled, (state, action) => {
        state.loading = false;
        state.trends = action.payload;
      })
      .addCase(fetchWeaknessTrends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchWeaknessHeatmap
      .addCase(fetchWeaknessHeatmap.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeaknessHeatmap.fulfilled, (state, action) => {
        state.loading = false;
        state.heatmap = action.payload.heatmap;
        state.heatmapSummary = action.payload.summary;
      })
      .addCase(fetchWeaknessHeatmap.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchRecommendations
      .addCase(fetchRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.recommendations = action.payload.recommendations;
        state.weakTopics = action.payload.weakTopics;
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchSubjectAnalysis
      .addCase(fetchSubjectAnalysis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubjectAnalysis.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedSubject = action.payload;
      })
      .addCase(fetchSubjectAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearAnalysisResult, clearSelectedSubject } =
  weaknessSlice.actions;

export default weaknessSlice.reducer;
