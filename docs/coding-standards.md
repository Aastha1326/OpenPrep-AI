# 📝 Coding Standards

This document establishes the coding conventions, patterns, and quality guidelines enforced across the **OpenPrep AI** workspace.

---

## 🎨 React (Frontend) Standards

We write modern, functional React using hooks and declarative layout patterns.

### 1. Component Structure

- **File Naming**: Use PascalCase for React component files (e.g., `GlassCard.jsx`, `ProtectedRoute.jsx`).
- **JSX Layout**: Keep styling clean using Tailwind classes. Group elements with logical comments.
- **Component Export**: Prefer named exports or clear, single default exports at the bottom of the file.

```jsx
import React from 'react';
import PropTypes from 'prop-types';

export const StudyCard = ({ title, count }) => {
  return (
    <div className="rounded-xl bg-white/10 p-4 border border-white/5">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-gray-400">{count} items</p>
    </div>
  );
};

StudyCard.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
};

export default StudyCard;
```

### 2. State & Hooks

- Use hooks like `useState` and `useDeferredValue` for local UI state changes.
- Use `useSelector` and `useDispatch` to interact with global Redux slices.
- Place custom hooks in `frontend/src/hooks/` if logic needs to be shared across components.

---

## ⚙️ Node.js & Express (Backend) Standards

We write asynchronous, middleware-driven Express services in ES6 Node.js.

### 1. Controllers and Error Handling

- Avoid `try-catch` blocks inside controllers. Wrap controllers with an async handler middleware or return promises that pass errors to the global error middleware:
  ```javascript
  // backend/controllers/authController.js
  exports.register = async (req, res, next) => {
    try {
      // Logic here
    } catch (err) {
      next(err); // delegates to Express global handler
    }
  };
  ```
- Always respond using uniform JSON payloads (e.g., `{ success: true, data: { ... } }` or `{ success: false, error: "message" }`).
- Use appropriate HTTP status codes:
  - `200 OK` for successful fetches and updates.
  - `201 Created` for resource additions.
  - `400 Bad Request` for client input validation failures.
  - `401 Unauthorized` for expired or missing JWTs.
  - `403 Forbidden` for permissions blocks.
  - `404 Not Found` for missing database documents.
  - `500 Internal Server Error` for unhandled runtime failures.

---

## 🏷️ General Naming & Folder Conventions

| Element                          | Format             | Example                               |
| -------------------------------- | ------------------ | ------------------------------------- |
| JavaScript Variables / Functions | `camelCase`        | `getUserProfile`, `studyHours`        |
| React Components                 | `PascalCase`       | `GlassCard.jsx`, `ThemeContext.jsx`   |
| Database Models / Schemas        | `PascalCase`       | `User.js`, `ActivityLog.js`           |
| Database Fields                  | `camelCase`        | `completionPercentage`, `createdAt`   |
| API Route Enpoints               | `kebab-case`       | `/api/study-plans`, `/api/flashcards` |
| Environment Variables            | `UPPER_SNAKE_CASE` | `DATABASE_URL`, `JWT_SECRET`          |

---

## 🔎 Linting and Formatting

We use **Prettier** for code formatting and **ESLint** for code quality checks:

1. Ensure your IDE auto-formats code on save using our standard [`.prettierrc`](../.prettierrc) settings.
2. Before opening a Pull Request, run the lint validation commands:
   ```bash
   # In frontend or backend directory
   npm run lint
   ```
