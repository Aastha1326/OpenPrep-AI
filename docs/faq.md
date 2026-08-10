# ❓ Frequently Asked Questions (FAQ)

This document addresses frequently asked questions for both users (students) and contributors of **OpenPrep AI**.

---

## 👨‍🎓 For Students (Users)

### Q: What is OpenPrep AI and how does it help me prepare?

**A**: OpenPrep AI is an AI-powered study assistant. It helps you analyze previous exam papers (PYQs), generates personalized study schedules, detects knowledge gaps through diagnostic quizzes, and organizes flashcards using spaced repetition.

### Q: Do I need a paid Google Gemini API account to use this?

**A**: No. If you run the platform locally and don't provide a Gemini API key, the application automatically falls back to serving structured mock study plans and quizzes so you can explore the features for free. To use real AI generation, you can obtain a free-tier Gemini API key from [Google AI Studio](https://aistudio.google.com/).

### Q: How does the quiz difficulty adapter work?

**A**: The platform monitors your quiz scores. If your scores on a topic are low, the study planner prioritizes that topic in your schedule and labels it as **Weak**. Once your quiz scores improve, the topic status changes to **Strong**.

---

## 💻 For Contributors

### Q: Can I contribute to this project during Hacktoberfest or GSSoC?

**A**: Yes! OpenPrep AI is open-source and welcomes contributions. Look for issues labeled `good first issue` or `help wanted` to get started. Please review our [Contribution Guide](../CONTRIBUTING.md) before submitting a Pull Request.

### Q: What formatting rules do I need to follow?

**A**: We use **Prettier** for code formatting and **ESLint** for code quality checks. Ensure your editor is configured to use our [`.prettierrc`](../.prettierrc) settings, and run the linter before pushing changes:

```bash
npm run lint
```

### Q: How do I test the backend AI features without making API requests?

**A**: If you clear the `GEMINI_API_KEY` from your backend `.env` file, the backend will automatically fallback to serving local mock responses. This allows you to test route behavior and UI changes offline without hitting API rate limits.
