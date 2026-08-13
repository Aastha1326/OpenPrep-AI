# 📋 Feature Specifications

This document defines the functional specifications and algorithmic details for the core features of **OpenPrep AI**.

---

## 📊 PYQ Intelligence & Batch Trend Analyzer

The PYQ Intelligence and Batch Trend Analyzer extracts consolidated chapter weightages and recurring concept frequencies from multiple historical exam papers.

### 1. Functional Scope
* **Batch PDF Processing**: Students upload up to 10 past exam paper PDFs for a subject.
* **Text Extraction & OCR**: 
  * The backend extracts selectable text from PDF files using `pdf-parse`.
  * If a file has empty text (such as scanned image-only PDFs), the system logs the event and routes to the OCR text-extraction pipeline.
  * Image uploads (JPEG, PNG) are routed directly to the Tesseract.js OCR engine.
* **AI Aggregation**: The Gemini API processes the combined text across years and extracts structured questions mapped to chapters, topics, marks, and year.
* **Interactive Charts**:
  * **Chapter Weightage Bar Chart**: Displays chapter marks percentage contributions. Clicking a bar allows launching targeted AI quizzes or creating flashcard decks for that specific chapter.
  * **Concept Heatmap Grid**: Displays a Recharts scatter plot showing years on the X-axis, topic names on the Y-axis, and marks weightage as bubble sizes.
* **High-Yield Priorities**: Lists chapters ranked by weightage percentage, suggesting study sequences.
* **PDF Export**: Generates and downloads detailed past paper reports using PDFKit.

### 2. Prompt Schema & Flow
The backend uses `gemini-1.5-flash` with a strict JSON system prompt to retrieve structured data. The schema must resolve to:
```json
{
  "examName": "CBSE Board Exams",
  "yearRange": "2020-2025",
  "totalQuestions": 32,
  "questions": [
    {
      "chapterName": "Database Management",
      "topicName": "SQL Joins",
      "questionText": "Compare INNER JOIN versus LEFT OUTER JOIN.",
      "marks": 5,
      "year": 2024
    }
  ]
}
```

---

## 🎯 AI Weakness Detection

This engine analyzes student assessment history to flag knowledge gaps.

### 1. Diagnostics Workflow
* Every time a student submits a quiz attempt, the backend logs the score, subject, and topic.
* A weakness detection service processes these attempts periodically:
  * If average score for a topic falls below **50%**, status becomes **Weak**.
  * If average score is between **50% and 80%**, status becomes **Medium**.
  * If average score is above **80%**, status becomes **Strong**.
* The Gemini API analyzes this aggregated history to generate study recommendations.

### 2. Recommendations Output Schema
```json
{
  "weakSubjects": ["string"],
  "recommendations": [
    { 
      "subject": "string", 
      "topic": "string", 
      "suggestion": "string", 
      "priority": "High" | "Medium" | "Low" 
    }
  ]
}
```

---

## 📅 Smart Study Planner

Generates realistic, structured study schedules dynamically based on timeline constraints.

### 1. Inputs
* **Exam Target**: Selected Exam & Syllabus.
* **Date Range**: Start date and target exam end date.
* **Capacity**: Daily study hour availability (default is 3 hours).

### 2. Scheduling Algorithm
* Calculates the total days available between `startDate` and `endDate`.
* Distributes syllabus topics across available study days, scheduling longer study blocks for complex topics.
* Reserves **15-20%** of the scheduled timeline at the end for mock assessments and overall revision.
* Allocates daily revision tasks to reinforce previously covered topics.

---

## 🧠 AI Quiz Generator

Creates practice quizzes from user uploads or database subjects.

### 1. Requirements
* Each quiz contains a customizable count of questions (default is 5).
* Questions are returned as 4-option MCQs.
* A detailed explanation must accompany the correct option to help students learn.

---

## 🗂️ Flashcards & Spaced Repetition (SM-2)

Implements spaced repetition using the SuperMemo SM-2 algorithm to optimize memorization.

### 1. SM-2 Variables
* **Repetitions ($n$)**: Number of consecutive times the card was successfully recalled.
* **Ease Factor ($EF$)**: Difficulty multiplier (starts at 2.5).
* **Interval ($I$)**: Days to wait before the next review.

### 2. Interval Calculation
* For $n = 1$: $I = 1$ day.
* For $n = 2$: $I = 6$ days.
* For $n > 2$: $I = I_{prev} \times EF$ days.

### 3. Response Quality ($q$)
After reviewing a card, the student rates their recall quality on a 0-5 scale:
* `5`: Perfect response.
* `4`: Correct response after a hesitation.
* `3`: Correct response recalled with serious difficulty.
* `2`: Incorrect response; where the correct one seemed easy to recall.
* `1`: Incorrect response; the correct one was remembered upon display.
* `0`: Complete blackout.

### 4. Updating Ease Factor ($EF$)
After every review, the Ease Factor is recalculated:
$$EF' = EF + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02))$$
If $EF' < 1.3$, $EF$ is set to $1.3$ (minimum limit).
If response quality $q < 3$, repetitions is reset to $0$, and interval $I$ is reset to $1$ day.

---

## 📊 Dashboard Analytics & Exam Readiness Index (ERI)

Provides students with an overview of their learning telemetry and predicted exam readiness levels:
* **Streak Tracking**: Logs consecutive active days. If last active date is $> 1$ day, the streak resets to 0.
* **Hours Studied**: Aggregates time spent on completed study plan tasks.
* **Completion Rate**: Percentage of overall syllabus topics categorized as "Strong".
* **Recent Activity Feed**: Chronological list of completed quizzes, uploaded PYQs, and flashcard reviews.

