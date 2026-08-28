/**
 * Dispatches daily digest notifications to external webhook URLs (e.g. Discord, WhatsApp Gateway).
 */
async function dispatchWebhookNotification(webhookUrl, briefing) {
  const { userName, scheduledTopics = [], overdueFlashcardsCount = 0, streakCount = 0, quote = '' } = briefing;

  const discordPayload = {
    embeds: [
      {
        title: 'OpenPrep AI Daily Revision Digest 📚',
        description: `*"${quote}"*`,
        color: 3447003, // Blue
        fields: [
          { name: 'Student', value: userName, inline: true },
          { name: 'Streak 🔥', value: `${streakCount} Days`, inline: true },
          { name: 'Overdue Flashcards 📇', value: `${overdueFlashcardsCount} Cards`, inline: true },
          {
            name: 'Scheduled Topics',
            value: scheduledTopics.length > 0 ? scheduledTopics.map(t => `• ${t}`).join('\n') : 'None scheduled.',
          },
        ],
        url: 'https://openprep.ai/dashboard',
      },
    ],
  };

  if (!webhookUrl) {
    console.log(`\n[WEBHOOK] Outgoing Dispatch Muted: No Webhook URL provided.`);
    console.log(`[WEBHOOK] Payload:`, JSON.stringify(discordPayload, null, 2));
    return { success: true, preview: true };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload),
    });

    return { success: response.status < 400, status: response.status };
  } catch (err) {
    console.error('[WebhookDispatcher] Error dispatching webhook payload:', err.message);
    throw err;
  }
}

module.exports = {
  dispatchWebhookNotification,
};
