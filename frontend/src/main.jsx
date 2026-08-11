import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import { ThemeProvider } from './context/ThemeContext'
import { SyncProvider } from './context/SyncContext'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import './i18n';
import App from './App.jsx'

// Catch Vite chunk load errors when a new deployment updates JS assets
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason &&
    (event.reason.message?.includes('Failed to fetch dynamically imported module') ||
      event.reason.message?.includes('Importing a module script failed'))
  ) {
    const lastReload = sessionStorage.getItem('chunk_reload');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem('chunk_reload', now.toString());
      window.location.reload();
    }
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <SyncProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </SyncProvider>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
)
