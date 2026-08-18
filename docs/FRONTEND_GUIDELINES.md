# 🎨 Frontend Component Contributing Guidelines

This document provides clear coding standards, component architecture principles, Tailwind CSS class ordering conventions, and linting guidelines for contributing React components to **OpenPrep AI**.

---

## 📋 Core Architectural Principles

1. **Functional Components & React Hooks Only**:
   - All React components **must** be written as functional components using standard React Hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`).
   - **Do not** use legacy React Class components.
2. **Declarative Layouts with Tailwind CSS**:
   - Prefer utility-first styling with Tailwind CSS over custom inline styles or ad-hoc CSS modules.
3. **Strict Prop Validation**:
   - Define expected component props clearly with `PropTypes` or default parameter values.

---

## ⚙️ Component Architecture & Naming Conventions

### File & Component Naming
- File names **must** use `PascalCase` matching the primary export (e.g., `GlassCard.jsx`, `BadgeGrid.jsx`, `LazyImage.jsx`).
- Component function declarations must use `PascalCase`:
  ```jsx
  // Preferred
  const MetricCard = ({ title, value }) => { ... };
  export default MetricCard;
  ```

### Hook Usage Guidelines
- Declare state and hooks at the top of the component body before conditional returns or JSX logic.
- Wrap non-trivial callback handlers passed to children in `useCallback`.
- Wrap heavy computations (such as array transformations) in `useMemo`.

---

## 🎨 Tailwind CSS Class Ordering Guidelines

To keep class attributes scannable and readable, follow this 5-tier ordering convention:

1. **Layout & Display**: `flex`, `grid`, `inline-block`, `relative`, `absolute`, `z-10`, `items-center`, `justify-between`
2. **Sizing & Spacing**: `w-full`, `h-64`, `max-w-md`, `p-4`, `px-6`, `my-2`, `gap-4`
3. **Typography**: `font-playfair`, `font-bold`, `text-lg`, `text-stone-800`, `leading-relaxed`, `text-center`
4. **Visuals & Backgrounds**: `bg-white`, `bg-gradient-to-r`, `border`, `border-stone-200`, `rounded-xl`, `shadow-md`
5. **Interactive & Responsive Modifiers**: `hover:bg-stone-100`, `focus:ring-2`, `dark:bg-slate-800`, `dark:text-slate-100`, `md:flex-row`, `transition-all`

```jsx
// ✅ Correct (Ordered logically)
<div className="flex items-center justify-between w-full p-4 text-base font-bold bg-white border border-stone-200 rounded-xl hover:bg-stone-50 dark:bg-slate-800 dark:border-slate-700 transition-all">
  ...
</div>
```

---

## 🛠️ ESLint & Prettier Pre-PR Workflow

Before opening a Pull Request:

1. **Lint Check**: Run ESLint to detect syntax or code style issues:
   ```bash
   cd frontend
   npm run lint
   ```
2. **Code Formatting**: Format code using Prettier:
   ```bash
   npx prettier --write "src/**/*.{js,jsx,css,json}"
   ```
3. **Unit Test Verification**: Verify all component unit tests pass:
   ```bash
   npm test
   ```

---

## 🌟 Reference Implementation: A "Perfect" Component

Below is an annotated reference implementation demonstrating all guidelines:

```jsx
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Award, ArrowRight } from 'lucide-react';
import LazyImage from '../common/LazyImage';

/**
 * StudyMetricCard Component
 * Displays a student metric badge with interactive state management.
 */
const StudyMetricCard = ({ title, count, badgeUrl, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    if (onSelect) {
      onSelect(title);
    }
  }, [onSelect, title]);

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center justify-between w-full p-5 bg-white border border-stone-200 rounded-2xl shadow-sm hover:shadow-md hover:border-amber-500/50 dark:bg-slate-800 dark:border-slate-700 cursor-pointer transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        {badgeUrl ? (
          <LazyImage
            src={badgeUrl}
            alt={`${title} badge`}
            loading="lazy"
            className="w-12 h-12 rounded-xl object-cover bg-amber-500/10 p-1"
            fallbackSrc="/default-badge.png"
          />
        ) : (
          <div className="flex items-center justify-center w-12 h-12 bg-amber-500/10 rounded-xl text-amber-700 dark:text-amber-400">
            <Award className="w-6 h-6" />
          </div>
        )}

        <div>
          <h4 className="font-playfair font-bold text-base text-stone-800 dark:text-stone-100">
            {title}
          </h4>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {count} {count === 1 ? 'completed item' : 'completed items'}
          </p>
        </div>
      </div>

      <ArrowRight
        className={`w-5 h-5 text-stone-400 transition-transform duration-200 ${
          isHovered ? 'translate-x-1 text-amber-600' : ''
        }`}
      />
    </div>
  );
};

StudyMetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  badgeUrl: PropTypes.string,
  onSelect: PropTypes.func,
};

StudyMetricCard.defaultProps = {
  badgeUrl: null,
  onSelect: null,
};

export default StudyMetricCard;
```
