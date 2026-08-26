import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import authReducer from '../../store/slices/authSlice';
import { QuizRecommendations } from './QuizRecommendations';
import * as api from '../../services/api';

// Mock API service calls
vi.mock('../../services/api', () => ({
  getQuizRecommendations: vi.fn(),
  logRecommendationHit: vi.fn().mockResolvedValue({ data: { success: true } }),
}));

function renderWithProviders(component) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: { user: { id: 'test-user-123', name: 'Student' } },
    },
  });

  return render(
    <Provider store={store}>
      <BrowserRouter>{component}</BrowserRouter>
    </Provider>
  );
}

describe('QuizRecommendations Component', () => {
  const mockRecommendationResponse = {
    data: {
      success: true,
      userId: 'test-user-123',
      userProfile: {
        overallAccuracy: 76,
        weakTopics: ['Data Structures'],
        strongTopics: ['Algorithms'],
      },
      recommendations: [
        {
          id: 'quiz-ds-01',
          title: 'Data Structures & Trees Basics',
          topic: 'Data Structures',
          difficulty: 'medium',
          estimatedMinutes: 8,
          totalQuestions: 10,
          recommendationScore: 94,
          matchReason: 'Targets identified weak topic: Data Structures',
        },
      ],
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    api.getQuizRecommendations.mockResolvedValue(mockRecommendationResponse);
  });

  test('should render header, accuracy metrics, and recommended quiz card', async () => {
    renderWithProviders(<QuizRecommendations userId="test-user-123" />);

    expect(await screen.findByText('AI Quiz Recommendations')).toBeInTheDocument();
    expect(await screen.findByText('76%')).toBeInTheDocument();
    expect(await screen.findByText('Data Structures & Trees Basics')).toBeInTheDocument();
    expect(await screen.findByText('94% Match')).toBeInTheDocument();
  });

  test('should filter by time budget when duration button is clicked', async () => {
    renderWithProviders(<QuizRecommendations userId="test-user-123" />);

    const tenMinButton = await screen.findByRole('button', { name: /10 Mins/i });
    fireEvent.click(tenMinButton);

    await waitFor(() => {
      expect(api.getQuizRecommendations).toHaveBeenCalledWith('test-user-123', {
        timeBudget: 10,
        limit: 6,
      });
    });
  });

  test('should log recommendation hit and trigger callback on click', async () => {
    const handleSelect = vi.fn();
    renderWithProviders(<QuizRecommendations userId="test-user-123" onSelectQuiz={handleSelect} />);

    const startButton = await screen.findByRole('button', { name: /Start Practice Quiz/i });
    fireEvent.click(startButton);

    expect(api.logRecommendationHit).toHaveBeenCalledWith('test-user-123', {
      quizId: 'quiz-ds-01',
      recommendationScore: 94,
      topic: 'Data Structures',
    });
    
    await waitFor(() => {
      expect(handleSelect).toHaveBeenCalledWith(mockRecommendationResponse.data.recommendations[0]);
    });
  });
});
