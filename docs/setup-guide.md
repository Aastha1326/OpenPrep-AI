# 🛠️ Setup Guide

This guide walks you through setting up a local development environment for **OpenPrep AI** on Windows (PowerShell), Linux, and macOS.

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

## 🔑 Environment Variables

Both the backend and frontend read configuration from `.env` files. Copy the provided templates rather than creating files from scratch.

### 🔌 Backend Environment Variables (`backend/.env`)

```bash
# From the backend/ directory
cp .env.example .env
```

```powershell
# Windows PowerShell (from the backend/ directory)
Copy-Item .env.example .env
```

Open the new `backend/.env` and review the values:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/openprep
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=15m
```

> [!IMPORTANT]
>
> - `JWT_SECRET` is **required** — the server exits if it is unset. Change it to a long random string.
> - `DATABASE_URL` must point at a database that **already exists** (see [Create the Database](#create-the-database)).
> - `GEMINI_API_KEY` is optional. If omitted, the backend falls back to detailed pre-configured mock data for planning, analysis, and quizzes so you can develop offline.

### 🎨 Frontend Environment Variables (`frontend/.env`)

The frontend works out of the box with no `.env` file — it defaults to `http://localhost:5000/api`. Create one only if your backend runs elsewhere:

```env
VITE_API_URL=http://localhost:5000/api
```

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

This downloads the necessary images, boots an isolated PostgreSQL database container, and builds the frontend and backend service instances.

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

---

## 🧯 Common Troubleshooting

### Issue: `SequelizeConnectionError: connect ECONNREFUSED`

The backend cannot reach PostgreSQL.

1. **Ensure PostgreSQL is running**:
   - **Windows (PowerShell, as Administrator):**
     ```powershell
     Get-Service postgresql*          # find the service name
     Start-Service postgresql-x64-18 # or the name from above
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
   If it returns no rows, create it (see [Create the Database](#create-the-database)).

### Issue: `password authentication failed for user "postgres"`

The password in `DATABASE_URL` does not match your local PostgreSQL password.

- Update `DATABASE_URL` in `backend/.env` to use the correct password, or reset your local password.
- If you used Docker, the password is `postgres` (matching `POSTGRES_PASSWORD`).

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
