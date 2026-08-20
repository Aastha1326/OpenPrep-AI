# OpenPrep AI - Backend API Services

The backend for OpenPrep AI is built with Node.js, Express, PostgreSQL (via Sequelize ORM), Redis, and Google Gemini AI API.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- Redis (optional for caching / rate limiting fallback)

### Environment Setup
Copy the example environment file and configure your credentials:

```bash
cp .env.example .env
```

Ensure the following key environment variables are set:
- `PORT`: Server port (default: `5000`)
- `NODE_ENV`: `development`, `test`, or `production`
- `DATABASE_URL` / DB credentials: PostgreSQL database connection string
- `JWT_SECRET`: Secret key for signing JSON Web Tokens
- `GEMINI_API_KEY`: Google Gemini API key for AI features

### Installation & Launch

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Run unit tests:

```bash
npm test
```

---

## 📚 API Documentation (Swagger UI)

Standardized API documentation is powered by `swagger-ui-express` and `swagger-jsdoc`.

### Accessing Swagger UI
When running in development mode (or when `SWAGGER_ENABLED=true`), interactive API documentation is available at:

- **Swagger UI**: [`http://localhost:5000/api-docs`](http://localhost:5000/api-docs) (or [`/api/docs`](http://localhost:5000/api/docs))
- **OpenAPI JSON Spec**: [`http://localhost:5000/api-docs.json`](http://localhost:5000/api-docs.json)

### Features & Annotations
- **Interactive Route Explorer**: Test authentication, note management, flashcards, quizzes, study plans, and analytics directly from the UI.
- **Controller Annotations**: All major controller functions (`Auth`, `Notes`, `Flashcards`, `Analytics`) are documented using JSDoc `@swagger` comments with request and response schemas.
- **Authentication**: Supports JWT Bearer authorization in the Swagger UI topbar.
