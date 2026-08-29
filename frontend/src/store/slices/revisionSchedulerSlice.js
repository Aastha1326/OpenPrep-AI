import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

// ── Async Thunks ──

export const fetchSchedules = createAsyncThunk(
  'revisionScheduler/fetchSchedules',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/revision-schedules', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch schedules');
    }
  }
);

export const createSchedule = createAsyncThunk(
  'revisionScheduler/createSchedule',
  async ({ examDate, dailyStudyHours }, { rejectWithValue }) => {
    try {
      const response = await API.post('/revision-schedules', { examDate, dailyStudyHours });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create schedule');
    }
  }
);

export const fetchScheduleById = createAsyncThunk(
  'revisionScheduler/fetchScheduleById',
  async (scheduleId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/revision-schedules/${scheduleId}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch schedule');
    }
  }
);

export const fetchTodaysSlots = createAsyncThunk(
  'revisionScheduler/fetchTodaysSlots',
  async (scheduleId, { rejectWithValue }) => {
    try {
      const params = scheduleId ? { scheduleId } : {};
      const response = await API.get('/revision-schedules/today', { params });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to fetch today's slots");
    }
  }
);

export const fetchCalendarSlots = createAsyncThunk(
  'revisionScheduler/fetchCalendarSlots',
  async ({ startDate, endDate, scheduleId }, { rejectWithValue }) => {
    try {
      const params = { startDate, endDate };
      if (scheduleId) params.scheduleId = scheduleId;
      const response = await API.get('/revision-schedules/calendar', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch calendar slots');
    }
  }
);

export const completeSlot = createAsyncThunk(
  'revisionScheduler/completeSlot',
  async ({ slotId, readinessAfter, notes }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/revision-schedules/slots/${slotId}/complete`, {
        readinessAfter,
        notes,
      });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to complete slot');
    }
  }
);

export const skipSlot = createAsyncThunk(
  'revisionScheduler/skipSlot',
  async (slotId, { rejectWithValue }) => {
    try {
      const response = await API.post(`/revision-schedules/slots/${slotId}/skip`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to skip slot');
    }
  }
);

export const rescheduleSlot = createAsyncThunk(
  'revisionScheduler/rescheduleSlot',
  async ({ slotId, newDate }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/revision-schedules/slots/${slotId}/reschedule`, {
        newDate,
      });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to reschedule slot');
    }
  }
);

