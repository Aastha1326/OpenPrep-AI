const { Client } = require('@notionhq/client');

class NotionSyncService {
  /**
   * Syncs study planner items into a Notion Database
   */
  async syncToNotion(apiKey, databaseId, studySessions = []) {
    if (!apiKey || !databaseId) {
      throw new Error('Notion API Key and Database ID are required');
    }

    const notion = new Client({ auth: apiKey });
    const results = [];

    for (const session of studySessions) {
      const startTime = new Date(session.startTime || Date.now()).toISOString();
      const endTime = new Date(session.endTime || Date.now() + 3600000).toISOString();

      const page = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          Name: {
            title: [{ text: { content: session.title || 'Study Session' } }],
          },
          Date: {
            date: { start: startTime, end: endTime },
          },
          Subject: {
            select: { name: (session.subject || 'General').substring(0, 50) },
          },
          Status: {
            select: { name: session.completed ? 'Completed' : 'Scheduled' },
          },
        },
      });

      results.push(page);
    }

    return {
      syncedCount: results.length,
      pages: results,
    };
  }
}

module.exports = new NotionSyncService();
