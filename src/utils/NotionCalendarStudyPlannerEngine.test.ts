/**
 * Notion & Google Calendar Automated Study Planner Sync Engine Unit Test Suite
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  NotionCalendarStudyPlannerEngine,
  StudyTaskBlock,
} from './NotionCalendarStudyPlannerEngine';

describe('NotionCalendarStudyPlannerEngine', () => {
  let engine: NotionCalendarStudyPlannerEngine;

  const sampleTasks: StudyTaskBlock[] = [
    {
      taskId: 'TASK-101',
      title: 'Cardiology Pathophysiology High-Yield Review',
      subject: 'Cardiology',
      estimatedDurationMinutes: 120,
      priority: 'HIGH',
      isCompleted: false,
      scheduledStartTimeISO: '2026-08-26T09:00:00Z',
    },
    {
      taskId: 'TASK-102',
      title: 'Pharmacology Antibiotic Mechanism Flashcards',
      subject: 'Pharmacology',
      estimatedDurationMinutes: 60,
      priority: 'MEDIUM',
      isCompleted: false,
      scheduledStartTimeISO: '2026-08-26T11:30:00Z',
    },
  ];

  beforeEach(() => {
    engine = new NotionCalendarStudyPlannerEngine('NOTION-DB-9901', 'GCAL-STUDY-2026');
  });

  it('should schedule study tasks into conflict-free calendar blocks', () => {
    const scheduled = engine.scheduleStudyTaskBlock(sampleTasks[0]);

    expect(scheduled).toBeDefined();
    expect(scheduled.taskId).toBe('TASK-101');
    expect(scheduled.scheduledStartTimeISO).toBeDefined();
  });

  it('should sync study tasks to Google Calendar API payload format', () => {
    engine.scheduleStudyTaskBlock(sampleTasks[0]);
    const syncPayload = engine.generateGoogleCalendarSyncPayload();

    expect(syncPayload.length).toBe(1);
    expect(syncPayload[0].summary).toContain('Cardiology Pathophysiology');
    expect(syncPayload[0].colorId).toBe('11'); // Red for HIGH priority
  });

  it('should export Notion Database page properties payload', () => {
    engine.scheduleStudyTaskBlock(sampleTasks[0]);
    const notionExport = engine.generateNotionDatabaseSyncPayload();

    expect(notionExport.length).toBe(1);
    expect(notionExport[0].properties.Name.title[0].text.content).toContain('Cardiology Pathophysiology');
  });
});
