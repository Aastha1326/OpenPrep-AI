# 🎨 Frontend Architecture

The **OpenPrep AI** frontend is a high-performance, single-page application (SPA) designed with a modern user experience, responsive utilities, and smooth micro-animations.

---

## ⚡ Core Framework & Tools

- **Core**: [React 18+](https://react.dev/) using JSX and Functional Components.
- **Build System**: [Vite](https://vite.dev/) for extremely fast Hot Module Replacement (HMR) and optimized assets bundling.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first styling combined with custom glassmorphic aesthetics.
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) for managing complex asynchronous state (auth, session details) and React Context for UI theme settings.
- **Routing**: [React Router DOM v6](https://reactrouter.com/) for declarative client-side route navigation.

---

## 🏛️ Component Structure & Layout

We organize code logically in the `frontend/src` directory:

```bash
src/
├── assets/         # Global images, graphics, and static design resources
├── components/     # Reusable layout and interactive widgets
│   ├── GlassCard.jsx      # Premium transparent backdrop layout wrapper
│   └── ProtectedRoute.jsx # Wrapper component to shield routes from guest users
├── context/        # Theme state, settings, or shared layout modifiers
│   └── ThemeContext.jsx   # Light/Dark toggle utilizing document classes
├── services/       # Network layers, API handlers, interceptors
│   └── api.js             # Axios client containing interceptors for token attachment
└── store/          # Redux Toolkit global store root
    ├── index.js           # Combines slices and configures Redux store
    └── slices/            # Discrete sub-states matching resource scopes
        └── authSlice.js   # Handles registration, login, and token loaders
```

---

## 💾 State Management Strategy

We divide state into three categories to prevent prop-drilling while maintaining performance:

### 1. Global Redux State

Used for state variables shared across the entire application workspace (e.g., current authenticated student data, global loading bars, error prompts).

- Slices are contained in `store/slices/`.
- Async operations (Thunks) are used for network interactions (e.g., `loginUser`, `registerUser`, `loadUser`).

### 2. Local Component State (`useState` / `useReducer`)

Used for state isolated to a single component or page (e.g., user input forms, active modal switches, tab indices).

### 3. Context API State

Used for low-frequency global settings that do not change frequently (e.g., Dark Mode vs Light Mode via [ThemeContext.jsx](../frontend/src/context/ThemeContext.jsx)).

---

## 🚦 Routing & Security Strategy

Client-side routes are managed via `react-router-dom` in `App.jsx`.

### Protected Routes

Certain pages (e.g., the Study Dashboard, PYQ Analyzer, and AI Quiz Generator) require the user to be logged in. These paths are wrapped using the `ProtectedRoute` component:

```jsx
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>;
```

When a user tries to access a protected route without a JWT:

1. `ProtectedRoute.jsx` checks the Redux `auth` state (`isAuthenticated`).
2. If `loading` is true, a spinner is displayed.
3. If `isAuthenticated` is false, it redirects the browser to `/login`.
4. If `isAuthenticated` is true, it renders the requested children components.
