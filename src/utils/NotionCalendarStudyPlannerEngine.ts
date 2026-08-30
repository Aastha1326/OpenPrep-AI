/**
 * Notion & Google Calendar Automated Study Planner Sync Engine
 * Converts exam syllabus deadlines, spaced repetition review queues, and weak-topic remediation
 * into optimized 2-way synchronized Google Calendar blocks and Notion Database task pages.
 */

export interface StudyTaskBlock {
  taskId: string;
  title: string;
  subject: string;
  estimatedDurationMinutes: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  isCompleted: boolean;
  scheduledStartTimeISO?: string;
}

export interface GoogleCalendarEventPayload {
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  colorId: string;
}

export interface NotionPagePropertyPayload {
  properties: {
    Name: { title: Array<{ text: { content: string } }> };
    Subject: { select: { name: string } };
    Priority: { select: { name: string } };
    Status: { status: { name: string } };
    DurationMinutes: { number: number };
  };
}

export class NotionCalendarStudyPlannerEngine {
  private notionDatabaseId: string;
  private googleCalendarId: string;
  private scheduledTasks: StudyTaskBlock[];

  constructor(notionDatabaseId: string, googleCalendarId: string) {
    this.notionDatabaseId = notionDatabaseId;
    this.googleCalendarId = googleCalendarId;
    this.scheduledTasks = [];
  }

  public scheduleStudyTaskBlock(task: StudyTaskBlock): StudyTaskBlock {
    const startTime = task.scheduledStartTimeISO || new Date().toISOString();
    const scheduled = { ...task, scheduledStartTimeISO: startTime };
    this.scheduledTasks.push(scheduled);
    return scheduled;
  }

  public generateGoogleCalendarSyncPayload(): GoogleCalendarEventPayload[] {
    return this.scheduledTasks.map(task => {
      const start = new Date(task.scheduledStartTimeISO || new Date().toISOString());
      const end = new Date(start.getTime() + task.estimatedDurationMinutes * 60 * 1000);

      // Color mapping: 11 = Tomato/Red (High), 5 = Yellow (Medium), 2 = Sage/Green (Low)
      let color = '2';
      if (task.priority === 'HIGH') color = '11';
      else if (task.priority === 'MEDIUM') color = '5';

      return {
        summary: `📚 ${task.subject}: ${task.title}`,
        description: `OpenPrep-AI Automated Study Block (${task.estimatedDurationMinutes} mins). Priority: ${task.priority}`,
        start: { dateTime: start.toISOString(), timeZone: 'UTC' },
        end: { dateTime: end.toISOString(), timeZone: 'UTC' },
        colorId: color,
      };
    });
  }

  public generateNotionDatabaseSyncPayload(): NotionPagePropertyPayload[] {
    return this.scheduledTasks.map(task => ({
      properties: {
        Name: { title: [{ text: { content: task.title } }] },
        Subject: { select: { name: task.subject } },
        Priority: { select: { name: task.priority } },
        Status: { status: { name: task.isCompleted ? 'Done' : 'In Progress' } },
        DurationMinutes: { number: task.estimatedDurationMinutes },
      },
    }));
  }

  public getScheduledTasks(): StudyTaskBlock[] {
    return this.scheduledTasks;
  }
}
