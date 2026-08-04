# 🔌 API Reference

This document catalogs the REST API endpoints available in the **OpenPrep AI** backend service.

* **Base URL**: `/api` (Typically resolved to `http://localhost:5000/api` in local development)
* **Headers**: `Content-Type: application/json` is required for all state-changing endpoints.
* **Authentication**: Protected endpoints require a valid Bearer JWT: `Authorization: Bearer <token>`.

---

## 🔐 Authentication Endpoints

### 1. Register User
* **Method**: `POST`
* **Path**: `/auth/register`
* **Rate Limit**: 5 requests per hour per IP
* **Password Requirements**: Minimum 8 characters, must contain uppercase, lowercase, number, and special character
* **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Str0ng!Pass",
  "role": "student"
}
```
* **Success Response (201 Created)** — No JWT returned; user must verify email first:
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email. Verification link sent to jane@example.com (expires in 24 hours).",
  "isEmailVerified": false
}
```
* **Error Response (400)** — Duplicate email:
```json
{
  "success": false,
  "error": "User already exists"
}
```

### 2. Verify Email
* **Method**: `POST`
* **Path**: `/auth/verify-email/:token`
* **Rate Limit**: 5 requests per hour per IP
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d0fe4f5311236168a109a1",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "student",
    "isEmailVerified": true,
    "streak": { "count": 0 }
  }
}
```
* **Error Response (400)** — Invalid / expired token:
```json
{
  "success": false,
  "error": "Invalid or expired verification token"
}
```

### 3. Login User
* **Method**: `POST`
* **Path**: `/auth/login`
* **Rate Limit**: 10 requests per 15 minutes per IP
* **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "Str0ng!Pass"
}
```
* **Success Response (200 OK)** — Returns both access and refresh tokens:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6...",
  "user": {
    "id": "60d0fe4f5311236168a109a1",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "student",
    "isEmailVerified": true,
    "streak": { "count": 1 }
  }
}
```
* **Error Response (403)** — Email not verified:
```json
{
  "success": false,
  "error": "Please verify your email before logging in"
}
```

### 4. Refresh Token
* **Method**: `POST`
* **Path**: `/auth/refresh-token`
* **Rate Limit**: 10 requests per 15 minutes per IP
* **Request Body**:
```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```
* **Success Response (200 OK)** — Old refresh token is invalidated (rotation):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "f6e5d4c3b2a1..."
}
```

### 5. Forgot Password
* **Method**: `POST`
* **Path**: `/auth/forgot-password`
* **Rate Limit**: 5 requests per hour per IP
* **Request Body**:
```json
{
  "email": "jane@example.com"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password reset link sent to your email. Link expires in 1 hour."
}
```

### 6. Reset Password
* **Method**: `POST`
* **Path**: `/auth/reset-password/:token`
* **Rate Limit**: None (token-based, single-use)
* **Request Body**:
```json
{
  "password": "NewStr0ng!Pass"
}
```
* **Success Response (200 OK)** — Password updated, all existing refresh tokens invalidated:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Password reset successful"
}
```

### 7. Get Current User Profile
* **Method**: `GET`
* **Path**: `/auth/me`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "60d0fe4f5311236168a109a1",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "student",
    "isEmailVerified": true,
    "streak": { "count": 1 }
  }
}
```

---

## 📚 Academic & PYQ Endpoints

### 1. Upload and Analyze PYQ Paper
* **Method**: `POST`
* **Path**: `/pyq/upload`
* **Headers**: `Authorization: Bearer <token>` (Request must be sent as `multipart/form-data`)
* **Request Payload**:
  * `file`: (PDF binary file)
  * `title`: "Spring Semester 2025 Algorithms"
  * `examId`: "60d0fe4f5311236168a109bb"
  * `subjectId`: "60d0fe4f5311236168a109cc"
  * `year`: 2025
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "60d0fe4f5311236168a109dd",
    "title": "Spring Semester 2025 Algorithms",
    "year": 2025,
    "analyzed": true,
    "analysisResults": {
      "chapterWeightage": [
        { "chapterName": "Dynamic Programming", "weightage": 35 }
      ],
      "importantTopics": [
        { "topicName": "Knapsack Problem", "importance": "High", "frequency": 4 }
      ],
      "repeatedQuestions": [
        { "questionText": "Explain Floyd-Warshall vs Dijkstra...", "years": [2023, 2025] }
      ],
      "trendAnalysis": "Emphasis is heavily weighted toward dynamic programming logic..."
    }
  }
}
```

### 2. Get PYQ Papers
* **Method**: `GET`
* **Path**: `/pyq`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "60d0fe4f5311236168a109dd",
      "title": "Spring Semester 2025 Algorithms",
      "year": 2025,
      "analyzed": true
    }
  ]
}
```

