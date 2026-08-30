/**
 * Notion & Google Calendar Automated Study Planner Sync Dashboard Component
 */

import React, { useState } from 'react';
import {
  NotionCalendarStudyPlannerEngine,
  StudyTaskBlock,
} from '../utils/NotionCalendarStudyPlannerEngine';

export default function NotionCalendarStudyPlannerDashboard() {
  const [engine] = useState(() => {
    const inst = new NotionCalendarStudyPlannerEngine('NOTION-DB-USMLE-2026', 'primary');
    inst.scheduleStudyTaskBlock({
      taskId: 'T1',
      title: 'Renal Physiology Glomerular Filtration High-Yield',
      subject: 'Renal',
      estimatedDurationMinutes: 90,
      priority: 'HIGH',
      isCompleted: false,
      scheduledStartTimeISO: new Date().toISOString(),
    });
    inst.scheduleStudyTaskBlock({
      taskId: 'T2',
      title: 'Immunology Hypersensitivity Reactions Review',
      subject: 'Immunology',
      estimatedDurationMinutes: 60,
      priority: 'MEDIUM',
      isCompleted: true,
      scheduledStartTimeISO: new Date().toISOString(),
    });
    return inst;
  });

  const [tasks, setTasks] = useState<StudyTaskBlock[]>(() => engine.getScheduledTasks());

  const gcalPayload = engine.generateGoogleCalendarSyncPayload();
  const notionPayload = engine.generateNotionDatabaseSyncPayload();

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#F8FAFC' }}>
      <header style={{ marginBottom: '24px', borderBottom: '2px solid #E2E8F0', paddingBottom: '16px' }}>
        <h1 style={{ color: '#059669', margin: 0 }}>📅 Automated Notion & Google Calendar Study Sync</h1>
        <p style={{ color: '#64748B', marginTop: '6px' }}>
          Automated syllabus task block scheduling, 2-way Notion Database sync, and Google Calendar API event creation.
        </p>
      </header>

      {/* Sync Status Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #059669' }}>
          <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Scheduled Tasks</span>
          <h2 style={{ color: '#059669', margin: '4px 0 0 0' }}>{tasks.length} Study Blocks</h2>
          <small style={{ color: '#16A34A' }}>Notion DB Connected</small>
        </div>

        <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #2563EB' }}>
          <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Google Calendar Sync</span>
          <h2 style={{ color: '#2563EB', margin: '4px 0 0 0' }}>{gcalPayload.length} Events Synced</h2>
          <small style={{ color: '#64748B' }}>Primary Calendar</small>
        </div>
      </div>

      {/* Task List & Sync Preview */}
      <div style={{ background: '#FFF', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#0F172A' }}>📋 Synchronized Study Task Schedule</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h4 style={{ color: '#2563EB', marginBottom: '12px' }}>📅 Google Calendar API Payload</h4>
            {gcalPayload.map((evt, idx) => (
              <div key={idx} style={{ background: '#EFF6FF', borderLeft: '4px solid #2563EB', padding: '12px', borderRadius: '6px', marginBottom: '10px' }}>
                <strong style={{ color: '#1E3A8A' }}>{evt.summary}</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#3B82F6' }}>{evt.description}</p>
              </div>
            ))}
          </div>

          <div>
            <h4 style={{ color: '#059669', marginBottom: '12px' }}>📓 Notion Database Page Properties</h4>
            {notionPayload.map((notion, idx) => (
              <div key={idx} style={{ background: '#ECFDF5', borderLeft: '4px solid #059669', padding: '12px', borderRadius: '6px', marginBottom: '10px' }}>
                <strong style={{ color: '#064E3B' }}>{notion.properties.Name.title[0].text.content}</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#047857' }}>
                  Subject: {notion.properties.Subject.select.name} | Status: {notion.properties.Status.status.name} ({notion.properties.DurationMinutes.number} mins)
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
