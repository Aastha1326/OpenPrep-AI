import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import flashcardsReducer from './slices/flashcardSlice';
import interviewReducer from './slices/interviewSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    flashcards: flashcardsReducer,
    interview: interviewReducer,
  },
});

export default store;
