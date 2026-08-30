# Gamified Badge & Leaderboard System

The **Gamified Badge & Leaderboard System** drives student motivation, daily practice consistency, and friendly peer competition by awarding collectible badges for study milestones and ranking participants on a global leaderboard based on total gamification points.

## System Architecture & Features

### 1. Collectible Badges
Badges are awarded when students reach milestones across 6 core study categories:
- **Streak**: *Week Warrior* (7-day daily study streak, +150 PTS).
- **Quiz**: *Quiz Master* (100% quiz score, +100 PTS), *Sharpshooter* (5 quizzes scored >80%, +180 PTS).
- **Interview**: *Interview Ace* (Score 85%+ in live collaborative interview room, +200 PTS).
- **Flashcards**: *Card Collector* (50 flashcards created, +120 PTS), *Century Club* (100 flashcards reviewed, +150 PTS).
- **Study Focus**: *Early Bird* (30+ min morning focus, +90 PTS), *Night Owl* (60+ min evening focus, +110 PTS), *Study Marathon* (300+ total focus minutes, +250 PTS).
- **Achievements**: *Grandmaster* (1000+ total points accumulated, +500 PTS).

### 2. Gamification Point Formula
Total points for leaderboard ranking are computed dynamically:
$$\text{Total Points} = \text{XP} + (\text{Current Streak} \times 15) + (\text{Unlocked Badges} \times 100) + (\text{Completed Quizzes} \times 25)$$

### 3. Global Leaderboard
- **Top 3 Podium Styling**: Highlights 🥇 Gold Champion, 🥈 Silver Competitor, and 🥉 Bronze Achiever with crown emblems.
- **Timeframe Filtering**: Supports **All-Time**, **Weekly**, and **Monthly** leaderboards.
- **Redis Caching**: Cached in Redis key `leaderboard:<timeframe>:<limit>` with a 5-minute TTL and automatic database aggregation fallback.
- **User Position Bar**: Sticky footer highlighting the authenticated user's current rank position and total points.

---

## API Reference

### `GET /api/badges`
- **Access**: Private (`protect`)
- **Description**: Returns all active badges in the database.

### `GET /api/badges/user`
- **Access**: Private (`protect`)
- **Description**: Returns user's earned badges, locked badges with progress %, and current metrics.

### `POST /api/badges/evaluate`
- **Access**: Private (`protect`)
- **Description**: Triggers milestone evaluation, unlocks newly qualified badges, and awards XP bonus points.

### `GET /api/leaderboard`
- **Access**: Private (`protect`)
- **Query Params**: `timeframe` (`all` | `weekly` | `monthly`), `limit` (default: 50)
- **Description**: Returns global participant rankings and the current user's rank.

---

## Frontend Components

- **[`BadgeShowcase.jsx`](file:///c:/Users/Rushabh%20Mahajan/Documents/GitHub/OpenPrep-AI/frontend/src/components/profile/BadgeShowcase.jsx)**: Rendered on student profiles to showcase unlocked medallion badges, category filters, progress bars, and manual badge check trigger.
- **[`LeaderboardPage.jsx`](file:///c:/Users/Rushabh%20Mahajan/Documents/GitHub/OpenPrep-AI/frontend/src/pages/LeaderboardPage.jsx)**: Accessible at `/leaderboard` displaying top 3 podiums, search filter, and ranked table.
