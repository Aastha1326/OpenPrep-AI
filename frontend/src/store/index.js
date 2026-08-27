import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import flashcardsReducer from './slices/flashcardSlice';
import revisionSchedulerReducer from './slices/revisionSchedulerSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    flashcards: flashcardsReducer,
    revisionScheduler: revisionSchedulerReducer,
  },
});

export default store;
