const sendEmail = require('./emailService');

/**
 * Dispatches a responsive HTML-formatted daily study briefing.
 */
async function sendDailyDigestEmail(userEmail, briefing) {
  const { userName, scheduledTopics = [], overdueFlashcardsCount = 0, streakCount = 0, quote = '' } = briefing;

  const topicsListHtml = scheduledTopics.length > 0
    ? `<ul style="padding-left: 20px; color: #334155; line-height: 1.6;">
        ${scheduledTopics.map(topic => `<li style="margin-bottom: 8px;"><strong>${topic}</strong></li>`).join('')}
       </ul>`
    : `<p style="color: #64748b; font-style: italic;">No specific topics scheduled for today. Explore new areas!</p>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Daily Revision Digest</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f8fafc;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px border #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              
              <!-- HEADER -->
              <tr>
                <td align="center" style="background-color: #3b82f6; padding: 30px 20px;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">OpenPrep AI Daily Briefing</h1>
                  <p style="margin: 5px 0 0 0; color: #bfdbfe; font-size: 14px;">Stay sharp. Stay consistent.</p>
                </td>
              </tr>
              
              <!-- MOTIVATIONAL QUOTE -->
              <tr>
                <td style="padding: 20px; background-color: #eff6ff; border-bottom: 1px solid #dbeafe; font-style: italic; color: #1e40af; text-align: center; font-size: 14px;">
                  "${quote}"
                </td>
              </tr>
              
              <!-- BODY CONTENT -->
              <tr>
                <td style="padding: 30px 20px;">
                  <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Hello, ${userName}!</h2>
                  <p style="color: #475569; font-size: 15px; line-height: 1.5;">Here is your personalized summary of scheduled revision items for today:</p>
                  
                  <!-- Stat Cards -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
                    <tr>
                      <td width="50%" style="padding-right: 10px;">
                        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
                          <span style="font-size: 12px; font-weight: 600; color: #64748b; uppercase: true;">Streak Count</span>
                          <div style="font-size: 24px; font-weight: 800; color: #e11d48; margin-top: 4px;">🔥 ${streakCount} Days</div>
                        </div>
                      </td>
                      <td width="50%" style="padding-left: 10px;">
                        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
                          <span style="font-size: 12px; font-weight: 600; color: #64748b; uppercase: true;">Overdue Cards</span>
                          <div style="font-size: 24px; font-weight: 800; color: #3b82f6; margin-top: 4px;">📇 ${overdueFlashcardsCount} Cards</div>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <h3 style="color: #0f172a; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">📚 Daily Scheduled Topics</h3>
                  ${topicsListHtml}
                  
                  <!-- ACTION BUTTON -->
                  <div style="text-align: center; margin-top: 35px;">
                    <a href="https://openprep.ai/dashboard" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);">
                      Start Today's Review
                    </a>
                  </div>
                </td>
              </tr>
              
              <!-- FOOTER -->
              <tr>
                <td style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0;">You are receiving this because you opted in to Daily Digest reminders.</p>
                  <p style="margin: 5px 0 0 0;"><a href="https://openprep.ai/settings" style="color: #3b82f6; text-decoration: none;">Manage Notification Preferences</a></p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await sendEmail({
    to: userEmail,
    subject: `OpenPrep Daily Briefing: ${streakCount}-Day Streak! 🔥`,
    html,
  });
}

module.exports = {
  sendDailyDigestEmail,
};
