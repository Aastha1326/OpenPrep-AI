import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import dashboardReducer from './slices/dashboardSlice.js';
import flashcardsReducer from './slices/flashcardSlice.js';
import weaknessReducer from './slices/weaknessSlice.js';
import pyqIntelligenceReducer from './slices/pyqIntelligenceSlice.js';
import adaptivePlannerReducer from './slices/adaptivePlannerSlice.js';
import communityResourceReducer from './slices/communityResourceSlice.js';
import attemptHistoryReducer from './slices/attemptHistorySlice.js';
import revisionSchedulerReducer from './slices/revisionSchedulerSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    flashcards: flashcardsReducer,
    weakness: weaknessReducer,
    pyqIntelligence: pyqIntelligenceReducer,
    adaptivePlanner: adaptivePlannerReducer,
    communityResources: communityResourceReducer,
    attemptHistory: attemptHistoryReducer,
    revisionScheduler: revisionSchedulerReducer,
  },
});

export default store;
