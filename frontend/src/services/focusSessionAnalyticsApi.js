import API from './api';

// ── Session Lifecycle ────────────────────────────────────────────────────

/**
 * Start a new focus session.
 * @param {{ subject?: string, subjectName?: string, taskType: string, plannedMinutes?: number, dailyGoalMinutes?: number, tags?: string[], notes?: string }} payload
 */
export const startFocusSession = (payload) => API.post('/focus-analytics/sessions', payload);

/**
 * End a focus session.
 * @param {string} sessionId
 * @param {{ interrupted?: boolean }} payload
 */
export const endFocusSession = (sessionId, payload = {}) =>
  API.post(`/focus-analytics/sessions/${sessionId}/end`, payload);

/**
 * Pause/resume a focus session.
 * @param {string} sessionId
 */
export const toggleFocusPause = (sessionId) =>
  API.post(`/focus-analytics/sessions/${sessionId}/pause`);

/**
 * Record an interruption during a focus session.
 * @param {string} sessionId
 * @param {{ reason?: string, durationSeconds?: number }} payload
 */
export const recordInterruption = (sessionId, payload = {}) =>
  API.post(`/focus-analytics/sessions/${sessionId}/interruption`, payload);

// ── Queries ──────────────────────────────────────────────────────────────

/**
 * Get paginated session history.
 * @param {{ status?: string, subject?: string, taskType?: string, startDate?: string, endDate?: string, page?: number, limit?: number }} params
 */
export const getFocusSessions = (params = {}) =>
  API.get('/focus-analytics/sessions', { params });

/**
 * Get a single session by ID.
 * @param {string} sessionId
 */
export const getFocusSession = (sessionId) =>
  API.get(`/focus-analytics/sessions/${sessionId}`);

// ── Analytics ────────────────────────────────────────────────────────────

/**
 * Get weekly analytics breakdown.
 * @param {{ weekStart?: string }} params
 */
export const getWeeklyAnalytics = (params = {}) =>
  API.get('/focus-analytics/analytics/weekly', { params });

/**
 * Get streak data.
 */
export const getFocusStreaks = () =>
  API.get('/focus-analytics/analytics/streaks');

/**
 * Get dashboard summary (today, week, month, streaks).
 */
export const getFocusDashboard = () =>
  API.get('/focus-analytics/analytics/dashboard');

/**
 * Get hourly heatmap data (7x24 matrix).
 */
export const getHourlyHeatmap = () =>
  API.get('/focus-analytics/analytics/heatmap');

/**
 * Get efficiency trend over the last N days.
 * @param {{ days?: number }} params
 */
export const getEfficiencyTrend = (params = {}) =>
  API.get('/focus-analytics/analytics/efficiency-trend', { params });
