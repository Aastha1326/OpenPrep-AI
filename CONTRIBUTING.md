# 🤝 Contributing to OpenPrep AI

Thank you for your interest in contributing to OpenPrep AI! We welcome contributions from developers of all skill levels. Whether you are fixing a bug, adding a new feature, improving documentation, or writing tests, this guide will walk you step-by-step through our contribution workflow.

---

## 📋 Table of Contents

- [1. Development Setup](#1-development-setup)
- [2. Branch Naming Convention](#2-branch-naming-convention)
- [3. Commit Message Format](#3-commit-message-format)
- [4. PR Checklist](#4-pr-checklist)
- [5. Code Review Process](#5-code-review-process)
- [Getting Help](#getting-help)

---

## 1. Development Setup

Follow these step-by-step instructions to get your local development environment up and running.

### Step 1: Prerequisites

Ensure you have the following installed on your local machine:

- **Node.js**: Version 20.x or higher (`node -v`)
- **npm**: Version 10.x or higher (`npm -v`)
- **PostgreSQL**: Version 14.x or higher running locally or accessible via URI
- **Git**: Installed and configured (`git --version`)

### Step 2: Fork and Clone the Repository

1. Click the **Fork** button in the top right corner of the [OpenPrep AI Repository](https://github.com/nishit546/OpenPrep-AI) to create your own copy.
2. Clone your fork to your local machine:
   ```bash
   git clone https://github.com/<YOUR_GITHUB_USERNAME>/OpenPrep-AI.git
   cd OpenPrep-AI
   ```
3. Add the main repository as an `upstream` remote:
   ```bash
   git remote add upstream https://github.com/nishit546/OpenPrep-AI.git
   git fetch upstream
   ```

### Step 3: Environment Configuration

Copy `.env.example` to `.env` in both `/backend` and `/frontend` directories and fill in the required values:

1. **Backend Environment Setup**:

   ```bash
   cp backend/.env.example backend/.env
   ```

   Open `backend/.env` and update the required values (e.g., PostgreSQL credentials `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, etc.).

2. **Frontend Environment Setup**:
   ```bash
   cp frontend/.env.example frontend/.env
   ```
   Open `frontend/.env` and configure your API URL (e.g., `VITE_API_BASE_URL=http://localhost:5000/api`).

### Step 4: Install Dependencies

Run `npm install` in both `/backend` and `/frontend` directories:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

_Tip: You can also run `npm run install:all` from the root directory to install dependencies for all packages at once._

### Step 5: Database Setup & Migrations

Make sure your PostgreSQL server is running and the target database exists, then execute the database migrations:

```bash
cd backend
# Run database migrations
npm run db:migrate:test

# Seed initial data (optional)
npm run seed
cd ..
```

### Step 6: Start Development Servers

Start the backend and frontend dev servers to verify your setup:

- **Run both servers concurrently (from root)**:

  ```bash
  npm run dev
  ```

- **Run individually**:
  - **Backend API Server** (runs on `http://localhost:5000`):
    ```bash
    cd backend
    npm run dev
    ```
  - **Frontend Client** (runs on `http://localhost:5173`):
    ```bash
    cd frontend
    npm run dev
    ```

---

## 2. Branch Naming Convention

To keep our repository organized, please create a new branch from `main` for every task using the following naming structure:

| Branch Pattern                 | Category / Purpose                       | Example                            |
| :----------------------------- | :--------------------------------------- | :--------------------------------- |
| `feat/short-description`       | New features                             | `feat/google-oauth-login`          |
| `fix/issue-number-description` | Bug fixes                                | `fix/104-quiz-score-calculation`   |
| `docs/section-name`            | Documentation changes                    | `docs/contributing-workflow`       |
| `test/scope-description`       | Tests only                               | `test/auth-controller-unit`        |
| `refactor/component-name`      | Code refactoring without behavior change | `refactor/user-service-middleware` |

### Branch Checkout Steps:

```bash
# Keep local main updated
git checkout main
git pull upstream main

# Create and switch to your branch
git checkout -b feat/your-feature-name
```

---

## 3. Commit Message Format

We follow the **Conventional Commits** specification (`type(scope): description`). Commit messages should be imperative, concise, and clearly describe the change.

### Format:

```text
type(scope): description
```

### Types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation updates
- `test`: Adding or updating tests
- `refactor`: Code restructures that don't fix bugs or add features
- `style`: Code style fixes (formatting, missing semicolons, etc.)
- `chore`: Maintenance tasks or dependency updates
- `ci`: Changes to CI configuration or scripts

### Examples:

```bash
git commit -m "feat(auth): add google oauth login strategy"
git commit -m "fix(quiz): resolve scoring error when timer expires"
git commit -m "docs(contributing): update step-by-step setup guide"
git commit -m "test(backend): add vitest coverage for user controller"
```

---

## 4. PR Checklist

Before opening or requesting review on a Pull Request, verify that all items on this checklist are checked:

- [ ] **Tests written and passing**
  - Unit and integration tests cover new functionality or bug fixes.
  - Backend tests pass (`cd backend && npm run test`).
  - Frontend tests pass (`cd frontend && npm run test`).
- [ ] **No `console.log` statements left in production code**
  - Cleaned up debug statements, commented code, and extraneous logs.
- [ ] **ESLint passes with zero errors**
  - Ran `npm run lint` across `/backend` and `/frontend` with zero errors.
- [ ] **Screenshot attached for UI changes**
  - Added screenshots or GIFs to the PR description demonstrating frontend UI modifications.
- [ ] **Up to date with `main`**
  - Merged or rebased against `upstream/main` without merge conflicts.

## Writing Backend Tests

### Which runner owns your file

Three configs split the backend suite by path. Picking the wrong globals means a
file fails to load, which reports as a failed _file_ rather than failed
assertions — easy to scroll past in a long run.

| Path                                | Runner | Config                  | Globals                                   |
| ----------------------------------- | ------ | ----------------------- | ----------------------------------------- |
| `tests/**/*.unit.test.js`           | Vitest | `vitest.config.unit.js` | `vi`, `describe`, `it`/`test`, `expect`   |
| `tests/**/*.test.js` (not `.unit.`) | Vitest | `vitest.config.js`      | same                                      |
| `tests/integration/**/*.test.js`    | Jest   | `jest.config.js`        | `jest`, `describe`, `it`/`test`, `expect` |

Use `vi.*` everywhere except `tests/integration/`. A `jest.*` call outside that
directory throws `ReferenceError: jest is not defined` before a single
assertion runs.

### Module mocking does not intercept `require`

`vi.mock` and `vi.doMock` **do not** replace a module that production code
reaches through CommonJS `require`. The backend is CJS, so a service's internal
`require('../models')` resolves to the real Sequelize models no matter what the
test declared — the suite then hits a live database instead of a double.

This affects `vi.mock` with a factory, bare automocks, and `vi.doMock` with a
dynamic `import` alike. Only a module the **test file itself** imports with
ESM `import` is intercepted.

Until the backend moves to ESM, pass collaborators in rather than mocking them:

```js
// sockets/crdtHandler.js — real dependency by default, overridable in tests
module.exports = (io, deps = {}) => {
  const noteModel = deps.noteModel || Note;
  // ...
};
```

```js
// tests/sockets/crdtHandler.unit.test.js
const Note = { findByPk: vi.fn(), update: vi.fn().mockResolvedValue([1]) };
crdtHandler(fakeIo, { noteModel: Note });
```

If a unit test needs a database to pass, it is an integration test — put it
under `tests/integration/` so it runs against the Postgres service in CI.

---

## 5. Code Review Process

Here is what happens after you submit a Pull Request:

### 🕒 Timeline Expectations

- **Initial Review**: Maintainers review new PRs within **24–48 hours** on business days.
- **Priority Handling**: Critical bug fixes and security patches are reviewed promptly.

### 💬 Responding to Feedback

- **Collaborative Spirit**: Reviews are intended to maintain code quality and share knowledge.
- **Addressing Comments**: Make the requested updates directly on your feature branch and push them:
  ```bash
  git add .
  git commit -m "fix(auth): update token verification logic per review"
  git push origin feat/your-feature-name
  ```
- **Re-requesting Review**: Click the re-review button on GitHub once all review comments are addressed.

### ✅ What Approval Means

- **Maintainer Approval**: At least one core maintainer has reviewed and approved your changes.
- **Green CI Checks**: Automated checks (linting, tests, build checks) pass successfully.
- **Merge**: A maintainer will squash and merge your PR into `main`. Congratulations on your contribution! 🎉

---

## ❓ Getting Help

If you encounter any issues or have questions:

- Open an issue on [GitHub Issues](https://github.com/nishit546/OpenPrep-AI/issues).
- Ask for feedback on your draft Pull Request.

Thank you for contributing to OpenPrep AI! 🚀
