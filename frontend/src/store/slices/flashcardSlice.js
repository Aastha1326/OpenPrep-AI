import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api.js';

export const fetchFlashcards = createAsyncThunk(
  'flashcards/fetchFlashcards',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/flashcards', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch flashcards');
    }
  }
);

export const createFlashcard = createAsyncThunk(
  'flashcards/createFlashcard',
  async (cardData, { rejectWithValue }) => {
    try {
      const response = await API.post('/flashcards', cardData);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create flashcard');
    }
  }
);

export const deleteFlashcard = createAsyncThunk(
  'flashcards/deleteFlashcard',
  async (cardId, { rejectWithValue }) => {
    try {
      await API.delete(`/flashcards/${cardId}`);
      return cardId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete flashcard');
    }
  }
);

const initialState = {
  flashcards: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

const flashcardSlice = createSlice({
  name: 'flashcards',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFlashcards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFlashcards.fulfilled, (state, action) => {
        state.loading = false;
        state.flashcards = action.payload.flashcards || action.payload.data || [];
        state.pagination = action.payload.pagination || {
          total: action.payload.total || 0,
          page: action.payload.page || 1,
          limit: action.payload.limit || 20,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchFlashcards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createFlashcard.fulfilled, (state, action) => {
        state.flashcards.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(deleteFlashcard.fulfilled, (state, action) => {
        state.flashcards = state.flashcards.filter((card) => card.id !== action.payload);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      });
  },
});

export default flashcardSlice.reducer;
