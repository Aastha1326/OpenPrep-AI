# 🛠️ Setup Guide

This guide walks you through setting up a local development environment for **OpenPrep AI** on Windows (PowerShell), Linux, and macOS — from cloning the repository to running both servers with `npm run dev`.

---

## 🧭 Architecture at a Glance

Before you start, it helps to see how the pieces fit together. OpenPrep AI is a decoupled, multi-tier system:

- **Frontend (Client-Tier):** A React single-page application (SPA) built with Vite, Tailwind CSS, and Redux Toolkit. It talks to the backend over REST (`axios`) and realtime WebSockets (`socket.io-client`).
- **Backend (Server-Tier):** A Node.js + Express REST API exposing `/api/*` routes. Security middleware, controllers, and services coordinate every request.
- **Data-Tier:** PostgreSQL (via Sequelize ORM) for persistent storage, plus Redis for optional caching.
- **AI Integration-Tier:** The Gemini API (`gemini-1.5-flash`) used for study planning, quiz generation, PYQ analysis, and note summarization.

### Component Diagram

```mermaid
graph TD
    User([User / Browser]) <--> |HTTPS + JSON + JWT + CSRF| SPA[React SPA<br/>Vite + Tailwind + Redux Toolkit]
    SPA --> |Axios REST /api| API[Express REST API<br/>port 5000]
    SPA --> |Socket.IO client| SIO[Socket.IO Server<br/>battle and chat]
    subgraph Backend [Express Backend]
        API --> |helmet, CORS, CSRF, rate-limit, JWT| CTL[Controllers]
        CTL --> MOD[Sequelize Models]
        CTL --> GEM[Gemini Service]
        CTL --> SVC[Progress and Weakness Services]
        SIO --> |realtime events| SPA
    end
    MOD <--> |SQL| PG[(PostgreSQL<br/>port 5432)]
    GEM --> |prompt / JSON| GOOGLE[Google Gemini API]
    RED[(Redis<br/>port 6379)] -.-> |optional cache| CTL
```

### Request Flow: AI Study Plan Generation

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant SPA as React SPA
    participant API as Express REST API
    participant GEM as Gemini Service
    participant DB as PostgreSQL

    Student->>SPA: Input exam date, subjects and topics
    SPA->>API: POST /api/study-plans/generate-ai (Bearer JWT + X-CSRF-Token)
    Note over API: protect middleware verifies the JWT
    API->>GEM: Build prompt and call Gemini API
    GEM-->>API: JSON array of daily goals and tasks
    API->>DB: Persist StudyPlan linked to the user
    API-->>SPA: 201 JSON study plan
    SPA->>Student: Render interactive calendar / study planner
```

### Request Flow: Authenticated API Call with Token Refresh

```mermaid
sequenceDiagram
    autonumber
    participant SPA as React SPA
    participant API as Express REST API
    participant DB as PostgreSQL

    SPA->>API: POST /api/auth/login (email + password)
    API->>DB: Verify user and password hash
    API-->>SPA: access token + refresh token
    Note over SPA,API: Later authenticated calls
    SPA->>API: GET /api/progress/dashboard (Bearer JWT)
    API-->>SPA: 401 Unauthorized (access token expired)
    SPA->>API: POST /api/auth/refresh-token (refresh token)
    API-->>SPA: New access token + refresh token
    SPA->>API: GET /api/progress/dashboard (new JWT)
    API-->>SPA: 200 JSON dashboard stats
