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

## ✅ Module Integrity Check

`npm run test:integrity` parses every module under the server's boot path -
`controllers/`, `services/`, `routes/`, `models/`, `middleware/`, `sockets/`,
`utils/` and `jobs/` - without executing any of it. It needs no PostgreSQL, no
Redis and no network, so it runs on its own and stays useful when the
database-backed suites cannot.

It reports three things:

| Check | Catches |
| --- | --- |
| Parse | A module that is not valid JavaScript - a truncated function, a stray token, an unbalanced brace |
| Duplicate declarations | The same top-level `const`/`let` declared twice, the signature of two modules concatenated by a bad merge |
| Unbound router identifiers | `express.Router()` with no `express` import, `router.get(...)` with no `router` |

The check runs in CI as the `backend-module-integrity` job and gates `build`.
Add a new listener or module and the sweep picks it up automatically; if you add
a socket event, list it in `ROOM_EVENTS` so cleanup still tears it down.

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