### 1. Exam Readiness Index (ERI) Formula
Calculates a composite exam preparedness metric (0-100%) for each subject:
$$\text{ERI} = 0.30 \times \text{Syllabus Coverage} + 0.30 \times \text{Quiz Accuracy} + 0.25 \times \text{Memory Retention} + 0.15 \times \text{Schedule Velocity}$$
* **Syllabus Coverage**: Average completion percentage across all topics of the subject.
* **Quiz Accuracy**: Percentage of correct answers across all quiz attempts in the subject.
* **Memory Retention**: Average memory stability derived from flashcardrepetitions and SM-2 ease factors.
* **Schedule Velocity**: Percentage of completed study goals inside the active study plan.

### 2. Knowledge Radar Chart
An interactive Recharts Radar Chart mapping ERI masteries across enrolled subjects. If the student has less than 3 active subjects, the visualization falls back to a horizontal Bar Chart to maintain correct scale rendering.

### 3. Trajectory Score Forecast
Plots projected readiness progression up to the target exam date based on daily study plan goals, helping students visualize their revision progress.

---

## 🎧 Audio Flashcard Podcast Generator

Converts visual flashcard decks into structured audio podcasts to support hands-free revision.

### 1. Audio Episode Timing & Layout
The generator builds a unified MP3 stream structured with conversational audio intervals:
* **Podcast Intro**: A verbal coach welcome introducing the deck title and total card count.
* **Question Prompt**: "Card [Index]. Question: [Question Text]"
* **Recall Window**: A 3.5-second silent audio pause allowing active student recall before the explanation is read.
* **Answer Prompt**: "Answer: [Answer Text] (with Hints if applicable)"
* **Card Transition**: A 0.8-second brief silence gap before proceeding to the next card.
* **Podcast Outro**: A verbal coach wrap-up encouraging consistent study habits.

### 2. Conversational Audio Synthesis & Stitching
* Uses public Translate Text-to-Speech endpoints with custom User-Agents.
* Handles long text boundaries by automatically splitting card text blocks into <= 160 character fragments to prevent request timeouts or characters truncation.
* Generates silent pauses programmatically by duplicating a base64 encoded silent LAME-encoded frame buffer.
* Concatenates output audio buffers directly on the backend to construct a valid, playable MP3 file stored locally on disk under `/uploads`.

### 3. Interactive Playlist Controller
Provides a responsive frontend AudioPlayer overlay:
* Supports standard controls: Play, Pause, volume slides.
* Includes a 15-second skip/rewind toggle.
* Adjusts playback speeds dynamically (0.8x to 1.5x) using the HTML5 audio element API.
* Displays screen-reader accessible scrolling transcripts matching the active audio cues.

---

## 📅 AI Syllabus Coverage Gap Detector & PDF Importer

Uploads official curriculum guidelines and compares them to actual student learning telemetry to identify coverage blind spots.

### 1. PDF Hierarchy Extraction & Modules Parsing
* **Text Extraction**: Uses `pdf-parse` to convert syllabus PDF data. Multi-column structures are handled, and a mock fallback routes image-only scans.
* **AI Extraction**: Feeds text to Gemini 1.5 API requesting structured JSON:
  `{ moduleName, title, subtopics: [], weightage }`

### 2. Coverage Status Logic
Cross-references parsed topics against user's actual `Note` and `QuizAttempt` tables:
* **Covered (Green)**: Student has written a note matching the topic title AND has taken quizzes with an average accuracy score $\ge 70\%$.
* **Partially Covered (Yellow)**: Student has written a notes summary, but has either no quiz attempts or an average accuracy score $< 70\%$.
* **Unstudied Gap (Red)**: Student has no matching notes and no quiz attempts recorded for the syllabus topic.

Clicking a gap topic triggers a backend call to Gemini 1.5 API, which drafts a detailed educational study note covering the topic and its subtopics in rich Markdown. The note is saved to the user's notes catalog, updating the topic's status to Partially Covered.

---

## 🎙️ AI Practice Interview Simulator (Viva Voce)

Simulates technical oral exams where students answer dynamic questions from an AI examiner via text or voice.

### 1. Multi-turn Conversational Session Manager
* **Session Lifecycle**:
  * `/api/viva/start`: Resolves subject title, starts the turn array, and generates the initial technical question.
  * `/api/viva/respond`: Appends student answers, compiles conversation history, and generates appropriate follow-up probing questions.
  * `/api/viva/evaluate`: Triggers final grading after 5 student response turns or early finish.
* **Turn Limit Safeguard**: Auto-evaluates sessions at 5 student turns to ensure quota limits are respected.

### 2. Multi-Rubric Scorecard Assessment
Calculates four key academic assessment indicators:
* **Conceptual Depth (0-100)**: Evaluates the completeness of explanation and knowledge of core architectures.
* **Technical Accuracy (0-100)**: Assesses precision in definitions and technical vocabulary.
* **Communication Clarity (0-100)**: Evaluates structural focus and coherence in expressing concepts.
* **Overall Score (0-100)**: The overall average performance score.

### 3. Integrated Voice input Fallback
* Leverages Web Speech API for real-time speech-to-text translation.
* Automatically reads examiner questions aloud using window.speechSynthesis to simulate a natural academic oral examination setting.
* Provides full manual text keyboard input fallback for environments without microphone support.
