import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const authHeaders = () => { const t = localStorage.getItem('token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

export const fetchDiscoverResources = createAsyncThunk('community/fetchDiscover', async (filters, { rejectWithValue }) => {
  try {
    const res = await axios.get(`${API_URL}/community-resources/discover`, { params: filters, headers: authHeaders() });
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchTrendingResources = createAsyncThunk('community/fetchTrending', async (limit = 10, { rejectWithValue }) => {
  try {
    const res = await axios.get(`${API_URL}/community-resources/trending`, { params: { limit }, headers: authHeaders() });
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const rateResource = createAsyncThunk('community/rate', async ({ resourceId, resourceType, stars, comment }, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${API_URL}/community-resources/rate`, { resourceId, resourceType, stars, comment }, { headers: authHeaders() });
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchResourceDetail = createAsyncThunk('community/fetchDetail', async ({ resourceId, resourceType }, { rejectWithValue }) => {
  try {
    const res = await axios.get(`${API_URL}/community-resources/${resourceType}/${resourceId}`, { headers: authHeaders() });
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchCommunityStats = createAsyncThunk('community/fetchStats', async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get(`${API_URL}/community-resources/stats`, { headers: authHeaders() });
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

const communityResourceSlice = createSlice({
  name: 'communityResources',
  initialState: {
    resources: [], pagination: null, trending: [], stats: null, selectedResource: null, loading: false, error: null,
  },
  reducers: { clearCommunityError: (s) => { s.error = null; }, clearSelectedResource: (s) => { s.selectedResource = null; } },
  extraReducers: (builder) => {
    const pending = (s) => { s.loading = true; s.error = null; };
    const rejected = (s, a) => { s.loading = false; s.error = a.payload; };
    builder
      .addCase(fetchDiscoverResources.pending, pending)
      .addCase(fetchDiscoverResources.fulfilled, (s, a) => { s.loading = false; s.resources = a.payload.resources; s.pagination = a.payload.pagination; })
      .addCase(fetchDiscoverResources.rejected, rejected)
      .addCase(fetchTrendingResources.pending, pending)
      .addCase(fetchTrendingResources.fulfilled, (s, a) => { s.loading = false; s.trending = a.payload; })
      .addCase(fetchTrendingResources.rejected, rejected)
      .addCase(rateResource.fulfilled, (s) => { s.loading = false; })
      .addCase(rateResource.rejected, rejected)
      .addCase(fetchResourceDetail.pending, pending)
      .addCase(fetchResourceDetail.fulfilled, (s, a) => { s.loading = false; s.selectedResource = a.payload; })
      .addCase(fetchResourceDetail.rejected, rejected)
      .addCase(fetchCommunityStats.pending, pending)
      .addCase(fetchCommunityStats.fulfilled, (s, a) => { s.loading = false; s.stats = a.payload; })
      .addCase(fetchCommunityStats.rejected, rejected);
  },
});

export const { clearCommunityError, clearSelectedResource } = communityResourceSlice.actions;
export default communityResourceSlice.reducer;