---

## 📅 Study Plan Endpoints

### 1. Generate AI Study Plan
* **Method**: `POST`
* **Path**: `/study-plans/generate-ai`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
```json
{
  "examId": "60d0fe4f5311236168a109bb",
  "startDate": "2026-07-01",
  "endDate": "2026-07-07",
  "studyHoursPerDay": 3
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "60d0fe4f5311236168a109ff",
    "startDate": "2026-07-01T00:00:00.000Z",
    "endDate": "2026-07-07T00:00:00.000Z",
    "status": "active",
    "dailyGoals": [
      {
        "date": "2026-07-01T00:00:00.000Z",
        "tasks": [
          { "id": "60d0fe4f5311236168a10901", "title": "Read intro to DP", "duration": 45, "completed": false }
        ]
      }
    ]
  }
}
```

### 2. Toggle Task Completion Status
* **Method**: `PUT`
* **Path**: `/study-plans/:planId/tasks/:taskId`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "taskId": "60d0fe4f5311236168a10901",
    "completed": true
  }
}
```

---

## 🧠 Quiz Endpoints

### 1. Generate AI Practice Quiz
* **Method**: `POST`
* **Path**: `/quizzes/generate-ai`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
```json
{
  "subjectId": "60d0fe4f5311236168a109cc",
  "topicId": "60d0fe4f5311236168a10911",
  "count": 5
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "60d0fe4f5311236168a10922",
    "title": "Knapsack Problem AI Generated Practice Quiz",
    "questions": [
      {
        "id": "60d0fe4f5311236168a10923",
        "questionText": "What is the time complexity of the 0/1 Knapsack problem using DP?",
        "options": ["O(N)", "O(W)", "O(NW)", "O(2^N)"],
        "explanation": "DP approaches calculate a table of size N x W, resolving to O(NW)."
      }
    ]
  }
}
```

### 2. Submit Quiz Attempt
* **Method**: `POST`
* **Path**: `/quizzes/:id/submit`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
```json
{
  "answers": [
    { "questionId": "uuid", "selectedAnswer": 0 }
  ],
  "timeSpent": 120
}
```
* **Success Response (201 Created)** — new attempt created:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user": "uuid",
    "quiz": "uuid",
    "score": 100,
    "totalQuestions": 2,
    "answers": [...],
    "timeSpent": 120,
    "weakTopics": [],
    "strongTopics": [],
    "createdAt": "2026-08-03T10:00:00.000Z",
    "updatedAt": "2026-08-03T10:00:00.000Z"
  }
}
```
* **Duplicate Submission Response (200 OK)** — request within 5-second window:
```json
{
  "success": true,
  "duplicate": true,
  "data": { ... } // the original attempt object
}
```
* **Error Responses**:
  * `400 Bad Request` — invalid answers format or incomplete submission
  * `404 Not Found` — quiz not found or not owned by user

> **Note**: To prevent duplicate attempts from rapid double-clicks, the server ignores submissions for the same quiz by the same user within a 5-second window. The duplicate response returns the original attempt with `duplicate: true`.

---

## 🗂️ Flashcard Endpoints

### 1. Generate AI Flashcards
* **Method**: `POST`
* **Path**: `/flashcards/generate-ai`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
```json
{
  "subjectId": "60d0fe4f5311236168a109cc",
  "topicId": "60d0fe4f5311236168a10911",
  "count": 6
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "count": 6,
  "data": [
    {
      "id": "60d0fe4f5311236168a10944",
      "front": "What is Memoization?",
      "back": "Storing the results of expensive function calls and returning the cached result when the same inputs occur again."
    }
  ]
}
```

### 2. Review Flashcard (Spaced Repetition)
* **Method**: `PUT`
* **Path**: `/flashcards/:id/review`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
```json
{
  "quality": 4 // Quality score between 0 and 5 based on SM-2
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "60d0fe4f5311236168a10944",
    "repetitions": 1,
    "interval": 1,
    "efactor": 2.5,
    "nextReviewDate": "2026-06-22T16:29:09.000Z"
  }
}
```

---

## 📊 Progress Endpoints

### 1. Get Dashboard Analytics
* **Method**: `GET`
* **Path**: `/progress/dashboard`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "stats": {
    "streakCount": 5,
    "studyHours": 12.5,
    "completionRate": 68,
    "quizzesAttempted": 8,
    "recentActivities": [
      { "type": "quiz_attempt", "description": "Attempted quiz: Algorithms 101", "date": "2026-06-21T15:20:00Z" }
    ]
  }
}
```
