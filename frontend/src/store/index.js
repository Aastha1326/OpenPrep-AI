import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import flashcardsReducer from './slices/flashcardSlice';
import weaknessReducer from './slices/weaknessSlice';
import pyqIntelligenceReducer from './slices/pyqIntelligenceSlice';
import adaptivePlannerReducer from './slices/adaptivePlannerSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    flashcards: flashcardsReducer,
    weakness: weaknessReducer,
    pyqIntelligence: pyqIntelligenceReducer,
    adaptivePlanner: adaptivePlannerReducer,
  },
});

export default store;
