/**
 * Dispatches a brief text briefing to a user's Telegram Chat ID.
 */
async function sendTelegramDigest(chatId, briefing) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const { userName, scheduledTopics = [], overdueFlashcardsCount = 0, streakCount = 0, quote = '' } = briefing;

  const messageText = `
*OpenPrep AI Daily Briefing* 📚
"${quote}"

Hello *${userName}*,
🔥 *Streak:* ${streakCount} Days
📇 *Overdue Flashcards:* ${overdueFlashcardsCount}

*Today's Scheduled Topics:*
${scheduledTopics.length > 0 ? scheduledTopics.map(t => `• ${t}`).join('\n') : 'None scheduled. Keep exploring!'}

[Start Today's Review](https://openprep.ai/dashboard)
  `.trim();

  if (!token || token === 'your_telegram_bot_token_here') {
    console.log(`\n[TELEGRAM] ChatId: ${chatId}`);
    console.log(`[TELEGRAM] Message:\n${messageText}\n`);
    return { success: true, preview: true };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();
    return { success: data.ok, response: data };
  } catch (err) {
    console.error('[TelegramBotService] Error dispatching message:', err.message);
    throw err;
  }
}

module.exports = {
  sendTelegramDigest,
};
