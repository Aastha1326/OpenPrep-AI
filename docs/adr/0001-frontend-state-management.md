**# 📑 ADR 0001: Frontend State Management Strategy**



**\*\*Status:\*\* Accepted**



**\*\*Date:\*\* 2026-08-08**



**---**



**## 🎯 Context**



**OpenPrep AI is a React-based single-page application that manages application-wide business state, user interface preferences, and component-specific interactions. As the application grew, relying on a single state management approach would either introduce excessive prop drilling or make lightweight UI settings unnecessarily complex.**



**The project already includes Redux Toolkit for shared application state and React Context for theme-related preferences. Local component state is retained for isolated UI interactions.**



**---**



**## ✅ Decision**



**The frontend adopts a hybrid state management strategy consisting of three layers.**



**### 1. Redux Toolkit**



**Redux Toolkit manages global business state shared across multiple pages.**



**Examples include:**



**- Authentication**

**- Dashboard state**

**- API loading status**

**- User session information**



**Global reducers are organized into feature slices under:**



**```text**

**frontend/src/store/slices/**

**```**



**and registered in:**



**```text**

**frontend/src/store/index.js**

**```**



**### 2. React Context**



**React Context manages lightweight global UI configuration.**



**Current responsibilities include:**



**- Theme selection**

**- System theme detection**

**- High-contrast accessibility mode**



**This functionality is implemented in:**



**```text**

**frontend/src/context/ThemeContext.jsx**

**```**



**### 3. Local Component State**



**Component-specific interactions continue to use React hooks such as:**



**- useState**

**- useReducer**



**Typical examples include:**



**- Forms**

**- Modal visibility**

**- Selected tabs**

**- Temporary UI interactions**



**---**



**## 📈 Consequences**



**### Benefits**



**- Clear separation between business state and UI preferences.**

**- Reduced prop drilling across the application.**

**- Centralized authentication and dashboard management.**

**- Lightweight theme handling without unnecessary Redux complexity.**

**- Scalable architecture for future features.**



**### Trade-offs**



**- Contributors must understand when Redux, Context, or local component state should be used.**

**- Two global state mechanisms require consistent project conventions.**



**---**



**## 📚 Related Documentation**



**- `docs/frontend-architecture.md`**

**- `frontend/src/store/index.js`**

**- `frontend/src/context/ThemeContext.jsx`**

