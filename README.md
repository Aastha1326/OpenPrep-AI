# 🚀 OpenPrep AI

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-yellow)](./CONTRIBUTING.md)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](./CODE_OF_CONDUCT.md)
[![Hacktoberfest](https://img.shields.io/badge/Hacktoberfest-2026-orange.svg)](https://hacktoberfest.com/)

**OpenPrep AI** is an advanced AI-powered exam preparation platform designed to help students optimize their study habits, analyze previous exam papers, identify knowledge gaps, and study smarter.

[Explore Architecture](./docs/architecture.md) • [Getting Started](./docs/setup-guide.md) • [Contribution Guidelines](./CONTRIBUTING.md) • [API Documentation](./docs/api-reference.md) • [Socket.IO Events](./docs/socket-events.md)
</div>

---

## 🎯 Problem Statement

Most students waste critical preparation hours trying to figure out:

- What chapters hold the highest exam weightage?
- Which questions are repeatedly asked?
- How to schedule daily study topics effectively?
- Where their weak points lie?

**OpenPrep AI** resolves these frustrations by utilizing advanced LLMs (Gemini API) and data-driven learning strategies (spaced repetition, adaptive planning) to structure their preparation path automatically.

---

## ✨ Features

- **📄 PDF & Notes Analysis**: Extract core themes, chapter summaries, and revision points from academic uploads.
- **📊 PYQ Intelligence**: Parse Previous Year Question Papers (PYQs) to map chapter weightage, extract repeated questions, and detect trends.
- **🧠 AI Quiz Generator**: Dynamically generate MCQ assessments based on custom uploaded notes or specific syllabus topics.
- **📅 Smart Study Planner**: Input your exam date, syllabus scope, and study hours to generate a customized, calendarized study schedule.
- **🎯 Weakness Detection**: Tracks performance across quiz attempts to dynamically highlight weak subjects and adapt study goals.
- **📚 Spaced Repetition Flashcards**: Memorize complex concepts using flashcards backed by the SuperMemo SM-2 adaptation algorithm.

---

## 🛠️ Tech Stack

| Component          | Technologies Used                                      |
| ------------------ | ------------------------------------------------------ |
| **Frontend**       | React, Vite, Tailwind CSS, Redux Toolkit, React Router |
| **Backend**        | Node.js, Express.js, JWT Authentication                |
| **Database**       | PostgreSQL, Sequelize ORM                              |
| **AI Integration** | Gemini API (`gemini-1.5-flash`)                        |
| **DevOps & CI**    | Docker, Docker Compose, GitHub Actions                 |

---

## 📂 Project Structure

```bash
OpenPrep-AI/
├── .github/             # GitHub actions, templates & labelers
├── backend/             # Node.js + Express backend
│   ├── config/          # Database configuration
│   ├── controllers/     # MVC controller logic
│   ├── middleware/      # Auth, upload, and validation middleware
│   ├── models/          # Sequelize database schemas
│   ├── routes/          # Express API route declarations
│   └── services/        # Gemini API integration service
├── docs/                # Comprehensive system documentation
└── frontend/            # React + Vite + Tailwind CSS frontend
    ├── public/          # Static files and assets
    └── src/
        ├── components/  # Reusable UI components
        ├── context/     # Global contexts (Theme, etc.)
        ├── services/    # Axios API client integrations
        └── store/       # Redux Toolkit global state store
```

---

## 🚦 Getting Started

For a step-by-step setup guide with environment variable details, review the [Setup Guide](./docs/setup-guide.md).

### Quick Launch with Docker

If you have Docker installed, you can spin up the frontend, backend, and PostgreSQL instances with a single command:

```bash
docker-compose up --build
```

The React frontend will be available at `http://localhost:5173` and the Express API at `http://localhost:5000`.

### Manual Local Launch

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/OpenPrep-AI.git
   cd OpenPrep-AI
   ```
2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   # Copy the environment template to create your own configuration
   cp .env.example .env  # Or "copy .env.example .env" on Windows CMD
   # Open the new .env file and set your own DB_URI, JWT_SECRET, etc.
   npm run dev
   ```
3. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 🛠️ Troubleshooting

If you encounter problems while setting up or running OpenPrep AI locally, check the common issues and solutions below.

### 1. Dependencies fail to install

**Possible causes:**

* Unsupported or outdated Node.js version.
* Network problems while downloading packages.
* Corrupted npm cache.

**Solutions:**

Check your Node.js and npm versions:

```bash
node --version
npm --version
```

If npm reports cache-related errors, clear the npm cache and retry:

```bash
npm cache clean --force
npm install
```

Run the installation commands separately inside both the `backend` and `frontend` directories.

---

### 2. Missing `.env` configuration

If the backend fails to start because required environment variables are missing, make sure you have created a `.env` file from the provided example.

From the `backend` directory:

```bash
cp .env.example .env
```

On Windows CMD:

```cmd
copy .env.example .env
```

Open the `.env` file and configure the required values, such as:

```env
DB_URI=your_postgresql_connection_string
JWT_SECRET=your_secret_key
```

Make sure all required environment variables are configured before starting the backend.

**Important:** Never commit your `.env` file or expose secret values publicly.

---

### 3. Backend cannot connect to PostgreSQL

If the backend reports a PostgreSQL connection error:

* Make sure PostgreSQL is installed and running.
* Verify the database name, username, password, host, and port in `.env`.
* Check that the `DB_URI` points to the correct PostgreSQL instance.
* If using Docker, make sure the PostgreSQL container is running.

Check the Docker container status with:

```bash
docker-compose ps
```

If the database service is not running, restart the Docker services:

```bash
docker-compose up --build
```

---

### 4. Frontend or backend is running on the wrong port

OpenPrep AI normally uses:

* Frontend: `http://localhost:5173`
* Backend API: `http://localhost:5000`

If either port is already being used by another application, stop the conflicting process or configure the application to use another available port.

After changing the port configuration, restart the affected development server.

---

### 5. Docker containers fail to start

If Docker containers fail to start, first make sure Docker is running.

Check the Docker and Docker Compose versions:

```bash
docker --version
docker-compose --version
```

Check the status of the containers:

```bash
docker-compose ps
```

View the container logs to identify the cause of the failure:

```bash
docker-compose logs
```

If existing containers are causing conflicts, stop them and start the services again:

```bash
docker-compose down
docker-compose up --build
```

---

### 6. Backend API is not reachable from the frontend

If the frontend loads but API requests fail:

* Make sure the backend server is running.
* Verify that the backend is available at `http://localhost:5000`.
* Check that the frontend API configuration points to the correct backend URL.
* Open the browser Developer Tools and check the **Console** and **Network** tabs for failed API requests.

If the API URL is incorrect, update the frontend API configuration to use the correct backend address and restart the frontend development server.

---

### Still having problems?

If none of the solutions above resolve the issue, open a GitHub issue with:

1. The error message.
2. The command that produced the error.
3. Your Node.js version.
4. Your operating system.
5. Relevant Docker or backend logs.
6. Steps to reproduce the problem.

Providing this information will help maintainers and contributors investigate the problem more efficiently.

---

## 🗺️ Roadmap

- **v1.0**: Core authentication, AI study planners, quiz generators, and analytics dashboards.
- **v1.5**: Spaced repetition engine, PYQ PDF parser, and attempt history trends.
- **v2.0**: Weakness-adapted scheduling, community note pools, and OCR processing.
- **v3.0**: Live study battles, AI chat mentors, and React Native mobile client.

For the comprehensive technical roadmap, review [docs/project-roadmap.md](./docs/project-roadmap.md).

---

## 🤝 Contributing

We welcome contributions of all levels! Please check the [Contributing Guide](./CONTRIBUTING.md) to understand how to fork the project, set up formatting rules, and make your first Pull Request.

Please also adhere to the community standards in our [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## 📜 License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for more details.

---

## ❤️ Support

If you love this project, show your support:

- ⭐ **Star** our repository on GitHub.
- 🍴 **Fork** it to start contributing.
- 📢 **Share** it with your classmates and peers!

_Built with ❤️ for students worldwide._