```

For deeper dives, see [System Architecture](./architecture.md), [Backend Architecture](./backend-architecture.md), and [WebSocket Protocol](./websocket-protocol.md).

---

## 📋 Prerequisites

Ensure you have the following installed on your local development machine:

| Tool                                               | Version        | Notes                                                 |
| -------------------------------------------------- | -------------- | ----------------------------------------------------- |
| [Node.js](https://nodejs.org/)                     | v18.x or v20.x | Includes `npm`                                        |
| [npm](https://www.npmjs.com/)                      | v9.x or higher | Ships with Node.js                                    |
| [PostgreSQL](https://www.postgresql.org/)          | 15.x           | Local install **or** a remote instance (Neon, Render) |
| [Docker & Docker Compose](https://www.docker.com/) | Latest         | Optional — only needed for the containerized workflow |

> [!TIP]
> Verify your installs before continuing:
>
> ```bash
> node --version
> npm --version
> psql --version
> ```

---

## 🔨 Clone the Repository

Clone the repository and open the project folder:

```bash
git clone https://github.com/aaryan06-collab/OpenPrep-AI.git
cd OpenPrep-AI
```

> [!NOTE]
> The steps below assume your current directory is the repository root (`OpenPrep-AI/`).

---

## 🔑 Environment Variables

The backend and frontend each read configuration from their own `.env` files. Copy the provided templates rather than creating files from scratch.

### Backend (`backend/.env`)

```bash
# From the backend/ directory
cp .env.example .env
```

```powershell
# Windows PowerShell (from the backend/ directory)
Copy-Item .env.example .env
```

Open the new `backend/.env` and review the values:

| Variable                  | Required | Default                                                | Description                                                                                      |
| ------------------------- | -------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `PORT`                    | No       | `5000`                                                 | HTTP port the Express server listens on.                                                         |
| `NODE_ENV`                | No       | `development`                                          | `development`, `production`, or `test`. Controls DB schema sync, query logging, and trust proxy. |
| `DATABASE_URL`            | **Yes**  | `postgres://postgres:postgres@localhost:5432/openprep` | PostgreSQL connection string. The database must already exist.                                   |
| `JWT_SECRET`              | **Yes**  | —                                                      | Secret used to sign and verify JWTs. The server exits if this is unset.                          |
| `JWT_EXPIRE`              | No       | `15m`                                                  | Access-token lifetime (e.g. `15m`, `1h`).                                                        |
| `CLIENT_ORIGIN`           | No       | `http://localhost:5173`                                | Comma-separated CORS whitelist of allowed frontend origins.                                      |
| `CLIENT_URL`              | No       | —                                                      | Additional allowed frontend origin(s) for CORS (comma-separated).                                |
| `CORS_ORIGIN`             | No       | —                                                      | Legacy CORS override. Prefer `CLIENT_ORIGIN`.                                                    |
| `FRONTEND_URL`            | No       | `http://localhost:5173`                                | Redirect target after Google OAuth and email verification.                                       |
| `GOOGLE_CLIENT_ID`        | No       | `mock_client_id`                                       | Google OAuth 2.0 client ID (enables "Login with Google").                                        |
| `GOOGLE_CLIENT_SECRET`    | No       | `mock_client_secret`                                   | Google OAuth 2.0 client secret.                                                                  |
| `GEMINI_API_KEY`          | No       | —                                                      | Google Gemini API key. When unset, AI endpoints return pre-configured mock data.                 |
| `REDIS_URL`               | No       | `redis://127.0.0.1:6379`                               | Redis connection string for caching. Gracefully falls back to DB-only when unreachable.          |
| `SMTP_HOST`               | No       | —                                                      | SMTP server hostname for transactional email. Falls back to console in dev.                      |
| `SMTP_PORT`               | No       | `587`                                                  | SMTP server port.                                                                                |
| `SMTP_SECURE`             | No       | `false`                                                | Use implicit TLS (`true` for port 465).                                                          |
| `SMTP_USER`               | No       | —                                                      | SMTP authentication username.                                                                    |
| `SMTP_PASS`               | No       | —                                                      | SMTP authentication password (app password for Gmail).                                           |
| `SMTP_FROM`               | No       | `"OpenPrep AI <noreply@openprep.ai>"`                  | From address used on outgoing email.                                                             |
| `VAPID_PUBLIC_KEY`        | No       | Embedded dev key                                       | Web-push (VAPID) public key for browser notifications.                                           |
| `VAPID_PRIVATE_KEY`       | No       | Embedded dev key                                       | Web-push (VAPID) private key.                                                                    |
| `VAPID_SUBJECT`           | No       | `mailto:admin@openprep-ai.com`                         | Contact subject used in VAPID push payloads.                                                     |
| `CACHE_TTL`               | No       | `3600`                                                 | Cache time-to-live (seconds) for Gemini responses.                                               |
| `CACHE_MAX_KEYS`          | No       | `1000`                                                 | Maximum number of cached entries.                                                                |
| `ENABLE_RATE_LIMIT_TESTS` | No       | —                                                      | Test-only: when `NODE_ENV=test`, enables the auth rate-limit tests.                              |

