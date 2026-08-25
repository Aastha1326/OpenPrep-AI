# External Productivity Integrations & Calendar Synchronization

## Architecture

```
+-------------------------------------------------------------+
|               OpenPrep AI Study Planner                     |
+-------------------------------------------------------------+
   |                        |                      |
   v                        v                      v
+------------------+ +------------------+ +-------------------+
| Google Calendar  | | Notion Database  | | iCal / .ics Feed  |
| (OAuth 2.0 API)  | | (Official Client)| | (RFC 5545 Spec)   |
+------------------+ +------------------+ +-------------------+
```

## Supported Integrations

### 1. Google Calendar
- **Protocol**: OAuth 2.0 (`https://www.googleapis.com/auth/calendar.events`)
- **Features**: Two-way synchronization of AI-generated study sessions directly to the user's primary Google Calendar with reminder notifications.

### 2. Notion Workspace
- **Protocol**: Notion Internal Integration Token + Database ID
- **Features**: Direct structured page syncing with `Date`, `Subject`, and `Status` properties.

### 3. Apple Calendar / Outlook / Thunderbird (iCal)
- **Protocol**: RFC 5545 standard `.ics` endpoint (`GET /api/integrations/calendar/feed.ics`)
- **Features**: Universal calendar subscription link.
