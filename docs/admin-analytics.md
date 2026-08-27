# Admin Usage Analytics Dashboard

The **Admin Usage Analytics Dashboard** provides administrators with a centralized control center to monitor user engagement trends, mock interview success rates, quiz completion metrics, and real-time infrastructure health.

## Features

- **Active Users Analytics**: Aggregates Daily Active Users (DAU), Weekly Active Users (WAU), Monthly Active Users (MAU), total registered user counts, and role distribution (Students, Contributors, Admins).
- **Interview Success & Score Distribution**: Tracks total mock interviews, completion rates, average candidate score, and score distribution ranges (`<50%`, `50-70%`, `70-85%`, `85-100%`).
- **Quiz Completion Percentages**: Displays overall quiz completion rates, average scores, and performance breakdown by question difficulty (Easy, Medium, Hard).
- **System Health Indicators**: Real-time V8 heap memory gauge (MB used / total), continuous process uptime counter, PostgreSQL database connectivity badge, Redis cache state (`online` / `fallback_memory`), request latency (ms), and error rates.
- **Data Export & Filter Controls**: Filter metrics by 7-day, 30-day, or 90-day timeframes, export complete JSON/CSV reports, and perform manual data refreshes.

---

## API Reference

### `GET /api/admin/analytics`
- **Access**: Private / Admin Only (`protect`, `requireAdmin`)
- **Response**:
```json
{
  "success": true,
  "data": {
    "activeUsers": {
      "totalUsers": 142,
      "dau": 28,
      "wau": 84,
      "mau": 132,
      "roleDistribution": {
        "students": 120,
        "contributors": 15,
        "admins": 7
      }
    },
    "interviewMetrics": {
      "totalInterviews": 56,
      "completedInterviews": 48,
      "interviewSuccessRate": 85,
      "avgInterviewScore": 82.4,
      "scoreDistribution": {
        "<50%": 4,
        "50-70%": 10,
        "70-85%": 22,
        "85-100%": 20
      }
    },
    "quizMetrics": {
      "totalQuizAttempts": 310,
      "quizCompletionPct": 91.5,
      "avgQuizScore": 78.2,
      "difficultyBreakdown": [
        { "difficulty": "Easy", "attempts": 120, "avgScore": 85 },
        { "difficulty": "Medium", "attempts": 140, "avgScore": 76 },
        { "difficulty": "Hard", "attempts": 50, "avgScore": 65 }
      ]
    },
    "systemHealth": {
      "status": "healthy",
      "uptimeSeconds": 142800,
      "dbStatus": "connected",
      "redisStatus": "online",
      "heapUsedMB": 184.2,
      "heapTotalMB": 312.0,
      "avgLatencyMs": 35,
      "errorRatePct": 0.05
    }
  }
}
```

---

## Usage Instructions

1. **Accessing the Dashboard**:
   - Log into the platform with an administrator account.
   - Navigate to `/admin/analytics` directly, or click the **Usage Analytics** tab within the **Admin Control Room** (`/admin`).

2. **Interacting with Charts**:
   - Hover over graph points in the **Active User Dynamics** Area Chart to view DAU/WAU numbers on specific dates.
   - Hover over bars in **Interview Success** or **Quiz Difficulty Breakdown** to see counts and percentages.

3. **Exporting Analytics Reports**:
   - Click the **Export** button in the top right header to download a JSON snapshot of system metrics.
