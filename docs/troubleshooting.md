# 🔍 Troubleshooting Guide

This document outlines solutions for common setup, build, and deployment issues encountered in **OpenPrep AI**.

---

## 🗄️ Database Connection Issues

### Issue: `SequelizeConnectionError: connect ECONNREFUSED`
This occurs when the Node.js backend cannot connect to the PostgreSQL instance.

#### Solutions
1. **Ensure PostgreSQL is Running**:
   * **Windows**: Open PowerShell as Administrator and run:
     ```powershell
     net start postgresql-x64-18
     # Or check the service name from: Get-Service postgresql*
     ```
   * **Linux/macOS**: Run:
     ```bash
     sudo systemctl status postgresql
     # If stopped:
     sudo systemctl start postgresql
     ```
2. **Check the Connection String**:
   * Verify the `DATABASE_URL` value in `backend/.env`. The default format is:
     `postgres://postgres:postgres@localhost:5432/openprep`
   * If connecting to a cloud provider (Neon, Render), ensure your IP is not blocked and SSL is enabled (`?sslmode=require`).
3. **Verify Database Exists**:
   * Connect to PostgreSQL and check that the `openprep` database exists:
     ```bash
     psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='openprep'"
     ```
   * If it does not exist, create it:
     ```bash
     psql -U postgres -c "CREATE DATABASE openprep"
     ```

---

## 🌐 CORS Blocks

### Issue: `Access to XMLHttpRequest at ... from origin ... has been blocked by CORS policy`
Occurs when the React frontend attempts to query the Express backend, but the backend is not configured to accept requests from the frontend's origin.

#### Solutions
1. Check `backend/server.js` to ensure the CORS middleware is configured correctly:
   ```javascript
   const cors = require('cors');
   app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
   ```
2. Ensure the frontend's `.env` contains the correct API endpoint in `VITE_API_URL`.

---

## 🐳 Docker Deployment Failures

### Issue: `port is already allocated` when running `docker-compose up`
This occurs when port `5000` (backend), `5173` (frontend), or `5432` (PostgreSQL) is already in use by a local process on your machine.

#### Solutions
1. Stop any local Express servers, Vite development servers, or local PostgreSQL services running on those ports.
2. Alternatively, modify the port mappings in `docker-compose.yml` to use free ports (e.g., mapping backend to `5001:5000`).

---

## 🧠 Gemini AI API Key Errors

### Issue: AI features return mock data instead of real outputs
If the backend does not find a valid `GEMINI_API_KEY`, it falls back to mock responses.

#### Solutions
1. Create a `GEMINI_API_KEY` in the [Google AI Studio](https://aistudio.google.com/).
2. Verify that the key is defined correctly in `backend/.env`:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```
3. Restart the backend service to load the new environment variables.
