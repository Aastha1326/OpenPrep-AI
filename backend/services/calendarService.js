const { google } = require('googleapis');
const icalGenerator = require('ical-generator');
const ical = typeof icalGenerator === 'function' ? icalGenerator : (icalGenerator.ical || icalGenerator.default || icalGenerator);
const { encryptToken, decryptToken } = require('../utils/encryption');
const User = require('../models/User');

const CALENDAR_NAME = 'OpenPrep AI';
const DEFAULT_START_HOUR = 9;
/**
 * Initializes the Google OAuth2 client with environment variables
 */
function getOAuthClient() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  return oAuth2Client;
}
/**
 * Converts a local date/time in the user's IANA timezone into a UTC Date.
 * This keeps calendar events aligned with the user's local timezone,
 * including daylight-saving changes in supported timezones.
 */
function zonedDateTimeToUtc(dateString, hour, minute, timeZone) {
  const [year, month, day] = dateString.split('-').map(Number);

  const utcGuess = new Date(
    Date.UTC(year, month - 1, day, hour, minute, 0)
  );

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(utcGuess);

  const values = {};
  parts.forEach(({ type, value }) => {
    values[type] = value;
  });

  const timezoneEquivalentUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  const offset = timezoneEquivalentUtc - utcGuess.getTime();

  return new Date(utcGuess.getTime() - offset);
}

/**
 * Generates a valid RFC 5545 iCalendar file for a study plan.
 */
function generateStudyPlanIcs(plan, timeZone = 'UTC') {
  const examName = plan.examRef?.name || 'Exam Study Plan';

  const calendar = ical({
    name: `${examName} - Study Plan`,
    prodId: '//OpenPrep-AI//Study Plan Calendar//EN',
  });

  calendar.method('PUBLISH');

  if (!Array.isArray(plan.dailyGoals)) {
    return calendar.toString();
  }

  for (const day of plan.dailyGoals) {
    if (!day.date || !Array.isArray(day.tasks)) continue;

    let currentMinutes = DEFAULT_START_HOUR * 60;

    for (const task of day.tasks) {
      const durationMinutes = Math.max(
        1,
        Number(task.duration) || 60
      );

      const startHour = Math.floor(currentMinutes / 60);
      const startMinute = currentMinutes % 60;

      const start = zonedDateTimeToUtc(
        day.date,
        startHour,
        startMinute,
        timeZone
      );

      const end = new Date(
        start.getTime() + durationMinutes * 60 * 1000
      );

      calendar.createEvent({
        id: `${task._id || task.id || `${plan.id}-${day.date}-${currentMinutes}`}@openprep.ai`,
        start,
        end,
        summary: `Study: ${task.title}`,
        description:
          `Study Plan: ${examName}\n` +
          `Topic: ${task.title}\n` +
          `Duration: ${durationMinutes} minutes`,
        alarms: [
          {
            type: 'display',
            trigger: 900,
            description: `Reminder: ${task.title} starts in 15 minutes`,
          },
        ],
      });

      currentMinutes += durationMinutes;
    }
  }

  return calendar.toString();
}
/**
 * Syncs the given study plan to Google Calendar.
 * @param {Object} plan - The study plan object
 * @param {Object} user - The user object
 */
async function syncToGoogleCalendar(plan, user) {
  if (!user.googleCalendarRefreshToken) {
    throw new Error('Google Calendar not linked. Missing refresh token.');
  }

  const refreshToken = decryptToken(user.googleCalendarRefreshToken);
  if (!refreshToken) {
    throw new Error('Invalid or corrupted refresh token.');
  }

  const auth = getOAuthClient();
  auth.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: 'v3', auth });

  // 1. Find or create the OpenPrep AI calendar
  const calendarList = await calendar.calendarList.list();
  let openPrepCalendar = calendarList.data.items.find(
    (cal) => cal.summary === CALENDAR_NAME
  );

  if (!openPrepCalendar) {
    const createdCal = await calendar.calendars.insert({
      requestBody: {
        summary: CALENDAR_NAME,
        description: 'AI-generated study plans from OpenPrep AI',
      },
    });
    openPrepCalendar = createdCal.data;
  }

  const calendarId = openPrepCalendar.id;

  // 2. Clear future events in the calendar (or all events to prevent duplicates)
  // To keep it simple, we delete all events in this specific calendar
  const existingEvents = await calendar.events.list({
    calendarId,
  });

  if (existingEvents.data.items && existingEvents.data.items.length > 0) {
    // Note: for production, batching deletes is recommended if events > 50
    for (const ev of existingEvents.data.items) {
      try {
        await calendar.events.delete({ calendarId, eventId: ev.id });
      } catch (err) {
        console.error(`Failed to delete event ${ev.id}:`, err.message);
      }
    }
  }

  // 3. Insert new events
  for (const day of plan.dailyGoals) {
    if (!day.date || !day.tasks) continue;

    const [year, month, date] = day.date.split('-').map(Number);
    let currentHour = 9; // start at 9 AM
    let currentMinute = 0;

    for (const task of day.tasks) {
      const duration = task.duration || 60;

      // Create Date objects in local time equivalent
      const startDateTime = new Date(year, month - 1, date, currentHour, currentMinute);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

      const event = {
        summary: `Study: ${task.title}`,
        description: `Topic: ${task.title}\nStudy Plan: ${plan.id}`,
        start: {
          dateTime: startDateTime.toISOString(),
        },
        end: {
          dateTime: endDateTime.toISOString(),
        },
      };

      try {
        await calendar.events.insert({
          calendarId,
          requestBody: event,
        });
      } catch (err) {
        console.error(`Failed to insert event ${event.summary}:`, err.message);
      }

      currentMinute += duration;
      while (currentMinute >= 60) {
        currentHour += 1;
        currentMinute -= 60;
      }
    }
  }
}

/**
 * Validates Google OAuth code and saves refresh token for the user.
 */
async function linkGoogleCalendar(code, userId) {
  const auth = getOAuthClient();
  const { tokens } = await auth.getToken(code);
  
  if (!tokens.refresh_token) {
    // Note: Google only sends refresh_token on the first authorization.
    // If we don't get one, we might need to ask the user to revoke access and try again, 
    // or we might already have it.
    throw new Error('No refresh token returned by Google. Try revoking app access and linking again.');
  }

  const encryptedToken = encryptToken(tokens.refresh_token);
  
  await User.update(
    { 
      googleCalendarRefreshToken: encryptedToken,
      syncGoogleCalendar: true 
    },
    { where: { id: userId } }
  );
  
  return tokens;
}

module.exports = {
  getOAuthClient,
  syncToGoogleCalendar,
  linkGoogleCalendar,
  generateStudyPlanIcs,
};