> [!IMPORTANT]
>
> - `JWT_SECRET` is **required** — the server exits if it is unset. Change it to a long random string.
> - `DATABASE_URL` must point at a database that **already exists** (see [Create the Database](#create-the-database)).
> - `GEMINI_API_KEY` is optional. If omitted, the backend falls back to detailed pre-configured mock data for planning, analysis, and quizzes so you can develop offline.

### Frontend (`frontend/.env`)

The frontend works out of the box with no `.env` file — it defaults to `http://localhost:5000/api`. Copy the template and create one only if your backend runs elsewhere:

```bash
# From the frontend/ directory
cp .env.example .env
```

```powershell
# Windows PowerShell (from the frontend/ directory)
Copy-Item .env.example .env
```

| Variable       | Required | Default                     | Description                                                                         |
| -------------- | -------- | --------------------------- | ----------------------------------------------------------------------------------- |
| `VITE_API_URL` | No       | `http://localhost:5000/api` | Base URL of the Express REST API. The Socket.IO URL is derived by stripping `/api`. |

---

## 🗄️ Create the Database

The backend connects to an existing database but does **not** create it for you. Create the `openprep` database before starting the backend.

**Option A — Local PostgreSQL (psql):**

```bash
psql -U postgres -c "CREATE DATABASE openprep;"
```

```powershell
# PowerShell — use the psql path from your install if not on PATH
psql -U postgres -c "CREATE DATABASE openprep;"
```

**Option B — Docker PostgreSQL (recommended for consistency):**

```bash
docker run --name openprep_postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=openprep -p 5432:5432 -d postgres:15-alpine
```

> [!TIP]
> If the database already exists, `CREATE DATABASE` fails with `already exists` — that is fine, proceed to the next step.

---

## ⚙️ Manual Local Installation

### 1. Setup Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
   ```powershell
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Ensure your local PostgreSQL service is running and the `openprep` database exists (see [Create the Database](#create-the-database)).
4. Seed the database with sample development data (subjects, topics, flashcards, quizzes, study plans, users, etc.):
   ```bash
   npm run seed
   ```
   > To drop existing tables and recreate them cleanly:
   >
   > ```bash
   > npm run seed -- --clean
   > ```
   >
   > On success you will see the demo login credentials printed to the console:
   >
   > ```
   > - Student:     student@openprep.ai     / Password123
   > - Admin:       admin@openprep.ai       / Password123
   > - Contributor: contributor@openprep.ai / Password123
   > ```
5. Start the Node.js development server:
   ```bash
   npm run dev
   ```

The backend server runs at `http://localhost:5000`.

### 2. Setup Frontend

1. Open a new terminal session and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
   ```powershell
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite client dev server:
   ```bash
   npm run dev
   ```

The frontend application boots at `http://localhost:5173`. Open this URL in your web browser.

### 3. (Optional) Run Both From the Root

From the repository root, you can install and run both apps together:

```bash
npm run install:all   # installs root, frontend, and backend deps
npm run dev           # runs backend + frontend concurrently
```

---

## ✅ Verify It's Working

1. **Backend health check** — open `http://localhost:5000/healthz` in your browser, or run:

   ```bash
   curl http://localhost:5000/healthz
   ```

   You should see `OK`.

2. **Swagger UI** — open `http://localhost:5000/api-docs` to browse the interactive REST API documentation.

3. **Frontend** — open `http://localhost:5173` in your browser. Register a new account, or log in with a seeded demo account:

   | Role        | Email                     | Password      |
   | ----------- | ------------------------- | ------------- |
   | Student     | `student@openprep.ai`     | `Password123` |
   | Admin       | `admin@openprep.ai`       | `Password123` |
   | Contributor | `contributor@openprep.ai` | `Password123` |

---

## 🐳 Running with Docker

If you prefer to run the entire stack containerized, use the configured `docker-compose.yml` file. It boots PostgreSQL, Redis, the backend, and the frontend.

### Steps

1. Navigate to the project root directory containing `docker-compose.yml`.
2. Ensure you have created the backend environment configuration in `backend/.env`.
3. Spin up the container services:
   ```bash
   docker-compose up --build
   ```
   ```powershell
   docker-compose up --build
   ```

This downloads the necessary images, boots PostgreSQL and Redis database containers, and builds the frontend and backend service instances.

> [!NOTE]
> Database migrations and seeding are automated on first boot! The database will be pre-populated with a default student user: **`demo@openprep.ai`** (password: **`password123`**) along with sample exams, subjects, notes, and flashcard decks. Live hot-reloading is fully supported via mounted volumes for both frontend and backend development.

### Port Mappings

| Service                     | URL                                                                             |
| --------------------------- | ------------------------------------------------------------------------------- |
| **React Frontend**          | `http://localhost:3000` (container mode) or `http://localhost:5173` (local dev) |
| **Node.js Express Backend** | `http://localhost:5000`                                                         |
| **PostgreSQL**              | `localhost:5432`                                                                |
| **Redis**                   | `localhost:6379`                                                                |

To shut down all running containers:

```bash
docker-compose down
```

### 🪟 Windows Setup via WSL2 (Recommended)

For Windows users, it is highly recommended to run Docker inside **Windows Subsystem for Linux (WSL2)** to avoid file permission issues, line ending conflicts, and performance bottlenecks.

1. **Install WSL2 and Ubuntu**:
   Ensure WSL2 is enabled and install Ubuntu from the Microsoft Store:
   ```bash
   wsl --install
   ```
2. **Enable WSL2 Integration in Docker Desktop**:
   Open Docker Desktop settings, navigate to **General**, check **Use the WSL 2 based engine**, then go to **Resources > WSL Integration** and enable it for your installed distro (e.g., Ubuntu).
3. **Important: Git Line Endings (`CRLF` vs `LF`)**:
   Windows uses `CRLF` for line endings, while Linux uses `LF`. When Docker mounts files from Windows, shell scripts (`.sh`) will fail to run inside containers if they contain `CRLF` line endings.
   
   To prevent this, configure Git to preserve `LF` line endings **before cloning the repository**:
   ```bash
   git config --global core.autocrlf input
   ```
   If you have already cloned the repository, you can re-normalize line endings by running:
   ```bash
   git add --renormalize .
   ```

---


## 🧯 Common Troubleshooting

This section covers common problems that may occur while installing, configuring, or running OpenPrep AI locally.

### Issue: Backend dependency installation fails

If `npm install` fails inside the `backend` directory:

1. Check Node.js and npm:
   ```bash
   node --version
   npm --version
   ```

2. Make sure you are running the command from the `backend` directory:
   ```bash
   cd backend
   ```

### Issue: Frontend dependency installation fails

If `npm install` fails inside the `frontend` directory:

1. Check the required Node.js and npm versions:
   ```bash
   node --version
   npm --version
   ```

### Issue: Missing environment variables

If the backend exits during startup or reports a missing configuration value:

1. Make sure `backend/.env` exists.
2. Create it from the provided template:
   ```powershell
   cd backend
   Copy-Item .env.example .env
   ```

### Issue: `SequelizeConnectionError: connect ECONNREFUSED`

The backend cannot reach PostgreSQL.

1. **Ensure PostgreSQL is running**:
   - **Windows (PowerShell, as Administrator):**
     ```powershell
     Get-Service postgresql*
     Start-Service postgresql-x64-18
     ```
   - **Linux/macOS:**
     ```bash
     sudo systemctl status postgresql
     sudo systemctl start postgresql
     ```

2. **Check the connection string** — verify `DATABASE_URL` in `backend/.env` matches your PostgreSQL user, password, host, and port.

3. **Verify the database exists**:
   ```bash
   psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='openprep'"
   ```

### Issue: `password authentication failed for user "postgres"`

The password in `DATABASE_URL` does not match your local PostgreSQL password.

- Update `DATABASE_URL` in `backend/.env` to use the correct password.
- If you used Docker, the password is `postgres`.

### Issue: `database "openprep" does not exist`

The database was never created. Run the [Create the Database](#create-the-database) step, then re-run `npm run seed`.

### Issue: `port is already allocated` when running `docker-compose up`

Port `5000`, `5173`, `5432`, or `6379` is already in use by a local process.

- Stop any local Express/Vite servers or local PostgreSQL/Redis services on those ports.
- Or remap the ports in `docker-compose.yml` (e.g., `"5001:5000"`).

### Issue: AI features return mock data instead of real outputs

The backend did not find a valid `GEMINI_API_KEY`.

1. Create a key in [Google AI Studio](https://aistudio.google.com/).
2. Add it to `backend/.env`:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```
3. Restart the backend to load the new environment variable.

### Issue: Docker shell script execution failures on Windows (`\r: command not found`)

This occurs because Git on Windows converted Unix line endings (`LF`) to Windows line endings (`CRLF`) during checkout, which breaks script execution inside Linux containers.

**Solution:**
Configure Git to check out line endings as-is:
```bash
git config --global core.autocrlf input
```
Then, force Git to re-normalize the line endings in your working tree:
```bash
git add --renormalize .
git checkout-index --force --all
```

### Issue: Common Volume Mounting Issues in Docker Desktop for Windows

If your changes are not hot-reloading inside the container, or if the container fails with permission errors when creating files/directories:

1. **WSL2 File System access**:
   Always clone your repository inside the WSL2 Linux file system (e.g. `/home/username/OpenPrep-AI/`) instead of the mounted Windows drive (`/mnt/c/Users/...`). Accessing mounted host drives (`/mnt/c`) is much slower and prone to file watcher/reload issues.
2. **File Sharing Permissions**:
   If using the Windows file system, make sure the directory is shared with Docker Desktop:
   - Go to Docker Desktop **Settings > Resources > File sharing**.
   - Add your workspace path (e.g., `C:\Users\username\OneDrive\Desktop\openSource`) to the list of allowed directories.
3. **Restart Docker Service**:
   If container volumes fail to mount after a Windows update or system wake from sleep, restart Docker Desktop or run:
   ```powershell
   Restart-Service *docker*
   ```

---


## 🧪 Running Tests

```bash
# Backend unit tests
cd backend && npm run test:unit

# Backend integration tests
cd backend && npm run test:integration

# Frontend tests
cd frontend && npm test

# Lint
npm run lint
```

> [!NOTE]
> Backend integration tests read `DATABASE_URL_TEST` (defaults to `postgres://postgres:postgres@localhost:5432/openprep_test`) when it is set in the environment. It is only used by tests, so it does not need to appear in `backend/.env`.