export const updateScheduleStatus = createAsyncThunk(
  'revisionScheduler/updateStatus',
  async ({ scheduleId, status }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/revision-schedules/${scheduleId}/status`, { status });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update status');
    }
  }
);

export const deleteSchedule = createAsyncThunk(
  'revisionScheduler/deleteSchedule',
  async (scheduleId, { rejectWithValue }) => {
    try {
      await API.delete(`/revision-schedules/${scheduleId}`);
      return scheduleId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete schedule');
    }
  }
);

// ── Initial State ──

const initialState = {
  schedules: [],
  schedulesPagination: null,
  selectedSchedule: null,
  selectedScheduleSlots: [],
  todaysSlots: [],
  calendarSlots: [],
  calendarGrouped: {},

  loadingSchedules: false,
  loadingSchedule: false,
  loadingToday: false,
  loadingCalendar: false,
  creatingSchedule: false,

  errorSchedules: null,
  errorSchedule: null,
  errorToday: null,
  errorCalendar: null,
};

// ── Slice ──

const revisionSchedulerSlice = createSlice({
  name: 'revisionScheduler',
  initialState,
  reducers: {
    clearSelectedSchedule: (state) => {
      state.selectedSchedule = null;
      state.selectedScheduleSlots = [];
    },
    clearErrors: (state) => {
      state.errorSchedules = null;
      state.errorSchedule = null;
      state.errorToday = null;
      state.errorCalendar = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Fetch Schedules ──
      .addCase(fetchSchedules.pending, (state) => {
        state.loadingSchedules = true;
        state.errorSchedules = null;
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.loadingSchedules = false;
        state.schedules = action.payload.data;
        state.schedulesPagination = {
          total: action.payload.total,
          page: action.payload.page,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.loadingSchedules = false;
        state.errorSchedules = action.payload;
      })

      // ── Create Schedule ──
      .addCase(createSchedule.pending, (state) => {
        state.creatingSchedule = true;
      })
      .addCase(createSchedule.fulfilled, (state, action) => {
        state.creatingSchedule = false;
        state.schedules.unshift(action.payload);
      })
      .addCase(createSchedule.rejected, (state) => {
        state.creatingSchedule = false;
      })

      // ── Fetch Schedule By ID ──
      .addCase(fetchScheduleById.pending, (state) => {
        state.loadingSchedule = true;
        state.errorSchedule = null;
      })
      .addCase(fetchScheduleById.fulfilled, (state, action) => {
        state.loadingSchedule = false;
        state.selectedSchedule = action.payload.data;
        state.selectedScheduleSlots = action.payload.slots || [];
      })
      .addCase(fetchScheduleById.rejected, (state, action) => {
        state.loadingSchedule = false;
        state.errorSchedule = action.payload;
      })

      // ── Today's Slots ──
      .addCase(fetchTodaysSlots.pending, (state) => {
        state.loadingToday = true;
        state.errorToday = null;
      })
      .addCase(fetchTodaysSlots.fulfilled, (state, action) => {
        state.loadingToday = false;
        state.todaysSlots = action.payload || [];
      })
      .addCase(fetchTodaysSlots.rejected, (state, action) => {
        state.loadingToday = false;
        state.errorToday = action.payload;
      })

      // ── Calendar Slots ──
      .addCase(fetchCalendarSlots.pending, (state) => {
        state.loadingCalendar = true;
        state.errorCalendar = null;
      })
      .addCase(fetchCalendarSlots.fulfilled, (state, action) => {
        state.loadingCalendar = false;
        state.calendarSlots = action.payload.data || [];
        state.calendarGrouped = action.payload.groupedByDate || {};
      })
      .addCase(fetchCalendarSlots.rejected, (state, action) => {
        state.loadingCalendar = false;
        state.errorCalendar = action.payload;
      })

      // ── Complete Slot ──
      .addCase(completeSlot.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.todaysSlots.findIndex((s) => s.id === updated.id);
        if (idx !== -1) state.todaysSlots.splice(idx, 1);

        const calIdx = state.calendarSlots.findIndex((s) => s.id === updated.id);
        if (calIdx !== -1) state.calendarSlots[calIdx] = updated;

        const slotIdx = state.selectedScheduleSlots.findIndex((s) => s.id === updated.id);
        if (slotIdx !== -1) state.selectedScheduleSlots[slotIdx] = updated;

        // Update schedule progress
        if (state.selectedSchedule && state.selectedSchedule.id === updated.scheduleId) {
          state.selectedSchedule.completedSlots = (state.selectedSchedule.completedSlots || 0) + 1;
          state.selectedSchedule.overallProgress = state.selectedSchedule.totalSlots > 0
            ? Math.round((state.selectedSchedule.completedSlots / state.selectedSchedule.totalSlots) * 100)
            : 0;
        }
      })

      // ── Skip Slot ──
      .addCase(skipSlot.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.todaysSlots.findIndex((s) => s.id === updated.id);
        if (idx !== -1) state.todaysSlots.splice(idx, 1);
      })

      // ── Reschedule Slot ──
      .addCase(rescheduleSlot.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.todaysSlots.findIndex((s) => s.id === updated.id);
        if (idx !== -1) state.todaysSlots.splice(idx, 1);
      })

      // ── Update Schedule Status ──
      .addCase(updateScheduleStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.schedules.findIndex((s) => s.id === updated.id);
        if (idx !== -1) state.schedules[idx] = updated;
        if (state.selectedSchedule?.id === updated.id) {
          state.selectedSchedule = updated;
        }
      })

      // ── Delete Schedule ──
      .addCase(deleteSchedule.fulfilled, (state, action) => {
        state.schedules = state.schedules.filter((s) => s.id !== action.payload);
        if (state.selectedSchedule?.id === action.payload) {
          state.selectedSchedule = null;
          state.selectedScheduleSlots = [];
        }
      });
  },
});

export const { clearSelectedSchedule, clearErrors } = revisionSchedulerSlice.actions;
export default revisionSchedulerSlice.reducer;
