**# 📑 ADR 0002: Gemini AI Integration \& Prompt Fallback Pipeline**



**\*\*Status:\*\* Accepted**



**\*\*Date:\*\* 2026-08-08**



**---**



**## 🎯 Context**



**OpenPrep AI provides AI-powered features such as study plan generation, quiz creation, previous year question (PYQ) analysis, and personalized academic recommendations. These features require a language model capable of producing structured and predictable responses while maintaining reasonable response times and operating costs.**



**The application also needs to remain usable during local development and testing, even when an external AI service or API key is unavailable.**



**---**



**## ✅ Decision**



**The backend adopts a dedicated AI service layer that integrates Google's Gemini API through a centralized service module.**



**### Model Selection**



**The project uses:**



**```**

**gemini-1.5-flash**

**```**



**for AI-powered features because it provides fast response times suitable for interactive educational workflows.**



**### Service Layer**



**All AI interactions are isolated inside the backend service layer rather than being implemented directly inside controllers.**



**This separation provides:**



**- Centralized AI request handling**

**- Easier maintenance**

**- Reusable prompt generation**

**- Consistent response processing**



**### Structured JSON Responses**



**AI prompts are designed to return structured JSON whenever possible.**



**Responses are validated and parsed before being returned to the frontend, reducing inconsistencies caused by free-form text generation.**



**### Mock Fallback Pipeline**



**If a valid `GEMINI\_API\_KEY` is unavailable, the backend automatically returns predefined mock responses.**



**This allows:**



**- Local development**

**- UI testing**

**- API testing**

**- Offline demonstrations**



**without requiring access to external AI services.**



**---**



**## 📈 Consequences**



**### Benefits**



**- Centralized AI integration improves maintainability.**

**- Consistent JSON responses simplify frontend development.**

**- Fast model selection supports interactive user experiences.**

**- Mock responses enable development without API credentials.**

**- Future AI providers can be integrated with minimal controller changes.**



**### Trade-offs**



**- AI response quality depends on prompt design.**

**- External AI availability and rate limits remain operational considerations.**

**- Structured parsing requires additional validation logic.**



**---**



**## 📚 Related Documentation**



**- `docs/backend-architecture.md`**

**- `docs/feature-specifications.md`**

**- `docs/security.md`**

**- `docs/setup-guide.md`**

**- `backend/services/geminiService.js`**

