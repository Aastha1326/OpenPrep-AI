import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TargetExamOverviewWidget from './TargetExamOverviewWidget';
import API from '../../services/api';

vi.mock('../../services/api');

describe('TargetExamOverviewWidget Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no composite exam bundle exists', async () => {
    API.get.mockResolvedValueOnce({
      data: { success: true, data: null },
    });

    render(<TargetExamOverviewWidget onOpenBundleModal={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Multi-Subject Target Exam Bundle/i)).toBeInTheDocument();
      expect(screen.getByText(/\+ Create Exam Bundle/i)).toBeInTheDocument();
    });
  });

  it('renders target exam overview with subject weightage breakdown', async () => {
    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          examId: 'exam-123',
          examName: 'JEE Advanced Target',
          isBundle: true,
          targetExamType: 'JEE',
          cumulativeProgress: 65,
          subjects: [
            { id: 's1', name: 'Mathematics', weightage: 33.3, topicCount: 12, progressPercentage: 70 },
            { id: 's2', name: 'Physics', weightage: 33.3, topicCount: 10, progressPercentage: 60 },
            { id: 's3', name: 'Chemistry', weightage: 33.4, topicCount: 14, progressPercentage: 65 },
          ],
        },
      },
    });

    render(<TargetExamOverviewWidget onOpenBundleModal={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/JEE Advanced Target/i)).toBeInTheDocument();
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
      expect(screen.getByText('Physics')).toBeInTheDocument();
      expect(screen.getByText('Chemistry')).toBeInTheDocument();
    });
  });
});
